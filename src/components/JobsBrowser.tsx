import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ROLES, filterPostings, isAllPostings, pageWindow, paginate, type AllPostings, type Posting, type RoleId } from '../lib/jobsFeed'

/*
 * The full list of open IE roles (data/jobs-all.json), with role filter, search and page numbers.
 * Used in the dialog opened from the "IE jobs this week" card and on the /jobs page.
 */

export const SOURCE_LABEL: Record<Posting['source'], string> = { greenhouse: 'employer page', lever: 'employer page', usajobs: 'USAJOBS', adzuna: 'Adzuna' }

export function ago(d: string): string {
  if (!d) return 'date not given'
  const days = Math.max(0, Math.round((Date.now() - new Date(d + 'T12:00:00Z').getTime()) / 86_400_000))
  return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`
}

/** "Santa Ana, California, United States" → "Santa Ana, California": every role here is in the US. */
export const placeLabel = (l: string) => l.replace(/,\s*(United States( of America)?|USA|US)$/i, '') || 'location not given'

export function PostingItem({ p }: { p: Posting }) {
  return (
    <li className="py-2">
      <a className="font-semibold hover:text-sblue hover:underline" href={p.url} target="_blank" rel="noopener noreferrer">{p.title}<span className="sr-only"> (opens the posting on {SOURCE_LABEL[p.source]})</span></a>
      <span className="block text-ink-2">{p.company} · {placeLabel(p.location)} · {p.posted && p.dated === 'updated' ? 'updated ' : ''}{ago(p.posted)} · via {SOURCE_LABEL[p.source]}</span>
    </li>
  )
}

// One request per page load, shared by the dialog and the page.
let cache: Promise<AllPostings | null> | null = null
export function useAllPostings(enabled = true): AllPostings | null | 'loading' {
  const [data, setData] = useState<AllPostings | null | 'loading'>('loading')
  useEffect(() => {
    if (!enabled) return
    cache ??= fetch(`${import.meta.env.BASE_URL}data/jobs-all.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null)).then((j) => (isAllPostings(j) ? j : null)).catch(() => { cache = null; return null })
    let live = true
    cache.then((d) => live && setData(d))
    return () => { live = false }
  }, [enabled])
  return data
}

export interface ListState { role: RoleId | null; page: number; q: string }

export function JobsList({ state, onChange }: { state: ListState; onChange: (s: ListState) => void }) {
  const data = useAllPostings()
  const listRef = useRef<HTMLHeadingElement>(null)
  const searchId = useId()
  const all = data && data !== 'loading' ? data.postings : []
  const byRole = useMemo(() => Object.fromEntries(ROLES.map((r) => [r.id, all.filter((p) => p.role === r.id).length])), [all])
  const filtered = useMemo(() => filterPostings(all, { role: state.role, q: state.q }), [all, state.role, state.q])
  const pg = paginate(filtered, state.page)
  const go = (page: number) => {
    onChange({ ...state, page })
    // Keep keyboard and screen-reader users at the top of the new page, not on a button that moved.
    requestAnimationFrame(() => { listRef.current?.focus(); listRef.current?.scrollIntoView({ block: 'nearest' }) })
  }

  if (data === 'loading') return <p className="text-sm text-ink-2">Loading the job list…</p>
  if (data === null) return <p className="text-sm text-ink-2">The job list couldn’t be loaded. If you’re offline, it will show once you reconnect.</p>
  if (!data.generated) return <p className="text-sm text-ink-2">No postings collected yet: the list fills after the next weekly collection.</p>

  const roleLabel = state.role ? ROLES.find((r) => r.id === state.role)!.label : 'All IE roles'
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by role">
        <button type="button" className={`chip ${!state.role ? '!border-sblue !text-sblue font-semibold' : ''}`} aria-pressed={!state.role} onClick={() => onChange({ ...state, role: null, page: 1 })}>All <span className="text-ink-2">{all.length}</span></button>
        {ROLES.map((r) => (
          <button key={r.id} type="button" className={`chip ${state.role === r.id ? '!border-sblue !text-sblue font-semibold' : ''}`} aria-pressed={state.role === r.id} onClick={() => onChange({ ...state, role: r.id, page: 1 })}>
            {r.label} <span className="text-ink-2">{byRole[r.id]}</span>
          </button>
        ))}
      </div>
      <label htmlFor={searchId} className="label mt-3 block">Search title, company or place</label>
      <input id={searchId} type="search" className="input mt-1" value={state.q} placeholder="e.g. quality, Texas or TX, SpaceX" onChange={(e) => onChange({ ...state, q: e.target.value, page: 1 })} />

      <h3 ref={listRef} tabIndex={-1} className="mt-4 text-sm font-bold outline-none" aria-live="polite">
        {roleLabel}: {pg.total ? `${(pg.page - 1) * 10 + 1}–${(pg.page - 1) * 10 + pg.items.length} of ${pg.total}` : 'no matches'}
      </h3>
      {pg.items.length ? <ul className="mt-1 divide-y divide-line/60 text-sm">{pg.items.map((p) => <PostingItem key={p.url} p={p} />)}</ul>
        : <p className="mt-1 text-sm text-ink-2">Nothing matches. Try a state instead of a city (e.g. Texas), another role, or clear the search.</p>}

      {pg.pages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Pages">
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={pg.page === 1} onClick={() => go(pg.page - 1)}>← Previous</button>
          {pageWindow(pg.page, pg.pages).map((n, i) => n === null
            ? <span key={`gap${i}`} aria-hidden className="px-1 text-ink-2">…</span>
            : <button key={n} type="button" className={`btn !px-3 !py-1.5 text-sm ${n === pg.page ? '' : 'btn-ghost'}`} aria-current={n === pg.page ? 'page' : undefined} aria-label={`Page ${n}`} onClick={() => go(n)}>{n}</button>)}
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={pg.page === pg.pages} onClick={() => go(pg.page + 1)}>Next →</button>
        </nav>
      )}
      <p className="mt-3 text-xs text-ink-2">Collected {new Date(data.generated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} from employer careers pages and USAJOBS. Open a posting to check it’s still live.</p>
    </div>
  )
}

export const jobsHref = (s: Partial<ListState>) => {
  const q = new URLSearchParams()
  if (s.role) q.set('role', s.role)
  if (s.page && s.page > 1) q.set('page', String(s.page))
  if (s.q) q.set('q', s.q)
  const qs = q.toString()
  return `${import.meta.env.BASE_URL}#/jobs${qs ? `?${qs}` : ''}`
}

/** Native modal dialog: the browser traps focus, closes on Esc and returns focus to the button that opened it. */
export function JobsDialog({ open, initial, onClose }: { open: boolean; initial: ListState; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState(initial)
  const titleId = useId()
  useEffect(() => { if (open) setState(initial) }, [open, initial])
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="jobs-dialog sheet m-auto w-[min(100vw-1.5rem,52rem)] max-h-[88vh] overflow-hidden rounded-lg p-0 text-ink">
      {open && (
        <div className="flex max-h-[88vh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 id={titleId} className="wide text-xl">Open IE roles</h2>
              <a className="text-sm text-sblue underline" href={jobsHref(state)} target="_blank" rel="noopener">Open this list in a new tab ↗</a>
            </div>
            <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={onClose}>Close<span className="sr-only"> job list</span></button>
          </div>
          <div className="overflow-y-auto px-5 py-4"><JobsList state={state} onChange={setState} /></div>
        </div>
      )}
    </dialog>
  )
}
