import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from '../content'
import { ROLES } from '../content/roles'
import { GUIDE, HOTSPOTS, MYSTERIES, PAIRS, TOOLS, WASTES } from '../content/discovery'
import { runLine, SCENARIOS } from '../sims/Factory'
import { SIM_META } from '../sims/registry'

const missing = (ids: string[]) => ids.filter((id) => !CONCEPT_MAP[id])

describe('method field guide', () => {
  it('every option leads to a node that exists, and every node is reachable from the root', () => {
    const seen = new Set<string>()
    const walk = (id: string) => {
      if (seen.has(id)) return
      seen.add(id)
      const n = GUIDE[id]
      expect(n, `node ${id}`).toBeTruthy()
      if (n.kind === 'q') { expect(n.options.length).toBeGreaterThan(1); n.options.forEach((o) => walk(o.next)) }
    }
    walk('root')
    expect(Object.keys(GUIDE).filter((id) => !seen.has(id))).toEqual([])
  })
  it('leaves name real lessons and fill in every field', () => {
    const leaves = Object.values(GUIDE).filter((n) => n.kind === 'leaf')
    expect(leaves.length).toBeGreaterThan(15)
    const ms = leaves.flatMap((n) => (n.kind === 'leaf' ? n.methods : []))
    expect(missing(ms.map((m) => m.id))).toEqual([])
    ms.forEach((m) => { expect(m.when && m.data && m.software, m.id).toBeTruthy() })
  })
})

describe('confused pairs', () => {
  it('pairs two different real lessons, each with scenarios for both sides', () => {
    expect(missing(PAIRS.flatMap((p) => [p.a, p.b]))).toEqual([])
    PAIRS.forEach((p) => {
      expect(p.a).not.toBe(p.b)
      expect(new Set(p.quiz.map((q) => q.ans)).size, `${p.a}/${p.b}`).toBe(2)
    })
    expect(new Set(PAIRS.map((p) => [p.a, p.b].sort().join('|'))).size).toBe(PAIRS.length)
  })
})

describe('factory mysteries', () => {
  it('has valid answers, clue references and method lessons', () => {
    MYSTERIES.forEach((m) => {
      expect(missing(m.methods)).toEqual([])
      m.questions.forEach((q) => {
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(q.options.length)
        if (q.clue !== undefined) expect(q.clue).toBeLessThan(m.clues.length)
      })
      m.clues.forEach((c) => c.rows.forEach((r) => expect(r.length).toBe(c.cols.length)))
    })
  })
  it('the scrap case adds up', () => {
    const m = MYSTERIES.find((x) => x.id === 'tuesday-scrap')!
    const [byPress, byShift, byDay] = m.clues
    const presses = byPress.rows.slice(0, -1).map((r) => Number(r[1]))
    expect(presses.reduce((a, b) => a + b, 0)).toBe(Number(byPress.rows.at(-1)![1]))
    expect(byShift.rows.reduce((a, r) => a + Number(r[1]), 0)).toBe(124)
    expect(byDay.rows.reduce((a, r) => a + Number(r[1]), 0)).toBe(78)
  })
})

describe('visual factory', () => {
  const base = SCENARIOS.find((s) => s.id === 'mystery')!.line
  it('matches the hand-worked mystery: Weld limits the line', () => {
    const r = runLine(base)
    expect(r.takt).toBeCloseTo(60, 9)
    expect(base.stations[r.bottleneck].name).toBe('Weld')
    expect(r.rows[r.bottleneck].eff).toBeCloseTo(68.75, 9)
    expect(Math.floor(r.capacity)).toBe(366)
    expect(r.meets).toBe(false)
    expect(r.neededAvail).toBeCloseTo(0.9167, 4)
    expect(r.balance).toBeCloseTo(193 / (4 * 55), 9)
  })
  it('SMED meets demand; yield losses multiply; WIP changes lead time only', () => {
    const smed = runLine(SCENARIOS.find((s) => s.id === 'smed')!.line)
    expect(smed.meets).toBe(true)
    const y = runLine(SCENARIOS.find((s) => s.id === 'yield')!.line)
    expect(y.rty).toBeCloseTo(0.98 * 0.95 * 0.99, 12)
    expect(y.good).toBeCloseTo(smed.capacity * y.rty, 9)
    expect(y.meets).toBe(false)
    const w = runLine(SCENARIOS.find((s) => s.id === 'wip')!.line)
    expect(w.capacity).toBeCloseTo(smed.capacity, 9)
    expect(w.leadTimeSec).toBeCloseTo(smed.leadTimeSec * 4, 9)
  })
  it("Little's law: lead time × throughput = WIP", () => {
    const r = runLine(base)
    expect((r.leadTimeSec * r.capacity) / base.shiftSec).toBeCloseTo(base.wip, 9)
  })
  it('is registered as a lab with real lessons', () => {
    const s = SIM_META.find((x) => x.id === 'factory')
    expect(s).toBeTruthy()
    expect(missing(s!.concepts)).toEqual([])
  })
})

describe('tool cards, subway, spot the waste', () => {
  it('tools link real lessons and https sites', () => {
    expect(missing(TOOLS.flatMap((t) => t.lessons))).toEqual([])
    TOOLS.forEach((t) => { expect(t.site.startsWith('https://'), t.id).toBe(true); expect(t.curve).toBeGreaterThanOrEqual(1) })
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length)
  })
  it('subway lines share interchange stations', () => {
    const count = new Map<string, number>()
    ROLES.forEach((r) => new Set(r.concepts).forEach((id) => count.set(id, (count.get(id) || 0) + 1)))
    expect([...count.values()].some((n) => n >= 3)).toBe(true)
  })
  it('the scene has one hotspot per waste, inside the picture', () => {
    expect(new Set(HOTSPOTS.map((h) => h.waste))).toEqual(new Set(WASTES))
    expect(HOTSPOTS.length).toBe(WASTES.length)
    HOTSPOTS.forEach((h) => { expect(h.x).toBeGreaterThan(4); expect(h.x).toBeLessThan(96); expect(h.y).toBeGreaterThan(6); expect(h.y).toBeLessThan(94) })
    expect(CONCEPT_MAP['lean.eight-wastes']).toBeTruthy()
  })
})
