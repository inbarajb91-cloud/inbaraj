# Admin guide

Using the `/admin` dashboard to tailor and publish resumes.

## Logging in

Visit `/admin`. Enter `ADMIN_PASSWORD`. The dashboard loads with three tab types:

- **Base Resume** — read-only iframe of your public resume
- **+ Tailor for a Company** — opens the creation wizard
- **One dropdown** per published profile

Your session persists across refreshes via `sessionStorage`. Closing the tab logs you out.

## Three ways to create a resume

The wizard opens at a single choice:

1. **URL-based** (recommended) — paste a job posting link, Claude extracts company/role/JD automatically
2. **Manual** — type company, role, and JD yourself (use "or enter details manually")
3. **Adapt from existing** — pick a source resume (base or a published profile) and describe what to change

### URL path

Supported:
- LinkedIn job posts (via a dedicated actor that uses LinkedIn's data API)
- Most company career pages (Greenhouse, Lever, Workable, custom sites)

After pasting, the wizard scrapes the page and shows a **Confirm** step with the extracted company, role, and JD pre-filled. Edit anything that looks wrong before continuing.

If scraping fails, click "or enter details manually" to fall back to typed input.

### Manual path

Three screens, one field each:
1. What company?
2. What role? (optional)
3. Paste the job description

### Adapt path

Two steps:
1. Pick a source (Base Resume, or any published profile)
2. Company + role (optional) + a plain-English instruction like "shorten to 1 page" or "emphasize data-migration experience"

**Default variants**: adapting the base without a company name creates `/r/d-<role-label>` — useful for generic role-specific versions like `/r/d-implementation-lead`.

## The tailoring run

Once you confirm inputs:

1. **Processing** — 4-step progress indicator (Reading → Tailoring → Checking → Almost done). Click **Cancel** to abort.
2. **Review** — generated result with:
   - A **validation banner** showing any claims the AI may have fabricated
   - **Keep / Remove** buttons on each flagged violation (Keep prompts for an optional reason)
   - **Compare Changes** toggle to see Base vs. Tailored side-by-side
   - **Edit** toggle to click-to-edit any text field inline (with AI assist)

The AI assist works field-by-field: click a field → "✦ AI" → describe the change → accept/reject/retry.

3. **Publish** — commits the profile JSON + registry update to the repo. Watches Vercel rebuild (~60s) and switches to a live indicator.

## Post-publish editing

Open any published profile's tab:
- **View** tab shows an iframe of the live page
- **Edit** button switches to the formatted preview with click-to-edit

Saved edits commit via `PATCH /api/profiles/[slug]` and update `ground-truth.json` best-effort so new text feeds back into future AI generations.

## Deleting a profile

Open the profile tab → Delete. This only removes the registry entry; the JSON file stays in git history. The public URL `/r/<slug>` returns 404 after deletion.

## Cost awareness

Each generation = 2–3 Claude API calls (tailor + validate + optional retries). Each AI-assist edit = 1 call. Each scrape on a generic URL = 1 Apify crawl + 1 Claude extraction.

The **Revise** button during review warns before discarding because regeneration re-spends API credits.

## Gotchas

- **"Unauthorized" after successful login** — Vercel env var scope mismatch. Ensure `ADMIN_PASSWORD` is set for the environment you're hitting.
- **Published profile returns 404** — `GITHUB_BRANCH` is wrong, or Vercel is still building. The GitHub API fallback (`loadProfile`) should catch this even before rebuild completes.
- **AI flags everything or nothing** — the validator uses semantic matching against `ground-truth.json`. If ground truth is thin, everything looks fabricated. If it's bloated with AI-generated content from past runs, nothing gets flagged.
- **Print preview doesn't match the web** — the PDF is rendered by a separate component (`ResumePrint.tsx`) with its own layout. Edits to the web page don't automatically appear in the PDF.
