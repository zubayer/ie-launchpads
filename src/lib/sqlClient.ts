// Browser side of the SQL studio: one worker per page, a time limit per query, and a fresh worker after a timeout.
// When a worker is terminated, every request still waiting on it is settled and its timer cleared, so a stale
// timer can never terminate the replacement worker.
import { hintFor, type RunOutcome } from './sql'

const LIMIT_MS = 4000
type Pending = { resolve: (r: RunOutcome) => void; timer: ReturnType<typeof setTimeout>; worker: Worker }
let worker: Worker | null = null
let seq = 0
const pending = new Map<number, Pending>()

function settleAll(w: Worker, r: RunOutcome) {
  pending.forEach((p, id) => { if (p.worker === w) { clearTimeout(p.timer); pending.delete(id); p.resolve(r) } })
}

function start() {
  const w = new Worker(new URL('../workers/sql.worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = (e) => { const { id, ...rest } = e.data; const p = pending.get(id); if (p) { clearTimeout(p.timer); pending.delete(id); p.resolve(rest as RunOutcome) } }
  w.onerror = () => settleAll(w, { ok: false, error: 'The SQL engine could not start in this browser.' })
  worker = w
  return w
}

function send(type: 'run' | 'reset', sql?: string): Promise<RunOutcome> {
  const w = worker ?? start()
  const id = ++seq
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!pending.has(id)) return
      const p = pending.get(id)!
      pending.delete(id)
      p.resolve({ ok: false, error: `Stopped: the query timed out after ${LIMIT_MS / 1000} s. The practice database was reset.`, hint: hintFor('timed out') })
      // Replace the stuck engine; anything else queued on it is told why and settled now.
      settleAll(w, { ok: false, error: 'The SQL engine was restarted after a query timed out. Run this again.' })
      w.terminate()
      if (worker === w) worker = null
    }, LIMIT_MS)
    pending.set(id, { worker: w, timer, resolve: (r) => resolve(r.ok ? r : { ...r, hint: r.hint ?? hintFor(r.error) }) })
    w.postMessage({ id, type, sql })
  })
}

export const runSql = (sql: string) => send('run', sql)
export const resetDb = () => send('reset')
