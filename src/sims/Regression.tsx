import { useState } from 'react'
import { linreg, round } from '../lib/math'
import { Axes, Challenges, Panel, Predict, Stat, scale, ticks } from './kit'

const PRESET: [number, number][] = [[1, 2.1], [2, 3.9], [3, 6.2], [4, 7.8], [5, 9.9], [6, 12.3], [7, 13.8], [8, 16.1]]

export default function Regression() {
  const [pts, setPts] = useState<[number, number][]>(PRESET)
  const [showRes, setShowRes] = useState(true)
  const W = 640, H = 360, P = 40
  const x = scale(0, 10, P, W - 10)
  const y = scale(0, 20, H - P, 10)
  const ok = pts.length >= 2 && new Set(pts.map((p) => p[0])).size > 1
  const fit = ok ? linreg(pts.map((p) => p[0]), pts.map((p) => p[1])) : null
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const m = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    const vx = ((m.x - P) / (W - 10 - P)) * 10
    const vy = ((H - P - m.y) / (H - P - 10)) * 20
    if (vx >= 0 && vx <= 10 && vy >= 0 && vy <= 20) setPts((p) => [...p, [round(vx, 2), round(vy, 2)]])
  }
  return (
    <div className="space-y-4">
      <Predict prompt="Add one point far above the line at x = 9. How much do you think the slope and R² will move?" />
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair" onClick={click} role="img" aria-label="Scatter plot; click to add points">
          <Axes w={W} h={H} pad={P} x={x} y={y} xTicks={ticks(0, 10)} yTicks={ticks(0, 20, 4)} xLabel="Machine speed (x)" yLabel="Output (y)" />
          {fit && <line x1={x(0)} x2={x(10)} y1={y(fit.b0)} y2={y(fit.b0 + 10 * fit.b1)} stroke="var(--color-sblue)" strokeWidth={2.5} />}
          {fit && showRes && pts.map(([a, b], i) => <line key={'r' + i} x1={x(a)} x2={x(a)} y1={y(b)} y2={y(fit.b0 + fit.b1 * a)} stroke="var(--color-sorange)" />)}
          {pts.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={5} fill="var(--color-ink)" />)}
        </svg>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn-ghost btn" onClick={() => setPts((p) => p.slice(0, -1))}>Remove last point</button>
          <button className="btn-ghost btn" onClick={() => setPts([])}>Clear</button>
          <button className="btn-ghost btn" onClick={() => setPts(PRESET)}>Reset data</button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showRes} onChange={(e) => setShowRes(e.target.checked)} /> Show residuals</label>
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Intercept b₀" value={fit ? round(fit.b0, 3) : '—'} />
        <Stat label="Slope b₁" value={fit ? round(fit.b1, 3) : '—'} />
        <Stat label="R²" value={fit ? round(fit.r2, 3) : '—'} />
        <Stat label="Points" value={pts.length} />
      </div>
      <p className="text-sm text-ink-2">Least squares picks the line that minimizes the sum of squared orange residuals. Click anywhere on the chart to add a point.</p>
      <Challenges items={['Make R² close to 0 while keeping 8 points.', 'Add an outlier at x = 9.5 and see how far the slope tilts — leverage.', 'Can R² be high while the relationship is clearly curved? Try it.']} />
    </div>
  )
}
