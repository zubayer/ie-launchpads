// Unit-aware numeric answers (EDU-03): parse "60 s", "1 min", "84.6 %", "4 days"; convert within a
// dimension; grade against a tolerance; recognise known misconceptions and say what went wrong.
import { today, type Attempt, type Dimension } from './store'

type Dim = 'time' | 'ratio' | 'count' | 'money'
const U: Record<string, { dim: Dim; f: number; label: string }> = {}
const add = (dim: Dim, f: number, label: string, ...names: string[]) => names.forEach((n) => { U[n] = { dim, f, label } })
add('time', 1, 's', 's', 'sec', 'secs', 'second', 'seconds')
add('time', 60, 'min', 'min', 'mins', 'minute', 'minutes')
add('time', 3600, 'h', 'h', 'hr', 'hrs', 'hour', 'hours')
add('time', 86400, 'days', 'd', 'day', 'days')
add('ratio', 0.01, '%', '%', 'percent', 'pct')
add('count', 1, 'units', 'unit', 'units', 'part', 'parts', 'piece', 'pieces', 'pcs', 'pc', 'job', 'jobs')
add('money', 1, '$', '$', 'usd', 'dollar', 'dollars')
const DIM_NAME: Record<Dim, string> = { time: 'a time', ratio: 'a percentage', count: 'a count of units', money: 'an amount of money' }

export interface NumericAnswer {
  value: number
  unit: string // canonical unit of value, a key of U ('s', '%', 'days', 'units'…); '' for a pure number
  tol: { abs?: number; rel?: number }
  unitOptional?: boolean // accept a bare number (counts)
  /** Values a learner gets from a known misconception, in the answer's unit, with what to say. */
  traps?: { value: number; msg: string }[]
}
export type Grade =
  | { kind: 'correct'; msg: string }
  | { kind: 'wrong'; msg: string; trap?: boolean }
  | { kind: 'retry'; msg: string } // unreadable or missing unit: not counted as an attempt

export function parseQuantity(input: string): { x: number; unit: string } | null {
  const m = input.trim().replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/−/g, '-').match(/^\$?\s*(-?\d*\.?\d+(?:e-?\d+)?)\s*(.*)$/i)
  if (!m) return null
  const x = Number(m[1])
  if (!Number.isFinite(x)) return null
  let unit = m[2].trim().toLowerCase().replace(/\.$/, '').replace(/\s*(per|\/)\s*(unit|part|piece)s?$/, '').trim()
  if (input.trim().startsWith('$')) unit = '$'
  return { x, unit }
}

export function gradeNumeric(input: string, a: NumericAnswer): Grade {
  const q = parseQuantity(input)
  if (!q) return { kind: 'retry', msg: 'Write a number, then its unit, for example “60 s”.' }
  const want = a.unit ? U[a.unit] : null
  let x = q.x
  if (want) {
    if (!q.unit) {
      if (!a.unitOptional) return { kind: 'retry', msg: `Add the unit: the answer is ${DIM_NAME[want.dim]}.` }
    } else {
      const got = U[q.unit]
      if (!got) return { kind: 'retry', msg: `“${q.unit}” isn’t a unit this check knows. Try ${want.label}.` }
      if (got.dim !== want.dim) return { kind: 'wrong', msg: `Check the unit: ${q.unit} is ${DIM_NAME[got.dim]}, but the answer is ${DIM_NAME[want.dim]}.` }
      x = (q.x * got.f) / want.f
    }
  }
  const tol = Math.max(a.tol.abs ?? 0, (a.tol.rel ?? 0) * Math.abs(a.value))
  if (Math.abs(x - a.value) <= tol + 1e-12) return { kind: 'correct', msg: 'Correct.' }
  for (const t of a.traps || []) if (Math.abs(x - t.value) <= tol + 1e-12) return { kind: 'wrong', msg: t.msg, trap: true }
  return { kind: 'wrong', msg: x > a.value ? 'Too high.' : 'Too low.' }
}

// ---------- Evidence summary ----------
export const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: 'recall', label: 'Recall' },
  { id: 'explain', label: 'Explain' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'implement', label: 'Implement' },
  { id: 'apply', label: 'Apply' },
  { id: 'communicate', label: 'Communicate' },
]
export type Cell = { tries: number; correct: number; days: number; last: boolean } | null
const day = (t: number) => today(new Date(t))

/** Per-dimension evidence for one concept, from recorded attempts. */
export function evidence(attempts: Attempt[], concept: string): Record<Dimension, Cell> {
  const out = Object.fromEntries(DIMENSIONS.map((d) => [d.id, null])) as Record<Dimension, Cell>
  for (const d of DIMENSIONS) {
    const list = attempts.filter((a) => a.concept === concept && a.dim === d.id)
    if (!list.length) continue
    const ok = list.filter((a) => a.correct)
    out[d.id] = { tries: list.length, correct: ok.length, days: new Set(ok.map((a) => day(a.at))).size, last: list[list.length - 1].correct }
  }
  return out
}

/** Has this item ever been answered correctly? */
export const solved = (attempts: Attempt[], item: string) => attempts.some((a) => a.item === item && a.correct)
export const triesOf = (attempts: Attempt[], item: string) => attempts.filter((a) => a.item === item).length
/** Distinct calendar days on which an item (or any item with this prefix) was answered correctly. */
export const correctDays = (attempts: Attempt[], prefix: string) => new Set(attempts.filter((a) => a.item.startsWith(prefix) && a.correct).map((a) => day(a.at))).size
