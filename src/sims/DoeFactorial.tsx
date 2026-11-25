import { useMemo, useRef, useState } from 'react'
import { makeRng, mean, round } from '../lib/math'
import { Challenges, Panel, Predict, Stat } from './kit'

const FACTORS = [
  { k: 'A', name: 'RF power', lo: '200 W', hi: '300 W' },
  { k: 'B', name: 'Chamber pressure', lo: '20 mTorr', hi: '40 mTorr' },
  { k: 'C', name: 'Gas flow', lo: '50 sccm', hi: '80 sccm' },
]
// Standard (Yates) order
const RUNS = [[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]]
const LABEL = ['(1)', 'a', 'b', 'ab', 'c', 'ac', 'bc', 'abc']
const TERMS: { name: string; f: (r: number[]) => number }[] = [
  { name: 'A', f: (r) => r[0] }, { name: 'B', f: (r) => r[1] }, { name: 'C', f: (r) => r[2] },
  { name: 'AB', f: (r) => r[0] * r[1] }, { name: 'AC', f: (r) => r[0] * r[2] }, { name: 'BC', f: (r) => r[1] * r[2] },
  { name: 'ABC', f: (r) => r[0] * r[1] * r[2] },
]
// Hidden "true" process (etch rate, nm/min)
const truth = (r: number[]) => 550 + 40 * r[0] + 15 * r[1] - 5 * r[2] + 25 * r[0] * r[1]

/** Effect = average response at + level minus average at − level. */
export function effects(runs: number[][], y: number[]) {
  return TERMS.map((t) => {
    const plus = y.filter((_, i) => t.f(runs[i]) > 0)
    const minus = y.filter((_, i) => t.f(runs[i]) < 0)
    return { name: t.name, effect: mean(plus) - mean(minus) }
  })
}

export default function DoeFactorial() {
  const rng = useRef(makeRng(11))
  const [reps, setReps] = useState(1)
  const [y, setY] = useState<(number[] | null)[]>(Array(8).fill(null))
  const order = useMemo(() => {
    const idx = [...Array(8).keys()]
    const r = makeRng(3 + reps)
    for (let i = 7; i > 0; i--) { const j = Math.floor(r.u() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    return idx
  }, [reps])
  const run = (i: number) => setY((prev) => prev.map((v, k) => (k === i ? Array.from({ length: reps }, () => round(truth(RUNS[i]) + rng.current.normal(0, 8), 1)) : v)))
  const done = y.every(Boolean)
  const avg = y.map((v) => (v ? mean(v) : NaN))
  const eff = done ? effects(RUNS, avg).sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)) : []
  const maxE = Math.max(1, ...eff.map((e) => Math.abs(e.effect)))
  // interaction plot A×B
  const cell = (a: number, b: number) => mean(RUNS.map((r, i) => (r[0] === a && r[1] === b ? avg[i] : NaN)).filter((v) => !isNaN(v)))

  return (
    <div className="space-y-4">
      <Predict prompt="Before running anything: which factor do you think changes plasma etch rate the most? Do you expect any two factors to interact?" />
      <Panel>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm">Replicates per run
            <select className="input ml-2 !w-auto" value={reps} onChange={(e) => { setReps(Number(e.target.value)); setY(Array(8).fill(null)) }}>
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </label>
          <button className="btn" onClick={() => order.forEach((i) => run(i))}>Run all (randomized order)</button>
          <button className="btn-ghost btn" onClick={() => setY(Array(8).fill(null))}>Clear</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-left">
              <th className="py-1">Run order</th><th>Std</th>{FACTORS.map((f) => <th key={f.k}>{f.k}: {f.name}</th>)}<th>Etch rate (nm/min)</th><th></th>
            </tr></thead>
            <tbody>
              {order.map((i, k) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-1.5">{k + 1}</td><td>{LABEL[i]}</td>
                  {RUNS[i].map((v, j) => <td key={j}>{v > 0 ? `+ (${FACTORS[j].hi})` : `− (${FACTORS[j].lo})`}</td>)}
                  <td className="font-semibold">{y[i] ? y[i]!.join(', ') : '—'}</td>
                  <td><button className="btn-ghost btn !px-2 !py-1 text-xs" onClick={() => run(i)}>{y[i] ? 'Re-run' : 'Run'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {done && (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <p className="label mb-2">Pareto of effects (|effect|)</p>
            {eff.map((e) => (
              <div key={e.name} className="mb-1.5 grid grid-cols-[3rem_1fr_4rem] items-center gap-2 text-sm">
                <span className="font-semibold">{e.name}</span>
                <span className="h-4 rounded-sm" style={{ width: `${(Math.abs(e.effect) / maxE) * 100}%`, background: Math.abs(e.effect) > 20 ? 'var(--color-sblue)' : 'var(--color-line)' }} />
                <span className="text-right">{round(e.effect, 1)}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-ink-2">Noise σ ≈ 8 nm/min per run. Effects much larger than noise are real; tiny ones are likely noise. Add replicates to tell them apart.</p>
          </Panel>
          <Panel>
            <p className="label mb-2">Interaction plot: A (power) × B (pressure)</p>
            <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Interaction plot">
              {[-1, 1].map((b) => {
                const y0 = cell(-1, b), y1 = cell(1, b)
                const sy = (v: number) => 180 - ((v - 450) / 200) * 160
                return (
                  <g key={b}>
                    <line x1={60} x2={260} y1={sy(y0)} y2={sy(y1)} stroke={b > 0 ? 'var(--color-sblue)' : 'var(--color-sorange)'} strokeWidth={3} />
                    <text x={266} y={sy(y1) + 4} fontSize="11" fill="var(--color-ink)">B {b > 0 ? 'high' : 'low'}</text>
                  </g>
                )
              })}
              <text x={60} y={196} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">A low</text>
              <text x={260} y={196} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">A high</text>
            </svg>
            <p className="text-sm">Non-parallel lines mean the effect of power depends on pressure — an interaction a one-factor-at-a-time test would miss.</p>
            <div className="mt-2 grid grid-cols-2 gap-2"><Stat label="Grand mean" value={round(mean(avg), 1)} /><Stat label="Runs" value={8 * reps} /></div>
          </Panel>
        </div>
      )}
      <Challenges items={['Which effects are clearly bigger than noise?', 'Why does the order of runs get randomized?', 'If you only had 4 runs, which half-fraction (I = ABC) would you pick, and what gets aliased with A?']} />
    </div>
  )
}
