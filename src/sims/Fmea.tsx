import { useState } from 'react'
import { Challenges, Panel, Predict } from './kit'

interface Row { fn: string; mode: string; effect: string; s: number; cause: string; o: number; control: string; d: number; action: string }

const ROWS: Row[] = [
  { fn: 'Brake line crimp holds fluid pressure', mode: 'Crimp under-formed', effect: 'Fluid leak, loss of braking', s: 10, cause: 'Crimp die worn', o: 3, control: 'Pull test 1 per shift', d: 6, action: 'Die-wear counter + 100% crimp-height check' },
  { fn: 'Label shows correct part number', mode: 'Wrong label applied', effect: 'Wrong part shipped to customer', s: 7, cause: 'Label roll mix-up at changeover', o: 5, control: 'Visual check by operator', d: 7, action: 'Barcode scan verification (poka-yoke)' },
  { fn: 'Housing painted to spec', mode: 'Paint thickness low', effect: 'Early corrosion, cosmetic complaint', s: 5, cause: 'Spray gun clog', o: 6, control: 'Thickness gauge, 5 parts/hour', d: 3, action: 'Nozzle cleaning in standard work' },
  { fn: 'Bolt torqued to 25 N·m', mode: 'Under-torque', effect: 'Joint loosens in field', s: 8, cause: 'Wrong tool program selected', o: 2, control: 'Torque-angle monitoring, part locked out on fail', d: 2, action: '' },
]

/** Simplified action-priority screen: severity first, then occurrence, then detection.
 * The official AIAG-VDA (2019) table is more detailed — use it for real submissions. */
export function priority(s: number, o: number, d: number): 'High' | 'Medium' | 'Low' {
  if (s >= 9 && (o >= 4 || (o >= 2 && d >= 5))) return 'High'
  if (s >= 7 && o >= 6) return 'High'
  if (s >= 7 && o >= 4 && d >= 7) return 'High'
  if (s >= 9 || (s >= 7 && (o >= 4 || d >= 7)) || (s >= 4 && o >= 6 && d >= 5)) return 'Medium'
  return 'Low'
}

const N = (v: string) => Math.max(1, Math.min(10, Math.round(Number(v) || 1)))

export default function Fmea() {
  const [rows, setRows] = useState(ROWS)
  const [sort, setSort] = useState<'rpn' | 'ap'>('rpn')
  const set = (i: number, f: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...f } : x)))
  const rank = { High: 0, Medium: 1, Low: 2 }
  const view = rows.map((r, i) => ({ r, i, rpn: r.s * r.o * r.d, ap: priority(r.s, r.o, r.d) }))
    .sort((a, b) => (sort === 'rpn' ? b.rpn - a.rpn : rank[a.ap] - rank[b.ap] || b.r.s - a.r.s))
  return (
    <div className="space-y-4">
      <Predict prompt="Row 1 (brake leak) has RPN 180; row 2 (wrong label) has RPN 245. Which one should the team fix first?" />
      <Panel>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          Sort by:
          <button className={`chip !text-sm ${sort === 'rpn' ? '!border-ink !text-ink font-semibold' : ''}`} onClick={() => setSort('rpn')}>RPN (S × O × D)</button>
          <button className={`chip !text-sm ${sort === 'ap' ? '!border-ink !text-ink font-semibold' : ''}`} onClick={() => setSort('ap')}>Action priority (severity first)</button>
          <button className="btn-ghost btn ml-auto !py-1 text-sm" onClick={() => setRows((r) => [...r, { fn: 'New function', mode: '', effect: '', s: 5, cause: '', o: 5, control: '', d: 5, action: '' }])}>Add row</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b border-line text-left align-bottom">
              <th>Function / requirement</th><th>Failure mode</th><th>Effect</th><th>S</th><th>Cause</th><th>O</th><th>Current control</th><th>D</th><th>RPN</th><th>Priority</th><th>Recommended action</th>
            </tr></thead>
            <tbody>
              {view.map(({ r, i, rpn, ap }) => (
                <tr key={i} className="border-b border-line/60 align-top">
                  {(['fn', 'mode', 'effect'] as const).map((k) => <td key={k} className="py-1 pr-1"><textarea className="input !p-1 text-xs" rows={2} value={r[k]} onChange={(e) => set(i, { [k]: e.target.value })} aria-label={k} /></td>)}
                  <td className="pr-1"><input className="input !w-12 !p-1" type="number" min={1} max={10} value={r.s} onChange={(e) => set(i, { s: N(e.target.value) })} aria-label="Severity" /></td>
                  <td className="pr-1"><textarea className="input !p-1 text-xs" rows={2} value={r.cause} onChange={(e) => set(i, { cause: e.target.value })} aria-label="Cause" /></td>
                  <td className="pr-1"><input className="input !w-12 !p-1" type="number" min={1} max={10} value={r.o} onChange={(e) => set(i, { o: N(e.target.value) })} aria-label="Occurrence" /></td>
                  <td className="pr-1"><textarea className="input !p-1 text-xs" rows={2} value={r.control} onChange={(e) => set(i, { control: e.target.value })} aria-label="Control" /></td>
                  <td className="pr-1"><input className="input !w-12 !p-1" type="number" min={1} max={10} value={r.d} onChange={(e) => set(i, { d: N(e.target.value) })} aria-label="Detection" /></td>
                  <td className="wide pr-1 text-base">{rpn}</td>
                  <td className="pr-1"><span className={`chip ${ap === 'High' ? '!border-sred !text-sred' : ap === 'Medium' ? '!border-sorange !text-sorange' : ''}`}>{ap}</span></td>
                  <td><textarea className="input !p-1 text-xs" rows={2} value={r.action} onChange={(e) => set(i, { action: e.target.value })} aria-label="Action" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-2">S, O, D on 1–10 scales (10 = worst; for detection, 10 = almost certainly not detected). The priority column is a simplified severity-first screen; the AIAG-VDA FMEA handbook (2019) has the official Action Priority table.</p>
      </Panel>
      <Challenges items={['Compare the order by RPN vs by priority. Why did AIAG-VDA move away from ranking by RPN?', 'Two rows with S=10,O=1,D=10 and S=2,O=10,D=5 both have RPN 100. Are they equally urgent?', 'Add the recommended action for row 1 and re-score it. Which number can a die-wear counter lower: O or D?']} />
    </div>
  )
}
