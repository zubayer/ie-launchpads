import { describe, expect, it } from 'vitest'
import { CONCEPTS, CONCEPT_MAP } from '../content/full'
import { SOURCES } from '../content/sources'
import { PILOTS, DISCOVERY, LENSES, studioCitations } from '../content/topicStudio'
import { taktLab, ladderLab, newtonLab, npvLab, capabilityLab } from './topicStudioMath'
import { parseCrossref } from './topicDiscovery'

describe('Topic Intelligence Studio',()=>{
  it('covers every domain and references only real concepts and registered sources',()=>{
    expect(Object.keys(PILOTS).length).toBe(6)
    for(const [id,p] of Object.entries(PILOTS)){
      expect(CONCEPT_MAP[id],id).toBeTruthy()
      for(const lens of LENSES) expect(p.explanations[lens.id]).toBeTruthy()
      expect(p.practice.options[p.practice.answer]).toBeTruthy()
      expect(p.limit).toBeTruthy()
    }
    for(const c of CONCEPTS){
      expect(DISCOVERY[c.domain]).toBeTruthy()
      for(const ct of studioCitations(c)) expect(SOURCES[ct.src]).toBeTruthy()
    }
  })
  it('uses independently computed takt and capacity reference values',()=>{
    expect(taktLab(480,60,420,75)).toEqual({seconds:25200,takt:60,capacity:336})
    expect(taktLab(480,60,840,75)?.takt).toBe(30)
    expect(taktLab(480,60,0,75)).toBeNull()
    expect(taktLab(60,60,1,1)).toBeNull()
  })
  it('matches the eight-entry Boolean truth table',()=>{
    const got=Array.from({length:8},(_,i)=>ladderLab(!!(i&4),!!(i&2),!!(i&1)))
    expect(got).toEqual([false,true,false,false,false,true,false,true])
  })
  it('converges toward the independent square-root reference and guards invalid input',()=>{
    expect(newtonLab(2,2)[1]).toBe(1.5)
    expect(newtonLab(2,2)[2]).toBeCloseTo(17/12,12)
    expect(newtonLab(2,6).at(-1)).toBeCloseTo(Math.SQRT2,12)
    expect(newtonLab(0,2)).toEqual([])
  })
  it('checks five-year NPV against the geometric-series expression',()=>{
    expect(npvLab(10000,3000,.1)).toBeCloseTo(-10000+3000*(1-1.1**-5)/.1,8)
    expect(npvLab(10000,3000,0)).toBe(5000)
    expect(npvLab(10000,3000,-1)).toBeNull()
  })
  it('keeps Cp constant as the mean shifts and rejects zero spread',()=>{
    expect(capabilityLab(50,2)?.cp).toBeCloseTo(5/3,10)
    expect(capabilityLab(54,2)?.cpk).toBe(1)
    expect(capabilityLab(65,2)?.cpk).toBeCloseTo(-5/6,10)
    expect(capabilityLab(50,0)).toBeNull()
  })
  it('validates and deduplicates DOI metadata rather than trusting arbitrary links',()=>{
    const row={DOI:'10.1234/test',title:['Example'],publisher:'Publisher'}
    expect(parseCrossref({message:{items:[row,row,{DOI:'javascript:bad',title:['Bad']},null]}})).toEqual([{doi:'10.1234/test',title:'Example',publisher:'Publisher'}])
    expect(()=>parseCrossref({message:{items:'bad'}})).toThrow()
  })
})
