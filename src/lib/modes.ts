// Learning modes change which lesson sections a topic shows, in what order, and how deep the text goes.
// Every topic keeps the same content; the mode picks a path through it.

export type ModeId = 'full' | 'quick' | 'beginner' | 'visual' | 'math' | 'work' | 'interview' | 'revision' | 'research'
export type Depth = 'short' | 'gentle' | 'full'

export interface LearnMode {
  id: ModeId
  name: string
  blurb: string
  /** Section ids in display order; sections a topic doesn't have are skipped. `null` = every section, default order. */
  order: string[] | null
  /** How much of the plain-meaning text to show: one line, one line + collapsed formal definition, or everything. */
  depth: Depth
  /** Reveal every worked-example step at once (for revision). */
  revealSteps?: boolean
}

/** Every section id a topic page can render, in the default order. */
export const ALL_SECTIONS = ['keyword', 'preview', 'plain', 'analogy', 'picture', 'why', 'math', 'algo', 'example', 'real', 'jobs', 'sim', 'try', 'interview', 'live', 'sources', 'more'] as const

export const MODES: LearnMode[] = [
  { id: 'full', name: 'Zero to mastery', blurb: 'Every section, from plain meaning to the math, the job and the interview.', order: null, depth: 'full' },
  { id: 'quick', name: 'Quick learn', blurb: 'The essentials in about three minutes: what it is, a picture and one check.', order: ['keyword', 'preview', 'plain', 'picture', 'try', 'more'], depth: 'short' },
  { id: 'beginner', name: 'Absolute beginner', blurb: 'Everyday words first: plain meaning, an analogy, a picture and a gentle example. The formal definition stays folded away.', order: ['keyword', 'preview', 'plain', 'analogy', 'picture', 'why', 'example', 'sim', 'try', 'more'], depth: 'gentle' },
  { id: 'visual', name: 'Visual', blurb: 'Diagrams, simulators and flowcharts first, words second.', order: ['keyword', 'picture', 'sim', 'algo', 'example', 'plain', 'analogy', 'try', 'more'], depth: 'short' },
  { id: 'math', name: 'Math deep dive', blurb: 'The formula, every variable, the worked numbers and the algorithm.', order: ['keyword', 'plain', 'math', 'example', 'algo', 'sim', 'try', 'sources', 'more'], depth: 'full' },
  { id: 'work', name: 'On the job', blurb: 'Where it shows up at work: the scenario, why it matters, the roles and tools, and the common mistakes.', order: ['keyword', 'plain', 'real', 'why', 'jobs', 'sim', 'example', 'interview', 'more'], depth: 'short' },
  { id: 'interview', name: 'Interview prep', blurb: 'Interview questions first, backed by the definition, a real scenario and the numbers.', order: ['keyword', 'plain', 'interview', 'real', 'why', 'example', 'math', 'jobs', 'try', 'more'], depth: 'full' },
  { id: 'revision', name: 'Revision', blurb: 'For topics you have met before: one line, the formula, the solved example and a recall check.', order: ['keyword', 'plain', 'math', 'example', 'try', 'interview', 'more'], depth: 'short', revealSteps: true },
  { id: 'research', name: 'Research', blurb: 'What Wikipedia, research papers and practitioners say, with the cited sources.', order: ['keyword', 'preview', 'plain', 'live', 'sources', 'more'], depth: 'full' },
]

export const MODE_MAP = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, LearnMode>
export const modeOf = (id: string | undefined): LearnMode => MODE_MAP[id as ModeId] || MODE_MAP.full

/** Apply a mode to the sections a topic actually has (given in default order). */
export function applyMode<T extends { id: string }>(available: T[], mode: LearnMode): T[] {
  if (!mode.order) return available
  const byId = new Map(available.map((s) => [s.id, s]))
  return mode.order.map((id) => byId.get(id)).filter((s): s is T => !!s)
}
