import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { SOURCES } from '../content/sources'
import { DICTIONARY, dictionarySearch, type DictionaryEntry } from '../lib/dictionary'
import type { TermKind } from '../content/dictionaryTerms'
import { PageHead, Tex, Rich } from '../components/ui'

const kinds: {id:TermKind|'all'; name:string}[]=[{id:'all',name:'All entries'},{id:'acronym',name:'Abbreviations'},{id:'notation',name:'Math notation'},{id:'term',name:'Engineering terms'}]
const kindName={acronym:'Abbreviation',notation:'Mathematical notation',term:'Engineering term'}
const originName={authored:'Curated terminology',lesson:'Existing lesson',equation:'Equation Explorer'}
const PAGE_SIZE=36

function Entry({ e }: {e:DictionaryEntry}) {
  const source=e.source?SOURCES[e.source]:undefined
  return <article className="sheet min-w-0 rounded-lg border border-line p-4 border-t-4" style={{borderTopColor:DOMAIN_MAP[e.concept.domain].tape}}>
    <p className="text-xs font-semibold text-ink-2">{kindName[e.kind]} · {DOMAIN_MAP[e.concept.domain].short}</p>
    <h2 className="mt-2 text-xl font-extrabold break-words">{e.tex?<Tex tex={e.tex}/>:e.label}</h2>
    <p className="mt-2 text-sm font-medium break-words"><Rich text={e.meaning}/></p>
    {e.note&&<p className="mt-2 text-sm text-ink-2">{e.note}</p>}
    {e.unit&&<p className="mt-2 text-sm"><strong>Units:</strong> {e.unit}</p>}
    {e.context&&<p className="mt-1 text-xs text-ink-2">Context: {e.context}</p>}
    <p className="mt-3 text-xs text-ink-2">{originName[e.origin]}{source?' · Reference available':' · Individual source review pending'}</p>
    {source&&<a className="mt-1 inline-block text-sm underline" href={e.source==='nist-handbook'?'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm':source.url} target="_blank" rel="noopener noreferrer">Reference: {source.publisher}</a>}
    <div className="mt-3 border-t border-line pt-2"><Link className="text-sm font-semibold underline" to={'/c/'+e.concept.id}>Lesson: {e.concept.term}</Link></div>
  </article>
}
export function Dictionary() {
  const [params,setParams]=useSearchParams()
  const q=params.get('q')||'', domain=params.get('domain')||'', concept=params.get('concept')||''
  const requested=params.get('kind'),kind=kinds.some(k=>k.id===requested)?requested as TermKind|'all':'all'
  const [more,setMore]=useState({key:'',count:PAGE_SIZE})
  const key=params.toString()
  const count=more.key===key?more.count:PAGE_SIZE
  const results=useMemo(()=>dictionarySearch(DICTIONARY,q,kind,domain,concept),[q,kind,domain,concept])
  const set=(name:string,value:string)=>setParams(old=>{const next=new URLSearchParams(old);if(value)next.set(name,value);else next.delete(name);return next},{replace:true})
  return <div>
    <PageHead title="Engineering abbreviation dictionary" sub="Understand the full name, symbol, units and engineering context — then open the lesson. The dictionary indexes every curriculum topic and does not invent expansions for symbols."/>
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div className="sheet rounded-md p-3"><p className="label">Topics indexed</p><p className="text-2xl font-bold">{CONCEPTS.length}</p></div>
      <div className="sheet rounded-md p-3"><p className="label">Dictionary entries</p><p className="text-2xl font-bold">{DICTIONARY.length}</p></div>
      <div className="sheet rounded-md p-3"><p className="label">Domains</p><p className="text-2xl font-bold">{DOMAINS.length}</p></div>
    </div>
    <section className="sheet rounded-lg p-4 mb-4" aria-label="Dictionary filters">
      <label className="block font-semibold text-sm">Search abbreviation, symbol or meaning<input className="input w-full mt-1" value={q} onChange={e=>set('q',e.target.value)} placeholder="Try Cpk, PV, RCA, sigma or PLC"/></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Entry type<select className="input w-full mt-1" value={kind} onChange={e=>set('kind',e.target.value==='all'?'':e.target.value)}>{kinds.map(k=><option value={k.id} key={k.id}>{k.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Engineering domain<select className="input w-full mt-1" value={domain} onChange={e=>set('domain',e.target.value)}><option value="">All domains</option>{DOMAINS.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><span className="text-sm text-ink-2">Try an ambiguous term:</span>{['PV','RCA','OR','PM','σ'].map(x=><button className="pop-btn" key={x} onClick={()=>setParams({q:x})}>{x}</button>)}</div>
      {concept&&<p className="mt-2 text-sm">Topic filter: {CONCEPT_MAP[concept]?.term||'Unknown topic'}</p>}
      <div className="mt-3 flex flex-wrap gap-2 items-center justify-between"><p className="text-sm text-ink-2" aria-live="polite">{results.length} matching entries</p><button className="btn-ghost btn" onClick={()=>setParams({})}>Clear filters</button></div>
    </section>
    <p className="mb-4 text-sm text-ink-2">The same letters can mean different things across disciplines. Formula symbols are tied to the lesson or equation in which they occur. Existing lesson metadata and authored entries are identified separately; reference coverage is still expanding.</p>
    {results.length===0?<p className="sheet p-5 rounded-lg">No matching entries. Try a different term or clear filters.</p>:<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.slice(0,count).map(e=><Entry key={e.id} e={e}/>)}</div>}
    {results.length>count&&<button className="btn mt-4" onClick={()=>setMore({key,count:count+PAGE_SIZE})}>Show {Math.min(PAGE_SIZE,results.length-count)} more entries</button>}
    <p className="mt-5 text-sm"><Link to="/pairs" className="underline">Compare related engineering concepts</Link> · <Link to="/formulas" className="underline">Explore equations</Link></p>
  </div>
}
