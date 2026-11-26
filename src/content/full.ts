// Every lesson with its full content, built eagerly. Used by tests and doc generators, and as the source of the
// generated search index. The app itself reads the light index (./index) and loads full lessons on demand (./load).
import type { Concept, DomainId } from '../types'
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
import { assemble } from './assemble'
import { AUTOMATION_V3 } from './lessons/automation'
import { OR_V3 } from './lessons/or'

const BASE: Concept[] = [
  ...stats, ...quality, ...doe, ...or, ...simulation, ...datasci, ...manufacturing, ...lean,
  ...semiconductor, ...automation, ...systems, ...safety, ...reliability, ...pm, ...scm,
  ...engecon, ...work, ...ergo, ...facilities, ...service, ...sustain, ...career,
]

// V2 lesson enrichment (objectives, assumptions, scenarios, citations, review status) layered over the base
// lessons, so the original content files stay untouched and every addition is reviewable in one place.
const ENRICH: Record<string, Partial<Concept>> = { ...LEAN_V2, ...QUALITY_V2, ...AUTOMATION_V3, ...OR_V3 }
export const ENRICHED_IDS = Object.keys(ENRICH)
export const CONCEPTS: Concept[] = assemble(BASE, ENRICH)

export const CONCEPT_MAP: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]))

export const byDomain = (id: DomainId) => CONCEPTS.filter((c) => c.domain === id)

