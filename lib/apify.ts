/**
 * Apify Web Scraper client.
 * - LinkedIn URLs: uses apimaestro/linkedin-job-detail (structured data, no scraping)
 * - Other URLs: uses apify~website-content-crawler with playwright
 */

import type { ScrapedJobData } from './scrape';

const GENERIC_ACTOR_ID = 'apify~website-content-crawler';
const LINKEDIN_ACTOR_ID = 'apimaestro~linkedin-job-detail';
const APIFY_BASE = 'https://api.apify.com/v2';

interface ApifyDatasetItem {
  url: string;
  text: string;
  [key: string]: unknown;
}

interface LinkedInJobResult {
  job_info: {
    title: string;
    description: string;
    location: string;
    employment_status: string;
    is_remote_allowed: boolean;
    industries: string[];
    experience_level: string;
  };
  company_info: {
    name: string;
    description: string;
  };
}

/**
 * Extract LinkedIn job ID from any LinkedIn job URL.
 * Returns null if the URL isn't a LinkedIn job page.
 */
function extractLinkedInJobId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('linkedin.com')) return null;

    // /jobs/view/123456789/
    const viewMatch = parsed.pathname.match(/\/jobs\/view\/(\d+)/);
    if (viewMatch) return viewMatch[1];

    // /jobs/search-results/?currentJobId=123456789
    // /jobs/search/?currentJobId=123456789
    // /jobs/collections/...?currentJobId=123456789
    const jobId = parsed.searchParams.get('currentJobId');
    if (jobId && /^\d+$/.test(jobId)) return jobId;

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch LinkedIn job details using the dedicated LinkedIn actor.
 * Returns structured data directly — no Claude extraction needed.
 */
async function fetchLinkedInJob(jobId: string, apiKey: string): Promise<ScrapedJobData> {
  const endpoint = `${APIFY_BASE}/acts/${LINKEDIN_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: [jobId],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 402) {
      throw new Error('Apify usage limit reached. Try again later or enter details manually.');
    }
    throw new Error(`LinkedIn job fetch failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const items: LinkedInJobResult[] = await res.json();

  if (!items.length || !items[0].job_info) {
    throw new Error('Could not find that LinkedIn job posting. It may have been removed or the link may be incorrect.');
  }

  const { job_info, company_info } = items[0];

  if (!job_info.description) {
    throw new Error('The LinkedIn job posting was found but has no description. Try entering details manually.');
  }

  // Build a rich job description from the structured data
  let jd = job_info.description;

  // Append metadata that's useful for resume tailoring
  const meta: string[] = [];
  if (job_info.location) meta.push(`Location: ${job_info.location}`);
  if (job_info.employment_status) meta.push(`Type: ${job_info.employment_status}`);
  if (job_info.is_remote_allowed) meta.push('Remote: Yes');
  if (job_info.experience_level) meta.push(`Experience Level: ${job_info.experience_level}`);
  if (job_info.industries?.length) meta.push(`Industry: ${job_info.industries.join(', ')}`);

  if (meta.length) {
    jd = meta.join('\n') + '\n\n' + jd;
  }

  return {
    companyName: company_info?.name || '',
    roleTitle: job_info.title || '',
    jobDescription: jd,
  };
}

/**
 * Scrape a generic (non-LinkedIn) URL using Apify's Website Content Crawler.
 * Returns raw page text for Claude to extract job data from.
 */
async function fetchGenericPage(url: string, apiKey: string): Promise<string> {
  const endpoint = `${APIFY_BASE}/acts/${GENERIC_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url }],
      maxCrawlPages: 1,
      crawlerType: 'playwright',
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 402) {
      throw new Error('Apify usage limit reached. Try again later or enter details manually.');
    }
    throw new Error(`Apify returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const items: ApifyDatasetItem[] = await res.json();

  if (!items.length || !items[0].text) {
    throw new Error('The page was scraped but no text content was found. Try a direct link to the job posting, or enter details manually.');
  }

  return items[0].text;
}

/**
 * Scrape a URL for job data.
 *
 * LinkedIn URLs → dedicated LinkedIn actor (returns structured data)
 * Other URLs → generic crawler (returns raw text for Claude extraction)
 *
 * Returns either:
 * - { type: 'structured', data: ScrapedJobData } for LinkedIn
 * - { type: 'raw', text: string } for other sites
 */
export type ScrapeResult =
  | { type: 'structured'; data: ScrapedJobData }
  | { type: 'raw'; text: string };

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error('APIFY_API_KEY is not configured');
  }

  // LinkedIn: use dedicated actor for structured data
  const linkedInJobId = extractLinkedInJobId(url);
  if (linkedInJobId) {
    const data = await fetchLinkedInJob(linkedInJobId, apiKey);
    return { type: 'structured', data };
  }

  // Other sites: generic crawler + Claude extraction
  const text = await fetchGenericPage(url, apiKey);
  return { type: 'raw', text };
}
