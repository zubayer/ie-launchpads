import { describe, expect, it } from 'vitest'
import { AI_SOURCES, SKIPPED, aiPrompt, createPacer, tidy } from './ai'

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
  it('skips requests nobody waits for any more, without using a slot', async () => {
    let t = 0
    const starts: string[] = []
    const pace = createPacer(15000, () => t, async (ms) => { t += ms })
    const left = new Set(['lesson A', 'lesson B']) // the learner left these lessons before their turn
    const ask = (name: string) => pace(async () => { starts.push(`${name}@${t}`); return name }, () => !left.has(name) || name === 'first')
    const got = await Promise.all([ask('first'), ask('lesson A'), ask('lesson B'), ask('current')])
    expect(got).toEqual(['first', SKIPPED, SKIPPED, 'current'])
    expect(starts).toEqual(['first@0', 'current@15000']) // the current lesson goes next, not after 45 s
  })
  it('tidies answers and rejects empty ones', () => {
    expect(tidy('## Takt\n**Definition**: the pace set by demand, in seconds per unit of output.')).toBe('Takt\nDefinition: the pace set by demand, in seconds per unit of output.')
    expect(tidy('  ok  ')).toBeNull()
  })
  it('every source is labelled, web sources name a model, and there is one Pollinations card', () => {
    expect(new Set(AI_SOURCES.map((s) => s.id)).size).toBe(AI_SOURCES.length)
    for (const s of AI_SOURCES) {
      expect(s.label && s.provider && s.note, s.id).toBeTruthy()
      if (s.where === 'web') expect(s.model, s.id).toMatch(/^[a-z0-9-]+$/)
    }
    expect(AI_SOURCES.filter((s) => s.provider === 'Pollinations')).toHaveLength(1) // they share one rate limit
    expect(aiPrompt('Takt time', 'lean manufacturing')).toContain('"Takt time" (lean manufacturing)')
  })
})
