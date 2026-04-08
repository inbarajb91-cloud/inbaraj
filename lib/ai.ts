import Anthropic from '@anthropic-ai/sdk';
import { ResumeData, ProfileOverride } from './types';

const SYSTEM_PROMPT = `You are a resume tailoring expert. Given a candidate's base resume data (JSON) and a job description, produce a tailored version.

Rules:
1. ONLY reword, reorder, and re-emphasize existing achievements. NEVER fabricate or invent new experience.
2. Rewrite the hero headline and description to align with the role's language and priorities.
3. Reorder and rephrase experience bullets so the most relevant achievements lead.
4. Adjust skill emphasis — bring forward skills matching the JD, de-emphasize less relevant ones.
5. Tweak project descriptions to highlight aspects most relevant to the role.
6. You may add customSections (e.g. "Certifications", "Domain Expertise") if the JD strongly values something not covered by existing sections.
7. You may set a section to false to hide it if it's irrelevant to the role.
8. Return ONLY a JSON object with the fields that differ from the base. Do not include unchanged fields.
9. The response must be valid JSON — no markdown, no code fences, no commentary.

The override format:
{
  "hero": { "headline": "...", "description": "..." },
  "experience": [...],
  "skills": [...],
  "projects": [...] or false,
  "summary": "...",
  "customSections": [{ "id": "...", "title": "...", "position": "after:skills", "items": [...] }]
}

Only include fields you are changing. The system will deep-merge your overrides with the base.`;

function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return cleaned.trim();
}

export async function tailorResume(
  base: ResumeData,
  jobDescription: string
): Promise<Partial<ProfileOverride>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  const makeRequest = async (attempt: number) => {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `## Base Resume (JSON)\n\`\`\`json\n${JSON.stringify(base, null, 2)}\n\`\`\`\n\n## Job Description\n${jobDescription}\n\nProduce the tailored override JSON now.`,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const cleaned = stripCodeFences(textBlock.text);
      return JSON.parse(cleaned) as Partial<ProfileOverride>;
    } catch (error) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('500') ||
          error.message.includes('socket') ||
          error.message.includes('overloaded') ||
          error.message.includes('Internal server error'));

      if (isRetryable && attempt < 2) {
        const delay = (attempt + 1) * 3000;
        await new Promise((r) => setTimeout(r, delay));
        return makeRequest(attempt + 1);
      }
      throw error;
    }
  };

  return makeRequest(0);
}
