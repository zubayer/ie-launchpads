import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { isDue } from '../lib/srs'
import { lastDays, streak, today, useStore } from '../lib/store'
import { suggestions } from '../lib/recommend'

const DAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Returning learners only: progress from saved data — lessons opened, the latest ones started,
 * the last seven days of activity and the single best next step. No badges or invented numbers.
 */
export default function WelcomeBack() {
  const cards = useStore((s) => s.cards)
  const progress = useStore((s) => s.progress)
  const mistakes = useStore((s) => s.mistakes)
  const attempts = useStore((s) => s.attempts)
  const activity = useStore((s) => s.activity)
  const path = useStore((s) => s.settings.path)
  const next = useMemo(() => suggestions({ cards, progress, mistakes, attempts, path })[0], [cards, progress, mistakes, attempts, path])
  const due = Object.values(cards).filter((c) => isDue(c)).length
  const st = streak(activity)
  const opened = Object.entries(progress).filter(([id, p]) => p.opened && CONCEPT_MAP[id])
  const pct = Math.round((opened.length / CONCEPTS.length) * 100)
  const recent = [...opened].sort((a, b) => (b[1].opened || 0) - (a[1].opened || 0)).slice(0, 4)
  const week = lastDays(7).map((d, i) => ({ key: today(d), letter: DAY[d.getDay()], on: (activity[today(d)] || 0) > 0, isToday: i === 6 }))
  const r = 34, C = 2 * Math.PI * r

  return (
    <section aria-labelledby="welcome-h" className="no-print mb-10 grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
      <div className="sheet flex items-center gap-5 rounded-lg p-5">
        <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" role="img" aria-label={`${opened.length} of ${CONCEPTS.length} lessons opened`}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-grid)" strokeWidth="9" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-sblue)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${Math.max((C * pct) / 100, 2)} ${C}`} transform="rotate(-90 40 40)" />
          <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--color-ink)">{pct}%</text>
        </svg>
        <div className="min-w-0">
          <h2 id="welcome-h" className="wide text-xl">Welcome back.</h2>
          <p className="text-sm text-ink-2">{opened.length} of {CONCEPTS.length} lessons opened</p>
          {next && <p className="mt-2 text-sm"><span className="text-ink-2">Next: </span><Link to={next.to} className="font-semibold hover:text-sblue hover:underline">{next.title}</Link> <span className="text-ink-2">· about {next.minutes} min</span></p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {next && <Link to={next.to} className="btn">Continue</Link>}
            <Link to="/plan" className="btn btn-ghost">Plan my session</Link>
          </div>
        </div>
      </div>
      <div className="sheet rounded-lg p-5">
        <h3 className="font-bold">Recently started</h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {recent.map(([id]) => (
            <li key={id} className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-sgreen" />
              <Link to={`/c/${id}`} className="truncate hover:text-sblue hover:underline">{CONCEPT_MAP[id].term}</Link>
            </li>
          ))}
          {!recent.length && <li className="text-ink-2">Open a lesson and it will appear here.</li>}
        </ul>
        <Link to="/progress" className="mt-3 inline-block text-sm font-semibold text-sblue hover:underline">All progress →</Link>
      </div>
      <div className="sheet rounded-lg p-5">
        <h3 className="font-bold">Last 7 days</h3>
        <p className="mt-1 flex items-baseline gap-4 text-sm text-ink-2">
          {st > 0 ? <span><span className="display text-2xl text-ink">{st}</span> day streak</span> : <span>Study today to start a streak.</span>}
          {due > 0 && <Link to="/review" className="hover:text-ink"><span className="display text-2xl text-ink">{due}</span> {due === 1 ? 'card' : 'cards'} due</Link>}
        </p>
        <ol className="mt-3 flex gap-2" aria-label="Days with study activity">
          {week.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1 text-xs text-ink-2">
              <span aria-hidden className={d.isToday ? 'font-bold text-ink' : ''}>{d.letter}</span>
              <span aria-hidden className={`h-5 w-5 rounded-full border-2 ${d.on ? 'border-sgreen bg-sgreen' : 'border-line'}`} />
              <span className="sr-only">{d.key}: {d.on ? 'studied' : 'no activity'}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
