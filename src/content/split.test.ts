import { describe, expect, it } from 'vitest'
import onDisk from './conceptIndex.generated.ts?raw'
import { CONCEPTS as FULL } from './full'
import { CONCEPTS, CONCEPT_MAP } from './index'
import { DOMAIN_ORDER, INDEX_KEYS, OVERLAY_DOMAIN } from './assemble'
import { renderIndex } from './indexFile'
import { loadAll, loadDomain, loadedConcept } from './load'
import { LEAN_V2 } from './lessons/lean'
import { QUALITY_V2 } from './lessons/quality'
import { AUTOMATION_V3 } from './lessons/automation'
import { OR_V3 } from './lessons/or'

// ARCH-02: the first page load carries a light index; full lessons load per domain. These tests make sure the
// split changes nothing a learner sees: same lessons, same order, same content, same ids.
const json = (x: unknown) => JSON.stringify(x, (_, v) => (typeof v === 'function' ? String(v) : v))

describe('lesson index and on-demand content', () => {
  it('the generated index is up to date (run `npm run docs` after changing lesson content)', () => {
    expect(onDisk === renderIndex(FULL), 'src/content/conceptIndex.generated.ts is stale: run `npm run docs`').toBe(true)
  })
  it('the index has every lesson, in order, with exactly the light fields', () => {
    expect(CONCEPTS.map((c) => c.id)).toEqual(FULL.map((c) => c.id))
    for (const c of CONCEPTS) for (const k of Object.keys(c)) expect(INDEX_KEYS as readonly string[], `${c.id}.${k}`).toContain(k)
    for (const f of FULL) for (const k of INDEX_KEYS) expect(json(CONCEPT_MAP[f.id][k]), `${f.id}.${k}`).toBe(json(f[k]))
  })
  it('each domain loads exactly the lessons the eager build has, with identical content', async () => {
    for (const d of DOMAIN_ORDER) {
      const got = await loadDomain(d)
      const want = FULL.filter((c) => c.domain === d)
      expect(got.map((c) => c.id), d).toEqual(want.map((c) => c.id))
      expect(json(got), d).toBe(json(want))
    }
    expect((await loadAll()).map((c) => c.id)).toEqual(FULL.map((c) => c.id))
    expect(loadedConcept('or.lp')?.example?.check?.compute()).toBe(900)
  })
  it('ids carry their domain, and every domain and overlay file is wired', () => {
    for (const c of FULL) expect(c.id.startsWith(`${c.domain}.`), c.id).toBe(true)
    expect(new Set(FULL.map((c) => c.domain))).toEqual(new Set(DOMAIN_ORDER))
    const overlays = { lean: LEAN_V2, quality: QUALITY_V2, automation: AUTOMATION_V3, or: OR_V3 }
    for (const [file, ov] of Object.entries(overlays)) for (const id of Object.keys(ov)) expect(id.startsWith(`${OVERLAY_DOMAIN[file as keyof typeof OVERLAY_DOMAIN]}.`), `${file}: ${id}`).toBe(true)
    expect(Object.keys(OVERLAY_DOMAIN).sort()).toEqual(Object.keys(overlays).sort())
    const files = Object.keys(import.meta.glob('./lessons/*.ts')).filter((f) => !f.endsWith('.test.ts')).map((f) => f.slice('./lessons/'.length, -3))
    expect(files.sort(), 'a new overlay file needs an entry in OVERLAY_DOMAIN (src/content/assemble.ts) and in src/content/full.ts').toEqual(Object.keys(OVERLAY_DOMAIN).sort())
  })
})
