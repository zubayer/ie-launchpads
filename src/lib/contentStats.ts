// Content coverage computed from the live content, never hand-typed. Used by the coverage
// generator (scripts/coverage.gen.ts) and by tests that stop coverage from slipping.
import { CONCEPTS } from '../content'
import { DOMAINS } from '../content/domains'
import { VIZ, EXTRA_SIM } from '../content/visuals'
import { SIM_META } from '../sims/registry'
import type { Concept, DomainId } from '../types'

export const hasVisual = (c: Concept) => !!(VIZ[c.id] || c.sim || EXTRA_SIM[c.id] || SIM_META.some((s) => s.concepts.includes(c.id)))

/** Fields the V3 spec asks every core lesson to carry, as predicates over the live data. */
export const FIELDS: { key: string; label: string; has: (c: Concept) => boolean }[] = [
  { key: 'why', label: 'Why it matters', has: (c) => !!c.why },
  { key: 'example', label: 'Worked example', has: (c) => !!c.example },
  { key: 'checked', label: 'Example machine-checked', has: (c) => !!c.example?.check },
  { key: 'visual', label: 'Visual or lab', has: hasVisual },
  { key: 'mistakes', label: 'Common mistakes', has: (c) => !!c.mistakes?.length },
  { key: 'real', label: 'Application story', has: (c) => !!c.real },
  { key: 'iq', label: 'Interview questions', has: (c) => !!c.iq?.length },
  { key: 'objectives', label: 'Learning objectives', has: (c) => !!c.objectives?.length },
  { key: 'assumptions', label: 'Assumptions and limits', has: (c) => !!c.assumptions?.length },
  { key: 'cites', label: 'Cited sources', has: (c) => !!c.cites?.length },
]

/**
 * The V3 minimum for a core lesson: something to see or do (visual, lab or worked example),
 * a common mistake, an application, a way to check yourself, and a source.
 */
export const meetsMinimum = (c: Concept) =>
  (hasVisual(c) || !!c.example) && !!c.mistakes?.length && !!(c.real || c.used?.roles?.length) && !!(c.iq?.length || c.example) && !!c.cites?.length

/** A worked example whose answer contains a number but has no machine check. */
export const isUncheckedNumeric = (c: Concept) => !!c.example && !c.example.check && /\d/.test(c.example.a)

/** Formulas that list no symbol definitions. */
export const formulaWithoutSymbols = (c: Concept) => !!c.formula && !c.formula.vars?.length

export function fieldCoverage(list: Concept[] = CONCEPTS) {
  return FIELDS.map((f) => ({ ...f, n: list.filter(f.has).length, of: list.length }))
}

export function domainCoverage() {
  return DOMAINS.map((d) => {
    const list = CONCEPTS.filter((c) => c.domain === d.id)
    return { id: d.id as DomainId, name: d.name, n: list.length, min: list.filter(meetsMinimum).length, fields: fieldCoverage(list) }
  })
}

export function reviewCounts() {
  const m: Record<string, number> = {}
  CONCEPTS.forEach((c) => { const s = c.review?.status || 'none'; m[s] = (m[s] || 0) + 1 })
  return m
}

export const pct = (n: number, of: number) => (of ? Math.round((100 * n) / of) : 0)
