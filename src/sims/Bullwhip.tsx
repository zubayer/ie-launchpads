import { useMemo, useState } from 'react'
import { makeRng, mean, round, sd } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat, scale } from './kit'

const TIERS = ['Retailer', 'Wholesaler', 'Distributor', 'Factory']
const COL = ['var(--color-ink)', 'var(--color-sblue)', 'var(--color-sorange)', 'var(--color-sred)']

/** Order-up-to policy with moving-average forecasting at each tier. */
export function bullwhip(demand: number[], L: number, n: number, share: boolean) {
  const orders: number[][] = []
  let incoming = demand
  for (let k = 0; k < 4; k++) {
    const seen = share ? demand : incoming
    const out: number[] = []
    let prevS = NaN
    for (let t = 0; t < demand.length; t++) {
      const hist = seen.slice(Math.max(0, t - n + 1), t + 1)
      const f = mean(hist)
      const S = f * (L + 1) // order-up-to level
      const o = Number.isNaN(prevS) ? incoming[t] : Math.max(0, incoming[t] + (S - prevS))
      prevS = S
      out.push(o)
    }
    orders.push(out)
    incoming = out
  }
  return orders
}

export default function Bullwhip() {
  const [L, setL] = useState(2)
  const [n, setN] = useState(4)
  const [noise, setNoise] = useState(5)
  const [share, setShare] = useState(false)
  const demand = useMemo(() => {
    const r = makeRng(21)
    return Array.from({ length: 52 }, (_, t) => Math.max(0, Math.round((t < 12 ? 100 : 115) + r.normal(0, noise))))
  }, [noise])
  const orders = bullwhip(demand, L, n, share)
  const series = [demand, ...orders.slice(1)]
  const ratio = orders.map((o) => sd(o.slice(4)) / sd(demand.slice(4)))
  const W = 680, H = 260, P = 36
  const all = series.flat()
  const x = scale(0, 51, P, W - 10), y = scale(Math.max(0, Math.min(...all) - 10), Math.max(...all) + 10, H - P, 10)
  return (
    <div className="space-y-4">
      <Predict prompt="Consumer demand steps up 15% at week 12 with a little noise. How big a swing do you expect the factory to see?" />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Orders at each tier over time">
          <line x1={P} x2={W - 10} y1={H - P} y2={H - P} stroke="var(--color-line)" />
          {[0, 13, 26, 39, 51].map((t) => <text key={t} x={x(t)} y={H - P + 15} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">wk {t + 1}</text>)}
          {series.map((s, k) => <polyline key={k} fill="none" stroke={COL[k]} strokeWidth={k === 0 ? 2.5 : 1.8} points={s.map((v, t) => `${x(t)},${y(v)}`).join(' ')} />)}
        </svg>
        <div className="flex flex-wrap gap-3 text-sm">
          {TIERS.map((t, k) => <span key={t} className="flex items-center gap-1"><span className="inline-block h-1 w-5" style={{ background: COL[k] }} />{k === 0 ? 'Consumer demand' : `${t} orders`}</span>)}
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-3">
          <Slider label="Lead time L (weeks)" value={L} min={0} max={6} onChange={setL} />
          <Slider label="Forecast window n (weeks)" value={n} min={1} max={12} onChange={setN} />
          <Slider label="Demand noise σ" value={noise} min={0} max={20} onChange={setNoise} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> Share point-of-sale data with every tier</label>
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((t, k) => <Stat key={t} label={`${t}: order σ ÷ demand σ`} value={`${round(ratio[k], 2)}×`} tone={ratio[k] < 1.5 ? 'good' : ratio[k] < 4 ? 'warn' : 'bad'} />)}
          </div>
          <p className="mt-3 text-sm text-ink-2">Each tier forecasts from the orders it receives, not true demand, and orders enough to cover its lead time. Small changes compound upstream. Causes: demand-signal processing, order batching, price promotions, and shortage gaming.</p>
        </Panel>
      </div>
      <Challenges items={['Set lead time to 0. How much does the factory’s swing shrink?', 'Turn on information sharing. Which tier benefits most?', 'Lengthen the forecast window. Why does smoothing reduce the bullwhip?']} />
    </div>
  )
}
