import type { Concept, DomainId } from '../types'
import { DOMAINS } from './domains'
import stats from './concepts/stats'
import quality from './concepts/quality'
import doe from './concepts/doe'
import or from './concepts/or'
import simulation from './concepts/simulation'
import datasci from './concepts/datasci'
import manufacturing from './concepts/manufacturing'
import lean from './concepts/lean'
import semiconductor from './concepts/semiconductor'
import automation from './concepts/automation'
import systems from './concepts/systems'
import safety from './concepts/safety'
import reliability from './concepts/reliability'
import pm from './concepts/pm'
import scm from './concepts/scm'
import engecon from './concepts/engecon'
import work from './concepts/work'
import ergo from './concepts/ergo'
import facilities from './concepts/facilities'
import service from './concepts/service'
import sustain from './concepts/sustain'
import career from './concepts/career'
import { LEAN_V2 } from './lessons/lean'
import { QUALITY_V2 } from './lessons/quality'
import { PILOTS, studioCitations } from './topicStudio'
import { AUTOMATION_V3 } from './lessons/automation'

const BASE: Concept[] = [
  ...stats, ...quality, ...doe, ...or, ...simulation, ...datasci, ...manufacturing, ...lean,
  ...semiconductor, ...automation, ...systems, ...safety, ...reliability, ...pm, ...scm,
  ...engecon, ...work, ...ergo, ...facilities, ...service, ...sustain, ...career,
]

// V2 lesson enrichment (objectives, assumptions, scenarios, citations, review status) layered over the base
// lessons, so the original content files stay untouched and every addition is reviewable in one place.
const ENRICH: Record<string, Partial<Concept>> = { ...LEAN_V2, ...QUALITY_V2, ...AUTOMATION_V3 }
export const ENRICHED_IDS = Object.keys(ENRICH)
export const CONCEPTS: Concept[] = BASE.map((c) => {
  const lesson = ENRICH[c.id] ? { ...c, ...ENRICH[c.id], id: c.id, domain: c.domain } : c
  return PILOTS[lesson.id] ? { ...lesson, cites: studioCitations(lesson) } : lesson
})

export const CONCEPT_MAP: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]))

export const byDomain = (id: DomainId) => CONCEPTS.filter((c) => c.domain === id)

export function bySub(id: DomainId) {
  const d = DOMAINS.find((x) => x.id === id)!
  const list = byDomain(id)
  const subs = [...d.subs, ...Array.from(new Set(list.map((c) => c.sub))).filter((s) => !d.subs.includes(s))]
  return subs
    .map((s) => ({ sub: s, items: list.filter((c) => c.sub === s).sort((a, b) => a.level - b.level) }))
    .filter((g) => g.items.length)
}

/** Concepts that link to this one, plus the ones it links to. */
export function neighbors(c: Concept): Concept[] {
  const ids = new Set([...(c.rel || []), ...(c.pre || [])])
  CONCEPTS.forEach((x) => {
    if (x.rel?.includes(c.id) || x.pre?.includes(c.id)) ids.add(x.id)
  })
  ids.delete(c.id)
  return [...ids].map((i) => CONCEPT_MAP[i]).filter(Boolean)
}

/** Order concepts so prerequisites come first (stable topological sort by level). */
export function learningOrder(list: Concept[]): Concept[] {
  const inSet = new Set(list.map((c) => c.id))
  const done = new Set<string>()
  const out: Concept[] = []
  const visit = (c: Concept, stack: Set<string>) => {
    if (done.has(c.id) || stack.has(c.id)) return
    stack.add(c.id)
    for (const p of c.pre || []) if (inSet.has(p) && CONCEPT_MAP[p]) visit(CONCEPT_MAP[p], stack)
    done.add(c.id)
    out.push(c)
  }
  ;[...list].sort((a, b) => a.level - b.level).forEach((c) => visit(c, new Set()))
  return out
}
