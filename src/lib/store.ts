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
  jobLocation?: string // optional city/state for job-board links
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
}

const bump = (a: Record<string, number>) => ({ ...a, [today()]: (a[today()] || 0) + 1 })

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      progress: {},
      cards: {},
      activity: {},
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
        set({ ...get(), ...data, settings: { ...defaultSettings, ...(data.settings || {}) } })
      },
      reset: () => set({ progress: {}, cards: {}, activity: {}, ratings: {}, stories: [], bookmarks: [], mockLog: [], settings: defaultSettings }),
    }),
    { name: 'ie-launchpads-v2' },
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
