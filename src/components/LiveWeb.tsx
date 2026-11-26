import { useEffect, useState } from 'react'
import type { Concept } from '../types'
import { DOMAIN_HINT, SE_SITE, askLinks, papers, searchName, stackQA, wikiSearch, type Paper, type QA, type WikiHit, type WikiSummary } from '../lib/web'
import { WikiCard } from './Glossary'
import { AiCards, AskElsewhere } from './AiCards'

type Tab = 'articles' | 'qa' | 'papers' | 'new'
const TABS: [Tab, string][] = [['articles', 'Related articles'], ['qa', 'Practitioner Q&A'], ['papers', 'Key research'], ['new', 'Recent research']]

function useLoad<T>(fn: () => Promise<T | null>, deps: unknown[]) {
  const [state, set] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: true })
  useEffect(() => {
    let live = true
    set({ data: null, loading: true })
    fn().then((data) => live && set({ data, loading: false })).catch(() => live && set({ data: null, loading: false }))
    return () => { live = false }
  }, deps) // eslint-disable-line
  return state
}

const ago = (s: number) => { const m = Math.round((Date.now() - s) / 60000); return m < 1 ? 'just now' : `${m} min ago` }


function Empty({ what, href }: { what: string; href: string }) {
  return <p className="text-sm text-ink-2">No {what} came back right now. <a className="underline" href={href} target="_blank" rel="noopener noreferrer">Search it directly ↗</a></p>
}
function Skeleton() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i}><div className="h-3.5 w-2/3 animate-pulse rounded bg-line" /><div className="mt-1.5 h-3 w-11/12 animate-pulse rounded bg-line" /></div>)}</div>
}

function Articles({ query }: { query: string }) {
  const r = useLoad<WikiHit[]>(() => wikiSearch(query), [query])
  if (r.loading) return <Skeleton />
  if (!r.data?.length) return <Empty what="articles" href={`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`} />
  return (
    <ul className="space-y-3">
      {r.data.map((h) => (
        <li key={h.url}>
          <a className="font-semibold text-sblue hover:underline" href={h.url} target="_blank" rel="noopener noreferrer">{h.title} ↗</a>
          <p className="line-clamp-2 text-sm text-ink-2">{h.snippet}…</p>
        </li>
      ))}
    </ul>
  )
}

function QAList({ c }: { c: Concept }) {
  const r = useLoad<QA[]>(() => stackQA(c), [c.id])
  const se = SE_SITE[c.domain]
  if (r.loading) return <Skeleton />
  if (!r.data?.length) return <Empty what="questions" href={`https://${se.site}.stackexchange.com/search?q=${encodeURIComponent(c.term)}`} />
  return (
    <>
      <ul className="space-y-3">
        {r.data.map((h) => (
          <li key={h.url} className="flex gap-3">
            <span className={`mt-0.5 inline-flex h-8 min-w-10 shrink-0 flex-col items-center justify-center rounded border text-[11px] leading-none ${h.answered ? 'border-sgreen text-sgreen' : 'border-line text-ink-2'}`} title={`${h.answers} answers`}>
              <strong className="text-sm">{h.answers}</strong>ans
            </span>
            <span className="min-w-0">
              <a className="font-semibold text-sblue hover:underline" href={h.url} target="_blank" rel="noopener noreferrer">{h.title} ↗</a>
              <span className="block text-xs text-ink-2">{h.score} votes{h.tags.length ? ` · ${h.tags.join(', ')}` : ''}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-2">Live from {se.name} (Stack Exchange) — real questions engineers and analysts asked.</p>
    </>
  )
}

function Papers({ query, sort }: { query: string; sort: 'relevance' | 'recent' }) {
  const r = useLoad<Paper[]>(() => papers(query, sort), [query, sort])
  if (r.loading) return <Skeleton />
  if (!r.data?.length) return <Empty what="papers" href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`} />
  return (
    <>
      <ul className="space-y-3">
        {r.data.map((p) => (
          <li key={p.url}>
            <a className="font-semibold text-sblue hover:underline" href={p.url} target="_blank" rel="noopener noreferrer">{p.title} ↗</a>
            <span className="block text-xs text-ink-2">{[p.year, p.venue, p.cites != null ? `cited ${p.cites.toLocaleString()} times` : ''].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-2">Live from OpenAlex, an open index of 250M+ scholarly works.</p>
    </>
  )
}

/** Everything the web knows about a topic, fetched the moment the page opens. */
export function LiveWeb({ c, wiki }: { c: Concept; wiki: { data: WikiSummary | null; loading: boolean } }) {
  const [tab, setTab] = useState<Tab>('articles')
  const [at] = useState(() => Date.now())
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 60000); return () => clearInterval(t) }, [])
  const name = searchName(c)
  const query = `${c.full || c.term} ${DOMAIN_HINT[c.domain]}`
  const ask = askLinks(name)
  return (
    <div>
      <p className="mb-4 text-sm text-ink-2">Fetched live when you opened this page ({ago(at)}). Only the topic name is sent to these services. Every link opens in a new tab.</p>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-line p-4">
          <p className="label mb-2">What Wikipedia says</p>
          <WikiCard data={wiki.data} loading={wiki.loading} query={c.full || c.term} compact />
        </div>
        <AiCards c={c} />
      </div>

      <div className="mt-4 rounded-lg border border-line p-4">
        <p className="label mb-1">What Google and AI search engines say</p>
        <p className="mb-3 text-sm text-ink-2">Google doesn’t allow its results inside other sites, so these open its live answer (including AI Overview) in a new tab with the question filled in.</p>
        <div className="no-print flex flex-wrap gap-2">
          {ask.map((l, i) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={i < 2 ? 'ext-btn !border-sblue !text-sblue' : 'pop-btn !py-1.5'}>{l.label} ↗</a>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line">
        <div role="tablist" aria-label="Live sources" className="no-print flex gap-1 overflow-x-auto border-b border-line px-2 pt-2">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`shrink-0 rounded-t-md px-3 py-2 text-sm font-semibold ${tab === id ? 'border border-b-0 border-line bg-sheet text-sblue' : 'text-ink-2 hover:text-ink'}`}>{label}</button>
          ))}
        </div>
        <div role="tabpanel" className="p-4">
          {tab === 'articles' && <Articles query={query} />}
          {tab === 'qa' && <QAList c={c} />}
          {tab === 'papers' && <Papers query={name} sort="relevance" />}
          {tab === 'new' && <Papers query={name} sort="recent" />}
        </div>
      </div>
    </div>
  )
}

/** Warm the caches for the other tabs so switching is instant. */
export function prefetchLive(c: Concept) {
  const name = searchName(c)
  void stackQA(c); void papers(name, 'relevance'); void papers(name, 'recent')
}

/** Wikipedia's summary and every free AI explanation, side by side, loaded as soon as the lesson opens. */
export function QuickPreview({ c, wiki, hasLive }: { c: Concept; wiki: { data: WikiSummary | null; loading: boolean }; hasLive: boolean }) {
  return <div>
    <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-lg border border-line p-4">
        <p className="label mb-2">Wikipedia · supplementary orientation</p>
        <WikiCard data={wiki.data} loading={wiki.loading} query={c.full || c.term} compact />
      </div>
      <AiCards c={c}/>
    </div>
    <AskElsewhere c={c} />
    {hasLive && <p className="mt-2 text-sm"><a href="#live" className="font-semibold text-sblue hover:underline" onClick={e=>{e.preventDefault();document.getElementById('live')?.scrollIntoView({behavior:'smooth'})}}>More live sources ↓</a></p>}
  </div>
}
