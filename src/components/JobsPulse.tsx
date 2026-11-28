import { useEffect, useState } from 'react'
import { isSnapshot, trend, type RoleId, type Snapshot } from '../lib/jobsFeed'
import { JobsDialog, PostingItem, type ListState } from './JobsBrowser'

/*
 * "IE jobs this week": reads data/jobs.json, which the deploy workflow refreshes weekly from
 * employer careers pages and USAJOBS (scripts/fetch-jobs.mjs; Adzuna optional). Nothing is fetched from
 * job sites in the browser, so no keys are exposed and the card shows the last file when offline.
 */

const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) => new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; snap: Snapshot }

export default function JobsPulse({ limit = 6 }: { limit?: number }) {
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
      {state.kind === 'ready' && <Body snap={state.snap} limit={limit} />}
    </section>
  )
}

function Body({ snap, limit }: { snap: Snapshot; limit: number }) {
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
  const latest = snap.latest.slice(0, limit)
  return (
    <>
      <p className="mt-1 text-sm text-ink-2">
        {snap.basis === 'adzuna-total'
          ? 'US postings in the last 7 days with the role in the job title, as counted by Adzuna.'
          : `Roles open now on ${employers.length} employer careers page${employers.length === 1 ? '' : 's'}${ok.some((s) => s.id === 'usajobs') ? ', plus USAJOBS postings from the last 30 days' : ''}: a sample, not the whole market.`}
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
        <p className="mb-2 text-xs text-ink-2">Select a role to see its listings.</p>
        <ul className="space-y-3">
          {snap.roles.map((r) => {
            const t = trend(snap, r.id)
            return (
              <li key={r.id}>
                <button type="button" onClick={() => openList(r.id)} className="group block w-full rounded-md p-1.5 -m-1.5 text-left hover:bg-grid"
                  aria-label={`${r.label}, ${r.count.toLocaleString('en-US')} open${!t ? '' : t.pct === null ? ', new this week' : t.pct === 0 ? ', no change from last week' : `, ${t.pct > 0 ? 'up' : 'down'} ${Math.abs(t.pct)}% from the week of ${fmt(t.from)}`}. Show these roles`}>
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold group-hover:text-sblue group-hover:underline">{r.label}</span>
                  <span className="whitespace-nowrap">
                    <span className="font-bold">{r.count.toLocaleString('en-US')}</span>
                    {t && t.pct === null ? (
                      <span className="ml-2 text-xs text-ink-2">new</span>
                    ) : t && t.pct !== null ? (
                      <span className="ml-2" style={{ color: t.pct > 0 ? 'var(--color-sgreen)' : t.pct < 0 ? 'var(--color-sorange)' : 'var(--color-ink-2)' }}>
                        {t.pct > 0 ? '▲' : t.pct < 0 ? '▼' : '–'} {Math.abs(t.pct)}%
                      </span>
                    ) : <span className="ml-2 text-xs text-ink-2">trend next week</span>}
                  </span>
                </span>
                <span aria-hidden className="mt-1 block h-1.5 overflow-hidden rounded-full bg-grid"><span className="block h-full rounded-full bg-sblue" style={{ width: `${(r.count / max) * 100}%` }} /></span>
                </button>
              </li>
            )
          })}
        </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Latest postings</h3>
          {latest.length ? (
            <ul className="mt-2 divide-y divide-line/60 text-sm">{latest.map((p) => <PostingItem key={p.url} p={p} />)}</ul>
          ) : <p className="mt-2 text-sm text-ink-2">No matching postings in the last 30 days.</p>}
          <button type="button" className="btn mt-3" onClick={() => openList(null)}>Show all open roles</button>
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-3 text-xs text-ink-2">
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
