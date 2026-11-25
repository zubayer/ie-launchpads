import { useState } from 'react'
import { round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

interface Task { id: string; t: number; pre: string[]; desc: string }
const TASKS: Task[] = [
  { id: 'A', t: 45, pre: [], desc: 'Position rear axle, hand-fasten nuts' },
  { id: 'B', t: 11, pre: ['A'], desc: 'Insert rear axle bracket' },
  { id: 'C', t: 9, pre: ['B'], desc: 'Tighten axle bracket' },
  { id: 'D', t: 50, pre: [], desc: 'Position front axle, hand-fasten' },
  { id: 'E', t: 15, pre: ['D'], desc: 'Tighten front axle bolts' },
  { id: 'F', t: 12, pre: ['C'], desc: 'Insert rear wheel 1' },
  { id: 'G', t: 12, pre: ['C'], desc: 'Insert rear wheel 2' },
  { id: 'H', t: 12, pre: ['E'], desc: 'Insert front wheel 1' },
  { id: 'I', t: 12, pre: ['E'], desc: 'Insert front wheel 2' },
  { id: 'J', t: 8, pre: ['F', 'G', 'H', 'I'], desc: 'Install handle' },
  { id: 'K', t: 9, pre: ['J'], desc: 'Tighten bolts, inspect' },
]

/** Largest-candidate rule: fill each station with the longest feasible task first. */
export function autoBalance(tasks: Task[], takt: number): Record<string, number> {
  const asg: Record<string, number> = {}
  let st = 1, load = 0
  while (Object.keys(asg).length < tasks.length) {
    const ready = tasks.filter((k) => !(k.id in asg) && k.pre.every((p) => p in asg) && load + k.t <= takt + 1e-9).sort((a, b) => b.t - a.t)
    if (!ready.length) {
      if (load === 0) { // task longer than takt: give it its own station
        const next = tasks.filter((k) => !(k.id in asg) && k.pre.every((p) => p in asg)).sort((a, b) => b.t - a.t)[0]
        asg[next.id] = st
      }
      st++; load = 0; continue
    }
    asg[ready[0].id] = st
    load += ready[0].t
  }
  return asg
}

export default function LineBalancing() {
  const [minutes, setMinutes] = useState(420)
  const [demand, setDemand] = useState(500)
  const takt = (minutes * 60) / demand
  const [asg, setAsg] = useState<Record<string, number>>(() => autoBalance(TASKS, (420 * 60) / 500))
  const total = TASKS.reduce((s, k) => s + k.t, 0)
  const nSt = Math.max(1, ...Object.values(asg))
  const loads = Array.from({ length: nSt }, (_, i) => TASKS.filter((k) => asg[k.id] === i + 1).reduce((s, k) => s + k.t, 0))
  const cycle = Math.max(...loads)
  const eff = total / (nSt * cycle)
  const violations = TASKS.filter((k) => k.pre.some((p) => asg[p] > asg[k.id])).map((k) => k.id)
  const over = loads.map((l, i) => (l > takt + 1e-9 ? i + 1 : 0)).filter(Boolean)
  const minSt = Math.ceil(total / takt)
  const maxH = Math.max(takt, cycle) * 1.15
  return (
    <div className="space-y-4">
      <Predict prompt={`Total work content is ${total} s. With a takt time of about 50 s, what is the fewest stations possible — and can you actually reach it given the precedence rules?`} />
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <Panel className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Num label="Available time (min/day)" value={minutes} onChange={setMinutes} />
            <Num label="Demand (units/day)" value={demand} onChange={setDemand} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Takt time" value={`${round(takt, 1)} s`} />
            <Stat label="Theoretical min stations" value={minSt} />
            <Stat label="Stations used" value={nSt} tone={nSt === minSt ? 'good' : 'warn'} />
            <Stat label="Efficiency" value={`${round(eff * 100, 1)}%`} tone={eff > 0.9 ? 'good' : 'warn'} />
          </div>
          <p className="text-sm">Balance delay = {round((1 - eff) * 100, 1)}%. Bottleneck station time = {cycle} s{cycle > takt ? ' — slower than takt, so demand will not be met.' : '.'}</p>
          <button className="btn" onClick={() => setAsg(autoBalance(TASKS, takt))}>Auto-balance (largest candidate rule)</button>
        </Panel>
        <Panel>
          <svg viewBox={`0 0 ${Math.max(5, nSt) * 90 + 40} 240`} className="w-full" role="img" aria-label="Station loads vs takt time">
            {loads.map((l, i) => {
              let yAcc = 220
              return (
                <g key={i}>
                  {TASKS.filter((k) => asg[k.id] === i + 1).map((k) => {
                    const h = (k.t / maxH) * 200
                    yAcc -= h
                    return (
                      <g key={k.id}>
                        <rect x={30 + i * 90} y={yAcc} width={70} height={h - 1} fill={over.includes(i + 1) ? 'var(--color-sred)' : 'var(--color-sblue)'} opacity={0.8} />
                        {h > 13 && <text x={65 + i * 90} y={yAcc + h / 2 + 4} fontSize="11" textAnchor="middle" fill="#fff">{k.id} {k.t}</text>}
                      </g>
                    )
                  })}
                  <text x={65 + i * 90} y={236} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">S{i + 1}: {l}s</text>
                </g>
              )
            })}
            <line x1={20} x2={Math.max(5, nSt) * 90 + 30} y1={220 - (takt / maxH) * 200} y2={220 - (takt / maxH) * 200} stroke="var(--color-sred)" strokeDasharray="6 4" strokeWidth={2} />
            <text x={22} y={214 - (takt / maxH) * 200} fontSize="11" fill="var(--color-sred)">takt {round(takt, 1)} s</text>
          </svg>
        </Panel>
      </div>
      <Panel>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left"><th>Task</th><th>Description</th><th>Time (s)</th><th>Must follow</th><th>Station</th></tr></thead>
          <tbody>
            {TASKS.map((k) => (
              <tr key={k.id} className={`border-b border-line/60 ${violations.includes(k.id) ? 'bg-sred/10' : ''}`}>
                <td className="py-1 font-semibold">{k.id}</td><td>{k.desc}</td><td>{k.t}</td><td>{k.pre.join(', ') || '—'}</td>
                <td>
                  <select className="input !w-24 !py-1" value={asg[k.id]} onChange={(e) => setAsg({ ...asg, [k.id]: Number(e.target.value) })} aria-label={`Station for ${k.id}`}>
                    {Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>S{i + 1}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {violations.length > 0 && <p className="mt-2 text-sm font-semibold text-sred">Precedence broken for task {violations.join(', ')}: it sits at an earlier station than a task it depends on.</p>}
      </Panel>
      <Challenges items={['Can you reach the theoretical minimum of stations by hand?', 'Demand rises to 600/day. What happens to takt and the station count?', 'Task D (50 s) is close to takt. What lean options exist if takt falls below 50 s?']} />
    </div>
  )
}
