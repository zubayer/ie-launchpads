import { useState } from 'react'
import { Phi, phi, round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

export function capability(mu: number, s: number, lsl: number, usl: number) {
  const cp = (usl - lsl) / (6 * s)
  const cpk = Math.min((usl - mu) / (3 * s), (mu - lsl) / (3 * s))
  const ppm = (Phi((lsl - mu) / s) + (1 - Phi((usl - mu) / s))) * 1e6
  return { cp, cpk, ppm }
}

export default function Capability() {
  const [lsl, usl] = [9.94, 10.06]
  const [mu, setMu] = useState(10.02)
  const [s, setS] = useState(0.015)
  const { cp, cpk, ppm } = capability(mu, s, lsl, usl)
  const W = 720, H = 260
  const x = scale(9.88, 10.12, 20, W - 20)
  const peak = phi(0) / s
  const y = scale(0, peak * 1.1, H - 30, 10)
  const curve = Array.from({ length: 241 }, (_, i) => 9.88 + i * 0.001)
  const path = curve.map((v, i) => `${i ? 'L' : 'M'}${x(v)} ${y(phi((v - mu) / s) / s)}`).join(' ')
  const tail = (from: number, to: number) => {
    const pts = curve.filter((v) => v >= from && v <= to)
    if (!pts.length) return ''
    return `M${x(pts[0])} ${y(0)} ` + pts.map((v) => `L${x(v)} ${y(phi((v - mu) / s) / s)}`).join(' ') + ` L${x(pts[pts.length - 1])} ${y(0)} Z`
  }
  const tone = (v: number): 'good' | 'warn' | 'bad' => (v >= 1.33 ? 'good' : v >= 1 ? 'warn' : 'bad')
  return (
    <div className="space-y-4">
      <Predict prompt="Center the mean at 10.00 without touching the spread. Will Cp change? Will Cpk?" />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Normal curve between specification limits">
          <path d={tail(9.88, lsl)} fill="var(--color-sred)" opacity={0.35} />
          <path d={tail(usl, 10.12)} fill="var(--color-sred)" opacity={0.35} />
          <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
          {[[lsl, 'LSL'], [usl, 'USL']].map(([v, l]) => (
            <g key={l as string}>
              <line x1={x(v as number)} x2={x(v as number)} y1={10} y2={H - 30} stroke="var(--color-sred)" strokeWidth={2} />
              <text x={x(v as number)} y={H - 12} textAnchor="middle" fontSize="12" fill="var(--color-sred)">{l} {v}</text>
            </g>
          ))}
          <line x1={x(10)} x2={x(10)} y1={10} y2={H - 30} stroke="var(--color-ink-2)" strokeDasharray="4 4" />
          <line x1={x(mu)} x2={x(mu)} y1={y(peak)} y2={H - 30} stroke="var(--color-sblue)" />
          <line x1={20} x2={W - 20} y1={H - 30} y2={H - 30} stroke="var(--color-line)" />
        </svg>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-4">
          <Slider label="Process mean μ (mm)" value={mu} min={9.96} max={10.04} step={0.001} onChange={setMu} fmt={(v) => v.toFixed(3)} />
          <Slider label="Process std. dev. σ (mm)" value={s} min={0.005} max={0.03} step={0.001} onChange={setS} fmt={(v) => v.toFixed(3)} />
          <p className="text-sm text-ink-2">Shaft diameter spec: 10.00 ± 0.06 mm.</p>
        </Panel>
        <Panel>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Cp (potential)" value={round(cp, 2)} tone={tone(cp)} />
            <Stat label="Cpk (actual)" value={round(cpk, 2)} tone={tone(cpk)} />
            <Stat label="Defects (PPM)" value={ppm < 1 ? '< 1' : Math.round(ppm).toLocaleString()} />
          </div>
          <p className="mt-3 text-sm">
            {cpk >= 1.33 ? 'Capable by the common 1.33 target.' : cpk >= 1 ? 'Marginal: inside limits, but little room for drift.' : 'Not capable: a visible share of parts falls outside spec.'}
            {cp - cpk > 0.2 && ' The spread is fine — the process is off-center. Re-centering is the cheap fix.'}
          </p>
        </Panel>
      </div>
      <Challenges items={['Find the σ that gives Cpk = 1.33 when centered (answer: 0.015).', 'Keep σ = 0.015 and move μ to 10.03. What happens to PPM?', 'Why do automotive customers often ask for Cpk ≥ 1.67 on safety characteristics?']} />
    </div>
  )
}
