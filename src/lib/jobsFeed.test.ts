import { describe, expect, it } from 'vitest'
import { EMPTY_SNAPSHOT, allPostings, buildSnapshot, classify, dedupe, filterPostings, isAllPostings, isRole, isSnapshot, mergeHistory, pageWindow, paginate, sortPostings, trend, weekOf, type Posting } from './jobsFeed'

const p = (title: string, extra: Partial<Posting> = {}): Posting => ({
  title, company: 'Acme', location: 'Austin, TX', posted: '2026-11-25', url: `https://x/${title}`, source: 'greenhouse', role: classify(title)!, ...extra,
})

describe('jobs feed', () => {
  it('classifies IE titles and rejects look-alikes', () => {
    expect(classify('Industrial Engineer II')).toBe('industrial')
    expect(classify('Sr. Industrial and Systems Engineer')).toBe('industrial')
    expect(classify('Supplier Quality Engineer')).toBe('quality')
    expect(classify('Manufacturing Quality Engineer')).toBe('quality')
    expect(classify('Continuous Improvement Engineer')).toBe('ci')
    expect(classify('Lean Manufacturing Manager')).toBe('ci')
    expect(classify('Process Engineer, Battery Cells')).toBe('manufacturing')
    expect(classify('Production Planner')).toBe('planning')
    expect(classify('Materials Planner / Buyer')).toBe('planning')
    for (const t of ['Quality Inspector', 'Financial Planner', 'Software Engineer', 'Lean Six Sigma Analyst intern', 'Event Planner']) expect(classify(t)).toBeNull()
  })

  it('keeps one copy of an ad, preferring the employer page over an aggregator', () => {
    const out = dedupe([
      p('Quality Engineer', { source: 'adzuna', url: 'https://adzuna/1', location: 'Austin, Texas' }),
      p('Quality  Engineer', { source: 'greenhouse', url: 'https://acme/1' }),
      p('Quality Engineer', { location: 'Dallas, TX', url: 'https://acme/2' }),
    ])
    expect(out).toHaveLength(2)
    expect(out.find((x) => x.location.startsWith('Austin'))!.url).toBe('https://acme/1')
  })

  it('buckets history by week and keeps one row per week', () => {
    expect(weekOf('2026-11-27T18:00:00Z')).toBe('2026-11-23') // a Friday → its Monday
    expect(weekOf('2026-11-23T00:00:00Z')).toBe('2026-11-23')
    const h = mergeHistory([{ week: '2026-11-16', basis: 'collected', counts: { quality: 4 } }, { week: '2026-11-23', basis: 'collected', counts: { quality: 5 } }], { week: '2026-11-23', basis: 'collected', counts: { quality: 6 } })
    expect(h.map((x) => x.counts.quality)).toEqual([4, 6])
    expect(mergeHistory(Array.from({ length: 14 }, (_, i) => ({ week: `2026-0${1 + Math.floor(i / 5)}-1${i % 5}`, basis: 'collected' as const, counts: {} })), { week: '2026-12-01', basis: 'collected', counts: {} })).toHaveLength(12)
  })

  it('without Adzuna, counts every open collected role and lists only the last 30 days', () => {
    const now = new Date('2026-11-27T12:00:00Z')
    const s = buildSnapshot({ now, sources: [], postings: [p('Quality Engineer'), p('Industrial Engineer', { posted: '2026-11-10' }), p('Industrial Engineer', { posted: '2026-09-01', url: 'old', location: 'Reno, NV' })] })
    expect(s.basis).toBe('collected')
    expect(s.roles.find((r) => r.id === 'quality')!.count).toBe(1)
    expect(s.roles.find((r) => r.id === 'industrial')!.count).toBe(2) // both still open, whatever their date
    expect(s.latest.map((x) => x.url)).not.toContain('old') // but only the last 30 days are listed as latest
    expect(isSnapshot(s)).toBe(true)
  })

  it('uses Adzuna totals only when every role has one, and compares like with like', () => {
    const now = new Date('2026-11-27T12:00:00Z')
    const totals = { industrial: 120, quality: 150, ci: 60, manufacturing: 300, planning: 40 }
    const prev = { ...EMPTY_SNAPSHOT, history: [{ week: '2026-11-09', basis: 'adzuna-total' as const, counts: { quality: 100 } }, { week: '2026-11-16', basis: 'collected' as const, counts: { quality: 3 } }] }
    const s = buildSnapshot({ now, sources: [], postings: [], adzunaTotals: totals, previous: prev })
    expect(s.basis).toBe('adzuna-total')
    expect(trend(s, 'quality')).toEqual({ pct: 50, from: '2026-11-09' }) // skips the week counted the other way
    expect(trend(s, 'ci')).toBeNull() // that week has no count for this role
  })

  it('compares with the latest comparable week even when it was zero (10, 0, 5 is a rise, not a fall)', () => {
    const counts = (n: number) => ({ quality: n })
    const s = { ...EMPTY_SNAPSHOT, history: [{ week: '2026-11-09', basis: 'collected' as const, counts: counts(10) }, { week: '2026-11-16', basis: 'collected' as const, counts: counts(0) }, { week: '2026-11-23', basis: 'collected' as const, counts: counts(5) }] }
    expect(trend(s, 'quality')).toEqual({ pct: null, from: '2026-11-16' })
    expect(trend({ ...s, history: s.history.slice(0, 2) }, 'quality')).toEqual({ pct: -100, from: '2026-11-09' })
  })

  it('counts undated open roles but never lists them as latest', () => {
    const now = new Date('2026-11-27T12:00:00Z')
    const s = buildSnapshot({ now, sources: [], postings: [p('Quality Engineer', { posted: '' }), p('Production Planner')] })
    expect(s.roles.find((r) => r.id === 'quality')!.count).toBe(1)
    expect(s.latest.map((x) => x.title)).toEqual(['Production Planner'])
    expect(buildSnapshot({ now, sources: [], postings: [], adzunaTotals: { quality: 5 } }).basis).toBe('collected')
  })

  it('rejects a malformed file', () => {
    expect(isSnapshot({ version: 2 })).toBe(false)
    expect(isSnapshot(null)).toBe(false)
    expect(isSnapshot(EMPTY_SNAPSHOT)).toBe(true)
  })

  it('lists every open role newest first, undated last, without duplicates', () => {
    const list = [p('Quality Engineer', { posted: '' , url: 'u1', location: 'Reno, NV' }), p('Production Planner', { posted: '2026-11-20' }), p('Industrial Engineer', { posted: '2026-11-26' }), p('Industrial Engineer', { posted: '2026-11-26', source: 'adzuna', url: 'dup' })]
    expect(sortPostings(list).map((x) => x.posted)).toEqual(['2026-11-26', '2026-11-26', '2026-11-20', ''])
    const all = allPostings(list, new Date('2026-11-27T12:00:00Z'))
    expect(all.postings).toHaveLength(3)
    expect(all.postings.at(-1)!.posted).toBe('')
    expect(isAllPostings(all)).toBe(true)
    expect(isAllPostings({ version: 1 })).toBe(false)
  })

  it('filters by role and by every search word across title, company and place', () => {
    const list = [p('Quality Engineer', { company: 'SpaceX', location: 'Hawthorne, CA' }), p('Supplier Quality Engineer', { company: 'Anduril', location: 'Austin, TX', url: 'b' }), p('Industrial Engineer', { location: 'Austin, TX', url: 'c' })]
    expect(filterPostings(list, { role: 'quality' })).toHaveLength(2)
    expect(filterPostings(list, { q: 'austin' })).toHaveLength(2)
    expect(filterPostings(list, { role: 'quality', q: 'Anduril, TX' }).map((x) => x.url)).toEqual(['b'])
    expect(filterPostings(list, { role: null, q: '  ' })).toHaveLength(3)
  })

  it('pages a list, clamping stale page numbers, and shows a compact page window', () => {
    const n = Array.from({ length: 23 }, (_, i) => i)
    expect(paginate(n, 1)).toMatchObject({ page: 1, pages: 3, total: 23, items: n.slice(0, 10) })
    expect(paginate(n, 3).items).toEqual([20, 21, 22])
    expect(paginate(n, 99).page).toBe(3)
    expect(paginate(n, 0).page).toBe(1)
    expect(paginate([], 2)).toMatchObject({ page: 1, pages: 1, items: [] })
    expect(pageWindow(5, 20)).toEqual([1, null, 4, 5, 6, null, 20])
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4])
    expect(isRole('quality')).toBe(true)
    expect(isRole('ceo')).toBe(false)
  })
})
