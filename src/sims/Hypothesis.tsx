import { useState } from 'react'
import { Phi, PhiInv, phi, round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

export default function Hypothesis() {
  const [delta, setDelta] = useState(1)
  const [sigma, setSigma] = useState(2)
  const [n, setN] = useState(16)
  const [alpha, setAlpha] = useState(0.05)
  const se = sigma / Math.sqrt(n)
  const zc = PhiInv(1 - alpha)
  const crit = zc * se
  const power = 1 - Phi((crit - delta) / se)
  const beta = 1 - power
  const W = 720, H = 260
  const lo = -4 * se, hi = delta + 4 * se
  const x = scale(lo, hi, 20, W - 20)
  const peak = phi(0) / se
  const y = scale(0, peak * 1.1, H - 30, 10)
  const xs = Array.from({ length: 301 }, (_, i) => lo + ((hi - lo) * i) / 300)
  const curve = (m: number) => xs.map((v, i) => `${i ? 'L' : 'M'}${x(v)} ${y(phi((v - m) / se) / se)}`).join(' ')
  const area = (m: number, a: number, b: number) => {
    const p = xs.filter((v) => v >= a && v <= b)
    return p.length ? `M${x(p[0])} ${y(0)} ${p.map((v) => `L${x(v)} ${y(phi((v - m) / se) / se)}`).join(' ')} L${x(p[p.length - 1])} ${y(0)}Z` : ''
  }
  // n needed for 80% power
  const n80 = Math.ceil(((zc + PhiInv(0.8)) * sigma / delta) ** 2)
  return (
    <div className="space-y-4">
      <Predict prompt="You want to detect a 1-unit improvement in mean cycle time (σ = 2). With 16 samples, is the chance of detecting it above or below 50%?" />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Null and alternative sampling distributions">
          <path d={area(delta, lo, crit)} fill="var(--color-sorange)" opacity={0.3} />
          <path d={area(delta, crit, hi)} fill="var(--color-sgreen)" opacity={0.25} />
          <path d={area(0, crit, hi)} fill="var(--color-sred)" opacity={0.45} />
          <path d={curve(0)} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
          <path d={curve(delta)} fill="none" stroke="var(--color-sblue)" strokeWidth={2.5} />
          <line x1={x(crit)} x2={x(crit)} y1={10} y2={H - 30} stroke="var(--color-ink)" strokeDasharray="5 4" />
          <text x={x(crit) + 4} y={22} fontSize="12" fill="var(--color-ink)">reject H₀ →</text>
          <text x={x(0)} y={H - 12} textAnchor="middle" fontSize="12" fill="var(--color-ink)">H₀: μ = μ₀</text>
          <text x={x(delta)} y={H - 12} textAnchor="middle" fontSize="12" fill="var(--color-sblue)">H₁: μ₀ + {delta}</text>
          <line x1={20} x2={W - 20} y1={H - 30} y2={H - 30} stroke="var(--color-line)" />
        </svg>
        <p className="mt-1 text-sm text-ink-2"><span className="text-sred">Red</span> = α (false alarm). <span className="text-sorange">Orange</span> = β (missed real change). <span className="text-sgreen">Green</span> = power.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-3">
          <Slider label="True effect δ" value={delta} min={0.2} max={3} step={0.1} onChange={setDelta} />
          <Slider label="Process σ" value={sigma} min={0.5} max={5} step={0.1} onChange={setSigma} />
          <Slider label="Sample size n" value={n} min={2} max={100} onChange={setN} />
          <Slider label="Significance α" value={alpha} min={0.01} max={0.2} step={0.01} onChange={setAlpha} />
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Power (1 − β)" value={`${round(power * 100, 1)}%`} tone={power >= 0.8 ? 'good' : power >= 0.5 ? 'warn' : 'bad'} />
            <Stat label="β (Type II)" value={`${round(beta * 100, 1)}%`} />
            <Stat label="Critical value" value={`μ₀ + ${round(crit, 3)}`} />
            <Stat label="n for 80% power" value={n80} />
          </div>
          <p className="mt-3 text-sm">One-sided z-test, σ known. Formula: <em>n = ((z₁₋α + z₁₋β)·σ/δ)²</em>.</p>
        </Panel>
      </div>
      <Challenges items={['Halve α. What happens to β? This is the core trade-off.', 'Find the smallest n that gives 80% power for δ = 0.5.', 'Explain to a manager why "not significant" does not mean "no effect".']} />
    </div>
  )
}
