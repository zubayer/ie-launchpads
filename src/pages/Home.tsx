import { Suspense, lazy, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { HERO_CARDS, LANDING_DOMAINS, type HeroCard } from '../content/landing'
import { SIM_META } from '../sims/registry'
import { useStore } from '../lib/store'
import { Tex } from '../components/ui'
import { openSearch } from '../components/Layout'
import { LandingIcon } from '../components/LandingIcons'

/*
 * Landing page. Owner decisions 2026-11-26: "Option A — three doors", then ideas taken from the owner's
 * reference image: four topic cards in the hero, a progress panel for returning learners, the learning
 * steps with icons, twelve domain cards, featured tools and skills, and footer link columns (in Layout).
 * Every number on the page comes from the lessons (tested in landing.test.ts) or the learner's saved data.
 */

const FEATURED_ROLES = ['industrial-engineer', 'quality-engineer', 'manufacturing-engineer', 'process-engineer-semi', 'ci-engineer', 'data-analyst']

const WelcomeBack = lazy(() => import('../components/WelcomeBack'))
const JobsPulse = lazy(() => import('../components/JobsPulse'))


const FEATURES: { to: string; icon: string; title: string; text: string }[] = [
  { to: '/c/lean.takt-time', icon: 'studio', title: 'Topic Intelligence Studio', text: 'Every lesson in stages: discover, visualize, experiment, master.' },
  { to: '/compare', icon: 'compare', title: 'Advanced comparison', text: 'Put related concepts side by side: Cp vs Cpk, SPC vs capability.' },
  { to: '/formulas', icon: 'equation', title: 'Equation Explorer', text: 'Key IE equations with notation, variables and live examples.' },
  { to: '/dictionary', icon: 'dictionary', title: 'Engineering dictionary', text: 'Abbreviations and terms, linked to their lessons.' },
  { to: '/interview', icon: 'interview', title: 'Interview prep', text: 'Practice questions with hints, follow-ups and model answers.' },
  { to: '/mysteries', icon: 'cases', title: 'Shop-floor cases', text: 'Illustrative factory problems to diagnose with IE methods.' },
  { to: '/tools', icon: 'tools', title: 'Tools & software', text: 'What Excel, Minitab, simulation and PLC tools are used for.' },
  { to: '/certifications', icon: 'cert', title: 'Certifications', text: 'Which certification to take next, its official syllabus, and the lessons that teach it.' },
]

export default function Home() {
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const path = useStore((s) => s.settings.path)
  const returning = Object.values(progress).some((p) => p.opened) || Object.keys(cards).length > 0

  return (
    // data-visitor is decided synchronously (the progress panel itself loads lazily), so tests can rely on it.
    <div data-visitor={returning ? 'returning' : 'first'}>
      {returning && <Suspense fallback={null}><WelcomeBack /></Suspense>}

      <section className="grid items-start gap-8 xl:grid-cols-[1.1fr_1fr] xl:gap-10">
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
        <section aria-labelledby="sample-h">
          <h2 id="sample-h" className="sr-only">Sample lessons</h2>
          <ul className="grid grid-cols-2 gap-3">
            {HERO_CARDS.map((c) => <TopicCard key={c.id} card={c} />)}
          </ul>
          <p className="mt-2 text-xs text-ink-2">Results are from each lesson's own worked example.</p>
        </section>
      </section>

      <div className="mt-14"><Suspense fallback={null}><JobsPulse /></Suspense></div>

      <section className="mt-14" aria-labelledby="domains-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="domains-h" className="wide text-2xl">Explore core IE domains</h2>
          <Link to="/domains" className="font-semibold text-sblue hover:underline">All {DOMAINS.length} domains →</Link>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {LANDING_DOMAINS.map((id, i) => {
            const d = DOMAIN_MAP[id]
            return (
              <li key={id} className={i >= 6 ? 'hidden sm:block' : ''}>
                <Link to={`/d/${id}`} className="sheet flex h-full gap-3 rounded-lg p-4 hover:border-sblue">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${d.tape} 16%, transparent)`, color: `color-mix(in srgb, ${d.tape} 70%, var(--color-ink))` }}><LandingIcon name={id} className="h-6 w-6" /></span>
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-2"><span className="font-bold">{d.name}</span><span className="shrink-0 text-xs text-ink-2">{CONCEPTS.filter((c) => c.domain === id).length} lessons</span></span>
                    <span className="mt-0.5 line-clamp-2 hidden text-sm text-ink-2 sm:block">{d.blurb}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="features-h">
        <h2 id="features-h" className="wide text-2xl">Tools and skills for the real job</h2>
        <p className="mt-1 text-ink-2">Look things up, compare, calculate, then practise the interview and the shop floor.</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.to}>
              <Link to={f.to} className="sheet flex h-full flex-col gap-2 rounded-lg p-4 hover:border-sblue">
                <LandingIcon name={f.icon} className="h-7 w-7 text-sblue" />
                <span className="font-bold leading-snug">{f.title}</span>
                <span className="hidden text-sm text-ink-2 sm:block">{f.text}</span>
              </Link>
            </li>
          ))}
        </ul>
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

/* ---------- Hero: four topic cards, results from the lessons' own worked examples ---------- */

function TopicCard({ card }: { card: HeroCard }) {
  const c = CONCEPT_MAP[card.id]
  if (!c) return null
  const d = DOMAIN_MAP[c.domain]
  return (
    <li>
      <Link to={card.to || `/c/${card.id}`} className="sheet flex h-full flex-col rounded-lg p-3 hover:border-sblue sm:p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-bold">{card.title}</span>
          <span className="hidden shrink-0 sm:block"><span className="chip"><span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: d.tape }} />{d.short}</span></span>
        </span>
        <span className="mt-2 flex h-16 items-center sm:h-24 justify-center overflow-hidden rounded-md bg-grid px-2" aria-hidden>
          {card.visual === 'formula' && (card.tex || c.formula) ? <span className="text-[0.7rem] sm:text-[0.95rem]"><Tex tex={card.tex || c.formula!.tex} /></span>
            : card.visual === 'bell' ? <BellArt />
            : card.visual === 'bars' ? <CashArt />
            : <LadderArt />}
        </span>
        <span className="mt-3 inline-flex self-start rounded-md bg-tape/15 px-2 py-0.5 text-xs font-semibold text-tape-ink sm:text-sm">{card.result}</span>
        <span className="mt-1 hidden text-sm text-ink-2 sm:block">{c.one}</span>
      </Link>
    </li>
  )
}

/** The Cp/Cpk lesson's shaft: spec 10.00 ± 0.06, process mean 10.02 — capable spread, off-centre. */
function BellArt() {
  const xs = Array.from({ length: 61 }, (_, i) => i)
  const mu = 34, sd = 7
  const y = (x: number) => 78 - 62 * Math.exp(-((x - mu) ** 2) / (2 * sd * sd))
  return (
    <svg viewBox="0 0 60 84" preserveAspectRatio="none" className="h-full w-full max-w-[16rem]">
      <path d={xs.map((x) => `${x ? 'L' : 'M'}${x} ${y(x)}`).join(' ')} fill="none" stroke="var(--color-sblue)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <line x1="12" x2="12" y1="8" y2="80" stroke="var(--color-sred)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <line x1="48" x2="48" y1="8" y2="80" stroke="var(--color-sred)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <line x1={mu} x2={mu} y1="14" y2="80" stroke="var(--color-sgreen)" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
/** The NPV lesson's cash flows: −$40,000 now, then +$12,000 a year for five years. */
function CashArt() {
  return (
    <svg viewBox="0 0 120 70" className="h-full w-full max-w-[16rem]">
      <line x1="4" x2="116" y1="30" y2="30" stroke="var(--color-ink-2)" />
      <rect x="10" y="30" width="12" height="36" fill="var(--color-sred)" rx="1" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={30 + i * 17} y="19" width="12" height="11" fill="var(--color-sgreen)" rx="1" />)}
    </svg>
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
