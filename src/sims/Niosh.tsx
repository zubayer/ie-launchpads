import { useState } from 'react'
import { round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

// Frequency multiplier (NIOSH Applications Manual, Table 5) for V < 75 cm: [≤1 h, ≤2 h, ≤8 h]
const FM: [number, number[]][] = [
  [0.2, [1.0, 0.95, 0.85]], [0.5, [0.97, 0.92, 0.81]], [1, [0.94, 0.88, 0.75]], [2, [0.91, 0.84, 0.65]],
  [3, [0.88, 0.79, 0.55]], [4, [0.84, 0.72, 0.45]], [5, [0.8, 0.6, 0.35]], [6, [0.75, 0.5, 0.27]],
  [7, [0.7, 0.42, 0.22]], [8, [0.6, 0.35, 0.18]], [9, [0.52, 0.3, 0]], [10, [0.45, 0.26, 0]],
]

export function rwl(H: number, V: number, D: number, A: number, fm: number, cm: number) {
  const HM = H <= 25 ? 1 : H > 63 ? 0 : 25 / H
  const VM = V > 175 ? 0 : 1 - 0.003 * Math.abs(V - 75)
  const DM = D <= 25 ? 1 : D > 175 ? 0 : 0.82 + 4.5 / D
  const AM = A > 135 ? 0 : 1 - 0.0032 * A
  return { RWL: 23 * HM * VM * DM * AM * fm * cm, HM, VM, DM, AM }
}

export default function Niosh() {
  const [load, setLoad] = useState(15)
  const [H, setH] = useState(40)
  const [V, setV] = useState(30)
  const [D, setD] = useState(60)
  const [A, setA] = useState(45)
  const [f, setF] = useState(2)
  const [dur, setDur] = useState(2)
  const [cm, setCm] = useState(0.95)
  const fm = FM.find(([q]) => q >= f)?.[1][dur] ?? 0
  const r = rwl(H, V, D, A, fm, cm)
  const LI = load / r.RWL
  return (
    <div className="space-y-4">
      <Predict prompt="A worker lifts a 15 kg tote from near the floor to a waist-high conveyor twice a minute, twisting 45°. Is that within the NIOSH recommended limit?" />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="grid grid-cols-2 gap-3">
          <Num label="Load weight (kg)" value={load} onChange={setLoad} />
          <Num label="Horizontal distance H (cm)" value={H} onChange={setH} />
          <Num label="Vertical height at origin V (cm)" value={V} onChange={setV} />
          <Num label="Vertical travel D (cm)" value={D} onChange={setD} />
          <Num label="Asymmetry angle A (°)" value={A} onChange={setA} />
          <Num label="Frequency (lifts/min)" value={f} onChange={setF} step={0.1} />
          <label className="block"><span className="label">Work duration</span>
            <select className="input mt-1" value={dur} onChange={(e) => setDur(Number(e.target.value))}><option value={0}>≤ 1 hour</option><option value={1}>1–2 hours</option><option value={2}>2–8 hours</option></select></label>
          <label className="block"><span className="label">Hand-to-object coupling</span>
            <select className="input mt-1" value={cm} onChange={(e) => setCm(Number(e.target.value))}><option value={1}>Good (handles)</option><option value={0.95}>Fair</option><option value={0.9}>Poor</option></select></label>
        </Panel>
        <Panel>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Stat label="HM = 25/H" value={round(r.HM, 3)} />
            <Stat label="VM" value={round(r.VM, 3)} />
            <Stat label="DM" value={round(r.DM, 3)} />
            <Stat label="AM" value={round(r.AM, 3)} />
            <Stat label="FM (table)" value={fm} />
            <Stat label="CM" value={cm} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="RWL (kg)" value={round(r.RWL, 2)} />
            <Stat label="Lifting index = load / RWL" value={round(LI, 2)} tone={LI <= 1 ? 'good' : LI <= 3 ? 'warn' : 'bad'} />
          </div>
          <p className="mt-3 text-sm">{LI <= 1 ? 'LI ≤ 1: nearly all healthy workers can do this lift.' : LI <= 3 ? 'LI > 1: increased risk of low-back injury for some workers — redesign the task.' : 'LI > 3: high risk for many workers — redesign is a priority.'}</p>
          <p className="mt-2 text-xs text-ink-2">RWL = 23 kg × HM × VM × DM × AM × FM × CM (metric). FM values from the NIOSH Applications Manual for V &lt; 75 cm; check the manual for other cases. Lifting index thresholds are guidance, not legal limits.</p>
        </Panel>
      </div>
      <Challenges items={['Which single multiplier hurts most here? Fix that first.', 'Raise the tote start height to 75 cm with a lift table. New LI?', 'Why does the equation punish horizontal distance so strongly? Think about the moment on the spine.']} />
    </div>
  )
}
