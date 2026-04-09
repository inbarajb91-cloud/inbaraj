# memory.md

Chronological history of decisions, changes, and lessons learned across sessions.

---

## Development checklist

### Completed

- [x] **Static portfolio** — Single `index.html` with dark/light theme, responsive design, scroll animations
- [x] **Downloadable CV** — `window.print()` with `@media print` CSS, 2-page A4 layout
- [x] **Resume readability** — HR-standard font sizes (10pt min), clean header, embedded project links
- [x] **Next.js migration** — App Router, 13 components, structured JSON data model
- [x] **Admin dashboard** — Password-protected at `/admin`, login with session persistence
- [x] **AI resume tailoring** — Claude API generates profile overrides from job descriptions
- [x] **Profile system** — JSON overrides deep-merged with base, stored in git via GitHub API
- [x] **Company profile pages** — Dynamic pages at `/r/<slug>` with GitHub API fallback
- [x] **Cookie-based isolation** — HR locked to profile page, can't discover base resume
- [x] **Deploy status** — Post-publish polling with "deploying" overlay → "live" indicator
- [x] **Profile dropdown** — Sorted by most recent in admin tabs
- [x] **PDF custom sections** — AI-added sections render in print template
- [x] **Readable slugs** — Company-name URLs (`/r/rippling`) with optional role label
- [x] **Calendly embed fix** — Stopped double-wrapping the full URL
- [x] **Session persistence** — `sessionStorage` survives refresh, cleared on tab close
- [x] **Documentation** — `CLAUDE.md`, `memory.md`, `context.md` with gotchas and roadmap

### Phase 0 — Anti-hallucination agent (COMPLETED)

- [x] Ground truth file (`data/ground-truth.json`) — verified facts from base + manual edits
- [x] Validation step — second Claude call compares output against ground truth
- [x] Validation loop — re-prompt with specific feedback on failures (max 2 retries)
- [x] Zod schema enforcement on AI output structure
- [x] Diff view — side-by-side Base/Tailored comparison panels
- [x] Structured logging — input, output, validation results per generation
- [x] Semantic validator — understands rephrasing, only flags genuine fabrication
- [x] Keep/Remove buttons — per-violation actions with optional reason tracking
- [x] BA & Integration highlights — added to Facilio experience in base.json

### Phase 1 — Agentic UX overhaul (COMPLETED)

- [x] Replace tech jargon with user-friendly language throughout admin
- [x] Conversational agent wrapper — feels like talking to an assistant
- [x] Progress states visible without technical detail
- [x] Package generation as a multi-step wizard with visible workflow states
- [x] Step-by-step intake (Company → Role → JD, one field at a time)
- [x] FadeIn transitions between wizard phases
- [x] Breadcrumb navigation showing progress through the flow
- [x] Cancel support during processing (AbortController)
- [x] Revise/Start Over from review phase with cost warning
- [x] Published phase with inline live-check polling
- [x] Tab-switch guard to warn about in-progress work

### Phase 2 — URL-based JD scraping (COMPLETED)

- [x] Apify integration — paste a URL instead of raw JD text
- [x] `APIFY_API_KEY` env var and scraper API route
- [x] Support LinkedIn job posts, company careers pages
- [x] Fallback to manual paste if scrape fails
- [x] URL-first wizard flow — URL is the first step, extracts company + role + JD
- [x] LinkedIn: dedicated `apimaestro~linkedin-job-detail` actor (structured data via LinkedIn API)
- [x] Generic sites: `apify~website-content-crawler` with `playwright:adaptive` + Claude extraction
- [x] Confirm step — all extracted fields shown for review/editing before tailoring

### Phase 3 — Inline editing with AI assist

- [ ] Highlight-to-edit on resume preview — select text, popup appears
- [ ] Manual edit option — inline text editor overlay
- [ ] AI assist option — describe change, agent asks clarifying questions, updates on confirmation
- [ ] Manual edits feed back into ground truth for future generations
- [ ] Works within admin iframe preview
- [ ] Option to edit both before publishing (generated preview) and after (published profile)
- [ ] Consider `/update` route as auth-protected in-browser editing mode (alternative to admin-only)

### Phase 4 — Security audit

- [ ] Hash admin password (bcrypt or similar) instead of plain comparison
- [ ] Rate limiting on generate/publish endpoints
- [ ] Audit `dangerouslySetInnerHTML` for XSS vectors
- [ ] Tighten GitHub token to minimal permissions
- [ ] Input sanitization on all API endpoints
- [ ] CSRF protection on mutating routes
- [ ] Cookie flags: `httpOnly`, `secure`, proper `sameSite`

---

## Session 1 — "Add profile customization and resume changes" (Mar 27-28, 2026)

### What existed before
A single `index.html` file (858 lines) — a complete portfolio site with embedded CSS and JavaScript. Dark/light theme, responsive design, scroll animations, Calendly embed, and contact section. Deployed on Vercel via GitHub Pages-style static hosting.

### Changes made (7 commits)

1. **Added downloadable CV feature** — Hidden off-screen 2-page resume template rendered with `html2pdf.js`. Floating "Download CV" button + navbar button. File named `Inbaraj_B_Resume_YYYY-MM-DD_HH-MM.pdf`.

2. **Fixed PDF generation** — html2canvas was hanging because `position:fixed` at `left:-9999px` caused render issues. Changed to `display:none` container, clone innerHTML into temp `position:absolute` div for capture. Added `.catch(reset)` error handling.

3. **Added experience timeline** — Vertical gradient line (purple→teal) connecting job entries with colored circle dots. Later removed in readability pass.

4. **Switched to `window.print()`** — Replaced html2pdf.js entirely with native browser print API. Added `@media print` CSS to hide page content and show only the resume template. More reliable and instant.

5. **Improved resume readability** — Bumped all font sizes to HR-standard minimums (body 8→10pt, titles 11→12.5pt). Removed "Business Analyst · Builder" subtitle, "Open to opportunities" tag, and the timeline visualization.

6. **Embedded project links** — Made FM Engine and Parabls names clickable hyperlinks. Added Postman and Primitve to Technical & Tools.

### Key decisions
- `window.print()` over html2pdf.js — simpler, no CDN dependency, works instantly
- Font sizes follow HR readability standards (10pt minimum for body text)
- Timeline was added then removed — too cluttered for a 2-page PDF

---

## Session 2 — "Review profile resume changes" (Apr 8, 2026)

### Context
User wanted to review Session 1 changes and then build a full resume customization system.

### The big idea
- Base resume at `inbaraj.info` for public viewing
- Company-tailored resumes at `inbaraj.info/r/<hash>` for specific HR targets
- Cookie-based isolation so HR can't discover the base resume
- Admin dashboard to generate tailored resumes from job descriptions using Claude API
- Git as the database — profile JSONs committed to the repo

### Architecture decisions

**Why Next.js?** The site was already on Vercel. Next.js App Router gives us API routes (for Claude API calls and GitHub commits), server-side rendering (for dynamic profile pages), and static generation (for the base resume) — all in one framework.

**Why JSON files in git?** No external database needed. Profiles are version-controlled, changes are auditable, and Vercel auto-deploys on push. The admin's "Publish" action commits via GitHub Contents API.

**Why cookie isolation?** When HR visits `/r/<slug>`, a `profile_lock` cookie (30 days) is set. Any subsequent visit to `/` redirects to the profile. Normal visitors without the cookie see the base resume. Simple, no auth required for HR, and undetectable.

**Why deep-merge overrides?** Profile JSONs only store what changed from the base. This keeps profiles small and maintainable. The `mergeResume()` function handles the merge at render time.

### Implementation (branch: `claude/profile-resume-customization-zG0Gk`)

Built the entire Next.js app: 45 files, ~10,500 lines.

- Extracted all resume data from `index.html` into `data/base.json`
- Created 13 React components matching the original design
- Built admin dashboard with login, JD form, AI generation, preview, and publish
- Built API routes for Claude API tailoring and GitHub-based profile storage
- Added middleware for cookie-based isolation

### Bugs encountered and fixed

1. **Vercel build error** — Output directory "public" not found. Fixed by adding `vercel.json` with `"framework": "nextjs"`. Root cause: Vercel project was configured for static hosting, not Next.js.

2. **Content invisible on deploy** — All sections had `.reveal` class with `opacity: 0` but the IntersectionObserver JavaScript was never ported to Next.js. Fixed by creating `ScrollReveal.tsx` client component. Also removed `@import "tailwindcss"` from CSS which was pulling in Tailwind's reset and interfering with styles.

3. **Admin password rejected** — Environment variables were set at the Vercel team level but needed to be at the project level. Also needed to be enabled for "Preview" environment, not just Production.

4. **Generated resume showed raw JSON** — Created `GeneratedPreview.tsx` component with formatted sections view and raw JSON toggle.

5. **Profile pages 404 after publish** — `loadProfile()` used `fs.readFileSync` which only reads build-time files. Added GitHub API fallback and `force-dynamic` rendering.

6. **Published profiles not showing in admin tabs** — `GET /api/profiles` used a static import of `registry.json` (build-time). Switched to `getRegistryFromGitHub()` for runtime reads.

7. **Claude API 500 errors** — Added retry with 3s/6s backoff. Added code fence stripping (Claude sometimes wraps JSON in ` ```json ``` `).

8. **Base resume showing ZakApps content** — The `profile_lock` cookie caused the admin's base resume iframe to redirect to the profile page. Fixed by adding `?view=base` bypass parameter and skipping cookie on iframe requests.

9. **Admin layout too narrow** — Removed `maxWidth: 1200` constraint. Made full-width responsive.

10. **PDF missing custom sections** — `ResumePrint.tsx` didn't render `customSections`. Added rendering for AI-added sections.

### Feature additions

- **Profile dropdown** — Replaced flat tabs with a dropdown `<select>` sorted by most recent. Base Resume and + New Profile stay as fixed tabs.
- **Deploy status overlay** — After publishing, shows a spinner "Deploying to Vercel..." instead of iframe. Polls every 15s. Switches to iframe when live.
- **Session persistence** — Admin password stored in `sessionStorage` to survive page refresh. Cleared when tab closes or auth fails.
- **Post-publish polling** — Yellow "checking" indicator → green "live" indicator with clickable link.

### Profiles created during testing
- `a8148190` — ZakApps (Business Analyst focus)
- `ecdb2e7d` — Rippling (Implementation & Data Migration focus)

---

## Session 3 — "Review and fix outstanding issues" (Apr 8, 2026, continued)

### Context
User reviewed the previous session's summary and wanted all outstanding bugs fixed, documentation created, and the branch merged to main.

### Starting state
The Next.js app lived on branch `claude/profile-resume-customization-zG0Gk` (not yet merged to `main`). The current working branch `claude/review-profile-resume-changes-jVRrw` only had the original `index.html`.

### Bug fixes (commit: `2064f50`)

1. **Claude API 500 errors** — Added retry with 3s/6s backoff on 500/socket errors. Strip markdown code fences from JSON responses before parsing.
2. **Stale registry in admin** — `GET /api/profiles` was reading from build-time static import. Switched to `getRegistryFromGitHub()` for runtime reads.
3. **Profile pages 404** — `loadProfile()` now falls back to GitHub API when filesystem miss occurs. Added `force-dynamic` to profile page.
4. **Admin layout too narrow** — Removed `maxWidth: 1200`, full-width responsive.
5. **No rebuild notification** — Added post-publish polling every 15s with status indicator.
6. **Iframe too short** — Changed from fixed 700px to `calc(100vh - 260px)`.

### User feedback round (commit: `37b5a4a`)

1. **Profile dropdown** — Replaced flat tabs with `<select>` dropdown sorted by most recent.
2. **Deploy status overlay** — Spinner "Deploying to Vercel..." while building, replaced by iframe once live.
3. **PDF missing custom sections** — Added `customSections` rendering to `ResumePrint.tsx`.
4. **Session persistence** — Admin password in `sessionStorage` (survives refresh, cleared on tab close).

### Cookie redirect bug (commit: `d21cbc1`)
Base resume tab was showing ZakApps content because `profile_lock` cookie redirected the iframe's `/` request. Fixed with `?view=base` bypass and iframe detection via `sec-fetch-dest` header.

### Calendly 404 bug (commit: `bf383ac`)
`BookingSection.tsx` was wrapping `personal.calendly` (already a full URL) in another `https://calendly.com/` prefix, causing a double-nested URL. Fixed to use the value directly.

### Slug readability (commit: `93fae20`)
Changed from SHA-256 hash slugs (`ecdb2e7d`) to company-name slugs (`rippling`). Added optional role label for multi-role scenarios (`rippling-implementation-lead`).

### Documentation and merge
- Created `CLAUDE.md`, `memory.md`, `context.md`
- Created PR #3, squash-merged to `main`
- All subsequent fixes pushed directly to `main`

---

## Lessons learned

1. **Static imports in Next.js are build-time snapshots.** Any data imported via `import x from './file.json'` is baked into the build. For dynamic data, read from an API or filesystem at request time.

2. **Vercel filesystem is read-only in production.** You can't `fs.writeFile` on deployed functions. Use external storage (GitHub API in our case) for persistence.

3. **Vercel env vars have environment scopes.** "Production", "Preview", and "Development" are separate. A var set for Production won't be available in Preview deployments.

4. **Middleware cookies affect iframes.** If middleware sets cookies on page visits, iframes loading those pages will also trigger the cookie logic. Use `sec-fetch-dest` header to detect iframe requests.

5. **Claude sometimes wraps JSON in code fences** despite explicit instructions not to. Always strip ` ```json ``` ` before parsing.

6. **`html2canvas` hangs on `position:fixed` off-screen elements.** `window.print()` with `@media print` CSS is far more reliable for PDF generation.

7. **Project-level vs team-level settings in Vercel** — env vars, domain settings, and framework presets all need to be at the project level.

8. **Always check if data values are already full URLs.** The Calendly embed bug happened because the component assumed a relative path but `base.json` stored a full URL.

9. **Hash-based slugs feel scammy.** Human-readable slugs (`/r/rippling`) are more trustworthy for HR recipients than random hashes (`/r/ecdb2e7d`).

---

## Critical finding: AI hallucination in generated profiles (Apr 8, 2026)

### The problem
The Claude API is **fabricating skills and experience** that don't exist in the base resume. Example from a Rippling-targeted profile:
- "Payroll & HR data migration expertise" — fabricated (not in base)
- "Multi-format data transformation" — fabricated
- "Data integrity validation & testing" — fabricated
- "reduced implementation timelines by 30%" — fabricated metric

The current system prompt says "NEVER fabricate" but Claude still invents content to better match the JD. This is a critical trust issue — the resume must only contain things that are actually true.

### Root cause
The current approach uses a single Claude API call with a simple "don't fabricate" instruction. There's no:
- Strict ground truth enforcement
- Validation step to catch fabrication
- Diff view for human review
- Structured evaluation of output fidelity

### Planned fix: Agent architecture
Instead of a single API call, implement a multi-step agent with:

1. **Ground truth data** — A growing `ground-truth.json` that accumulates verified facts across all profiles. Every manual edit by the user becomes additional ground truth. The AI can ONLY use facts from this document.

2. **Workflow states** — `generate → validate → review → publish` pipeline:
   - Generate: Claude tailors the resume
   - Validate: A second Claude call acts as "judge", comparing output against ground truth
   - Review: User sees a diff view highlighting all changes
   - Publish: Only after user confirmation

3. **Evaluations** — Automated checks:
   - Every bullet point must map to a source bullet in the base
   - No new metrics/numbers unless they exist in ground truth
   - Skills must be derivable from existing skills (rephrasing OK, invention not)

4. **Log observability** — Structured logs for every generation:
   - Input (base + JD)
   - Raw output from Claude
   - Validation results (pass/fail per section)
   - User edits before publish

5. **Output structure** — Zod schema validation on Claude's response. Reject malformed output before it reaches the UI.

6. **Validation loop** — If validation fails, re-prompt Claude with specific feedback ("bullet 3 contains fabricated content, rephrase using only source material") and validate again. Max 2 retries.

### Diff highlight view
Before publishing, a toggle button shows all changes from the base resume:
- Added text highlighted in green
- Removed text highlighted in red
- Modified text shown side-by-side
This is client-side only — compare base JSON vs override JSON.

---

## Session 4 — "Phase 0: Anti-hallucination pipeline" (Apr 9, 2026)

### Context
Continuing from Session 3, which identified AI hallucination as the #1 priority. This session implemented the full Phase 0 anti-hallucination pipeline and added new resume content.

### Changes made

#### Phase 0 implementation (commit: `9370132`)

1. **Ground truth file** — Created `data/ground-truth.json` with all verified facts extracted from `base.json`: skills, metrics, companies, titles, tools, bullets, highlights, projects, education, locations.

2. **Zod schema validation** — Created `lib/schemas.ts` with strict Zod schemas for `ProfileOverride`. Uses `.strict()` mode to reject unknown keys. Validates structure before any further processing.

3. **Validation agent** — Added second Claude API call in `lib/ai.ts` that acts as a fact-checker. Compares generated overrides against ground truth. Returns structured `ValidationResult` with per-violation details (section, field, issue type, suggestion).

4. **Validation loop** — If validation finds violations, re-prompts the generator with specific feedback listing each violation. Max 2 retries. Returns best result even if some issues remain.

5. **Structured logging** — Created `lib/logger.ts`. Logs generation timing, validation results, and retry count as structured JSON to console (captured by Vercel Log Drain).

6. **Diff view** — Created `app/admin/_components/DiffView.tsx`. Initially used inline word-level diff with strikethrough.

7. **Base API endpoint** — Created `app/api/base/route.ts` (auth-protected GET) so client components can fetch base resume data for diff comparison.

8. **Admin UI updates** — `GeneratedPreview.tsx` gained 3-way toggle (Formatted/Diff/Raw JSON) and validation banner. `admin/page.tsx` updated with validation-aware publish button.

#### UX improvements based on user testing (commit: `4918381`)

User tested on Vercel preview and reported three issues:

1. **Validator was keyword-matching, not semantic** — Flagging legitimate rephrasings like "managing complex implementations" from "end-to-end enterprise rollouts". Fixed by rewriting the validator system prompt with explicit ALLOWED vs FABRICATED examples, emphasizing semantic understanding over keyword matching.

2. **No way to act on violations** — Added Keep/Remove buttons per violation. "Keep" prompts for optional reason. Resolved violations fade out. Publish button shows unresolved count and turns green when all resolved.

3. **Inline diff was unreadable** — Replaced inline strikethrough with side-by-side Base/Tailored panels. Each bullet, highlight, and text field shows old and new in separate colored blocks. Skills show two-column comparison.

#### Resume content additions (commit: `931433c`)

User requested new highlights about Business Analysis and Integration work at Facilio:

1. **Business Analysis highlight** — End-to-end requirements lifecycle, BRD documentation, cross-functional collaboration with integration/product/engineering teams.

2. **Integration & Configuration highlight** — SSO (SAML/SCIM) and third-party platform integrations (Xero, CorrigoPro, Equiem, Wooqer, Bill.com, SiteFotos, SFG20). API feasibility validation via Postman, integration pattern decisions (polling vs webhook), integration requirement documentation.

Updated `ground-truth.json` with new highlight texts and platform names.

#### Git workflow convention (commit: `c0f52ec`)
Added to CLAUDE.md: Always push to feature branches, no squash unless fixing errors, wait for user to test before merging.

### PR and merge
- Branch: `claude/continue-portfolio-dev-7Xb5m`
- PR #4 created and merged to main (merge commit, not squash)

### Key decisions

1. **Semantic validation over keyword matching** — The validator must understand that rephrasing is the whole point of resume tailoring. Only genuinely new claims (skills, metrics, experience) should be flagged.

2. **Violations are advisory, not blocking** — User can Keep or Remove each violation. Publish works regardless. This respects user judgment while providing guardrails.

3. **Side-by-side diff over inline** — Inline word-level diff with strikethrough is hard to read for long text. Stacked Base/Tailored panels are clearer.

4. **Ground truth as flat arrays** — Not a hierarchical copy of base.json. Flat arrays of skills, metrics, bullets, etc. make it easy for the validator to search and match.

### Lessons learned

10. **Keyword-matching validation creates false positives.** The initial "be strict, when in doubt flag it" prompt caused the validator to flag legitimate rephrasings. Semantic understanding with explicit examples of what's allowed produces much better results.

11. **Users need actionable controls, not just warnings.** Showing violations without Keep/Remove buttons was frustrating — the user could see issues but couldn't do anything about them inline.

12. **Side-by-side beats inline for diff readability.** Inline word-diff with strikethrough becomes unreadable when most of the text changes. Separate panels let you read each version independently.

### New files added this session
| File | Purpose |
|------|---------|
| `data/ground-truth.json` | Verified facts for validation |
| `lib/ground-truth.ts` | Ground truth loader + builder |
| `lib/schemas.ts` | Zod schemas for AI output |
| `lib/logger.ts` | Structured generation logging |
| `app/api/base/route.ts` | Base resume API endpoint |
| `app/admin/_components/DiffView.tsx` | Side-by-side diff view |

---

## Session 5 — "Phase 1: Agentic UX overhaul" (Apr 9, 2026)

### Context
Phase 0 (anti-hallucination) was complete. Phase 1 goal: transform the admin dashboard from developer-facing to assistant-like UX. Two major changes: (1) friendly language everywhere, (2) wizard flow replacing the static form.

### Changes made

#### Commit 1: Friendly language overhaul (6 files)

Replaced all technical jargon with user-friendly conversational language across the admin dashboard:

1. **page.tsx** — "Resume Admin" → "Resume Studio". All toast messages, status banners, deploy overlays, and error messages rewritten. Removed references to "Vercel", "GitHub", "slug". Softened errors ("Something went wrong... Try again?").

2. **JDForm.tsx** — Form hints updated ("I'll analyze it and tailor your resume to match"). Added multi-step progress indicator during generation (Reading → Tailoring → Checking → Almost done) with checkmarks.

3. **GeneratedPreview.tsx** — Validation banner: "Everything looks accurate!" / "I found N things that might need a closer look". Violation types mapped to friendly labels (UNSUPPORTED_CLAIM → "May not match your experience"). "Keep" → "It's correct". View toggles: "Diff View" → "Compare Changes", "Raw JSON" → "Raw Data".

4. **ProfileTabs.tsx** — "+ New Profile" → "+ Tailor for a Company". Profile count uses "resumes" instead of "profiles".

5. **DiffView.tsx** — "Base" → "Original". "New bullet" → "Added". "new" badge → "added". "Custom Sections (added)" → "New Sections".

6. **ProfilePreview.tsx** — No changes needed (already clean enough).

#### Commit 2: Wizard flow (page.tsx + JDForm.tsx rewrite)

Replaced the static 3-field form with a 5-phase sequential wizard:

1. **Intake** — Step-by-step: Company Name → Role Label → Job Description. One field per screen with conversational prompts ("What company is this resume for?"). Back navigation preserves entered data.

2. **Processing** — Centered card with 4-step progress indicator + Cancel button. AbortController cancels the fetch if user backs out.

3. **Review** — Only the tailored result visible (no form above it). Three actions: Publish, Revise (with cost warning confirm dialog), Start Over.

4. **Publishing** — Clean spinner state.

5. **Published** — Success view with live-check polling inline. Shows checkmark when live. Actions: View Page, View in Dashboard, Create Another.

**Supporting features:**
- `WizardPhase` discriminated union type as state machine
- `WizardBreadcrumb` showing progress: Company › Role › JD › Processing › Review › Published
- `FadeIn` component for smooth transitions between phases
- `ProcessingView` and `PublishedView` as inline components (no new files)
- Tab-switch guard warns about in-progress work
- Global live-check banners hidden when wizard shows its own published phase

#### Commit 3: Revise confirm dialog

Added `confirm()` dialog to the Revise button warning that going back discards the AI-generated content (which cost an API call).

### Key decisions

1. **Client-side progress over SSE** — Used timed steps instead of server-sent events. Simpler, no API changes needed, and the UX improvement is nearly identical.

2. **Wizard state machine over form visibility toggle** — A proper `WizardPhase` discriminated union ensures exactly one phase renders at a time. Prevents the "form + results both visible" problem.

3. **No caching of LLM output on Revise** — Considered caching the generation to restore on return, but this defeats the purpose of revision (user wants fresh content with updated JD).

4. **Inline sub-components over new files** — `ProcessingView`, `PublishedView`, `WizardBreadcrumb`, and `FadeIn` are small enough to live inside `page.tsx`. Avoids file proliferation.

5. **Confirm dialog on Revise, not on Start Over** — Start Over is clearly destructive (labeled accordingly). Revise is ambiguous — the user might think it means "edit the generated content" rather than "discard and regenerate". The confirm clarifies.

### Lessons learned

13. **One field per screen dramatically improves focus.** The 3-field form felt overwhelming. One question at a time with clear Next/Back navigation feels conversational and guided.

14. **AbortController is essential for cancellable async flows.** Without it, cancelling during generation would leave the API call running and the result would arrive to a stale state.

15. **Discriminated union types make state machines type-safe.** The `WizardPhase` type ensures each phase has exactly the right data (e.g., `published` phase always has `url` and `slug`).

### Branch
- `claude/continue-portfolio-dev-aU9z3`
- PR #5 merged to main

---

## Session 6 — "Phase 2: URL-based JD scraping" (Apr 9, 2026)

### Context
Phase 1 (agentic UX) was complete. Phase 2 goal: allow pasting a job posting URL instead of raw text. The system scrapes the page and extracts company name, role title, and job description automatically.

### Changes made

#### Commit 1: Phase 2 backend (lib/apify.ts, lib/scrape.ts, app/api/scrape/route.ts)

1. **Apify client** — `lib/apify.ts` with `scrapeUrl()` function using `apify~website-content-crawler` (initially with `cheerio` crawler type).
2. **Claude extraction** — `lib/scrape.ts` with `extractJobDescription()` to pull clean JD text from raw scraped page content.
3. **Scrape API route** — `POST /api/scrape` with auth, URL validation, Apify scrape → Claude extract pipeline.
4. **JDForm URL detection** — Auto-detect URLs in the JD textarea, show "Fetch Job Description" button.

#### Commit 2: URL-first wizard redesign

User feedback: URL should be the FIRST step, not buried in the JD textarea. And it should extract company + role + JD — not just JD text.

1. **New wizard flow** — Starts at `url` step ("Have a job posting link?"), not `company`. Manual entry via "or enter details manually" link.
2. **Structured extraction** — `lib/scrape.ts` rewritten to return `{ companyName, roleTitle, jobDescription }` as JSON, not just text.
3. **Confirm step** — After URL scraping, shows all three fields pre-filled and editable. User reviews before "Start Tailoring".
4. **Updated breadcrumb** — Simplified to: Start → Details → Processing → Review → Published.
5. **Smart back-navigation** — Cancel/Revise/error-fallback routes to `confirm` (URL path) or `jd` (manual path) based on which entry point was used.

#### Commits 3-6: LinkedIn scraping fixes

LinkedIn blocks generic scrapers. Went through several iterations:

1. **URL normalization** — Convert LinkedIn search URLs (`?currentJobId=123`) to public `/jobs/view/123/` format.
2. **Switched to playwright** — `cheerio` can't render JS-heavy pages. Changed to `playwright` (later `playwright:adaptive`).
3. **Dedicated LinkedIn actor** — User showed that Claude chat uses `apimaestro/linkedin-job-detail` actor which accesses LinkedIn's data API directly. Implemented this for LinkedIn URLs — returns structured data (title, company, description) with no scraping needed.
4. **Actor ID fix** — Apify API uses `~` not `/` as separator: `apimaestro~linkedin-job-detail`.
5. **Crawler type fix** — Generic crawler requires `playwright:adaptive`, not bare `playwright`.

### Key decisions

1. **URL-first over URL-as-option** — Making URL the first step (not a toggle on the JD textarea) is much more natural. Most users have a job posting URL, not raw text.

2. **Dedicated LinkedIn actor over generic scraping** — LinkedIn's anti-scraping policies make generic crawlers unreliable. The `apimaestro~linkedin-job-detail` actor uses LinkedIn's data API directly, returning perfectly structured data without scraping.

3. **Two-strategy architecture** — LinkedIn URLs → dedicated actor (structured data, skip Claude). Other URLs → generic crawler + Claude extraction. Clean separation.

4. **Confirm step for URL path** — After scraping, show all extracted fields for review. User can correct company name or edit the JD before proceeding. Manual path keeps the one-field-at-a-time flow.

### Bugs encountered and fixed

1. **LinkedIn search URLs return no content** — These are auth-walled SPAs. Fixed by extracting `currentJobId` param and converting to public `/jobs/view/` URL.
2. **Apify 404 on LinkedIn actor** — Actor ID `apimaestro/linkedin-job-detail` created broken URL path. Fixed: `apimaestro~linkedin-job-detail`.
3. **Apify 400 on generic crawler** — `crawlerType: 'playwright'` is no longer valid. Fixed: `playwright:adaptive`.

### Lessons learned

16. **LinkedIn blocks all generic scraping.** Direct fetch, headless browsers, and Apify's generic crawler all fail. Dedicated actors that use LinkedIn's API are the only reliable approach.

17. **Apify actor IDs use tilde, not slash.** `apimaestro/linkedin-job-detail` in the REST API URL becomes a path separator, not an actor namespace. Must be `apimaestro~linkedin-job-detail`.

18. **Apify crawler types evolve.** The `website-content-crawler` actor changed its allowed `crawlerType` values. `playwright` → `playwright:adaptive` or `playwright:firefox`.

19. **URL-first UX is superior to URL-as-option.** When the most common use case is pasting a URL, make it the first thing the user sees, not a secondary toggle buried in a textarea.

### New files added this session
| File | Purpose |
|------|---------|
| `lib/apify.ts` | Apify client (LinkedIn + generic) |
| `lib/scrape.ts` | Claude JD extraction from raw text |
| `app/api/scrape/route.ts` | Scrape API endpoint |

### Branch
- `claude/continue-portfolio-development-KIi2A`
- PR #6 merged to main
