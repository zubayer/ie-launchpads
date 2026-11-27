import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from './full'
import { CERTS, JOB_SNAPSHOT, OTHER_CERTS, certsForLesson, coverage, demand, rankNext } from './certs'

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime())

describe('certifications', () => {
  it('every certification has a dated, linked official source and links every fact', () => {
    expect(new Set(CERTS.map((c) => c.id)).size).toBe(CERTS.length)
    for (const c of CERTS) {
      expect(isDate(c.asOf), c.id).toBe(true)
      expect(c.url, c.id).toMatch(/^https:\/\//)
      expect(c.outline.url, c.id).toMatch(/^https:\/\//)
      expect(c.facts.length, c.id).toBeGreaterThan(0)
      for (const f of c.facts) expect(f.src, `${c.id}: ${f.label}`).toMatch(/^https:\/\//)
      // Fees change and are shown only on the official page.
      for (const f of c.facts) expect(f.value, `${c.id}: ${f.label}`).not.toMatch(/\$\s?\d/)
    }
    for (const o of OTHER_CERTS) expect(o.url).toMatch(/^https:\/\//)
  })

  it('every syllabus heading points at real lessons, with no duplicates', () => {
    for (const c of CERTS) {
      for (const s of c.sections) for (const t of s.topics) {
        expect(new Set(t.lessons).size, `${c.id} ${s.code}.${t.code}`).toBe(t.lessons.length)
        for (const id of t.lessons) expect(CONCEPT_MAP[id], `${c.id} ${s.code}.${t.code} → ${id}`).toBeTruthy()
      }
    }
  })

  it('official weights add up to the published scored-question totals', () => {
    const total = (id: string) => CERTS.find((c) => c.id === id)!.sections.reduce((a, s) => a + Number(s.weight?.match(/^\d+/)?.[0] ?? 0), 0)
    expect(total('asq-cssgb')).toBe(100) // 110 questions, 100 scored
    expect(total('asq-cqe')).toBe(160) // 175 questions, 160 scored
  })

  it('coverage and the reverse index agree with the mapping', () => {
    const cssgb = CERTS.find((c) => c.id === 'asq-cssgb')!
    const cov = coverage(cssgb)
    expect(cov.total).toBe(cssgb.sections.flatMap((s) => s.topics).length)
    expect(cov.covered).toBeLessThan(cov.total) // DFSS and the planning tools are honest gaps
    expect(certsForLesson('quality.cpk').map((c) => c.id)).toEqual(expect.arrayContaining(['asq-cssgb', 'asq-cqe', 'ncees-fe-industrial', 'iise-six-sigma-green-belt']))
  })

  it('the job snapshot is dated and its counts are what the postings say', () => {
    expect(isDate(JOB_SNAPSHOT.read)).toBe(true)
    expect(JOB_SNAPSHOT.postings).toHaveLength(16)
    for (const p of JOB_SNAPSHOT.postings) { expect(isDate(p.posted)).toBe(true); expect(p.url).toMatch(/^https:\/\//) }
    expect(demand(['six-sigma'])).toEqual({ hits: 6, of: 16 })
    expect(demand(['apics'])).toEqual({ hits: 3, of: 16 })
    expect(demand(['cqe'], 'quality')).toEqual({ hits: 2, of: 5 })
    expect(JOB_SNAPSHOT.postings.filter((p) => p.names.length === 0)).toHaveLength(7)
  })

  it('ranking puts what you can sit now first and drops what you already hold', () => {
    const r = rankNext({ exp: 'none', held: ['iise-lean-green-belt'], coverage: (c) => coverage(c).pct })
    expect(r.map((p) => p.cert.id)).not.toContain('iise-lean-green-belt')
    expect(r[0].eligible).toBe('yes')
    expect(r.find((p) => p.cert.id === 'asq-cqe')!.eligible).toBe('no')
    expect(r.findIndex((p) => p.eligible === 'no')).toBeGreaterThan(r.findIndex((p) => p.eligible === 'yes'))
  })
})
