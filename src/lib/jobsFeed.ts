/*
 * Weekly IE jobs feed: pure logic shared by the collector (scripts/fetch-jobs.mjs, run by the
 * deploy workflow) and the card in the app. No network or file access here, so it is unit-tested.
 * Plain TypeScript with no imports, so Node can run it directly with type stripping.
 */

export type RoleId = 'industrial' | 'quality' | 'ci' | 'manufacturing' | 'planning'
export type SourceId = 'adzuna' | 'usajobs' | 'greenhouse' | 'lever'

export interface Role { id: RoleId; label: string; phrase: string; title: RegExp }

// Title tests are deliberately narrow: a "Quality Inspector" or "Financial Planner" is not an IE job.
export const ROLES: Role[] = [
  { id: 'industrial', label: 'Industrial Engineer', phrase: 'industrial engineer', title: /\bindustrial (and systems )?engineer/i },
  { id: 'quality', label: 'Quality Engineer', phrase: 'quality engineer', title: /\b(supplier |manufacturing |process )?quality engineer/i },
  { id: 'ci', label: 'Continuous Improvement / Lean', phrase: 'continuous improvement', title: /\b(continuous improvement|lean|operational excellence|six sigma)\b.*\b(engineer|manager|lead|specialist|leader)\b/i },
  { id: 'manufacturing', label: 'Manufacturing / Process Engineer', phrase: 'manufacturing engineer', title: /\b(manufacturing|production|process) engineer/i },
  { id: 'planning', label: 'Production / Supply Planner', phrase: 'production planner', title: /\b(production|supply|material|materials|demand|master) (planner|scheduler)\b/i },
]

export function classify(title: string): RoleId | null {
  // Order matters: "Manufacturing Quality Engineer" is a quality job, "Industrial Engineer" beats "process engineer".
  for (const r of ROLES) if (r.title.test(title)) return r.id
  return null
}

export interface Posting {
  title: string
  company: string
  location: string
  posted: string // ISO date (YYYY-MM-DD), or '' when the source gives none (still counted as open, never listed as latest)
  dated?: 'published' | 'updated' // 'updated' when the source only gives a last-edited date
  url: string
  source: SourceId
  role: RoleId
}

export interface SourceStatus { id: SourceId | string; name: string; url: string; ok: boolean; count: number; note?: string }
export interface WeekCounts { week: string; basis: Basis; counts: Partial<Record<RoleId, number>> }
export type Basis = 'adzuna-total' | 'collected'

export interface Snapshot {
  version: 1
  generated: string | null
  basis: Basis
  sources: SourceStatus[]
  roles: { id: RoleId; label: string; count: number }[]
  history: WeekCounts[]
  latest: Posting[]
  note?: string
}

export const EMPTY_SNAPSHOT: Snapshot = {
  version: 1, generated: null, basis: 'collected', sources: [], history: [], latest: [],
  roles: ROLES.map((r) => ({ id: r.id, label: r.label, count: 0 })),
  note: 'The first collection runs when the site is next deployed from main.',
}

const day = (d: Date) => d.toISOString().slice(0, 10)

/** Monday (UTC) of the week a date falls in, as YYYY-MM-DD: one history row per week. */
export function weekOf(iso: string): string {
  const d = new Date(iso)
  const shift = (d.getUTCDay() + 6) % 7
  return day(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - shift)))
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** One posting per employer + title + city: aggregators repeat the same ad from several boards. */
export function dedupe(list: Posting[]): Posting[] {
  const seen = new Map<string, Posting>()
  const rank: Record<SourceId, number> = { greenhouse: 0, lever: 0, usajobs: 1, adzuna: 2 } // prefer the employer's own page
  for (const p of list) {
    const k = `${norm(p.company)}|${norm(p.title)}|${norm(p.location.split(',')[0] || '')}`
    const prev = seen.get(k)
    if (!prev || rank[p.source] < rank[prev.source]) seen.set(k, p)
  }
  return [...seen.values()]
}

export function within(iso: string, days: number, now: Date): boolean {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) && now.getTime() - t <= days * 86_400_000 && t <= now.getTime() + 86_400_000
}

/** Keep the previous weeks, replace this week's row (the site can deploy several times a week), cap at 12. */
export function mergeHistory(prev: WeekCounts[] | undefined, row: WeekCounts): WeekCounts[] {
  const rest = (prev || []).filter((h) => h.week !== row.week)
  return [...rest, row].sort((a, b) => a.week.localeCompare(b.week)).slice(-12)
}

/**
 * Change against the most recent earlier week counted the same way; null when there is no such week.
 * `pct` is null when that week had none (a percentage of zero is meaningless), so the card says "new".
 */
export function trend(s: Snapshot, role: RoleId): { pct: number | null; from: string } | null {
  const cur = s.history[s.history.length - 1]
  if (!cur) return null
  const prev = [...s.history].reverse().find((h) => h.week < cur.week && h.basis === cur.basis)
  const now = cur.counts[role]
  if (!prev || now == null || prev.counts[role] == null) return null
  const before = prev.counts[role] as number
  return { pct: before === 0 ? null : Math.round(((now - before) / before) * 100), from: prev.week }
}

/**
 * Build the snapshot. Role counts: when Adzuna answered, its US total for each role in the last
 * 7 days (a market-wide number); otherwise the de-duplicated roles open right now on the employer
 * pages, plus USAJOBS postings from the last 30 days (a sample). `basis` records which.
 * (Employer boards keep roles open for months, so a 7-day window there leaves almost nothing.)
 */
export function buildSnapshot(opts: {
  now: Date
  postings: Posting[]
  sources: SourceStatus[]
  adzunaTotals?: Partial<Record<RoleId, number>>
  previous?: Snapshot | null
}): Snapshot {
  const { now } = opts
  const all = dedupe(opts.postings)
  const recent = all.filter((p) => within(p.posted, 30, now))
  const totals = opts.adzunaTotals
  const basis: Basis = totals && ROLES.every((r) => typeof totals[r.id] === 'number') ? 'adzuna-total' : 'collected'
  const counts = Object.fromEntries(ROLES.map((r) => [r.id, basis === 'adzuna-total' ? (totals![r.id] as number) : all.filter((p) => p.role === r.id).length])) as Record<RoleId, number>
  const history = mergeHistory(opts.previous?.history, { week: weekOf(now.toISOString()), basis, counts })
  return {
    version: 1,
    generated: now.toISOString(),
    basis,
    sources: opts.sources,
    roles: ROLES.map((r) => ({ id: r.id, label: r.label, count: counts[r.id] })),
    history,
    latest: recent.sort((a, b) => b.posted.localeCompare(a.posted)).slice(0, 40),
  }
}

/** Sanity check on a file fetched from the network before the app or the collector trusts it. */
export function isSnapshot(x: unknown): x is Snapshot {
  const s = x as Snapshot
  return !!s && s.version === 1 && Array.isArray(s.roles) && Array.isArray(s.history) && Array.isArray(s.latest) && Array.isArray(s.sources)
}
