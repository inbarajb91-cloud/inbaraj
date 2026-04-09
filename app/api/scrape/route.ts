import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/apify';
import { extractJobData } from '@/lib/scrape';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    if (!/^https?:\/\/.+/.test(url)) {
      return NextResponse.json(
        { error: 'Please provide a valid URL starting with http:// or https://' },
        { status: 400 }
      );
    }

    // Scrape the URL — LinkedIn uses a dedicated actor (structured data),
    // other sites use a generic crawler (raw text needing Claude extraction)
    let result;
    try {
      result = await scrapeUrl(url);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch the page' },
        { status: 502 }
      );
    }

    // LinkedIn: structured data returned directly, no Claude extraction needed
    if (result.type === 'structured') {
      return NextResponse.json({
        companyName: result.data.companyName,
        roleTitle: result.data.roleTitle,
        jobDescription: result.data.jobDescription,
        sourceUrl: url,
      });
    }

    // Other sites: extract structured job data from raw page text via Claude
    const jobData = await extractJobData(result.text);

    return NextResponse.json({
      companyName: jobData.companyName,
      roleTitle: jobData.roleTitle,
      jobDescription: jobData.jobDescription,
      sourceUrl: url,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract job posting data' },
      { status: 500 }
    );
  }
}
