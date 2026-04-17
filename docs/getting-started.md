# Getting started

End-to-end: fork the repo, set up env vars, deploy to Vercel, create your first tailored resume.

## 1. Fork and clone

```bash
git clone https://github.com/<you>/<your-fork>.git
cd <your-fork>
npm install
```

## 2. Point the GitHub API at your fork

`lib/github.ts` has two constants at the top:

```ts
const OWNER = 'inbarajb91-cloud';
const REPO = 'inbaraj';
```

Change these to your GitHub username and repo name. These tell the admin dashboard where to commit published profile JSONs.

## 3. Fill in env vars

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

| Variable | What it is | Where to get it |
|---|---|---|
| `ADMIN_PASSWORD` | Password for the `/admin` dashboard | Pick one. For production, bcrypt-hash it — see [security.md](security.md) |
| `ANTHROPIC_API_KEY` | Claude API key | [console.anthropic.com](https://console.anthropic.com/) |
| `APIFY_API_KEY` | Apify token (optional, for URL scraping) | [apify.com/account](https://apify.com/account) |
| `GITHUB_TOKEN` | Fine-grained PAT, `Contents: read/write` on your fork only | GitHub → Settings → Developer settings → Fine-grained tokens |
| `GITHUB_BRANCH` | Branch the admin commits profiles to — **must** be the branch Vercel auto-deploys from (usually `main`) | Just `main` |

**Critical:** `GITHUB_BRANCH` must match your Vercel deploy branch. If it points at a feature branch, every profile you publish from the admin will land on that branch and never reach production. (This actually happened on the author's deployment — 5 profiles were stranded for a week. See `memory.md` Session 9.)

## 4. Customize your base resume

Edit `data/base.json`. See [customizing-your-resume.md](customizing-your-resume.md) for the schema and field-by-field guidance.

Also update `data/ground-truth.json` — this is the verified-facts file used by the AI to avoid fabricating content. For a first run, you can just copy the relevant arrays out of `base.json`.

## 5. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. Your resume should render at `/`.

Visit `/admin`, log in with `ADMIN_PASSWORD`, and try creating a profile from a sample job description.

## 6. Deploy to Vercel

1. Push your fork to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your fork
3. In the project's **Environment Variables** settings, paste every variable from `.env.local`.
   - Enable each one for **Production**, **Preview**, and **Development** environments
   - Env vars **must be at the project level**, not the team level (this trips people up)
4. Deploy

Once live, visit `your-domain.vercel.app/admin` and publish a real profile.

## 7. Custom domain (optional)

In Vercel → Settings → Domains, add your domain. Point the DNS A/CNAME record to Vercel's IPs per their instructions.

## Troubleshooting

- **"Unauthorized" in admin**: env var scope mismatch (Preview vs Production vs Development), or `ADMIN_PASSWORD` has stray whitespace
- **Published profile doesn't appear at `/r/<slug>`**: `GITHUB_BRANCH` is wrong, or the build hasn't finished — wait ~60s and refresh
- **LinkedIn scraping returns empty**: LinkedIn URLs must be public job pages. Search-page URLs with `?currentJobId=` are auto-normalized
- **Generic scraping returns nothing useful**: some sites (Greenhouse, Lever) work; SPAs with aggressive anti-bot may not

More tips in [CLAUDE.md](../CLAUDE.md) under "Gotchas".
