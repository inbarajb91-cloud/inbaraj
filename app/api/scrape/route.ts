import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/apify';
import { extractJobData } from '@/lib/scrape';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const MAX_URL_CHARS = 2_000;
const BLOCKED_HOSTS = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[::1\]|\[fc|\[fe80:)/i;

function validateUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  if (input.length > MAX_URL_CHARS) return { ok: false, error: 'URL too long' };
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, error: 'Please provide a valid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http(s) URLs are supported' };
  }
  if (BLOCKED_HOSTS.test(parsed.hostname)) {
    return { ok: false, error: 'Internal or private hosts are not allowed' };
  }
  return { ok: true, url: parsed.toString() };
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { name: 'scrape', limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { url } = body;

    if (typeof url !== 'string' || url.length === 0) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const check = validateUrl(url);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    let result;
    try {
      result = await scrapeUrl(check.url);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch the page' },
        { status: 502 }
      );
    }

    if (result.type === 'structured') {
      return NextResponse.json({
        companyName: result.data.companyName,
        roleTitle: result.data.roleTitle,
        jobDescription: result.data.jobDescription,
        sourceUrl: check.url,
      });
    }

    const jobData = await extractJobData(result.text);

    return NextResponse.json({
      companyName: jobData.companyName,
      roleTitle: jobData.roleTitle,
      jobDescription: jobData.jobDescription,
      sourceUrl: check.url,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract job posting data' },
      { status: 500 }
    );
  }
}
