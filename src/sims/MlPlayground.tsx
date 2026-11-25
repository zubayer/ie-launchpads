import { useMemo, useState } from 'react'
import { makeRng, round } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat } from './kit'

type P = { x: number; y: number; c: number }
const COLORS = ['var(--color-sblue)', 'var(--color-sorange)', 'var(--color-sgreen)', 'var(--color-sred)', '#6a4c9c', 'var(--color-ink-2)']

function blobs(seed: number): P[] {
  const r = makeRng(seed)
  const centers = [[25, 30, 0], [70, 25, 1], [50, 72, 1], [20, 75, 0]]
  return centers.flatMap(([cx, cy, c]) => Array.from({ length: 14 }, () => ({ x: r.normal(cx, 8), y: r.normal(cy, 8), c })))
}

export function kmeansStep(pts: P[], cents: { x: number; y: number }[]) {
  const assigned = pts.map((p) => {
    let best = 0, bd = Infinity
    cents.forEach((c, i) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = i } })
    return { ...p, c: best }
  })
  const next = cents.map((c, i) => {
    const m = assigned.filter((p) => p.c === i)
    return m.length ? { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length } : c
  })
  const inertia = assigned.reduce((s, p) => s + (p.x - next[p.c].x) ** 2 + (p.y - next[p.c].y) ** 2, 0)
  return { assigned, next, inertia }
}

export function knn(pts: P[], x: number, y: number, k: number) {
  const near = pts.map((p) => ({ p, d: (p.x - x) ** 2 + (p.y - y) ** 2 })).sort((a, b) => a.d - b.d).slice(0, k)
  const votes: Record<number, number> = {}
  near.forEach((n) => (votes[n.p.c] = (votes[n.p.c] || 0) + 1))
  return Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0)
}

export default function MlPlayground() {
  const [mode, setMode] = useState<'knn' | 'kmeans'>('knn')
  const [pts, setPts] = useState<P[]>(() => blobs(4))
  const [k, setK] = useState(3)
  const [brush, setBrush] = useState(0)
  const [cents, setCents] = useState<{ x: number; y: number }[]>([])
  const [iters, setIters] = useState(0)
  const [inertia, setInertia] = useState<number | null>(null)
  const S = 400

  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget, pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const m = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    setPts((p) => [...p, { x: (m.x / S) * 100, y: (m.y / S) * 100, c: mode === 'knn' ? brush : 0 }])
  }
  const grid = useMemo(() => {
    if (mode !== 'knn' || pts.length < k) return []
    const cells: { x: number; y: number; c: number }[] = []
    for (let gx = 2.5; gx < 100; gx += 5) for (let gy = 2.5; gy < 100; gy += 5) cells.push({ x: gx, y: gy, c: knn(pts, gx, gy, k) })
    return cells
  }, [pts, k, mode])
  // leave-one-out accuracy for k-NN
  const loo = useMemo(() => {
    if (mode !== 'knn' || pts.length <= k) return null
    let ok = 0
    pts.forEach((p, i) => { if (knn(pts.filter((_, j) => j !== i), p.x, p.y, k) === p.c) ok++ })
    return ok / pts.length
  }, [pts, k, mode])

  const initK = () => {
    const r = makeRng(Date.now() % 100000)
    setCents(Array.from({ length: k }, () => pts[Math.floor(r.u() * pts.length)]).map((p) => ({ x: p.x, y: p.y })))
    setIters(0); setInertia(null)
  }
  const step = () => {
    if (!cents.length) return initK()
    const s = kmeansStep(pts, cents)
    setPts(s.assigned); setCents(s.next); setIters((i) => i + 1); setInertia(s.inertia)
  }

  return (
    <div className="space-y-4">
      <Predict prompt={mode === 'knn' ? 'With k = 1 the boundary hugs every point. Will k = 15 be more or less likely to overfit?' : 'k-means always finds the “right” groups, as long as you pick the right k. True or false?'} />
      <div className="flex flex-wrap gap-2">
        <button aria-pressed={mode === 'knn'} onClick={() => setMode('knn')} className={`chip !text-sm ${mode === 'knn' ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>Supervised: k-nearest neighbors</button>
        <button aria-pressed={mode === 'kmeans'} onClick={() => { setMode('kmeans'); setCents([]); setPts((p) => p.map((q) => ({ ...q, c: 5 }))) }} className={`chip !text-sm ${mode === 'kmeans' ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>Unsupervised: k-means clustering</button>
      </div>
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <Panel>
          <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[400px] cursor-crosshair rounded-md border border-line" onClick={click} role="img" aria-label="2D data; click to add points">
            {grid.map((g, i) => <rect key={i} x={((g.x - 2.5) / 100) * S} y={((g.y - 2.5) / 100) * S} width={S / 20} height={S / 20} fill={COLORS[g.c]} opacity={0.15} />)}
            {pts.map((p, i) => <circle key={i} cx={(p.x / 100) * S} cy={(p.y / 100) * S} r={5} fill={COLORS[p.c]} stroke="var(--color-sheet)" strokeWidth={1.5} />)}
            {mode === 'kmeans' && cents.map((c, i) => (
              <g key={i}><rect x={(c.x / 100) * S - 9} y={(c.y / 100) * S - 9} width={18} height={18} fill={COLORS[i]} stroke="var(--color-ink)" strokeWidth={2.5} transform={`rotate(45 ${(c.x / 100) * S} ${(c.y / 100) * S})`} /></g>
            ))}
          </svg>
        </Panel>
        <Panel className="space-y-3">
          <Slider label={mode === 'knn' ? 'k (neighbors that vote)' : 'k (number of clusters)'} value={k} min={1} max={mode === 'knn' ? 15 : 6} onChange={(v) => { setK(v); if (mode === 'kmeans') setCents([]) }} />
          {mode === 'knn' ? (
            <>
              <div className="flex gap-2 text-sm">Click to add class:
                {[0, 1].map((c) => <button key={c} onClick={() => setBrush(c)} className={`chip ${brush === c ? '!border-ink font-semibold' : ''}`}><span className="h-3 w-3 rounded-full" style={{ background: COLORS[c] }} />{c === 0 ? 'Good part' : 'Defect'}</button>)}
              </div>
              <Stat label="Leave-one-out accuracy" value={loo === null ? '—' : `${round(loo * 100, 1)}%`} />
              <p className="text-sm text-ink-2">Each shaded cell is predicted by majority vote of its k nearest labeled points. Small k: jagged boundary, low bias, high variance. Large k: smooth boundary, can underfit.</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={initK}>Place {k} random centroids</button>
                <button className="btn-ghost btn" onClick={step}>Assign & update (1 iteration)</button>
                <button className="btn-ghost btn" onClick={() => { let c = cents.length ? cents : []; let p = pts; let inr = 0; if (!c.length) return initK(); for (let i = 0; i < 20; i++) { const s = kmeansStep(p, c); p = s.assigned; c = s.next; inr = s.inertia } setPts(p); setCents(c); setIters((x) => x + 20); setInertia(inr) }}>Run to convergence</button>
              </div>
              <div className="grid grid-cols-2 gap-2"><Stat label="Iterations" value={iters} /><Stat label="Inertia (within-cluster SS)" value={inertia === null ? '—' : Math.round(inertia).toLocaleString()} /></div>
              <p className="text-sm text-ink-2">k-means repeats two steps: assign each point to its nearest centroid, then move each centroid to the mean of its points. Different starts can give different answers — run it a few times.</p>
            </>
          )}
          <div className="flex gap-2">
            <button className="btn-ghost btn !py-1 text-sm" onClick={() => { setPts(blobs(Date.now() % 1000)); setCents([]) }}>New data</button>
            <button className="btn-ghost btn !py-1 text-sm" onClick={() => { setPts([]); setCents([]) }}>Clear</button>
          </div>
        </Panel>
      </div>
      <Challenges items={['k-NN: find the k with the best leave-one-out accuracy. Why not just k = 1?', 'k-means: plot inertia for k = 1…6. Where is the “elbow”?', 'Which method needs labeled data? Which would you use to group machines by sensor behavior with no failure labels?']} />
    </div>
  )
}
