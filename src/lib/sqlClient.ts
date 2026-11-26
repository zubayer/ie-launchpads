// Browser side of the SQL studio: one worker per page, a time limit per query, and a fresh worker after a timeout.
import { hintFor, type RunOutcome } from './sql'

const LIMIT_MS = 4000
let worker: Worker | null = null
let seq = 0
const pending = new Map<number, (r: RunOutcome) => void>()

function start() {
  worker = new Worker(new URL('../workers/sql.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => { const { id, ...rest } = e.data; pending.get(id)?.(rest as RunOutcome); pending.delete(id) }
  worker.onerror = () => { pending.forEach((f) => f({ ok: false, error: 'The SQL engine could not start in this browser.' })); pending.clear() }
}

function send(type: 'run' | 'reset', sql?: string): Promise<RunOutcome> {
  if (!worker) start()
  const id = ++seq
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!pending.has(id)) return
      pending.delete(id)
      worker?.terminate(); worker = null // the next query starts a fresh engine with a fresh copy of the data
      resolve({ ok: false, error: `Stopped: the query timed out after ${LIMIT_MS / 1000} s. The practice database was reset.`, hint: hintFor('timed out') })
    }, LIMIT_MS)
    pending.set(id, (r) => { clearTimeout(timer); resolve(r.ok ? r : { ...r, hint: r.hint ?? hintFor(r.error) }) })
    worker!.postMessage({ id, type, sql })
  })
}

export const runSql = (sql: string) => send('run', sql)
export const resetDb = () => send('reset')
