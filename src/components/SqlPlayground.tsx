import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { SCHEMA } from '../content/sql/plant'
import { resetDb, runSql } from '../lib/sqlClient'
import type { Cell, QueryResult, RunOutcome } from '../lib/sql'

/** A result table, used for live results and for the stored results on lesson pages. */
export function ResultTable({ columns, rows, total, caption }: { columns: string[]; rows: Cell[][]; total?: number; caption?: string }) {
  if (!columns.length) return <p className="text-sm text-ink-2">The statement ran. It returns no table.</p>
  const shown = total ?? rows.length
  return (
    <div className="overflow-x-auto rounded-md border border-line" tabIndex={0} role="region" aria-label={caption ?? 'Query result'}>
      <table className="w-full text-sm tabular-nums">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-paper/60"><tr>{columns.map((c, i) => <th key={i} scope="col" className="whitespace-nowrap px-2 py-1.5 text-left font-semibold">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((v, j) => <td key={j} className={`whitespace-nowrap px-2 py-1 ${typeof v === 'number' ? 'text-right' : ''}`}>{v === null ? <span className="italic text-ink-2">NULL</span> : typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(6) : String(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-2 py-1 text-xs text-ink-2">{shown} row{shown === 1 ? '' : 's'}{total !== undefined && total > rows.length ? `, showing the first ${rows.length}` : ''}</p>
    </div>
  )
}

export function SchemaPanel() {
  return (
    <div className="space-y-1.5 text-sm">
      {SCHEMA.map((t) => (
        <details key={t.table} className="rounded-md border border-line px-2 py-1">
          <summary className="cursor-pointer"><code className="font-semibold">{t.table}</code> <span className="text-ink-2">· {t.about}</span></summary>
          <ul className="mt-1 space-y-0.5 pb-1">{t.columns.map(([c, type, note]) => <li key={c}><code>{c}</code> <span className="text-xs text-ink-2">{type}{note ? ` · ${note}` : ''}</span></li>)}</ul>
        </details>
      ))}
    </div>
  )
}

/** Editor + run + result. `onRun` lets a practice task grade the result. */
export function SqlEditor({ initial, label = 'SQL query', onRun, runLabel = 'Run', rows = 6, autoRun = false }: {
  initial: string; label?: string; onRun?: (r: RunOutcome, sql: string) => void; runLabel?: string; rows?: number; autoRun?: boolean
}) {
  const id = useId()
  const [sql, setSql] = useState(initial)
  const [out, setOut] = useState<RunOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const first = useRef(true)
  useEffect(() => { setSql(initial); setOut(null) }, [initial])
  const run = async (text = sql) => {
    if (!text.trim() || busy) return
    setBusy(true)
    const r = await runSql(text)
    setBusy(false); setOut(r); onRun?.(r, text)
  }
  useEffect(() => { if (autoRun && first.current) { first.current = false; void run(initial) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void run() }
  }
  const last: QueryResult | undefined = out?.ok ? out.results[out.results.length - 1] : undefined
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} className="input mt-1 font-mono text-[0.9rem] leading-relaxed" rows={rows} spellCheck={false} value={sql} onChange={(e) => setSql(e.target.value)} onKeyDown={onKey} aria-describedby={`${id}-k`} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={() => void run()} disabled={busy}>{busy ? 'Running…' : runLabel}</button>
        <button className="btn-ghost btn" onClick={() => { setSql(initial); setOut(null) }}>Reset query</button>
        <span id={`${id}-k`} className="text-xs text-ink-2">Ctrl + Enter (⌘ + Enter) runs it.</span>
      </div>
      <div className="mt-3" aria-live="polite">
        {busy && !out && <p className="text-sm text-ink-2">Starting the SQL engine (first run only)…</p>}
        {out && !out.ok && (
          <div className="rounded-md border-l-4 border-sred bg-sred/5 px-3 py-2 text-sm">
            <p><strong>Error:</strong> <code>{out.error}</code></p>
            {out.hint && <p className="mt-1">{out.hint}</p>}
          </div>
        )}
        {last && <ResultTable columns={last.columns} rows={last.rows} total={last.total} />}
        {out?.ok && !last && <p className="text-sm text-ink-2">Done. The statement changed the practice database but returns no rows.</p>}
        {out?.ok && out.results.length > 1 && <p className="mt-1 text-xs text-ink-2">{out.results.length} statements returned tables; showing the last.</p>}
      </div>
    </div>
  )
}

/** The full playground: editor, schema and a reset for the practice database. */
export function SqlPlayground({ initial }: { initial: string }) {
  const [msg, setMsg] = useState('')
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <SqlEditor initial={initial} rows={8} />
      <aside aria-label="Tables in the practice database">
        <p className="label mb-1">Tables</p>
        <SchemaPanel />
        <button className="btn-ghost btn mt-2 !py-1.5 !text-sm" onClick={async () => { await resetDb(); setMsg('The practice database is back to its original data.') }}>Reset the database</button>
        <p className="mt-1 text-xs text-ink-2" aria-live="polite">{msg || 'Your changes (inserts, indexes) live only in this tab.'}</p>
      </aside>
    </div>
  )
}
