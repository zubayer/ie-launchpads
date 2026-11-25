// Unit-aware numeric grading: preserve explicit rate dimensions instead of discarding denominators.
import { today, type Attempt, type Dimension } from './store'

type Unit = { dim: string; f: number; label: string }
const U = new Map<string, Unit>()
const add = (dim: string, f: number, label: string, ...names: string[]) => {
  for (const n of [label, ...names]) U.set(n, { dim, f, label })
}
add('time', 1, 's', 'sec', 'secs', 'second', 'seconds')
add('time', 60, 'min', 'mins', 'minute', 'minutes')
add('time', 3600, 'h', 'hr', 'hrs', 'hour', 'hours')
add('time', 86400, 'days', 'd', 'day')
add('ratio', 0.01, '%', 'percent', 'pct')
add('count', 1, 'units', 'unit', 'part', 'parts', 'piece', 'pieces', 'pcs', 'pc', 'job', 'jobs')
add('money', 1, '$', 'usd', 'dollar', 'dollars')
add('length', 1, 'm', 'meter', 'meters', 'metre', 'metres')
add('length', 0.01, 'cm', 'centimeter', 'centimeters')
add('length', 0.001, 'mm', 'millimeter', 'millimeters')
add('mass', 1, 'kg', 'kilogram', 'kilograms')
add('mass', 0.001, 'g', 'gram', 'grams')

const cleanUnit = (s: string) => s.trim().toLowerCase().replace(/\.$/, '').replace(/\s+per\s+/g, '/').replace(/\s*\/\s*/g, '/')
function unitOf(s: string): Unit | undefined {
  const name = cleanUnit(s)
  const direct = U.get(name)
  if (direct) return direct
  const parts = name.split('/')
  if (parts.length !== 2) return undefined
  const num = U.get(parts[0]), den = U.get(parts[1])
  if (!num || !den || num.dim === den.dim) return undefined
  return { dim: num.dim + '/' + den.dim, f: num.f / den.f, label: num.label + '/' + den.label }
}
export interface NumericAnswer {
  value: number
  unit: string // s, %, s/unit, units/h, $/unit; '' for a pure number
  tol: { abs?: number; rel?: number }
  unitOptional?: boolean
  /** Opt-in shorthand for questions such as takt: "60 s" means "60 s/unit". */
  acceptNumeratorOnly?: boolean
  traps?: { value: number; msg: string }[]
}
export type Grade =
  | { kind: 'correct'; msg: string }
  | { kind: 'wrong'; msg: string; trap?: boolean }
  | { kind: 'retry'; msg: string }

export function parseQuantity(input: string): { x: number; unit: string } | null {
  const m = input.trim().replace(/−/g, '-').match(/^(\$)?\s*([+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*)$/i)
  if (!m) return null
  const x = Number(m[2].replace(/,/g, ''))
  if (!Number.isFinite(x) || /^[\d,.]/.test(m[3])) return null
  const suffix = cleanUnit(m[3])
  return { x, unit: m[1] ? '$' + suffix : suffix }
}

export function gradeNumeric(input: string, a: NumericAnswer): Grade {
  const q = parseQuantity(input)
  if (!q) return { kind: 'retry', msg: 'Write a number, then its unit, for example “60 s”.' }
  const want = a.unit ? unitOf(a.unit) : undefined
  let x = q.x
  if (a.unit && !want) return { kind: 'retry', msg: 'This question has an unsupported answer unit. Please report it.' }
  if (want) {
    if (!q.unit) {
      if (!a.unitOptional) return { kind: 'retry', msg: 'Add the unit: try ' + a.unit + '.' }
    } else {
      let got = unitOf(q.unit)
      if (!got) return { kind: 'retry', msg: '“' + q.unit + '” isn’t a unit this check knows. Try ' + a.unit + '.' }
      if (a.acceptNumeratorOnly && want.dim.endsWith('/count') && got.dim === want.dim.split('/')[0]) got = { ...got, dim: want.dim }
      if (got.dim !== want.dim) return { kind: 'wrong', msg: 'Check the unit: ' + q.unit + ' is not compatible with ' + a.unit + '.' }
      x = (q.x * got.f) / want.f
    }
  } else if (q.unit) {
    return { kind: 'wrong', msg: 'This answer is a pure number; remove the unit.' }
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
