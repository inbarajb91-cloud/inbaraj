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

### Phase 0 — Anti-hallucination agent (CRITICAL, next)

- [ ] Ground truth file (`data/ground-truth.json`) — verified facts from base + manual edits
- [ ] Validation step — second Claude call compares output against ground truth
- [ ] Validation loop — re-prompt with specific feedback on failures (max 2 retries)
- [ ] Zod schema enforcement on AI output structure
- [ ] Diff view — toggle button highlights all changes from base before publishing
- [ ] Structured logging — input, output, validation results, user edits per generation

### Phase 1 — Agentic UX overhaul

- [ ] Replace tech jargon with user-friendly language throughout admin
- [ ] Conversational agent wrapper — feels like talking to an assistant
- [ ] Progress states visible without technical detail
- [ ] Package generation as a multi-step agent with visible workflow states

### Phase 2 — URL-based JD scraping

- [ ] Apify integration — paste a URL instead of raw JD text
- [ ] `APIFY_API_KEY` env var and scraper API route
- [ ] Support LinkedIn job posts, company careers pages
- [ ] Fallback to manual paste if scrape fails

### Phase 3 — Inline editing with AI assist

- [ ] Highlight-to-edit on resume preview — select text, popup appears
- [ ] Manual edit option — inline text editor overlay
- [ ] AI assist option — describe change, agent asks clarifying questions, updates on confirmation
- [ ] Manual edits feed back into ground truth for future generations
- [ ] Works within admin iframe preview

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
