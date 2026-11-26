import { describe, expect, it } from 'vitest'
import { migrateSave } from './store'

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
    expect(out.settings).toEqual({ ...v2Save.settings, navPinned: false })
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
    expect(migrateSave(null, 0)).toEqual({ attempts: [], settings: { navPinned: false } })
    expect((migrateSave({ settings: ['bad'] }, 2).settings as object)).toEqual({ navPinned: false })
  })
})
