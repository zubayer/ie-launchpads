import { describe, expect, it } from 'vitest'
import { EMPTY_SNAPSHOT, buildSnapshot, classify, dedupe, isSnapshot, mergeHistory, trend, weekOf, type Posting } from './jobsFeed'

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
    expect(trend(s, 'ci')).toBeNull()
    expect(buildSnapshot({ now, sources: [], postings: [], adzunaTotals: { quality: 5 } }).basis).toBe('collected')
  })

  it('rejects a malformed file', () => {
    expect(isSnapshot({ version: 2 })).toBe(false)
    expect(isSnapshot(null)).toBe(false)
    expect(isSnapshot(EMPTY_SNAPSHOT)).toBe(true)
  })
})
