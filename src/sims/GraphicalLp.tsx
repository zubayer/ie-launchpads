import { useState } from 'react'
import { round } from '../lib/math'
import { Axes, Challenges, Panel, Predict, Slider, Stat, scale, ticks } from './kit'

// max c1 x + c2 y  s.t.  a1 x + b1 y <= r1 ; a2 x + b2 y <= r2 ; x,y >= 0
export function cornerPoints(a1: number, b1: number, r1: number, a2: number, b2: number, r2: number) {
  const cand: [number, number][] = [[0, 0], [r1 / a1, 0], [r2 / a2, 0], [0, r1 / b1], [0, r2 / b2]]
  const det = a1 * b2 - a2 * b1
  if (Math.abs(det) > 1e-9) cand.push([(r1 * b2 - r2 * b1) / det, (a1 * r2 - a2 * r1) / det])
  return cand.filter(([x, y]) => x >= -1e-9 && y >= -1e-9 && a1 * x + b1 * y <= r1 + 1e-9 && a2 * x + b2 * y <= r2 + 1e-9)
}

export default function GraphicalLp() {
  const [c1, setC1] = useState(30)
  const [c2, setC2] = useState(40)
  const [a1, b1, r1] = [2, 4, 80] // assembly hours
  const [a2, b2, r2] = [3, 2, 60] // machining hours
  const corners = cornerPoints(a1, b1, r1, a2, b2, r2)
  const best = corners.reduce((bst, p) => (c1 * p[0] + c2 * p[1] > c1 * bst[0] + c2 * bst[1] ? p : bst), [0, 0])
  const z = c1 * best[0] + c2 * best[1]
  const W = 520, H = 420, P = 40, M = 42
  const x = scale(0, M, P, W - 10), y = scale(0, M, H - P, 10)
  // polygon of feasible region, ordered by angle around centroid
  const cx = corners.reduce((s, p) => s + p[0], 0) / corners.length, cy = corners.reduce((s, p) => s + p[1], 0) / corners.length
  const poly = [...corners].sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx))
  // iso-profit line through optimum: c1 x + c2 y = z
  const iso = [[0, z / c2], [z / c1, 0]]
  return (
    <div className="space-y-4">
      <Predict prompt="Product Y earns more per unit. Will the best plan be on the Y axis, the X axis, or a corner where both are made?" />
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <Panel>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Feasible region">
            <Axes w={W} h={H} pad={P} x={x} y={y} xTicks={ticks(0, 40, 4)} yTicks={ticks(0, 40, 4)} xLabel="x = units of product X" yLabel="y = units of product Y" />
            <polygon points={poly.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} fill="var(--color-sgreen)" opacity={0.18} stroke="var(--color-sgreen)" />
            <line x1={x(0)} y1={y(r1 / b1)} x2={x(r1 / a1)} y2={y(0)} stroke="var(--color-sblue)" strokeWidth={2} />
            <line x1={x(0)} y1={y(r2 / b2)} x2={x(r2 / a2)} y2={y(0)} stroke="var(--color-sorange)" strokeWidth={2} />
            <line x1={x(iso[0][0])} y1={y(Math.min(iso[0][1], M))} x2={x(Math.min(iso[1][0], M))} y2={y(iso[1][1])} stroke="var(--color-ink)" strokeDasharray="6 4" />
            {corners.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={4} fill="var(--color-ink)" />)}
            <circle cx={x(best[0])} cy={y(best[1])} r={8} fill="var(--color-tape)" stroke="var(--color-ink)" strokeWidth={2} />
          </svg>
          <p className="text-sm text-ink-2"><span className="text-sblue">Blue</span>: assembly 2x + 4y ≤ 80. <span className="text-sorange">Orange</span>: machining 3x + 2y ≤ 60. Dashed: iso-profit line at the optimum.</p>
        </Panel>
        <Panel className="space-y-3">
          <Slider label="Profit per X ($)" value={c1} min={5} max={100} onChange={setC1} />
          <Slider label="Profit per Y ($)" value={c2} min={5} max={100} onChange={setC2} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Make X" value={round(best[0], 2)} />
            <Stat label="Make Y" value={round(best[1], 2)} />
          </div>
          <Stat label="Max profit" value={`$${round(z, 2)}`} tone="good" />
          <p className="text-sm">The optimum of a linear program is always at a corner of the feasible region (or along an edge, when the iso-profit line is parallel to it) — that is why the simplex method walks from corner to corner.</p>
        </Panel>
      </div>
      <Challenges items={['Find profit values where the optimum jumps to a different corner.', 'Set X:Y profit ratio equal to 3:2 (the machining slope). What happens?', 'Which constraint is binding at the optimum?']} />
    </div>
  )
}
