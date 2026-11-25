import { useState } from 'react'
import { irr, npv, round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

const A0 = [-20000, 7000, 7000, 7000, 7000, 7000, 3000]
const B0 = [-80000, 25000, 25000, 25000, 25000, 25000, 12000]

function payback(f: number[]) {
  let cum = 0
  for (let t = 0; t < f.length; t++) {
    const prev = cum
    cum += f[t]
    if (t > 0 && cum >= 0) return t - 1 + -prev / f[t]
  }
  return NaN
}
const crf = (i: number, n: number) => (i * (1 + i) ** n) / ((1 + i) ** n - 1)

export default function EngEcon() {
  const [marr, setMarr] = useState(10)
  const [A, setA] = useState(A0)
  const [B, setB] = useState(B0)
  const i = marr / 100
  const n = A.length - 1
  const res = [A, B].map((f) => ({ npv: npv(i, f), irr: irr(f), pb: payback(f), aw: npv(i, f) * crf(i, n) }))
  const inc = B.map((b, t) => b - A[t])
  const incIrr = irr(inc)
  const maxAbs = Math.max(...A.map(Math.abs), ...B.map(Math.abs))
  const diag = (f: number[], color: string) => (
    <svg viewBox="0 0 360 160" className="w-full" aria-hidden>
      <line x1="10" x2="350" y1="80" y2="80" stroke="var(--color-ink)" />
      {f.map((v, t) => {
        const xx = 20 + t * (320 / n), hh = (Math.abs(v) / maxAbs) * 70
        return (
          <g key={t}>
            <line x1={xx} x2={xx} y1={80} y2={v >= 0 ? 80 - hh : 80 + hh} stroke={v >= 0 ? color : 'var(--color-sred)'} strokeWidth={6} />
            <text x={xx} y={155} fontSize="10" textAnchor="middle" fill="var(--color-ink-2)">{t}</text>
          </g>
        )
      })}
    </svg>
  )
  const edit = (f: number[], set: (x: number[]) => void, label: string) => (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {f.map((v, t) => <Num key={t} label={`${label} yr ${t}`} value={v} onChange={(x) => set(f.map((q, k) => (k === t ? x : q)))} />)}
    </div>
  )
  const better = res[1].npv > res[0].npv ? 'B' : 'A'
  return (
    <div className="space-y-4">
      <Predict prompt="Machine A has the higher rate of return. Does that make it the better investment at a 10% MARR?" />
      <Panel className="space-y-2">
        <div className="max-w-xs"><Num label="MARR (%)" value={marr} onChange={setMarr} step={0.5} /></div>
        <p className="text-sm text-ink-2">Year 0 is the purchase; the last year includes salvage value. Arrows up are receipts, down are costs.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {[['A', A, setA, 'var(--color-sblue)'], ['B', B, setB, 'var(--color-sgreen)']].map(([name, f, set, color], k) => (
          <Panel key={name as string}>
            <p className="wide text-lg">Machine {name as string}</p>
            {diag(f as number[], color as string)}
            {edit(f as number[], set as (x: number[]) => void, name as string)}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label={`NPV @ ${marr}%`} value={`$${Math.round(res[k].npv).toLocaleString()}`} tone={res[k].npv > 0 ? 'good' : 'bad'} />
              <Stat label="IRR" value={Number.isFinite(res[k].irr) ? `${round(res[k].irr * 100, 2)}%` : '—'} />
              <Stat label="Payback (yr)" value={Number.isFinite(res[k].pb) ? round(res[k].pb, 2) : 'never'} />
              <Stat label="Annual worth" value={`$${Math.round(res[k].aw).toLocaleString()}`} />
            </div>
          </Panel>
        ))}
      </div>
      <Panel>
        <p><strong>Decision at {marr}% MARR:</strong> choose <strong>Machine {better}</strong> (higher NPV, same life). Incremental IRR of B − A = {Number.isFinite(incIrr) ? `${round(incIrr * 100, 2)}%` : '—'} — {incIrr > i ? 'above MARR, so the extra investment in B pays for itself.' : 'below MARR, so the extra investment in B is not justified.'}</p>
        <p className="mt-2 text-sm text-ink-2">Ranking mutually exclusive projects by IRR alone can mislead; use NPV or incremental IRR. Payback ignores everything after the payback year and the time value of money.</p>
      </Panel>
      <Challenges items={['Find the MARR where A and B have equal NPV (the Fisher intersection).', 'Raise MARR to 20%. Does the choice flip?', 'Why is annual worth handy when alternatives have different lives?']} />
    </div>
  )
}
