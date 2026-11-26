import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DICTIONARY } from '../lib/dictionary'
import { Tex } from './ui'
import { SOURCES } from '../content/sources'
export default function EquationSymbols({id}:{id:string}){
  const entries=DICTIONARY.filter(e=>e.concept.id===id&&(e.kind==='notation'||(e.kind==='acronym'&&['USL','LSL','UCL','LCL'].includes(e.label))))
  const [selected,setSelected]=useState('')
  const item=entries.find(e=>e.id===selected)
  if(!entries.length)return <p className="text-sm text-ink-2">Symbol definitions have not been authored for this equation yet. <Link className="underline" to={'/dictionary?concept='+encodeURIComponent(id)}>Explore available terminology</Link>.</p>
  return <div>
    <p className="text-sm text-ink-2">Select a symbol to see its authored meaning. Not every equation has complete symbol coverage yet.</p>
    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Equation symbol selection">{entries.map(e=><button key={e.id} className={'pop-btn '+(selected===e.id?'!border-sblue font-semibold':'')} aria-pressed={selected===e.id} aria-label={'Explain '+e.label+': '+e.meaning} onClick={()=>setSelected(e.id)}>{e.tex?<Tex tex={e.tex}/>:e.label}</button>)}</div>
    {item&&<div className="mt-3 rounded-md border border-line border-l-4 border-l-sblue p-3" aria-live="polite">
      <p className="font-bold">{item.tex?<Tex tex={item.tex}/>:item.label} — {item.meaning}</p>
      {item.unit&&<p className="text-sm">Units: {item.unit}</p>}
      {item.context&&<p className="text-sm">Context: {item.context}</p>}
      {item.note&&<p className="text-sm">{item.note}</p>}
      {item.source&&SOURCES[item.source]&&<a className="block text-sm underline" href={item.source==='nist-handbook'?'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm':SOURCES[item.source].url} target="_blank" rel="noopener noreferrer">Reference: {SOURCES[item.source].publisher}</a>}
      <Link className="mt-2 inline-block underline text-sm" to={'/dictionary?concept='+encodeURIComponent(id)+'&q='+encodeURIComponent(item.label)}>Explore this symbol in the dictionary</Link>
    </div>}
  </div>
}
