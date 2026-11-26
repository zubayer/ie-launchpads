import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { CAD_LESSONS, CAD_LESSON_MAP, MATE_MAP, SKETCH_MAP, type CadLabSpec, type CadLesson, type CadTask } from '../content/cad/course'
import { grade, type Verdict } from '../content/cad/grade'
import { BeamLab, EquationsLab, FeatureLab, IntentLab, MateLab, PartCountLab, SketchLab, ViewsLab } from '../components/CadLabs'
import { Check, Sources } from '../components/StudioBits'
import { solved } from '../lib/answers'
import { useStore } from '../lib/store'
import { PageHead } from '../components/ui'
import type { Equation } from '../lib/cad'
import type { Dimension } from '../lib/store'

const key = (id: string) => `cad:${id}`

export function CadStudio() {
  const attempts = useStore((s) => s.attempts)
  return (
    <div>
      <PageHead title="CAD studio" sub="SolidWorks-style modelling, from the inside: seven lessons on sketches, design intent, the feature tree, mates, drawings, sanity-checking simulation and designing for the shop floor. The labs compute real answers: degrees of freedom from the constraint equations, motion from the mates, views from the 3D part." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ol className="space-y-3">
          {CAD_LESSONS.map((l, n) => {
            const done = l.tasks.filter((t) => solved(attempts, key(t.id))).length
            return (
              <li key={l.id} className="sheet rounded-lg p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-extrabold"><span className="text-ink-2">{n + 1}.</span> <Link className="hover:text-sblue hover:underline" to={`/studio/cad/${l.id}`}>{l.title}</Link></h2>
                  <span className="text-sm text-ink-2">{l.level} · about {l.minutes} min{l.tasks.length ? ` · practice ${done} of ${l.tasks.length}` : ''}</span>
                </div>
                <p className="mt-1">{l.goal}</p>
              </li>
            )
          })}
        </ol>
        <aside className="space-y-4">
          <section className="sheet rounded-lg p-4 text-sm" aria-labelledby="why-h">
            <h2 id="why-h" className="label">What this is (and isn’t)</h2>
            <p className="mt-1">You can’t run SOLIDWORKS in a browser, so these labs model the ideas underneath it: the counting a sketch solver does, the kinematics of mates, the dependencies in a feature tree. The names and behaviour follow SOLIDWORKS; Creo, NX, CATIA, Inventor and Fusion work the same way under different names.</p>
            <p className="mt-2 text-ink-2">To practise the software itself, pair each lesson with the same exercise in SOLIDWORKS and compare.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

export function CadLessonPage() {
  const { lesson = '' } = useParams()
  const l = CAD_LESSON_MAP[lesson]
  if (!l) return <div><h1 className="display text-3xl">No such CAD lesson</h1><p className="mt-2"><Link className="underline" to="/studio/cad">See all CAD lessons</Link></p></div>
  return <Lesson key={l.id} l={l} />
}

function Lab({ spec }: { spec: CadLabSpec }) {
  const [picked, setPicked] = useState<string[]>(spec.kind === 'mates' ? spec.start : spec.kind === 'sketch' ? SKETCH_MAP[spec.preset].start : [])
  const [eqs, setEqs] = useState<Equation[]>(spec.kind === 'equations' ? spec.start : [])
  const [width, setWidth] = useState(100)
  const [order, setOrder] = useState<string[]>(spec.kind === 'features' ? spec.start : [])
  const [answers, setAnswers] = useState<Record<string, [boolean, boolean, boolean]>>({})
  switch (spec.kind) {
    case 'sketch': return <SketchLab preset={spec.preset} picked={picked} setPicked={setPicked} />
    case 'mates': return <MateLab picked={picked} setPicked={setPicked} />
    case 'intent': return <IntentLab />
    case 'equations': return <EquationsLab eqs={eqs} setEqs={setEqs} width={width} setWidth={setWidth} />
    case 'features': return <FeatureLab order={order} setOrder={setOrder} />
    case 'views': return <ViewsLab />
    case 'beam': return <BeamLab />
    case 'partcount': return <PartCountLab answers={answers} setAnswers={setAnswers} reveal={false} />
  }
}

function Lesson({ l }: { l: CadLesson }) {
  const n = CAD_LESSONS.indexOf(l)
  const prev = CAD_LESSONS[n - 1], next = CAD_LESSONS[n + 1]
  const c = CONCEPT_MAP[l.concept]
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-2"><Link className="underline" to="/studio/cad">CAD studio</Link> › Lesson {n + 1} of {CAD_LESSONS.length}</nav>
      <PageHead title={l.title} sub={l.goal}>
        <p className="mt-2 text-sm text-ink-2">{l.level} · about {l.minutes} minutes · lesson page: <Link className="underline" to={`/c/${c.id}`}>{c.term}</Link></p>
      </PageHead>
      <div className="measure space-y-5">
        <section aria-labelledby="idea-h">
          <h2 id="idea-h" className="text-xl font-extrabold">The idea</h2>
          <p className="mt-1 text-[1.05rem]">{l.intuition}</p>
          <p className="mt-2 border-l-4 border-tape pl-3"><strong>Think of it as:</strong> {l.analogy}</p>
        </section>
        <section aria-labelledby="model-h">
          <h2 id="model-h" className="text-xl font-extrabold">How it works</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">{l.model.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="lab-h">
        <h2 id="lab-h" className="text-xl font-extrabold">Try it</h2>
        <div className="mt-3 space-y-5">
          {l.labs.map((s, i) => (
            <article key={i} className="sheet rounded-lg p-4 sm:p-5">
              <p className="label">Lab {i + 1}{s.kind === 'sketch' ? ` · ${SKETCH_MAP[s.preset].title}` : ''}</p>
              <p className="mb-3 mt-1">{s.intro}</p>
              <Lab spec={s} />
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="chk-h">
        <h2 id="chk-h" className="text-xl font-extrabold">Check your model</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">{l.checks.map((q) => <Check key={q.id} q={q} concept={l.concept} prefix="cad" />)}</div>
      </section>

      <section className="mt-8" aria-labelledby="mis-h">
        <h2 id="mis-h" className="text-xl font-extrabold">Common mistakes</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {l.mistakes.map((m) => (
            <article key={m.id} className="sheet rounded-lg p-4">
              <h3 className="font-bold">{m.title}</h3>
              <p className="mt-2 text-sm"><span className="font-semibold text-sred">Looks right, isn’t: </span>{m.wrong}</p>
              <p className="mt-1 text-sm"><span className="font-semibold text-sgreen">Instead: </span>{m.right}</p>
              <p className="mt-2"><strong>Why:</strong> {m.why}</p>
            </article>
          ))}
        </div>
      </section>

      {l.tasks.length > 0 && (
        <section className="mt-8" aria-labelledby="prac-h">
          <h2 id="prac-h" className="text-xl font-extrabold">Practice</h2>
          <p className="mt-1 text-ink-2">Each answer is checked by recomputing it, so any correct solution counts.</p>
          <div className="mt-3 space-y-4">{l.tasks.map((t, i) => <Task key={t.id} t={t} n={i + 1} concept={l.concept} />)}</div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="iq-h">
          <h2 id="iq-h" className="text-lg font-extrabold">Interview questions</h2>
          <div className="mt-2 space-y-2">{l.interview.map((q) => <details key={q.q} className="rounded-md border border-line px-3 py-2"><summary className="cursor-pointer font-semibold">{q.q}</summary><p className="mt-1">{q.a}</p></details>)}</div>
        </section>
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="job-h">
          <h2 id="job-h" className="text-lg font-extrabold">On the job</h2>
          <p className="mt-1">{l.onTheJob}</p>
        </section>
      </div>

      <Sources cites={l.cites} />
      {l.unsourced && <p className="mt-3 text-sm text-ink-2"><strong>Not yet sourced:</strong> {l.unsourced}</p>}

      <nav aria-label="Lessons" className="mt-6 flex flex-wrap justify-between gap-2">
        {prev ? <Link className="btn-ghost btn" to={`/studio/cad/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && <Link className="btn" to={`/studio/cad/${next.id}`}>Next: {next.title} →</Link>}
      </nav>
    </div>
  )
}

const DIM: Record<CadTask['goal']['kind'], Dimension> = { sketch: 'implement', mates: 'implement', equations: 'implement', features: 'implement', beam: 'calculate', partcount: 'apply' }
function Task({ t, n, concept }: { t: CadTask; n: number; concept: string }) {
  const attempts = useStore((s) => s.attempts)
  const recordAttempt = useStore((s) => s.recordAttempt)
  const logMistake = useStore((s) => s.logMistake)
  const g = t.goal
  const [picked, setPicked] = useState<string[]>([])
  const [eqs, setEqs] = useState<Equation[]>([{ name: 'Hole1', expr: '' }, { name: 'Hole2', expr: '' }, { name: 'Hole3', expr: '' }])
  const [width, setWidth] = useState(100)
  const [order, setOrder] = useState<string[]>(g.kind === 'features' ? g.start : [])
  const [h, setH] = useState('')
  const [answers, setAnswers] = useState<Record<string, [boolean, boolean, boolean]>>({})
  const [v, setV] = useState<Verdict | null>(null)
  const [hint, setHint] = useState(false)
  const [model, setModel] = useState(false)
  const done = solved(attempts, key(t.id))
  const check = () => {
    const keep = Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, a.some(Boolean)]))
    keep.base = true
    const r = grade(g, { picked, eqs, order, h: h.trim() === '' ? undefined : Number(h), keep })
    setV(r)
    const given = g.kind === 'equations' ? eqs.map((e) => `"${e.name}" = ${e.expr}`).join('; ') : g.kind === 'features' ? order.join(' → ') : g.kind === 'beam' ? h : g.kind === 'partcount' ? JSON.stringify(keep) : picked.join(', ')
    recordAttempt({ item: key(t.id), concept, dim: DIM[g.kind], correct: r.ok, given: given.slice(0, 500) })
    if (!r.ok) logMistake({ concept, prompt: `CAD practice: ${t.task}`, given: given.slice(0, 300), correct: modelText(t), explain: r.msg })
  }
  return (
    <article className="sheet rounded-lg p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2"><span>Task {n}</span>{done && <span className="font-semibold text-sgreen">✓ solved before</span>}</p>
      <h3 className="mt-1 font-bold">{t.task}</h3>
      <div className="mt-3">
        {g.kind === 'sketch' && <SketchLab preset={g.preset} picked={picked} setPicked={(p) => { setPicked(p); setV(null) }} />}
        {g.kind === 'mates' && <MateLab picked={picked} setPicked={(p) => { setPicked(p); setV(null) }} />}
        {g.kind === 'equations' && <EquationsLab eqs={eqs} setEqs={(e) => { setEqs(e); setV(null) }} width={width} setWidth={setWidth} />}
        {g.kind === 'features' && <FeatureLab order={order} setOrder={(o) => { setOrder(o); setV(null) }} />}
        {g.kind === 'beam' && <>
          <BeamLab init={{ F: 1000, L: 300, b: 20, h: 25 }} />
          <label className="mt-3 block text-sm font-medium" htmlFor={`${t.id}-h`}>Your answer: depth h in mm</label>
          <input id={`${t.id}-h`} className="input mt-1 !w-32" inputMode="numeric" value={h} onChange={(e) => { setH(e.target.value); setV(null) }} />
        </>}
        {g.kind === 'partcount' && <PartCountLab answers={answers} setAnswers={(a) => { setAnswers(a); setV(null) }} reveal={!!v} />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn" onClick={check}>Check</button>
        <button type="button" className="text-sm underline" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>
        <button type="button" className="text-sm underline" aria-expanded={model} onClick={() => setModel(!model)}>{model ? 'Hide a model answer' : 'Show a model answer'}</button>
      </div>
      <div aria-live="polite">{v && <p className="mt-2"><strong className={v.ok ? 'text-sgreen' : 'text-sorange'}>{v.ok ? 'Correct.' : 'Not yet.'}</strong> {v.msg}</p>}</div>
      {hint && <p className="mt-1 text-sm">{t.hint}</p>}
      {model && <p className="mt-1 text-sm"><strong>One answer:</strong> {modelText(t)}</p>}
    </article>
  )
}
function modelText(t: CadTask): string {
  const g = t.goal
  if (typeof t.model === 'string') return t.model
  if (g.kind === 'equations') return (t.model as Equation[]).map((e) => `"${e.name}" = ${e.expr}`).join(';  ')
  if (g.kind === 'sketch') return (t.model as string[]).map((id) => SKETCH_MAP[g.preset].options.find((o) => o.id === id)?.label).join('; ')
  if (g.kind === 'mates') return (t.model as string[]).map((id) => MATE_MAP[id].label).join('; ')
  return (t.model as string[]).join(', ')
}
