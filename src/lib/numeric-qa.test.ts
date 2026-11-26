import { describe, expect, it } from 'vitest'
import { CONCEPTS } from '../content'
import { isUncheckedNumeric } from './contentStats'
import { shows } from './numeric'

// KNOW-03: a machine check only proves something if it checks the number the learner sees.
describe('numeric QA', () => {
  it('reads the number formats used in answers', () => {
    expect(shows('about 2 minutes', 2)).toBe(true)
    expect(shows('(49.58, 50.82) mm', 50.8192)).toBe(true)
    expect(shows('ρ = 80%', 0.8)).toBe(true)
    expect(shows('1×10⁻⁴/yr', 1e-4)).toBe(true)
    expect(shows('12,000 units', 12000)).toBe(true)
    expect(shows('−3 days', -3)).toBe(true)
    expect(shows('about 542 units', 541.2)).toBe(false) // 541.2 rounds to 541, not 542
  })

  it('every machine-checked example shows its checked value in the answer', () => {
    const bad: string[] = []
    CONCEPTS.forEach((c) => {
      const ex = c.example; const ck = ex?.check
      if (!ex || !ck) return
      if (ck.shown) {
        const { value: s, rule } = ck.shown
        const dp = (String(s).split('.')[1] || '').length
        const half = (d: number) => 0.5 * 10 ** -d + 1e-9
        const ok = rule === 'ceil' ? s === Math.ceil(ck.value - 1e-9) : rule === 'round' ? Math.abs(s - ck.value) <= half(dp) : Math.abs(s - ck.value * rule.scale) <= half(dp)
        if (!ok) bad.push(`${c.id}: shown ${s} does not follow from ${ck.value} by ${JSON.stringify(rule)}`)
        if (!shows(ex.a, s)) bad.push(`${c.id}: shown value ${s} is not in the answer "${ex.a}"`)
      } else if (!shows(ex.a, ck.value)) bad.push(`${c.id}: checked value ${ck.value} is not in the answer "${ex.a}"`)
    })
    expect(bad).toEqual([])
  })

  it('checks compute something rather than return a literal', () => {
    const bad = CONCEPTS.filter((c) => c.example?.check && !/[-+*/%]|Math\.|[\w)]\s*\(/.test(c.example.check.compute.toString().replace(/^\(\)\s*=>/, ''))).map((c) => c.id)
    expect(bad).toEqual([])
  })

  it('unchecked numeric examples can only go down (report in docs/CONTENT-COVERAGE.md)', () => {
    // Baseline 2026-11-25: 2, both non-arithmetic text answers (a requirement statement and a resume bullet).
    const list = CONCEPTS.filter(isUncheckedNumeric).map((c) => c.id)
    expect(list.length, list.join(', ')).toBeLessThanOrEqual(2)
  })
})

describe('coverage ratchet', () => {
  it('coverage of the V3 core minimum and of machine-checked examples never falls (baseline 2026-11-25: 27 and 119; raised to 37 by the automation studios)', async () => {
    const { meetsMinimum } = await import('./contentStats')
    expect(CONCEPTS.filter(meetsMinimum).length).toBeGreaterThanOrEqual(37)
    expect(CONCEPTS.filter((c) => c.example?.check).length).toBeGreaterThanOrEqual(119)
  })
})
