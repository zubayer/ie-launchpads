import { useEffect, useState } from 'react'
import type { Concept, DomainId } from '../types'
import { DOMAIN_ORDER, OVERLAY_DOMAIN, assemble, type Overlay } from './assemble'

// Full lesson content, loaded per domain the first time a page needs it. Each concept file and each overlay
// becomes its own chunk, so opening a statistics lesson downloads statistics, not all 22 domains.

const BASE = import.meta.glob<{ default: Concept[] }>('./concepts/*.ts')
const OVERLAYS = import.meta.glob<Record<string, Overlay>>('./lessons/*.ts')

const domainOf = (id: string) => id.slice(0, id.indexOf('.')) as DomainId
const pending = new Map<DomainId, Promise<Concept[]>>()
const ready = new Map<DomainId, Concept[]>()
const byId = new Map<string, Concept>()

async function fetchDomain(d: DomainId): Promise<Concept[]> {
  const base = BASE[`./concepts/${d}.ts`]
  if (!base) throw new Error(`No lesson file for domain “${d}”`)
  const overlayFile = (Object.keys(OVERLAY_DOMAIN) as (keyof typeof OVERLAY_DOMAIN)[]).find((f) => OVERLAY_DOMAIN[f] === d)
  const [mod, overlayMod] = await Promise.all([base(), overlayFile ? OVERLAYS[`./lessons/${overlayFile}.ts`]() : Promise.resolve(null)])
  const overlay: Overlay = overlayMod ? Object.assign({}, ...Object.values(overlayMod)) : {}
  return assemble(mod.default, overlay)
}

/** Load one domain's full lessons (cached; a failed load can be retried). */
export function loadDomain(d: DomainId): Promise<Concept[]> {
  const done = ready.get(d)
  if (done) return Promise.resolve(done)
  let p = pending.get(d)
  if (!p) {
    p = fetchDomain(d).then((list) => {
      ready.set(d, list)
      list.forEach((c) => byId.set(c.id, c))
      return list
    }, (e) => { pending.delete(d); throw e })
    pending.set(d, p)
  }
  return p
}

/** Every domain, in the usual lesson order. */
export const loadAll = () => Promise.all(DOMAIN_ORDER.map(loadDomain)).then((lists) => lists.flat())

/** A full lesson if its domain has already loaded, without waiting. */
export const loadedConcept = (id: string) => byId.get(id)

export type Loaded<T> = { data: T; error?: undefined } | { data?: undefined; error?: string }

function useLoaded<T>(key: string, get: () => T | undefined, load: (() => Promise<unknown>) | null): Loaded<T> & { retry: () => void } {
  // `settled` marks a key whose load finished: once it has, the effect never runs again for that key, even
  // when the load produced nothing (an unknown id), so an empty or missing lesson can't cause a render loop.
  const [state, setState] = useState<{ key: string; settled?: boolean; error?: string }>({ key })
  const data = get()
  const mine = state.key === key ? state : { key }
  useEffect(() => {
    if (!load || get() !== undefined || (state.key === key && (state.settled || state.error))) return
    let live = true
    load().then(() => { if (live) setState({ key, settled: true }) }, () => {
      if (live) setState({ key, error: 'This part of the course didn’t load. Check your connection and try again.' })
    })
    return () => { live = false }
    // `get` and `load` are recreated each render on purpose and keyed by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  // Browsers remember a failed dynamic import for the life of the page, so a real retry has to reload it.
  // Progress and settings are saved in local storage, so nothing is lost.
  const retry = () => { if (typeof window !== 'undefined') window.location.reload() }
  return data !== undefined ? { data, retry } : { error: mine.error, retry }
}

/** The full lesson for an id; `data` is undefined while its domain loads (and for unknown ids). */
export function useConcept(id: string) {
  const known = id.includes('.') && DOMAIN_ORDER.includes(domainOf(id))
  return useLoaded(`c:${id}`, () => byId.get(id), known ? () => loadDomain(domainOf(id)) : null)
}

/** Every full lesson; for pages that search or sample across the whole course (practice, interview bank). */
export function useAllConcepts() {
  return useLoaded('all', () => (ready.size === DOMAIN_ORDER.length ? DOMAIN_ORDER.flatMap((d) => ready.get(d)!) : undefined), loadAll)
}
