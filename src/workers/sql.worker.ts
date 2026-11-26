// Runs SQLite (sql.js, WebAssembly) off the main thread, on a private in-memory copy of the practice database.
// The page can terminate this worker if a query runs too long, so a runaway query can't freeze the tab.
import initSqlJs, { type Database } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { plantSql } from '../content/sql/plant'

const MAX_ROWS = 500
let db: Database | null = null
const ready = initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => {
  const open = () => { db?.close(); db = new SQL.Database(); db.run(plantSql()) }
  open()
  return open
})

self.onmessage = async (e: MessageEvent<{ id: number; type: 'run' | 'reset'; sql?: string }>) => {
  const { id, type, sql } = e.data
  try {
    const open = await ready
    if (type === 'reset') { open(); postMessage({ id, ok: true, results: [] }); return }
    const t0 = performance.now()
    const res = db!.exec(sql || '')
    const ms = performance.now() - t0
    postMessage({ id, ok: true, results: res.map((r) => ({ columns: r.columns, rows: r.values.slice(0, MAX_ROWS), total: r.values.length, ms })) })
  } catch (err) {
    postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
