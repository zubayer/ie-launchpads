import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import { useStore, type Mistake } from '../lib/store'
import { PageHead } from '../components/ui'

const when = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export function Notebook() {
  const mistakes = useStore((s) => s.mistakes)
  const resolve = useStore((s) => s.resolveMistake)
  const clearResolved = useStore((s) => s.clearResolved)
  const [show, setShow] = useState<'open' | 'resolved'>('open')
  const open = mistakes.filter((m) => !m.resolved)
  const done = mistakes.filter((m) => m.resolved)
  const list = show === 'open' ? open : done
  // Topics missed more than once are recurring misconceptions: the ones worth a re-read, not just a retry.
  const recurring = useMemo(() => {
    const n = new Map<string, number>()
    open.forEach((m) => n.set(m.concept, (n.get(m.concept) || 0) + 1))
    return [...n.entries()].filter(([, k]) => k > 1).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [open])
  const groups = useMemo(() => {
    const g = new Map<string, Mistake[]>()
    list.forEach((m) => g.set(m.concept, [...(g.get(m.concept) || []), m]))
    return [...g.entries()]
  }, [list])

  return (
    <div>
      <PageHead title="Error notebook" sub="Every wrong answer from Check yourself and the practice quiz lands here automatically, with the right answer and why. Re-read the lesson, then mark it understood." />
      {recurring.length > 0 && (
        <div className="sheet mb-6 rounded-lg p-4">
          <p className="label mb-2">Missed more than once — re-read these first</p>
          <div className="flex flex-wrap gap-2">
            {recurring.map(([id, k]) => CONCEPT_MAP[id] && <Link key={id} to={`/c/${id}`} className="chip hover:border-ink">{CONCEPT_MAP[id].term} <span className="text-sred">×{k}</span></Link>)}
          </div>
        </div>
      )}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Show">
        <button className={`pop-btn !py-1.5 ${show === 'open' ? '!border-sblue !text-sblue' : ''}`} aria-pressed={show === 'open'} onClick={() => setShow('open')}>To review ({open.length})</button>
        <button className={`pop-btn !py-1.5 ${show === 'resolved' ? '!border-sblue !text-sblue' : ''}`} aria-pressed={show === 'resolved'} onClick={() => setShow('resolved')}>Understood ({done.length})</button>
        {show === 'resolved' && done.length > 0 && <button className="pop-btn !py-1.5" onClick={clearResolved}>Delete understood entries</button>}
      </div>
      {list.length === 0 && (
        <div className="sheet rounded-lg p-6">
          <p className="font-semibold">{show === 'open' ? (mistakes.length ? 'Nothing left to review.' : 'No mistakes logged yet.') : 'Nothing marked understood yet.'}</p>
          <p className="mt-1 text-ink-2">{show === 'open' ? 'Answer questions in a lesson’s Check yourself section or in the practice quiz; anything you get wrong is saved here.' : 'Use “I understand it now” on an entry once you’ve re-read the lesson.'}</p>
          {show === 'open' && <Link className="btn mt-4" to="/practice">Start a practice quiz</Link>}
        </div>
      )}
      <div className="space-y-4">
        {groups.map(([id, ms]) => {
          const c = CONCEPT_MAP[id]
          return (
            <section key={id} className="sheet rounded-lg p-5" aria-labelledby={`nb-${id}`}>
              <h2 id={`nb-${id}`} className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
                {c ? <Link to={`/c/${id}`} className="hover:text-sblue hover:underline">{c.term}</Link> : id}
                {c && <span className="text-xs font-normal text-ink-2">{DOMAIN_MAP[c.domain].name}</span>}
              </h2>
              <ul className="mt-3 space-y-3">
                {ms.map((m) => (
                  <li key={m.id} className="rounded-md border border-line p-3">
                    <p className="whitespace-pre-line text-[0.95rem] font-medium">{m.prompt}</p>
                    <p className="mt-2 text-sm"><span className="font-semibold text-sred">You chose:</span> {m.given}</p>
                    <p className="text-sm"><span className="font-semibold text-sgreen">Correct:</span> {m.correct}</p>
                    <p className="mt-1 text-sm text-ink-2">{m.explain}</p>
                    <div className="no-print mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xs text-ink-2">{when(m.at)}</span>
                      {c && <Link className="pop-btn" to={`/c/${id}`}>Re-read the lesson</Link>}
                      <button className="pop-btn" onClick={() => resolve(m.id, !m.resolved)}>{m.resolved ? 'Move back to review' : 'I understand it now'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
