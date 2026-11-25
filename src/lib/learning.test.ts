import { describe, expect, it } from 'vitest'
import katex from 'katex'
import { CONCEPTS } from '../content'
import { ALL_SECTIONS, MODES, applyMode, modeOf } from './modes'
import { useStore } from './store'

describe('learning modes', () => {
  it('mode ids are unique and every listed section exists', () => {
    expect(new Set(MODES.map((m) => m.id)).size).toBe(MODES.length)
    for (const m of MODES) for (const id of m.order || []) expect(ALL_SECTIONS as readonly string[], `${m.id}: ${id}`).toContain(id)
  })
  it('every mode starts with the keyword and keeps a recall check or the next steps', () => {
    for (const m of MODES.filter((x) => x.order)) {
      expect(m.order![0], m.id).toBe('keyword')
      expect(m.order!.includes('try') || m.order!.includes('more'), m.id).toBe(true)
    }
  })
  it('applyMode follows the mode order and skips sections a topic lacks', () => {
    const have = ['keyword', 'plain', 'picture', 'try', 'more'].map((id) => ({ id }))
    expect(applyMode(have, modeOf('visual')).map((s) => s.id)).toEqual(['keyword', 'picture', 'plain', 'try', 'more'])
    expect(applyMode(have, modeOf('full'))).toBe(have)
    expect(modeOf('nonsense').id).toBe('full')
  })
  it('the modes differ: no two show the same section list', () => {
    const keys = MODES.map((m) => (m.order || ['*']).join(','))
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('formula library', () => {
  it('every formula and variable symbol renders in KaTeX', () => {
    const bad: string[] = []
    for (const c of CONCEPTS.filter((x) => x.formula)) {
      for (const tex of [c.formula!.tex, ...(c.formula!.vars || []).map((v) => v[0])]) {
        try { katex.renderToString(tex, { throwOnError: true }) } catch (e) { bad.push(`${c.id}: ${tex} (${(e as Error).message.slice(0, 60)})`) }
      }
    }
    expect(bad).toEqual([])
  })
})

describe('error notebook', () => {
  it('logs, resolves and clears mistakes', () => {
    const s = useStore.getState()
    s.logMistake({ concept: 'quality.cpk', prompt: 'p', given: 'a', correct: 'b', explain: 'e' })
    const [m] = useStore.getState().mistakes
    expect(m.concept).toBe('quality.cpk')
    useStore.getState().resolveMistake(m.id, true)
    expect(useStore.getState().mistakes[0].resolved).toBeTypeOf('number')
    useStore.getState().clearResolved()
    expect(useStore.getState().mistakes.find((x) => x.id === m.id)).toBeUndefined()
  })
  it('pins and unpins formulas', () => {
    useStore.getState().togglePinnedFormula('quality.cpk')
    expect(useStore.getState().pinnedFormulas).toContain('quality.cpk')
    useStore.getState().togglePinnedFormula('quality.cpk')
    expect(useStore.getState().pinnedFormulas).not.toContain('quality.cpk')
  })
})

describe('V1 switch', async () => {
  const { v1Href } = await import('./version')
  it('keeps the same page where V1 has it', () => {
    expect(v1Href('/c/quality.cpk', 'https://v1.example/')).toBe('https://v1.example/#/c/quality.cpk')
    expect(v1Href('/lab/control-chart', 'https://v1.example')).toBe('https://v1.example/#/lab/control-chart')
    expect(v1Href('/', 'https://v1.example/')).toBe('https://v1.example/#/')
  })
  it('sends V2-only pages to the V1 home page', () => {
    for (const p of ['/academy', '/curriculum', '/formulas', '/notebook']) expect(v1Href(p, 'https://v1.example/')).toBe('https://v1.example/#/')
  })
})

describe('periodic table and chains', async () => {
  const { ELEMENTS, FAMILIES, RAW_ELEMENT_IDS, ELEMENT_IO } = await import('../content/periodic')
  const { CHAINS } = await import('../content/chains')
  const { CONCEPT_MAP: CM } = await import('../content')
  it('107 elements, every id real, symbols unique, every family filled', () => {
    expect(RAW_ELEMENT_IDS.filter((id) => !CM[id])).toEqual([])
    expect(ELEMENTS.length).toBe(107)
    expect(new Set(ELEMENTS.map((e) => e.sym)).size).toBe(ELEMENTS.length)
    expect(new Set(ELEMENTS.map((e) => e.id)).size).toBe(ELEMENTS.length)
    for (const f of FAMILIES) expect(ELEMENTS.filter((e) => e.family === f.id).length, f.id).toBeGreaterThan(5)
    for (const id of Object.keys(ELEMENT_IO)) expect(ELEMENTS.some((e) => e.id === id), id).toBe(true)
  })
  it('elements are numbered in order and run Foundation → Advanced inside each family', () => {
    ELEMENTS.forEach((e, i) => expect(e.n).toBe(i + 1))
    for (const f of FAMILIES) { const lv = ELEMENTS.filter((e) => e.family === f.id).map((e) => e.c.level); expect([...lv].sort()).toEqual(lv) }
  })
  it('every chain step is a real lesson', () => {
    for (const c of CHAINS) for (const s of c.steps) expect(CM[s.id], `${c.id}: ${s.id}`).toBeTruthy()
  })
})

describe('scheduling grand prix', async () => {
  const { DEFAULT_JOBS, RULES, runSchedule, sequence } = await import('../sims/Scheduling')
  const r = (rule: 'FCFS' | 'SPT' | 'EDD') => runSchedule(sequence(rule, DEFAULT_JOBS))
  it('matches hand-computed results for the default jobs', () => {
    expect([r('FCFS').avgFlow, r('FCFS').avgTardiness, r('FCFS').late]).toEqual([15.4, 2.2, 3])
    expect([r('SPT').avgFlow, r('SPT').avgTardiness, r('SPT').late]).toEqual([13, 1.8, 3])
    expect([r('EDD').avgFlow, r('EDD').avgTardiness, r('EDD').late]).toBeTruthy()
    expect(r('EDD').avgFlow).toBeCloseTo(13.6, 10)
    expect(r('EDD').avgTardiness).toBeCloseTo(1.2, 10)
    expect(r('EDD').late).toBe(2)
    for (const x of RULES) expect(r(x.id).makespan).toBe(28)
  })
  it('single-machine theorems hold on random job sets: SPT minimises mean flow time, EDD minimises max lateness', () => {
    let seed = 7
    const rand = (lo: number, hi: number) => { seed = (seed * 16807) % 2147483647; return lo + (seed % (hi - lo + 1)) }
    for (let k = 0; k < 500; k++) {
      const jobs = Array.from({ length: rand(2, 8) }, (_, i) => ({ id: String.fromCharCode(65 + i), p: rand(1, 12), d: rand(0, 40) }))
      const res = RULES.map((x) => runSchedule(sequence(x.id, jobs)))
      const spt = runSchedule(sequence('SPT', jobs)), edd = runSchedule(sequence('EDD', jobs))
      for (const x of res) { expect(spt.avgFlow).toBeLessThanOrEqual(x.avgFlow + 1e-9); expect(edd.maxLateness).toBeLessThanOrEqual(x.maxLateness); expect(x.makespan).toBe(res[0].makespan) }
    }
  })
})

describe('cheat sheets', async () => {
  const { SHEETS } = await import('../content/sheets')
  const { CONCEPT_MAP: CM } = await import('../content')
  const i = 0.1, AP = (n: number) => (i * (1 + i) ** n) / ((1 + i) ** n - 1)
  it('every row links to a real lesson', () => {
    for (const s of Object.values(SHEETS)) for (const row of s.rows) expect(CM[row.concept], row.concept).toBeTruthy()
  })
  it('engecon worked example and traps are numerically right', () => {
    const cr = (50000 - 10000) * AP(5) + 10000 * i
    expect(AP(5)).toBeCloseTo(0.2638, 4)
    expect(cr).toBeCloseTo(11551.9, 1)
    // Excel PMT(i, n, -P, S) solves -P(1+i)^n + PMT·((1+i)^n − 1)/i + S = 0
    expect((50000 * (1 + i) ** 5 - 10000) / (((1 + i) ** 5 - 1) / i)).toBeCloseTo(cr, 6)
    expect(((1.01 ** 12 - 1) * 100)).toBeCloseTo(12.68, 2)
    const e = SHEETS.engecon
    expect(e.example.work).toContain('11,552')
    expect(e.example.excel).toContain('11,551.90')
    expect(e.traps[1].text).toContain('12.68%')
  })
})
