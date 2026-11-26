import { CONCEPTS, CONCEPT_MAP } from '../content'
import { CURATED, metadataTerm, type TermDetail } from '../content/dictionaryTerms'
export type ContextTerm = TermDetail & { conceptId: string }
const entries = new Map<string, ContextTerm[]>()
const eligible = (s:string) => /^(?:[A-Z][A-Z0-9&/.-]{1,15}|Cpk|Cp|Ppk|Pp|PdM|IIoT|M\/M\/c)$/.test(s)
for (const c of CONCEPTS) {
  const data=[...(CURATED[c.id]||[])]
  const m=metadataTerm(c)
  if(m?.kind==='acronym'&&!data.some(d=>d.label===m.label))data.push(m)
  for(const d of data) if(eligible(d.label)){
    const list=entries.get(d.label)||[]
    if(!list.some(x=>x.conceptId===c.id&&x.meaning===d.meaning))list.push({...d,conceptId:c.id})
    entries.set(d.label,list)
  }
}
const escaped=[...entries.keys()].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^{}$()|[\]\\]/g,'\\$&')).join('|')
const pattern=new RegExp('(?<![A-Za-z0-9])('+escaped+')(?![A-Za-z0-9])','g')
export function inlineHits(text:string){
  return Array.from(text.matchAll(pattern),m=>({start:m.index!,end:m.index!+m[0].length,label:m[0]}))
}
export function resolveInline(label:string,self?:string){
  const all=entries.get(label)||[]
  const local=all.filter(e=>e.conceptId===self)
  const domain=self?CONCEPT_MAP[self]?.domain:undefined
  const sameDomain=domain?all.filter(e=>CONCEPT_MAP[e.conceptId]?.domain===domain):[]
  const ordered=[...local,...sameDomain,...all]
  const seen=new Set<string>()
  return ordered.filter(e=>{
    const key=e.meaning.toLowerCase()
    if(seen.has(key))return false
    seen.add(key);return true
  })
}
