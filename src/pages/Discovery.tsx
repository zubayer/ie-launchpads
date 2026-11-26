import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { GUIDE, guidePath, MYSTERIES, PAIRS, type GuideNode } from '../content/discovery'
import { SIM_META } from '../sims/registry'
import { EXTRA_SIM } from '../content/visuals'
import { useStore } from '../lib/store'
import { PageHead } from '../components/ui'
import { ComparisonCard } from '../components/ComparisonCard'
import { termMeaning } from '../content/comparisonTerms'
import { DOMAIN_MAP } from '../content/domains'
import type { Concept } from '../types'
import type { ConceptIndex } from '../content/assemble'

const simOf = (c: ConceptIndex) => SIM_META.find((s) => s.id === (c.sim || EXTRA_SIM[c.id])) || SIM_META.find((s) => s.concepts.includes(c.id))

/* ================= Method Field Guide ================= */
export function FieldGuide() {
  const [params, setParams] = useSearchParams()
  const path = guidePath((params.get('path') || 'root').split(','))
  const node = GUIDE[path[path.length - 1]]
  const go = (p: string[]) => setParams({ path: p.join(',') }, { replace: false })
  // The answer chosen at each step, for the breadcrumb.
  const answers = path.slice(1).map((id, i) => {
    const parent = GUIDE[path[i]] as Extract<GuideNode, { kind: 'q' }>
    return parent.options.find((o) => o.next === id)?.label || id
  })
  return (
    <div>
      <PageHead title="Method field guide" sub="Like a field guide for birds: answer a few questions about your problem and it names the method to use, the data you need and the software people use for it." />
      {answers.length > 0 && (
        <nav aria-label="Your answers" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            <li><button className="pop-btn" onClick={() => go(['root'])}>Start</button></li>
            {answers.map((a, i) => (
              <li key={i} className="flex items-center gap-2"><span aria-hidden className="text-ink-2">→</span>
                <button className="pop-btn !font-normal" onClick={() => go(path.slice(0, i + 2))} aria-current={i === answers.length - 1 ? 'step' : undefined}>{a}</button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {node.kind === 'q' ? (
        <section className="sheet max-w-3xl rounded-lg p-6" aria-live="polite">
          <p className="label">Question {path.length}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{node.q}</h2>
          {node.hint && <p className="mt-1 text-ink-2">{node.hint}</p>}
          <div className="mt-5 grid gap-2">
            {node.options.map((o) => (
              <button key={o.next} onClick={() => go([...path, o.next])} className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-line bg-paper/50 px-4 py-3 text-left text-[1.02rem] hover:border-sblue">
                {o.label}<span aria-hidden className="text-sblue">→</span>
              </button>
            ))}
          </div>
          {path.length > 1 && <button className="btn-ghost btn mt-5" onClick={() => go(path.slice(0, -1))}>← Back</button>}
        </section>
      ) : (
        <section aria-live="polite">
          <p className="label">Your method</p>
          <h2 className="display mt-1 text-3xl">{node.title}</h2>
          {node.note && <p className="mt-2 max-w-3xl border-l-4 border-tape pl-3">{node.note}</p>}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {node.methods.map((m) => {
              const c = CONCEPT_MAP[m.id]; const sim = simOf(c)
              return (
                <article key={m.id} className="sheet rounded-lg p-5">
                  <h3 className="text-xl font-extrabold"><Link to={`/c/${m.id}`} className="hover:text-sblue hover:underline">{c.term}</Link></h3>
                  <p className="mt-1 text-ink-2">{c.one}</p>
                  <dl className="mt-3 grid gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[7rem_1fr]">
                    <dt className="font-semibold">Use it when</dt><dd>{m.when}</dd>
                    <dt className="font-semibold">Data you need</dt><dd>{m.data}</dd>
                    <dt className="font-semibold">Software</dt><dd>{m.software}</dd>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="btn" to={`/c/${m.id}`}>Open the lesson</Link>
                    {sim && <Link className="btn-tape btn" to={`/lab/${sim.id}`}>Try it: {sim.name}</Link>}
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-ghost btn" onClick={() => go(path.slice(0, -1))}>← Back</button>
            <button className="btn-ghost btn" onClick={() => go(['root'])}>Start over</button>
          </div>
        </section>
      )}
    </div>
  )
}

/* ================= Confused pairs ================= */
const shuffle = <T,>(xs: T[], seed: number) => {
  const a = [...xs]; let s = seed || 1
  for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function Pairs() {
  const [params,setParams] = useSearchParams()
  const [search,setSearch] = useState('')
  const [domain,setDomain] = useState('')
  const selected = params.get('concept') || ''
  const domains = Array.from(new Set(PAIRS.flatMap(p=>[CONCEPT_MAP[p.a].domain,CONCEPT_MAP[p.b].domain]))).sort((a,b)=>DOMAIN_MAP[a].name.localeCompare(DOMAIN_MAP[b].name))
  const visible = PAIRS.filter(p=>{
    const concepts=[CONCEPT_MAP[p.a],CONCEPT_MAP[p.b]]
    if(selected && ![p.a,p.b].includes(selected)) return false
    if(domain && !concepts.some(c=>c.domain===domain)) return false
    const words=search.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const hay=[p.diff,...concepts.flatMap(c=>[c.term,termMeaning(c)||'',c.one,...(c.aka||[])])].join(' ').toLowerCase()
    return words.every(w=>hay.includes(w))
  })
  const [mode, setMode] = useState<'study' | 'drill'>('study')
  const [seed, setSeed] = useState(() => Math.floor(Date.now() % 100000) + 1)
  const deck = useMemo(() => shuffle(PAIRS.flatMap((p, pi) => p.quiz.map((q) => ({ ...q, pi }))), seed), [seed])
  const [k, setK] = useState(0)
  const [pick, setPick] = useState<'a' | 'b' | null>(null)
  const [score, setScore] = useState({ right: 0, done: 0 })
  const logMistake = useStore((s) => s.logMistake)
  const card = deck[k]
  const pair = card ? PAIRS[card.pi] : null
  const choose = (x: 'a' | 'b') => {
    if (pick || !pair || !card) return
    setPick(x)
    const ok = x === card.ans
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), done: s.done + 1 }))
    if (!ok) logMistake({ concept: pair[card.ans], prompt: `Which one? ${card.s}`, given: CONCEPT_MAP[pair[x]].term, correct: CONCEPT_MAP[pair[card.ans]].term, explain: pair.diff })
  }
  const next = () => { setPick(null); setK((v) => v + 1) }
  const restart = () => { setSeed((s) => s + 1); setK(0); setPick(null); setScore({ right: 0, done: 0 }) }
  return (
    <div>
      <PageHead title="Confused pairs" sub={`${PAIRS.length} comparisons of engineering ideas. Study the differences, formulas and applications, then practice choosing the right method.`} />
      <p className="mb-3 text-sm"><Link to="/dictionary" className="underline font-semibold">Look up abbreviations and formula symbols</Link></p>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Mode">
        <button className={`pop-btn !py-2 !text-sm ${mode === 'study' ? '!border-sblue !text-sblue' : ''}`} aria-pressed={mode === 'study'} onClick={() => setMode('study')}>Study side by side</button>
        <button className={`pop-btn !py-2 !text-sm ${mode === 'drill' ? '!border-sblue !text-sblue' : ''}`} aria-pressed={mode === 'drill'} onClick={() => setMode('drill')}>Drill: which one? (all pairs)</button>
      </div>
      {mode === 'study' ? (
        <>
          <div className="sheet mb-4 rounded-lg p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Find a comparison<input className="input mt-1 w-full" value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. Cpk, inventory, net present value"/></label>
              <label className="text-sm font-semibold">Engineering domain<select className="input mt-1 w-full" value={domain} onChange={e=>setDomain(e.target.value)}><option value="">All domains</option>{domains.map(d=><option key={d} value={d}>{DOMAIN_MAP[d].name}</option>)}</select></label>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-2" aria-live="polite">{visible.length} of {PAIRS.length} comparisons{selected && CONCEPT_MAP[selected]?' · '+CONCEPT_MAP[selected].term:''}</p>
              {(search||domain||selected)&&<button className="btn-ghost btn" onClick={()=>{setSearch('');setDomain('');setParams({})}}>Clear filters</button>}
            </div>
          </div>
          {!visible.length?<p className="sheet rounded-lg p-5">No matching comparisons. Try another search or clear the filters.</p>:<div className="grid gap-4 xl:grid-cols-2">{visible.map(p=><ComparisonCard key={p.a+'|'+p.b} pair={p}/>)}</div>}
        </>
      ) : card && pair ? (
        <section className="sheet max-w-3xl rounded-lg p-6">
          <p className="flex justify-between text-sm text-ink-2"><span>Scenario {k + 1} of {deck.length}</span><span aria-live="polite">{score.right} of {score.done} right</span></p>
          <h2 className="mt-3 text-xl font-bold leading-snug">{card.s}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(['a', 'b'] as const).map((x) => {
              const c = CONCEPT_MAP[pair[x]]
              const state = !pick ? 'hover:border-sblue' : x === card.ans ? 'border-sgreen bg-sgreen/10' : x === pick ? 'border-sred bg-sred/10' : 'text-ink-2'
              return <button key={x} onClick={() => choose(x)} disabled={!!pick} className={`min-h-14 rounded-lg border-2 border-line px-4 py-3 text-left text-lg font-bold answer ${state}`}>{c.term}</button>
            })}
          </div>
          {pick && (
            <div className="mt-5" aria-live="polite">
              <p><strong className={pick === card.ans ? 'text-sgreen' : 'text-sred'}>{pick === card.ans ? 'Right.' : 'Not this time.'}</strong> {pair.diff}</p>
              {pick !== card.ans && <p className="mt-1 text-sm text-ink-2">Saved to your <Link className="underline" to="/notebook">error notebook</Link>.</p>}
              <button className="btn mt-4" onClick={next}>Next scenario →</button>
            </div>
          )}
        </section>
      ) : (
        <section className="sheet max-w-3xl rounded-lg p-6">
          <h2 className="text-2xl font-extrabold">{score.right} of {score.done} right</h2>
          <p className="mt-2 text-ink-2">{score.right === score.done ? 'Every pair kept apart. Try again tomorrow to make it stick.' : 'Your misses are in the error notebook. Re-read those pairs in study mode, then drill again.'}</p>
          <div className="mt-4 flex gap-2"><button className="btn" onClick={restart}>Drill again</button><Link className="btn-ghost btn" to="/notebook">Error notebook</Link></div>
        </section>
      )}
    </div>
  )
}

/* ================= Factory mysteries ================= */
export function Mysteries() {
  const [params, setParams] = useSearchParams()
  const m = MYSTERIES.find((x) => x.id === params.get('case'))
  if (!m) return (
    <div>
      <PageHead title="Factory mysteries" sub="Short cases written like real plant problems. Read the brief, study the clues as they appear, and make the calls an engineer would. Wrong turns are explained, and saved to your error notebook." />
      <div className="grid gap-4 lg:grid-cols-3">
        {MYSTERIES.map((x) => (
          <article key={x.id} className="sheet flex flex-col rounded-lg p-5">
            <p className="label">{x.area}</p>
            <h2 className="mt-1 text-xl font-extrabold">{x.title}</h2>
            <p className="mt-2 flex-1">{x.brief}</p>
            <p className="mt-3 text-sm text-ink-2">You are the {x.role.charAt(0).toLowerCase() + x.role.slice(1)} · {x.questions.length} decisions</p>
            <button className="btn mt-4 self-start" onClick={() => setParams({ case: x.id })}>Take the case</button>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-2">The cases and their data are illustrative, written for practice.</p>
    </div>
  )
  return <Case key={m.id} m={m} back={() => setParams({})} />
}

function Case({ m, back }: { m: (typeof MYSTERIES)[number]; back: () => void }) {
  const [step, setStep] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const logMistake = useStore((s) => s.logMistake)
  const recordAttempt = useStore((s) => s.recordAttempt)
  const done = step >= m.questions.length
  const q = m.questions[Math.min(step, m.questions.length - 1)]
  // Clues unlock as the case moves on: everything up to the current question's clue.
  const shown = Math.max(0, ...m.questions.slice(0, Math.min(step + 1, m.questions.length)).map((x) => (x.clue ?? -1) + 1))
  const choose = (i: number) => {
    if (pick !== null) return
    setPick(i)
    if (i === q.answer) setRight((r) => r + 1)
    else logMistake({ concept: m.methods[0], prompt: `${m.title}: ${q.q}`, given: q.options[i], correct: q.options[q.answer], explain: q.why })
  }
  return (
    <div>
      <button className="btn-ghost btn mb-4" onClick={back}>← All cases</button>
      <PageHead title={m.title} sub={m.brief}><p className="mt-2 text-sm text-ink-2">Your role: {m.role}</p></PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-label="Clues" className="space-y-4">
          {m.clues.slice(0, done ? m.clues.length : shown).map((c) => (
            <div key={c.title} className="sheet flip-in rounded-lg p-4">
              <p className="label mb-2">Clue: {c.title}</p>
              <table className="w-full text-sm tabular-nums">
                <thead><tr className="text-left text-xs text-ink-2">{c.cols.map((h, i) => <th key={h} scope="col" className={`pb-1 ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                <tbody>{c.rows.map((r) => <tr key={String(r[0])} className="border-t border-line">{r.map((v, i) => <td key={i} className={`py-1.5 ${i ? 'text-right' : 'font-medium'}`}>{v}</td>)}</tr>)}</tbody>
              </table>
              {c.note && <p className="mt-2 border-l-4 border-tape pl-3 text-sm">{c.note}</p>}
            </div>
          ))}
          {!done && shown < m.clues.length && <p className="text-sm text-ink-2">More clues appear as you make decisions.</p>}
        </section>
        <section className="sheet rounded-lg p-5" aria-live="polite">
          {!done ? (
            <>
              <p className="text-sm text-ink-2">Decision {step + 1} of {m.questions.length}</p>
              <h2 className="mt-1 text-xl font-bold">{q.q}</h2>
              <div className="mt-4 grid gap-2">
                {q.options.map((o, i) => {
                  const st = pick === null ? 'hover:border-sblue' : i === q.answer ? 'border-sgreen bg-sgreen/10 font-semibold' : i === pick ? 'border-sred bg-sred/10' : 'text-ink-2'
                  return <button key={o} onClick={() => choose(i)} disabled={pick !== null} className={`rounded-md border border-line px-4 py-3 text-left answer ${st}`}>{o}</button>
                })}
              </div>
              {pick !== null && (
                <div className="mt-4">
                  <p><strong className={pick === q.answer ? 'text-sgreen' : 'text-sorange'}>{pick === q.answer ? 'Good call.' : 'Not the best move.'}</strong> {q.why}</p>
                  <button className="btn mt-4" onClick={() => {
                    if (step === m.questions.length - 1) recordAttempt({ item: `case:${m.id}`, concept: m.concept, dim: 'apply', correct: right >= m.questions.length - 1, given: `${right} of ${m.questions.length} best calls` })
                    setPick(null); setStep((s) => s + 1)
                  }}>{step === m.questions.length - 1 ? 'See the solution' : 'Next decision →'}</button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="label">Case closed · {right} of {m.questions.length} best calls</p>
              <h2 className="mt-1 text-xl font-bold">What happened</h2>
              <p className="mt-2">{m.solution}</p>
              <p className="label mt-4 mb-2">Methods you used</p>
              <div className="flex flex-wrap gap-2">{m.methods.map((id) => <Link key={id} to={`/c/${id}`} className="chip hover:border-ink">{CONCEPT_MAP[id].term}</Link>)}</div>
              <div className="mt-5 flex gap-2"><button className="btn" onClick={() => { setStep(0); setPick(null); setRight(0) }}>Replay</button><button className="btn-ghost btn" onClick={back}>Next case</button></div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
