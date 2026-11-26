import type { DomainId } from '../types'
import { DOMAINS } from './domains'
import type { ConceptIndex } from './assemble'
import { INDEX } from './conceptIndex.generated'

// The light lesson index that ships with the first page load: what lists, search, hover cards, maps and
// recommendations need. A lesson's full text (definition, examples, questions, mistakes, sources) loads with
// its domain when it is opened: see ./load. Tests and generators that need full content import ./full.
export type { ConceptIndex } from './assemble'

export const CONCEPTS: ConceptIndex[] = INDEX
export const CONCEPT_MAP: Record<string, ConceptIndex> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]))

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
export function neighbors(c: Pick<ConceptIndex, 'id' | 'rel' | 'pre'>): ConceptIndex[] {
  const ids = new Set([...(c.rel || []), ...(c.pre || [])])
  CONCEPTS.forEach((x) => {
    if (x.rel?.includes(c.id) || x.pre?.includes(c.id)) ids.add(x.id)
  })
  ids.delete(c.id)
  return [...ids].map((i) => CONCEPT_MAP[i]).filter(Boolean)
}

/** Order concepts so prerequisites come first (stable topological sort by level). */
export function learningOrder<T extends Pick<ConceptIndex, 'id' | 'pre' | 'level'>>(list: T[]): T[] {
  const byId = new Map(list.map((c) => [c.id, c]))
  const done = new Set<string>()
  const out: T[] = []
  const visit = (c: T, stack: Set<string>) => {
    if (done.has(c.id) || stack.has(c.id)) return
    stack.add(c.id)
    for (const p of c.pre || []) { const q = byId.get(p); if (q) visit(q, stack) }
    done.add(c.id)
    out.push(c)
  }
  ;[...list].sort((a, b) => a.level - b.level).forEach((c) => visit(c, new Set()))
  return out
}
