import { describe,it,expect } from 'vitest'
import { CONCEPT_MAP } from '../content'
import { inlineHits,resolveInline } from './inlineTerms'
import { FAMILIES } from '../content/comparisonFamilies'
import { capabilityCompare,timingCompare,investmentCompare } from './comparisonMath'

describe('contextual terminology',()=>{
  it('recognizes whole, case-sensitive abbreviations, including mathematical index names',()=>{
    expect(inlineHits('PV, RCA and Cpk; xPV and cpk').map(h=>h.label)).toEqual(['PV','RCA','Cpk'])
    expect(inlineHits('a normal sentence with no acronyms')).toEqual([])
  })
  it('prioritizes local context but preserves alternative meanings',()=>{
    const pv=resolveInline('PV','engecon.tvm')
    expect(pv[0].meaning).toBe('Present value')
    expect(pv.some(e=>e.meaning==='Planned value')).toBe(true)
    expect(resolveInline('PV','pm.evm')[0].meaning).toBe('Planned value')
    expect(resolveInline('RCA','semiconductor.rca-clean')[0].meaning).toBe('Radio Corporation of America')
    expect(resolveInline('Cpk','quality.cpk')[0].kind).toBe('notation')
    expect(resolveInline('unknown')).toEqual([])
  })
})
describe('comparison families',()=>{
  it('uses real topic IDs and distinct groups of two to four concepts',()=>{
    expect(new Set(FAMILIES.map(f=>f.id)).size).toBe(FAMILIES.length)
    for(const f of FAMILIES){
      expect(f.concepts.length).toBeGreaterThanOrEqual(2)
      expect(f.concepts.length).toBeLessThanOrEqual(4)
      expect(new Set(f.concepts).size).toBe(f.concepts.length)
      expect(f.concepts.filter(id=>!CONCEPT_MAP[id]),f.id).toEqual([])
      expect(f.insight&&f.decision&&f.question&&f.answer).toBeTruthy()
    }
  })
  it('distinguishes spread, centering, and within versus overall estimates',()=>{
    const centered=capabilityCompare(40,60,50,2,4)!
    expect(centered.cp).toBeCloseTo(5/3)
    expect(centered.cpk).toBeCloseTo(5/3)
    expect(centered.pp).toBeCloseTo(5/6)
    expect(centered.ppk).toBeCloseTo(5/6)
    const shifted=capabilityCompare(40,60,54,2,4)!
    expect(shifted.cp).toBeCloseTo(5/3)
    expect(shifted.cpk).toBe(1)
    expect(shifted.ppk).toBe(.5)
    expect(capabilityCompare(40,60,66,2,4)?.cpk).toBe(-1)
    expect(capabilityCompare(40,40,40,2,4)).toBeNull()
    expect(capabilityCompare(40,60,50,0,4)).toBeNull()
  })
  it('separates required pace, actual completion and assumed waiting',()=>{
    const r=timingCompare(420,420,75,525)!
    expect(r).toEqual({takt:60,cycle:75,lead:600,capacity:336,gap:-84})
    expect(timingCompare(420,420,75,0)?.capacity).toBe(336)
    expect(timingCompare(420,0,75,0)).toBeNull()
  })
  it('uses independent finance reference cases including zero discount and nonrecovery',()=>{
    const r=investmentCompare(10000,3000,5,.1)!
    expect(r.npv).toBeCloseTo(1372.3603,3)
    expect(r.irr).toBeCloseTo(.152382,5)
    expect(r.aw).toBeCloseTo(362.0252,3)
    expect(r.payback).toBe(4)
    expect(investmentCompare(10000,2000,5,0)?.npv).toBe(0)
    expect(investmentCompare(10000,1000,5,0)?.payback).toBeNull()
    expect(investmentCompare(10000,0,5,.1)).toBeNull()
  })
})
