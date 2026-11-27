import { Suspense, lazy, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { useConcept } from '../content/load'
import { SIM_META } from '../sims/registry'
import { useStore } from '../lib/store'
import { Tex } from '../components/ui'
import { openSearch } from '../components/Layout'
import type { Concept } from '../types'

/*
 * Landing page, owner decision 2026-11-26 ("Option A — three doors"):
 * 1. returning learners get one "welcome back" bar (first-time visitors never see zeros);
 * 2. the hero asks what the visitor came to do: look up a term, train for a job, or practise hands-on;
 * 3. a real lesson can be tried right on the page; 4. the four moves every lesson follows;
 * 5. role paths as cards; 6. the studios; 7. every domain. The top bar holds the only search box.
 */

const WelcomeBack = lazy(() => import('../components/WelcomeBack'))

const PREVIEW_ID = 'lean.takt-time'
const FEATURED_ROLES = ['industrial-engineer', 'quality-engineer', 'manufacturing-engineer', 'process-engineer-semi', 'ci-engineer', 'data-analyst']

const MOVES = [
  { name: 'Understand', q: 'What is it, in plain words?', color: 'var(--color-sblue)', parts: ['Keyword', 'Live from the web', 'Plain meaning', 'Analogy', 'Picture it'] },
  { name: 'Calculate', q: 'How do I work it out?', color: 'var(--color-tape)', parts: ['Why it matters', 'The math', 'Worked example'] },
  { name: 'Apply', q: 'Where does it show up at work?', color: 'var(--color-sgreen)', parts: ['On the job', 'Jobs that need it', 'Simulate it'] },
  { name: 'Prove it', q: 'Can I explain it under pressure?', color: 'var(--color-sred)', parts: ['Check yourself', 'Interview', 'Teach it back', 'Review deck'] },
]

export default function Home() {
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const path = useStore((s) => s.settings.path)
  const returning = Object.values(progress).some((p) => p.opened) || Object.keys(cards).length > 0

  return (
    <div>
      {returning && <Suspense fallback={null}><WelcomeBack /></Suspense>}

      <section className="grid items-start gap-8 xl:grid-cols-[1.15fr_1fr] xl:gap-10">
        <div>
          <h1 className="display text-[2.4rem] sm:text-6xl">Learn industrial engineering the way the job uses it.</h1>
          <p className="measure mt-4 text-lg text-ink-2">
            {CONCEPTS.length} terms across {DOMAINS.length} domains. Every lesson goes from plain meaning to the math, a worked example, the shop floor and the interview answer.
          </p>
          <h2 className="mt-7 font-bold">What brings you here today?</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            <Door n={CONCEPTS.length} title="Look up a term" text="Class, exam or a meeting tomorrow? The meaning in 30 seconds, the depth when you want it."
              action={<button type="button" onClick={openSearch} className="door-go">Search terms <kbd className="kbd">/</kbd></button>} primary />
            <Door n={ROLES.length} title="Train for a job" text="Pick a role. Get its 20 lessons in the order the job needs them, then the interview prep."
              action={<Link to="/roles" className="door-go">Choose a role path →</Link>} />
            <Door n={SIM_META.length} title="Practise hands-on" text="Simulators for SPC, DOE, queues and scheduling, plus SQL, PLC and CAD studios."
              action={<Link to="/lab" className="door-go">Open the lab →</Link>} />
          </ul>
        </div>
        <LessonPreview />
      </section>

      <section className="mt-14" aria-labelledby="moves-h">
        <h2 id="moves-h" className="wide text-2xl">Every lesson follows the same four moves</h2>
        <p className="mt-1 text-ink-2">Stop after any move. Come back to the next one when you need it.</p>
        <ol className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-0">
          {MOVES.map((m, i) => (
            <li key={m.name} className={`sheet relative rounded-lg p-4 md:p-5 xl:rounded-none ${i === 0 ? 'xl:rounded-l-lg' : 'xl:border-l-0'} ${i === MOVES.length - 1 ? 'xl:rounded-r-lg' : ''}`}>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
                <span><span className="sr-only">Move {i + 1}: </span>{m.name}</span>
              </h3>
              <p className="mt-1 text-sm text-ink-2">{m.q}</p>
              <ul className="mt-3 hidden flex-wrap gap-1.5 md:flex" aria-label={`${m.name} sections`}>
                {m.parts.map((p) => <li key={p} className="rounded border border-line px-2 py-0.5 text-[0.8rem]">{p}</li>)}
              </ul>
              {i < MOVES.length - 1 && (
                <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper text-[0.7rem] text-tape xl:flex">▶</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <Roles path={path} />

      <section className="mt-14" aria-labelledby="labs-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="labs-h" className="wide text-2xl">Practise with the tools engineers use</h2>
          <Link to="/lab" className="font-semibold text-sblue hover:underline">All {SIM_META.length} simulators →</Link>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Tool to="/lab/control-chart" title="Control chart simulator" text="Shift the process and watch the rules catch it." art={<ChartArt />} />
          <Tool to="/studio/sql" title="SQL studio" text="Query a practice plant database in your browser." art={<SqlArt />} />
          <Tool to="/studio/plc" title="PLC studio" text="Write ladder logic and run it against a scenario." art={<LadderArt />} />
          <Tool to="/studio/cad" title="CAD studio" text="Constrain a sketch, mate parts, check a beam by hand." art={<CadArt />} />
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="domains-h">
        <h2 id="domains-h" className="wide text-2xl">Or browse all {DOMAINS.length} domains</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <li key={d.id}>
              <Link to={`/d/${d.id}`} className="sheet flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold hover:border-sblue">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: d.tape }} />
                {d.name} <span className="font-normal text-ink-2">{CONCEPTS.filter((c) => c.domain === d.id).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Door({ n, title, text, action, primary }: { n: number; title: string; text: string; action: ReactNode; primary?: boolean }) {
  return (
    <li className={`sheet grid grid-cols-[3.75rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg p-4 md:flex md:flex-col md:gap-1.5 ${primary ? '!border-sblue shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-sblue)_18%,transparent)]' : ''}`}>
      <span className="display row-span-3 text-2xl md:text-3xl" aria-hidden>{n}</span>
      <h3 className="wide text-lg">{title}</h3>
      <p className="flex-1 text-sm text-ink-2">{text}</p>
      <span>{action}</span>
    </li>
  )
}

/* ---------- 2. A real lesson, tried on the page ---------- */

const TABS = ['Plain meaning', 'The math', 'On the job', 'Interview'] as const

function LessonPreview() {
  const idx = CONCEPT_MAP[PREVIEW_ID]
  const full = useConcept(PREVIEW_ID)
  const [tab, setTab] = useState(1)
  const [answer, setAnswer] = useState(false)
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const key = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (tab + d + TABS.length) % TABS.length
    setTab(n); refs.current[n]?.focus()
  }
  if (!idx) return null
  const c = full.data as Concept | undefined
  return (
    <section aria-labelledby={`${base}-h`} className="sheet overflow-hidden rounded-lg">
      <div className="px-5 pb-3 pt-5">
        <p className="text-sm text-ink-2">A lesson, tried right here</p>
        <h2 id={`${base}-h`} className="display mt-2 text-3xl">{idx.term}</h2>
        <p className="mt-1 text-ink-2">{idx.one}</p>
      </div>
      <div role="tablist" aria-label={`${idx.term} lesson parts`} className="flex gap-1 overflow-x-auto border-b border-line px-3" onKeyDown={key}>
        {TABS.map((t, i) => (
          <button key={t} ref={(el) => { refs.current[i] = el }} type="button" role="tab" id={`${base}-t${i}`} aria-selected={tab === i} aria-controls={`${base}-p`}
            tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)}
            className={`shrink-0 border-b-[3px] px-3 py-2 text-sm font-semibold ${tab === i ? 'border-tape text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>{t}</button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-p`} aria-labelledby={`${base}-t${tab}`} className="min-h-[13rem] px-5 py-4 text-[0.95rem]">
        {!c ? <p className="text-ink-2">{full.error ? 'This lesson could not load. Open the full lesson instead.' : 'Loading the lesson…'}</p>
          : tab === 0 ? <p>{c.def}</p>
          : tab === 1 ? (
            <>
              {c.formula && <div className="overflow-x-auto py-1 text-center"><Tex tex={c.formula.tex} block /></div>}
              {c.example && (
                <div className="mt-3 rounded-md bg-grid px-4 py-3">
                  <p><span className="font-semibold">Worked example:</span> {c.example.q}</p>
                  <ol className="mt-1 list-decimal pl-5 text-ink-2">{c.example.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  <p className="mt-1 font-semibold text-tape-ink">{c.example.a}</p>
                </div>
              )}
            </>
          )
          : tab === 2 ? (
            c.real ? (
              <div>
                <p className="label">{c.real.where}{c.real.kind !== 'documented' && <span className="ml-2 chip">Illustrative</span>}</p>
                <p className="mt-1">{c.real.story}</p>
                {c.used?.roles?.length ? <p className="mt-3 text-sm text-ink-2">Used by: {c.used.roles.slice(0, 4).join(', ')}</p> : null}
              </div>
            ) : <p className="text-ink-2">Open the full lesson to see how it is used at work.</p>
          )
          : c.iq?.[0] ? (
            <div className="rounded-r-md border-l-[3px] border-sblue bg-sblue/5 px-4 py-3">
              <p className="font-semibold">“{c.iq[0].q}”</p>
              <button type="button" className="mt-2 text-sm underline" aria-expanded={answer} onClick={() => setAnswer(!answer)}>{answer ? 'Hide' : 'Show'} a model answer</button>
              {answer && <p className="mt-2 text-ink-2">{c.iq[0].a}</p>}
            </div>
          ) : <p className="text-ink-2">Open the full lesson for interview practice.</p>}
      </div>
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        <Link to={`/c/${PREVIEW_ID}`} className="btn btn-ghost">Open the full lesson</Link>
        {c?.sim && SIM_META.some((s) => s.id === c.sim) && <Link to={`/lab/${c.sim}`} className="btn btn-ghost">Try it in the {SIM_META.find((s) => s.id === c.sim)!.name.toLowerCase()} lab</Link>}
      </div>
    </section>
  )
}

/* ---------- 4. Role paths as cards ---------- */

function Roles({ path }: { path: string | null }) {
  const shown = useMemo(() => {
    const ids = path && !FEATURED_ROLES.includes(path) ? [path, ...FEATURED_ROLES.slice(0, 5)] : path ? [path, ...FEATURED_ROLES.filter((r) => r !== path)] : FEATURED_ROLES
    return ids.map((id) => ROLES.find((r) => r.id === id)).filter((r): r is (typeof ROLES)[number] => !!r)
  }, [path])
  return (
    <section className="mt-14" aria-labelledby="roles-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="roles-h" className="wide text-2xl">Where do you want to work?</h2>
        <Link to="/roles" className="font-semibold text-sblue hover:underline">See all {ROLES.length} role paths →</Link>
      </div>
      <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((r, i) => {
          const mine = r.id === path
          const lessons = r.concepts.filter((id) => CONCEPT_MAP[id])
          const first = CONCEPT_MAP[lessons[0]]
          const counts: Record<string, number> = {}
          lessons.forEach((id) => { const d = CONCEPT_MAP[id].domain; counts[d] = (counts[d] || 0) + 1 })
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => DOMAIN_MAP[d as keyof typeof DOMAIN_MAP]?.short || d)
          return (
            <li key={r.id} className={i >= 3 ? 'hidden md:block' : ''}>
              <Link to={`/roles/${r.id}`} className={`sheet flex h-full flex-col rounded-lg p-4 hover:border-sblue ${mine ? '!border-sblue' : ''}`}>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-bold">{r.title}</span>
                  {mine && <span className="chip shrink-0 !border-sblue !text-sblue">Your path</span>}
                </span>
                <span className="mt-1 flex-1 text-sm text-ink-2">{r.summary}</span>
                <span className="mt-3 flex flex-col gap-0.5 text-[0.8rem] text-ink-2">
                  <span>{lessons.length} lessons · {top.join(' · ')}</span>
                  {first && <span>Starts with <span className="font-semibold text-ink">{first.term}</span></span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------- 5. Studios and labs ---------- */

function Tool({ to, title, text, art }: { to: string; title: string; text: string; art: ReactNode }) {
  return (
    <li>
      <Link to={to} className="sheet block h-full overflow-hidden rounded-lg hover:border-sblue">
        <span aria-hidden className="flex h-24 items-center sm:h-32 justify-center border-b border-line bg-grid p-3">{art}</span>
        <span className="block px-3 py-3 sm:px-4">
          <span className="block font-bold">{title}</span>
          <span className="hidden text-sm text-ink-2 sm:block">{text}</span>
        </span>
      </Link>
    </li>
  )
}

function ChartArt() {
  const pts = [64, 70, 56, 62, 74, 58, 66, 52, 72, 62, 57, 68, 63, 14, 60, 66]
  return (
    <svg viewBox="0 0 300 110" className="w-full">
      <line x1="0" x2="300" y1="28" y2="28" stroke="var(--color-sred)" strokeDasharray="6 5" />
      <line x1="0" x2="300" y1="62" y2="62" stroke="var(--color-ink-2)" />
      <line x1="0" x2="300" y1="96" y2="96" stroke="var(--color-sred)" strokeDasharray="6 5" />
      <polyline fill="none" stroke="var(--color-ink)" strokeWidth="2.2" points={pts.map((y, i) => `${10 + i * 18},${y}`).join(' ')} />
      <circle cx={10 + 13 * 18} cy="14" r="6" fill="var(--color-tape)" stroke="var(--color-ink)" strokeWidth="2" />
    </svg>
  )
}
function SqlArt() {
  return (
    <code className="block w-full whitespace-pre text-left font-mono text-[0.78rem] leading-relaxed text-ink">
      <span className="text-sblue">SELECT</span> line, <span className="text-sblue">AVG</span>(cycle_s){'\n'}<span className="text-sblue">FROM</span> production{'\n'}<span className="text-sblue">WHERE</span> shift = <span className="text-ink-2">'B'</span>{'\n'}<span className="text-sblue">GROUP BY</span> line;
    </code>
  )
}
function LadderArt() {
  return (
    <svg viewBox="0 0 300 110" className="w-full" fill="none" stroke="var(--color-ink)" strokeWidth="2">
      <path d="M14 6V104M286 6V104M14 34H70M70 22V46M82 22V46M82 34H140M140 22V46M152 22V46M152 34H230M256 34H286M14 80H70M70 68V92M82 68V92M82 80H230M256 80H286" />
      <circle cx="243" cy="34" r="12" stroke="var(--color-sgreen)" />
      <circle cx="243" cy="80" r="12" />
    </svg>
  )
}
function CadArt() {
  return (
    <svg viewBox="0 0 300 110" className="w-full" fill="none" stroke="var(--color-ink)" strokeWidth="2">
      <path d="M60 92V30H150V55H240V92Z" />
      <circle cx="105" cy="62" r="14" stroke="var(--color-sblue)" />
      <path d="M40 100H260" stroke="var(--color-ink-2)" strokeDasharray="4 4" />
      <text x="150" y="22" fill="var(--color-tape-ink)" stroke="none" fontSize="12" textAnchor="middle">90 mm</text>
    </svg>
  )
}
