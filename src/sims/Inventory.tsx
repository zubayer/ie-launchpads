import { useState } from 'react'
import { Phi, PhiInv, phi, round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat, scale } from './kit'

export const eoq = (D: number, S: number, H: number) => Math.sqrt((2 * D * S) / H)

function Eoq() {
  const [D, setD] = useState(12000)
  const [S, setS] = useState(75)
  const [H, setH] = useState(2.5)
  const q = eoq(D, S, H)
  const tc = (Q: number) => (D / Q) * S + (Q / 2) * H
  const W = 600, Hh = 220, P = 40
  const qMax = q * 3
  const x = scale(0, qMax, P, W - 10)
  const ys = Array.from({ length: 100 }, (_, i) => qMax * (0.05 + (i / 100) * 0.95))
  const yMax = tc(ys[0])
  const y = scale(0, Math.min(yMax, tc(q) * 3), Hh - P, 10)
  const line = (f: (Q: number) => number) => ys.map((Q, i) => `${i ? 'L' : 'M'}${x(Q)} ${y(Math.min(f(Q), tc(q) * 3))}`).join(' ')
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <Panel className="space-y-3">
        <Num label="Annual demand D (units)" value={D} onChange={setD} />
        <Num label="Order / setup cost S ($ per order)" value={S} onChange={setS} />
        <Num label="Holding cost H ($ per unit per year)" value={H} onChange={setH} step={0.1} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="EOQ Q*" value={Math.round(q).toLocaleString()} tone="good" />
          <Stat label="Orders / year" value={round(D / q, 1)} />
          <Stat label="Total annual cost" value={`$${Math.round(tc(q)).toLocaleString()}`} />
          <Stat label="Cycle (days)" value={round((q / D) * 365, 1)} />
        </div>
      </Panel>
      <Panel>
        <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full" role="img" aria-label="EOQ cost curves">
          <line x1={P} x2={W - 10} y1={Hh - P} y2={Hh - P} stroke="var(--color-line)" />
          <path d={line((Q) => (D / Q) * S)} fill="none" stroke="var(--color-sorange)" strokeWidth={2} />
          <path d={line((Q) => (Q / 2) * H)} fill="none" stroke="var(--color-sblue)" strokeWidth={2} />
          <path d={line(tc)} fill="none" stroke="var(--color-ink)" strokeWidth={3} />
          <line x1={x(q)} x2={x(q)} y1={10} y2={Hh - P} stroke="var(--color-sgreen)" strokeDasharray="5 4" />
          <text x={x(q) + 4} y={22} fontSize="11" fill="var(--color-sgreen)">Q* = {Math.round(q)}</text>
          <text x={W / 2} y={Hh - 8} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">Order quantity Q</text>
        </svg>
        <p className="text-sm text-ink-2"><span className="text-sorange">Ordering cost</span> falls with Q, <span className="text-sblue">holding cost</span> rises; the <strong>total</strong> is lowest where they are equal. The curve is flat near Q*, so rounding to a pallet size costs little.</p>
      </Panel>
    </div>
  )
}

function Rop() {
  const [d, setD] = useState(40)
  const [sd, setSd] = useState(8)
  const [L, setL] = useState(5)
  const [sl, setSl] = useState(0.95)
  const z = PhiInv(sl)
  const ss = z * sd * Math.sqrt(L)
  const rop = d * L + ss
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="space-y-3">
        <Num label="Average daily demand d̄" value={d} onChange={setD} />
        <Num label="Std. dev. of daily demand σd" value={sd} onChange={setSd} />
        <Num label="Lead time L (days)" value={L} onChange={setL} />
        <label className="block"><span className="label">Cycle service level: {round(sl * 100, 1)}%</span>
          <input type="range" min={0.5} max={0.999} step={0.001} value={sl} onChange={(e) => setSl(Number(e.target.value))} /></label>
      </Panel>
      <Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="z" value={round(z, 3)} />
          <Stat label="Safety stock" value={Math.ceil(ss)} tone="good" />
          <Stat label="Demand over lead time" value={d * L} />
          <Stat label="Reorder point" value={Math.ceil(rop)} tone="good" />
        </div>
        <p className="mt-3 text-sm">Safety stock = z·σd·√L. Going from 95% to 99% service raises z from 1.645 to 2.326 — about 41% more safety stock for 4 points of service.</p>
      </Panel>
    </div>
  )
}

function Newsvendor() {
  const [p, setP] = useState(12)
  const [c, setC] = useState(5)
  const [s, setS] = useState(1)
  const [mu, setMu] = useState(500)
  const [sd, setSd] = useState(120)
  const cu = p - c, co = c - s
  const cr = Math.min(0.999, Math.max(0.001, cu / (cu + co || 1)))
  const q = mu + PhiInv(cr) * sd
  // Expected profit for normal demand: E[min(D,Q)] = μ − σ·L(z), L(z) = φ(z) − z(1 − Φ(z))
  const exp = (Q: number) => {
    const z = (Q - mu) / sd
    const lz = phi(z) - z * (1 - Phi(z))
    const sales = mu - sd * lz
    const left = Q - sales
    return p * sales + s * left - c * Q
  }
  const W = 600, H = 200, P = 40
  const qs = Array.from({ length: 100 }, (_, i) => Math.max(0, mu - 3 * sd) + (i * 6 * sd) / 99)
  const vals = qs.map(exp)
  const x = scale(qs[0], qs[qs.length - 1], P, W - 10)
  const y = scale(Math.min(...vals), Math.max(...vals) * 1.05, H - P, 10)
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <Panel className="grid grid-cols-2 gap-3">
        <Num label="Selling price p" value={p} onChange={setP} />
        <Num label="Unit cost c" value={c} onChange={setC} />
        <Num label="Salvage value s" value={s} onChange={setS} />
        <Num label="Mean demand μ" value={mu} onChange={setMu} />
        <Num label="Demand σ" value={sd} onChange={setSd} />
      </Panel>
      <Panel>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Critical ratio Cu/(Cu+Co)" value={round(cr, 3)} />
          <Stat label="Order Q*" value={Math.round(q)} tone="good" />
          <Stat label="Expected profit" value={`$${Math.round(exp(q)).toLocaleString()}`} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Expected profit vs order quantity">
          <polyline fill="none" stroke="var(--color-ink)" strokeWidth={2.5} points={qs.map((Q, i) => `${x(Q)},${y(vals[i])}`).join(' ')} />
          <line x1={x(q)} x2={x(q)} y1={10} y2={H - P} stroke="var(--color-sgreen)" strokeDasharray="5 4" />
          <line x1={x(mu)} x2={x(mu)} y1={10} y2={H - P} stroke="var(--color-ink-2)" strokeDasharray="2 4" />
          <text x={x(mu) + 4} y={H - P - 6} fontSize="11" fill="var(--color-ink-2)">mean demand</text>
        </svg>
        <p className="text-sm">Underage cost Cu = p − c = {cu}; overage cost Co = c − s = {co}. When running out hurts more than leftovers, order above the mean.</p>
      </Panel>
    </div>
  )
}

export default function Inventory() {
  const [tab, setTab] = useState<'eoq' | 'rop' | 'nv'>('eoq')
  return (
    <div className="space-y-4">
      <Predict prompt="If annual demand quadruples, does the economic order quantity also quadruple?" />
      <div className="flex flex-wrap gap-2">
        {([['eoq', 'EOQ'], ['rop', 'Reorder point & safety stock'], ['nv', 'Newsvendor']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`chip !text-sm ${tab === k ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>{l}</button>
        ))}
      </div>
      {tab === 'eoq' ? <Eoq /> : tab === 'rop' ? <Rop /> : <Newsvendor />}
      <Challenges items={['EOQ: quadruple D and check — Q* only doubles (square root).', 'ROP: what lead-time change hurts more, +1 day or +20% demand σ?', 'Newsvendor: set salvage = cost. What does the critical ratio become, and why?']} />
    </div>
  )
}
