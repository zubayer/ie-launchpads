import { useState } from 'react'
import { Challenges, Num, Panel, Stat } from './kit'

export interface Station { name: string; ct: number; avail: number; yld: number } // ct in seconds; avail and yld as fractions 0–1
export interface Line { stations: Station[]; shiftSec: number; demand: number; wip: number }

/**
 * Steady-state averages for a serial line. Assumptions, shown on the page:
 * every unit visits every station once; downtime spreads evenly over the shift;
 * defects are found at final test, so every started unit uses bottleneck time.
 */
export function runLine({ stations, shiftSec, demand, wip }: Line) {
  const takt = demand > 0 ? shiftSec / demand : Infinity
  const rows = stations.map((s) => {
    const eff = s.avail > 0 ? s.ct / s.avail : Infinity
    return { ...s, eff, capacity: Number.isFinite(eff) && eff > 0 ? shiftSec / eff : 0 }
  })
  const b = rows.reduce((best, r, i) => (r.eff > rows[best].eff ? i : best), 0)
  const capacity = rows.length ? rows[b].capacity : 0
  const rty = stations.reduce((p, s) => p * s.yld, 1)
  const good = capacity * rty
  const sumCt = stations.reduce((t, s) => t + s.ct, 0)
  const maxCt = Math.max(0, ...stations.map((s) => s.ct))
  const rate = capacity / shiftSec // units started per second through the bottleneck
  return {
    takt, rows, bottleneck: b, capacity, rty, good,
    meets: good >= demand,
    balance: rows.length && maxCt ? sumCt / (rows.length * maxCt) : 0,
    leadTimeSec: rate > 0 ? wip / rate : Infinity, // Little's law: L = λW, so W = L / λ
    neededAvail: rows.length && shiftSec > 0 && rty > 0 ? (demand * rows[b].ct) / (shiftSec * rty) : Infinity,
  }
}

const MYSTERY: Line = {
  shiftSec: 25200, demand: 420, wip: 30,
  stations: [
    { name: 'Cut', ct: 50, avail: 0.95, yld: 1 }, { name: 'Weld', ct: 55, avail: 0.8, yld: 1 },
    { name: 'Paint', ct: 48, avail: 0.97, yld: 1 }, { name: 'Pack', ct: 40, avail: 0.98, yld: 1 },
  ],
}
const withWeld = (l: Line, avail: number): Line => ({ ...l, stations: l.stations.map((s) => (s.name === 'Weld' ? { ...s, avail } : s)) })
export const SCENARIOS: { id: string; name: string; what: string; line: Line }[] = [
  { id: 'mystery', name: 'Every station beats takt', what: 'Every cycle time is under the 60 s takt, yet the line misses 420 units.', line: MYSTERY },
  { id: 'smed', name: 'After SMED on Weld', what: 'Faster changeovers lift Weld’s availability from 80% to 93%.', line: withWeld(MYSTERY, 0.93) },
  { id: 'yield', name: 'Add quality losses', what: 'Same line after SMED, but three stations now make some defects.', line: { ...withWeld(MYSTERY, 0.93), stations: withWeld(MYSTERY, 0.93).stations.map((s, i) => ({ ...s, yld: [0.98, 0.95, 0.99, 1][i] })) } },
  { id: 'wip', name: 'Flood the floor with WIP', what: 'Release four times as much work into the line.', line: { ...withWeld(MYSTERY, 0.93), wip: 120 } },
]

const units = (x: number) => (Number.isFinite(x) ? Math.floor(x + 1e-9).toLocaleString() : '–') // whole units finished in the shift
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '–')
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : '–')
const dur = (s: number) => (!Number.isFinite(s) ? '–' : s >= 3600 ? `${(s / 3600).toFixed(1)} h` : `${Math.round(s / 60)} min`)

export default function Factory() {
  const [line, setLine] = useState<Line>(MYSTERY)
  const [scenario, setScenario] = useState('mystery')
  const r = runLine(line)
  const update = (l: Line) => { setLine(l); setScenario('') }
  const setSt = (i: number, k: keyof Omit<Station, 'name'>, v: number) => {
    const val = k === 'ct' ? Math.max(1, v) : Math.min(1, Math.max(0.01, v / 100))
    update({ ...line, stations: line.stations.map((s, x) => (x === i ? { ...s, [k]: val } : s)) })
  }
  const add = () => update({ ...line, stations: [...line.stations, { name: `Station ${line.stations.length + 1}`, ct: 45, avail: 0.95, yld: 1 }] })
  const remove = (i: number) => update({ ...line, stations: line.stations.filter((_, x) => x !== i) })
  const b = r.rows[r.bottleneck]

  // Bar chart geometry
  const W = 640, rowH = 34, padL = 92, padR = 16, top = 26
  const maxX = Math.max(r.takt * 1.25, ...r.rows.map((x) => (Number.isFinite(x.eff) ? x.eff : 0))) || 1
  const X = (v: number) => padL + (Math.min(v, maxX) / maxX) * (W - padL - padR)
  const H = top + r.rows.length * rowH + 8

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <button key={s.id} aria-pressed={scenario === s.id} onClick={() => { setLine(s.line); setScenario(s.id) }}
            className={`pop-btn !py-2 !text-sm ${scenario === s.id ? '!border-sblue !text-sblue' : ''}`}>{s.name}</button>
        ))}
      </div>
      {scenario && <p className="border-l-4 border-tape bg-tape/10 px-4 py-3"><strong>Predict first:</strong> {SCENARIOS.find((s) => s.id === scenario)!.what} Will it make the demand of {line.demand} good units?</p>}

      <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Panel>
          <p className="label mb-2">The shift</p>
          <div className="grid grid-cols-3 gap-2">
            <Num label="Net hours" value={+(line.shiftSec / 3600).toFixed(2)} step={0.25} min={1} max={24} onChange={(v) => update({ ...line, shiftSec: Math.max(0.25, v) * 3600 })} />
            <Num label="Demand" value={line.demand} min={1} onChange={(v) => update({ ...line, demand: Math.max(1, Math.round(v)) })} />
            <Num label="Units in WIP" value={line.wip} min={0} onChange={(v) => update({ ...line, wip: Math.max(0, Math.round(v)) })} />
          </div>
          <p className="label mb-2 mt-4">Stations, in flow order</p>
          <div className="space-y-3">
            {line.stations.map((s, i) => (
              <fieldset key={i} className="rounded-md border border-line p-2.5">
                <legend className="px-1 text-sm font-bold">{s.name}{i === r.bottleneck && <span className="ml-2 rounded bg-tape px-1.5 text-xs text-[#172033]">bottleneck</span>}</legend>
                <div className="flex items-end gap-2">
                  <Num className="min-w-0 flex-1" label="Cycle (s)" value={s.ct} min={1} onChange={(v) => setSt(i, 'ct', v)} />
                  <Num className="min-w-0 flex-1" label="Avail. %" value={+(s.avail * 100).toFixed(1)} min={1} max={100} onChange={(v) => setSt(i, 'avail', v)} />
                  <Num className="min-w-0 flex-1" label="Yield %" value={+(s.yld * 100).toFixed(1)} min={1} max={100} onChange={(v) => setSt(i, 'yld', v)} />
                  <button className="pop-btn mb-1" onClick={() => remove(i)} disabled={line.stations.length <= 2} aria-label={`Remove ${s.name}`}>×</button>
                </div>
              </fieldset>
            ))}
          </div>
          <button className="btn-ghost btn mt-3" onClick={add} disabled={line.stations.length >= 8}>Add a station</button>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <p className="label mb-1">Time per unit at each station</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Effective time per unit: ${r.rows.map((x) => `${x.name} ${f1(x.eff)} seconds`).join(', ')}. Takt time is ${f1(r.takt)} seconds. ${b ? `${b.name} is the bottleneck.` : ''}`}>
              <defs>
                <pattern id="lost" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--color-sorange)" opacity=".25" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-sorange)" strokeWidth="2.5" /></pattern>
              </defs>
              {r.rows.map((x, i) => {
                const y = top + i * rowH
                const isB = i === r.bottleneck
                return (
                  <g key={i}>
                    <text x={padL - 8} y={y + 18} textAnchor="end" fontSize="13" fontWeight={isB ? 800 : 500} fill="var(--color-ink)">{x.name}</text>
                    <rect x={padL} y={y + 4} width={X(x.ct) - padL} height={rowH - 12} rx="3" fill={isB ? 'var(--color-tape)' : 'var(--color-sblue)'} opacity={isB ? 1 : 0.75} />
                    {Number.isFinite(x.eff) && <rect x={X(x.ct)} y={y + 4} width={Math.max(0, X(x.eff) - X(x.ct))} height={rowH - 12} rx="3" fill="url(#lost)" />}
                    <text x={X(x.eff) + 6} y={y + 18} fontSize="12" fill="var(--color-ink)">{f1(x.eff)} s</text>
                  </g>
                )
              })}
              {Number.isFinite(r.takt) && (
                <g>
                  <line x1={X(r.takt)} x2={X(r.takt)} y1={top - 8} y2={H - 4} stroke="var(--color-sred)" strokeWidth="2" strokeDasharray="5 4" />
                  <text x={X(r.takt)} y={top - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-sred)">takt {f1(r.takt)} s</text>
                </g>
              )}
            </svg>
            <p className="mt-1 text-sm text-ink-2">Solid: cycle time. Hatched: time lost to downtime (cycle ÷ availability). A bar past the red line is slower than demand needs.</p>
          </Panel>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-live="polite">
            <Stat label="Takt time" value={`${f1(r.takt)} s`} />
            <Stat label={`Bottleneck: ${b?.name ?? '–'}`} value={`${f1(b?.eff ?? NaN)} s`} tone={b && b.eff > r.takt ? 'bad' : 'good'} />
            <Stat label="Units the bottleneck can start" value={units(r.capacity)} />
            <Stat label="Rolled throughput yield" value={pct(r.rty)} tone={r.rty < 0.95 ? 'warn' : undefined} />
            <Stat label={`Good units (demand ${line.demand})`} value={units(r.good)} tone={r.meets ? 'good' : 'bad'} />
            <Stat label="Availability the bottleneck needs" value={r.neededAvail > 1 ? 'over 100%' : pct(r.neededAvail)} tone={b && r.neededAvail > b.avail ? 'warn' : undefined} />
            <Stat label="Balance efficiency" value={pct(r.balance)} />
            <Stat label="Lead time (Little’s law)" value={dur(r.leadTimeSec)} />
          </div>

          <p className="text-[1.02rem]" aria-live="polite">
            {r.meets
              ? <><strong className="text-sgreen">The line meets demand.</strong> {b?.name} still sets the pace, with {units(r.good - line.demand)} good {Math.floor(r.good - line.demand + 1e-9) === 1 ? "unit" : "units"} to spare.</>
              : <><strong className="text-sred">The line falls {(line.demand - Math.floor(r.good + 1e-9)).toLocaleString()} units short.</strong> {b?.name} needs {f1(b?.eff ?? NaN)} s per unit once downtime is counted{r.rty < 1 ? `, and only ${pct(r.rty)} of units come out good` : ''}.</>}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm tabular-nums">
              <caption className="sr-only">Station results</caption>
              <thead><tr className="text-left text-xs text-ink-2"><th scope="col" className="py-2">Station</th><th scope="col" className="text-right">Cycle</th><th scope="col" className="text-right">Availability</th><th scope="col" className="text-right">Time per unit</th><th scope="col" className="text-right">Units per shift</th><th scope="col" className="text-right">Yield</th></tr></thead>
              <tbody>
                {r.rows.map((x, i) => (
                  <tr key={i} className={`border-t border-line ${i === r.bottleneck ? 'font-bold' : ''}`}>
                    <th scope="row" className="py-1.5 text-left">{x.name}</th>
                    <td className="text-right">{x.ct} s</td><td className="text-right">{pct(x.avail)}</td>
                    <td className="text-right">{f1(x.eff)} s</td><td className="text-right">{units(x.capacity)}</td><td className="text-right">{pct(x.yld)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Panel><strong>Cycle time hides downtime.</strong> Time per unit is cycle ÷ availability. A 55 s station that is up 80% of the time really needs 68.75 s per unit.</Panel>
        <Panel><strong>Only the bottleneck sets output.</strong> Speeding up any other station leaves the line’s output where it was.</Panel>
        <Panel><strong>Yields multiply.</strong> Rolled throughput yield is the product of each station’s yield, so three stations at 98%, 95% and 99% pass only 92.2%.</Panel>
        <Panel><strong>WIP adds lead time, not output.</strong> Little’s law: lead time = WIP ÷ throughput. Four times the WIP means four times the wait.</Panel>
      </div>
      <p className="text-sm text-ink-2">These are steady-state averages. They assume every unit visits every station, downtime is spread over the shift, and defects are found at final test. Real lines also lose output to blocking and starving between stations; the Simulator lab’s queueing model shows that effect.</p>
      <Challenges items={[
        'Start from “Every station beats takt”. What is the smallest Weld availability that meets 420 units?',
        'Slow Paint down until it becomes the bottleneck. At what cycle time does that happen, and what does output do?',
        'With quality losses on, which single station’s yield matters most to good output? Why?',
        'Halve the WIP. What happens to output, and what happens to lead time?',
      ]} />
    </div>
  )
}
