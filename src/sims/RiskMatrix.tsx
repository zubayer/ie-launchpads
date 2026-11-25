import { useState } from 'react'
import { Challenges, Panel, Predict } from './kit'

const CONTROLS = [
  { k: 'none', name: 'No control yet', dS: 0, dL: 0 },
  { k: 'elim', name: 'Elimination — remove the hazard', dS: 5, dL: 5 },
  { k: 'sub', name: 'Substitution — use something less hazardous', dS: 2, dL: 1 },
  { k: 'eng', name: 'Engineering — guard, interlock, isolate', dS: 0, dL: 2 },
  { k: 'admin', name: 'Administrative — procedure, training, signage', dS: 0, dL: 1 },
  { k: 'ppe', name: 'PPE — gloves, glasses, hearing protection', dS: 1, dL: 0 },
]
interface Hazard { name: string; s: number; l: number; c: string }
const INIT: Hazard[] = [
  { name: 'Forklift strikes pedestrian in aisle', s: 5, l: 3, c: 'none' },
  { name: 'Hand caught in press point of operation', s: 4, l: 3, c: 'none' },
  { name: 'Solvent vapor exposure at parts washer', s: 3, l: 4, c: 'none' },
  { name: 'Trip over hoses at cell 4', s: 2, l: 4, c: 'none' },
]
const level = (s: number, l: number) => { const r = s * l; return r >= 15 ? 'High' : r >= 8 ? 'Medium' : 'Low' }
const COLOR = { High: 'var(--color-sred)', Medium: 'var(--color-sorange)', Low: 'var(--color-sgreen)' }

export default function RiskMatrix() {
  const [hz, setHz] = useState(INIT)
  const residual = (h: Hazard) => { const c = CONTROLS.find((x) => x.k === h.c)!; return { s: Math.max(1, h.s - c.dS), l: Math.max(1, h.l - c.dL) } }
  return (
    <div className="space-y-4">
      <Predict prompt="For the press hazard, does adding training move the risk as much as a light-curtain interlock? Which axis does each one change?" />
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Panel>
          <div className="grid grid-cols-[2rem_repeat(5,3.6rem)] gap-1 text-xs">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="contents">
                <div className="flex items-center justify-center font-semibold">S{s}</div>
                {[1, 2, 3, 4, 5].map((l) => {
                  const lv = level(s, l)
                  const here = hz.map((h, i) => ({ h, i, r: residual(h) })).filter((x) => (x.h.s === s && x.h.l === l) || (x.r.s === s && x.r.l === l && x.h.c !== 'none'))
                  return (
                    <div key={l} className="relative flex h-14 flex-wrap items-center justify-center gap-0.5 rounded-sm" style={{ background: `color-mix(in srgb, ${COLOR[lv]} 22%, transparent)` }}>
                      {here.map(({ h, i, r }) => {
                        const isRes = h.c !== 'none' && r.s === s && r.l === l
                        const isInit = h.s === s && h.l === l
                        return (
                          <span key={i + (isRes ? 'r' : 'i')} title={`${h.name} (${isRes && !isInit ? 'residual' : 'initial'})`}
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${isRes && !isInit ? 'bg-sgreen text-white' : 'border-2 border-ink bg-sheet'}`}>{i + 1}</span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
            <div />
            {[1, 2, 3, 4, 5].map((l) => <div key={l} className="text-center font-semibold">L{l}</div>)}
          </div>
          <p className="mt-2 max-w-xs text-xs text-ink-2">S = severity, L = likelihood (1–5). Outlined = initial risk; green = residual after the control.</p>
        </Panel>
        <Panel>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left"><th>#</th><th>Hazard</th><th>S</th><th>L</th><th>Control</th><th>Residual</th></tr></thead>
            <tbody>
              {hz.map((h, i) => {
                const r = residual(h)
                const set = (f: Partial<Hazard>) => setHz(hz.map((x, k) => (k === i ? { ...x, ...f } : x)))
                return (
                  <tr key={i} className="border-b border-line/60">
                    <td className="py-1 font-bold">{i + 1}</td>
                    <td><input className="input !py-1" value={h.name} onChange={(e) => set({ name: e.target.value })} aria-label="Hazard" /></td>
                    <td><select className="input !w-14 !py-1" value={h.s} onChange={(e) => set({ s: Number(e.target.value) })} aria-label="Severity">{[1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}</select></td>
                    <td><select className="input !w-14 !py-1" value={h.l} onChange={(e) => set({ l: Number(e.target.value) })} aria-label="Likelihood">{[1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}</select></td>
                    <td><select className="input !py-1" value={h.c} onChange={(e) => set({ c: e.target.value })} aria-label="Control">{CONTROLS.map((c) => <option key={c.k} value={c.k}>{c.name}</option>)}</select></td>
                    <td><span className="chip" style={{ borderColor: COLOR[level(r.s, r.l)], color: COLOR[level(r.s, r.l)] }}>{level(r.s, r.l)} ({r.s * r.l})</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button className="btn-ghost btn mt-3 !py-1 text-sm" onClick={() => setHz([...hz, { name: 'New hazard', s: 3, l: 3, c: 'none' }])}>Add hazard</button>
          <p className="mt-3 text-xs text-ink-2">Control effects here are illustrative. Real assessments re-score with the team and verify the control works (ALARP: reduce risk until further reduction is grossly disproportionate to the benefit).</p>
        </Panel>
      </div>
      <Challenges items={['Get every hazard to Low using the highest control you realistically can.', 'Why is PPE the last line of defense even though it is cheapest?', 'Which hazards could be eliminated by redesigning the layout?']} />
    </div>
  )
}
