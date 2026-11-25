import { useState } from 'react'
import { Phi, round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

interface Task { id: string; name: string; o: number; m: number; p: number; pre: string[] }
const INIT: Task[] = [
  { id: 'A', name: 'Define requirements', o: 2, m: 4, p: 6, pre: [] },
  { id: 'B', name: 'Design new fixture', o: 3, m: 5, p: 9, pre: ['A'] },
  { id: 'C', name: 'Order robot cell', o: 6, m: 8, p: 16, pre: ['A'] },
  { id: 'D', name: 'Build fixture', o: 2, m: 3, p: 4, pre: ['B'] },
  { id: 'E', name: 'Install & wire cell', o: 3, m: 4, p: 7, pre: ['C', 'D'] },
  { id: 'F', name: 'Write PLC program', o: 3, m: 5, p: 7, pre: ['B'] },
  { id: 'G', name: 'Trial runs & PPAP', o: 2, m: 3, p: 6, pre: ['E', 'F'] },
]

export function cpm(tasks: { id: string; d: number; pre: string[] }[]) {
  const es: Record<string, number> = {}, ef: Record<string, number> = {}
  const order: string[] = []
  const seen = new Set<string>()
  const visit = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    tasks.find((t) => t.id === id)!.pre.forEach((p) => tasks.some((t) => t.id === p) && visit(p))
    order.push(id)
  }
  tasks.forEach((t) => visit(t.id))
  for (const id of order) {
    const t = tasks.find((x) => x.id === id)!
    es[id] = Math.max(0, ...t.pre.filter((p) => p in ef).map((p) => ef[p]))
    ef[id] = es[id] + t.d
  }
  const end = Math.max(...Object.values(ef))
  const ls: Record<string, number> = {}, lf: Record<string, number> = {}
  for (const id of [...order].reverse()) {
    const succ = tasks.filter((t) => t.pre.includes(id))
    lf[id] = succ.length ? Math.min(...succ.map((s) => ls[s.id])) : end
    ls[id] = lf[id] - tasks.find((x) => x.id === id)!.d
  }
  return { es, ef, ls, lf, end, slack: Object.fromEntries(order.map((id) => [id, ls[id] - es[id]])) }
}

export default function Cpm() {
  const [tasks, setTasks] = useState(INIT)
  const [bac, setBac] = useState(120000)
  const [pctDone, setPctDone] = useState(40)
  const [spent, setSpent] = useState(55000)
  const [planPct, setPlanPct] = useState(50)
  const te = (t: Task) => (t.o + 4 * t.m + t.p) / 6
  const vr = (t: Task) => ((t.p - t.o) / 6) ** 2
  const r = cpm(tasks.map((t) => ({ id: t.id, d: te(t), pre: t.pre })))
  const crit = tasks.filter((t) => Math.abs(r.slack[t.id]) < 1e-9)
  const sdPath = Math.sqrt(crit.reduce((s, t) => s + vr(t), 0))
  const set = (i: number, f: Partial<Task>) => setTasks(tasks.map((t, k) => (k === i ? { ...t, ...f } : t)))
  const EV = (bac * pctDone) / 100, PV = (bac * planPct) / 100, AC = spent
  const CPI = EV / AC, SPI = EV / PV
  return (
    <div className="space-y-4">
      <Predict prompt="Ordering the robot cell takes the longest single task. Does that automatically make it critical?" />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-line text-left"><th>ID</th><th>Task</th><th>Optimistic</th><th>Most likely</th><th>Pessimistic</th><th>Predecessors</th><th>tₑ (wk)</th><th>ES–EF</th><th>LS–LF</th><th>Float</th></tr></thead>
            <tbody>
              {tasks.map((t, i) => {
                const isC = Math.abs(r.slack[t.id]) < 1e-9
                return (
                  <tr key={t.id} className={`border-b border-line/60 ${isC ? 'bg-sred/10' : ''}`}>
                    <td className="py-1 font-semibold">{t.id}</td>
                    <td><input className="input !py-1" value={t.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Task name" /></td>
                    {(['o', 'm', 'p'] as const).map((k) => <td key={k}><input type="number" className="input !w-16 !py-1" value={t[k]} min={0} onChange={(e) => set(i, { [k]: Number(e.target.value) })} aria-label={k} /></td>)}
                    <td><input className="input !w-20 !py-1" value={t.pre.join(',')} onChange={(e) => set(i, { pre: e.target.value.toUpperCase().split(/[ ,]+/).filter((p) => p && p !== t.id) })} aria-label="Predecessors" /></td>
                    <td>{round(te(t), 2)}</td>
                    <td>{round(r.es[t.id], 1)}–{round(r.ef[t.id], 1)}</td>
                    <td>{round(r.ls[t.id], 1)}–{round(r.lf[t.id], 1)}</td>
                    <td className={isC ? 'font-semibold text-sred' : ''}>{isC ? '0 (critical)' : round(r.slack[t.id], 1)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button className="btn-ghost btn mt-2 !py-1 text-sm" onClick={() => { const id = String.fromCharCode(65 + tasks.length); setTasks([...tasks, { id, name: 'New task', o: 1, m: 2, p: 3, pre: [tasks[tasks.length - 1].id] }]) }}>Add task</button>
      </Panel>
      <Panel>
        <p className="label mb-2">Gantt (early start), critical path in red</p>
        <div className="space-y-1">
          {tasks.map((t) => (
            <div key={t.id} className="grid grid-cols-[6rem_1fr] items-center gap-2 text-xs">
              <span className="truncate">{t.id} {t.name}</span>
              <div className="relative h-5 rounded-sm bg-line/40">
                <div className="absolute h-5 rounded-sm" style={{ left: `${(r.es[t.id] / r.end) * 100}%`, width: `${(te(t) / r.end) * 100}%`, background: Math.abs(r.slack[t.id]) < 1e-9 ? 'var(--color-sred)' : 'var(--color-sblue)' }} />
                {r.slack[t.id] > 1e-9 && <div className="absolute h-5 rounded-sm border border-dashed border-sblue" style={{ left: `${(r.ef[t.id] / r.end) * 100}%`, width: `${(r.slack[t.id] / r.end) * 100}%` }} />}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Expected duration" value={`${round(r.end, 2)} wk`} />
          <Stat label="Critical path" value={crit.map((t) => t.id).join('–')} />
          <Stat label="σ of critical path" value={`${round(sdPath, 2)} wk`} />
          <Stat label="P(finish ≤ 22 wk) (PERT)" value={`${round(100 * Phi((22 - r.end) / sdPath), 1)}%`} />
        </div>
        <p className="mt-2 text-xs text-ink-2">PERT: tₑ = (o + 4m + p)/6, σ² = ((p − o)/6)². Path variance is the sum of critical-task variances (assumes independence and one dominant path).</p>
      </Panel>
      <Panel>
        <p className="label mb-2">Earned value status</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Num label="Budget at completion (BAC $)" value={bac} onChange={setBac} />
          <Num label="Planned % complete today" value={planPct} onChange={setPlanPct} />
          <Num label="Actual % complete" value={pctDone} onChange={setPctDone} />
          <Num label="Actual cost to date (AC $)" value={spent} onChange={setSpent} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="EV / PV" value={`$${Math.round(EV).toLocaleString()} / $${Math.round(PV).toLocaleString()}`} />
          <Stat label="CPI = EV/AC" value={round(CPI, 2)} tone={CPI >= 1 ? 'good' : 'bad'} />
          <Stat label="SPI = EV/PV" value={round(SPI, 2)} tone={SPI >= 1 ? 'good' : 'bad'} />
          <Stat label="EAC = BAC/CPI" value={`$${Math.round(bac / CPI).toLocaleString()}`} />
        </div>
        <p className="mt-2 text-sm">{CPI < 1 ? 'Over budget' : 'Under budget'} and {SPI < 1 ? 'behind schedule' : 'ahead of schedule'}. CV = ${Math.round(EV - AC).toLocaleString()}, SV = ${Math.round(EV - PV).toLocaleString()}.</p>
      </Panel>
      <Challenges items={['Shorten task C by 4 weeks (expediting). Does the critical path change?', 'Which task has the most float? Could its resources help a critical task?', 'CPI = 0.73: explain to a sponsor what EAC tells them.']} />
    </div>
  )
}
