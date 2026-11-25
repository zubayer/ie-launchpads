import { useMemo, useRef, useState } from 'react'
import { makeRng, mean, round } from '../lib/math'
import { Axes, Challenges, Panel, Predict, Stat, scale, ticks } from './kit'

const MU = 50, SIGMA = 2, N = 5
const SE = SIGMA / Math.sqrt(N)
const UCL = MU + 3 * SE, LCL = MU - 3 * SE

type Disturb = 'none' | 'shift' | 'trend' | 'spread'

/** Western Electric rules on subgroup means; returns rule numbers triggered at each index. */
export function weRules(xs: number[], center: number, se: number): Record<number, number[]> {
  const z = xs.map((x) => (x - center) / se)
  const out: Record<number, number[]> = {}
  const flag = (i: number, r: number) => { (out[i] ||= []).includes(r) || out[i].push(r) }
  z.forEach((v, i) => {
    if (Math.abs(v) > 3) flag(i, 1)
    for (const side of [1, -1]) {
      const w3 = z.slice(Math.max(0, i - 2), i + 1)
      if (w3.length === 3 && w3.filter((q) => q * side > 2).length >= 2 && v * side > 2) flag(i, 2)
      const w5 = z.slice(Math.max(0, i - 4), i + 1)
      if (w5.length === 5 && w5.filter((q) => q * side > 1).length >= 4 && v * side > 1) flag(i, 3)
      const w8 = z.slice(Math.max(0, i - 7), i + 1)
      if (w8.length === 8 && w8.every((q) => q * side > 0)) flag(i, 4)
    }
  })
  return out
}

const RULES = ['', 'Rule 1: one point beyond 3σ', 'Rule 2: 2 of 3 beyond 2σ, same side', 'Rule 3: 4 of 5 beyond 1σ, same side', 'Rule 4: 8 in a row on one side']

export default function ControlChart() {
  const rng = useRef(makeRng(7))
  const [pts, setPts] = useState<{ x: number; r: number; d: Disturb }[]>(() =>
    Array.from({ length: 20 }, () => {
      const sub = Array.from({ length: N }, () => rng.current.normal(MU, SIGMA))
      return { x: mean(sub), r: Math.max(...sub) - Math.min(...sub), d: 'none' as Disturb }
    }))
  const [dist, setDist] = useState<Disturb>('none')
  const [mag, setMag] = useState(1)
  const since = useRef(0)

  const add = (k: number) => {
    const next = [...pts]
    for (let j = 0; j < k; j++) {
      const t = since.current++
      const shift = dist === 'shift' ? mag * SIGMA : dist === 'trend' ? 0.08 * t * SIGMA * mag : 0
      const s = dist === 'spread' ? SIGMA * (1 + mag) : SIGMA
      const sub = Array.from({ length: N }, () => rng.current.normal(MU + shift, s))
      next.push({ x: mean(sub), r: Math.max(...sub) - Math.min(...sub), d: dist })
    }
    setPts(next.slice(-60))
  }
  const signals = useMemo(() => weRules(pts.map((p) => p.x), MU, SE), [pts])
  const firstDisturbed = pts.findIndex((p) => p.d !== 'none')
  const firstSignalAfter = Object.keys(signals).map(Number).filter((i) => firstDisturbed >= 0 && i >= firstDisturbed).sort((a, b) => a - b)[0]

  const W = 720, H = 300, P = 40
  const x = scale(0, Math.max(30, pts.length), P, W - 12)
  const y = scale(MU - 5 * SE, MU + 5 * SE, H - P, 10)

  return (
    <div className="space-y-4">
      <Predict prompt="If the process mean shifts by 1σ, how many subgroups do you think pass before the chart signals? Write your guess, then inject the shift and count." />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="X-bar control chart">
          {[1, 2].map((k) => (
            <g key={k}>
              <rect x={P} width={W - P - 12} y={y(MU + k * SE)} height={y(MU + (k - 1) * SE) - y(MU + k * SE)} fill={k === 2 ? 'var(--color-tape)' : 'var(--color-sgreen)'} opacity={0.08} />
              <rect x={P} width={W - P - 12} y={y(MU - (k - 1) * SE)} height={y(MU - k * SE) - y(MU - (k - 1) * SE)} fill={k === 2 ? 'var(--color-tape)' : 'var(--color-sgreen)'} opacity={0.08} />
            </g>
          ))}
          <Axes w={W} h={H} pad={P} x={x} y={y} xTicks={ticks(0, Math.max(30, pts.length), 6).map(Math.round)} yTicks={[LCL, MU, UCL].map((v) => round(v, 2))} xLabel="Subgroup" />
          <line x1={P} x2={W - 12} y1={y(UCL)} y2={y(UCL)} stroke="var(--color-sred)" strokeDasharray="6 4" />
          <line x1={P} x2={W - 12} y1={y(LCL)} y2={y(LCL)} stroke="var(--color-sred)" strokeDasharray="6 4" />
          <line x1={P} x2={W - 12} y1={y(MU)} y2={y(MU)} stroke="var(--color-ink-2)" />
          {firstDisturbed >= 0 && <line x1={x(firstDisturbed + 0.5)} x2={x(firstDisturbed + 0.5)} y1={10} y2={H - P} stroke="var(--color-sorange)" strokeDasharray="3 3" />}
          <polyline fill="none" stroke="var(--color-ink)" strokeWidth={1.5} points={pts.map((p, i) => `${x(i + 1)},${y(Math.max(MU - 5 * SE, Math.min(MU + 5 * SE, p.x)))}`).join(' ')} />
          {pts.map((p, i) => (
            <circle key={i} cx={x(i + 1)} cy={y(Math.max(MU - 5 * SE, Math.min(MU + 5 * SE, p.x)))} r={signals[i] ? 5.5 : 3}
              fill={signals[i] ? 'var(--color-sred)' : 'var(--color-ink)'}><title>{`Subgroup ${i + 1}: x̄ = ${round(p.x, 2)}${signals[i] ? ' — ' + signals[i].map((r) => RULES[r]).join('; ') : ''}`}</title></circle>
          ))}
        </svg>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn" onClick={() => add(1)}>Add subgroup</button>
          <button className="btn-ghost btn" onClick={() => add(10)}>Run 10</button>
          <button className="btn-ghost btn" onClick={() => { setPts([]); since.current = 0; setDist('none') }}>Reset</button>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="label mb-2">Disturb the process (applies to new subgroups)</p>
          <div className="flex flex-wrap gap-2">
            {(['none', 'shift', 'trend', 'spread'] as Disturb[]).map((d) => (
              <button key={d} onClick={() => { setDist(d); since.current = 0 }} aria-pressed={dist === d} className={`chip !text-sm ${dist === d ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>
                {{ none: 'In control', shift: 'Mean shift', trend: 'Tool wear trend', spread: 'More variation' }[d]}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm">Size: {mag}σ
            <input type="range" min={0.5} max={3} step={0.5} value={mag} onChange={(e) => setMag(Number(e.target.value))} />
          </label>
        </Panel>
        <Panel>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="UCL" value={round(UCL, 2)} />
            <Stat label="Center" value={MU} />
            <Stat label="LCL" value={round(LCL, 2)} />
          </div>
          <p className="mt-3 text-sm">
            {firstDisturbed < 0 ? 'Process is stable: μ = 50, σ = 2, subgroups of 5.' : firstSignalAfter !== undefined
              ? <>Disturbance started at subgroup {firstDisturbed + 1}; first signal at {firstSignalAfter + 1} — <strong>{firstSignalAfter - firstDisturbed + 1} subgroups</strong> to detect.</>
              : <>Disturbance started at subgroup {firstDisturbed + 1}; no signal yet. Keep sampling.</>}
          </p>
          <ul className="mt-2 max-h-28 overflow-y-auto text-sm text-ink-2">
            {Object.entries(signals).slice(-6).map(([i, r]) => <li key={i}>#{Number(i) + 1}: {r.map((k) => RULES[k]).join('; ')}</li>)}
          </ul>
        </Panel>
      </div>
      <Challenges items={[
        'Run 50 in-control subgroups. Did you get a false alarm? Rule 1 alone gives about 1 in 370.',
        'Inject a 1σ shift. Which rule fires first — usually Rule 3 or 4, not Rule 1. Why?',
        'Inject a 3σ shift. How fast is detection now?',
        'Try “More variation” on an X̄ chart. Why would an R chart catch this better?',
      ]} />
    </div>
  )
}
