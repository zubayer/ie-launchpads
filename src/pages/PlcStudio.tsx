import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { PLC_LESSONS, PLC_LESSON_MAP, type PlcLesson, type PlcPuzzle, type PlcTask } from '../content/plc/course'
import { Code, LadderDiagram, LadderRunner, ScenarioTable } from '../components/Ladder'
import { blockers, insText, lint, parseProgram, runScript, walk, type Node } from '../lib/ladder'
import { solved } from '../lib/answers'
import { useStore } from '../lib/store'
import { PageHead } from '../components/ui'
import { Check, Sources } from '../components/StudioBits'

const key = (id: string) => `plc:${id}`
const prog = (src: string) => parseProgram(src).program

export function PlcStudio() {
  const attempts = useStore((s) => s.attempts)
  return (
    <div>
      <PageHead title="PLC studio" sub="Ladder logic the way it runs on a controller: nine lessons from the scan cycle to sequences, troubleshooting and safety. Every rung on these pages runs in a ladder engine in your browser, and every scenario table is what that engine produced." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ol className="space-y-3">
          {PLC_LESSONS.map((l, n) => {
            const done = l.tasks.filter((t) => solved(attempts, key(t.id))).length
            return (
              <li key={l.id} className="sheet rounded-lg p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-extrabold"><span className="text-ink-2">{n + 1}.</span> <Link className="hover:text-sblue hover:underline" to={`/studio/plc/${l.id}`}>{l.title}</Link></h2>
                  <span className="text-sm text-ink-2">{l.level} · about {l.minutes} min · practice {done} of {l.tasks.length}</span>
                </div>
                <p className="mt-1">{l.goal}</p>
              </li>
            )
          })}
        </ol>
        <aside className="space-y-4">
          <section className="sheet rounded-lg p-4 text-sm" aria-labelledby="eng-h">
            <h2 id="eng-h" className="label">The ladder engine</h2>
            <p className="mt-1">Rungs are written in the text form Allen-Bradley Logix uses: <code>XIC(Start) XIO(Stop) OTE(Motor)</code>, with <code>[ , ]</code> (or BST/NXB/BND) for branches. It runs XIC, XIO, ONS, OTE, OTL, OTU, TON, TOF, RTO, CTU, CTD, RES, MOV, ADD, SUB and six comparisons, scan by scan, following the behaviour on Rockwell’s instruction pages.</p>
            <p className="mt-2 text-ink-2">It is a teaching model, not a controller emulator: use it to learn and to test ideas, never to commission a machine.</p>
          </section>
          <section className="sheet rounded-lg border-l-4 !border-l-tape p-4 text-sm" aria-labelledby="machine-h">
            <h2 id="machine-h" className="label">Machine lab</h2>
            <p className="mt-1"><Link className="font-semibold underline" to="/studio/plc/lab/bottle-filler">Bottle filler</Link>: watch a conveyor stop, fill and move bottles while the ladder runs, rung by rung and scan by scan.</p>
          </section>
          <section className="sheet rounded-lg p-4 text-sm">
            <h2 className="label">Just want to experiment?</h2>
            <p className="mt-1">The <Link className="font-semibold underline" to="/lab/plc-ladder">PLC ladder lab</Link> has the classic circuits ready to run and edit.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

export function PlcLessonPage() {
  const { lesson = '' } = useParams()
  const l = PLC_LESSON_MAP[lesson]
  if (!l) return <div><h1 className="display text-3xl">No such PLC lesson</h1><p className="mt-2"><Link className="underline" to="/studio/plc">See all PLC lessons</Link></p></div>
  return <Lesson key={l.id} l={l} />
}

function Lesson({ l }: { l: PlcLesson }) {
  const n = PLC_LESSONS.indexOf(l)
  const prev = PLC_LESSONS[n - 1], next = PLC_LESSONS[n + 1]
  const [play, setPlay] = useState({ src: l.examples[0].program, devices: l.examples[0].devices })
  const c = CONCEPT_MAP[l.concept]
  const toPlayground = (src: string, devices = l.examples[0].devices) => { setPlay({ src, devices }); document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-2"><Link className="underline" to="/studio/plc">PLC studio</Link> › Lesson {n + 1} of {PLC_LESSONS.length}</nav>
      <PageHead title={l.title} sub={l.goal}>
        <p className="mt-2 text-sm text-ink-2">{l.level} · about {l.minutes} minutes · lesson page: <Link className="underline" to={`/c/${c.id}`}>{c.term}</Link></p>
      </PageHead>

      {l.safety && <p className="measure mb-5 rounded-md border-l-4 border-sorange bg-sorange/5 px-4 py-2 text-sm"><strong>Safety:</strong> {l.safety}</p>}

      <div className="measure space-y-5">
        <section aria-labelledby="idea-h">
          <h2 id="idea-h" className="text-xl font-extrabold">The idea</h2>
          <p className="mt-1 text-[1.05rem]">{l.intuition}</p>
          <p className="mt-2 border-l-4 border-tape pl-3"><strong>Think of it as:</strong> {l.analogy}</p>
        </section>
        <section aria-labelledby="model-h">
          <h2 id="model-h" className="text-xl font-extrabold">How it works</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">{l.model.map((m) => <li key={m}>{m}</li>)}</ul>
          <p className="label mb-1 mt-3">The shape of it</p>
          <Code src={l.syntax} label="Rung syntax" />
        </section>
      </div>

      <section className="mt-8" aria-labelledby="ex-h">
        <h2 id="ex-h" className="text-xl font-extrabold">Worked examples</h2>
        <div className="mt-3 space-y-5">
          {l.examples.map((e, i) => {
            const p = prog(e.program)
            const r = runScript(p, e.devices, e.script)
            return (
              <article key={e.id} className="sheet rounded-lg p-4 sm:p-5">
                <p className="label">Example {i + 1} · {e.title}</p>
                <h3 className="mt-1 text-lg font-bold">{e.question}</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="min-w-0">
                    <LadderDiagram program={p} label={`Ladder for: ${e.question}`} />
                    <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">Rung text</summary><Code src={e.program} label={`Rung text for: ${e.question}`} /></details>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">{e.explain.map((x) => <li key={x}>{x}</li>)}</ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="pop-btn !py-1.5" onClick={() => toPlayground(e.program, e.devices)}>Run it yourself in the playground</button>
                      {e.lab && <Link className="pop-btn !py-1.5" to={e.lab.to}>{e.lab.label} →</Link>}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="label mb-1">What the engine does, step by step</p>
                    <ScenarioTable rows={r.rows} devices={e.devices} show={e.show} caption={`Scenario for: ${e.question}`} />
                    <p className="mt-2"><strong>So what:</strong> {e.takeaway}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {l.checks.length > 0 && (
        <section className="mt-8" aria-labelledby="chk-h">
          <h2 id="chk-h" className="text-xl font-extrabold">Check your model</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">{l.checks.map((q) => <Check key={q.id} q={q} concept={l.concept} />)}</div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="mis-h">
        <h2 id="mis-h" className="text-xl font-extrabold">Common mistakes</h2>
        <div className="mt-3 space-y-4">
          {l.mistakes.map((m) => {
            const wrong = runScript(prog(m.wrong), m.wrongDevices ?? m.devices, m.script)
            const fix = runScript(prog(m.fix), m.devices, m.script)
            const warn = lint(prog(m.wrong), (m.wrongDevices ?? m.devices).map((d) => d.tag))
            return (
              <article key={m.id} className="sheet rounded-lg p-4 sm:p-5">
                <h3 className="text-lg font-bold">{m.title}</h3>
                <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="min-w-0">
                    <p className="label mb-1 text-sred">Looks right, isn’t</p>
                    <LadderDiagram program={prog(m.wrong)} label={`Mistaken ladder: ${m.title}`} />
                    {m.wrongDevices && <p className="mt-1 text-sm text-ink-2">Wired as: {m.wrongDevices.map((d) => `${d.label}`).join(', ')}</p>}
                    {warn.map((w) => <p key={w.msg} className="mt-1 text-sm text-sorange"><strong>A reviewer would flag:</strong> {w.msg}</p>)}
                    <div className="mt-2"><ScenarioTable rows={wrong.rows} devices={m.wrongDevices ?? m.devices} show={m.show} caption={`Mistaken version: ${m.title}`} graded /></div>
                  </div>
                  <div className="min-w-0">
                    <p className="label mb-1 text-sgreen">Fixed</p>
                    <LadderDiagram program={prog(m.fix)} label={`Fixed ladder: ${m.title}`} />
                    {m.wrongDevices && <p className="mt-1 text-sm text-ink-2">Wired as: {m.devices.map((d) => d.label).join(', ')}</p>}
                    <div className="mt-2"><ScenarioTable rows={fix.rows} devices={m.devices} show={m.show} caption={`Fixed version: ${m.title}`} graded /></div>
                  </div>
                </div>
                <p className="mt-3"><strong>Why:</strong> {m.why}</p>
              </article>
            )
          })}
        </div>
      </section>

      {l.puzzles?.length ? (
        <section className="mt-8" aria-labelledby="puz-h">
          <h2 id="puz-h" className="text-xl font-extrabold">Find where the power stops</h2>
          <p className="mt-1 text-ink-2">The diagram shows the program online at the moment described. Green instructions are true; green wires carry power.</p>
          <div className="mt-3 space-y-4">{l.puzzles.map((z, i) => <Puzzle key={z.id} z={z} n={i + 1} concept={l.concept} />)}</div>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="prac-h">
        <h2 id="prac-h" className="text-xl font-extrabold">Practice</h2>
        <p className="mt-1 text-ink-2">Write the rungs, then check them. Your program is graded by behaviour: it runs through the scenario and every expected value must match. Any program that behaves correctly counts.</p>
        <div className="mt-3 space-y-4">{l.tasks.map((t, i) => <Task key={t.id} t={t} n={i + 1} concept={l.concept} />)}</div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="iq-h">
          <h2 id="iq-h" className="text-lg font-extrabold">Interview questions</h2>
          <div className="mt-2 space-y-2">{l.interview.map((q) => <details key={q.q} className="rounded-md border border-line px-3 py-2"><summary className="cursor-pointer font-semibold">{q.q}</summary><p className="mt-1">{q.a}</p></details>)}</div>
        </section>
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="job-h">
          <h2 id="job-h" className="text-lg font-extrabold">On the job</h2>
          <p className="mt-1">{l.onTheJob}</p>
          <p className="mt-3 text-sm text-ink-2">Instruction names here are Rockwell’s (Allen-Bradley). Siemens, Omron and CODESYS-based controllers use different names and some different behaviour for the same ideas: check the manual for your platform.</p>
        </section>
      </div>

      <section id="playground" className="sheet mt-8 scroll-mt-4 rounded-lg p-4 sm:p-5" aria-labelledby="pg-h">
        <h2 id="pg-h" className="text-lg font-extrabold">Playground</h2>
        <p className="mb-3 mt-1 text-sm text-ink-2">Change anything and watch it run. Your edits stay in this tab.</p>
        <LadderRunner initial={play.src} devices={play.devices} title="Program" />
      </section>

      <Sources cites={l.cites} />

      <nav aria-label="Lessons" className="mt-6 flex flex-wrap justify-between gap-2">
        {prev ? <Link className="btn-ghost btn" to={`/studio/plc/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && <Link className="btn" to={`/studio/plc/${next.id}`}>Next: {next.title} →</Link>}
      </nav>
    </div>
  )
}

function Puzzle({ z, n, concept }: { z: PlcPuzzle; n: number; concept: string }) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const p = useMemo(() => prog(z.program), [z.program])
  const r = useMemo(() => runScript(p, z.devices, z.setup), [p, z])
  const answer = insText(blockers(p.rungs[z.rung], r.traces[z.rung])[0])
  const options = p.rungs[z.rung].nodes.filter((x): x is Node => x.kind === 'branch' || !['OTE', 'OTL', 'OTU', 'TON', 'TOF', 'RTO', 'CTU', 'CTD', 'RES', 'MOV', 'ADD', 'SUB'].includes(x.op)).map(insText)
  const [pick, setPick] = useState<string | null>(null)
  const choose = (o: string) => { setPick(o); recordAttempt({ item: `plc:${z.id}`, concept, dim: 'apply', correct: o === answer, given: o }) }
  return (
    <article className="sheet rounded-lg p-4 sm:p-5">
      <p className="label">Puzzle {n}</p>
      <p className="mt-1 font-semibold">{z.story}</p>
      <div className="mt-3"><LadderDiagram program={p} tags={r.tags} traces={r.traces} label={`Online view for puzzle ${n}`} /></div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Answers for puzzle ${n}`}>
        {options.map((o) => <button key={o} type="button" className={`rounded-md border px-2.5 py-1 font-mono text-sm ${pick === o ? (o === answer ? 'border-sgreen bg-sgreen/10' : 'border-sred bg-sred/5') : 'border-line'}`} aria-pressed={pick === o} onClick={() => choose(o)}>{o}</button>)}
      </div>
      {pick && <p className="mt-2 text-sm" aria-live="polite">{pick === answer ? <><strong className="text-sgreen">Right.</strong> Power reaches {answer} but doesn’t pass it: that is the bit to follow.</> : <><strong className="text-sorange">Not that one.</strong> {pick} passes power (or never receives it). Look for the instruction with a green wire on its left and a grey wire on its right.</>}</p>}
    </article>
  )
}

function Task({ t, n, concept }: { t: PlcTask; n: number; concept: string }) {
  const attempts = useStore((s) => s.attempts)
  const recordAttempt = useStore((s) => s.recordAttempt)
  const logMistake = useStore((s) => s.logMistake)
  const [src, setSrc] = useState(t.starter ?? '')
  const [result, setResult] = useState<ReturnType<typeof runScript> | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [hint, setHint] = useState(false)
  const [answer, setAnswer] = useState(false)
  const done = solved(attempts, key(t.id))
  const check = () => {
    const { program, errors } = parseProgram(src)
    if (errors.length) { setResult(null); setMsg({ ok: false, text: `Fix line ${errors[0].line}, column ${errors[0].col} first: ${errors[0].msg} An error isn’t counted as an attempt.` }); return }
    if (!program.rungs.length) { setMsg({ ok: false, text: 'Write at least one rung.' }); return }
    let banned = ''
    walk(program, (x) => { if (t.forbid?.includes(x.op)) banned = x.op })
    const r = runScript(program, t.devices, t.script)
    const ok = r.pass && !banned
    setResult(r)
    recordAttempt({ item: key(t.id), concept, dim: 'implement', correct: ok, given: src.slice(0, 500) })
    const first = r.rows.find((x) => x.wrong.length)
    const why = banned ? `This task asks you not to use ${banned}.` : first ? `At “${first.say}”, ${first.wrong.map((w) => `${w.tag} is ${w.got} but should be ${w.want}`).join(', ')}.` : ''
    if (!ok) logMistake({ concept, prompt: `PLC practice: ${t.task}`, given: src.slice(0, 300), correct: t.solution, explain: why })
    const warns = lint(program, t.devices.map((d) => d.tag))
    setMsg(ok ? { ok, text: warns.length ? `It behaves correctly. A reviewer would still flag: ${warns[0].msg}` : 'Every step behaves as specified.' } : { ok, text: why })
  }
  return (
    <article className="sheet rounded-lg p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2"><span>Task {n}</span>{done && <span className="font-semibold text-sgreen">✓ solved before</span>}</p>
      <h3 className="mt-1 font-bold">{t.task}</h3>
      <p className="mt-1 text-sm text-ink-2">Inputs: {t.devices.map((d) => `${d.tag} (${d.label})`).join(', ')}.</p>
      <label className="label mt-3 block" htmlFor={`${t.id}-src`}>Your rungs, one per line</label>
      <textarea id={`${t.id}-src`} className="input mt-1 font-mono text-[0.85rem] leading-relaxed" rows={Math.max(3, src.split('\n').length + 1)} spellCheck={false} value={src} onChange={(e) => setSrc(e.target.value)} placeholder="XIC(…) OTE(…)" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={check}>Run the scenario and check</button>
        {t.starter && <button type="button" className="btn-ghost btn" onClick={() => setSrc(t.starter!)}>Back to the starter</button>}
      </div>
      <div aria-live="polite">
        {msg && <p className="mt-2"><strong className={msg.ok ? 'text-sgreen' : 'text-sorange'}>{msg.ok ? 'Correct.' : 'Not yet.'}</strong> {msg.text}</p>}
      </div>
      {result && <div className="mt-3"><ScenarioTable rows={result.rows} devices={t.devices} show={t.show} caption={`Your program on the scenario for task ${n}`} graded /></div>}
      {src.trim() && !parseProgram(src).errors.length && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">See your rungs as ladder</summary><div className="mt-2"><LadderDiagram program={prog(src)} label={`Your ladder for task ${n}`} /></div></details>}
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <button type="button" className="underline" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>
        <button type="button" className="underline" aria-expanded={answer} onClick={() => setAnswer(!answer)}>{answer ? 'Hide the model answer' : 'Show the model answer'}</button>
      </div>
      {hint && <p className="mt-1 text-sm">{t.hint}</p>}
      {answer && <div className="mt-2 space-y-2"><Code src={t.solution} label={`Model answer for task ${n}`} /><LadderDiagram program={prog(t.solution)} label={`Model answer ladder for task ${n}`} /></div>}
    </article>
  )
}

/* ---------- Machine lab: the bottle filler (embedded from github.com/zubayer/PLCLadderLogic) ---------- */

const LAB_SRC = `${import.meta.env.BASE_URL}labs/plc-bottle-filler/index.html`
const ADDRESS_MAP: [string, string, string][] = [
  ['I0.0', 'Bottle_At_Sensor', 'Photo sensor: a bottle is in the beam'],
  ['Q0.0', 'Belt_Motor', 'Conveyor motor'],
  ['Q0.1', 'Fill_Valve', 'Filling valve (solenoid)'],
  ['M0.0', 'Full', 'Memory bit: this bottle is done'],
  ['TON, PT 3 s, Q', 'TON(Fill_T, 3000), Fill_T.DN', 'Fill timer and its done bit'],
  ['—| |—  /  —|/|—', 'XIC  /  XIO', 'Normally open / normally closed contact'],
  ['( )  (S)  (R)', 'OTE  OTL  OTU', 'Coil, set (latch), reset (unlatch)'],
]

export function PlcMachineLab() {
  const ex = PLC_LESSON_MAP.sequence.examples.find((e) => e.id === 'bottle-filler')!
  const p = useMemo(() => prog(ex.program), [ex.program])
  const r = useMemo(() => runScript(p, ex.devices, ex.script), [p, ex.devices, ex.script])
  return (
    <div>
      <PageHead title="Machine lab: bottle filler" sub="A conveyor brings bottles to a filling valve. Watch the ladder run the machine: power flow in green, the TON timer filling, the I/O image updating, and a Scan by scan mode that freezes time between the read, solve and write phases." />
      <p className="mb-3 text-sm text-ink-2 md:hidden">Best on a tablet or computer, or with your phone turned sideways. On a narrow screen the lab scrolls inside its frame.</p>
      <div className="overflow-hidden rounded-lg border border-line bg-sheet">
        <iframe src={LAB_SRC} title="PLC Ladder Lab: bottle-filling conveyor simulator" className="block h-[80vh] w-full md:aspect-video md:h-auto" loading="lazy" />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
        <span>Keys, after clicking inside the lab: <kbd className="kbd">Space</kbd> play/pause · <kbd className="kbd">N</kbd> next scan step · <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> lesson steps</span>
        <a className="font-semibold text-sblue hover:underline" href={LAB_SRC} target="_blank" rel="noopener">Open full screen ↗</a>
      </div>
      <p className="mt-2 text-sm text-ink-2">PLC Ladder Lab by Zubayer, built for IE 5355 Computer-Aided Manufacturing, Texas Tech University. Source: <a className="underline" href="https://github.com/zubayer/PLCLadderLogic" target="_blank" rel="noopener">github.com/zubayer/PLCLadderLogic</a>. The lab uses Siemens S7-1200 style addresses and IEC 61131-3 symbols.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="map-h">
          <h2 id="map-h" className="text-xl font-extrabold">Same machine, two dialects</h2>
          <p className="mt-1 text-sm">The lab writes Siemens addresses; the rest of this studio writes Allen-Bradley Logix tags. The logic is identical.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Siemens S7 addresses in the lab and the matching Logix tags in the studio</caption>
              <thead><tr className="border-b border-line"><th scope="col" className="py-1.5 pr-3">Lab (S7, IEC)</th><th scope="col" className="py-1.5 pr-3">Studio (Logix)</th><th scope="col" className="py-1.5">Meaning</th></tr></thead>
              <tbody>{ADDRESS_MAP.map(([a, b, c]) => <tr key={a} className="border-b border-line/60"><td className="py-1.5 pr-3 font-mono">{a}</td><td className="py-1.5 pr-3 font-mono">{b}</td><td className="py-1.5">{c}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-2">One difference: the lab puts the timer and the Set coil on one rung (rung 3). Here they are two rungs, because the timer's done bit is read on the next rung.</p>
        </section>
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="tested-h">
          <h2 id="tested-h" className="text-xl font-extrabold">The Auto cycle, tested</h2>
          <p className="mt-1 text-sm">The lab's Auto cycle program, run on this studio's ladder engine. The test suite checks every row below on each change.</p>
          <div className="mt-3"><LadderDiagram program={p} label="Ladder for the bottle filler auto cycle" /></div>
          <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">Rung text</summary><Code src={ex.program} label="Rung text for the bottle filler auto cycle" /></details>
          <p className="label mb-1 mt-4">What the engine does, step by step</p>
          <ScenarioTable rows={r.rows} devices={ex.devices} show={ex.show} caption="Scenario for the bottle filler auto cycle" />
          <p className="mt-3 text-sm">The full lesson, with the common mistake of making Full a plain coil: <Link className="font-semibold underline" to="/studio/plc/sequence">Sequences: steps, transitions and watchdogs</Link>.</p>
        </section>
      </div>
    </div>
  )
}
