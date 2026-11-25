// SM-2 style spaced repetition (the algorithm behind Anki's classic scheduler).
export interface SrsCard {
  ease: number // ease factor, starts 2.5
  interval: number // days
  reps: number
  lapses: number
  due: number // epoch ms
  last?: number
}

export type Rating = 0 | 1 | 2 | 3 // Again, Hard, Good, Easy
export const RATING_LABEL = ['Again', 'Hard', 'Good', 'Easy'] as const
const DAY = 86_400_000

export function newCard(now = Date.now()): SrsCard {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now }
}

export function schedule(card: SrsCard, rating: Rating, now = Date.now()): SrsCard {
  let { ease, interval, reps, lapses } = card
  if (rating === 0) {
    return { ease: Math.max(1.3, ease - 0.2), interval: 0, reps: 0, lapses: lapses + 1, due: now + 10 * 60_000, last: now }
  }
  if (reps === 0) interval = rating === 3 ? 4 : rating === 1 ? 1 : 1
  else if (reps === 1) interval = rating === 3 ? 8 : rating === 1 ? 3 : 6
  else interval = Math.round(interval * ease * (rating === 1 ? 0.6 : rating === 3 ? 1.3 : 1))
  if (rating === 1) ease = Math.max(1.3, ease - 0.15)
  if (rating === 3) ease = ease + 0.15
  interval = Math.max(1, interval)
  return { ease, interval, reps: reps + 1, lapses, due: now + interval * DAY, last: now }
}

/** Preview the interval each rating would give — shown on the rating buttons. */
export function previewIntervals(card: SrsCard, now = Date.now()): string[] {
  return ([0, 1, 2, 3] as Rating[]).map((r) => {
    const n = schedule(card, r, now)
    if (r === 0) return '10 min'
    return n.interval === 1 ? '1 day' : `${n.interval} days`
  })
}

export const isDue = (c: SrsCard, now = Date.now()) => c.due <= now
