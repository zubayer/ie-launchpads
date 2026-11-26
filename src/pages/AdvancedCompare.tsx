import { lazy, Suspense, useMemo, useState } from 'react'
import { Link,useSearchParams } from 'react-router-dom'
import { CONCEPTS,CONCEPT_MAP } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import { FAMILIES } from '../content/comparisonFamilies'
import { PAIRS } from '../content/discovery'
import { termMeaning } from '../content/comparisonTerms'
import { PageHead,Rich,Tex } from '../components/ui'
import type { Concept } from '../types'

const Labs=lazy(()=>import('../components/ComparisonLabs'))
const colors=['#2563eb','#0d9488','#b45309','#7c3aed']
const FOCUS=['Overview','Equations','Applications','Interview'] as const
type Focus=typeof FOCUS[number]
function Fields({c,focus}:{c:Concept;focus:Focus}){
  if(focus==='Equations')return <>
    {c.formula?<><Tex tex={c.formula.tex} block/>{!!c.formula.vars?.length&&<ul className="mt-2 space-y-1 text-sm">{c.formula.vars.map(([v,m],i)=><li key={i}><Tex tex={v}/> — {m}</li>)}</ul>}</>:<p className="text-sm text-ink-2">No equation is authored for this topic.</p>}
    <Link className="mt-2 block text-sm underline" to={'/dictionary?concept='+encodeURIComponent(c.id)+'&kind=notation'}>Symbol definitions</Link>
    {!!c.assumptions?.length&&<><p className="label mt-3">Assumptions and limits</p><ul className="list-disc pl-4 text-sm">{c.assumptions.map((a,i)=><li key={i}><Rich text={a}/></li>)}</ul></>}
  </>
  if(focus==='Applications')return <>
    {c.real?<><p className="label">{c.real.kind==='documented'?'Documented case':'Illustrative scenario'} · {c.real.where}</p><p className="mt-1 text-sm"><Rich text={c.real.story}/></p></>:<p className="text-sm text-ink-2">No application case is authored yet.</p>}
    {!!c.used?.roles?.length&&<p className="mt-2 text-sm"><strong>Roles:</strong> {c.used.roles.join(', ')}</p>}
    {!!c.used?.tools?.length&&<p className="mt-2 text-sm"><strong>Tools:</strong> {c.used.tools.join(', ')}</p>}
    {!!c.mistakes?.length&&<><p className="label mt-3">Common mistakes</p><ul className="list-disc pl-4 text-sm">{c.mistakes.map((a,i)=><li key={i}><Rich text={a}/></li>)}</ul></>}
  </>
  if(focus==='Interview')return <>
    {!c.iq?.length&&<p className="text-sm text-ink-2">No interview questions authored yet.</p>}
    {c.iq?.map((q,i)=><details className="mb-2 rounded border border-line p-2" key={i}><summary className="cursor-pointer text-sm font-semibold">{q.q}</summary><p className="mt-2 text-xs text-ink-2">{q.origin==='reported'?'Reported question; see lesson source':'Original practice question'}</p>{q.hint&&<p className="mt-2 text-sm"><strong>Hint:</strong> {q.hint}</p>}<p className="mt-2 text-sm"><Rich text={q.a}/></p>{!!q.followUps?.length&&<p className="mt-2 text-sm"><strong>Follow-up:</strong> {q.followUps.join(' · ')}</p>}</details>)}
  </>
  return <><p className="text-sm"><Rich text={c.one}/></p><details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Full definition</summary><p className="mt-2 text-sm"><Rich text={c.def}/></p></details>{c.analogy&&<div className="mt-3 border-t border-line pt-2"><p className="label">Mental model</p><p className="mt-1 text-sm"><Rich text={c.analogy}/></p></div>}{c.why&&<div className="mt-3"><p className="label">Why it matters</p><p className="mt-1 text-sm"><Rich text={c.why}/></p></div>}</>
}
export function AdvancedCompare(){
  const [params,setParams]=useSearchParams()
  const raw=params.get('concepts')
  const ids=useMemo(()=>[...new Set((raw===null?FAMILIES[0].concepts:raw.split(',')).filter(id=>!!CONCEPT_MAP[id]))].slice(0,4),[raw])
  const [q,setQ]=useState(''),[candidate,setCandidate]=useState(''),[focus,setFocus]=useState<Focus>('Overview')
  const setIds=(next:string[])=>setParams({concepts:next.join(',')})
  const family=FAMILIES.find(f=>f.concepts.length===ids.length&&f.concepts.every(id=>ids.includes(id)))
  const concepts=ids.map(id=>CONCEPT_MAP[id])
  const options=useMemo(()=>{const words=q.trim().toLowerCase().split(/\s+/).filter(Boolean);return CONCEPTS.filter(c=>!ids.includes(c.id)&&words.every(w=>[c.term,c.full,termMeaning(c),c.domain,...(c.aka||[])].filter(Boolean).join(' ').toLowerCase().includes(w))).sort((a,b)=>a.term.localeCompare(b.term))},[q,ids])
  const pairs=PAIRS.filter(p=>ids.includes(p.a)&&ids.includes(p.b))
  return <div>
    <PageHead title="Advanced comparison studio" sub="Compare up to four concepts from the curriculum, study their differences and run a shared experiment for supported families."/>
    <p className="mb-4 text-sm"><Link className="underline" to="/pairs">Original confused pairs & drill</Link> · <Link className="underline" to="/dictionary">Engineering dictionary</Link></p>
    <section className="sheet rounded-lg p-4 mb-4" aria-label="Comparison builder">
      <p className="label">Curated comparison families</p><div className="mt-2 flex flex-wrap gap-2">{FAMILIES.map(f=><button className={'pop-btn '+(family?.id===f.id?'!border-sblue font-semibold':'')} key={f.id} aria-pressed={family?.id===f.id} onClick={()=>{setIds(f.concepts);setCandidate('');setQ('');setFocus('Overview')}}>{f.title}</button>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Find a topic<input className="input mt-1 w-full" value={q} onChange={e=>{setQ(e.target.value);setCandidate('')}} placeholder="Name, abbreviation or domain"/></label>
        <label className="text-sm font-semibold">Choose concept<select className="input mt-1 w-full" value={candidate} onChange={e=>setCandidate(e.target.value)}><option value="">Select a topic ({options.length})</option>{options.map(c=><option key={c.id} value={c.id}>{c.term} · {DOMAIN_MAP[c.domain].short}</option>)}</select></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><button className="btn" disabled={!candidate||ids.length>=4||!options.some(c=>c.id===candidate)} onClick={()=>{setIds([...ids,candidate]);setCandidate('');setQ('')}}>Add concept</button><button className="btn-ghost btn" onClick={()=>{setIds([]);setQ('');setCandidate('')}}>Clear comparison</button><p className="text-sm text-ink-2" aria-live="polite">{ids.length}/4 concepts selected</p></div>
      <div className="mt-3 flex flex-wrap gap-2">{concepts.map(c=><button className="pop-btn" key={c.id} onClick={()=>setIds(ids.filter(id=>id!==c.id))} aria-label={'Remove '+c.term}>{c.term} ×</button>)}</div>
      <p className="mt-2 text-xs text-ink-2">The current URL stores the selection; copy it to share or bookmark your comparison.</p>
    </section>
    {ids.length<2?<p className="sheet rounded-lg p-4">Choose at least two concepts to compare. You can also start with a curated family.</p>:<>
      <div role="group" aria-label="Comparison focus" className="mb-3 flex flex-wrap gap-2">{FOCUS.map(f=><button className={'pop-btn '+(focus===f?'!border-sblue font-semibold':'')} key={f} aria-pressed={focus===f} onClick={()=>setFocus(f)}>{f}</button>)}</div>
      <div className={'grid gap-3 sm:grid-cols-2 '+(ids.length===3?'xl:grid-cols-3':ids.length===4?'2xl:grid-cols-4':'')}>{concepts.map((c,i)=><article className="sheet min-w-0 rounded-lg border border-line border-t-4 p-4" style={{borderTopColor:colors[i]}} key={c.id}><p className="label">Concept {i+1} · {DOMAIN_MAP[c.domain].short}</p><h2 className="mt-1 text-xl font-bold break-words">{c.term}</h2>{termMeaning(c)&&<p className="mt-1 text-sm font-medium">{termMeaning(c)}</p>}<div className="mt-3 border-t border-line pt-3"><Fields c={c} focus={focus}/></div><Link className="mt-3 block text-sm font-semibold underline" to={'/c/'+c.id}>Open full lesson</Link></article>)}</div>
      {family&&<section className="sheet mt-4 rounded-lg border border-line border-l-4 border-l-sgreen p-4"><h2 className="text-lg font-bold">Key differences · {family.title}</h2><p className="mt-2">{family.insight}</p><p className="mt-2 text-sm"><strong>When to use what:</strong> {family.decision}</p><details className="mt-3 rounded border border-line p-3"><summary className="cursor-pointer font-semibold">Interview challenge</summary><p className="mt-2 text-sm">{family.question}</p><details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">Reveal professional answer</summary><p className="mt-2 text-sm">{family.answer}</p></details></details></section>}
      {!!pairs.length&&<section className="sheet mt-4 rounded-lg p-4"><h2 className="font-bold text-lg">Authored pairwise distinctions</h2>{pairs.map(p=><div key={p.a+'|'+p.b} className="mt-3 border-t border-line pt-3"><p className="font-semibold">{CONCEPT_MAP[p.a].term} vs. {CONCEPT_MAP[p.b].term}</p><p className="mt-1 text-sm">{p.diff}</p></div>)}</section>}
      {!family&&!pairs.length&&<p className="mt-4 text-sm text-ink-2">These topics do not have an authored relationship yet. Compare their existing lesson content above; no new distinction is inferred automatically.</p>}
      {family?.lab&&<section className="sheet mt-4 rounded-lg p-4"><h2 className="text-lg font-bold mb-3">Shared interactive laboratory</h2><Suspense fallback={<p role="status">Loading experiment…</p>}><Labs key={family.lab} kind={family.lab}/></Suspense></section>}
      <p className="mt-4 text-xs text-ink-2">Comparison uses the existing curriculum and authored family contrasts. All scenarios are educational practice unless labeled documented or reported. No mastery credit for reading a comparison.</p>
    </>}
  </div>
}
