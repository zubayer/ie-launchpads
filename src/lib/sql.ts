// Shared helpers for the SQL studio: result shapes, grading by result set, and plain-English error hints.
export type Cell = string | number | null
export interface QueryResult { columns: string[]; rows: Cell[][]; total: number; ms: number }
export type RunOutcome = { ok: true; results: QueryResult[] } | { ok: false; error: string; hint?: string }

const norm = (v: Cell) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)
const key = (row: Cell[]) => JSON.stringify(row.map(norm))

/** Same answer? Column names are ignored (aliases are free); row order only matters when the task asks for an order. */
export function sameResult(a: { rows: Cell[][]; columns: string[] }, b: { rows: Cell[][]; columns: string[] }, ordered = false): { same: boolean; why?: string } {
  if (a.columns.length !== b.columns.length) return { same: false, why: `Your result has ${a.columns.length} column${a.columns.length === 1 ? '' : 's'}; the answer has ${b.columns.length}.` }
  if (a.rows.length !== b.rows.length) return { same: false, why: `Your result has ${a.rows.length} row${a.rows.length === 1 ? '' : 's'}; the answer has ${b.rows.length}.` }
  const ka = a.rows.map(key), kb = b.rows.map(key)
  if (ordered) {
    const i = ka.findIndex((k, n) => k !== kb[n])
    if (i >= 0) return { same: false, why: kb.includes(ka[i]) ? 'The right rows, but not in the order the task asks for.' : `Row ${i + 1} differs from the answer.` }
    return { same: true }
  }
  const sa = [...ka].sort(), sb = [...kb].sort()
  return sa.every((k, n) => k === sb[n]) ? { same: true } : { same: false, why: 'Some values differ from the answer.' }
}

/** Turn SQLite error messages into a next step a learner can take. */
export function hintFor(error: string): string | undefined {
  const e = error.toLowerCase()
  if (e.includes('no such column')) return 'Check the column name against the schema panel. Text values need single quotes: \'M3\', not M3.'
  if (e.includes('no such table')) return 'Check the table name in the schema panel (they are plural: production, machines, defects…).'
  if (e.includes('misuse of aggregate')) return 'An aggregate (SUM, COUNT, AVG) can’t go in WHERE. Filter groups with HAVING instead.'
  if (e.includes('ambiguous column')) return 'Two joined tables have this column. Prefix it with the table or its alias, e.g. p.machine_id.'
  if (e.includes('syntax error')) return 'Look just before the word SQLite names: a missing comma, an extra comma before FROM, or a keyword out of order.'
  if (e.includes('readonly') || e.includes('read-only')) return undefined
  if (e.includes('timed out')) return 'The query ran too long and was stopped. A join without an ON condition, or a recursive CTE without a stop, can run forever.'
  return undefined
}
