import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { plan, suggestions } from '../lib/recommend'

const LENGTHS = [5, 15, 30, 60]
const KIND: Record<string, string> = { review: 'Review', mistake: 'Fix a weak spot', pathway: 'Pathway', lesson: 'Lesson', lab: 'Lab', notebook: 'Error notebook' }

/** Do next: a short, explained plan for the time you have. Nothing is penalised for skipping. */
export default function DoNext() {
  const cards = useStore((s) => s.cards)
  const progress = useStore((s) => s.progress)
  const mistakes = useStore((s) => s.mistakes)
  const attempts = useStore((s) => s.attempts)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const [skipped, setSkipped] = useState<string[]>([])
  const [more, setMore] = useState(false)
  const minutes = settings.sessionMin ?? 15
  const list = useMemo(() => suggestions({ cards, progress, mistakes, attempts, path: settings.path }), [cards, progress, mistakes, attempts, settings.path])
  const p = plan(list, minutes, skipped)
  return (
    <div className="mt-4" aria-labelledby="donext-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="donext-h" className="label">Do next</h3>
        <div className="flex items-center gap-1 text-sm" role="group" aria-label="Time you have">
          <span className="mr-1 text-ink-2">I have</span>
          {LENGTHS.map((m) => <button key={m} className={`pop-btn !py-1 ${minutes === m ? '!border-sblue !text-sblue' : ''}`} aria-pressed={minutes === m} onClick={() => setSettings({ sessionMin: m })}>{m} min</button>)}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-2" aria-live="polite">Estimated plan: {p.used} of {minutes} minutes. You can stop or continue at your own pace.</p>
      <ol className="mt-2 space-y-2">
        {p.chosen.map((x, n) => (
          <li key={x.id} className="rounded-md border border-line p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link to={x.to} className="font-semibold hover:text-sblue hover:underline"><span className="text-ink-2">{n + 1}.</span> {x.title}</Link>
              <span className="text-sm text-ink-2">{KIND[x.kind]} · about {x.minutes} min</span>
            </div>
            <p className="mt-1 text-sm"><span className="font-semibold">Why:</span> {x.why}</p>
            <button className="mt-1 text-sm text-ink-2 underline hover:text-ink" onClick={() => setSkipped((s) => [...s, x.id])}>Not now</button>
          </li>
        ))}
        {!p.chosen.length && <li className="text-ink-2">No remaining activity fits this time budget. Choose a longer session or explore other options. {skipped.length > 0 && <button className="underline" onClick={() => setSkipped([])}>Show skipped items again</button>}</li>}
      </ol>
      {p.rest.length > 0 && (
        <div className="mt-2 text-sm">
          <button className="underline" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Hide' : 'Show'} {p.rest.length} other option{p.rest.length > 1 ? 's' : ''}</button>
          {more && <ul className="mt-1 space-y-1">{p.rest.map((x) => <li key={x.id}><Link className="font-semibold hover:underline" to={x.to}>{x.title}</Link> <span className="text-ink-2">({x.minutes} min) {x.why}</span></li>)}</ul>}
        </div>
      )}
      <p className="mt-2 text-xs text-ink-2">Ranked by fixed rules: due reviews, repeated mistakes, a pathway you started, your role path (prerequisites first), then practice in a lab. Breaks cost nothing.</p>
    </div>
  )
}

