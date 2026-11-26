import type { Concept, DomainId } from '../types'
import { PILOTS, studioCitations } from './topicStudio'

// How a lesson page's full content is put together: the base lesson from src/content/concepts/<domain>.ts,
// then any overlay from src/content/lessons/*.ts, then Topic Studio citations. Shared by the eager build used
// in tests and generators (./full) and by the on-demand loader the app uses (./load).

/** Domains in the order their concept files are listed; CONCEPTS keeps this order. */
export const DOMAIN_ORDER: DomainId[] = [
  'stats', 'quality', 'doe', 'or', 'simulation', 'datasci', 'manufacturing', 'lean',
  'semiconductor', 'automation', 'systems', 'safety', 'reliability', 'pm', 'scm',
  'engecon', 'work', 'ergo', 'facilities', 'service', 'sustain', 'career',
]

/** Which overlay files enrich which domain (checked by src/content/split.test.ts). */
export const OVERLAY_DOMAIN = { lean: 'lean', quality: 'quality', automation: 'automation', or: 'or' } as const satisfies Record<string, DomainId>

export type Overlay = Record<string, Partial<Concept>>

export function assemble(base: Concept[], overlay: Overlay): Concept[] {
  return base.map((c) => {
    const lesson = overlay[c.id] ? { ...c, ...overlay[c.id], id: c.id, domain: c.domain } : c
    return PILOTS[lesson.id] ? { ...lesson, cites: studioCitations(lesson) } : lesson
  })
}

/** The fields every list, search box, hover card and map needs. Everything else loads with the lesson. */
export const INDEX_KEYS = ['id', 'term', 'full', 'domain', 'sub', 'level', 'aka', 'one', 'rel', 'pre', 'sim', 'used', 'formula', 'cert'] as const
export type ConceptIndex = Pick<Concept, (typeof INDEX_KEYS)[number]>

export function toIndex(c: Concept): ConceptIndex {
  const out: Record<string, unknown> = {}
  for (const k of INDEX_KEYS) if (c[k] !== undefined) out[k] = c[k]
  return out as unknown as ConceptIndex
}
