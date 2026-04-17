# Architecture

How data flows, for contributors.

## No backend server

Everything runs on Vercel's serverless infrastructure:

- **Next.js API routes** → serverless functions, cold-start per request
- **GitHub Contents API** → persistent storage (no database)
- **Claude API** → external AI calls
- **Apify** → external scraping service

Profile data lives in the git repo as JSON. Every publish is a git commit.

## Data model

```
data/
├── base.json                # Source of truth for your resume
├── ground-truth.json        # Verified facts for AI validation
└── profiles/
    ├── registry.json        # Slug → { company, created, active }
    └── <slug>.json          # Overrides per profile (only diffs from base)
```

A profile JSON contains **only the fields that differ from the base**. `lib/resume.ts#mergeResume()` deep-merges at render time. Setting a section to `false` in a profile hides it entirely.

## Rendering model

- `/` → static (`○`), built from `data/base.json` at build time
- `/r/<slug>` → force-dynamic (`ƒ`), reads profile JSON at request time with a GitHub API fallback when the filesystem misses (which it always does on Vercel between builds)

## Request flow: publishing a profile

```
Admin UI
  POST /api/generate      ← Claude tailors, Claude validates, returns overrides
  POST /api/profiles      ← commitFile() writes <slug>.json to GitHub
                          ← commitFile() updates registry.json
  polling loop hits /r/<slug> until it returns 200
```

## Request flow: loading a profile page

```
Browser → /r/rippling
  middleware.ts sets profile_lock cookie (if not iframe, slug validated)
  app/r/[slug]/page.tsx
    loadProfile(slug)
      try filesystem  ← miss on Vercel
      fallback: GitHub Contents API
    mergeResume(base, profile)
  ResumeLayout renders
```

Middleware also intercepts `/` and redirects to `/r/<slug>` if `profile_lock` is set — this is the cookie isolation that hides the base resume from HR after they've visited a targeted link.

## Auth

Every mutating API route goes through `lib/auth.ts#requireAuth`:
- Accepts either plaintext or bcrypt-hashed `ADMIN_PASSWORD`
- Uses `crypto.timingSafeEqual` / `bcrypt.compare` (both timing-safe)
- Returns a 401 `NextResponse` or `null` (null = proceed)

Rate limiting via `lib/rate-limit.ts` — per-IP, per-endpoint token bucket, in-memory. See [security.md](security.md) for the caveats and rotation plan.

## AI pipeline

`lib/ai.ts`:
- `tailorResumeWithValidation(base, jd, groundTruth)` — generate → validate → retry up to 2x
- `adaptResumeWithValidation(source, instruction, groundTruth)` — same loop for the "Adapt from existing" flow
- Both use Zod schemas (`lib/schemas.ts`) to reject malformed AI output before validation
- Validator is a second Claude call acting as a fact-checker against ground truth

`lib/scrape.ts#extractJobData` — Claude extracts `{ companyName, roleTitle, jobDescription }` from raw scraped text. LinkedIn bypasses this (the dedicated actor returns structured data directly).

## Scraping

`lib/apify.ts`:
- **LinkedIn** (`apimaestro~linkedin-job-detail`) — uses LinkedIn's data API via a specialized actor; returns structured data; no Claude extraction needed
- **Everything else** (`apify~website-content-crawler` with `playwright:adaptive`) — returns raw page text; Claude extracts structure afterwards

LinkedIn URL normalization handles the `?currentJobId=…` search-page variants by converting to public `/jobs/view/<id>/` format.

## Print / PDF

`ResumePrint.tsx` is a **separate render tree** from the visible page. It receives the same merged `data` prop but renders its own 2-page A4 layout with inline styles tuned for print. Changes to the visible page don't affect the PDF.

`@media print` CSS in `globals.css` hides everything with `body>*{display:none!important}` and shows only `#resume-content`.

Key lesson: use **CSS grid** (not flex) for multi-card rows in print. Flex with `flex:1` forces sibling heights to match, making row-level page breaks impossible. Grid rows break naturally, and `breakInside: avoid` on each card prevents mid-card splits. See `memory.md` Session 8 for the full story.

## Middleware

`middleware.ts`:
- Sets `profile_lock` cookie on `/r/<slug>` visits (httpOnly, secure in prod, sameSite lax, slug regex-validated)
- Redirects `/` → `/r/<locked-slug>` if the cookie is present
- Skips cookie-set on iframe requests (admin preview) via `sec-fetch-dest` header
- Skips redirect on `?view=base` (admin's "view base resume" iframe)

## File map

| File | Role |
|---|---|
| `app/page.tsx` | Base resume at `/` (static) |
| `app/r/[slug]/page.tsx` | Profile page at `/r/<slug>` (dynamic) |
| `app/admin/page.tsx` | Admin dashboard (wizard state machine) |
| `app/api/*/route.ts` | Serverless endpoints (auth + rate limit + logic) |
| `components/*` | Resume display components |
| `components/ResumePrint.tsx` | Print-only render tree |
| `lib/resume.ts` | Data loading + deep merge |
| `lib/ai.ts` | Claude API with validation loop |
| `lib/apify.ts` | Apify client (LinkedIn + generic) |
| `lib/scrape.ts` | Claude-based JD extraction |
| `lib/github.ts` | GitHub Contents API client |
| `lib/auth.ts` | Shared auth (bcrypt or plaintext) |
| `lib/rate-limit.ts` | In-memory per-IP token bucket |
| `lib/sanitize.ts` | HTML allowlist sanitizer (em, br only) |
| `lib/schemas.ts` | Zod schemas for AI output |
| `lib/ground-truth.ts` | Ground-truth loader |
| `lib/types.ts` | TypeScript interfaces |
| `middleware.ts` | Cookie-based isolation + redirects |

## Extending

- **New resume section** — add the type in `lib/types.ts`, a component in `components/`, wire into `ResumeLayout.tsx` and `ResumePrint.tsx`, update the Zod schema in `lib/schemas.ts` so the AI can return it
- **New creation path** — extend the `WizardPhase` discriminated union in `app/admin/page.tsx`, add the step in `JDForm.tsx`, plumb the back-navigation
- **New AI prompt** — prompts live in `lib/ai.ts`. Each has its own system prompt + validation loop — treat prompt tuning as code changes with their own test cycle
