import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isDue } from '../lib/srs'
import { streak, useStore } from '../lib/store'
import { suggestions } from '../lib/recommend'

/** Returning learners only: the single best next step, plus due cards and streak when there are any (never a row of zeros). */
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
  return (
    <section aria-labelledby="welcome-h" className="no-print mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-dashed border-tape bg-tape/5 px-5 py-3">
      <h2 id="welcome-h" className="font-bold">Welcome back.</h2>
      {next ? (
        <p className="min-w-0 flex-1 basis-72">
          <span className="text-ink-2">Next: </span>
          <Link to={next.to} className="font-semibold hover:text-sblue hover:underline">{next.title}</Link>
          <span className="text-sm text-ink-2"> · about {next.minutes} min</span>
        </p>
      ) : <p className="min-w-0 flex-1 basis-72 text-ink-2">Everything on your list is done for now.</p>}
      {due > 0 && <Link to="/review" className="flex items-baseline gap-1.5 text-sm text-ink-2 hover:text-ink">
        <span className="display text-2xl text-ink">{due}</span>{due === 1 ? 'card due' : 'cards due'}
      </Link>}
      {st > 0 && <span className="flex items-baseline gap-1.5 text-sm text-ink-2"><span className="display text-2xl text-ink">{st}</span>day streak</span>}
      <Link to="/plan" className="btn btn-ghost">Plan my session</Link>
      {next && <Link to={next.to} className="btn">Continue</Link>}
    </section>
  )
}
