import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import { CONCEPT_ALIAS, WIKI_TERMS, wikiUrl } from '../content/wikiTerms'
import { jobsFor } from '../content/jobs'
import { askLinks, googleUrl, links, wiki, wikiFor, wikiSearchUrl, type WikiSummary } from '../lib/web'
import { search } from '../lib/search'
import { Tex } from './ui'

/* ---------- Term index: which words in prose link to a concept card or a Wikipedia article ---------- */
const SKIP = new Set(['career.ethics', 'career.resume', 'pm.scope', 'manufacturing.routing'])
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const INDEX = (() => {
  const map = new Map<string, string>() // lowercased pattern -> id (acronyms keep case)
  const acr = new Map<string, string>()
  for (const c of CONCEPTS) {
    if (SKIP.has(c.id)) continue
    const base = c.term.replace(/\s*\(.*?\)\s*/g, ' ').trim()
    const names = [base, c.full, ...(c.aka || []).filter((a) => /^[A-Z][A-Za-z0-9&/-]{1,7}$/.test(a) && /[A-Z].*[A-Z]/.test(a))]
    for (const n of names) {
      if (!n || n.length < 3 || /[,]/.test(n)) continue
      if (/^[A-Z0-9&/-]{2,8}$/.test(n)) { if (!acr.has(n)) acr.set(n, c.id) }
      else if (!map.has(n.toLowerCase())) map.set(n.toLowerCase(), c.id)
    }
  }
  for (const [k, id] of Object.entries(CONCEPT_ALIAS)) if (CONCEPT_MAP[id] && !map.has(k.toLowerCase())) map.set(k.toLowerCase(), id)
  return { map, acr }
})()

// Wikipedia keywords that don't collide with a concept card (the card always wins).
const WIKI = (() => {
  const cs = new Map<string, string>()
  const ci = new Map<string, string>()
  for (const [k, title] of Object.entries(WIKI_TERMS)) {
    if (INDEX.map.has(k.toLowerCase()) || INDEX.acr.has(k)) continue
    if (/[A-Z]/.test(k)) cs.set(k, title); else ci.set(k, title)
  }
  return { cs, ci }
})()

const alt = (keys: Iterable<string>) => [...keys].sort((a, b) => b.length - a.length).map(esc).join('|')
const bound = (body: string, flags: string) => new RegExp(`(?<![A-Za-z0-9])(${body})(?![A-Za-z0-9])`, flags)
const RE_WORDS = bound(alt(INDEX.map.keys()), 'gi')
const RE_ACR = bound(alt(INDEX.acr.keys()), 'g')
const RE_WIKI_CS = WIKI.cs.size ? bound(alt(WIKI.cs.keys()), 'g') : null
const RE_WIKI_CI = WIKI.ci.size ? bound(alt(WIKI.ci.keys()), 'gi') : null

type Hit = { start: number; end: number; id?: string; wiki?: string }
function findTerms(text: string) {
  const hits: Hit[] = []
  for (const m of text.matchAll(RE_ACR)) hits.push({ start: m.index!, end: m.index! + m[0].length, id: INDEX.acr.get(m[0])! })
  for (const m of text.matchAll(RE_WORDS)) hits.push({ start: m.index!, end: m.index! + m[0].length, id: INDEX.map.get(m[0].toLowerCase())! })
  if (RE_WIKI_CS) for (const m of text.matchAll(RE_WIKI_CS)) hits.push({ start: m.index!, end: m.index! + m[0].length, wiki: WIKI.cs.get(m[0])! })
  if (RE_WIKI_CI) for (const m of text.matchAll(RE_WIKI_CI)) hits.push({ start: m.index!, end: m.index! + m[0].length, wiki: WIKI.ci.get(m[0].toLowerCase())! })
  // Longest match first at each position; concept cards beat Wikipedia words of equal length.
  hits.forEach((h, i) => ((h as Hit & { n: number }).n = i))
  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start) || (a as Hit & { n: number }).n - (b as Hit & { n: number }).n)
  const out: Hit[] = []
  let last = -1
  for (const h of hits) if (h.start >= last) { out.push(h); last = h.end }
  return out
}

/* ---------- Hover card: opens on hover/focus/tap, stays open while the pointer is inside ---------- */
const OPEN_DELAY = 120
const CLOSE_DELAY = 380
let closeOthers: (() => void) | null = null

function useHoverCard() {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean; width: number } | null>(null)
  const anchor = useRef<HTMLAnchorElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  const close = useCallback(() => { clear(); setOpen(false); setPinned(false) }, [])
  const place = useCallback(() => {
    const a = anchor.current
    if (!a) return
    const rects = a.getClientRects()
    const r = rects[rects.length - 1] || a.getBoundingClientRect()
    const first = rects[0] || r
    const vw = window.innerWidth, vh = window.innerHeight
    const width = Math.min(360, vw - 16)
    const above = vh - r.bottom < 320 && first.top > vh - r.bottom
    const left = Math.max(8, Math.min((above ? first.left : r.left), vw - width - 8))
    setPos({ left, top: above ? first.top : r.bottom, above, width })
  }, [])
  const show = () => {
    clear()
    if (open) return
    timer.current = window.setTimeout(() => { closeOthers?.(); closeOthers = close; place(); setOpen(true) }, OPEN_DELAY)
  }
  const hide = () => { if (pinned) return; clear(); timer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY) }
  const keep = () => clear()
  useLayoutEffect(() => { if (open) place() }, [open, place])
  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    const onDown = (e: Event) => { const t = e.target as Node; if (!pop.current?.contains(t) && !anchor.current?.contains(t)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); anchor.current?.focus() } }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove)
      document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey)
    }
  }, [open, place, close])
  useEffect(() => () => clear(), [])
  const touch = () => window.matchMedia('(hover: none)').matches
  const anchorProps = {
    ref: anchor,
    onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide,
    onClick: (e: React.MouseEvent) => { if (touch() && !open) { e.preventDefault(); closeOthers?.(); closeOthers = close; place(); setOpen(true); setPinned(true) } },
    'aria-expanded': open,
  }
  // A render function (not a component) so the card isn't remounted on every state change.
  const card = (label: string, children: ReactNode) => (open && pos ? createPortal(
    <div ref={pop} role="dialog" aria-label={label} className={`hover-pop no-print ${pos.above ? 'is-above' : ''}`}
      style={{ left: pos.left, top: pos.top, width: pos.width }}
      onMouseEnter={keep} onMouseLeave={hide} onFocus={keep} onBlur={hide} onMouseDown={() => setPinned(true)}>
      <div className="term-pop">
        <button type="button" className="pop-x" aria-label="Close" onClick={close}>×</button>
        {children}
      </div>
    </div>, document.body) : null)
  return { open, anchorProps, card }
}

function WikiMini({ load }: { load: () => Promise<WikiSummary | null> }) {
  const [d, setD] = useState<WikiSummary | null | undefined>(undefined)
  useEffect(() => { let live = true; load().then((x) => live && setD(x)); return () => { live = false } }, []) // eslint-disable-line
  if (d === undefined) return <span className="mt-2 block text-xs text-ink-2">Loading Wikipedia…</span>
  if (d === null) return <span className="mt-2 block text-xs text-ink-2">Wikipedia summary not available right now.</span>
  return (
    <span className="mt-2 flex gap-2 border-t border-line pt-2">
      {d.thumb && <img src={d.thumb} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded border border-line bg-white object-contain" />}
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-ink-2">Wikipedia: {d.title}{d.desc ? ` — ${d.desc}` : ''}</span>
        <span className="line-clamp-4 block text-[0.85rem] leading-snug">{d.extract}</span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          <a className="pop-btn" href={d.url} target="_blank" rel="noopener noreferrer">Article ↗</a>
          {d.permalink && <a className="pop-btn" href={d.permalink} target="_blank" rel="noopener noreferrer" title="Permanent link to the exact revision shown here">Permalink ↗</a>}
        </span>
      </span>
    </span>
  )
}

function TermLink({ id, children }: { id: string; children: ReactNode }) {
  const c = CONCEPT_MAP[id]
  const { open, anchorProps, card } = useHoverCard()
  const L = links(c)
  const roles = useMemo(() => (open ? jobsFor(c).titles.slice(0, 4) : []), [open, c])
  return (
    <>
      <Link to={`/c/${id}`} className="term-link" {...anchorProps}>{children}</Link>
      {card(c.term, <>
        <span className="mb-1 flex items-center gap-2 pr-6 text-xs text-ink-2">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ background: DOMAIN_MAP[c.domain].tape }} />{DOMAIN_MAP[c.domain].name}
        </span>
        <span className="block font-semibold text-ink">{c.term}{c.full && c.full !== c.term ? ` — ${c.full}` : ''}</span>
        <span className="mt-1 block text-[0.9rem] leading-snug text-ink">{c.one}</span>
        {c.formula && <span className="mt-1 block overflow-x-auto text-sm"><Tex tex={c.formula.tex} /></span>}
        {roles.length > 0 && <span className="mt-1.5 block text-xs text-ink-2"><strong className="text-ink">Needed by:</strong> {roles.join(' · ')}</span>}
        <WikiMini load={() => wikiFor(c)} />
        <span className="mt-2 flex flex-wrap gap-1.5">
          <Link to={`/c/${id}`} className="pop-btn !border-sblue !text-sblue">Open card</Link>
          <a href={L.google} target="_blank" rel="noopener noreferrer" className="pop-btn">Google ↗</a>
          <a href={askLinks(c.term)[2].href} target="_blank" rel="noopener noreferrer" className="pop-btn">Ask Perplexity ↗</a>
        </span>
      </>)}
    </>
  )
}

function WikiLink({ title, children }: { title: string; children: ReactNode }) {
  const { anchorProps, card } = useHoverCard()
  return (
    <>
      <a href={wikiUrl(title)} target="_blank" rel="noopener noreferrer" className="wiki-link" {...anchorProps}>{children}</a>
      {card(title, <>
        <span className="block pr-6 text-xs font-semibold text-ink-2">Wikipedia</span>
        <span className="block font-semibold text-ink">{title}</span>
        <WikiMini load={() => wiki({ title })} />
        <span className="mt-2 flex flex-wrap gap-1.5">
          <a href={googleUrl(title)} target="_blank" rel="noopener noreferrer" className="pop-btn">Google ↗</a>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="pop-btn">YouTube ↗</a>
        </span>
      </>)}
    </>
  )
}

/** Prose renderer: $inline math$, core terms linked to cards, key names linked to Wikipedia — all with hover cards. */
export function Linked({ text, self, max = 8 }: { text: string; self?: string; max?: number }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g), [text])
  let used = 0
  const seen = new Set<string>()
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return <Tex key={i} tex={p.slice(1, -1)} />
        const nodes: ReactNode[] = []
        let pos = 0
        for (const h of findTerms(p)) {
          const key = h.id || `w:${h.wiki}`
          if (h.id === self || seen.has(key) || used >= max) continue
          seen.add(key)
          used++
          nodes.push(p.slice(pos, h.start))
          const label = p.slice(h.start, h.end)
          nodes.push(h.id ? <TermLink key={`${i}-${h.start}`} id={h.id}>{label}</TermLink> : <WikiLink key={`${i}-${h.start}`} title={h.wiki!}>{label}</WikiLink>)
          pos = h.end
        }
        nodes.push(p.slice(pos))
        return <Fragment key={i}>{nodes}</Fragment>
      })}
    </>
  )
}

/* ---------- Web answer card (Wikipedia summary with lead image) ---------- */
export function WikiCard({ data, loading, query, compact = false }: { data: WikiSummary | null; loading: boolean; query: string; compact?: boolean }) {
  if (loading) return <p className="text-sm text-ink-2">Looking it up on Wikipedia…</p>
  if (!data) return (
    <p className="text-sm text-ink-2">No Wikipedia summary found for “{query}”. <a className="underline" href={googleUrl(query)} target="_blank" rel="noopener noreferrer">Search Google ↗</a></p>
  )
  return (
    <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
      {data.thumb && <img src={data.thumb} alt={data.title} loading="lazy" className={`${compact ? 'max-h-36 self-start' : 'max-h-56 sm:w-56'} rounded-md border border-line bg-white object-contain`} />}
      <div className="min-w-0">
        <p className="font-semibold">{data.title}{data.desc && <span className="font-normal text-ink-2"> — {data.desc}</span>}</p>
        <p className={`mt-1 text-[0.95rem] ${compact ? 'line-clamp-5' : ''}`}>{data.extract}</p>
        <p className="mt-2 text-xs text-ink-2">Source: Wikipedia (CC BY-SA). <a className="underline" href={data.url} target="_blank" rel="noopener noreferrer">Read the full article ↗</a>{data.permalink && <> · <a className="underline" href={data.permalink} target="_blank" rel="noopener noreferrer" title="Permanent link to the exact revision shown here">Permalink to this revision ↗</a></>}</p>
      </div>
    </div>
  )
}

export function useWiki(fn: () => Promise<WikiSummary | null>, deps: unknown[]) {
  const [data, setData] = useState<WikiSummary | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    setLoading(true)
    fn().then((d) => { if (live) { setData(d); setLoading(false) } })
    return () => { live = false }
  }, deps) // eslint-disable-line
  return { data, loading }
}

/* ---------- Select any word or phrase to look it up ---------- */
export function SelectionLookup() {
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null)
  const [card, setCard] = useState<{ text: string; x: number; y: number } | null>(null)
  const [data, setData] = useState<WikiSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onUp = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (boxRef.current?.contains(target)) return
      setTimeout(() => {
        const s = window.getSelection()
        const text = s?.toString().replace(/\s+/g, ' ').trim() || ''
        if (!s || !text || text.length < 2 || text.length > 60 || target.closest('input,textarea,select,button,a,svg')) { setSel(null); return }
        const r = s.getRangeAt(0).getBoundingClientRect()
        setSel({ text, x: r.left + r.width / 2 + window.scrollX, y: r.bottom + window.scrollY })
      }, 10)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSel(null); setCard(null) } }
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setCard(null) }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mouseup', onUp); document.removeEventListener('touchend', onUp); document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [])
  const look = () => {
    if (!sel) return
    setCard(sel); setSel(null); setLoading(true); setData(null)
    wiki({ query: sel.text }).then((d) => { setData(d); setLoading(false) })
  }
  const local = card ? search(card.text, 1)[0] : undefined
  const left = (x: number, w: number) => Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8))
  return (
    <div ref={boxRef}>
      {sel && (
        <button onMouseDown={(e) => e.preventDefault()} onClick={look} className="no-print absolute z-50 rounded-full border border-sblue bg-sblue px-3 py-1 text-sm font-semibold text-white shadow-lg"
          style={{ left: left(sel.x, 160), top: sel.y + 6 }}>
          Look up “{sel.text.length > 18 ? sel.text.slice(0, 18) + '…' : sel.text}”
        </button>
      )}
      {card && (
        <div role="dialog" aria-label={`Lookup: ${card.text}`} className="no-print absolute z-50 w-[22rem] max-w-[calc(100vw-16px)] rounded-lg border border-line bg-sheet p-4 shadow-2xl"
          style={{ left: left(card.x, 352), top: card.y + 8 }}>
          {local && (
            <Link to={`/c/${local.id}`} onClick={() => setCard(null)} className="mb-3 block rounded-md border border-sblue/40 bg-sblue/5 px-3 py-2 text-sm hover:border-sblue">
              In IE Launchpad: <strong>{local.term}</strong> — {local.one}
            </Link>
          )}
          <WikiCard data={data} loading={loading} query={card.text} compact />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <a className="pop-btn" href={googleUrl(card.text)} target="_blank" rel="noopener noreferrer">Google ↗</a>
            <a className="pop-btn" href={wikiSearchUrl(card.text)} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>
            <a className="pop-btn" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(card.text + ' explained')}`} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
            <button className="pop-btn" onClick={() => setCard(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
