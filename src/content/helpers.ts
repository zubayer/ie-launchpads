import type { Concept, DomainId } from '../types'

export type Draft = Omit<Concept, 'domain'>

/** Prefix bare ids (no dot) with the domain so same-domain references stay short. */
export function mk(domain: DomainId, list: Draft[]): Concept[] {
  const fix = (id: string) => (id.includes('.') ? id : `${domain}.${id}`)
  return list.map((c) => ({
    ...c,
    domain,
    id: fix(c.id),
    rel: c.rel?.map(fix),
    pre: c.pre?.map(fix),
  }))
}
