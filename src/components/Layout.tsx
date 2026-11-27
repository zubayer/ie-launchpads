import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { search } from '../lib/search'
import { useStore } from '../lib/store'
import { CONCEPTS } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import { googleUrl, wiki, wikiSearchUrl } from '../lib/web'
import { SelectionLookup, WikiCard, useWiki } from './Glossary'
import { v1Href } from '../lib/version'

const NAV: { group: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  { group: '', items: [{ to: '/', label: 'Today', end: true }] },
  { group: 'Learn', items: [
    { to: '/paths', label: 'Guided pathways' },
    { to: '/directory', label: 'A–Z directory' },
    { to: '/dictionary', label: 'Abbreviation dictionary' },
    { to: '/domains', label: 'Domains' },
    { to: '/curriculum', label: 'Curriculum coverage' },
    { to: '/table', label: 'Periodic table' },
    { to: '/chains', label: 'Reaction chains' },
    { to: '/guide', label: 'Method field guide' },
    { to: '/formulas', label: 'Formula library' },
    { to: '/sheets/engecon', label: 'Eng Econ cheat sheet' },
  ] },
  { group: 'Practice', items: [
    { to: '/review', label: 'Flashcard review' },
    { to: '/practice', label: 'Practice quiz' },
    { to: '/pairs', label: 'Confused pairs' },
    { to: '/compare', label: 'Advanced comparison' },
    { to: '/mysteries', label: 'Factory mysteries' },
    { to: '/spot-waste', label: 'Spot the waste' },
    { to: '/notebook', label: 'Error notebook' },
  ] },
  { group: 'Labs and tools', items: [
    { to: '/lab', label: 'Simulator lab' },
    { to: '/lab/factory', label: 'Visual factory' },
    { to: '/academy', label: 'Engineering academy' },
    { to: '/studio/sql', label: 'SQL studio' },
    { to: '/studio/plc', label: 'PLC studio' },
    { to: '/studio/cad', label: 'CAD studio' },
    { to: '/tools', label: 'Tool cards' },
  ] },
  { group: 'Career', items: [
    { to: '/subway', label: 'IE subway map' },
    { to: '/roles', label: 'Role paths' },
    { to: '/interview', label: 'Interview prep' },
  ] },
  { group: 'You', items: [
    { to: '/plan', label: 'Daily plan' },
    { to: '/graph', label: 'Knowledge map' },
    { to: '/progress', label: 'Progress' },
    { to: '/method', label: 'How to learn fast' },
  ] },
]

function useTheme() {
  const theme = useStore((s) => s.settings.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1522' : '#f4f6fa')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

export function WebAnswer({ query }: { query: string }) {
  const [dq, setDq] = useState(query)
  useEffect(() => { const t = setTimeout(() => setDq(query), 450); return () => clearTimeout(t) }, [query])
  const w = useWiki(() => wiki({ query: dq }), [dq])
  return (
    <div className="space-y-3">
      <WikiCard data={w.data} loading={w.loading} query={query} />
      <div className="flex flex-wrap gap-1.5">
        <a className="pop-btn" href={googleUrl(query)} target="_blank" rel="noopener noreferrer">Google results ↗</a>
        <a className="pop-btn" href={wikiSearchUrl(query)} target="_blank" rel="noopener noreferrer">Wikipedia search ↗</a>
        <a className="pop-btn" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' explained')}`} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </div>
    </div>
  )
}

/** Open the site-wide search palette from anywhere on the page (the top bar owns the one search). */
export const OPEN_SEARCH = 'ie:open-search'
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH))
export const openGoogle = (q: string) => window.open(googleUrl(q), '_blank', 'noopener')

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const [webQ, setWebQ] = useState('')
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  const results = useMemo(() => search(q, 10), [q])
  useEffect(() => {
    if (open) {
      setQ('')
      setWebQ('')
      setI(0)
      setTimeout(() => ref.current?.focus(), 10)
    }
  }, [open])
  if (!open) return null
  const go = (id: string) => {
    onClose()
    nav(`/c/${id}`)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Search concepts"
        className="sheet w-full max-w-xl overflow-hidden rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={ref}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setWebQ('')
            setI(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
            if (e.key === 'Enter') {
              if (results[i]) go(results[i].id)
              else if (q.trim()) { openGoogle(q.trim()); setWebQ(q.trim()) }
            }
          }}
          placeholder={`Search ${CONCEPTS.length} terms: FMEA, takt time, Cpk, etching…`}
          className="w-full border-b border-line bg-transparent px-4 py-4 text-lg outline-none"
          aria-label="Search"
        />
        <ul className="max-h-[55vh] overflow-y-auto" role="listbox">
          {results.map((c, idx) => (
            <li key={c.id} role="option" aria-selected={idx === i}>
              <button
                onMouseEnter={() => setI(idx)}
                onClick={() => go(c.id)}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left ${idx === i ? 'bg-sblue/10' : ''}`}
              >
                <span className="mt-1.5 inline-block h-2 w-4 shrink-0 rounded-sm" style={{ background: DOMAIN_MAP[c.domain].tape }} />
                <span>
                  <span className="font-semibold">{c.term}</span>
                  {c.full && c.full !== c.term && <span className="text-ink-2"> — {c.full}</span>}
                  <span className="block text-sm text-ink-2">{c.one}</span>
                </span>
              </button>
            </li>
          ))}
          {q && !results.length && !webQ && <li className="px-4 py-5 text-ink-2">No card for “{q}” yet. Press <kbd className="rounded border border-line px-1">Enter</kbd> to see what Google and Wikipedia say.</li>}
          {webQ && <li className="px-4 py-4"><p className="label mb-2">From the web — Google opened in a new tab</p><WebAnswer query={webQ} /></li>}
          {q && results.length > 0 && <li className="border-t border-line px-4 py-2 text-sm"><a className="underline" href={googleUrl(q)} target="_blank" rel="noopener noreferrer">Search Google for “{q}” ↗</a></li>}
          {!q && <li className="px-4 py-4 text-sm text-ink-2">Type a term, acronym or idea. Use ↑ ↓ and Enter.</li>}
        </ul>
      </div>
    </div>
  )
}

/** True while a CSS media query matches (re-evaluated when it changes). */
function useMedia(query: string) {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
  const [on, setOn] = useState(get)
  useEffect(() => {
    const m = window.matchMedia?.(query)
    if (!m) return
    const h = () => setOn(m.matches)
    h()
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [query])
  return on
}

const HOVER_OPEN_MS = 250 // dwell at the left edge before the menu slides in, so passing the edge doesn't open it
const HOVER_CLOSE_MS = 350

export default function Layout() {
  useTheme()
  // Owner decision (2026-11-26): on desktop the menu is hidden by default so lessons get the full width. It slides in
  // when the pointer rests at the left edge, from the Menu button, or with the M key, and Pin keeps it docked open.
  // Search stays in the top bar on every page and screen size.
  const [menu, setMenu] = useState(false) // drawer open (when not docked)
  const [byHover, setByHover] = useState(false)
  const [palette, setPalette] = useState(false)
  const loc = useLocation()
  const theme = useStore((s) => s.settings.theme)
  const pinned = useStore((s) => !!s.settings.navPinned)
  const setSettings = useStore((s) => s.setSettings)
  const wide = useMedia('(min-width: 1024px)')
  const canHover = useMedia('(hover: hover) and (pointer: fine)')
  const docked = wide && pinned
  const shown = docked || menu
  const timer = useRef<number | undefined>(undefined)
  const navRef = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const clear = () => window.clearTimeout(timer.current)
  const openByHover = () => { clear(); timer.current = window.setTimeout(() => { setByHover(true); setMenu(true) }, HOVER_OPEN_MS) }
  const closeByHover = () => { clear(); if (byHover) timer.current = window.setTimeout(() => setMenu(false), HOVER_CLOSE_MS) }
  const toggle = (focus = true) => {
    clear()
    setByHover(false)
    setMenu((m) => {
      if (!m && focus) requestAnimationFrame(() => navRef.current?.querySelector<HTMLElement>('a,button')?.focus())
      return !m
    })
  }
  // The Menu button is inert while the drawer covers it, so move focus back after the re-render.
  const close = () => { clear(); setMenu(false); if (!byHover) requestAnimationFrame(() => menuBtn.current?.focus()) }
  const overlay = menu && !docked
  // Keyboard focus must never sit on controls the drawer covers (WCAG 2.4.11). A drawer opened by click or
  // `m` makes the page behind it inert; if focus still leaves the drawer (hover-opened, skip link), close it.
  useEffect(() => {
    if (!overlay) return
    const h = (e: FocusEvent) => { if (!navRef.current?.contains(e.target as Node)) { clear(); setMenu(false) } }
    document.addEventListener('focusin', h)
    return () => document.removeEventListener('focusin', h)
  }, [overlay])
  useEffect(() => {
    setMenu(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])
  useEffect(() => () => clear(), [])
  useEffect(() => {
    const o = () => setPalette(true)
    window.addEventListener(OPEN_SEARCH, o)
    return () => window.removeEventListener(OPEN_SEARCH, o)
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const typing = !!(e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true) }
      else if (e.key === '/' && !typing) { e.preventDefault(); setPalette(true) }
      else if (e.key.toLowerCase() === 'm' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !docked) { e.preventDefault(); toggle() }
      else if (e.key === 'Escape' && menu && !docked) close()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn">Skip to content</a>
      {!docked && !menu && wide && canHover && (
        <div aria-hidden className="no-print fixed inset-y-0 left-0 z-40 w-2" data-testid="nav-edge" onMouseEnter={openByHover} onMouseLeave={clear} />
      )}
      <aside
        id="site-nav"
        ref={navRef}
        inert={!shown}
        aria-label="Site menu"
        onMouseEnter={clear}
        onMouseLeave={closeByHover}
        className={`no-print z-40 w-72 shrink-0 border-r border-line bg-sheet transition-transform duration-200 ease-out motion-reduce:transition-none ${docked ? 'sticky top-0 h-screen' : `fixed inset-y-0 left-0 ${menu ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-5">
            <NavLink to="/" className="block">
              <span className="display block text-[1.42rem] leading-none">IE Launchpad V2</span>
              <span className="mt-1 block text-sm text-ink-2">Coursework to job offer</span>
            </NavLink>
            {wide ? (
              <button type="button" className="pop-btn shrink-0" aria-pressed={pinned} onClick={() => { setSettings({ navPinned: !pinned }); setMenu(false) }}
                title={pinned ? 'Hide the menu; it slides in from the left edge' : 'Keep the menu open on every page'}>
                {pinned ? 'Unpin' : 'Pin'}
              </button>
            ) : (
              <button type="button" className="pop-btn shrink-0" onClick={close} aria-label="Close menu">Close</button>
            )}
          </div>
          <div className="hazard mx-5 mb-3 h-1.5 rounded-sm" aria-hidden />
          <VersionSwitch className="mx-4 mb-3" />
          <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Main">
            {NAV.map((g) => (
              <div key={g.group || 'top'} className={g.group ? 'mt-4' : ''}>
                {g.group && <p className="px-3 pb-1 text-xs font-bold text-ink-2" id={`nav-${g.group.replace(/\s+/g, "-").toLowerCase()}`}>{g.group}</p>}
                <ul aria-labelledby={g.group ? `nav-${g.group.replace(/\s+/g, "-").toLowerCase()}` : undefined}>
                  {g.items.map((n) => (
                    <li key={n.to}>
                      <NavLink
                        to={n.to}
                        end={n.end ?? n.to === '/lab'}
                        className={({ isActive }) =>
                          `relative block rounded-md px-3 py-1.5 text-[0.95rem] ${isActive ? 'bg-sblue/10 font-semibold text-sblue before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-sm before:bg-sblue' : 'text-ink-2 hover:bg-paper hover:text-ink'}`
                        }
                      >
                        {n.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-line px-4 py-3 text-sm">
            <button className="text-ink-2 hover:text-ink" onClick={() => setSettings({ theme: nextTheme })}>
              Theme: {theme === 'system' ? 'match device' : theme}
            </button>
          </div>
        </div>
      </aside>
      {overlay && <div className={`no-print fixed inset-0 z-30 ${byHover ? '' : 'bg-ink/30'}`} onClick={close} aria-hidden />}
      <div className="min-w-0 flex-1" inert={overlay && !byHover} data-testid="page">
        <div className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-sheet/95 px-3 py-2 backdrop-blur sm:px-6">
          {!docked && (
            <button ref={menuBtn} type="button" className="btn-ghost btn shrink-0 !px-3 !py-1.5" onClick={() => toggle()} aria-expanded={menu} aria-controls="site-nav"
              title="Show the menu (M). On a computer it also slides in when the pointer rests at the left edge of the screen.">
              Menu
            </button>
          )}
          {!docked && <NavLink to="/" className="display hidden shrink-0 text-lg sm:block">IE Launchpad</NavLink>}
          <button type="button" onClick={() => setPalette(true)} aria-label={`Search ${CONCEPTS.length} terms`}
            className="flex min-w-0 max-w-3xl flex-1 items-center justify-between gap-3 rounded-md border border-line bg-sheet px-3 py-1.5 text-left text-sm text-ink-2 hover:border-ink">
            <span className="truncate">Search {CONCEPTS.length} terms: FMEA, takt time, Cpk…</span>
            <kbd className="hidden rounded border border-line px-1.5 text-xs sm:inline">/</kbd>
          </button>
          {!docked && <span className="hidden shrink-0 sm:block"><VersionSwitch compact /></span>}
        </div>
        <main id="main" className="mx-auto max-w-[160rem] px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
        <footer className="no-print mx-auto max-w-[160rem] px-4 pb-10 text-sm text-ink-2 sm:px-8">
          Progress is saved in this browser. Export it from <NavLink className="underline" to="/progress">Progress</NavLink> to move devices.
        </footer>
      </div>
      <SearchPalette open={palette} onClose={() => setPalette(false)} />
      <SelectionLookup />
    </div>
  )
}

/** V1 ↔ V2 switch. V2 is this app; V1 opens the original site on the same page where V1 has it. */
function VersionSwitch({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { pathname } = useLocation()
  const seg = 'flex-1 rounded px-2 py-1 text-center text-xs font-semibold'
  return (
    <div className={`flex items-center rounded-md border border-line p-0.5 ${compact ? 'w-24' : ''} ${className}`} role="group" aria-label="App version">
      <span className={`${seg} bg-sblue text-sheet`} aria-current="page">V2</span>
      <a className={`${seg} text-ink-2 hover:bg-paper hover:text-ink`} href={v1Href(pathname)}
        title="Open this page in the original V1 site. Progress is saved separately in each version.">V1</a>
    </div>
  )
}
