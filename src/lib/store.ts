import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newCard, schedule, type Rating, type SrsCard } from './srs'

export interface ConceptProgress {
  opened?: number // first opened
  layers?: number // deepest layer reached (index)
  results?: number[] // last quiz results 1/0 (max 8)
  days?: string[] // distinct days answered correctly
  teach?: string // teach-back text
}

export interface StarStory {
  id: string
  title: string
  s: string
  t: string
  a: string
  r: string
  tags: string[]
  updated: number
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  dailyNew: number
  path: string | null // role path id
  planStart: string // YYYY-MM-DD
  planEnd: string
  focusMin: number
  learnMode?: string // learning mode id (src/lib/modes.ts)
  jobLocation?: string // optional city/state for job-board links
  sessionMin?: number // preferred study session length for Do next (5, 15, 30 or 60)
  navPinned?: boolean // desktop: keep the menu docked open (default: hidden, slides in from the left edge)
}

/** A wrong answer kept for later review (error notebook). */
export interface Mistake {
  id: string
  concept: string
  prompt: string
  given: string
  correct: string
  explain: string
  at: number
  resolved?: number // when the learner marked it understood
}

/** Kinds of evidence a learner can show for a concept (EDU-03). Opening a page is engagement, not evidence. */
export type Dimension = 'recall' | 'explain' | 'calculate' | 'implement' | 'apply' | 'communicate'
/** One answered item: what was asked, how it went, and when. */
export interface Attempt {
  item: string // stable item id, e.g. "lean-throughput:takt"
  concept: string
  dim: Dimension
  correct: boolean
  at: number
  provenance?: 'self-assessed' | 'objective' | 'external-review' // absent on legacy evidence; do not infer verification
  variant?: number // seed of a generated question
  given?: string
  confidence?: 1 | 2 | 3 // guessing, unsure, sure
}

interface State {
  progress: Record<string, ConceptProgress>
  cards: Record<string, SrsCard> // key = conceptId
  activity: Record<string, number> // day -> actions
  ratings: Record<string, Record<string, number>> // day -> skill -> 1..5
  stories: StarStory[]
  bookmarks: string[]
  settings: Settings
  mockLog: { q: string; rating: number; at: number }[]
  mistakes: Mistake[]
  pinnedFormulas: string[]
  attempts: Attempt[]
  recordAttempt: (a: Omit<Attempt, 'at'>) => void
  togglePinnedFormula: (id: string) => void
  logMistake: (m: Omit<Mistake, 'id' | 'at'>) => void
  resolveMistake: (id: string, resolved: boolean) => void
  clearResolved: () => void
  open: (id: string) => void
  reachLayer: (id: string, layer: number) => void
  addCard: (id: string) => void
  rate: (id: string, r: Rating) => void
  quizResult: (id: string, correct: boolean) => void
  setTeach: (id: string, text: string) => void
  toggleBookmark: (id: string) => void
  saveStory: (s: StarStory) => void
  deleteStory: (id: string) => void
  setSettings: (s: Partial<Settings>) => void
  rateSkill: (skill: string, v: number) => void
  logMock: (q: string, rating: number) => void
  importAll: (json: string) => void
  reset: () => void
}

export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

const defaultSettings: Settings = {
  theme: 'system',
  dailyNew: 5,
  path: null,
  planStart: today(),
  planEnd: today(new Date(Date.now() + 90 * 86400000)),
  focusMin: 25,
  navPinned: false,
}

/**
 * Upgrade a save written by an older version of the app. Never drops learner data.
 * v0 → v1 changed no fields. v1 → v2 adds `attempts` (EDU-03 evidence); older saves start with none.
 * v2 → v3 adds `settings.navPinned` (auto-hide menu); older saves start unpinned, so the menu hides by default.
 */
export function migrateSave(persisted: unknown, version: number): Record<string, unknown> {
  let s: Record<string, unknown> = persisted && typeof persisted === 'object' ? { ...(persisted as Record<string, unknown>) } : {}
  if (version < 2) s = { attempts: [], ...s }
  if (version < 3) {
    const settings = s.settings && typeof s.settings === 'object' && !Array.isArray(s.settings) ? (s.settings as Record<string, unknown>) : {}
    s = { ...s, settings: { ...settings, navPinned: typeof settings.navPinned === 'boolean' ? settings.navPinned : false } }
  }
  return s
}

const bump = (a: Record<string, number>) => ({ ...a, [today()]: (a[today()] || 0) + 1 })

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      progress: {},
      cards: {},
      activity: {},
      mistakes: [],
      attempts: [],
      recordAttempt: (a) => set((s) => ({ attempts: [...s.attempts, { ...a, at: Date.now() }].slice(-3000), activity: bump(s.activity) })),
      pinnedFormulas: [],
      togglePinnedFormula: (id) => set((s) => ({ pinnedFormulas: s.pinnedFormulas.includes(id) ? s.pinnedFormulas.filter((x) => x !== id) : [...s.pinnedFormulas, id] })),
      logMistake: (m) => set((s) => ({ mistakes: [{ ...m, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now() }, ...s.mistakes].slice(0, 500) })),
      resolveMistake: (id, resolved) => set((s) => ({ mistakes: s.mistakes.map((x) => (x.id === id ? { ...x, resolved: resolved ? Date.now() : undefined } : x)) })),
      clearResolved: () => set((s) => ({ mistakes: s.mistakes.filter((x) => !x.resolved) })),
      ratings: {},
      stories: [],
      bookmarks: [],
      mockLog: [],
      settings: defaultSettings,
      open: (id) =>
        set((s) => (s.progress[id]?.opened ? s : { progress: { ...s.progress, [id]: { ...s.progress[id], opened: Date.now() } }, activity: bump(s.activity) })),
      reachLayer: (id, layer) =>
        set((s) => {
          const p = s.progress[id] || {}
          if ((p.layers ?? -1) >= layer) return s
          return { progress: { ...s.progress, [id]: { ...p, layers: layer } } }
        }),
      addCard: (id) => set((s) => (s.cards[id] ? s : { cards: { ...s.cards, [id]: newCard() } })),
      rate: (id, r) =>
        set((s) => ({ cards: { ...s.cards, [id]: schedule(s.cards[id] || newCard(), r) }, activity: bump(s.activity) })),
      quizResult: (id, correct) =>
        set((s) => {
          const p = s.progress[id] || {}
          const results = [...(p.results || []), correct ? 1 : 0].slice(-8)
          const days = correct ? Array.from(new Set([...(p.days || []), today()])) : p.days || []
          const cards = s.cards[id] ? s.cards : { ...s.cards, [id]: newCard() }
          return { progress: { ...s.progress, [id]: { ...p, results, days, opened: p.opened || Date.now() } }, cards, activity: bump(s.activity) }
        }),
      setTeach: (id, text) => set((s) => ({ progress: { ...s.progress, [id]: { ...s.progress[id], teach: text } } })),
      toggleBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id] })),
      saveStory: (st) => set((s) => ({ stories: [st, ...s.stories.filter((x) => x.id !== st.id)] })),
      deleteStory: (id) => set((s) => ({ stories: s.stories.filter((x) => x.id !== id) })),
      setSettings: (n) => set((s) => ({ settings: { ...s.settings, ...n } })),
      rateSkill: (skill, v) => set((s) => ({ ratings: { ...s.ratings, [today()]: { ...(s.ratings[today()] || {}), [skill]: v } } })),
      logMock: (q, rating) => set((s) => ({ mockLog: [...s.mockLog, { q, rating, at: Date.now() }].slice(-300), activity: bump(s.activity) })),
      importAll: (json) => {
        const data = JSON.parse(json)
        if (!data || typeof data !== 'object' || !('progress' in data)) throw new Error('This file is not an IE Launchpad progress export.')
        const attempts = Array.isArray(data.attempts) ? data.attempts.filter((a: Attempt) => a && typeof a.item === 'string' && typeof a.correct === 'boolean') : get().attempts
        set({ ...get(), ...data, attempts, settings: { ...defaultSettings, ...(data.settings || {}) } })
      },
      reset: () => set({ progress: {}, cards: {}, activity: {}, ratings: {}, stories: [], bookmarks: [], mockLog: [], mistakes: [], pinnedFormulas: [], attempts: [], settings: defaultSettings }),
    }),
    {
      name: 'ie-launchpads-v2',
      version: 3,
      migrate: (persisted, version) => migrateSave(persisted, version) as unknown as State,
      // Saved data can be partial (older versions, manual edits, an interrupted write). Keep what is valid,
      // fall back to defaults for the rest, so a damaged save can't crash a page.
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === 'object' ? persisted : {}) as Partial<State>
        const obj = <T,>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d)
        const arr = <T,>(v: unknown, d: T[]): T[] => (Array.isArray(v) ? (v as T[]) : d)
        return {
          ...current,
          progress: obj(p.progress, current.progress), cards: obj(p.cards, current.cards), activity: obj(p.activity, current.activity),
          ratings: obj(p.ratings, current.ratings), stories: arr(p.stories, current.stories), bookmarks: arr(p.bookmarks, current.bookmarks),
          mockLog: arr(p.mockLog, current.mockLog), mistakes: arr(p.mistakes, current.mistakes), pinnedFormulas: arr(p.pinnedFormulas, current.pinnedFormulas),
          attempts: arr<Attempt>(p.attempts, current.attempts).filter((a) => a && typeof a.item === 'string' && typeof a.correct === 'boolean'),
          settings: { ...defaultSettings, ...obj<Partial<Settings>>(p.settings, {}) },
        }
      },
    },
  ),
)

export type Status = 'new' | 'learning' | 'reviewing' | 'mastered'

export function statusOf(p: ConceptProgress | undefined, c: SrsCard | undefined): Status {
  if (!p?.opened && !c) return 'new'
  const res = p?.results || []
  const recent = res.slice(-5)
  const acc = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
  if ((c && c.interval >= 14) || (recent.length >= 3 && acc >= 0.8 && (p?.days?.length || 0) >= 2)) return 'mastered'
  if (c && c.reps > 0) return 'reviewing'
  return 'learning'
}

export function streak(activity: Record<string, number>): number {
  let n = 0
  const d = new Date()
  if (!activity[today(d)]) d.setDate(d.getDate() - 1)
  while (activity[today(d)]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
