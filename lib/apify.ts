/**
 * Apify Web Scraper client.
 * Uses the Website Content Crawler actor to scrape JS-rendered pages
 * (LinkedIn, Greenhouse, Lever, Workday, etc.).
 */

const ACTOR_ID = 'apify~website-content-crawler';
const APIFY_BASE = 'https://api.apify.com/v2';

interface ApifyDatasetItem {
  url: string;
  text: string;
  [key: string]: unknown;
}

/**
 * Normalize LinkedIn URLs to their public job view format.
 * - /jobs/search-results/?currentJobId=123 → /jobs/view/123/
 * - /jobs/search/?currentJobId=123 → /jobs/view/123/
 * - /jobs/collections/...?currentJobId=123 → /jobs/view/123/
 * - /jobs/view/123 stays as-is
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('linkedin.com')) return url;

    // Extract job ID from currentJobId query param
    const jobId = parsed.searchParams.get('currentJobId');
    if (jobId && /^\d+$/.test(jobId)) {
      return `https://www.linkedin.com/jobs/view/${jobId}/`;
    }

    // Already a /jobs/view/ URL — ensure trailing slash
    if (/\/jobs\/view\/\d+/.test(parsed.pathname)) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

export async function scrapeUrl(rawUrl: string): Promise<string> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error('APIFY_API_KEY is not configured');
  }

  const url = normalizeLinkedInUrl(rawUrl);

  const endpoint = `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`;

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
