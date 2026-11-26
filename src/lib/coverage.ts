import { CONCEPTS, CONCEPT_MAP } from '../content'
import { AREAS, TOPIC_MAP, type KnowledgeArea } from '../content/curriculum'
import type { Concept } from '../types'
import type { ConceptIndex } from '../content/assemble'

// Topic → concept matching for the curriculum coverage matrix. Deterministic and reviewable:
// an explicit TOPIC_MAP entry wins, then exact name/alias matches, then whole-word containment.
const norm = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/\(.*?\)/g, ' ').replace(/[–—-]/g, ' ').replace(/[^a-z0-9&/+ ]/g, ' ').replace(/\s+/g, ' ').trim()
const stem = (s: string) => s.replace(/\b(\w{4,}?)(ies)\b/g, '$1y').replace(/\b(\w{3,}?)s\b/g, '$1')

const NAMES: { key: string; id: string }[] = []
for (const c of CONCEPTS) {
  for (const n of [c.term, c.full, ...(c.aka || [])]) if (n) NAMES.push({ key: stem(norm(n)), id: c.id })
}
const EXACT = new Map<string, string>()
for (const n of NAMES) if (!EXACT.has(n.key)) EXACT.set(n.key, n.id)

export function matchTopic(topic: string, area?: KnowledgeArea): ConceptIndex | null {
  const key = area ? `${area.id}:${topic}` : topic
  if (key in TOPIC_MAP) { const id = TOPIC_MAP[key]; return id ? CONCEPT_MAP[id] ?? null : null }
  const k = stem(norm(topic))
  const exact = EXACT.get(k)
  if (exact) return CONCEPT_MAP[exact]
  // Prefer concepts from the area's own domains when containment is ambiguous.
  const inArea = (id: string) => !area || area.domains.length === 0 || area.domains.includes(CONCEPT_MAP[id].domain)
  const wb = (hay: string, needle: string) => needle.length >= 4 && new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(hay)
  const hits = NAMES.filter((n) => wb(n.key, k) || wb(k, n.key))
  const best = hits.filter((h) => inArea(h.id)).sort((a, b) => b.key.length - a.key.length)[0] || hits.sort((a, b) => b.key.length - a.key.length)[0]
  return best ? CONCEPT_MAP[best.id] : null
}

export interface AreaCoverage {
  area: KnowledgeArea
  covered: { topic: string; concept: ConceptIndex }[]
  missing: string[]
  pct: number
  level: 'None' | 'Low' | 'Partial' | 'Good' | 'Strong'
}

export const levelOf = (pct: number): AreaCoverage['level'] => (pct === 0 ? 'None' : pct < 35 ? 'Low' : pct < 65 ? 'Partial' : pct < 85 ? 'Good' : 'Strong')

export function coverage(): AreaCoverage[] {
  return AREAS.map((area) => {
    const covered: AreaCoverage['covered'] = []
    const missing: string[] = []
    for (const topic of area.topics) {
      const c = matchTopic(topic, area)
      if (c) covered.push({ topic, concept: c }); else missing.push(topic)
    }
    const pct = Math.round((100 * covered.length) / area.topics.length)
    return { area, covered, missing, pct, level: levelOf(pct) }
  })
}
