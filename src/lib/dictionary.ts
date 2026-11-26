import { CONCEPTS } from '../content'
import { CURATED, metadataTerm, type TermKind } from '../content/dictionaryTerms'
import { EQUATIONS } from '../content/equations'
import type { Concept } from '../types'

export interface DictionaryEntry {
  id: string; concept: Concept; label: string; meaning: string; kind: TermKind
  origin: 'authored' | 'lesson' | 'equation'; note?: string; source?: string; tex?: string; unit?: string; context?: string
}
export const normalizeTerm = (s:string) => s.normalize('NFKC').toLowerCase().replace(/[−–—]/g,'-').replace(/\\(alpha|beta|gamma|delta|lambda|mu|sigma|rho|eta|theta|chi|phi|pi)\b/g,'$1').replace(/[αβγδλμσρηθχφπ]/g,c=>({α:'alpha',β:'beta',γ:'gamma',δ:'delta',λ:'lambda',μ:'mu',σ:'sigma',ρ:'rho',η:'eta',θ:'theta',χ:'chi',φ:'phi',π:'pi'} as Record<string,string>)[c]).replace(/[{}]/g,'').replace(/\s+/g,' ').trim()
export function buildDictionary(concepts: Concept[] = CONCEPTS): DictionaryEntry[] {
  const entries: DictionaryEntry[] = []
  for(const c of concepts) {
    const local: Omit<DictionaryEntry,'id'|'concept'>[] = []
    const add=(e:Omit<DictionaryEntry,'id'|'concept'>)=>{
      // Preserve case and meaning in identifiers: p and P need not mean the same thing.
      if(!local.some(x=>x.label===e.label&&x.meaning.toLowerCase()===e.meaning.toLowerCase()&&x.context===e.context)) local.push(e)
    }
    add({label:c.term,meaning:c.one,kind:'term',origin:'lesson',context:'Topic overview'})
    for(const d of CURATED[c.id]||[]) add({...d,origin:'authored'})
    const m=metadataTerm(c)
    if(m && !local.some(x=>x.label===m.label&&x.origin==='authored')) add({...m,origin:'lesson'})
    for(const [label,meaning] of c.formula?.vars||[]) add({label,meaning,kind:'notation',origin:'lesson',tex:label,context:'Lesson formula'})
    for(const eq of EQUATIONS.filter(e=>e.concept===c.id)) {
      for(const v of [...eq.inputs,eq.output,...(eq.extras||[])]) add({label:v.tex,meaning:v.name,kind:'notation',origin:'equation',tex:v.tex,unit:v.unit,context:eq.title})
    }
    local.forEach((e,i)=>entries.push({...e,concept:c,id:c.id+':'+i}))
  }
  return entries.sort((a,b)=>a.label.localeCompare(b.label,'en',{numeric:true})||a.concept.id.localeCompare(b.concept.id))
}
export const DICTIONARY=buildDictionary()
export function dictionarySearch(entries:DictionaryEntry[], query:string, kind:TermKind|'all'='all', domain='',concept='') {
  const q=normalizeTerm(query),words=q.split(' ').filter(Boolean)
  return entries.filter(e=>{
    if(kind!=='all'&&e.kind!==kind||domain&&e.concept.domain!==domain||concept&&e.concept.id!==concept) return false
    const hay=normalizeTerm([e.label,e.meaning,e.note,e.unit,e.context,e.concept.term,e.concept.full,...(e.concept.aka||[])].filter(Boolean).join(' '))
    return words.every(w=>hay.includes(w))
  }).sort((a,b)=>q?Number(normalizeTerm(b.label)===q)-Number(normalizeTerm(a.label)===q):0)
}
export function dictionaryAudit(concepts:Concept[]=CONCEPTS, entries:DictionaryEntry[]=DICTIONARY) {
  return concepts.map(c=>({id:c.id,topic:c.term,entries:entries.filter(e=>e.concept.id===c.id).length,
    acronyms:entries.filter(e=>e.concept.id===c.id&&e.kind==='acronym').length,
    notation:entries.filter(e=>e.concept.id===c.id&&e.kind==='notation').length,
    formulaWithoutLessonSymbols:!!c.formula&&!c.formula.vars?.length,
    titleReview: !c.full&&!CURATED[c.id]?.length&&/\b[A-Z]{2,}\b/.test(c.term),
  }))
}
