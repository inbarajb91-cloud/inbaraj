# memory.md

Chronological history of decisions, changes, and lessons learned across sessions.

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

## Lessons learned

1. **Static imports in Next.js are build-time snapshots.** Any data imported via `import x from './file.json'` is baked into the build. For dynamic data, read from an API or filesystem at request time.

2. **Vercel filesystem is read-only in production.** You can't `fs.writeFile` on deployed functions. Use external storage (GitHub API in our case) for persistence.

3. **Vercel env vars have environment scopes.** "Production", "Preview", and "Development" are separate. A var set for Production won't be available in Preview deployments.

4. **Middleware cookies affect iframes.** If middleware sets cookies on page visits, iframes loading those pages will also trigger the cookie logic. Use `sec-fetch-dest` header to detect iframe requests.

5. **Claude sometimes wraps JSON in code fences** despite explicit instructions not to. Always strip ` ```json ``` ` before parsing.

6. **`html2canvas` hangs on `position:fixed` off-screen elements.** `window.print()` with `@media print` CSS is far more reliable for PDF generation.

7. **Project-level vs team-level settings in Vercel** — env vars, domain settings, and framework presets all need to be at the project level.
