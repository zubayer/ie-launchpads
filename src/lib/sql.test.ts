import { beforeAll, describe, expect, it } from 'vitest'
import initSqlJs, { type SqlJsStatic } from 'sql.js'
import { MACHINES, PRODUCTION, DEFECTS, DOWNTIME, PRODUCTS, WORK_ORDERS, SCHEMA, plantSql } from '../content/sql/plant'
import { SQL_LESSONS } from '../content/sql/course'
import { RESULTS } from '../content/sql/results'
import { CONCEPT_MAP } from '../content/full'
import { hintFor, sameResult, type Cell } from './sql'
import { DEEP_DIVE } from '../content/deepDives'

let SQL: SqlJsStatic
beforeAll(async () => { SQL = await initSqlJs() })
const run = (sql: string): { columns: string[]; rows: Cell[][] } | { error: string } => {
  const db = new SQL.Database(); db.run(plantSql())
  try { const r = db.exec(sql); const last = r[r.length - 1]; return last ? { columns: last.columns, rows: last.values as Cell[][] } : { columns: [], rows: [] } }
  catch (e) { return { error: (e as Error).message } }
  finally { db.close() }
}
const ok = (r: ReturnType<typeof run>) => { if ('error' in r) throw new Error(r.error); return r }

describe('practice database', () => {
  it('matches its documented schema', () => {
    const db = new SQL.Database(); db.run(plantSql())
    SCHEMA.forEach((t) => {
      const cols = db.exec(`PRAGMA table_info(${t.table})`)[0].values.map((v) => [v[1], v[2]])
      expect(cols, t.table).toEqual(t.columns.map(([n, type]) => [n, type]))
    })
  })
  it('contains exactly the deliberate data problems the data-quality lesson teaches', () => {
    const key = (r: (typeof PRODUCTION)[number]) => `${r.machine_id}|${r.run_date}|${r.shift}`
    const keys = PRODUCTION.map(key)
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual(['M3|2026-10-03|Day'])
    expect(DEFECTS.filter((d) => !PRODUCTION.some((p) => p.run_id === d.run_id)).map((d) => d.run_id)).toEqual([999])
    expect(PRODUCTION.filter((p) => p.down_min === null).length).toBe(1)
    expect(DOWNTIME.filter((d) => d.reason === null).length).toBe(2)
    expect(MACHINES.filter((m) => !PRODUCTION.some((p) => p.machine_id === m.machine_id)).map((m) => m.machine_id)).toEqual(['M6'])
    // apart from the duplicate (which has no defects logged), defects reconcile with scrap on every run
    PRODUCTION.filter((p) => p.run_id !== 81).forEach((p) => expect(DEFECTS.filter((d) => d.run_id === p.run_id).reduce((s, d) => s + d.qty, 0), `run ${p.run_id}`).toBe(p.scrap_qty))
  })
})

describe('SQL course', () => {
  it('every stored result table matches a fresh run of its query', () => {
    const bad: string[] = []
    const cmp = (key: string, sql: string) => {
      const got = run(sql), want = RESULTS[key]
      if (!want) { bad.push(`${key}: no stored result (run npm run docs)`); return }
      if ('error' in want || 'error' in got) { if (!('error' in want && 'error' in got && want.error === got.error)) bad.push(`${key}: ${JSON.stringify('error' in got ? got.error : 'ok')} vs stored ${JSON.stringify('error' in want ? want.error : 'ok')}`); return }
      if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${key}: result changed`)
    }
    SQL_LESSONS.forEach((l) => {
      l.examples.forEach((e) => cmp(e.id, e.sql))
      l.mistakes.forEach((m) => { cmp(`${m.id}:wrong`, m.wrong); cmp(`${m.id}:fix`, m.fix) })
      l.tasks.forEach((t) => cmp(t.id, t.solution))
    })
    expect(bad).toEqual([])
  })

  it('examples give the same result when run one after another on one database, twice (as in the browser playground)', () => {
    const db = new SQL.Database(); db.run(plantSql())
    const bad: string[] = []
    for (let pass = 0; pass < 2; pass++) SQL_LESSONS.forEach((l) => l.examples.forEach((e) => {
      try {
        const r = db.exec(e.sql); const last = r[r.length - 1]
        const want = RESULTS[e.id]
        if ('error' in want || JSON.stringify({ columns: last.columns, rows: last.values }) !== JSON.stringify(want)) bad.push(`${e.id} (pass ${pass + 1}): result depends on what ran before`)
      } catch (err) { bad.push(`${e.id} (pass ${pass + 1}): ${(err as Error).message}`) }
    }))
    db.close()
    expect(bad).toEqual([])
  })

  it('examples and task solutions run and return rows; each mistake fails or differs from its fix as described', () => {
    const bad: string[] = []
    SQL_LESSONS.forEach((l) => {
      if (!CONCEPT_MAP[l.concept]) bad.push(`${l.id}: unknown concept ${l.concept}`)
      ;[...l.examples.map((e) => [e.id, e.sql]), ...l.tasks.map((t) => [t.id, t.solution])].forEach(([id, sql]) => {
        const r = run(sql)
        if ('error' in r) bad.push(`${id}: ${r.error}`)
        else if (!r.rows.length) bad.push(`${id}: no rows`)
      })
      l.mistakes.forEach((m) => {
        const w = run(m.wrong), f = run(m.fix)
        if ('error' in f) bad.push(`${m.id}: the fix fails: ${f.error}`)
        if (m.fails) { if (!('error' in w)) bad.push(`${m.id}: expected the wrong query to fail`) }
        else if ('error' in w) bad.push(`${m.id}: wrong query fails, but the lesson says it runs: ${w.error}`)
        else if (!('error' in f) && sameResult(w, f, true).same) bad.push(`${m.id}: wrong and fixed queries give the same result`)
      })
    })
    expect(bad).toEqual([])
    const ids = SQL_LESSONS.flatMap((l) => [l.id, ...l.examples.map((e) => e.id), ...l.mistakes.map((m) => m.id), ...l.tasks.map((t) => t.id)])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every number in a takeaway is in that example’s result or in the reference tables', () => {
    const base = new Set<number>()
    const addNums = (v: unknown) => String(v).replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/g)?.forEach((n) => { base.add(Math.abs(Number(n))) })
    ;[...PRODUCTS, ...MACHINES, ...WORK_ORDERS].forEach((o) => Object.values(o).forEach(addNums))
    const bad: string[] = []
    SQL_LESSONS.forEach((l) => l.examples.forEach((e) => {
      const r = RESULTS[e.id]
      if ('error' in r) return
      const seen = new Set(base)
      r.rows.flat().forEach(addNums)
      r.rows.flat().forEach((v) => String(v).replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/g)?.forEach((n) => seen.add(Math.abs(Number(n)))))
      const text = e.takeaway.replace(/October \d+/g, '').replace(/\b[MLP]\d+\b/g, '').replace(/(\d),(\d{3})/g, '$1$2').replace(/−/g, '-')
      ;(text.match(/\d+(?:\.\d+)?/g) || []).map(Number).forEach((n) => { if (!seen.has(n)) bad.push(`${e.id}: ${n} is not in its result table`) })
    }))
    expect(bad).toEqual([])
  })

  it('independent check: key tables recomputed in plain JavaScript match SQLite', () => {
    const pct = (rows: typeof PRODUCTION) => Math.round((10000 * rows.reduce((s, r) => s + r.scrap_qty, 0)) / rows.reduce((s, r) => s + r.good_qty + r.scrap_qty, 0)) / 100
    const byMachine = ok(run(SQL_LESSONS.find((l) => l.id === 'group')!.examples[0].sql))
    byMachine.rows.forEach(([m, made, scrap, p]) => {
      const rows = PRODUCTION.filter((r) => r.machine_id === m)
      expect(made).toBe(rows.reduce((s, r) => s + r.good_qty + r.scrap_qty, 0))
      expect(scrap).toBe(rows.reduce((s, r) => s + r.scrap_qty, 0))
      expect(p).toBe(pct(rows))
    })
    const byLine = ok(run(SQL_LESSONS.find((l) => l.id === 'joins')!.examples[0].sql))
    byLine.rows.forEach(([line, , p]) => expect(p).toBe(pct(PRODUCTION.filter((r) => MACHINES.find((m) => m.machine_id === r.machine_id)!.line === line))))
    const noDup = ok(run('SELECT ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) FROM production WHERE run_id <> 81'))
    expect(noDup.rows[0][0]).toBe(pct(PRODUCTION.filter((r) => r.run_id !== 81)))
  })
})

describe('grading and hints', () => {
  const r = (rows: Cell[][], columns = rows[0]?.map((_, i) => `c${i}`) ?? []) => ({ columns, rows })
  it('ignores column names and row order unless order is required', () => {
    expect(sameResult(r([[1, 'a'], [2, 'b']]), r([[2, 'b'], [1, 'a']])).same).toBe(true)
    expect(sameResult(r([[1, 'a'], [2, 'b']]), r([[2, 'b'], [1, 'a']]), true)).toMatchObject({ same: false, why: expect.stringMatching(/order/) })
    expect(sameResult(r([[0.1 + 0.2]]), r([[0.3]])).same).toBe(true)
    expect(sameResult(r([[1]]), r([[1, 2]])).why).toMatch(/column/)
    expect(sameResult(r([[1]]), r([[1], [2]])).why).toMatch(/row/)
  })
  it('a correct task answer written differently is accepted', () => {
    const t = SQL_LESSONS.find((l) => l.id === 'group')!.tasks[0]
    const mine = ok(run("SELECT shift AS s, SUM(good_qty) AS g, ROUND(SUM(scrap_qty) * 100.0 / SUM(scrap_qty + good_qty), 2) FROM production GROUP BY 1 ORDER BY 1 DESC"))
    expect(sameResult(mine, ok(run(t.solution)), t.ordered).same).toBe(true)
  })
  it('explains common errors', () => {
    expect(hintFor('no such column: M3')).toMatch(/quotes/)
    expect(hintFor('misuse of aggregate: SUM()')).toMatch(/HAVING/)
    expect(hintFor('ambiguous column name: machine_id')).toMatch(/alias/)
  })
})

describe('deep-dive links', () => {
  it('every SQL lesson is linked from its lesson page, and every link points at a real SQL lesson', () => {
    SQL_LESSONS.forEach((l) => expect(DEEP_DIVE[l.concept]?.some((d) => d.to === `/studio/sql/${l.id}`), l.id).toBe(true))
    Object.entries(DEEP_DIVE).forEach(([cid, links]) => {
      expect(CONCEPT_MAP[cid], cid).toBeTruthy()
      links.filter((d) => d.to.startsWith('/studio/sql')).forEach((d) => expect(SQL_LESSONS.some((l) => `/studio/sql/${l.id}` === d.to), d.to).toBe(true))
      links.forEach((d) => expect(d.to, cid).toMatch(/^\/studio\/(sql|plc|cad)\//))
    })
  })
})
