import { useState } from 'react'
import { SOURCES } from '../content/sources'
import { useStore } from '../lib/store'
import type { Citation } from '../types'

// Pieces shared by the PLC and CAD studio pages.
export interface StudioCheck { id: string; q: string; options: string[]; answer: number; why: string }

export function Sources({ cites }: { cites: Citation[] }) {
  if (!cites.length) return null
  return (
    <section className="sheet mt-8 rounded-lg p-4 sm:p-5" aria-labelledby="src-h">
      <h2 id="src-h" className="text-lg font-extrabold">Sources</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        {cites.map((c) => {
          const s = SOURCES[c.src]
          return <li key={`${c.src}${c.section}`}><a className="font-semibold underline" href={c.url ?? s.url} target="_blank" rel="noopener noreferrer">{s.title}{c.section ? `: ${c.section}` : ''}</a> <span className="text-ink-2">({s.publisher}, checked {s.checkedOn})</span><br /><span>Supports: {c.supports}.</span></li>
        })}
      </ul>
      {[...new Set(cites.map((c) => c.src))].filter((id) => SOURCES[id].note).map((id) => <p key={id} className="mt-2 text-xs text-ink-2"><strong>{SOURCES[id].title}:</strong> {SOURCES[id].note}</p>)}
    </section>
  )
}

export function Check({ q, concept, prefix = 'plc' }: { q: StudioCheck; concept: string; prefix?: string }) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const [pick, setPick] = useState<number | null>(null)
  const choose = (i: number) => {
    if (pick !== null) return
    setPick(i)
    recordAttempt({ item: `${prefix}:${q.id}`, concept, dim: 'explain', correct: i === q.answer, given: q.options[i] })
  }
  return (
    <fieldset className="sheet rounded-lg p-4">
      <legend className="sr-only">{q.q}</legend>
      <p className="font-semibold">{q.q}</p>
      <div className="mt-2 space-y-1.5">
        {q.options.map((o, i) => {
          const state = pick === null ? '' : i === q.answer ? 'border-sgreen bg-sgreen/10' : i === pick ? 'border-sred bg-sred/5' : 'opacity-70'
          return <button key={o} type="button" className={`block w-full rounded-md border border-line px-3 py-1.5 text-left text-sm ${state}`} onClick={() => choose(i)} aria-pressed={pick === i} disabled={pick !== null && pick !== i && i !== q.answer}>{o}</button>
        })}
      </div>
      {pick !== null && <p className="mt-2 text-sm" aria-live="polite"><strong className={pick === q.answer ? 'text-sgreen' : 'text-sorange'}>{pick === q.answer ? 'Right.' : 'Not quite.'}</strong> {q.why}</p>}
      {pick !== null && <button type="button" className="mt-1 text-sm underline" onClick={() => setPick(null)}>Try again</button>}
    </fieldset>
  )
}
