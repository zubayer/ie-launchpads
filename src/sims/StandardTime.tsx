import { useState } from 'react'
import { PhiInv, mean, round, sd } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

interface El { name: string; obs: number[]; rating: number }
const INIT: El[] = [
  { name: 'Get part from bin, place in fixture', obs: [4.2, 4.0, 4.5, 4.1, 4.3, 3.9, 4.4, 4.2], rating: 110 },
  { name: 'Drive 4 screws with power driver', obs: [9.8, 10.4, 10.1, 9.6, 10.9, 10.2, 9.9, 10.3], rating: 95 },
  { name: 'Inspect and place in tote', obs: [3.1, 2.8, 3.4, 3.0, 2.9, 3.3, 3.2, 3.0], rating: 100 },
]

export default function StandardTime() {
  const [els, setEls] = useState(INIT)
  const [allow, setAllow] = useState(15)
  const [acc, setAcc] = useState(5)
  const [conf, setConf] = useState(95)
  const z = PhiInv(1 - (1 - conf / 100) / 2)
  const rows = els.map((e) => {
    const ot = mean(e.obs), s = sd(e.obs)
    const nt = ot * (e.rating / 100)
    const need = Math.ceil(((z * s) / ((acc / 100) * ot)) ** 2)
    return { ot, s, nt, need }
  })
  const NT = rows.reduce((a, r) => a + r.nt, 0)
  const ST = NT * (1 + allow / 100)
  const STwork = NT / (1 - allow / 100)
  const set = (i: number, f: Partial<El>) => setEls(els.map((e, k) => (k === i ? { ...e, ...f } : e)))
  return (
    <div className="space-y-4">
      <Predict prompt="The operator worked faster than normal on element 1 (rated 110%). Will the standard time for that element be higher or lower than the stopwatch average?" />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-line text-left"><th>Element</th><th>Observed times (s), comma-separated</th><th>Rating %</th><th>Avg OT</th><th>Normal time</th><th>Cycles needed</th></tr></thead>
            <tbody>
              {els.map((e, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-1 pr-2"><input className="input !py-1" value={e.name} onChange={(ev) => set(i, { name: ev.target.value })} aria-label="Element" /></td>
                  <td className="pr-2"><input className="input !py-1" defaultValue={e.obs.join(', ')} onBlur={(ev) => set(i, { obs: ev.target.value.split(/[,\s]+/).map(Number).filter((v) => v > 0) })} aria-label="Observations" /></td>
                  <td className="pr-2"><input type="number" className="input !w-20 !py-1" value={e.rating} onChange={(ev) => set(i, { rating: Number(ev.target.value) })} aria-label="Rating" /></td>
                  <td>{round(rows[i].ot, 2)}</td>
                  <td className="font-semibold">{round(rows[i].nt, 2)}</td>
                  <td className={rows[i].need > e.obs.length ? 'text-sred' : 'text-sgreen'}>{rows[i].need} {rows[i].need > e.obs.length ? `(have ${e.obs.length})` : '✓'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="grid grid-cols-3 gap-3">
          <Num label="PF&D allowance %" value={allow} onChange={setAllow} />
          <Num label="Accuracy ± %" value={acc} onChange={setAcc} />
          <Num label="Confidence %" value={conf} onChange={setConf} />
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Normal time / cycle" value={`${round(NT, 2)} s`} />
            <Stat label="Standard time (allowance on NT)" value={`${round(ST, 2)} s`} tone="good" />
            <Stat label="Standard time (allowance on workday)" value={`${round(STwork, 2)} s`} />
            <Stat label="Standard output / 8 h" value={Math.floor((8 * 3600) / ST).toLocaleString()} />
          </div>
          <p className="mt-2 text-xs text-ink-2">Normal time = observed × rating. Standard time = NT × (1 + A) when the allowance is a % of normal time, or NT / (1 − A) when it is a % of the workday. Know which convention your plant uses.</p>
        </Panel>
      </div>
      <Challenges items={['Element 2 varies the most. How many cycles does it need at ±5%, 95%?', 'Change the rating on element 1 to 100%. How does the standard change?', 'Why is performance rating the most criticized part of stopwatch time study?']} />
    </div>
  )
}
