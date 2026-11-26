import { describe, expect, it } from 'vitest'
import { AI_SOURCES, aiPrompt, createPacer, tidy } from './ai'

describe('free AI sources', () => {
  it('spaces Pollinations requests: one at a time, each at least the gap after the previous start', async () => {
    let t = 0
    const starts: number[] = []
    const pace = createPacer(15000, () => t, async (ms) => { t += ms })
    const task = (n: number) => pace(async () => { starts.push(t); t += 2000; return n })
    const got = await Promise.all([task(1), task(2), task(3)])
    expect(got).toEqual([1, 2, 3])
    expect(starts).toEqual([0, 15000, 30000])
  })
  it('keeps the queue moving after a failed request', async () => {
    let t = 0
    const pace = createPacer(1000, () => t, async (ms) => { t += ms })
    await expect(pace(async () => { throw new Error('busy') })).rejects.toThrow('busy')
    expect(await pace(async () => 'next')).toBe('next')
    expect(pace.queued()).toBe(0)
  })
  it('tidies answers and rejects empty ones', () => {
    expect(tidy('## Takt\n**Definition**: the pace set by demand, in seconds per unit of output.')).toBe('Takt\nDefinition: the pace set by demand, in seconds per unit of output.')
    expect(tidy('  ok  ')).toBeNull()
  })
  it('every source is labelled, and web sources name a model', () => {
    expect(new Set(AI_SOURCES.map((s) => s.id)).size).toBe(AI_SOURCES.length)
    for (const s of AI_SOURCES) {
      expect(s.label && s.provider && s.note, s.id).toBeTruthy()
      if (s.where === 'web') expect(s.model, s.id).toMatch(/^[a-z0-9-]+$/)
    }
    expect(aiPrompt('Takt time', 'lean manufacturing')).toContain('"Takt time" (lean manufacturing)')
  })
})
