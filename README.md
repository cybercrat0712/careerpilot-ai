# CareerPilot AI

Local-first, AI-powered job application automation MVP. Runs entirely on your machine
using Next.js, Playwright, Prisma (SQLite), and the Gemini free tier.

## Status

This is a work-in-progress MVP. **Only the Greenhouse pipeline is implemented.**
Lever, LinkedIn, and Workday portal modules are stubbed and will throw
"not implemented yet" until built out.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```
2. Copy environment template and fill in your Gemini API key:
   ```bash
   cp .env.example .env.local
   ```
   Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Add your real details to `data/candidate.json` and place your resume at
   `data/resume.pdf`. Both are gitignored — never commit them.
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`, paste a public Greenhouse job URL, and click
   **Start Application**. A visible Chromium window will open and run the pipeline.

## Architecture

```
Dashboard (page.tsx)
  -> POST /api/apply
    -> engine.ts (orchestrator)
      -> browser.ts        (launches stealth Playwright/Chromium, headed mode)
      -> extractor.ts      (scrapes form fields into JSON schema)
      -> ai/solver.ts       (Gemini maps candidate.json -> form fields)
      -> filler.ts          (executes fill/select/check/upload actions)
      -> portals/*.ts       (per-portal orchestration, greenhouse.ts first)
    -> Prisma (SQLite)      (logs Application rows: status, screenshot, error)
```

## Build order (recommended)

1. **Greenhouse** — public form structure, no auth. Implemented.
2. **Lever** — near-identical DOM pattern to Greenhouse. Next up.
3. **Workday** — multi-step SPA wizard, re-extract DOM per step. Expect per-tenant quirks.
4. **LinkedIn Easy Apply** — requires `li_at` session cookie injection. Higher ToS risk;
   build last and treat as experimental. Capped at 5 applications/day in this MVP.

## Security notes

- `data/candidate.json`, `data/resume.pdf`, `prisma/dev.db`, and `.env*` are gitignored.
  Never remove them from `.gitignore` or commit real values.
- The `LINKEDIN_LI_AT_COOKIE` env var grants live session access to your LinkedIn
  account. Rotate/revoke it if this repo, your `.env.local`, or your machine is
  ever compromised.
- Stealth plugins here are used to avoid basic bot-fingerprinting on target sites.
  Understand each portal's Terms of Service before running automation against it,
  especially LinkedIn.

## Verification checklist

- [ ] `npx prisma studio` shows new rows in the `Application` table after a run.
- [ ] Greenhouse demo run: paste a real public Greenhouse URL, confirm fields populate
      and resume uploads before the submit click.
- [ ] Screenshot saved under `public/screenshots/<applicationId>.png` on success.
