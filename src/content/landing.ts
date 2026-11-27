/**
 * Landing-page topic cards. Each `result` repeats the answer of that lesson's own worked example
 * (which `npm test` recomputes); `src/content/landing.test.ts` fails if a lesson's answer stops
 * containing these numbers, so the front page can't drift from the lessons.
 */
export interface HeroCard {
  id: string // lesson id
  title: string
  result: string // shown in the result chip
  /** Substrings that must appear in the worked-example answer of each listed lesson. */
  mustMatch: { id: string; text: string }[]
  to?: string // defaults to the lesson
  visual: 'formula' | 'bell' | 'bars' | 'ladder'
  /** A shorter form of the lesson's formula that fits a small card. */
  tex?: string
}

export const HERO_CARDS: HeroCard[] = [
  { id: 'lean.takt-time', title: 'Takt time', result: '60 s per unit', visual: 'formula', tex: '\\text{Takt}=\\dfrac{\\text{available time}}{\\text{customer demand}}', mustMatch: [{ id: 'lean.takt-time', text: '60 seconds per unit' }] },
  { id: 'quality.cpk', title: 'Cp / Cpk', result: 'Cp ≈ 1.33 · Cpk ≈ 0.89', visual: 'bell', mustMatch: [{ id: 'quality.cp', text: '1.33' }, { id: 'quality.cpk', text: '0.89' }] },
  { id: 'engecon.npv', title: 'NPV', result: 'NPV ≈ +$5,489, accept', visual: 'bars', mustMatch: [{ id: 'engecon.npv', text: '5,489' }] },
  { id: 'automation.ladder-logic', title: 'PLC ladder logic', result: 'Start/stop seal-in', visual: 'ladder', to: '/studio/plc/sealin', mustMatch: [] },
]

/** The twelve domains shown as cards (all 22 stay one click away). */
export const LANDING_DOMAINS = ['lean', 'quality', 'stats', 'or', 'engecon', 'manufacturing', 'automation', 'scm', 'ergo', 'reliability', 'safety', 'datasci'] as const
