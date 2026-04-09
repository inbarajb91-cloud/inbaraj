# context.md

High-level context for anyone (human or AI) working on this project.

---

## What is this?

A personal portfolio and resume website for **Inbaraj B** — an Implementation Lead with 5+ years of enterprise SaaS experience. The site lives at [inbaraj.info](https://inbaraj.info).

The site has two modes:
1. **Public portfolio** — the base resume visible to everyone at the root URL
2. **Targeted resumes** — AI-tailored versions of the resume for specific companies, accessible at readable URLs (e.g. `/r/rippling`)

## Why does this exist?

Job hunting requires tailoring your resume for each role. Rather than maintaining multiple resume files manually, this system lets the owner:

1. Maintain a single source-of-truth resume (`data/base.json`)
2. Paste a job description into the admin dashboard
3. Get an AI-generated tailored version (rewording, reordering, section changes — no fabrication)
4. Publish it at a unique URL to share with that company's HR
5. Keep the base resume safe from HR discovery via cookie-based isolation

## How it works

### The resume data model

The base resume is structured JSON with these sections:
- `personal` — name, title, contact info, links
- `hero` — tag line, headline (supports `<em>` for italic accent), description, badges
- `stats` — 4 metric cards (value, label, sub-text, color)
- `experience` — array of jobs with bullets and highlight cards
- `projects` — array of project cards with tech tags
- `skills` — array of skill groups
- `education` — array of degrees
- `booking` — Calendly section content
- `contact` — CTA section content
- `summary` — professional summary text (used in PDF)
- `footer` — footer HTML string

### Company profile overrides

A profile JSON contains ONLY the fields that differ from the base. Example:

```json
{
  "meta": { "company": "Acme Corp", "created": "2026-04-08", "active": true },
  "hero": { "headline": "Technical program <em>leader</em>..." },
  "experience": [/* reworded bullets */],
  "customSections": [
    { "id": "domain", "title": "Domain Expertise", "position": "after:skills", "items": ["..."] }
  ]
}
```

The `mergeResume()` function deep-merges the override with the base at render time. Setting a section to `false` hides it entirely.

### The AI tailoring process

1. Admin pastes company name + optional role label + job description
2. API sends base resume JSON + JD to Claude API with a system prompt that enforces:
   - Only reword, reorder, and re-emphasize — never fabricate
   - Return only changed fields as JSON
   - May add `customSections` or hide irrelevant sections
3. Claude returns a partial JSON override
4. Admin previews the result, edits if needed, then publishes
5. Publishing commits the profile JSON to the GitHub repo via Contents API
6. Vercel auto-rebuilds from the commit

### Cookie-based isolation

The goal: HR who receives a targeted resume link should not be able to discover the base resume.

How it works:
- HR clicks `inbaraj.info/r/a3f2b1c9`
- Middleware sets a `profile_lock` cookie (30 days)
- HR later visits `inbaraj.info` → middleware sees the cookie → redirects to `/r/a3f2b1c9`
- Normal visitors (no cookie) → see the base resume normally

The admin dashboard bypasses this with `?view=base` on iframe URLs.

### PDF download

The "Download CV" button triggers `window.print()`. A `@media print` CSS rule hides the entire page and shows only the `#resume-content` div, which is a hidden print-optimized 2-page A4 layout rendered by `ResumePrint.tsx`. This component receives the same merged data as the visible page, so profile-specific content appears in the PDF.

## Deployment

- **Platform**: Vercel
- **Repository**: `inbarajb91-cloud/inbaraj` on GitHub
- **Branch**: `main` (auto-deploys)
- **Domain**: `inbaraj.info` (custom domain via Hostinger, pointed to Vercel)
- **Framework**: Next.js (configured via `vercel.json`)

### Environment variables (Vercel project settings)

| Variable | Value | Notes |
|----------|-------|-------|
| `ADMIN_PASSWORD` | (secret) | For `/admin` login |
| `ANTHROPIC_API_KEY` | (secret) | Claude API key |
| `GITHUB_TOKEN` | (secret) | Fine-grained PAT with Contents read/write |
| `GITHUB_BRANCH` | `main` | Branch for profile commits |

## Who is Inbaraj B?

- **Current role**: Lead, Product Implementation at Facilio (CMMS/SaaS) since Nov 2021
- **Previous**: Senior Catalog Specialist at Amazon (May 2016 – Oct 2021)
- **Key numbers**: $4.1M+ contract value delivered, ~$1M implementation value, $230K monthly savings at Amazon, 4 AI products built
- **Side projects**: FM Engine (WhatsApp CMMS), Parabls (AI job platform), AI Config Assistant, FAAX (options trading)
- **Education**: M.Tech Embedded Systems (Hindustan University), B.E ECE (Balaji Institute)
- **Location**: Chennai, India
- **Target roles**: Implementation leadership, business analysis, account management, customer success

## History

| Date | Event |
|------|-------|
| Mar 2026 | Original `index.html` portfolio created and iterated |
| Mar 27 | Added downloadable CV (PDF) feature |
| Mar 27 | Fixed PDF generation, improved readability, embedded project links |
| Apr 8 | Migrated to Next.js with resume customization system |
| Apr 8 | Fixed deployment bugs, cookie issues, API errors |
| Apr 8 | Added profile dropdown, deploy status, session persistence |
| Apr 8 | Created PR #3, merged to main, deployed |
| Apr 8 | Fixed Calendly embed 404 (double URL prefix) |
| Apr 8 | Changed slugs from hashes to readable company names |
| Apr 8 | Added optional role label for multi-role slugs |
| Apr 8 | Updated all documentation |
| Apr 9 | Phase 0: Anti-hallucination pipeline (ground truth, Zod, validation agent, diff view) |
| Apr 9 | UX improvements: semantic validator, Keep/Remove buttons, side-by-side diff |
| Apr 9 | Added BA & Integration highlights to Facilio experience |
| Apr 9 | PR #4 merged to main |
| Apr 9 | Phase 1: Friendly language overhaul across 6 admin components |
| Apr 9 | Phase 1: Wizard flow — 5-phase sequential creation experience |
| Apr 9 | Phase 1: Step-by-step intake, processing view, published view |
| Apr 9 | PR #5 merged to main |
| Apr 9 | Phase 2: URL-first wizard, Apify scraping, LinkedIn dedicated actor |
| Apr 9 | Phase 2: Confirm step for reviewing extracted data |
| Apr 9 | Phase 2: Fixed LinkedIn actor ID, crawler type, URL normalization |
| Apr 9 | PR #6 merged to main |

---

## Roadmap — planned next development

### Phase 0: Anti-hallucination agent (COMPLETED Apr 9, 2026)
All items implemented and merged via PR #4:
- Ground truth file, Zod schema validation, validation agent (second Claude call)
- Validation loop with retry, structured logging, side-by-side diff view
- Semantic validator (not keyword matching), Keep/Remove violation actions
- BA & Integration highlights added to base resume

### Phase 1: Agentic UX overhaul (COMPLETED Apr 9, 2026)
All items implemented via PR #5:
- Replaced all tech jargon with user-friendly conversational language
- 5-phase wizard flow: Intake → Processing → Review → Publishing → Published
- Step-by-step intake (one field per screen with conversational prompts)
- Multi-step progress indicator during generation
- FadeIn transitions, breadcrumb navigation, tab-switch guard
- Cancel support during processing, Revise with cost warning
- Published phase with inline live-check and success actions

### Phase 2: URL-based JD scraping (COMPLETED Apr 9, 2026)
All items implemented and merged via PR #6:
- URL-first wizard flow: URL is the first step, extracts company + role + JD
- LinkedIn: dedicated `apimaestro~linkedin-job-detail` actor (structured data via LinkedIn API)
- Generic sites: `apify~website-content-crawler` with `playwright:adaptive` + Claude extraction
- Confirm step: all extracted fields shown for review/editing before tailoring
- Manual fallback: "or enter details manually" link preserves original Company → Role → JD flow
- `APIFY_API_KEY` env var required in Vercel project settings

### Phase 3: Inline editing with AI assist
Allow editing generated/published content before or after publishing:
- **Highlight any section** on the resume preview → two options appear:
  - **Edit manually** — inline text editor
  - **AI assist** — describe what you want changed, agent asks clarifying questions, then updates on confirmation
- Overlay popup on the resume preview within admin
- Manual edits feed back into ground truth for future generations

### Phase 4: Security audit
Full review of:
- API route authentication (currently header-based password — needs hashing + rate limiting)
- XSS vectors in `dangerouslySetInnerHTML` usage
- GitHub token permissions (should be minimal scope)
- Cookie security (httpOnly, sameSite, secure flags)
- Input sanitization on all API endpoints
- CSRF protection on mutating API routes

### Architecture note: "No backend"
The current system runs entirely on Vercel's serverless infrastructure:
- **API routes** = serverless functions (run on-demand, no standing server)
- **GitHub API** = persistent storage (no database)
- **Vercel** = hosting + CDN + SSL + auto-deploy
- **Claude API** = AI processing (external service)

There is no traditional backend server. Next.js API routes are serverless functions that cold-start on each request. Data persists in the Git repo. This is a fully serverless architecture.
