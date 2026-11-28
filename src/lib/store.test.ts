import { describe, expect, it } from 'vitest'
import { lastDays, migrateSave, today } from './store'

const v2Save = {
  progress: { fmea: { opened: 1, results: [1, 0, 1], days: ['2026-11-01'], teach: 'RPN = S × O × D' } },
  cards: { fmea: { interval: 3, reps: 2 } },
  bookmarks: ['takt-time'],
  attempts: [{ item: 'fmea-q1', correct: true }],
  settings: { theme: 'dark', dailyNew: 7, path: 'quality', planStart: '2026-11-01', planEnd: '2027-05-01', focusMin: 25, learnMode: 'quick' },
}

describe('saved-progress migration', () => {
  it('v2 → v3 keeps every field and starts the menu unpinned', () => {
    const out = migrateSave(structuredClone(v2Save), 2)
    expect(out.progress).toEqual(v2Save.progress)
    expect(out.cards).toEqual(v2Save.cards)
    expect(out.bookmarks).toEqual(v2Save.bookmarks)
    expect(out.attempts).toEqual(v2Save.attempts)
    expect(out.settings).toEqual({ ...v2Save.settings, navPinned: false, textSize: 'standard' })
  })

  it('v1 saves gain attempts and the nav setting', () => {
    const { attempts: _drop, ...v1 } = structuredClone(v2Save)
    const out = migrateSave(v1, 1)
    expect(out.attempts).toEqual([])
    expect((out.settings as { navPinned: boolean }).navPinned).toBe(false)
    expect(out.progress).toEqual(v2Save.progress)
  })

  it('keeps a pin choice that is already saved', () => {
    const out = migrateSave({ ...v2Save, settings: { ...v2Save.settings, navPinned: true } }, 2)
    expect((out.settings as { navPinned: boolean }).navPinned).toBe(true)
  })

  it('tolerates damaged saves', () => {
    expect(migrateSave(null, 0)).toEqual({ attempts: [], settings: { navPinned: false, theme: 'system', textSize: 'standard' } })
    expect((migrateSave({ settings: ['bad'] }, 2).settings as object)).toEqual({ navPinned: false, theme: 'system', textSize: 'standard' })
  })
})

describe('v3 → v4 display settings', () => {
  it('keeps a valid theme, adds standard text size, and resets an unknown theme to Match device', () => {
    const v3 = { ...structuredClone(v2Save), settings: { ...v2Save.settings, navPinned: true } }
    expect(migrateSave(v3, 3).settings).toEqual({ ...v3.settings, textSize: 'standard' })
    expect((migrateSave({ settings: { theme: 'neon', textSize: 'huge' } }, 3).settings as object)).toEqual({ theme: 'system', textSize: 'standard' })
    expect((migrateSave({ settings: { theme: 'sepia', textSize: 'larger' } }, 3).settings as object)).toEqual({ theme: 'sepia', textSize: 'larger' })
    expect(migrateSave(v3, 3).progress).toEqual(v2Save.progress)
  })
})

describe('last seven days (activity row)', () => {
  it('gives seven distinct consecutive dates across a daylight-saving change', () => {
    // Node re-reads TZ when it changes; the app's tsconfig has no Node types, so reach process via globalThis.
    const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env
    const tz = env.TZ
    env.TZ = 'America/New_York' // clocks went back at 02:00 on 1 November 2026
    try {
      const days = lastDays(7, new Date(2026, 10, 1, 23, 30)).map((d) => today(d))
      expect(days).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
      const spring = lastDays(7, new Date(2026, 2, 8, 0, 30)).map((d) => today(d)) // clocks went forward on 8 March 2026
      expect(new Set(spring).size).toBe(7)
      expect(spring.at(-1)).toBe('2026-03-08')
    } finally { env.TZ = tz }
  })
})
