import { useState } from 'react'
import { Challenges, Num, Panel } from './kit'

export interface Job { id: string; p: number; d: number } // processing time and due date, in days
export type Rule = 'FCFS' | 'SPT' | 'EDD'
export const RULES: { id: Rule; name: string; how: string }[] = [
  { id: 'FCFS', name: 'First come, first served', how: 'In arrival order' },
  { id: 'SPT', name: 'Shortest processing time', how: 'Shortest job first' },
  { id: 'EDD', name: 'Earliest due date', how: 'Earliest due date first' },
]

/** Job order under a dispatching rule (ties keep arrival order). */
export function sequence(rule: Rule, jobs: Job[]): Job[] {
  const idx = new Map(jobs.map((j, i) => [j.id, i]))
  const by = (k: (j: Job) => number) => [...jobs].sort((a, b) => k(a) - k(b) || idx.get(a.id)! - idx.get(b.id)!)
  return rule === 'SPT' ? by((j) => j.p) : rule === 'EDD' ? by((j) => j.d) : [...jobs]
}

/** Single-machine schedule from time 0: start/finish per job and the standard metrics. */
export function runSchedule(order: Job[]) {
  let t = 0
  const rows = order.map((j) => { const start = t; t += j.p; return { ...j, start, end: t, lateness: t - j.d, tardiness: Math.max(0, t - j.d) } })
  const n = rows.length || 1
  return {
    rows,
    avgFlow: rows.reduce((s, r) => s + r.end, 0) / n,
    avgTardiness: rows.reduce((s, r) => s + r.tardiness, 0) / n,
    late: rows.filter((r) => r.tardiness > 0).length,
    maxLateness: rows.length ? Math.max(...rows.map((r) => r.lateness)) : 0,
    makespan: t,
  }
}

export const DEFAULT_JOBS: Job[] = [
  { id: 'A', p: 6, d: 8 }, { id: 'B', p: 2, d: 6 }, { id: 'C', p: 8, d: 18 }, { id: 'D', p: 3, d: 15 }, { id: 'E', p: 9, d: 23 },
]
const COLORS = ['#60a5fa', '#f9a8d4', '#2dd4bf', '#facc15', '#c4b5fd', '#fb923c', '#a3e635', '#e2e8f0']
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1))

export default function Scheduling() {
  const [jobs, setJobs] = useState<Job[]>(DEFAULT_JOBS)
  const [guess, setGuess] = useState<Rule | null>(null)
  const results = RULES.map((r) => ({ ...r, ...runSchedule(sequence(r.id, jobs)) }))
  const span = Math.max(1, results[0].makespan)
  const best = (k: 'avgFlow' | 'avgTardiness' | 'late' | 'maxLateness') => Math.min(...results.map((r) => r[k]))
  const flowWinner = results.filter((r) => r.avgFlow === best('avgFlow')).map((r) => r.id)
  const color = (id: string) => COLORS[jobs.findIndex((j) => j.id === id) % COLORS.length]
  const set = (i: number, k: 'p' | 'd', v: number) => { setJobs(jobs.map((j, x) => (x === i ? { ...j, [k]: Math.max(k === 'p' ? 1 : 0, Math.round(v) || 0) } : j))); setGuess(null) }
  const add = () => { const id = String.fromCharCode(65 + jobs.length); setJobs([...jobs, { id, p: 4, d: span + 4 }]); setGuess(null) }
  const remove = (i: number) => { setJobs(jobs.filter((_, x) => x !== i).map((j, x) => ({ ...j, id: String.fromCharCode(65 + x) }))); setGuess(null) }
  const win = (r: (typeof results)[number], k: 'avgFlow' | 'avgTardiness' | 'late') => (r[k] === best(k) ? 'font-bold text-sgreen' : '')

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel>
          <p className="label mb-2">Jobs on one machine</p>
          <div className="space-y-2">
            {jobs.map((j, i) => (
              <div key={j.id} className="flex items-end gap-2">
                <span aria-hidden className="mb-2.5 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: color(j.id) }} />
                <span className="mb-2 w-5 font-bold">{j.id}</span>
                <Num label="Days of work" value={j.p} onChange={(v) => set(i, 'p', v)} min={1} max={30} />
                <Num label="Due on day" value={j.d} onChange={(v) => set(i, 'd', v)} min={0} max={200} />
                <button className="pop-btn mb-1" onClick={() => remove(i)} disabled={jobs.length <= 2} aria-label={`Remove job ${j.id}`}>×</button>
              </div>
            ))}
          </div>
          <button className="btn-ghost btn mt-3" onClick={add} disabled={jobs.length >= 8}>Add a job</button>
          <button className="btn-ghost btn ml-2 mt-3" onClick={() => { setJobs(DEFAULT_JOBS); setGuess(null) }}>Reset</button>
        </Panel>
        <Panel>
          <p className="label mb-2">The race: same jobs, three rules</p>
          <div className="space-y-3" role="list">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-3" role="listitem" aria-label={`${r.name}: order ${r.rows.map((x) => x.id).join(', ')}`}>
                <div className="w-24 shrink-0"><p className="font-extrabold">{r.id}</p><p className="text-xs text-ink-2">{r.how}</p></div>
                <div className="relative h-12 flex-1 rounded-md border border-line bg-paper">
                  {r.rows.map((x) => (
                    <div key={x.id} className={`absolute bottom-1 top-1 flex items-center justify-center gap-1 overflow-hidden rounded text-xs font-extrabold text-[#0f1522] ${x.tardiness > 0 ? 'ring-2 ring-inset ring-ink' : ''}`}
                      style={{ left: `${(x.start / span) * 100}%`, width: `${(x.p / span) * 100}%`, background: color(x.id) }} title={`${x.id}: days ${x.start}–${x.end}, due ${x.d}${x.tardiness ? `, ${x.tardiness} days late` : ''}`}>
                      {x.id}{x.tardiness > 0 && <span className="text-[10px]">+{x.tardiness}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-2">Bars run from day 0 to day {span}. An outline and “+n” mark a job that finishes n days after its due date.</p>
        </Panel>
      </div>

      {!guess ? (
        <div className="flex flex-wrap items-center gap-3 border-l-4 border-tape bg-tape/10 px-4 py-3">
          <p className="flex-1 text-[1.02rem]"><strong>Predict first:</strong> which rule gets jobs through the shop fastest on average?</p>
          {RULES.map((r) => <button key={r.id} className="btn-tape btn" onClick={() => setGuess(r.id)}>{r.id}</button>)}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[1.05rem]" aria-live="polite">
            <strong className={flowWinner.includes(guess) ? 'text-sgreen' : 'text-sorange'}>{flowWinner.includes(guess) ? `Right: ${guess}.` : `Not quite: ${flowWinner.join(' and ')} wins.`}</strong>{' '}
            Average flow time is {results.map((r) => `${fmt(r.avgFlow)} days for ${r.id}`).join(', ')}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead><tr className="text-left text-xs text-ink-2"><th scope="col" className="py-2">Rule</th><th scope="col" className="text-right">Average flow time</th><th scope="col" className="text-right">Average tardiness</th><th scope="col" className="text-right">Jobs late</th><th scope="col" className="text-right">Worst lateness</th><th scope="col" className="text-right">Makespan</th></tr></thead>
              <tbody className="tabular-nums">
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <th scope="row" className="py-2 text-left">{r.id}</th>
                    <td className={`text-right ${win(r, 'avgFlow')}`}>{fmt(r.avgFlow)} days</td>
                    <td className={`text-right ${win(r, 'avgTardiness')}`}>{fmt(r.avgTardiness)} days</td>
                    <td className={`text-right ${win(r, 'late')}`}>{r.late} of {jobs.length}</td>
                    <td className="text-right">{fmt(r.maxLateness)} days</td>
                    <td className="text-right">{r.makespan} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Panel><strong>SPT always wins average flow time</strong> on one machine: short jobs first means fewer jobs wait behind long ones.</Panel>
            <Panel><strong>EDD always minimises the worst lateness</strong> (here {fmt(results.find((r) => r.id === 'EDD')!.maxLateness)} days). It doesn’t always have the fewest late jobs; that takes Moore’s algorithm.</Panel>
            <Panel><strong>Makespan never moves</strong>: every order finishes on day {span}. Sequencing changes waiting, not total work.</Panel>
          </div>
          <button className="btn-ghost btn" onClick={() => setGuess(null)}>Predict again</button>
        </div>
      )}
      <Challenges items={[
        'Make SPT finish a job late that EDD finishes on time. Which job did you change, and why?',
        'Add a long job with an early due date. Which rule suffers most on average tardiness?',
        'Make all due dates equal. What happens to EDD’s order, and to its results?',
      ]} />
    </div>
  )
}
