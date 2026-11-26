import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { SQL_LESSONS, SQL_LESSON_MAP, type SqlLesson, type SqlTask } from '../content/sql/course'
import { RESULTS, type Stored } from '../content/sql/results'
import { ResultTable, SchemaPanel, SqlEditor, SqlPlayground } from '../components/SqlPlayground'
import { sameResult, type RunOutcome } from '../lib/sql'
import { solved } from '../lib/answers'
import { useStore } from '../lib/store'
import { PageHead } from '../components/ui'

const taskKey = (t: SqlTask) => `sql:${t.id}`
const Code = ({ sql, label }: { sql: string; label: string }) => (
  <pre className="overflow-x-auto rounded-md border border-line bg-paper/60 p-3 text-[0.88rem] leading-relaxed" tabIndex={0} aria-label={label}><code>{sql}</code></pre>
)
function StoredResult({ r, caption }: { r: Stored; caption: string }) {
  if ('error' in r) return <p className="rounded-md border-l-4 border-sred bg-sred/5 px-3 py-2 text-sm"><strong>SQLite says:</strong> <code>{r.error}</code></p>
  return <ResultTable columns={r.columns} rows={r.rows} caption={caption} />
}

export function SqlStudio() {
  const attempts = useStore((s) => s.attempts)
  return (
    <div>
      <PageHead title="SQL studio" sub="SQL the way an industrial engineer uses it: ten lessons on a plant database, from your first SELECT to window functions and data-quality checks. Every query on these pages has been run, and its result is what you see." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ol className="space-y-3">
          {SQL_LESSONS.map((l, n) => {
            const done = l.tasks.filter((t) => solved(attempts, taskKey(t))).length
            return (
              <li key={l.id} className="sheet rounded-lg p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-extrabold"><span className="text-ink-2">{n + 1}.</span> <Link className="hover:text-sblue hover:underline" to={`/studio/sql/${l.id}`}>{l.title}</Link></h2>
                  <span className="text-sm text-ink-2">{l.level} · about {l.minutes} min · practice {done} of {l.tasks.length}</span>
                </div>
                <p className="mt-1">{l.goal}</p>
              </li>
            )
          })}
        </ol>
        <aside className="space-y-4">
          <section className="sheet rounded-lg p-4" aria-labelledby="ds-h">
            <h2 id="ds-h" className="label">The practice database</h2>
            <p className="mt-1 text-sm"><strong>Riverbend Plant</strong> is synthetic: generated from a fixed seed, so everyone gets the same answers. Six machines on two lines, seven work orders, 81 production runs from October 1–8, 2026, with defects and downtime. It contains a few deliberate data problems for lesson 9 to find.</p>
            <div className="mt-3"><SchemaPanel /></div>
          </section>
          <section className="sheet rounded-lg p-4 text-sm">
            <h2 className="label">Just want to write queries?</h2>
            <p className="mt-1">The <Link className="font-semibold underline" to="/lab/sql">SQL playground</Link> runs SQLite in your browser. Nothing you type leaves this page.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

export function SqlLessonPage() {
  const { lesson = '' } = useParams()
  const l = SQL_LESSON_MAP[lesson]
  if (!l) return <div><h1 className="display text-3xl">No such SQL lesson</h1><p className="mt-2"><Link className="underline" to="/studio/sql">See all SQL lessons</Link></p></div>
  return <Lesson key={l.id} l={l} />
}

function Lesson({ l }: { l: SqlLesson }) {
  const n = SQL_LESSONS.indexOf(l)
  const prev = SQL_LESSONS[n - 1], next = SQL_LESSONS[n + 1]
  const [play, setPlay] = useState(l.examples[0].sql)
  const c = CONCEPT_MAP[l.concept]
  const toPlayground = (sql: string) => { setPlay(sql); document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-2"><Link className="underline" to="/studio/sql">SQL studio</Link> › Lesson {n + 1} of {SQL_LESSONS.length}</nav>
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
          <p className="label mb-1 mt-3">The shape of it</p>
          <Code sql={l.syntax} label="Syntax" />
        </section>
      </div>

      <section className="mt-8" aria-labelledby="ex-h">
        <h2 id="ex-h" className="text-xl font-extrabold">Worked examples</h2>
        <div className="mt-3 space-y-5">
          {l.examples.map((e, i) => (
            <article key={e.id} className="sheet rounded-lg p-4 sm:p-5">
              <p className="label">Example {i + 1} · {e.title}</p>
              <h3 className="mt-1 text-lg font-bold">{e.question}</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Code sql={e.sql} label={`Query for: ${e.question}`} />
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">{e.explain.map((x) => <li key={x}>{x}</li>)}</ul>
                  <button className="pop-btn mt-3 !py-1.5" onClick={() => toPlayground(e.sql)}>Run and change it in the playground</button>
                </div>
                <div>
                  <p className="label mb-1">Result</p>
                  <StoredResult r={RESULTS[e.id]} caption={`Result of: ${e.question}`} />
                  <p className="mt-2"><strong>So what:</strong> {e.takeaway}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="mis-h">
        <h2 id="mis-h" className="text-xl font-extrabold">Common mistakes</h2>
        <div className="mt-3 space-y-4">
          {l.mistakes.map((m) => (
            <article key={m.id} className="sheet rounded-lg p-4 sm:p-5">
              <h3 className="text-lg font-bold">{m.title}</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="label mb-1 text-sred">Looks right, isn’t</p>
                  <Code sql={m.wrong} label={`Mistake: ${m.title}`} />
                  <div className="mt-2"><StoredResult r={RESULTS[`${m.id}:wrong`]} caption={`Result of the mistaken query: ${m.title}`} /></div>
                </div>
                <div>
                  <p className="label mb-1 text-sgreen">Fixed</p>
                  <Code sql={m.fix} label={`Fix: ${m.title}`} />
                  <div className="mt-2"><StoredResult r={RESULTS[`${m.id}:fix`]} caption={`Result of the fixed query: ${m.title}`} /></div>
                </div>
              </div>
              <p className="mt-3"><strong>Why:</strong> {m.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="prac-h">
        <h2 id="prac-h" className="text-xl font-extrabold">Practice</h2>
        <p className="mt-1 text-ink-2">Write the query, then check it. Any query that returns the same rows counts: column names and (unless the task asks for an order) row order don’t matter.</p>
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
          {l.dialects?.length ? <><p className="label mb-1 mt-3">Other databases</p><ul className="list-disc space-y-1 pl-5 text-sm">{l.dialects.map((d) => <li key={d}>{d}</li>)}</ul></> : null}
        </section>
      </div>

      <section id="playground" className="sheet mt-8 scroll-mt-4 rounded-lg p-4 sm:p-5" aria-labelledby="pg-h">
        <h2 id="pg-h" className="text-lg font-extrabold">Playground</h2>
        <p className="mb-3 mt-1 text-sm text-ink-2">Change anything and run it. Your changes stay in this tab.</p>
        <SqlPlayground initial={play} />
      </section>

      <nav aria-label="Lessons" className="mt-6 flex flex-wrap justify-between gap-2">
        {prev ? <Link className="btn-ghost btn" to={`/studio/sql/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && <Link className="btn" to={`/studio/sql/${next.id}`}>Next: {next.title} →</Link>}
      </nav>
    </div>
  )
}

function Task({ t, n, concept }: { t: SqlTask; n: number; concept: string }) {
  const attempts = useStore((s) => s.attempts)
  const recordAttempt = useStore((s) => s.recordAttempt)
  const logMistake = useStore((s) => s.logMistake)
  const [verdict, setVerdict] = useState<{ ok: boolean; msg: string } | null>(null)
  const [hint, setHint] = useState(false)
  const [answer, setAnswer] = useState(false)
  const done = solved(attempts, taskKey(t))
  const want = RESULTS[t.id]
  const grade = (r: RunOutcome, sql: string) => {
    if (!r.ok) { setVerdict({ ok: false, msg: 'Fix the error first; an error isn’t counted as an attempt.' }); return }
    const last = r.results[r.results.length - 1]
    if (!last || 'error' in want) { setVerdict({ ok: false, msg: 'Your query returns no table. Practice answers are SELECT queries.' }); return }
    const s = sameResult(last, want, t.ordered)
    recordAttempt({ item: taskKey(t), concept, dim: 'implement', correct: s.same, given: sql.slice(0, 500) })
    if (!s.same) logMistake({ concept, prompt: `SQL practice: ${t.task}`, given: sql.slice(0, 300), correct: t.solution, explain: s.why ?? '' })
    setVerdict(s.same ? { ok: true, msg: 'Correct: same rows as the model answer.' } : { ok: false, msg: s.why ?? 'Not the same result.' })
  }
  return (
    <article className="sheet rounded-lg p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2"><span>Task {n}</span>{t.ordered && <span>· order matters</span>}{done && <span className="font-semibold text-sgreen">✓ solved before</span>}</p>
      <h3 className="mt-1 font-bold">{t.task}</h3>
      <div className="mt-3"><SqlEditor initial={'SELECT \nFROM '} label={`Your query for task ${n}`} runLabel="Run and check" rows={4} onRun={grade} /></div>
      {verdict && <p className="mt-2" aria-live="polite"><strong className={verdict.ok ? 'text-sgreen' : 'text-sorange'}>{verdict.ok ? 'Correct.' : 'Not yet.'}</strong> {verdict.ok ? '' : verdict.msg}</p>}
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button className="underline" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>
        <button className="underline" aria-expanded={answer} onClick={() => setAnswer(!answer)}>{answer ? 'Hide the model answer' : 'Show the model answer'}</button>
      </div>
      {hint && <p className="mt-1 text-sm">{t.hint}</p>}
      {answer && <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2"><Code sql={t.solution} label={`Model answer for task ${n}`} /><StoredResult r={want} caption={`Expected result for task ${n}`} /></div>}
    </article>
  )
}
