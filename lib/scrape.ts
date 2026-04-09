/**
 * Extracts a clean job description from raw scraped page text using Claude.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a job description extractor. Given raw text scraped from a web page, extract ONLY the job description content.

Return the following in clean, readable plain text:
- Job title
- Company name (if present)
- Location / remote status (if present)
- Role summary / about the role
- Responsibilities
- Requirements / qualifications
- Nice-to-haves (if present)
- Compensation / benefits (if present)

Rules:
- Do NOT include navigation menus, footers, cookie banners, "similar jobs", or unrelated page content
- Do NOT add any commentary or formatting beyond what's in the original text
- Preserve the original wording — do not rephrase or summarize
- Use simple line breaks and dashes for structure
- If the page does not appear to contain a job description, respond with exactly: NO_JD_FOUND`;

export async function extractJobDescription(pageText: string): Promise<string> {
  const truncated = pageText.slice(0, 30_000);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: truncated,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (text.trim() === 'NO_JD_FOUND') {
    throw new Error('That page doesn\'t appear to contain a job description. Try a direct link to the job posting, or paste the text manually.');
  }

  return text.trim();
}
