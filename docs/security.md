# Security

What's hardened, what's not, and the ops checklist.

## Threat model

- **Admin password leak** → attacker publishes fabricated resumes under your domain, burns your Claude API credits, writes to your repo
- **XSS on a targeted resume page** → attacker who crafts a malicious job description causes scripts to run in an HR recruiter's browser
- **Cookie theft** → attacker extracts `profile_lock` and bypasses isolation
- **SSRF via URL scraping** → attacker uses your scrape endpoint to probe internal infra
- **API abuse** → attacker hammers `/api/generate` to drain your Claude credits

## What Phase 4 hardened

### Admin auth (`lib/auth.ts`)

- Single shared `requireAuth()` helper replaces duplicated checks across 7 routes
- `crypto.timingSafeEqual` instead of `===` for plaintext comparison
- Supports bcrypt-hashed `ADMIN_PASSWORD` (auto-detected by `$2a$/$2b$/$2y$` prefix)
- Plaintext still works for backward compat during rotation

**To rotate to a hashed password:**

```bash
cd <your-repo>
node scripts/hash-password.mjs "your-real-password"
```

Paste the `$2b$…` output into the Vercel env var `ADMIN_PASSWORD` (all environments). Redeploy. Your plaintext password still logs you in — only the stored form changed.

If you don't have the repo cloned:

```bash
npx -y -p bcryptjs node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "your-real-password"
```

Or on macOS:

```bash
htpasswd -bnBC 12 "" "your-real-password" | tr -d ':\n'
```

### XSS sanitization (`lib/sanitize.ts`)

Every `dangerouslySetInnerHTML` on user/AI-controlled data now runs through `sanitizeInlineHtml()`, which strips all tags except `<em>` and `<br>` and escapes everything else.

Closes the prompt-injection vector where a crafted JD could make Claude emit `<script>…` into `hero.headline` or a custom section item.

Covered:
- `components/Hero.tsx` — headline
- `components/CustomSection.tsx` — title, items
- `components/ResumePrint.tsx` — skills
- `components/ResumeLayout.tsx` — footer
- `app/admin/_components/EditablePreview.tsx` — preview values
- `app/admin/_components/GeneratedPreview.tsx` — preview headline

### Cookie hardening (`middleware.ts`)

`profile_lock` cookie now has:
- `httpOnly: true` — JS can't read it, so XSS can't steal it
- `secure: true` in production — only sent over HTTPS
- `sameSite: 'lax'` — not sent on cross-site POSTs
- Slug regex-validated (`/^[a-z0-9-]{1,120}$/`) before being written to the cookie or used in the redirect path

### Rate limiting (`lib/rate-limit.ts`)

In-memory per-IP token bucket, per-endpoint:

| Endpoint | Limit |
|---|---|
| `/api/generate` | 10 / min |
| `/api/adapt` | 10 / min |
| `/api/ai-edit` | 30 / min |
| `/api/scrape` | 15 / min |
| `/api/profiles` (POST) | 10 / min |
| `/api/profiles/[slug]` (PATCH) | 20 / min |
| `/api/profiles/[slug]` (DELETE) | 10 / min |
| All read endpoints | 60 / min |

Returns 429 with `Retry-After` and `X-RateLimit-*` headers.

**Caveat:** each Vercel serverless instance holds its own in-memory map. An attacker distributing requests across cold starts can exceed the per-instance limit. This deters casual abuse but isn't strict across instances.

**Upgrade path:** swap in [`@upstash/ratelimit`](https://github.com/upstash/ratelimit-js) with Upstash Redis. Requires adding `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.

### Input validation

All mutating API routes validate:

- Slug format: `/^[a-z0-9-]{1,120}$/`
- Size caps: JD 20k chars, instruction 5k, overrides 200k bytes, URL 2k, names 200, ai-edit text 4k
- Type checks on every body field (not just existence)
- Date format: `YYYY-MM-DD`

### URL scraping (SSRF prevention)

`/api/scrape` blocks:
- Non-`http(s)` schemes (`file:`, `ftp:`, `gopher:`, etc.)
- Private/loopback hosts: `localhost`, `127/8`, `10/8`, `192.168/16`, `172.16-31/12`, `169.254/16`, `::1`, `fc00::/7`, `fe80::/10`

Since scraping goes through Apify (external), SSRF risk is on them, but the upfront block prevents the endpoint from being a free proxy.

## What isn't covered (and why)

### CSRF protection

Not implemented. The admin uses an `x-admin-password` request header, which the browser doesn't automatically attach to cross-origin requests unless the client code explicitly sets it. So cross-origin attacker pages can't trigger mutations. If the auth were cookie-based, CSRF would matter — it isn't.

### GitHub PAT scope

Currently relies on whatever permissions you granted the token. **Tighten this in GitHub UI:**

1. Go to GitHub → Settings → Developer settings → Fine-grained tokens
2. Generate a new token with:
   - **Repository access**: only your fork
   - **Permissions**: `Contents: Read and write` only (nothing else)
3. Update `GITHUB_TOKEN` in Vercel, redeploy, verify publish still works
4. Revoke the old token

### Secrets in client bundles

None of the API keys are exposed to the browser — all Claude/Apify/GitHub calls happen server-side in API routes. Verify by searching the Vercel build output for `ANTHROPIC_API_KEY` etc. (should return zero matches).

## Ops checklist (post-deploy)

- [ ] Rotated `ADMIN_PASSWORD` to a bcrypt hash
- [ ] Tightened `GITHUB_TOKEN` to `Contents: read/write` on the fork only
- [ ] Verified in Chrome DevTools that `profile_lock` cookie shows `HttpOnly ✓` and `Secure ✓`
- [ ] Published a test profile and confirmed it lands on `main`
- [ ] Confirmed rate limiting by hammering `/api/generate` — should return 429 after 10 calls
- [ ] Confirmed a `<script>` in an AI-generated field renders as plain text, not executable code

## Reporting

If you find a security issue, please email the maintainer directly rather than opening a public issue.
