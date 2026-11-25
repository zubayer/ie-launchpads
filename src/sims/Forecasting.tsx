import { useMemo, useState } from 'react'
import { makeRng, mean, round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

function series(seed: number, trend: number) {
  const r = makeRng(seed)
  return Array.from({ length: 30 }, (_, t) => Math.round(200 + trend * t + 25 * Math.sin((2 * Math.PI * t) / 12) + r.normal(0, 12)))
}

/** One-step-ahead forecasts: f[t] is the forecast for period t made at t−1. */
export function movingAvg(y: number[], n: number) { return y.map((_, t) => (t < n ? NaN : mean(y.slice(t - n, t)))) }
export function ses(y: number[], a: number) {
  const f = [NaN, y[0]]
  for (let t = 2; t < y.length; t++) f[t] = a * y[t - 1] + (1 - a) * f[t - 1]
  return f
}
export function holt(y: number[], a: number, b: number) {
  let L = y[0], T = y[1] - y[0]
  const f = [NaN, NaN]
  for (let t = 1; t < y.length - 1; t++) {
    const Lp = L
    L = a * y[t] + (1 - a) * (L + T)
    T = b * (L - Lp) + (1 - b) * T
    f[t + 1] = L + T
  }
  return f
}
export function errors(y: number[], f: number[]) {
  const e = y.map((v, i) => v - f[i]).filter((_, i) => !isNaN(f[i]) && i >= 6)
  const ys = y.filter((_, i) => !isNaN(f[i]) && i >= 6)
  return { mad: mean(e.map(Math.abs)), mape: mean(e.map((v, i) => Math.abs(v / ys[i]))) * 100, bias: mean(e) }
}

export default function Forecasting() {
  const [trend, setTrend] = useState(4)
  const [n, setN] = useState(3)
  const [a, setA] = useState(0.3)
  const [b, setB] = useState(0.2)
  const y = useMemo(() => series(9, trend), [trend])
  const F = { ma: movingAvg(y, n), ses: ses(y, a), holt: holt(y, a, b) }
  const E = { ma: errors(y, F.ma), ses: errors(y, F.ses), holt: errors(y, F.holt) }
  const W = 680, H = 260, P = 40
  const all = [...y, ...Object.values(F).flat().filter((v) => !isNaN(v))]
  const x = scale(0, y.length - 1, P, W - 10), yy = scale(Math.min(...all) - 10, Math.max(...all) + 10, H - P, 10)
  const line = (f: number[]) => f.map((v, i) => (isNaN(v) ? '' : `${x(i)},${yy(v)}`)).filter(Boolean).join(' ')
  const best = (Object.keys(E) as (keyof typeof E)[]).sort((p, q) => E[p].mape - E[q].mape)[0]
  const NAME = { ma: `${n}-period moving average`, ses: 'Exponential smoothing', holt: 'Holt (trend-adjusted)' }
  return (
    <div className="space-y-4">
      <Predict prompt="Demand is growing every month. Which method will lag behind: moving average, simple exponential smoothing, or Holt’s method?" />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Demand and forecasts">
          <line x1={P} x2={W - 10} y1={H - P} y2={H - P} stroke="var(--color-line)" />
          {[0, 6, 12, 18, 24, 29].map((t) => <text key={t} x={x(t)} y={H - P + 15} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">M{t + 1}</text>)}
          <polyline fill="none" stroke="var(--color-ink)" strokeWidth={2.5} points={y.map((v, i) => `${x(i)},${yy(v)}`).join(' ')} />
          {y.map((v, i) => <circle key={i} cx={x(i)} cy={yy(v)} r={3} fill="var(--color-ink)" />)}
          <polyline fill="none" stroke="var(--color-sorange)" strokeWidth={2} points={line(F.ma)} />
          <polyline fill="none" stroke="var(--color-sblue)" strokeWidth={2} points={line(F.ses)} />
          <polyline fill="none" stroke="var(--color-sgreen)" strokeWidth={2} strokeDasharray="6 3" points={line(F.holt)} />
        </svg>
        <p className="text-sm text-ink-2">Black: actual demand. <span className="text-sorange">Orange</span>: moving average. <span className="text-sblue">Blue</span>: exponential smoothing. <span className="text-sgreen">Green dashed</span>: Holt.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-3">
          <Slider label="Underlying trend (units/month)" value={trend} min={-4} max={10} onChange={setTrend} />
          <Slider label="Moving average periods n" value={n} min={2} max={12} onChange={setN} />
          <Slider label="Smoothing α (level)" value={a} min={0.05} max={0.95} step={0.05} onChange={setA} fmt={(v) => v.toFixed(2)} />
          <Slider label="Trend smoothing β (Holt)" value={b} min={0.05} max={0.95} step={0.05} onChange={setB} fmt={(v) => v.toFixed(2)} />
        </Panel>
        <Panel>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink-2"><th>Method</th><th>MAD</th><th>MAPE</th><th>Bias</th></tr></thead>
            <tbody>
              {(Object.keys(E) as (keyof typeof E)[]).map((k) => (
                <tr key={k} className={`border-t border-line/60 ${k === best ? 'font-semibold' : ''}`}>
                  <td className="py-1">{NAME[k]}{k === best ? ' (best)' : ''}</td><td>{round(E[k].mad, 1)}</td><td>{round(E[k].mape, 1)}%</td><td className={Math.abs(E[k].bias) > 8 ? 'text-sred' : ''}>{round(E[k].bias, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3"><Stat label="Lowest MAPE" value={NAME[best]} tone="good" /></div>
          <p className="mt-2 text-sm text-ink-2">Bias = average (actual − forecast). Positive bias means you keep under-forecasting — the signature of a method that ignores trend. None of these capture the 12-month seasonality; Holt-Winters would.</p>
        </Panel>
      </div>
      <Challenges items={['Set trend to 8. Which method has the largest positive bias? Why?', 'Raise α toward 0.9. What happens to responsiveness and noise?', 'Set trend to 0: does Holt still win? When is simpler better?']} />
    </div>
  )
}
