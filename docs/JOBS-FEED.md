# IE jobs feed ("IE jobs this week" card)

The card on the landing page and on Certifications reads `data/jobs.json`. The site never calls a job site from the browser: `scripts/fetch-jobs.mjs` collects postings on GitHub, and the deploy workflow publishes the file with the site.

## When it runs

- Every Monday at 11:17 UTC (scheduled run of `.github/workflows/deploy.yml`), and on every deploy from `main`.
- History keeps one row per week (the latest run in a week replaces that week's row), up to 12 weeks, carried over from the live file.
- If every source fails, the previous live file is kept, with a note on the card.
- The pull-request check also runs the collector against the live employer boards (no keys), only to show in the log that the boards still answer. It never fails the check.

## Sources

| Source | What it adds | Key |
|---|---|---|
| Employer careers pages on Greenhouse and Lever (list in `BOARDS` in the script) | IE-type postings straight from the employer | None |
| USAJOBS Search API | Federal postings in the Industrial Engineering series (0896), last 30 days | `USAJOBS_API_KEY` + `USAJOBS_EMAIL` |
| Adzuna Search API | US totals per role for the last 7 days (the card's counts) and the newest postings; shown as "Jobs by Adzuna" | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` |

What the counts mean, stated on the card: with Adzuna, the US total of postings in the last 7 days with the role in the job title; without it, the IE-type roles open right now on the employer pages plus USAJOBS postings from the last 30 days (a sample; employer boards keep roles open for months, so a 7-day window left almost nothing). Trends only compare weeks counted the same way.

Role matching is by job title (`ROLES` in `src/lib/jobsFeed.ts`), so a Quality Inspector or a Financial Planner is not counted.

## Turning on USAJOBS and Adzuna (owner, about 10 minutes)

1. **USAJOBS key:** fill in the request form at https://developer.usajobs.gov/apirequest/ . The key arrives by email. Keep the email address you used: it is sent with every request.
2. **Adzuna key:** register at https://developer.adzuna.com/ and copy the Application ID and Application Key from your dashboard.
3. **Add them to GitHub:** repo `zubayer/ie-launchpads` → Settings → Secrets and variables → Actions → New repository secret. Add four secrets with exactly these names:
   - `USAJOBS_API_KEY`
   - `USAJOBS_EMAIL`
   - `ADZUNA_APP_ID`
   - `ADZUNA_APP_KEY`
4. **Run it once:** Actions → "Deploy V2 to GitHub Pages" → Run workflow (branch `main`). The "Collect this week's IE job postings" step prints each source with ✓ or ✗.

The keys live only in GitHub secrets; they are never written into the site.

## Changing the employer list

Edit `BOARDS` in `scripts/fetch-jobs.mjs`. A Greenhouse board token is the last part of `job-boards.greenhouse.io/<token>`; a Lever one is `jobs.lever.co/<token>`. A token that stops working shows as ✗ in the log and as "Not included this week" on the card.
