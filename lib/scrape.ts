/**
 * Extracts structured job posting data from raw scraped page text using Claude.
 * Returns company name, role title, and clean job description.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export interface ScrapedJobData {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
}

const SYSTEM_PROMPT = `You are a job posting extractor. Given raw text scraped from a web page, extract the job posting details.

Return a JSON object with exactly these fields:
{
  "companyName": "The hiring company name",
  "roleTitle": "The job title / role name",
  "jobDescription": "The full job description text"
}

For jobDescription, include:
- Role summary / about the role
- Responsibilities
- Requirements / qualifications
- Nice-to-haves (if present)
- Compensation / benefits (if present)
- Location / remote status (if present)

Rules:
- companyName: Extract the company that is hiring. If unclear, use an empty string.
- roleTitle: Extract the exact job title. If unclear, use an empty string.
- jobDescription: Preserve the original wording — do not rephrase or summarize. Use simple line breaks and dashes for structure.
- Do NOT include navigation menus, footers, cookie banners, "similar jobs", or unrelated page content in the jobDescription.
- Return ONLY the JSON object, no markdown fences or commentary.
- If the page does not appear to contain a job posting, return: {"companyName":"","roleTitle":"","jobDescription":"NO_JD_FOUND"}`;

export async function extractJobData(pageText: string): Promise<ScrapedJobData> {
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

  let text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  let parsed: ScrapedJobData;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse job posting data from the page. Try pasting the job description manually.');
  }

  if (!parsed.jobDescription || parsed.jobDescription === 'NO_JD_FOUND') {
    throw new Error('That page doesn\'t appear to contain a job posting. Try a direct link to the job posting, or enter details manually.');
  }

  return {
    companyName: (parsed.companyName || '').trim(),
    roleTitle: (parsed.roleTitle || '').trim(),
    jobDescription: parsed.jobDescription.trim(),
  };
}
