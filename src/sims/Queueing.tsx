import { useMemo, useState } from 'react'
import { makeRng, mmc, round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

/** Discrete-event simulation of an M/M/c FIFO queue. */
export function simulateMMc(lambda: number, mu: number, c: number, customers: number, seed = 1) {
  const r = makeRng(seed)
  const free = Array(c).fill(0) // time each server becomes free
  let t = 0, totalWq = 0, totalW = 0, waited = 0
  for (let i = 0; i < customers; i++) {
    t += r.expo(lambda)
    let k = 0
    for (let j = 1; j < c; j++) if (free[j] < free[k]) k = j
    const start = Math.max(t, free[k])
    const svc = r.expo(mu)
    free[k] = start + svc
    if (start > t + 1e-12) waited++
    totalWq += start - t
    totalW += start - t + svc
  }
  return { wq: totalWq / customers, w: totalW / customers, pw: waited / customers }
}

export default function Queueing() {
  const [lambda, setLambda] = useState(10) // per hour
  const [mu, setMu] = useState(4) // per hour per server
  const [c, setC] = useState(3)
  const [seed, setSeed] = useState(1)
  const m = mmc(lambda, mu, c)
  const sim = useMemo(() => (m.rho < 1 ? simulateMMc(lambda, mu, c, 20000, seed) : null), [lambda, mu, c, seed, m.rho])
  const W = 600, H = 220, P = 36
  const x = scale(0, 1, P, W - 10)
  const curve = Array.from({ length: 95 }, (_, i) => 0.05 + i * 0.01).map((rho) => ({ rho, wq: mmc(rho * c * mu, mu, c).wq * 60 }))
  const maxY = Math.min(240, Math.max(30, ...curve.map((p) => p.wq).filter((v) => v < 240)))
  const y = scale(0, maxY, H - P, 10)
  const fmt = (h: number) => (Number.isFinite(h) ? `${round(h * 60, 1)} min` : '∞')
  return (
    <div className="space-y-4">
      <Predict prompt="A clinic runs 3 nurses at 83% utilization. If arrivals rise 10%, does the average wait rise about 10%, or a lot more?" />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-3">
          <Slider label="Arrival rate λ (per hour)" value={lambda} min={1} max={30} onChange={setLambda} />
          <Slider label="Service rate μ per server (per hour)" value={mu} min={1} max={20} onChange={setMu} />
          <Slider label="Servers c" value={c} min={1} max={10} onChange={setC} />
          <p className="text-sm text-ink-2">Kendall notation M/M/c: Poisson arrivals, exponential service, c parallel servers, one FIFO line.</p>
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Utilization ρ = λ/(cμ)" value={`${round(m.rho * 100, 1)}%`} tone={m.rho < 0.8 ? 'good' : m.rho < 1 ? 'warn' : 'bad'} />
            <Stat label="P(wait) — Erlang C" value={m.rho < 1 ? `${round(m.pw * 100, 1)}%` : '100%'} />
            <Stat label="Avg wait in line Wq" value={fmt(m.wq)} />
            <Stat label="Avg time in system W" value={fmt(m.w)} />
            <Stat label="Avg in line Lq" value={Number.isFinite(m.lq) ? round(m.lq, 2) : '∞'} />
            <Stat label="Avg in system L = λW" value={Number.isFinite(m.l) ? round(m.l, 2) : '∞'} />
          </div>
          {m.rho >= 1 && <p className="mt-3 font-semibold text-sred">ρ ≥ 1: arrivals outpace capacity and the line grows without limit. Add servers or speed up service.</p>}
        </Panel>
      </div>
      <Panel>
        <p className="label mb-1">Wait vs utilization for {c} server{c > 1 ? 's' : ''} (minutes)</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Wait time rises sharply as utilization nears 100%">
          <line x1={P} x2={W - 10} y1={H - P} y2={H - P} stroke="var(--color-line)" />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => <text key={t} x={x(t)} y={H - P + 15} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">{t * 100}%</text>)}
          <polyline fill="none" stroke="var(--color-sblue)" strokeWidth={2.5} points={curve.filter((p) => p.wq <= maxY).map((p) => `${x(p.rho)},${y(p.wq)}`).join(' ')} />
          {m.rho < 1 && m.wq * 60 <= maxY && <circle cx={x(m.rho)} cy={y(m.wq * 60)} r={7} fill="var(--color-tape)" stroke="var(--color-ink)" strokeWidth={2} />}
          <text x={P + 4} y={20} fontSize="11" fill="var(--color-ink-2)">{round(maxY, 0)} min</text>
        </svg>
      </Panel>
      {sim && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="label">Discrete-event simulation, 20,000 customers</p>
            <button className="btn-ghost btn text-sm" onClick={() => setSeed((s) => s + 1)}>Re-run with new random numbers</button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Simulated Wq" value={fmt(sim.wq)} />
            <Stat label="Simulated W" value={fmt(sim.w)} />
            <Stat label="Simulated P(wait)" value={`${round(sim.pw * 100, 1)}%`} />
          </div>
          <p className="mt-2 text-sm text-ink-2">Simulation and formula should agree within a few percent. When real arrivals or service times aren’t exponential, simulation is what you trust.</p>
        </Panel>
      )}
      <Challenges items={['Push utilization from 80% to 95%. How many times longer is the wait?', 'Compare 1 fast server (μ = 12) with 3 slow ones (μ = 4) at λ = 10.', 'Verify Little’s Law: L = λ·W.']} />
    </div>
  )
}
