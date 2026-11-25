import { useMemo, useState } from 'react'
import { makeRng, mean, round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

interface T { name: string; a: number; m: number; b: number; path: 1 | 2 | 0 } // 0 = common
const INIT: T[] = [
  { name: 'Site survey', a: 2, m: 3, b: 6, path: 0 },
  { name: 'Equipment delivery', a: 4, m: 6, b: 14, path: 1 },
  { name: 'Floor prep & utilities', a: 3, m: 5, b: 8, path: 2 },
  { name: 'Install line', a: 3, m: 4, b: 7, path: 0 },
  { name: 'Commission & ramp-up', a: 2, m: 3, b: 8, path: 0 },
]

/** Inverse-CDF sample from a triangular(a, m, b) distribution. */
export function tri(u: number, a: number, m: number, b: number) {
  const fc = (m - a) / (b - a)
  return u < fc ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m))
}

export default function MonteCarlo() {
  const [tasks, setTasks] = useState(INIT)
  const [runs, setRuns] = useState(5000)
  const [deadline, setDeadline] = useState(18)
  const [seed, setSeed] = useState(1)
  const sims = useMemo(() => {
    const r = makeRng(seed)
    return Array.from({ length: runs }, () => {
      const d = tasks.map((t) => tri(r.u(), t.a, t.m, t.b))
      const common = d.filter((_, i) => tasks[i].path === 0).reduce((s, v) => s + v, 0)
      const p1 = d.filter((_, i) => tasks[i].path === 1).reduce((s, v) => s + v, 0)
      const p2 = d.filter((_, i) => tasks[i].path === 2).reduce((s, v) => s + v, 0)
      return common + Math.max(p1, p2)
    }).sort((a, b) => a - b)
  }, [tasks, runs, seed])
  const det = tasks.filter((t) => t.path === 0).reduce((s, t) => s + t.m, 0) + Math.max(...[1, 2].map((p) => tasks.filter((t) => t.path === p).reduce((s, t) => s + t.m, 0)))
  const pOk = sims.filter((v) => v <= deadline).length / sims.length
  const pct = (q: number) => sims[Math.min(sims.length - 1, Math.floor(q * sims.length))]
  const lo = sims[0], hi = sims[sims.length - 1], bins = 40
  const counts = Array(bins).fill(0)
  sims.forEach((v) => counts[Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins))]++)
  const maxC = Math.max(...counts)
  const set = (i: number, f: Partial<T>) => setTasks(tasks.map((t, k) => (k === i ? { ...t, ...f } : t)))
  return (
    <div className="space-y-4">
      <Predict prompt={`Adding up the most-likely durations gives ${det} weeks. Is the chance of finishing in ${det} weeks closer to 50%, or much lower?`} />
      <Panel>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left"><th>Task</th><th>Min</th><th>Most likely</th><th>Max</th><th>Path</th></tr></thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1">{t.name}</td>
                {(['a', 'm', 'b'] as const).map((k) => <td key={k}><input type="number" className="input !w-20 !py-1" value={t[k]} onChange={(e) => set(i, { [k]: Number(e.target.value) })} aria-label={k} /></td>)}
                <td className="text-ink-2">{t.path === 0 ? 'in series' : `parallel branch ${t.path}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-2">Delivery and floor prep run in parallel; the project waits for the slower one (merge bias). Durations are triangular(min, most likely, max) in weeks.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Panel>
          <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label="Histogram of simulated project durations">
            {counts.map((c, i) => {
              const v = lo + ((i + 0.5) / bins) * (hi - lo)
              return <rect key={i} x={10 + i * 14.5} y={190 - (c / maxC) * 170} width={13} height={(c / maxC) * 170} fill={v <= deadline ? 'var(--color-sgreen)' : 'var(--color-sred)'} opacity={0.75} />
            })}
            <line x1={10} x2={590} y1={190} y2={190} stroke="var(--color-line)" />
            <text x={10} y={208} fontSize="11" fill="var(--color-ink-2)">{round(lo, 1)} wk</text>
            <text x={590} y={208} fontSize="11" textAnchor="end" fill="var(--color-ink-2)">{round(hi, 1)} wk</text>
          </svg>
        </Panel>
        <Panel className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Num label="Deadline (weeks)" value={deadline} onChange={setDeadline} step={0.5} />
            <Num label="Runs" value={runs} onChange={(v) => setRuns(Math.min(50000, Math.max(100, v)))} step={1000} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="P(on time)" value={`${round(pOk * 100, 1)}%`} tone={pOk > 0.8 ? 'good' : pOk > 0.5 ? 'warn' : 'bad'} />
            <Stat label="Mean duration" value={`${round(mean(sims), 2)} wk`} />
            <Stat label="P50" value={`${round(pct(0.5), 2)} wk`} />
            <Stat label="P90 (commit to this)" value={`${round(pct(0.9), 2)} wk`} />
          </div>
          <button className="btn-ghost btn !py-1 text-sm" onClick={() => setSeed((s) => s + 1)}>Re-run</button>
        </Panel>
      </div>
      <Challenges items={['What is P(finish ≤ most-likely total)? Why is it so low?', 'Cut the maximum on equipment delivery from 14 to 8 weeks. How much does P90 move?', 'Explain merge bias to a project sponsor in two sentences.']} />
    </div>
  )
}
