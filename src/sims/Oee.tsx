import { useState } from 'react'
import { round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

export function oee(planned: number, down: number, idealCycleSec: number, total: number, rejects: number) {
  const run = planned - down
  const A = run / planned
  const P = (idealCycleSec * total) / 60 / run
  const Q = (total - rejects) / total
  return { A, P, Q, oee: A * P * Q, run }
}

export default function Oee() {
  const [planned, setPlanned] = useState(420)
  const [breakdown, setBreakdown] = useState(27)
  const [setup, setSetup] = useState(20)
  const [ict, setIct] = useState(1.0)
  const [total, setTotal] = useState(19271)
  const [rejects, setRejects] = useState(423)
  const r = oee(planned, breakdown + setup, ict, total, rejects)
  const good = total - rejects
  const fullyProductive = (good * ict) / 60
  const bars = [
    { k: 'Planned production time', v: planned, c: 'var(--color-ink-2)' },
    { k: 'Availability loss (breakdowns, setups)', v: -(breakdown + setup), c: 'var(--color-sred)' },
    { k: 'Performance loss (minor stops, slow cycles)', v: -(r.run - (total * ict) / 60), c: 'var(--color-sorange)' },
    { k: 'Quality loss (scrap, rework, startup rejects)', v: -((rejects * ict) / 60), c: 'var(--color-tape)' },
    { k: 'Fully productive time', v: fullyProductive, c: 'var(--color-sgreen)' },
  ]
  const tone = (v: number): 'good' | 'warn' | 'bad' => (v >= 0.85 ? 'good' : v >= 0.65 ? 'warn' : 'bad')
  let acc = 0
  return (
    <div className="space-y-4">
      <Predict prompt="Availability is 89%, performance 86%, quality 98%. Each looks decent. Guess the OEE before you look." />
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Panel className="grid grid-cols-2 gap-3">
          <Num label="Planned production time (min)" value={planned} onChange={setPlanned} />
          <Num label="Breakdowns (min)" value={breakdown} onChange={setBreakdown} />
          <Num label="Setups & adjustments (min)" value={setup} onChange={setSetup} />
          <Num label="Ideal cycle time (s/unit)" value={ict} onChange={setIct} step={0.1} />
          <Num label="Total units made" value={total} onChange={setTotal} />
          <Num label="Rejects" value={rejects} onChange={setRejects} />
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Availability" value={`${round(r.A * 100, 1)}%`} tone={tone(r.A)} />
            <Stat label="Performance" value={`${round(r.P * 100, 1)}%`} tone={tone(r.P)} />
            <Stat label="Quality" value={`${round(r.Q * 100, 1)}%`} tone={tone(r.Q)} />
            <Stat label="OEE" value={`${round(r.oee * 100, 1)}%`} tone={tone(r.oee)} />
          </div>
          {r.P > 1 && <p className="mt-2 text-sm font-semibold text-sred">Performance above 100% means the ideal cycle time is set too slow — fix the standard.</p>}
          <svg viewBox="0 0 560 210" className="mt-3 w-full" role="img" aria-label="OEE loss waterfall">
            {bars.map((b, i) => {
              const w = 100
              const xPos = 10 + i * 110
              const sc = (v: number) => (v / planned) * 160
              let yTop: number, h: number
              if (i === 0 || i === bars.length - 1) { yTop = 180 - sc(b.v); h = sc(b.v); acc = i === 0 ? b.v : acc }
              else { yTop = 180 - sc(acc); h = sc(-b.v); acc += b.v }
              return (
                <g key={b.k}>
                  <rect x={xPos} y={yTop} width={w} height={Math.max(1, h)} fill={b.c} opacity={0.85} />
                  <text x={xPos + w / 2} y={yTop - 4} fontSize="11" textAnchor="middle" fill="var(--color-ink)">{round(Math.abs(b.v), 0)} min</text>
                  <text x={xPos + w / 2} y={198} fontSize="10" textAnchor="middle" fill="var(--color-ink-2)">{['Planned', 'Avail.', 'Perf.', 'Quality', 'Productive'][i]}</text>
                </g>
              )
            })}
          </svg>
        </Panel>
      </div>
      <p className="text-sm text-ink-2">OEE = Availability × Performance × Quality. The “six big losses” map onto those three: breakdowns and setups (availability), minor stops and reduced speed (performance), process defects and startup rejects (quality). 85% is the often-quoted “world class” benchmark; many plants run 40–60%.</p>
      <Challenges items={['Which single loss, if halved, raises OEE the most?', 'Cut setup time with SMED from 20 to 5 minutes. New OEE?', 'Why can OEE go down when you add a slower but more reliable machine? Think about the ideal cycle time.']} />
    </div>
  )
}
