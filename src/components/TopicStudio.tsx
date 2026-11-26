import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Concept } from '../types'
import { LEVEL_NAME } from '../types'
import { CONCEPT_MAP } from '../content'
import { PILOTS, LENSES, DISCOVERY, studioCitations, type Lens } from '../content/topicStudio'
import { SOURCES, TIER_LABEL } from '../content/sources'
import { EQUATION_FOR_CONCEPT } from '../content/equationIndex'
import { useStore } from '../lib/store'
import { crossrefDiscovery, type DiscoveryResult } from '../lib/topicDiscovery'

const Lab = lazy(() => import('./TopicPilotLab'))
const STAGES = ['Discover','Visualize','Understand','Experiment','Apply','Master','Explore sources'] as const
type Stage = typeof STAGES[number]

function ResearchDiscovery({ query }: { query: string }) {
  const [result,setResult]=useState<DiscoveryResult | null>(null)
  const [error,setError]=useState(false),[busy,setBusy]=useState(false)
  const request=useRef<AbortController | null>(null)
  useEffect(()=>()=>request.current?.abort(),[])
  async function load() {
    if (request.current) return
    const ctl=new AbortController()
    request.current=ctl;setBusy(true);setError(false)
    try { const r=await crossrefDiscovery(query,ctl.signal); if (!ctl.signal.aborted) setResult(r) }
    catch { if (!ctl.signal.aborted) setError(true) }
    finally { if (!ctl.signal.aborted) setBusy(false); if (request.current===ctl) request.current=null }
  }
  return <div className="mt-3 rounded-md border border-line p-3">
    <p className="font-semibold">Research metadata · Crossref</p>
    <p className="text-sm text-ink-2">Optional external request sends only the public topic title. Results are research leads, not verified lesson citations or proof of open access.</p>
    <button className="btn-ghost btn mt-2" disabled={busy} onClick={()=>void load()}>{busy?'Searching…':result?'Refresh research results':'Find relevant research'}</button>
    {error && <p role="status" className="mt-2 text-sm">Research service unavailable. Built-in sources remain available. Try again later.</p>}
    {result && <div className="mt-2" aria-live="polite"><p className="text-xs text-ink-2">{result.cached?'Cached':'Retrieved'} {new Date(result.at).toLocaleString()}</p>
      {result.hits.length===0?<p className="text-sm">No matching metadata returned.</p>:<ul className="mt-2 space-y-2">{result.hits.map(h=><li key={h.doi}><a className="text-sm font-semibold text-sblue underline break-words" href={'https://doi.org/'+h.doi.split('/').map(encodeURIComponent).join('/')} target="_blank" rel="noopener noreferrer">{h.title} ↗</a><p className="text-xs text-ink-2">{h.publisher} · DOI {h.doi}</p></li>)}</ul>}
    </div>}
  </div>
}
export default function TopicStudio({ c, layers, hasVisual, onFull }: { c: Concept; layers: string[]; hasVisual: boolean; onFull: () => void }) {
  const [stage,setStage]=useState<Stage>('Discover'), [lens,setLens]=useState<Lens>('beginner')
  const [choice,setChoice]=useState<number | null>(null), [submitted,setSubmitted]=useState(false)
  const [confidence,setConfidence]=useState<1|2|3>(2)
  const record=useStore(s=>s.recordAttempt), logMistake=useStore(s=>s.logMistake)
  const pilot=PILOTS[c.id]
  const cites=studioCitations(c)
  const [provider,providerUrl]=DISCOVERY[c.domain]
  const can=(id:string)=>layers.includes(id)
  const go=(id:string,label:string)=>can(id)?<button className="btn-ghost btn" onClick={()=>document.getElementById(id)?.scrollIntoView({block:'start'})}>{label}</button>:null
  const tutor=(request:string)=>'https://chatgpt.com/?q='+encodeURIComponent('Teach '+c.term+' in industrial engineering. '+request+' Distinguish assumptions, cite reliable sources and do not invent references.')
  const check=pilot?.practice
  const submit=()=>{
    if (!check || choice===null || submitted) return
    const correct=choice===check.answer
    record({item:'studio:'+c.id+':concept-check-v1',concept:c.id,dim:'explain',correct,given:check.options[choice],confidence})
    if(!correct) logMistake({concept:c.id,prompt:check.question,given:check.options[choice],correct:check.options[check.answer],explain:check.why})
    setSubmitted(true)
  }
  return <section aria-label="Topic Intelligence Studio" className="mt-5 overflow-hidden rounded-xl border border-line bg-paper/60">
    <header className="border-b border-line p-3 sm:p-5">
      <p className="label text-sblue">Topic Intelligence Studio · {LEVEL_NAME[c.level]}</p>
      <h2 className="wide mt-1 text-xl sm:text-2xl">{pilot?.question || 'Understand '+c.term+' at a glance'}</h2>
      <p className="measure mt-2 text-base">{c.one}</p>
      <p className="mt-2 text-xs text-ink-2">Start with the 30-second overview; choose a stage when you want to explore further. {pilot?'Enhanced pilot lesson.':'Uses available lesson content; missing details are not generated.'}</p>
    </header>
    <nav aria-label="Studio learning stages" className="flex flex-wrap gap-1 border-b border-line p-2">{STAGES.map(s=><button key={s} type="button" aria-pressed={stage===s} className={'rounded-md px-3 py-2 text-sm font-medium '+(stage===s?'border border-sblue bg-sheet text-ink font-semibold':'border border-transparent hover:bg-sheet')} onClick={()=>setStage(s)}>{s}</button>)}</nav>
    <div className="space-y-3 p-3 sm:p-5">
      {stage==='Discover' && <>
        {(pilot?.mental || c.analogy) && <div className="rounded-md border-l-4 border-sblue bg-sheet p-3"><p className="label">Mental model</p><p className="mt-1">{pilot?.mental || c.analogy}</p></div>}
        {pilot && <div className="grid gap-2 sm:grid-cols-2">{[['Inputs',pilot.inputs],['Outputs',pilot.outputs]].map(([name,v])=><div key={name} className="rounded-md border border-line p-3"><p className="label">{name}</p><p className="mt-1 text-sm">{v}</p></div>)}</div>}
        {!!c.objectives?.length && <div><p className="label">Learning objectives</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{c.objectives.map(o=><li key={o}>{o}</li>)}</ul></div>}
        {c.why && <p className="text-sm"><strong>Why it matters: </strong>{c.why}</p>}
        {!!c.pre?.length && <div><p className="label">Learn first</p><div className="mt-1 flex flex-wrap gap-1">{c.pre.map(id=>CONCEPT_MAP[id]&&<Link key={id} className="chip hover:underline" to={'/c/'+id}>{CONCEPT_MAP[id].term}</Link>)}</div></div>}
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>setStage('Visualize')}>See the mental model</button><button className="btn-ghost btn" onClick={()=>setStage('Understand')}>Choose explanation level</button></div>
      </>}
      {stage==='Visualize' && <>
        {(pilot?.mental || c.analogy) && <p>{pilot?.mental || c.analogy}</p>}
        {pilot && <><p className="label">Original interactive diagram</p><Suspense fallback={<p role="status">Loading the diagram…</p>}><Lab kind={pilot.kind}/></Suspense><p className="text-xs text-ink-2">{pilot.limit}</p></>}
        {!pilot && <p className="text-sm">{hasVisual?'Open the existing diagram or simulation to explore the concept.':'No dedicated visual has been authored for this topic yet. Explore the related concepts or the existing explanation.'}</p>}
        <div className="flex flex-wrap gap-2">{go('picture','Existing visual atlas')}{go('sim','Existing simulator')}{go('algo','Existing algorithm')}</div>
      </>}
      {stage==='Understand' && <>
        <label className="block text-sm font-medium">Explanation level<select className="input mt-1" value={lens} onChange={e=>setLens(e.target.value as Lens)}>{LENSES.map(l=><option value={l.id} key={l.id}>{l.label}</option>)}</select></label>
        <p className="measure">{pilot?pilot.explanations[lens]:lens==='beginner'?c.analogy||c.one:lens==='engineer'?c.why||c.def:lens==='interview'?c.iq?.[0]?.a||c.def:c.def}</p>
        {!pilot && <p className="text-xs text-ink-2">This topic uses its existing explanation; a separate authored explanation for each lens is not yet available.</p>}
        {pilot?.compare && <p className="rounded-md border border-line p-3 text-sm"><strong>Compare: </strong>{pilot.compare}</p>}
        {!!c.confused?.length && <ul className="list-disc pl-5 text-sm">{c.confused.map(([n,desc])=><li key={n}><strong>{n}:</strong> {desc}</li>)}</ul>}
        {pilot?.limit && <p className="text-sm"><strong>Limits: </strong>{pilot.limit}</p>}
        {!!c.assumptions?.length && <ul className="list-disc pl-5 text-sm">{c.assumptions.map(a=><li key={a}>{a}</li>)}</ul>}
        <div className="flex flex-wrap gap-2">{go('math','Equation anatomy')}{go('example','Worked solution')}{go('algo','Algorithm')}</div>
      </>}
      {stage==='Experiment' && <>
        {pilot ? <><p className="text-sm">Predict the outcome before changing the inputs. Compare the result with your prediction.</p><Suspense fallback={<p role="status">Loading the laboratory…</p>}><Lab kind={pilot.kind}/></Suspense><p className="text-xs text-ink-2">{pilot.limit}</p></>:<p className="text-sm">Use an existing worked example, equation or lab where available. A dedicated experiment will only appear when a real model has been implemented.</p>}
        <div className="flex flex-wrap gap-2">{go('sim','Open lesson simulator')}{go('example','Work through example')}{EQUATION_FOR_CONCEPT[c.id]&&<Link className="btn-ghost btn" to="/formulas">Equation Explorer</Link>}</div>
      </>}
      {stage==='Apply' && <>
        {pilot && <div className="rounded-md border border-line bg-sheet p-3"><p className="label">Illustrative engineering scenario</p><p className="mt-2">{pilot.example}</p></div>}
        {c.real && <div><p className="label">{c.real.kind==='documented'?'Documented application':'Illustrative application'} · {c.real.where}</p><p className="mt-1">{c.real.story}</p></div>}
        {!!c.used?.roles?.length && <p className="text-sm"><strong>Roles: </strong>{c.used.roles.join(', ')}</p>}
        {!!c.used?.tools?.length && <p className="text-sm"><strong>Tools: </strong>{c.used.tools.join(', ')}</p>}
        {!!c.mistakes?.length && <div><p className="label">Avoid these mistakes</p><ul className="list-disc pl-5 text-sm">{c.mistakes.map(m=><li key={m}>{m}</li>)}</ul></div>}
        {!pilot && !c.real && !c.used && <p className="text-sm">No application case has been authored yet. The related job and interview sections may offer starting points.</p>}
        <div className="flex flex-wrap gap-2">{go('real','On the job')}{go('jobs','Career relevance')}{go('interview','Interview practice')}</div>
      </>}
      {stage==='Master' && <>
        {check ? <div className="space-y-2">
          <fieldset><legend className="font-semibold">{check.question}</legend>{check.options.map((o,i)=><label key={o} className="mt-2 flex items-center gap-2 rounded-md border border-line p-2"><input type="radio" name={'studio-check-'+c.id} checked={choice===i} disabled={submitted} onChange={()=>setChoice(i)}/>{o}</label>)}</fieldset>
          <label className="block text-sm">Confidence<select className="input mt-1" disabled={submitted} value={confidence} onChange={e=>setConfidence(Number(e.target.value) as 1|2|3)}><option value={1}>Guessing</option><option value={2}>Unsure</option><option value={3}>Sure</option></select></label>
          {!submitted?<button className="btn" disabled={choice===null} onClick={submit}>Check my answer</button>:<div aria-live="polite"><p className="font-semibold">{choice===check.answer?'Correct.':'Not quite.'} {check.why}</p><p className="mt-1 text-xs text-ink-2">Answer recorded as explanation evidence, not proof of mastery.</p><button className="btn-ghost btn mt-2" onClick={()=>{setChoice(null);setSubmitted(false)}}>Try again</button></div>}
        </div>:<p className="text-sm">Use the existing check-yourself section to demonstrate knowledge. Opening a topic does not establish mastery.</p>}
        <div className="flex flex-wrap gap-2">{go('try','More practice')}{go('interview','Interview check')}{go('teach','Teach it back')}</div>
        <p className="text-sm"><strong>Teach back:</strong> Explain what this concept solves, its inputs, how you would use it, and one limitation without looking at the lesson. Use the existing Teach it back section to save your explanation.</p>
      </>}
      {stage==='Explore sources' && <>
        <p className="text-sm text-ink-2">Original reference previews. A source link is not a named human expert review.</p>
        {cites.map((ct,i)=>{const src=SOURCES[ct.src];if(!src)return null;return <article key={i} className="rounded-md border border-line bg-sheet p-3"><a className="font-semibold text-sblue underline" href={ct.url||src.url} target="_blank" rel="noopener noreferrer">{ct.section||src.title} ↗</a><p className="mt-1 text-sm">{src.publisher} · {src.kind} · {TIER_LABEL[src.tier]}</p><p className="mt-1 text-sm">{ct.supports}</p><p className="mt-2 text-xs text-ink-2">Access: {src.access} · Registry checked: {src.checkedOn}{src.year?' · '+src.year:''}{src.license?' · '+src.license:' · Reuse license not recorded'}</p></article>})}
        {!cites.length && <p className="text-sm">No topic-specific citation is available yet. Use the discovery destination below; it is not a citation for this lesson.</p>}
        <a className="btn-ghost btn" href={providerUrl} target="_blank" rel="noopener noreferrer">Explore {provider} ↗</a>
        <ResearchDiscovery key={c.id} query={c.full&&c.full!==c.term?c.full:c.term}/>
        {go('live','Existing live-web sources')}
        <details><summary className="cursor-pointer font-medium">Optional external tutor</summary><p className="mt-2 text-sm text-ink-2">Opens a new website with only the public topic and selected instruction; its answers are not verified by IE Launchpad.</p><div className="mt-2 flex flex-wrap gap-2">{['Explain from absolute zero','Give a practical analogy','Explain the math step by step','Test my understanding','Prepare an interview question'].map(r=><a key={r} className="pop-btn" href={tutor(r)} target="_blank" rel="noopener noreferrer">{r} ↗</a>)}</div></details>
      </>}
      {!layers.includes('math') && stage==='Understand' && <button className="btn-ghost btn" onClick={onFull}>Show the full lesson mode</button>}
      <p className="border-t border-line pt-2 text-xs text-ink-2">Studio supplements the existing lesson sections below. Experiments are educational models; verify assumptions and sources before professional use.</p>
    </div>
  </section>
}
