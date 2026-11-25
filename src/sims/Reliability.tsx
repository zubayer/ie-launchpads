import { useState } from 'react'
import { round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

export const series = (rs: number[]) => rs.reduce((a, b) => a * b, 1)
export const parallel = (rs: number[]) => 1 - rs.reduce((a, b) => a * (1 - b), 1)

export default function Reliability() {
  const [r1, setR1] = useState(0.95)
  const [r2, setR2] = useState(0.9)
  const [r3, setR3] = useState(0.9)
  const [r4, setR4] = useState(0.98)
  const [beta, setBeta] = useState(1)
  const [eta, setEta] = useState(1000)
  // System: pump (r1) in series with a redundant pair of filters (r2 || r3) in series with a controller (r4)
  const pair = parallel([r2, r3])
  const sys = series([r1, pair, r4])
  const W = 600, H = 220, P = 40
  const tMax = eta * 2.5
  const x = scale(0, tMax, P, W - 10)
  const ts = Array.from({ length: 200 }, (_, i) => (i / 199) * tMax + 1e-6)
  const R = (t: number) => Math.exp(-((t / eta) ** beta))
  const h = (t: number) => (beta / eta) * (t / eta) ** (beta - 1)
  const hMax = Math.max(...ts.slice(5).map(h))
  const yR = scale(0, 1, H - P, 10)
  const yH = scale(0, hMax * 1.1, H - P, 10)
  const Box = ({ label, r }: { label: string; r: number }) => (
    <div className="rounded-md border-2 border-ink bg-sheet px-3 py-2 text-center text-sm"><div className="font-semibold">{label}</div><div className="text-ink-2">R = {r}</div></div>
  )
  return (
    <div className="space-y-4">
      <Predict prompt="Two filters that are each 90% reliable, in parallel. Is the pair more or less reliable than a single 98% controller?" />
      <Panel>
        <p className="label mb-3">Reliability block diagram (mission reliability)</p>
        <div className="flex flex-wrap items-center gap-3">
          <Box label="Pump" r={r1} />
          <span className="h-0.5 w-6 bg-ink" />
          <div className="flex flex-col gap-2 border-x-2 border-ink px-3">
            <Box label="Filter A" r={r2} />
            <Box label="Filter B" r={r3} />
          </div>
          <span className="h-0.5 w-6 bg-ink" />
          <Box label="Controller" r={r4} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Slider label="Pump" value={r1} min={0.5} max={0.999} step={0.001} onChange={setR1} />
          <Slider label="Filter A" value={r2} min={0.5} max={0.999} step={0.001} onChange={setR2} />
          <Slider label="Filter B" value={r3} min={0.5} max={0.999} step={0.001} onChange={setR3} />
          <Slider label="Controller" value={r4} min={0.5} max={0.999} step={0.001} onChange={setR4} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Filter pair (parallel)" value={round(pair, 4)} />
          <Stat label="System (series)" value={round(sys, 4)} tone={sys > 0.9 ? 'good' : 'warn'} />
          <Stat label="Weakest block" value={['Pump', 'Filter pair', 'Controller'][[r1, pair, r4].indexOf(Math.min(r1, pair, r4))]} />
        </div>
        <p className="mt-2 text-sm text-ink-2">Series: R = R₁·R₂·…  Parallel: R = 1 − (1 − R₁)(1 − R₂). A series system is never more reliable than its weakest block.</p>
      </Panel>
      <Panel>
        <p className="label mb-2">Weibull life model</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="Shape β" value={beta} min={0.5} max={4} step={0.1} onChange={setBeta} fmt={(v) => v.toFixed(1)} />
          <Slider label="Scale η (hours)" value={eta} min={200} max={3000} step={50} onChange={setEta} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Weibull reliability and hazard curves">
          <line x1={P} x2={W - 10} y1={H - P} y2={H - P} stroke="var(--color-line)" />
          <polyline fill="none" stroke="var(--color-sblue)" strokeWidth={2.5} points={ts.map((t) => `${x(t)},${yR(R(t))}`).join(' ')} />
          <polyline fill="none" stroke="var(--color-sorange)" strokeWidth={2.5} points={ts.slice(2).map((t) => `${x(t)},${yH(Math.min(h(t), hMax * 1.1))}`).join(' ')} />
          <line x1={x(eta)} x2={x(eta)} y1={10} y2={H - P} stroke="var(--color-ink-2)" strokeDasharray="4 4" />
          <text x={x(eta) + 4} y={22} fontSize="11" fill="var(--color-ink-2)">η: 63.2% failed</text>
          {[0, 0.5, 1, 1.5, 2, 2.5].map((k) => <text key={k} x={x(k * eta)} y={H - P + 15} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">{Math.round(k * eta)}</text>)}
        </svg>
        <p className="text-sm"><span className="text-sblue">Reliability R(t)</span> and <span className="text-sorange">hazard rate h(t)</span>. {beta < 0.95 ? 'β < 1: failure rate falls over time — infant mortality (burn-in helps).' : beta <= 1.05 ? 'β ≈ 1: constant failure rate — random failures (exponential; MTBF = η).' : 'β > 1: failure rate rises — wear-out (time-based replacement helps).'}</p>
      </Panel>
      <Challenges items={['Which single upgrade raises system reliability the most? Why is it the weakest block?', 'Set β = 0.6, 1.0, 3.0 and connect each to a section of the bathtub curve.', 'When does preventive replacement make sense — β below or above 1?']} />
    </div>
  )
}
