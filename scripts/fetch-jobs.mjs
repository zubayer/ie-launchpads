#!/usr/bin/env node
/*
 * Collects this week's IE job postings and writes public/data/jobs.json for the "IE jobs this week" card.
 * Run by .github/workflows/deploy.yml before the build (weekly, and on every deploy). Never fails the build:
 * a source that errors is recorded as such, and if every source fails the previous live file is kept.
 *
 * Sources (all read-only, all official):
 *   - Employer careers pages on Greenhouse and Lever: public job-board APIs, no key.
 *   - USAJOBS Search API (US Office of Personnel Management): needs USAJOBS_API_KEY and USAJOBS_EMAIL.
 *   - Adzuna Search API (aggregator, "Jobs by Adzuna"): needs ADZUNA_APP_ID and ADZUNA_APP_KEY.
 * Keys come from GitHub Actions secrets and never reach the site.
 *
 * Writes jobs.json (summary for the card) and jobs-all.json (every open role, for the job list) side by side.
 * Usage: node scripts/fetch-jobs.mjs [--out path/jobs.json] [--now ISO]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { ROLES, EMPTY_SNAPSHOT, allPostings, buildSnapshot, classify, isAllPostings, isSnapshot } from '../src/lib/jobsFeed.ts'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const OUT = arg('--out', 'public/data/jobs.json')
const NOW = new Date(arg('--now', new Date().toISOString()))
const LIVE = process.env.JOBS_LIVE_URL || 'https://zubayer.github.io/ie-launchpads/data/jobs.json'
const env = process.env

// Employer boards: manufacturers and hardware companies whose careers pages run on Greenhouse or Lever.
// Edit freely; a token that stops working shows up as a failed source in the summary and on the card's source list.
export const BOARDS = [
  { kind: 'greenhouse', token: 'spacex', name: 'SpaceX' },
  { kind: 'greenhouse', token: 'andurilindustries', name: 'Anduril' },
  { kind: 'greenhouse', token: 'formlabs', name: 'Formlabs' },
  { kind: 'greenhouse', token: 'redwoodmaterials', name: 'Redwood Materials' },
  { kind: 'greenhouse', token: 'relativity', name: 'Relativity Space' },
  { kind: 'greenhouse', token: 'lucidmotors', name: 'Lucid Motors' },
  { kind: 'greenhouse', token: 'flyzipline', name: 'Zipline' },
  { kind: 'greenhouse', token: 'astranis', name: 'Astranis' },
  { kind: 'greenhouse', token: 'vardaspace', name: 'Varda Space' },
  { kind: 'lever', token: 'zoox', name: 'Zoox' },
]

const NOT_US = /\b(united kingdom|england|london|germany|munich|berlin|india|bangalore|canada|toronto|vancouver|australia|japan|tokyo|mexico|poland|ireland|france|paris|netherlands|spain|italy|singapore|taiwan|korea|israel|brazil|china|philippines|romania|ukraine|sweden|norway|denmark|finland|switzerland|czech)\b/i
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const iso = (v) => { const d = new Date(v); return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null }

async function getJson(url, headers = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20_000)
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally { clearTimeout(t) }
}

// An open role without a date still counts as open; it just can't appear under "Latest postings".
function keep(list, p) {
  if (!p.url || NOT_US.test(p.location)) return
  p.posted = p.posted || ''
  const role = p.role ?? classify(p.title)
  if (role) list.push({ ...p, role })
}

async function greenhouse(b, out) {
  const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${b.token}/jobs`)
  let n = 0
  for (const j of d.jobs || []) {
    const before = out.length
    // The list response gives updated_at; first_published only when the board includes it. An edit moves
    // updated_at, so such dates are labelled "updated", never "posted".
    const pub = iso(j.first_published)
    keep(out, { title: strip(j.title), company: b.name, location: strip(j.location?.name), posted: pub || iso(j.updated_at), dated: pub ? 'published' : 'updated', url: j.absolute_url, source: 'greenhouse' })
    n += out.length - before
  }
  return { open: (d.jobs || []).length, matched: n }
}

async function lever(b, out) {
  const d = await getJson(`https://api.lever.co/v0/postings/${b.token}?mode=json`)
  let n = 0
  for (const j of Array.isArray(d) ? d : []) {
    const before = out.length
    keep(out, { title: strip(j.text), company: b.name, location: strip(j.categories?.location), posted: iso(j.createdAt), dated: 'published', url: j.hostedUrl, source: 'lever' })
    n += out.length - before
  }
  return { open: Array.isArray(d) ? d.length : 0, matched: n }
}

async function usajobs(out) {
  // Occupational series 0896 is Industrial Engineering in the federal classification.
  const d = await getJson('https://data.usajobs.gov/api/search?JobCategoryCode=0896&DatePosted=30&ResultsPerPage=100', {
    Host: 'data.usajobs.gov', 'User-Agent': env.USAJOBS_EMAIL, 'Authorization-Key': env.USAJOBS_API_KEY,
  })
  const items = d?.SearchResult?.SearchResultItems || []
  const before = out.length
  for (const it of items) {
    const m = it.MatchedObjectDescriptor || {}
    const title = strip(m.PositionTitle)
    keep(out, { title, company: strip(m.OrganizationName), location: strip(m.PositionLocationDisplay), posted: iso(m.PublicationStartDate), url: m.PositionURI, source: 'usajobs', role: classify(title) ?? 'industrial' })
  }
  return { open: items.length, matched: out.length - before }
}

async function adzuna(out) {
  // Title-only matching, with no fallback: a phrase-anywhere count would be a different basis and
  // can't be compared with title counts. If it fails, Adzuna is left out and the card says so.
  const totals = {}
  for (const r of ROLES) {
    const base = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${encodeURIComponent(env.ADZUNA_APP_ID)}&app_key=${encodeURIComponent(env.ADZUNA_APP_KEY)}&results_per_page=50&max_days_old=7&sort_by=date&content-type=application/json`
    const d = await getJson(`${base}&title_only=${encodeURIComponent(r.phrase)}`)
    if (typeof d.count !== 'number') throw new Error('no count in the response')
    totals[r.id] = d.count
    for (const j of d.results || []) keep(out, { title: strip(j.title), company: strip(j.company?.display_name), location: strip(j.location?.display_name), posted: iso(j.created), dated: 'published', url: j.redirect_url, source: 'adzuna' })
  }
  return { totals }
}

const postings = []
const sources = []
let adzunaTotals

for (const b of BOARDS) {
  const url = b.kind === 'greenhouse' ? `https://job-boards.greenhouse.io/${b.token}` : `https://jobs.lever.co/${b.token}`
  try {
    const r = await (b.kind === 'greenhouse' ? greenhouse(b, postings) : lever(b, postings))
    sources.push({ id: `${b.kind}:${b.token}`, name: b.name, url, ok: true, count: r.matched, note: `${r.open} open roles, ${r.matched} IE-type` })
  } catch (e) { sources.push({ id: `${b.kind}:${b.token}`, name: b.name, url, ok: false, count: 0, note: String(e.message || e) }) }
}

if (env.USAJOBS_API_KEY && env.USAJOBS_EMAIL) {
  try { const r = await usajobs(postings); sources.push({ id: 'usajobs', name: 'USAJOBS', url: 'https://www.usajobs.gov/', ok: true, count: r.matched, note: 'Industrial Engineering series (0896), last 30 days' }) }
  catch (e) { sources.push({ id: 'usajobs', name: 'USAJOBS', url: 'https://www.usajobs.gov/', ok: false, count: 0, note: String(e.message || e) }) }
} // No key: USAJOBS is simply not used (not listed as a failed source).

if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) {
  try {
    const found = []
    const r = await adzuna(found) // all roles succeed, or none are used
    postings.push(...found)
    adzunaTotals = r.totals
    sources.push({ id: 'adzuna', name: 'Adzuna', url: 'https://www.adzuna.com/', ok: true, count: found.length, note: 'US totals by job title, last 7 days' })
  } catch (e) { sources.push({ id: 'adzuna', name: 'Adzuna', url: 'https://www.adzuna.com/', ok: false, count: 0, note: String(e.message || e) }) }
} // Off by default: the free tier is 25 test calls (docs/JOBS-FEED.md).

let previous = null
let previousAll = null
try { const p = await getJson(LIVE); if (isSnapshot(p)) previous = p } catch { /* first run, or the site is unreachable */ }
try { const p = await getJson(LIVE.replace(/jobs\.json$/, 'jobs-all.json')); if (isAllPostings(p)) previousAll = p } catch { /* first run */ }

let snap, all
if (sources.some((s) => s.ok)) {
  snap = buildSnapshot({ now: NOW, postings, sources, adzunaTotals, previous })
  all = allPostings(postings, NOW)
} else {
  snap = previous ? { ...previous, note: `Last collection failed on ${NOW.toISOString().slice(0, 10)}; showing the previous week.` } : { ...EMPTY_SNAPSHOT, sources, note: 'No source answered in the last collection.' }
  all = previousAll ?? { version: 1, generated: null, postings: [] }
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(snap, null, 1) + '\n')
writeFileSync(OUT.replace(/\.json$/, '-all.json'), JSON.stringify(all) + '\n')

console.log(`jobs feed → ${OUT} (basis: ${snap.basis}, ${all.postings.length} open roles listed, ${snap.latest.length} from the last 30 days, ${snap.history.length} week(s) of history)`)
for (const s of sources) console.log(`  ${s.ok ? '✓' : '✗'} ${s.name.padEnd(18)} ${s.note ?? ''}`)
for (const r of snap.roles) console.log(`  ${r.label.padEnd(34)} ${r.count}`)
