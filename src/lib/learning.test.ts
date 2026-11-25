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
