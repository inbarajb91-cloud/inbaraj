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

export async function scrapeUrl(url: string): Promise<string> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error('APIFY_API_KEY is not configured');
  }

  const endpoint = `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url }],
      maxCrawlPages: 1,
      crawlerType: 'cheerio',
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 402) {
      throw new Error('Apify usage limit reached. Try again later or paste the job description manually.');
    }
    throw new Error(`Apify returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const items: ApifyDatasetItem[] = await res.json();

  if (!items.length || !items[0].text) {
    throw new Error('The page was scraped but no text content was found. Try pasting the job description manually.');
  }

  return items[0].text;
}
