import { useEffect, useMemo, useState } from 'react'
import { isSnapshot, pageWindow, paginate, trend, type RoleId, type Snapshot } from '../lib/jobsFeed'
import { JobsDialog, SOURCE_LABEL, ago, placeLabel, useAllPostings, type ListState } from './JobsBrowser'
import type { Posting } from '../lib/jobsFeed'

/*
 * "IE jobs this week": reads data/jobs.json, which the deploy workflow refreshes weekly from
 * employer careers pages and USAJOBS (scripts/fetch-jobs.mjs; Adzuna optional). Nothing is fetched from
 * job sites in the browser, so no keys are exposed and the card shows the last file when offline.
 */

const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) => new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; snap: Snapshot }

export default function JobsPulse({ perPage = 18 }: { perPage?: number }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  useEffect(() => {
    let live = true
    fetch(`${import.meta.env.BASE_URL}data/jobs.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => live && setState(isSnapshot(j) ? { kind: 'ready', snap: j } : { kind: 'error' }))
      .catch(() => live && setState({ kind: 'error' }))
    return () => { live = false }
  }, [])

  return (
    <section className="sheet rounded-lg p-5" aria-labelledby="jobs-pulse-h" aria-busy={state.kind === 'loading'}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="jobs-pulse-h" className="wide text-xl">IE jobs this week</h2>
        {state.kind === 'ready' && state.snap.generated && <p className="text-sm text-ink-2">Updated {fmt(state.snap.generated, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
      </div>
      {state.kind === 'loading' && <p className="mt-3 text-sm text-ink-2">Loading this week’s postings…</p>}
      {state.kind === 'error' && <p className="mt-3 text-sm text-ink-2">The jobs file couldn’t be loaded. If you’re offline, it will show once you reconnect.</p>}
      {state.kind === 'ready' && <Body snap={state.snap} perPage={perPage} />}
    </section>
  )
}

function Body({ snap, perPage }: { snap: Snapshot; perPage: number }) {
  const [dialog, setDialog] = useState<ListState | null>(null)
  const openList = (role: RoleId | null) => setDialog({ role, page: 1, q: '' })
  if (!snap.generated) {
    return <p className="mt-3 text-sm text-ink-2">{snap.note ?? 'No postings collected yet.'} Each week this card will list new industrial, quality, continuous-improvement, manufacturing and planning roles from employer careers pages and USAJOBS, with the change from the week before.</p>
  }
  const max = Math.max(1, ...snap.roles.map((r) => r.count))
  const ok = snap.sources.filter((s) => s.ok)
  const off = snap.sources.filter((s) => !s.ok)
  const employers = ok.filter((s) => s.id.startsWith('greenhouse:') || s.id.startsWith('lever:'))
  const adzuna = ok.some((s) => s.id === 'adzuna')
  const total = snap.roles.reduce((n, r) => n + r.count, 0)
  return (
    <>
      <p className="mt-1 text-sm text-ink-2">
        {snap.basis === 'adzuna-total'
          ? 'US postings in the last 7 days with the role in the job title, as counted by Adzuna.'
          : `Roles open now on ${employers.length} employer careers page${employers.length === 1 ? '' : 's'}${ok.some((s) => s.id === 'usajobs') ? ', plus USAJOBS postings from the last 30 days' : ''}: a sample, not the whole market.`}
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-0 2xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="flex flex-col rounded-lg bg-grid p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="text-base font-bold">Open roles by type</h3>
            <span className="text-xs text-ink-2">Select one to list them{snap.history.length < 2 ? '; weekly trends start next week' : ''}</span>
          </div>
          <ul className="mt-3 flex flex-1 flex-col justify-evenly gap-1">
            {snap.roles.map((r) => {
              const t = trend(snap, r.id)
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => openList(r.id)} className="group block w-full rounded-md px-2 py-2 text-left hover:bg-sheet"
                    aria-label={`${r.label}, ${r.count.toLocaleString('en-US')} open${!t ? '' : t.pct === null ? ', new this week' : t.pct === 0 ? ', no change from last week' : `, ${t.pct > 0 ? 'up' : 'down'} ${Math.abs(t.pct)}% from the week of ${fmt(t.from)}`}. Show these roles`}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[0.95rem] font-semibold group-hover:text-sblue group-hover:underline">{r.label}</span>
                      <span className="flex items-baseline gap-2 whitespace-nowrap">
                        <span className="text-lg font-bold tabular-nums">{r.count.toLocaleString('en-US')}</span>
                        {t && t.pct === null ? <span className="text-xs text-ink-2">new</span>
                          : t && t.pct !== null ? (
                            <span className="text-sm font-semibold" style={{ color: t.pct > 0 ? 'var(--color-sgreen)' : t.pct < 0 ? 'var(--color-sorange)' : 'var(--color-ink-2)' }}>
                              {t.pct > 0 ? '▲' : t.pct < 0 ? '▼' : '–'} {Math.abs(t.pct)}%
                            </span>
                          ) : null}
                      </span>
                    </span>
                    <span aria-hidden className="mt-1.5 block h-2 overflow-hidden rounded-full bg-sheet"><span className="block h-full rounded-full bg-sblue" style={{ width: `${Math.max(1.5, (r.count / max) * 100)}%` }} /></span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm">{snap.basis === 'collected'
              ? <><span className="text-lg font-bold tabular-nums">{total.toLocaleString('en-US')}</span> open roles from {ok.length} source{ok.length === 1 ? '' : 's'}</>
              : <>US totals, last 7 days</>}</p>
            <button type="button" className="btn" onClick={() => openList(null)}>Show all open roles</button>
          </div>
        </div>
        <div className="flex flex-col lg:ml-8 lg:border-l lg:border-line lg:pl-8 xl:ml-10 xl:pl-10">
          <LatestPostings snap={snap} perPage={perPage} onMore={() => openList(null)} />
        </div>
      </div>
      <div className="mt-5 border-t border-line pt-3 text-xs text-ink-2">
        <p>
          Sources:{' '}
          {ok.filter((s) => s.id !== 'adzuna').map((s, i) => <span key={s.id}>{i ? ', ' : ''}<a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></span>)}
          {adzuna && <>{ok.length > 1 ? ', ' : ''}<a className="underline" href="https://www.adzuna.com/" target="_blank" rel="noopener noreferrer">Jobs by Adzuna</a></>}
          . Collected weekly; open a posting to check it’s still live.
        </p>
        {snap.note && <p className="mt-1">{snap.note}</p>}
        {off.length > 0 && <p className="mt-1">Not included this week: {off.map((s) => `${s.name} (${s.note ?? 'no answer'})`).join('; ')}.</p>}
      </div>
      <JobsDialog open={!!dialog} initial={dialog ?? { role: null, page: 1, q: '' }} onClose={() => setDialog(null)} />
    </>
  )
}

/** Fewer per page on phones, where the rows stack in one column. */
function usePerPage(wide: number): number {
  const query = '(max-width: 639px)'
  const [phone, setPhone] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const m = matchMedia(query)
    const on = () => setPhone(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return phone ? Math.min(6, wide) : wide
}

/**
 * Newest postings, paged inside the card. Page 1 shows from the small summary file at once; the full
 * list (data/jobs-all.json, same order) loads in the background and drives the page numbers.
 */
function LatestPostings({ snap, perPage: wide, onMore }: { snap: Snapshot; perPage: number; onMore: () => void }) {
  const perPage = usePerPage(wide)
  const all = useAllPostings()
  const list = useMemo(() => (all && all !== 'loading' && all.postings.length ? all.postings : snap.latest), [all, snap.latest])
  const [page, setPage] = useState(1)
  const pg = paginate(list, page, perPage)
  if (!list.length) return <><h3 className="text-base font-bold">Latest postings</h3><p className="mt-2 text-sm text-ink-2">No matching postings in the last 30 days.</p></>
  const from = (pg.page - 1) * perPage + 1
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-base font-bold">Latest postings</h3>
        <span className="text-xs text-ink-2" aria-live="polite">{from}–{from + pg.items.length - 1} of {pg.total.toLocaleString('en-US')}, newest first</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">{pg.items.map((p) => <PostingRow key={p.url} p={p} />)}</ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {pg.pages > 1 ? (
          <nav className="flex flex-wrap items-center gap-1" aria-label="Latest postings pages">
            <button type="button" className="btn btn-ghost !h-8 !min-w-8 !px-2 !py-0 text-sm" disabled={pg.page === 1} onClick={() => setPage(pg.page - 1)} aria-label="Previous page">‹</button>
            {pageWindow(pg.page, pg.pages).map((n, i) => n === null
              ? <span key={`gap${i}`} aria-hidden className="px-1 text-ink-2">…</span>
              : <button key={n} type="button" className={`btn !h-8 !min-w-8 !px-2 !py-0 text-sm ${n === pg.page ? '' : 'btn-ghost'}`} aria-current={n === pg.page ? 'page' : undefined} aria-label={`Page ${n}`} onClick={() => setPage(n)}>{n}</button>)}
            <button type="button" className="btn btn-ghost !h-8 !min-w-8 !px-2 !py-0 text-sm" disabled={pg.page === pg.pages} onClick={() => setPage(pg.page + 1)} aria-label="Next page">›</button>
          </nav>
        ) : <span />}
        <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={onMore}>More jobs: filter and search</button>
      </div>
    </div>
  )
}

/** One posting in two short lines, so a page holds many. The full title shows on hover when it is cut. */
function PostingRow({ p }: { p: Posting }) {
  return (
    <li className="min-w-0">
      <a href={p.url} target="_blank" rel="noopener noreferrer" title={p.title} className="group block rounded-md border border-line px-3 py-2 hover:border-sblue">
        <span className="block truncate text-sm font-semibold group-hover:text-sblue group-hover:underline">{p.title}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-ink-2">
          <span className="truncate">{p.company} · {placeLabel(p.location)}</span>
          <span aria-hidden className="shrink-0">·</span>
          <span className="shrink-0">{p.posted && p.dated === 'updated' ? 'updated ' : ''}{ago(p.posted)}</span>
          <span className="shrink-0 rounded border border-line px-1 leading-4">{p.source === 'usajobs' ? 'USAJOBS' : 'Employer'}</span>
        </span>
        <span className="sr-only"> (opens the posting on {SOURCE_LABEL[p.source]})</span>
      </a>
    </li>
  )
}
