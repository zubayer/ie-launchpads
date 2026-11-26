import { describe, expect, it } from 'vitest'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { CURATED, metadataTerm } from '../content/dictionaryTerms'
import { SOURCES } from '../content/sources'
import { DICTIONARY, dictionarySearch, dictionaryAudit } from './dictionary'

describe('engineering dictionary',()=>{
  it('indexes every lesson and preserves stable concept links',()=>{
    expect(new Set(DICTIONARY.map(e=>e.concept.id)).size).toBe(CONCEPTS.length)
    expect(new Set(DICTIONARY.map(e=>e.id)).size).toBe(DICTIONARY.length)
    expect(Object.keys(CURATED).filter(id=>!CONCEPT_MAP[id])).toEqual([])
    expect(DICTIONARY.every(e=>e.label.trim()&&e.meaning.trim()&&CONCEPT_MAP[e.concept.id])).toBe(true)
    expect(DICTIONARY.filter(e=>e.source&&!SOURCES[e.source])).toEqual([])
    expect(dictionaryAudit().every(r=>r.entries>=1)).toBe(true)
  })
  it('distinguishes ambiguous abbreviations by context',()=>{
    const pv=dictionarySearch(DICTIONARY,'PV','acronym').filter(e=>e.label==='PV')
    expect(pv.map(e=>e.meaning)).toEqual(expect.arrayContaining(['Present value','Planned value']))
    const rca=dictionarySearch(DICTIONARY,'RCA').filter(e=>e.label==='RCA')
    expect(rca.map(e=>e.concept.id)).toEqual(expect.arrayContaining(['safety.rca','semiconductor.rca-clean']))
    expect(dictionarySearch(DICTIONARY,'PV','acronym','pm').every(e=>e.concept.domain==='pm')).toBe(true)
  })
  it('does not expand capability indices as acronyms',()=>{
    const cpk=DICTIONARY.find(e=>e.label==='Cpk'&&e.origin==='authored')!
    expect(cpk.kind).toBe('notation')
    expect(cpk.meaning).toContain('centering')
    expect(dictionarySearch(DICTIONARY,'Cpk','acronym').some(e=>e.label==='Cpk')).toBe(false)
  })
  it('finds formula symbols and units, supports Greek names and filters by lesson',()=>{
    expect(dictionarySearch(DICTIONARY,'sigma','notation').some(e=>e.concept.id==='stats.normal')).toBe(true)
    expect(dictionarySearch(DICTIONARY,'σ','notation').some(e=>e.concept.id==='stats.normal')).toBe(true)
    expect(dictionarySearch(DICTIONARY,'','all','','lean.takt-time').every(e=>e.concept.id==='lean.takt-time')).toBe(true)
    expect(DICTIONARY.some(e=>e.origin==='equation'&&!!e.unit)).toBe(true)
    expect(metadataTerm(CONCEPT_MAP['automation.plc'])?.meaning).toMatch(/programmable logic controller/i)
    expect(dictionarySearch(DICTIONARY,'xyz-no-such-entry')).toEqual([])
  })
})
