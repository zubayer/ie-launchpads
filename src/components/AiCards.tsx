import { useEffect, useState, type ReactNode } from 'react'
import type { ConceptIndex } from '../content/assemble'
import { AI_SOURCES, aiKey, deviceAiStatus, deviceSummary, pollinationsSummary, want, type AiSource } from '../lib/ai'
import { DOMAIN_HINT, askLinks } from '../lib/web'

// Several free AI explanations of the same topic, side by side, each labelled with where it came from.
// They load without a click; the only exception is Chrome's on-device model, whose one-time download the
// browser itself only allows after a click.

const context = (c: ConceptIndex) => `${c.full ? c.full + ', ' : ''}${DOMAIN_HINT[c.domain]}`

function Shell({ src, children, footer }: { src: AiSource; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-line p-4" aria-label={`AI explanation: ${src.provider}, ${src.label}`}>
      <p className="label mb-2 flex flex-wrap items-center gap-2">{src.provider} · {src.label} <span className="chip !py-0 text-[11px]">AI-generated</span></p>
      <div className="flex-1">{children}</div>
      <p className="mt-3 text-xs text-ink-2">{src.note} AI text can be wrong: check it against Wikipedia and the lesson before you quote it.</p>
      {footer && <div className="no-print mt-2 flex flex-wrap gap-1.5">{footer}</div>}
    </section>
  )
}

const Answer = ({ text }: { text: string }) => (
  <div className="space-y-1.5 text-[0.95rem] leading-snug">
    {text.split(/\n+/).filter((l) => l.trim()).map((l, i) => <p key={i}>{l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '• ')}</p>)}
  </div>
)

const Waiting = ({ children }: { children: ReactNode }) => (
  <div className="space-y-2" role="status">
    <p className="text-sm text-ink-2">{children}</p>
    <div className="h-3 w-11/12 animate-pulse rounded bg-line" /><div className="h-3 w-4/5 animate-pulse rounded bg-line" /><div className="h-3 w-3/4 animate-pulse rounded bg-line" />
  </div>
)

function PollinationsCard({ c, src }: { c: ConceptIndex; src: AiSource }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string; text: string | null; done: boolean }>({ key: '', text: null, done: false })
  const key = aiKey(src.id, c.term, attempt)
  useEffect(() => {
    let live = true
    const release = want(key) // a request this card no longer needs is skipped, so it can't delay the lesson on screen
    pollinationsSummary(src, c.term, context(c), attempt).then((text) => { if (live) setState({ key, text, done: true }) })
    return () => { live = false; release() }
  }, [src, c, attempt, key])
  const mine = state.key === key ? state : { text: null, done: false }
  const failed = mine.done && !mine.text
  // The anonymous tier is busy at times: retry once by itself before asking the learner.
  useEffect(() => { if (failed && attempt === 0) { const t = setTimeout(() => setAttempt(1), 16000); return () => clearTimeout(t) } }, [failed, attempt])
  return (
    <Shell src={src} footer={mine.done && <button type="button" className="pop-btn" onClick={() => setAttempt((a) => a + 1)}>{mine.text ? 'Ask again' : 'Try again'}</button>}>
      {!mine.done && <Waiting>Asking the free Pollinations service… this can take 10–20 seconds.</Waiting>}
      {mine.text && <Answer text={mine.text} />}
      {failed && <p className="text-sm text-ink-2">The service didn’t answer (it allows about one request every 15 seconds).{attempt === 0 ? ' Retrying by itself in 15 seconds.' : ''}</p>}
    </Shell>
  )
}

function DeviceCard({ c, src }: { c: ConceptIndex; src: AiSource }) {
  const [status, setStatus] = useState<'checking' | 'unavailable' | 'downloadable' | 'downloading' | 'available'>('checking')
  const [attempt, setAttempt] = useState(0)
  const [run, setRun] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [answer, setAnswer] = useState<{ key: string; text: string | null; done: boolean }>({ key: '', text: null, done: false })
  const key = aiKey(src.id, c.term, attempt)
  useEffect(() => { let live = true; deviceAiStatus().then((s) => { if (live) { setStatus(s); if (s === 'available') setRun(true) } }); return () => { live = false } }, [])
  useEffect(() => {
    if (!run) return
    let live = true
    deviceSummary(c.term, context(c), attempt, (f) => live && setProgress(f)).then((text) => { if (live) { setAnswer({ key, text, done: true }); setStatus('available') } })
    return () => { live = false }
  }, [run, c, attempt, key])
  if (status === 'checking' || status === 'unavailable') return null // not supported here: no card at all
  const mine = answer.key === key ? answer : { text: null, done: false }
  return (
    <Shell src={src} footer={mine.done && <button type="button" className="pop-btn" onClick={() => setAttempt((a) => a + 1)}>{mine.text ? 'Ask again' : 'Try again'}</button>}>
      {!run && (
        <div>
          <p className="text-sm">Chrome can answer this on your computer with its built-in model. Chrome needs your go-ahead once to download the model; after that this card fills in by itself on every lesson.</p>
          <button type="button" className="btn mt-2" onClick={() => setRun(true)}>Download Chrome’s on-device model</button>
        </div>
      )}
      {run && !mine.done && <Waiting>{progress !== null && progress < 1 ? `Chrome is downloading its on-device model: ${Math.round(progress * 100)}%.` : 'Thinking on this device…'}</Waiting>}
      {mine.text && <Answer text={mine.text} />}
      {mine.done && !mine.text && <p className="text-sm text-ink-2">Chrome’s on-device model didn’t produce an answer this time.</p>}
    </Shell>
  )
}

/** Every available free AI source as its own card. */
export function AiCards({ c }: { c: ConceptIndex }) {
  return <>{AI_SOURCES.map((s) => (s.where === 'device' ? <DeviceCard key={s.id} c={c} src={s} /> : <PollinationsCard key={s.id} c={c} src={s} />))}</>
}

/** Links that open other assistants with the same question filled in. */
export function AskElsewhere({ c }: { c: ConceptIndex }) {
  return (
    <p className="no-print mt-2 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="text-ink-2">Ask the same question elsewhere:</span>
      {askLinks(c.term).slice(2, 5).map((l) => <a key={l.label} className="pop-btn" href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}
    </p>
  )
}
