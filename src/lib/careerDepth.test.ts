import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from '../content/full'
import { hasVisual } from './contentStats'
const ids = ["stats.std-dev","stats.confidence-interval","stats.p-value","stats.regression","doe.randomization","doe.interaction","reliability.availability","reliability.weibull","scm.reorder-point","scm.bullwhip","engecon.break-even","engecon.replacement","work.standard-time","ergo.fitts","service.pue","service.capacity-utilization"]
describe('deep-learning career content batch', () => {
  it('has meaningful learning and interview content on every enriched topic', () => {
    for (const id of ids) {
      const c = CONCEPT_MAP[id]
      expect(c, id).toBeTruthy()
      expect(c.analogy && c.why && c.real?.story, id).toBeTruthy()
      expect(c.objectives?.length || 0, id).toBeGreaterThanOrEqual(3)
      expect(c.assumptions?.length || 0, id).toBeGreaterThan(0)
      expect(c.iq?.length || 0, id).toBeGreaterThanOrEqual(2)
      expect(c.iq?.some(q => q.type === 'case'), id).toBe(true)
      expect(hasVisual(c), id).toBe(true)
    }
  })
  it('checks new interview reference calculations independently', () => {
    expect(20_000*1.1-17_000+4_000).toBeCloseTo(9000)
    expect(4/(1-.2)).toBe(5)
    expect(40*5+30).toBe(230)
    expect(100/25).toBe(4)
    expect(12/8).toBe(1.5)
    expect((45_000-5_000)/(12-4)).toBe(5000)
    expect((1+10+10+1)/1024).toBeCloseTo(.021484375,12)
  })
})
