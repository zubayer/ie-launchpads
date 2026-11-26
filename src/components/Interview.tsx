import { useEffect, useState, type ReactNode } from 'react'
import { SOURCES } from '../content/sources'
import { useStore } from '../lib/store'
import { canDictate, canSpeak, dictate, speak, stopSpeaking } from '../lib/speech'
import type { Concept, InterviewQ, InterviewType } from '../types'
import { Rich } from './ui'

export const TYPE_LABEL: Record<InterviewType, string> = {
  screen: 'Screening', technical: 'Technical', case: 'Case', behavioral: 'Behavioral', conceptual: 'Conceptual', numerical: 'Numerical',
  analytical: 'Analytical', scenario: 'Scenario', troubleshooting: 'Troubleshooting', decision: 'Decision-making',
}

const slug = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
const plain = (t: string) => <Rich text={t} />

/** The origin line under a question. Every question is an original practice question unless a source reports it. */
export function OriginNote({ q }: { q: InterviewQ }) {
  if (q.origin === 'reported' && q.reported) {
    const s = SOURCES[q.reported.src]
    return <p className="text-xs text-ink-2">Reported interview question. Source: <a className="underline" href={q.reported.url ?? s?.url} target="_blank" rel="noopener noreferrer">{s?.title ?? q.reported.src}{q.reported.section ? `: ${q.reported.section}` : ''}</a>.</p>
  }
  return <p className="text-xs text-ink-2">Original practice question written for this site; not reported from any employer.</p>
}

/** A rubric self-check: tick what your answer covered; saving records 'communicate' evidence for the lesson. */
function SelfCheck({ points, item, concept, label }: { points: string[]; item: string; concept?: string; label: string }) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const [got, setGot] = useState<boolean[]>(() => points.map(() => false))
  const [saved, setSaved] = useState<string | null>(null)
  const n = got.filter(Boolean).length
  const pass = n >= Math.ceil(points.length * 0.7)
  const save = () => {
    if (concept) recordAttempt({ item, concept, dim: 'communicate', provenance: 'self-assessed', correct: pass, given: `${n}/${points.length}` })
    setSaved(pass ? `Self-assessed: covered ${n} of ${points.length}.` : `Covered ${n} of ${points.length}. Rehearse the missing points and try again tomorrow.`)
  }
  return (
    <fieldset className="mt-3 rounded-md border border-line p-3">
      <legend className="label px-1">{label}</legend>
      <ul className="space-y-1">
        {points.map((p, i) => (
          <li key={p}>
            <label className="flex min-h-6 cursor-pointer items-start gap-2 text-[0.95rem]">
              <input type="checkbox" className="mt-1" checked={got[i]} onChange={() => { setGot((g) => g.map((x, j) => (j === i ? !x : x))); setSaved(null) }} />
              <span><Rich text={p} /></span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-2">Self-assessment: this checklist does not independently verify your spoken or written answer.</p>
      <button type="button" className="btn mt-2" onClick={save}>{concept ? 'Save my self-check' : 'Score my answer'}</button>
      {saved && <p className="mt-1 text-sm" aria-live="polite">{saved}</p>}
    </fieldset>
  )
}

/** One interview question: hint on request, then the model answer, follow-ups and what a strong answer covers. */
export function InterviewCard({ q, concept, render = plain, footer }: { q: InterviewQ; concept?: string; render?: (t: string) => ReactNode; footer?: ReactNode }) {
  const rich = !!(q.hint || q.rubric?.length || q.followUps?.length)
  const [hint, setHint] = useState(false)
  const [show, setShow] = useState(!rich)
  return (
    <details className="group rounded-md border border-line bg-sheet px-4 py-3" onToggle={(e) => { if (!(e.currentTarget as HTMLDetailsElement).open) stopSpeaking() }}>
      <summary className="cursor-pointer font-medium marker:text-ink-2">{q.q} {q.type && <span className="chip ml-2 align-middle">{TYPE_LABEL[q.type]}</span>}</summary>
      <div className="mt-2 space-y-2">
        <OriginNote q={q} />
        <div className="flex flex-wrap gap-2">
          {canSpeak() && <button type="button" className="btn-ghost btn" onClick={() => speak(q.q)}>Read the question aloud</button>}
          {q.hint && <button type="button" className="btn-ghost btn" aria-expanded={hint} onClick={() => setHint((h) => !h)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>}
          {rich && <button type="button" className="btn" aria-expanded={show} onClick={() => setShow((s) => !s)}>{show ? 'Hide the model answer' : 'Show the model answer'}</button>}
        </div>
        {hint && q.hint && <p className="measure rounded-md bg-sorange/5 px-3 py-2 text-[0.95rem]"><strong>Hint:</strong> {render(q.hint)}</p>}
        {rich && !show && <p className="text-sm text-ink-2">Answer out loud first, then compare.</p>}
        {show && (
          <>
            <p className="measure text-[0.97rem]">{render(q.a)}</p>
            {q.followUps?.length ? (
              <div className="measure">
                <p className="label mb-1">Likely follow-up questions</p>
                <ul className="list-disc space-y-0.5 pl-5 text-[0.95rem]">{q.followUps.map((f) => <li key={f}>{render(f)}</li>)}</ul>
              </div>
            ) : null}
            {q.rubric?.length ? <SelfCheck points={q.rubric} item={`iq:${concept ?? 'bank'}:${slug(q.q)}`} concept={concept} label="What a strong answer covers" /> : null}
          </>
        )}
        {footer}
      </div>
    </details>
  )
}

/** Teach-back: explain the idea in your own words (typed or dictated), then compare with what a good explanation covers. */
export function TeachBackCard({ c, render = plain }: { c: Concept; render?: (t: string) => ReactNode }) {
  const saved = useStore((s) => s.progress[c.id]?.teach || '')
  const setTeach = useStore((s) => s.setTeach)
  const recordAttempt = useStore((s) => s.recordAttempt)
  const [text, setText] = useState(saved)
  const [compare, setCompare] = useState(false)
  const [stop, setStop] = useState<(() => void) | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [self, setSelf] = useState<string | null>(null)
  useEffect(() => () => stop?.(), [stop])
  const prompt = c.teachBack?.prompt || `Explain ${c.term} to a colleague who has never met it: what it is, why it matters, and one place it is used at work.`
  const update = (t: string) => { setText(t); setTeach(c.id, t) }
  const startDictation = () => {
    setNote(null)
    const s = dictate((t) => setText((prev) => { const next = prev ? `${prev} ${t}` : t; setTeach(c.id, next); return next }), (err) => { setStop(null); if (err && err !== 'aborted' && err !== 'no-speech') setNote(`Dictation stopped (${err}). You can keep typing instead.`) })
    if (s) setStop(() => s)
  }
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <div className="measure">
      <p className="font-medium">{prompt}</p>
      <label className="label mt-3 block" htmlFor={`teach-${c.id}`}>Your explanation (saved on this device)</label>
      <textarea id={`teach-${c.id}`} className="input mt-1 min-h-32 w-full" value={text} onChange={(e) => update(e.target.value)} placeholder="Write as if you were talking: short sentences, your own words, one example." />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canDictate() && (stop
          ? <button type="button" className="btn" onClick={() => { stop(); setStop(null) }}>Stop dictation</button>
          : <button type="button" className="btn-ghost btn" onClick={startDictation}>Dictate instead</button>)}
        <button type="button" className="btn" disabled={words < 15} onClick={() => setCompare(true)}>Compare with a good explanation</button>
        <span className="text-sm text-ink-2">{words} words{words < 15 ? ' (write at least 15 first)' : ''}</span>
      </div>
      {canDictate() && <p className="mt-1 text-xs text-ink-2">Dictation uses your browser’s speech recognition service, which may send the audio to the browser maker’s servers. Typing keeps everything on this device.</p>}
      {note && <p className="mt-1 text-sm" aria-live="polite">{note}</p>}
      {compare && (c.teachBack ? (
        <SelfCheck points={c.teachBack.points} item={`teach:${c.id}`} concept={c.id} label="A good explanation covers" />
      ) : (
        <div className="mt-3 rounded-md border border-line p-3">
          <p className="label mb-1">Compare with the lesson’s own words</p>
          <p className="text-[0.95rem]">{render(c.one)}</p>
          <p className="mt-1 text-[0.95rem]">{render(c.def)}</p>
          {c.why && <p className="mt-1 text-[0.95rem]">{render(c.why)}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {([['Mine covers the same ideas', true], ['I missed something important', false]] as const).map(([l, ok]) => (
              <button key={l} type="button" className="btn-ghost btn" onClick={() => { recordAttempt({ item: `teach:${c.id}`, concept: c.id, dim: 'communicate', provenance: 'self-assessed', correct: ok, given: `${words} words` }); setSelf(ok ? 'Saved as self-assessed evidence. Compare your explanation with a worked application.' : 'Saved as self-assessed evidence. Reread the missing idea, then explain it again tomorrow.') }}>{l}</button>
            ))}
          </div>
          {self && <p className="mt-1 text-sm" aria-live="polite">{self}</p>}
        </div>
      ))}
    </div>
  )
}
