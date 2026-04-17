# Customizing your resume

Your base resume lives in a single file: `data/base.json`. Everything rendered at `/` comes from this file.

## Top-level structure

```json
{
  "personal": { ... },
  "hero": { ... },
  "stats": [ ... ],
  "summary": "...",
  "experience": [ ... ],
  "projects": [ ... ],
  "skills": [ ... ],
  "education": [ ... ],
  "booking": { ... },
  "contact": { ... },
  "footer": "..."
}
```

## Section-by-section

### `personal`

Identity and contact info. Used in the header and PDF.

```json
{
  "name": "Your Name",
  "title": "Your Role",
  "email": "you@example.com",
  "phone": "+1 555 0100",
  "location": "City, Country",
  "calendly": "https://calendly.com/you/30min",
  "links": {
    "github": "https://github.com/you",
    "linkedin": "https://linkedin.com/in/you"
  }
}
```

**Gotcha:** `calendly` is the full URL. Don't wrap it in another `https://calendly.com/` — that bug cost a session to track down.

### `hero`

The big intro block on the homepage.

```json
{
  "tag": "Open to opportunities",
  "headline": "Implementation <em>leader</em> who ships enterprise SaaS",
  "description": "One-paragraph pitch.",
  "badges": [
    { "text": "Remote", "variant": "purple" },
    { "text": "Chennai", "variant": "teal" }
  ]
}
```

`headline` supports `<em>` for the italic accent word. **No other HTML is allowed** — the sanitizer strips everything else (`<br>` is also allowed but rare in a headline).

`variant` must be one of: `purple`, `teal`, `amber`, `cs`.

### `stats`

Four metric cards on the right of the hero.

```json
[
  { "value": "$4.1M+", "label": "Contract value", "sub": "Delivered", "color": "purple" },
  ...
]
```

### `summary`

One-paragraph professional summary. Rendered in the PDF only (not on the web page).

### `experience`

Array of roles. Each role:

```json
{
  "title": "Lead, Product Implementation",
  "company": "Facilio",
  "location": "Chennai",
  "start": "Nov 2021",
  "end": "Present",
  "description": "Short context sentence.",
  "bullets": [
    "Concrete, metric-bearing bullet.",
    "Another."
  ],
  "highlights": [
    { "title": "Framework", "text": "Longer narrative card." }
  ]
}
```

- `bullets` render as a list under the role
- `highlights` render as cards below the bullets (and in a 2-col grid in the PDF)

### `projects`

```json
[
  {
    "name": "FM Engine",
    "tag": "WhatsApp CMMS",
    "description": "What it does, in one sentence.",
    "tech": ["Next.js", "Twilio", "Postgres"],
    "link": "https://fmengine.example"
  }
]
```

### `skills`

Grouped skill lists.

```json
[
  { "title": "Implementation", "items": ["BRD", "UAT", "..."] },
  { "title": "Tools", "items": ["Postman", "Figma", "..."] }
]
```

Items render as pills in the web view and as a newline-separated list in the PDF.

### `education`

```json
[
  {
    "degree": "M.Tech Embedded Systems",
    "school": "Hindustan University",
    "location": "Chennai",
    "year": "2015",
    "detail": "Optional one-liner"
  }
]
```

### `booking`

Calendly section content.

```json
{
  "heading": "Book a <em>call</em>",
  "description": "One-paragraph CTA."
}
```

The Calendly URL itself comes from `personal.calendly` — don't duplicate it here.

### `contact`

```json
{
  "heading": "Let's <em>talk</em>",
  "description": "One-paragraph CTA."
}
```

### `footer`

Plain text with middot separators:

```json
"footer": "Your Name · City · you@example.com · +1 555 0100"
```

No HTML. The sanitizer strips tags from this field.

## Ground truth

After editing `base.json`, also update `data/ground-truth.json`. This is the "verified facts" file the AI consults when tailoring, to avoid fabricating claims.

Add entries to the relevant arrays:
- `skills` — every skill that appears in your base resume
- `metrics` — every number, dollar amount, or percentage
- `bullets` — every experience bullet verbatim
- `highlights` — every highlight card text
- `companies` / `titles` / `tools` — names that belong on your resume

The AI will warn you in the admin review screen if it produces claims not found here.

## Live updates

Once deployed, editing `base.json` locally → pushing to `main` triggers a Vercel redeploy in ~60s. Alternatively, use the admin dashboard's inline editor to edit *profile overrides* (not the base), which commits individual field changes via the GitHub API.

## Hiding sections

To hide a section for a specific profile (not the base), set it to `false` in the profile's override JSON:

```json
{
  "projects": false,
  "booking": false
}
```

In `base.json`, just omit the field entirely if you don't want it — don't set it to `false`.
