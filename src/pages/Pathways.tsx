import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { PATHWAYS, PATHWAY_MAP, allItems, itemKey, type ChoiceItem, type ExternalItem, type Item, type NumericItem, type Pathway } from '../content/pathways'
import { DIMENSIONS, correctDays, evidence, gradeNumeric, solved, triesOf, type Grade } from '../lib/answers'
import { statusOf, today, useStore, type Attempt, type Dimension } from '../lib/store'
import { Bar, PageHead } from '../components/ui'

const CONF: { v: 1 | 2 | 3; label: string }[] = [{ v: 1, label: 'Guessing' }, { v: 2, label: 'Unsure' }, { v: 3, label: 'Sure' }]
const DIM_LABEL = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.label])) as Record<Dimension, string>

function progressOf(p: Pathway, attempts: Attempt[]) {
  // A prediction counts once made (right or wrong); everything else must be answered correctly.
  const stepDone = p.steps.map((s) => s.items.every((it) => (it.kind === 'choice' && it.predict ? triesOf(attempts, itemKey(p, it)) > 0 : solved(attempts, itemKey(p, it)))))
  const reviewDone = p.review.every((it) => solved(attempts, itemKey(p, it)))
  const days = correctDays(attempts, `${p.id}:`)
  return { stepDone, done: stepDone.filter(Boolean).length, reviewDone, days, mastered: stepDone.every(Boolean) && reviewDone && days >= 2 }
}

export function Pathways() {
  const attempts = useStore((s) => s.attempts)
  return (
    <div>
      <PageHead title="Guided pathways" sub="A pathway strings lessons, equation experiments, a lab and a case into one route, with questions along the way. Every answer is saved as evidence of what you can do, not just what you opened." />
      <div className="grid gap-4 lg:grid-cols-2">
        {PATHWAYS.map((p) => {
          const g = progressOf(p, attempts)
          return (
            <article key={p.id} className="sheet flex flex-col rounded-lg p-5">
              <h2 className="text-xl font-extrabold"><Link className="hover:text-sblue hover:underline" to={`/paths/${p.id}`}>{p.title}</Link></h2>
              <p className="mt-1">{p.blurb}</p>
              <p className="mt-2 text-sm text-ink-2">{p.steps.length} steps · about {p.minutes} minutes · {g.mastered ? 'mastered' : `${g.done} of ${p.steps.length} steps done`}</p>
              <div className="mt-3"><Bar value={g.done / p.steps.length} label={`${p.title} progress`} /></div>
              <Link className="btn mt-4 self-start" to={`/paths/${p.id}`}>{g.done ? 'Continue' : 'Start'}</Link>
            </article>
          )
        })}
      </div>
      <p className="mt-5 text-sm text-ink-2">More pathways (PLC ladder logic, quality, optimisation, engineering economics) are planned in docs/V3-EXECUTION-PLAN.md.</p>
    </div>
  )
}

export function PathwayPage() {
  const { id = '' } = useParams()
  const p = PATHWAY_MAP[id]
  const attempts = useStore((s) => s.attempts)
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  if (!p) return <div><h1 className="display text-3xl">No such pathway</h1><p className="mt-2"><Link className="underline" to="/paths">See all pathways</Link></p></div>
  const g = progressOf(p, attempts)
  const concepts = [...new Set(allItems(p).map((it) => it.concept))]
  const dims = DIMENSIONS.filter((d) => allItems(p).some((it) => it.dim === d.id))
  const firstOpen = g.stepDone.findIndex((x) => !x)

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-2"><Link className="underline" to="/paths">Guided pathways</Link> › {p.title}</nav>
      <PageHead title={p.title} sub={p.blurb}>
        <p className="mt-2 text-sm text-ink-2">About {p.minutes} minutes, in as many sittings as you like. Progress is saved in this browser.</p>
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ol className="space-y-5">
          {p.steps.map((s, n) => (
            <li key={s.id} id={`step-${s.id}`}>
              <section className={`sheet rounded-lg p-4 sm:p-5 ${n === firstOpen ? 'ring-2 ring-sblue' : ''}`} aria-labelledby={`h-${s.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 id={`h-${s.id}`} className="text-xl font-extrabold"><span className="text-ink-2">{n + 1}.</span> {s.title}</h2>
                  <span className={`rounded px-2 py-0.5 text-sm font-semibold ${g.stepDone[n] ? 'bg-sgreen/15 text-sgreen' : 'text-ink-2'}`}>{g.stepDone[n] ? '✓ Done' : n === firstOpen ? 'Up next' : 'Not done'}</span>
                </div>
                <p className="mt-1">{s.goal}</p>
                {(s.lessons.length > 0 || s.links?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.lessons.map((id) => <Link key={id} className="pop-btn !py-1.5" to={`/c/${id}`}>Lesson: {CONCEPT_MAP[id].term}<span className="sr-only">, {statusOf(progress[id], cards[id])}</span></Link>)}
                    {s.links?.map((l) => <Link key={l.to} className="pop-btn !border-tape !py-1.5" to={l.to}>{l.label}</Link>)}
                  </div>
                )}
                <div className="mt-4 space-y-4">{s.items.map((it) => <ItemCard key={it.id} p={p} it={it} />)}</div>
              </section>
            </li>
          ))}
          <li>
            <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="h-review">
              <h2 id="h-review" className="text-xl font-extrabold">Delayed check</h2>
              <p className="mt-1">Mixed questions from the whole pathway, with new numbers. Best done tomorrow or later: pulling an idea back out of memory after a gap is what makes it stick.</p>
              <div className="mt-4 space-y-4">{p.review.map((it) => <ItemCard key={it.id} p={p} it={it} confidence />)}</div>
            </section>
          </li>
        </ol>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="sheet rounded-lg p-4" aria-labelledby="h-prog">
            <h2 id="h-prog" className="label">Your progress</h2>
            <p className="mt-1 text-2xl font-extrabold">{g.done} of {p.steps.length} steps</p>
            <div className="mt-2"><Bar value={g.done / p.steps.length} label="Steps done" /></div>
            <p className="mt-3 text-sm">{g.mastered ? <strong className="text-sgreen">Pathway mastered: every step done and the delayed check passed, with evidence on {g.days} different days.</strong>
              : g.done === p.steps.length ? (g.reviewDone ? 'Steps and delayed check done. Mastery needs correct answers on at least two different days: come back tomorrow for one more round.' : 'All steps done. Take the delayed check, ideally tomorrow.')
              : 'Mastery needs every step, the delayed check, and correct answers on two different days.'}</p>
          </section>
          <section className="sheet rounded-lg p-4" aria-labelledby="h-ev">
            <h2 id="h-ev" className="label">Evidence by skill</h2>
            <p className="mt-1 text-xs text-ink-2">✓ answered correctly (days), ✗ tried but not yet right, · not yet tried, n/a this pathway doesn’t ask for it.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-ink-2"><th scope="col" className="py-1">Lesson</th>{dims.map((d) => <th key={d.id} scope="col" className="px-1 text-center">{d.label}</th>)}</tr></thead>
                <tbody>
                  {concepts.map((cid) => {
                    const ev = evidence(attempts, cid)
                    return (
                      <tr key={cid} className="border-t border-line">
                        <th scope="row" className="py-1.5 text-left font-medium"><Link className="hover:underline" to={`/c/${cid}`}>{CONCEPT_MAP[cid].term}</Link></th>
                        {dims.map((d) => {
                          const asks = allItems(p).some((it) => it.concept === cid && it.dim === d.id)
                          const c = ev[d.id]
                          const txt = !asks ? 'n/a' : !c ? '·' : c.correct ? `✓${c.days > 1 ? ` ${c.days}d` : ''}` : '✗'
                          const sr = !asks ? 'not asked' : !c ? 'not tried' : c.correct ? `correct on ${c.days} day${c.days > 1 ? 's' : ''}` : `${c.tries} tries, not yet correct`
                          return <td key={d.id} className={`px-1 text-center ${c?.correct ? 'font-bold text-sgreen' : !asks ? 'text-ink-2' : ''}`}><span aria-hidden>{txt}</span><span className="sr-only">{DIM_LABEL[d.id]}: {sr}</span></td>
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="sheet rounded-lg p-4 text-sm" aria-labelledby="h-out">
            <h2 id="h-out" className="label">After this pathway you can</h2>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">{p.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
            <p className="mt-2 text-ink-2">Sources are on each lesson page. Numbers in the questions are generated for practice.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function ItemCard({ p, it, confidence }: { p: Pathway; it: Item; confidence?: boolean }) {
  if (it.kind === 'choice') return <ChoiceCard p={p} it={it} confidence={confidence} />
  if (it.kind === 'numeric') return <NumericCard p={p} it={it} confidence={confidence} />
  return <ExternalCard it={it} />
}

function useRecord(p: Pathway, it: Item) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const quizResult = useStore((s) => s.quizResult)
  const logMistake = useStore((s) => s.logMistake)
  return (correct: boolean, given: string, extra: { variant?: number; confidence?: 1 | 2 | 3; prompt: string; right: string; explain: string }) => {
    recordAttempt({ item: itemKey(p, it), concept: it.concept, dim: it.dim, correct, given, variant: extra.variant, confidence: extra.confidence })
    quizResult(it.concept, correct)
    if (!correct) logMistake({ concept: it.concept, prompt: extra.prompt, given, correct: extra.right, explain: extra.explain })
  }
}

function Confidence({ value, set }: { value: 1 | 2 | 3 | undefined; set: (v: 1 | 2 | 3) => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="How sure are you?">
      <span className="text-ink-2">How sure are you?</span>
      {CONF.map((c) => <button key={c.v} type="button" className={`pop-btn !py-1 ${value === c.v ? '!border-sblue !text-sblue' : ''}`} aria-pressed={value === c.v} onClick={() => set(c.v)}>{c.label}</button>)}
    </div>
  )
}

function ChoiceCard({ p, it, confidence }: { p: Pathway; it: ChoiceItem; confidence?: boolean }) {
  const attempts = useStore((s) => s.attempts)
  const record = useRecord(p, it)
  const [pick, setPick] = useState<number | null>(null)
  const [conf, setConf] = useState<1 | 2 | 3>()
  const done = solved(attempts, itemKey(p, it))
  // One try per day: a second click after seeing the answer would not be evidence.
  const todays = attempts.filter((a) => a.item === itemKey(p, it) && today(new Date(a.at)) === today())
  const earlier = pick === null && todays.length ? it.options.findIndex((o) => o.text === todays[todays.length - 1].given) : -1
  const choose = (i: number) => {
    if (pick !== null) return
    setPick(i)
    record(i === it.answer, it.options[i].text, { confidence: conf, prompt: it.prompt, right: it.options[it.answer].text, explain: it.options[it.answer].why })
  }
  return (
    <div className="rounded-md border border-line p-3 sm:p-4">
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">{it.predict ? <strong className="text-ink">Predict first</strong> : <span>Question</span>}<span>· {DIM_LABEL[it.dim]}</span>{done && <span className="font-semibold text-sgreen">✓ answered correctly before</span>}</p>
      <p className="mt-1 font-semibold">{it.prompt}</p>
      {confidence && pick === null && earlier < 0 && <Confidence value={conf} set={setConf} />}
      <div className="mt-3 grid gap-2">
        {it.options.map((o, i) => {
          const shown = pick ?? (earlier >= 0 ? earlier : null)
          const st = shown === null ? 'hover:border-sblue' : i === it.answer ? 'border-sgreen bg-sgreen/10 font-semibold' : i === shown ? 'border-sred bg-sred/10' : 'text-ink-2'
          return <button key={o.text} disabled={shown !== null} onClick={() => choose(i)} className={`answer rounded-md border border-line px-3 py-2 text-left ${st}`}>{o.text}</button>
        })}
      </div>
      {(pick ?? (earlier >= 0 ? earlier : null)) !== null && (() => {
        const shown = (pick ?? earlier) as number
        return (
          <div className="mt-3" aria-live="polite">
            <p><strong className={shown === it.answer ? 'text-sgreen' : 'text-sorange'}>{shown === it.answer ? 'Right.' : 'Not this one.'}</strong> {it.options[shown].why}</p>
            {shown !== it.answer && <p className="mt-1"><strong>Answer:</strong> {it.options[it.answer].text}. {it.options[it.answer].why.replace(/^Right[.:]\s*/, '')}</p>}
            {shown !== it.answer && <p className="mt-1 text-sm text-ink-2">{it.predict ? 'Your prediction is saved; the step counts as done.' : 'You can answer this again tomorrow. It’s in your error notebook meanwhile.'}</p>}
          </div>
        )
      })()}
    </div>
  )
}

function NumericCard({ p, it, confidence }: { p: Pathway; it: NumericItem; confidence?: boolean }) {
  const attempts = useStore((s) => s.attempts)
  const record = useRecord(p, it)
  const key = itemKey(p, it)
  const [seed, setSeed] = useState(() => triesOf(attempts, key))
  const [val, setVal] = useState('')
  const [grade, setGrade] = useState<Grade | null>(null)
  const [conf, setConf] = useState<1 | 2 | 3>()
  const [showSteps, setShowSteps] = useState(false)
  const g = it.make(seed)
  const done = solved(attempts, key)
  const inputId = `ans-${key.replace(/[^a-z0-9-]/gi, '-')}`
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (grade && grade.kind !== 'retry') return
    const r = gradeNumeric(val, g.answer)
    setGrade(r)
    if (r.kind !== 'retry') record(r.kind === 'correct', val, { variant: seed, confidence: conf, prompt: g.prompt, right: `${+g.answer.value.toFixed(2)} ${g.answer.unit}`, explain: g.steps.join(' ') })
  }
  const next = () => { setSeed(triesOf(useStore.getState().attempts, key)); setVal(''); setGrade(null); setShowSteps(false); setConf(undefined) }
  return (
    <div className="rounded-md border border-line p-3 sm:p-4">
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2"><span>{it.dim === 'calculate' ? 'Calculate' : `Calculate to ${DIM_LABEL[it.dim].toLowerCase()}`}</span>{done && <span className="font-semibold text-sgreen">✓ solved before</span>}</p>
      <p className="mt-1 font-semibold">{g.prompt}</p>
      {confidence && !grade && <Confidence value={conf} set={setConf} />}
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={submit}>
        <label htmlFor={inputId} className="block"><span className="label">Your answer, with its unit</span>
          <input id={inputId} className="input mt-1 w-48" value={val} onChange={(e) => { setVal(e.target.value); if (grade?.kind === 'retry') setGrade(null) }} placeholder={g.answer.unit === '%' ? 'e.g. 75.2 %' : g.answer.unit === 's' ? 'e.g. 48 s' : g.answer.unit === 'days' ? 'e.g. 3 days' : 'number and unit'} autoComplete="off" readOnly={!!grade && grade.kind !== 'retry'} />
        </label>
        {(!grade || grade.kind === 'retry') && <button className="btn" type="submit">Check</button>}
      </form>
      <div aria-live="polite">
        {grade && <p className="mt-2"><strong className={grade.kind === 'correct' ? 'text-sgreen' : grade.kind === 'retry' ? 'text-ink' : 'text-sorange'}>{grade.kind === 'correct' ? 'Correct.' : grade.kind === 'retry' ? 'Almost:' : 'Not yet.'}</strong> {grade.kind !== 'correct' && grade.msg}</p>}
        {grade?.kind === 'wrong' && !showSteps && <p className="mt-1 text-sm text-ink-2">Hint: {g.hint}</p>}
      </div>
      {grade && grade.kind !== 'retry' && (
        <div className="mt-2 flex flex-wrap gap-2">
          {!showSteps && <button className="pop-btn !py-1.5" onClick={() => setShowSteps(true)}>Show the worked solution</button>}
          <button className="pop-btn !py-1.5" onClick={next}>{grade.kind === 'wrong' ? 'Try again with new numbers' : 'New numbers'}</button>
        </div>
      )}
      {showSteps && <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
    </div>
  )
}

function ExternalCard({ it }: { it: ExternalItem }) {
  const attempts = useStore((s) => s.attempts)
  const done = solved(attempts, it.item)
  const tried = triesOf(attempts, it.item)
  return (
    <div className="rounded-md border border-line p-3 sm:p-4">
      <p className="text-sm text-ink-2">Case · {DIM_LABEL[it.dim]}</p>
      <p className="mt-1 font-semibold">{it.prompt}</p>
      <p className="mt-2 text-sm">{done ? <strong className="text-sgreen">✓ Done: your result is saved.</strong> : tried ? `Tried ${tried} time${tried > 1 ? 's' : ''}; not yet 3 of 4. Replay the case.` : 'Your result is saved here when you close the case.'}</p>
      <Link className="btn mt-2" to={it.to}>{it.label}</Link>
    </div>
  )
}
