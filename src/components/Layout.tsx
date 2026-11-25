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
    { to: '/mysteries', label: 'Factory mysteries' },
    { to: '/spot-waste', label: 'Spot the waste' },
    { to: '/notebook', label: 'Error notebook' },
  ] },
  { group: 'Labs and tools', items: [
    { to: '/lab', label: 'Simulator lab' },
    { to: '/lab/factory', label: 'Visual factory' },
    { to: '/academy', label: 'Engineering academy' },
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

export default function Layout() {
  useTheme()
  const [menu, setMenu] = useState(false)
  const [palette, setPalette] = useState(false)
  const loc = useLocation()
  const theme = useStore((s) => s.settings.theme)
  const setSettings = useStore((s) => s.setSettings)
  useEffect(() => {
    setMenu(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true) }
      if (e.key === '/' && !(e.target as HTMLElement).closest('input,textarea,select')) { e.preventDefault(); setPalette(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn">Skip to content</a>
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform border-r border-line bg-sheet transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          <NavLink to="/" className="block px-5 pb-4 pt-5">
            <span className="display block text-[1.42rem] leading-none">IE Launchpad V2</span>
            <span className="mt-1 block text-sm text-ink-2">Coursework to job offer</span>
          </NavLink>
          <div className="hazard mx-5 mb-3 h-1.5 rounded-sm" aria-hidden />
          <VersionSwitch className="mx-4 mb-3" />
          <button onClick={() => setPalette(true)} className="mx-4 mb-3 flex items-center justify-between rounded-md border border-line px-3 py-2 text-left text-sm text-ink-2 hover:border-ink">
            Search terms <kbd className="rounded border border-line px-1.5 text-xs">/</kbd>
          </button>
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
      {menu && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setMenu(false)} />}
      <div className="min-w-0 flex-1">
        <div className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-line bg-sheet/95 px-4 py-2 backdrop-blur lg:hidden">
          <button className="btn-ghost btn !px-3 !py-1.5" onClick={() => setMenu(true)} aria-label="Open menu">Menu</button>
          <span className="flex items-center gap-2"><span className="display text-lg">IE Launchpad</span><VersionSwitch compact /></span>
          <button className="btn-ghost btn !px-3 !py-1.5" onClick={() => setPalette(true)} aria-label="Search">Search</button>
        </div>
        <main id="main" className="max-w-[100rem] px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
        <footer className="no-print max-w-[100rem] px-4 pb-10 text-sm text-ink-2 sm:px-8">
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
