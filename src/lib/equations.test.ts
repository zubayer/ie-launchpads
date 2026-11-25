import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from '../content'
import { EQUATION_FOR_CONCEPT } from '../content/equationIndex'
import { EQUATIONS, EQUATION_MAP, evaluate, excelFormula, newtonIrr, responseTo } from '../content/equations'

const E = (id: string) => EQUATION_MAP[id]
const y = (id: string, v: Record<string, number>) => { const r = evaluate(E(id), v); if (!r.ok) throw new Error(r.error); return r.y }

describe('Equation Explorer content', () => {
  it('links to real lessons and has complete, consistent inputs', () => {
    const bad: string[] = []
    EQUATIONS.forEach((e) => {
      ;[e.concept, ...(e.related || [])].forEach((id) => { if (!CONCEPT_MAP[id]) bad.push(`${e.id}: unknown lesson ${id}`) })
      if (!e.inputs.some((i) => i.key === e.sweep)) bad.push(`${e.id}: sweep ${e.sweep}`)
      if (e.predict && !e.inputs.some((i) => i.key === e.predict)) bad.push(`${e.id}: predict ${e.predict}`)
      if (new Set(e.inputs.map((i) => i.key)).size !== e.inputs.length) bad.push(`${e.id}: duplicate keys`)
      e.inputs.forEach((i) => { if (!(i.min < i.max) || i.value < i.min || i.value > i.max || !i.unit || !i.name) bad.push(`${e.id}.${i.key}: range/default/unit`) })
      if (!evaluate(e, Object.fromEntries(e.inputs.map((i) => [i.key, i.value]))).ok) bad.push(`${e.id}: defaults are invalid`)
      if (/[{}]/.test(excelFormula(e)) || !excelFormula(e).startsWith('=')) bad.push(`${e.id}: excel ${excelFormula(e)}`)
      if (!e.assumptions.length || !e.traps.length || !e.fixtures.length || !e.dims) bad.push(`${e.id}: missing assumptions, traps, fixtures or units check`)
    })
    expect(bad).toEqual([])
    expect(new Set(EQUATIONS.map((e) => e.id)).size).toBe(EQUATIONS.length)
    expect(EQUATION_FOR_CONCEPT).toEqual(Object.fromEntries(EQUATIONS.map((e) => [e.concept, e.id])))
  })

  it('matches every independent reference case', () => {
    const bad: string[] = []
    EQUATIONS.forEach((e) => e.fixtures.forEach((f) => {
      const v = { ...Object.fromEntries(e.inputs.map((i) => [i.key, i.value])), ...f.inputs }
      const r = evaluate(e, v)
      if (!r.ok || Math.abs(r.y - f.expect) > f.tol) bad.push(`${e.id}: ${f.source} expected ${f.expect}, got ${r.ok ? r.y : r.error}`)
    }))
    expect(bad).toEqual([])
  })
})

describe('equation properties', () => {
  it("Little's law: W × λ = L", () => {
    for (const [L, lam] of [[240, 60], [7, 3], [0, 5]]) expect(y('littles-law', { L, lam }) * lam).toBeCloseTo(L, 9)
  })
  it('takt halves when demand doubles', () => {
    expect(y('takt', { A: 900, D: 1800 })).toBeCloseTo(y('takt', { A: 900, D: 900 }) / 2, 12)
  })
  it('OEE equals fully productive time ÷ planned time', () => {
    const v = { plan: 420, down: 47, ideal: 1, N: 19271, R: 423 }
    expect(y('oee', v)).toBeCloseTo(((v.N - v.R) * v.ideal) / 60 / v.plan, 12)
    expect(evaluate(E('oee'), { ...v, down: 420 }).ok).toBe(false)
    expect(evaluate(E('oee'), { ...v, R: 20000 }).ok).toBe(false)
    expect(evaluate(E('oee'), { ...v, ideal: 2 }).ok).toBe(false) // performance would exceed 100%
  })
  it('Cpk ≤ Cp, equal when centred, negative when the mean is outside the spec', () => {
    const e = E('cpk')
    for (const mu of [9.9, 9.97, 10, 10.02, 10.05]) {
      const v = { USL: 10.06, LSL: 9.94, mu, sigma: 0.015 }
      const r = evaluate(e, v); if (!r.ok) throw new Error(r.error)
      expect(r.y).toBeLessThanOrEqual(r.extras[0] + 1e-12)
    }
    const c = evaluate(e, { USL: 10.06, LSL: 9.94, mu: 10, sigma: 0.015 }); if (!c.ok) throw new Error()
    expect(c.y).toBeCloseTo(c.extras[0], 12)
    expect(c.extras[1]).toBeCloseTo(2 * (1 - 0.9999683) * 1e6, 0) // ±4σ normal tails ≈ 63 PPM
    expect(y('cpk', { USL: 10.06, LSL: 9.94, mu: 10.1, sigma: 0.015 })).toBeLessThan(0)
    expect(evaluate(e, { USL: 9.9, LSL: 9.94, mu: 10, sigma: 0.015 }).ok).toBe(false)
  })
  it('EOQ minimises annual ordering + holding cost', () => {
    const D = 12000, S = 75, H = 2.5
    const tc = (Q: number) => (D / Q) * S + (Q / 2) * H
    const q = y('eoq', { D, S, H })
    for (const k of [0.5, 0.9, 0.99, 1.01, 1.1, 2]) expect(tc(q)).toBeLessThanOrEqual(tc(q * k))
    const r = evaluate(E('eoq'), { D, S, H }); if (!r.ok) throw new Error()
    expect(r.extras[0]).toBeCloseTo(tc(q), 6)
  })
  it('NPV: zero rate gives the plain sum; it falls as the rate rises', () => {
    expect(y('npv', { P: 1000, A: 300, n: 4, i: 0, S: 50 })).toBeCloseTo(-1000 + 1200 + 50, 9)
    let prev = Infinity
    for (let i = 0; i <= 30; i += 5) { const v = y('npv', { P: 40000, A: 12000, n: 5, i, S: 0 }); expect(v).toBeLessThan(prev); prev = v }
  })
  it('Newton–Raphson converges to the rate where NPV is zero', () => {
    const i = newtonIrr(40000, 12000, 5, 0.1, 10)
    expect(Math.abs(y('npv', { P: 40000, A: 12000, n: 5, i: i * 100, S: 0 }))).toBeLessThan(1e-6)
    // error shrinks every step once close (quadratic convergence)
    const err = [1, 2, 3, 4].map((k) => Math.abs(newtonIrr(40000, 12000, 5, 0.1, k) - i))
    for (let k = 1; k < err.length; k++) if (err[k - 1] > 1e-12) expect(err[k]).toBeLessThan(err[k - 1])
    expect(evaluate(E('irr-newton'), { P: 40000, A: 1000, n: 5, g: 10, k: 3 }).ok).toBe(false)
  })
  it("M/M/1 satisfies Little's law and refuses unstable inputs", () => {
    const e = E('mm1')
    const r = evaluate(e, { lam: 8, mu: 10 }); if (!r.ok) throw new Error()
    const W = r.y / 60 + 1 / 10 // hours in system
    expect(r.extras[1]).toBeCloseTo(8 * W, 12)
    expect(evaluate(e, { lam: 10, mu: 10 }).ok).toBe(false)
  })
  it('two-point scaling maps the calibration points exactly and warns outside the span', () => {
    const v = { x: 4, x0: 4, x1: 20, y0: -20, y1: 120 }
    expect(y('calibration', v)).toBe(-20)
    expect(y('calibration', { ...v, x: 20 })).toBe(120)
    const r = evaluate(E('calibration'), { ...v, x: 2 }); expect(r.ok && r.warn).toBeTruthy()
    expect(evaluate(E('calibration'), { ...v, x1: 4 }).ok).toBe(false)
  })
  it('predict-first answers match the mathematics', () => {
    const d = (id: string) => Object.fromEntries(E(id).inputs.map((i) => [i.key, i.value]))
    expect(responseTo(E('takt'), d('takt'), 'D', 2)).toBe('halves')
    expect(responseTo(E('littles-law'), d('littles-law'), 'L', 2)).toBe('doubles')
    expect(responseTo(E('eoq'), d('eoq'), 'D', 2)).toBe('rises, but less than double')
    expect(responseTo(E('cpk'), d('cpk'), 'sigma', 2)).toBe('halves')
    expect(responseTo(E('mm1'), d('mm1'), 'lam', 2)).toBe('more than doubles')
    expect(responseTo(E('oee'), d('oee'), 'down', 2)).toBe('no change')
    expect(responseTo(E('mm1'), { lam: 8, mu: 10 }, 'lam', 2)).toBeNull() // doubling would be unstable
  })
  it('rejects non-numbers instead of computing NaN', () => {
    expect(evaluate(E('takt'), { A: NaN, D: 900 }).ok).toBe(false)
  })
  it('rejects physically impossible inputs but keeps legitimately signed ones', () => {
    const bad = (id: string, v: Record<string, number>) => { const r = evaluate(E(id), v); return r.ok ? null : r.error }
    expect(bad('takt', { A: 900, D: -900 })).toMatch(/greater than zero/)
    expect(bad('takt', { A: 900, D: 900.5 })).toMatch(/whole number/)
    expect(bad('oee', { plan: 420, down: 47, ideal: 1, N: 19271, R: -423 })).toMatch(/negative/)
    expect(bad('eoq', { D: 12000, S: 75, H: 0 })).toMatch(/greater than zero/)
    expect(bad('mm1', { lam: -1, mu: 10 })).toMatch(/greater than zero/)
    expect(bad('littles-law', { L: 0, lam: 60 })).toBeNull() // empty system: zero WIP is valid
    expect(bad('calibration', { x: 12, x0: 4, x1: 20, y0: -40, y1: 60 })).toBeNull() // negative temperatures are fine
    expect(bad('cpk', { USL: -1, LSL: -2, mu: -1.5, sigma: 0.1 })).toBeNull()
    // every input declares a domain explicitly or takes the strict default; defaults and reference cases pass it
    EQUATIONS.forEach((e) => e.fixtures.forEach((f) => expect(evaluate(e, { ...Object.fromEntries(e.inputs.map((i) => [i.key, i.value])), ...f.inputs }).ok, e.id).toBe(true)))
  })
})
