import { Suspense, lazy, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { SIM_META } from '../sims/registry'
import { search } from '../lib/search'
import { isDue } from '../lib/srs'
import { streak, useStore } from '../lib/store'
import { ConceptRow } from '../components/ui'
import { FocusTimer } from '../components/FocusTimer'
import { WebAnswer, openGoogle } from '../components/Layout'

/** Signature moment: a control chart that draws itself, with one point out of control. */
function ChartMark() {
  const pts = [52, 47, 55, 50, 44, 53, 49, 57, 46, 51, 54, 48, 50, 83, 52, 47]
  const x = (i: number) => 20 + i * 24
  const y = (v: number) => 150 - v * 1.4
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')
  return (
    <svg viewBox="0 0 400 160" className="w-full" role="img" aria-label="A control chart with one point above the upper control limit">
      <line x1="10" x2="390" y1={y(70)} y2={y(70)} stroke="var(--color-sred)" strokeDasharray="6 5" />
      <line x1="10" x2="390" y1={y(50)} y2={y(50)} stroke="var(--color-ink-2)" />
      <line x1="10" x2="390" y1={y(30)} y2={y(30)} stroke="var(--color-sred)" strokeDasharray="6 5" />
      <text x="392" y={y(70) - 6} textAnchor="end" fontSize="11" fill="var(--color-sred)">UCL</text>
      <text x="392" y={y(30) - 6} textAnchor="end" fontSize="11" fill="var(--color-sred)">LCL</text>
      <path d={d} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" className="draw" />
      {pts.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={v > 70 ? 6 : 3.2} fill={v > 70 ? 'var(--color-tape)' : 'var(--color-ink)'} stroke={v > 70 ? 'var(--color-ink)' : 'none'} strokeWidth="2" />
      ))}
    </svg>
  )
}

const DoNext = lazy(() => import('../components/DoNext'))

export default function Home() {
  const [q, setQ] = useState('')
  const [webQ, setWebQ] = useState('')
  const nav = useNavigate()
  const cards = useStore((s) => s.cards)
  const progress = useStore((s) => s.progress)
  const activity = useStore((s) => s.activity)
  const settings = useStore((s) => s.settings)
  const due = Object.values(cards).filter((c) => isDue(c)).length
  const results = useMemo(() => search(q, 6), [q])
  const role = ROLES.find((r) => r.id === settings.path)

  const todays = useMemo(() => {
    const order = role
      ? role.concepts.map((id) => CONCEPT_MAP[id]).filter(Boolean)
      : DOMAINS.flatMap((d) => CONCEPTS.filter((c) => c.domain === d.id && c.level === 1).slice(0, 3))
    return order.filter((c) => !progress[c.id]?.opened).slice(0, settings.dailyNew)
  }, [role, progress, settings.dailyNew])

  const opened = Object.values(progress).filter((p) => p.opened).length
  const st = streak(activity)

  return (
    <div>
      <section className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h1 className="display text-[2.6rem] sm:text-6xl">Learn industrial engineering the way the job uses it.</h1>
          <p className="measure mt-4 text-lg text-ink-2">
            {CONCEPTS.length} concepts across {DOMAINS.length} domains, each built in layers — plain meaning, analogy, math, worked example, shop-floor use and interview answer — plus simulators and spaced review.
          </p>
          <form className="relative mt-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); if (results[0]) nav(`/c/${results[0].id}`); else if (q.trim()) { openGoogle(q.trim()); setWebQ(q.trim()) } }}>
            <input className="input !py-3.5 text-lg" value={q} onChange={(e) => { setQ(e.target.value); setWebQ('') }} placeholder="Look up a term: FMEA, takt time, etching, random forest…" aria-label="Look up a term" />
            {q && (
              <ul className="sheet absolute inset-x-0 top-full z-10 mt-1 rounded-md shadow-lg">
                {results.map((c) => (
                  <li key={c.id}>
                    <Link to={`/c/${c.id}`} className="block px-4 py-2 hover:bg-paper">
                      <span className="font-semibold">{c.term}</span> <span className="text-sm text-ink-2">{DOMAIN_MAP[c.domain].short} · {c.one}</span>
                    </Link>
                  </li>
                ))}
                {!results.length && !webQ && <li className="px-4 py-3 text-ink-2">No card for “{q}” yet. Press Enter to see what Google and Wikipedia say.</li>}
                {webQ && <li className="px-4 py-3"><p className="label mb-2">From the web — Google opened in a new tab</p><WebAnswer query={webQ} /></li>}
              </ul>
            )}
          </form>
        </div>
        <div className="sheet rounded-lg p-4">
          <ChartMark />
          <p className="px-2 pt-1 text-sm text-ink-2">Point 14 breaks the upper control limit. By the end of the Quality track you'll know what to do next — and how to explain it in an interview.</p>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="sheet rounded-lg p-5 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="wide text-xl">Today</h2>
            <span className="text-sm text-ink-2">{role ? `Path: ${role.title}` : <Link className="underline" to="/roles">Choose a role path</Link>}</span>
          </div>
          <Suspense fallback={<p className="mt-4 text-sm text-ink-2">Working out what to do next…</p>}><DoNext /></Suspense>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/review" className={`rounded-md border p-4 ${due ? 'border-sorange' : 'border-line'} hover:border-ink`}>
              <span className="display block text-3xl">{due}</span>
              <span className="text-sm text-ink-2">{due === 1 ? 'card due for review' : 'cards due for review'}</span>
            </Link>
            <div className="rounded-md border border-line p-4">
              <span className="display block text-3xl">{st}</span>
              <span className="text-sm text-ink-2">{st === 1 ? 'day streak' : 'day streak'}</span>
            </div>
            <div className="rounded-md border border-line p-4">
              <span className="display block text-3xl">{opened}</span>
              <span className="text-sm text-ink-2">concepts opened of {CONCEPTS.length}</span>
            </div>
          </div>
          <h3 className="label mt-6">New lessons {role ? 'on your path' : 'to start with'}</h3>
          <div className="mt-1">
            {todays.map((c) => <ConceptRow key={c.id} c={c} />)}
            {!todays.length && <p className="py-3 text-ink-2">You've opened everything on this path. Run a <Link className="underline" to="/practice">mixed quiz</Link> to lock it in.</p>}
          </div>
        </div>
        <div className="space-y-6">
          <FocusTimer />
          <div className="sheet rounded-lg p-5">
            <h2 className="wide text-lg">Jump into a lab</h2>
            <ul className="mt-2 space-y-1.5">
              {SIM_META.slice(0, 6).map((s) => (
                <li key={s.id}><Link className="hover:underline" to={`/lab/${s.id}`}>{s.name}</Link></li>
              ))}
            </ul>
            <Link to="/lab" className="mt-3 inline-block text-sm underline">All {SIM_META.length} simulators</Link>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="wide mb-4 text-xl">Where do you want to work?</h2>
        <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <Link key={r.id} to={`/roles/${r.id}`} className="border-b border-line py-3 hover:bg-sblue/5">
              <span className="font-semibold">{r.title}</span>
              <span className="block text-sm text-ink-2">{r.summary}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
