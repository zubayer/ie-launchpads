import { useMemo, useState } from 'react'
import { makeRng, round } from '../lib/math'
import { Challenges, Num, Panel, Predict, Stat } from './kit'

/** Gross dies per wafer (standard approximation with edge loss). */
export const diesPerWafer = (dMm: number, areaMm2: number) => Math.floor((Math.PI * (dMm / 2) ** 2) / areaMm2 - (Math.PI * dMm) / Math.sqrt(2 * areaMm2))
export const poisson = (areaCm2: number, D: number) => Math.exp(-areaCm2 * D)
export const murphy = (areaCm2: number, D: number) => { const x = areaCm2 * D; return x === 0 ? 1 : ((1 - Math.exp(-x)) / x) ** 2 }

export default function Yield() {
  const [d, setD] = useState(300)
  const [w, setW] = useState(10) // die width mm
  const [h, setH] = useState(10)
  const [D, setDD] = useState(0.1) // defects/cm²
  const [cost, setCost] = useState(10000)
  const area = w * h
  const dpw = diesPerWafer(d, area)
  const yP = poisson(area / 100, D), yM = murphy(area / 100, D)
  const good = Math.floor(dpw * yP)
  const map = useMemo(() => {
    const r = makeRng(17)
    const cells: { x: number; y: number; ok: boolean }[] = []
    const R = d / 2
    for (let x = -R; x < R; x += w) for (let y = -R; y < R; y += h) {
      const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
      if (corners.every(([a, b]) => a * a + b * b <= (R - 3) ** 2)) cells.push({ x, y, ok: r.u() < yP })
    }
    return cells
  }, [d, w, h, yP])
  const S = 300, k = S / d
  return (
    <div className="space-y-4">
      <Predict prompt="Double the die area at the same defect density. Does yield drop by half, by less, or by more?" />
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <Panel>
          <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[300px]" role="img" aria-label="Wafer map of good and bad dies">
            <circle cx={S / 2} cy={S / 2} r={S / 2 - 1} fill="#9aa3ad" />
            {map.map((c, i) => <rect key={i} x={S / 2 + c.x * k + 0.5} y={S / 2 + c.y * k + 0.5} width={w * k - 1} height={h * k - 1} fill={c.ok ? 'var(--color-sgreen)' : 'var(--color-sred)'} opacity={0.85} />)}
            <rect x={S / 2 - 8} y={S - 6} width={16} height={6} fill="var(--color-sheet)" />
          </svg>
          <p className="mt-1 text-xs text-ink-2">Simulated wafer map (Poisson defects). Notch at the bottom.</p>
        </Panel>
        <Panel className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Num label="Wafer diameter (mm)" value={d} onChange={setD} />
            <Num label="Die width (mm)" value={w} onChange={(v) => setW(Math.max(1, v))} />
            <Num label="Die height (mm)" value={h} onChange={(v) => setH(Math.max(1, v))} />
            <Num label="Defect density D₀ (/cm²)" value={D} onChange={setDD} step={0.01} />
            <Num label="Processed wafer cost ($)" value={cost} onChange={setCost} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Gross dies per wafer" value={dpw} />
            <Stat label="Poisson yield e^(−A·D₀)" value={`${round(yP * 100, 1)}%`} />
            <Stat label="Murphy yield" value={`${round(yM * 100, 1)}%`} />
            <Stat label="Good dies (Poisson)" value={good} tone="good" />
            <Stat label="Cost per good die" value={good ? `$${round(cost / good, 2)}` : '—'} />
          </div>
          <p className="text-sm text-ink-2">Die area {area} mm² = {round(area / 100, 2)} cm². Poisson assumes defects are randomly scattered; Murphy assumes defect density varies across wafers, giving a slightly higher prediction. Real fabs fit models like negative binomial to their own data.</p>
        </Panel>
      </div>
      <Challenges items={['Go from 10×10 to 20×20 mm dies. How much does cost per good die rise?', 'Why do large AI accelerator chips push the industry toward chiplets?', 'What D₀ would you need for 90% yield on a 100 mm² die?']} />
    </div>
  )
}
