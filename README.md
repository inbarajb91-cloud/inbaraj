# Resume Studio

A personal portfolio site with an **AI-powered admin dashboard** that tailors your resume to individual job postings and publishes each tailored version at its own URL.

Live example: [inbaraj.info](https://inbaraj.info)

## What it does

- **Public portfolio** — your base resume at `/`
- **Targeted resumes** — paste a job description (or a job posting URL) into the admin, Claude tailors the resume, you review, edit inline, and publish to `/r/<company-slug>`
- **Cookie-based isolation** — whoever visits a targeted link is locked to that page; they can't discover the base resume or other targeted versions
- **PDF download** — any version can be downloaded as a 2-page A4 PDF via the browser's print engine
- **No database** — profile data is committed to the Git repo as JSON via the GitHub Contents API

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Vanilla CSS with CSS variables |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Scraping | Apify (LinkedIn actor + generic web crawler) |
| Storage | GitHub Contents API (JSON files in the repo) |
| Deploy | Vercel |

## Quick start

1. Fork this repo and clone it
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in the values (see [docs/getting-started.md](docs/getting-started.md))
4. `npm run dev` → open `http://localhost:3000`
5. Deploy to Vercel (one-click from the GitHub integration)

## Documentation

- **[Getting started](docs/getting-started.md)** — fork, env vars, first deploy
- **[Customizing your resume](docs/customizing-your-resume.md)** — editing `data/base.json`
- **[Admin guide](docs/admin-guide.md)** — using the wizard to tailor and publish
- **[Architecture](docs/architecture.md)** — how data flows, for contributors
- **[Security](docs/security.md)** — what's hardened and the ops checklist
- **[CLAUDE.md](CLAUDE.md)** — project conventions for Claude Code sessions

## License

MIT — see [LICENSE](LICENSE).
