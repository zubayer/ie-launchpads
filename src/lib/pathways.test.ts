import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from '../content'
import { EQUATION_MAP } from '../content/equations'
import { MYSTERIES } from '../content/discovery'
import { PATHWAYS, allItems, type NumericItem } from '../content/pathways'
import { SIM_META } from '../sims/registry'
import { evidence, gradeNumeric, parseQuantity } from './answers'
import { shows } from './numeric'
import { runLine, SCENARIOS } from '../sims/Factory'
import type { Attempt } from './store'

const nums = (s: string) => [...s.replace(/(\d),(?=\d{3}\b)/g, '$1').matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))

describe('pathway content', () => {
  it('references real lessons, routes and cases, with unique items', () => {
    const bad: string[] = []
    PATHWAYS.forEach((p) => {
      const ids = allItems(p).map((it) => it.id)
      if (new Set(ids).size !== ids.length) bad.push(`${p.id}: duplicate item ids`)
      p.steps.forEach((s) => {
        s.lessons.forEach((id) => { if (!CONCEPT_MAP[id]) bad.push(`${p.id}/${s.id}: lesson ${id}`) })
        s.links?.forEach((l) => {
          const [, kind, rest] = l.to.match(/^\/(\w+)\/?(.*)$/) || []
          if (kind === 'formulas' && !EQUATION_MAP[rest]) bad.push(`link ${l.to}`)
          if (kind === 'lab' && !SIM_META.some((x) => x.id === rest)) bad.push(`link ${l.to}`)
          if (kind === 'mysteries' && !MYSTERIES.some((m) => l.to.endsWith(`case=${m.id}`))) bad.push(`link ${l.to}`)
        })
      })
      allItems(p).forEach((it) => {
        if (!CONCEPT_MAP[it.concept]) bad.push(`${it.id}: concept ${it.concept}`)
        if (it.kind === 'choice') {
          if (it.answer < 0 || it.answer >= it.options.length || it.options.some((o) => !o.why)) bad.push(`${it.id}: options`)
          if (new Set(it.options.map((o) => o.text)).size !== it.options.length) bad.push(`${it.id}: duplicate options`)
        }
        if (it.kind === 'external') {
          const m = MYSTERIES.find((x) => it.item === `case:${x.id}`)
          if (!m) bad.push(`${it.id}: unknown case ${it.item}`)
          else if (m.concept !== it.concept) bad.push(`${it.id}: concept ${it.concept} ≠ case concept ${m.concept}`)
        }
      })
    })
    expect(bad).toEqual([])
  })

  it('generated questions are consistent for 300 seeds: answer matches the prompt, the worked steps show it, traps differ from it', () => {
    const bad: string[] = []
    const recompute: Record<string, (n: number[]) => number> = {
      takt: ([shifts, hours, brk, demand]) => (shifts * (hours * 60 - brk) * 60) / demand,
      'r-takt-calc': ([shifts, hours, brk, demand]) => (shifts * (hours * 60 - brk) * 60) / demand,
      effective: ([ct, pct]) => ct / (pct / 100),
      oee: ([a, p, q]) => (a * p * q) / 10000,
      littles: ([L, lam]) => L / lam,
      'r-littles-calc': ([L, lam]) => L / lam,
      // Independent of the item: search the Visual factory model itself for the lowest whole-percent
      // Weld availability that makes 420 good units in the "Every station beats takt" preset.
      'lab-weld': () => {
        const base = SCENARIOS.find((x) => x.id === 'mystery')!.line
        for (let a = 1; a <= 100; a++) {
          const line = { ...base, stations: base.stations.map((st) => (st.name === 'Weld' ? { ...st, avail: a / 100 } : st)) }
          if (runLine(line).good >= 420 - 1e-9) return a
        }
        return NaN
      },
    }
    PATHWAYS.forEach((p) => allItems(p).filter((it): it is NumericItem => it.kind === 'numeric').forEach((it) => {
      for (let seed = 0; seed < 300; seed++) {
        const g = it.make(seed)
        const tol = Math.max(g.answer.tol.abs ?? 0, (g.answer.tol.rel ?? 0) * Math.abs(g.answer.value))
        if (!Number.isFinite(g.answer.value) || g.answer.value <= 0) bad.push(`${it.id}#${seed}: answer ${g.answer.value}`)
        const f = recompute[it.id]
        if (!f) { bad.push(`${it.id}: no independent recomputation; add one to this test`); return }
        if (Math.abs(f(nums(g.prompt)) - g.answer.value) > 1e-9) bad.push(`${it.id}#${seed}: prompt gives ${f(nums(g.prompt))}, answer ${g.answer.value}`)
        if (!shows(g.steps[g.steps.length - 1], g.answer.unit === '%' ? g.answer.value / 100 : g.answer.value) && !shows(g.steps.join(' '), g.answer.value)) bad.push(`${it.id}#${seed}: steps don't show ${g.answer.value}`)
        g.answer.traps?.forEach((t) => { if (Math.abs(t.value - g.answer.value) <= tol * 2) bad.push(`${it.id}#${seed}: trap ${t.value} is too close to the answer`) })
        if (gradeNumeric(`${g.answer.value} ${g.answer.unit}`, g.answer).kind !== 'correct') bad.push(`${it.id}#${seed}: exact answer not accepted`)
        if (bad.length > 10) return
      }
    }))
    expect(bad).toEqual([])
  })
})

describe('unit-aware grading', () => {
  const takt = { value: 60, unit: 's/unit', acceptNumeratorOnly: true, tol: { abs: 0.05 }, traps: [{ value: 64, msg: 'breaks' }] }
  it('converts units within a dimension', () => {
    expect(gradeNumeric('60 s', takt).kind).toBe('correct')
    expect(gradeNumeric('1 min', takt).kind).toBe('correct')
    expect(gradeNumeric('1 minute', takt).kind).toBe('correct')
    expect(gradeNumeric('60 seconds per unit', takt).kind).toBe('correct')
    expect(gradeNumeric('0.0166667 h', takt).kind).toBe('correct')
    expect(gradeNumeric('4 days', { value: 96, unit: 'h', tol: { abs: 0.01 } }).kind).toBe('correct')
    expect(gradeNumeric('84.6%', { value: 84.6, unit: '%', tol: { abs: 0.06 } }).kind).toBe('correct')
    expect(gradeNumeric('12,000 units', { value: 12000, unit: 'units', tol: { abs: 0 } }).kind).toBe('correct')
  })
  it('asks for a unit instead of guessing, and flags the wrong kind of unit', () => {
    expect(gradeNumeric('60', takt).kind).toBe('retry')
    expect(gradeNumeric('sixty', takt).kind).toBe('retry')
    expect(gradeNumeric('60 furlongs', takt).kind).toBe('retry')
    const w = gradeNumeric('60 %', takt)
    expect(w.kind).toBe('wrong'); expect(w.msg).toMatch(/unit/)
    expect(gradeNumeric('366', { value: 366, unit: 'units', tol: { abs: 0 }, unitOptional: true }).kind).toBe('correct')
  })
  it('preserves compound dimensions, supports scientific notation and rejects unrelated units', () => {
    const strict = { value: 60, unit: 's/unit', tol: { abs: 0.01 } }
    expect(gradeNumeric('1 min per part', strict).kind).toBe('correct')
    expect(gradeNumeric('60 s', strict).kind).toBe('wrong')
    expect(gradeNumeric('60 s/unit', { ...strict, unit: 's' }).kind).toBe('wrong')
    expect(gradeNumeric('2 units/min', { value: 120, unit: 'units/h', tol: { abs: 0.01 } }).kind).toBe('correct')
    expect(gradeNumeric('$12/unit', { value: 12, unit: '$/unit', tol: { abs: 0 } }).kind).toBe('correct')
    expect(gradeNumeric('$12/unit', { value: 12, unit: '$', tol: { abs: 0 } }).kind).toBe('wrong')
    expect(gradeNumeric('1.2e+3 mm', { value: 1.2, unit: 'm', tol: { abs: 0.001 } }).kind).toBe('correct')
    expect(gradeNumeric('2 kg', { value: 2, unit: '', tol: { abs: 0 } }).kind).toBe('wrong')
    expect(gradeNumeric('2 constructor', { value: 2, unit: 's', tol: { abs: 0 } }).kind).toBe('retry')
    expect(gradeNumeric('2', { value: 2, unit: 'unsupported', tol: { abs: 0 } }).kind).toBe('retry')
    expect(parseQuantity('1,23 s')).toBeNull()
    expect(parseQuantity('+1.2e+3 mm')).toEqual({ x: 1200, unit: 'mm' })
  })
  it('names a known misconception and says too high or too low otherwise', () => {
    expect(gradeNumeric('64 s', takt)).toMatchObject({ kind: 'wrong', trap: true, msg: 'breaks' })
    expect(gradeNumeric('70 s', takt).msg).toBe('Too high.')
    expect(gradeNumeric('50 s', takt).msg).toBe('Too low.')
  })
  it('parses common number formats', () => {
    expect(parseQuantity('−3.5 days')).toEqual({ x: -3.5, unit: 'days' })
    expect(parseQuantity('$5,489')).toEqual({ x: 5489, unit: '$' })
  })
})

describe('evidence', () => {
  it('summarises attempts by dimension and counts distinct correct days', () => {
    const t0 = new Date(2026, 10, 20, 10).getTime(), t1 = new Date(2026, 10, 21, 10).getTime()
    const at: Attempt[] = [
      { item: 'x:1', concept: 'lean.oee', dim: 'calculate', correct: false, at: t0 },
      { item: 'x:1', concept: 'lean.oee', dim: 'calculate', correct: true, at: t0 + 1000 },
      { item: 'x:2', concept: 'lean.oee', dim: 'calculate', correct: true, at: t1 },
      { item: 'x:3', concept: 'lean.oee', dim: 'recall', correct: false, at: t1 },
    ]
    const e = evidence(at, 'lean.oee')
    expect(e.calculate).toEqual({ tries: 3, correct: 2, days: 2, last: true })
    expect(e.recall).toEqual({ tries: 1, correct: 0, days: 0, last: false })
    expect(e.apply).toBeNull()
  })
})

describe('variants', () => {
  it('two items built from the same generator show different numbers', () => {
    const p = PATHWAYS[0]
    const get = (id: string) => allItems(p).find((it) => it.id === id) as NumericItem
    let same = 0
    for (let s = 0; s < 50; s++) if (get('takt').make(s).prompt === get('r-takt-calc').make(s).prompt) same++
    expect(same).toBeLessThan(5)
    expect(get('takt').make(0).prompt).not.toBe(get('takt').make(1).prompt)
  })
})

describe('factory question traps', () => {
  it('the 91% trap really falls short and today’s 80% gives about 366 units in the model', () => {
    const base = SCENARIOS.find((x) => x.id === 'mystery')!.line
    const at = (a: number) => runLine({ ...base, stations: base.stations.map((st) => (st.name === 'Weld' ? { ...st, avail: a } : st)) }).good
    expect(at(0.91)).toBeLessThan(420)
    expect(at(0.92)).toBeGreaterThanOrEqual(420)
    expect(Math.floor(at(0.8))).toBe(366)
  })
})
