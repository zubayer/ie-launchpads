import { useId, useMemo, useState, type ReactNode } from 'react'
import { cantilever, dependents, evalEquations, project, rebuild, viewEdges, type Equation, type Motion, type SCon, type Sketch, type V3, type Voxel } from '../lib/cad'
import { BRACKET, FEATURES, MATES, PARTS, SKETCH_MAP } from '../content/cad/course'
import { featureOrder, keepPart, mateState, sketchState } from '../content/cad/grade'

const INK = 'var(--color-ink)', BLUE = 'var(--color-sblue)', RED = 'var(--color-sred)', GREEN = 'var(--color-sgreen)', MUTED = 'var(--color-ink-2)', LINE = 'var(--color-line)'
const STATUS: Record<string, { label: string; cls: string }> = {
  under: { label: 'Under defined', cls: 'text-sblue' }, fully: { label: 'Fully defined', cls: 'text-sgreen' }, over: { label: 'Over defined', cls: 'text-sred' },
}
const Stat = ({ k, v, cls = '' }: { k: string; v: ReactNode; cls?: string }) => (
  <div className="rounded-md border border-line px-3 py-1.5"><div className="text-xs text-ink-2">{k}</div><div className={`text-lg font-bold tabular-nums ${cls}`}>{v}</div></div>
)

// ---------- Sketch ----------
function SketchSvg({ s, cons, free, over }: { s: Sketch; cons: SCon[]; free: Set<string>; over: boolean }) {
  const xs = [...s.points.map((p) => p.x), ...s.circles.map((c) => { const p = s.points.find((q) => q.id === c.c)!; return [p.x - c.r, p.x + c.r] }).flat(), 0]
  const ys = [...s.points.map((p) => p.y), ...s.circles.map((c) => { const p = s.points.find((q) => q.id === c.c)!; return [p.y - c.r, p.y + c.r] }).flat(), 0]
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const W = 380, pad = 34, k = Math.min((W - 2 * pad) / (x1 - x0 || 1), 220 / (y1 - y0 || 1))
  const H = (y1 - y0) * k + 2 * pad
  const X = (x: number) => pad + (x - x0) * k, Y = (y: number) => H - pad - (y - y0) * k
  const P = (id: string) => s.points.find((p) => p.id === id)!
  const col = (id: string) => (free.has(id) ? BLUE : INK)
  const badges: { x: number; y: number; t: string }[] = []
  for (const c of cons) {
    const mid = (l: string) => { const L = s.lines.find((q) => q.id === l)!; const a = P(L.a), b = P(L.b); return { x: (X(a.x) + X(b.x)) / 2, y: (Y(a.y) + Y(b.y)) / 2 } }
    if (c.k === 'horizontal' || c.k === 'vertical') { const m = mid(c.l); badges.push({ x: m.x + (c.k === 'vertical' ? 12 : -14), y: m.y + (c.k === 'horizontal' ? -8 : 4), t: c.k === 'horizontal' ? 'H' : 'V' }) }
    if (c.k === 'length') { const m = mid(c.l); badges.push({ x: m.x + 10, y: m.y + 16, t: String(c.v) }) }
    if (c.k === 'parallel' || c.k === 'perpendicular' || c.k === 'equal') { const m = mid(c.l2); badges.push({ x: m.x + 14, y: m.y - 8, t: c.k === 'parallel' ? '∥' : c.k === 'perpendicular' ? '⊥' : '=' }) }
    if (c.k === 'diameter') { const C = s.circles.find((q) => q.id === c.c)!; const p = P(C.c); badges.push({ x: X(p.x) + C.r * k + 6, y: Y(p.y) - C.r * k, t: `⌀${c.v}` }) }
    if (c.k === 'hdist') { const a = P(c.p), b = P(c.q); badges.push({ x: (X(a.x) + X(b.x)) / 2, y: Y(Math.max(a.y, b.y)) - 10, t: String(c.v) }) }
    if (c.k === 'vdist') { const a = P(c.p), b = P(c.q); badges.push({ x: X(Math.max(a.x, b.x)) + 14, y: (Y(a.y) + Y(b.y)) / 2, t: String(c.v) }) }
    if (c.k === 'tangent') { const C = s.circles.find((q) => q.id === c.c)!; const p = P(C.c); badges.push({ x: X(p.x) - 6, y: Y(p.y) - C.r * k - 8, t: 'T' }) }
    if (c.k === 'origin') { const p = P(c.p); badges.push({ x: X(p.x) - 12, y: Y(p.y) + 16, t: '⌖' }) }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px]" role="img" aria-label={`Sketch: ${s.lines.length} lines, ${s.circles.length} circles. ${free.size ? `${free.size} entities can still move.` : 'Nothing can move.'}${over ? ' Over defined.' : ''}`}>
      <line x1={X(0) - 10} x2={X(0) + 10} y1={Y(0)} y2={Y(0)} stroke={RED} strokeWidth={1} />
      <line x1={X(0)} x2={X(0)} y1={Y(0) - 10} y2={Y(0) + 10} stroke={RED} strokeWidth={1} />
      {s.lines.map((l) => { const a = P(l.a), b = P(l.b); return <line key={l.id} x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} stroke={over ? RED : col(l.id)} strokeWidth={2.5} /> })}
      {s.circles.map((c) => { const p = P(c.c); return <circle key={c.id} cx={X(p.x)} cy={Y(p.y)} r={c.r * k} fill="none" stroke={over ? RED : col(c.id)} strokeWidth={2.5} /> })}
      {s.points.map((p) => <circle key={p.id} cx={X(p.x)} cy={Y(p.y)} r={3.5} fill={over ? RED : col(p.id)} />)}
      {badges.map((b, i) => <text key={i} x={b.x} y={b.y} fontSize={12} fontWeight={700} textAnchor="middle" fill={MUTED}>{b.t}</text>)}
    </svg>
  )
}

export function SketchLab({ preset, picked, setPicked }: { preset: string; picked: string[]; setPicked: (p: string[]) => void }) {
  const p = SKETCH_MAP[preset]
  const a = useMemo(() => sketchState(preset, picked), [preset, picked])
  const cons = [...p.given.map((g) => g.value), ...p.options.filter((o) => picked.includes(o.id)).map((o) => o.value)]
  const order = p.options.filter((o) => picked.includes(o.id)).map((o) => o.id)
  const gain = (id: string) => a.removed[p.given.length + order.indexOf(id)]
  const st = STATUS[a.status]
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <SketchSvg s={p.sketch} cons={cons} free={a.free} over={a.status === 'over'} />
        <p className="mt-1 text-xs text-ink-2">Blue: can still move. Black: fully defined. Red: over defined. The red cross is the origin.</p>
        <div className="mt-2 grid grid-cols-3 gap-2" aria-live="polite">
          <Stat k="Degrees of freedom" v={a.dof} /><Stat k="Redundant" v={a.redundant} cls={a.redundant ? 'text-sred' : ''} /><Stat k="Status" v={st.label} cls={st.cls} />
        </div>
      </div>
      <div>
        {p.given.length > 0 && <p className="mb-2 text-sm text-ink-2">Already applied: the {p.given.length} relations and dimensions that fully define the rectangle (four horizontal/vertical, corner on the origin, width and height).</p>}
        <fieldset>
          <legend className="label mb-1">Relations and dimensions</legend>
          <ul className="space-y-1">
            {p.options.map((o) => {
              const on = picked.includes(o.id)
              const g = on ? gain(o.id) : undefined
              return (
                <li key={o.id}>
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== o.id) : [...picked, o.id])} />
                    <span>{o.label}{on && <span className={`ml-1 text-xs ${g === 0 ? 'font-semibold text-sred' : 'text-ink-2'}`}>{g === 0 ? '(redundant)' : `(−${g})`}</span>}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
        <button type="button" className="mt-2 text-sm underline" onClick={() => setPicked([])}>Clear</button>
      </div>
    </div>
  )
}

// ---------- Mates ----------
const iso = (p: V3): [number, number] => [(p[0] + p[1]) * 0.866, (p[0] - p[1]) * 0.5 - p[2]]
function Box({ a, b, fill, stroke, opacity = 1 }: { a: V3; b: V3; fill: string; stroke: string; opacity?: number }) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b
  const f = (pts: V3[]) => pts.map(iso).map((q) => q.join(',')).join(' ')
  return (
    <g opacity={opacity}>
      <polygon points={f([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <polygon points={f([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]])} fill="var(--color-grid)" stroke={stroke} strokeWidth={1.2} />
      <polygon points={f([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])} fill="var(--color-line)" stroke={stroke} strokeWidth={1.2} />
    </g>
  )
}
const describe = (m: Motion) => {
  const ax = (d: V3) => { const i = d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs))); return ['x (along the plate)', 'y (front to back)', 'z (up)'][i] }
  if (m.kind === 'slide') return `slides along ${ax(m.dir)}`
  const t = m.through!
  const at = Math.hypot(t[0], t[1], t[2]) < 1e-6 ? 'through the corner' : `through (${t.map((v) => +v.toFixed(1)).join(', ')}) mm`
  return `rotates about an axis along ${ax(m.dir)}, ${at}`
}
export function MateLab({ picked, setPicked }: { picked: string[]; setPicked: (p: string[]) => void }) {
  const a = useMemo(() => mateState(picked), [picked])
  const pts: V3[] = [[0, 0, -10], [100, 50, 30]]
  const all = pts.flatMap((p) => [iso(p), iso([p[0], 50, p[2]]), iso([100, p[1], p[2]])])
  const minX = Math.min(...all.map((q) => q[0])) - 30, maxX = Math.max(...all.map((q) => q[0])) + 30, minY = Math.min(...all.map((q) => q[1])) - 40, maxY = Math.max(...all.map((q) => q[1])) + 30
  const c: V3 = [40, 20, 12]
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="w-full max-w-[440px]" role="img" aria-label={`Block on a plate. ${a.dof} degrees of freedom: ${a.motions.map(describe).join('; ') || 'fixed'}.`}>
          <defs><marker id="mate-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={GREEN} /></marker></defs>
          <Box a={[0, 0, -10]} b={[100, 50, 0]} fill="var(--color-paper)" stroke={INK} />
          {[[20, 20], [60, 20]].map(([x, y], i) => { const [px, py] = iso([x, y, 0]); return <ellipse key={i} cx={px} cy={py} rx={6} ry={3.5} fill="none" stroke={MUTED} strokeDasharray="2 2" /> })}
          <Box a={[0, 0, 0]} b={[80, 40, 25]} fill="var(--color-sheet)" stroke={a.dof === 0 ? INK : BLUE} opacity={0.92} />
          {[[20, 20], [60, 20]].map(([x, y], i) => { const [p1x, p1y] = iso([x, y, -10]), [p2x, p2y] = iso([x, y, 25]); return <line key={i} x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke={MUTED} strokeDasharray="4 3" /> })}
          {a.dof <= 3 && a.motions.map((m, i) => {
            if (m.kind === 'slide') {
              const [sx, sy] = iso(c), [ex, ey] = iso([c[0] + m.dir[0] * 40, c[1] + m.dir[1] * 40, c[2] + m.dir[2] * 40])
              return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke={GREEN} strokeWidth={3} markerEnd="url(#mate-arrow)" markerStart="url(#mate-arrow)" />
            }
            const t = m.through!, d = m.dir
            const [ax1, ay1] = iso([t[0] - d[0] * 20, t[1] - d[1] * 20, t[2] - d[2] * 20 + (Math.abs(d[2]) > 0.5 ? 0 : 12)]), [ax2, ay2] = iso([t[0] + d[0] * 45, t[1] + d[1] * 45, t[2] + d[2] * 45 + (Math.abs(d[2]) > 0.5 ? 0 : 12)])
            return (
              <g key={i}>
                <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke={GREEN} strokeWidth={1.5} strokeDasharray="6 3" />
                <path d={`M ${ax2 - 14} ${ay2 + 4} A 16 7 0 1 0 ${ax2 + 14} ${ay2 + 4}`} fill="none" stroke={GREEN} strokeWidth={2.5} markerEnd="url(#mate-arrow)" />
              </g>
            )
          })}
        </svg>
        <div className="mt-2 grid grid-cols-3 gap-2" aria-live="polite">
          <Stat k="Degrees of freedom" v={a.dof} cls={a.dof === 0 ? 'text-sgreen' : ''} /><Stat k="Rotations · slides" v={`${a.rotations} · ${a.translations}`} /><Stat k="Redundant equations" v={a.redundant} cls={a.redundant ? 'text-sorange' : ''} />
        </div>
        <p className="mt-2 text-sm">{a.dof === 0 ? 'The block is fully positioned: it can’t move.' : a.dof > 3 ? `The block can still move in ${a.dof} ways: ${a.translations} slide${a.translations === 1 ? '' : 's'} and ${a.rotations} rotation${a.rotations === 1 ? '' : 's'}. Add mates to see them one by one.` : <>The block still {a.motions.map(describe).join('; and ')}.</>}</p>
      </div>
      <div>
        <fieldset>
          <legend className="label mb-1">Mates</legend>
          <ul className="space-y-1">
            {MATES.map((m) => {
              const on = picked.includes(m.id)
              const g = on ? a.removed[picked.indexOf(m.id)] : undefined
              return (
                <li key={m.id}><label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== m.id) : [...picked, m.id])} />
                  <span>{m.label}{on && <span className={`ml-1 text-xs ${g === 0 ? 'font-semibold text-sorange' : 'text-ink-2'}`}>{g === 0 ? '(adds nothing new)' : `(removes ${g})`}</span>}</span>
                </label></li>
              )
            })}
          </ul>
        </fieldset>
        <button type="button" className="mt-2 text-sm underline" onClick={() => setPicked([])}>Clear</button>
        <p className="mt-2 text-xs text-ink-2">“Removes” counts the new freedoms each mate takes away in the order you ticked them. Redundant equations repeat what earlier mates already fixed: a motion study would count them.</p>
      </div>
    </div>
  )
}

// ---------- Design intent ----------
const SCHEMES = [
  { id: 'chain', label: 'Chain: 20 from the edge, then +30, +30', pos: () => [20, 50, 80] },
  { id: 'base', label: 'Baseline: 20, 50 and 80 from the left edge', pos: () => [20, 50, 80] },
  { id: 'sym', label: 'Symmetric: middle hole centred, others ±30', pos: (w: number) => [w / 2 - 30, w / 2, w / 2 + 30] },
  { id: 'eq', label: 'Equation: "Pitch" = "Width" / 4', pos: (w: number) => [w / 4, w / 2, (3 * w) / 4] },
]
function Plate({ w, holes, label }: { w: number; holes: (number | undefined)[]; label: string }) {
  const k = 2.2, H = 50
  return (
    <svg viewBox={`-10 -30 ${180 * k + 20} ${H * k + 50}`} className="w-full max-w-[440px]" role="img" aria-label={label}>
      <rect x={0} y={0} width={w * k} height={H * k} fill="var(--color-paper)" stroke={INK} strokeWidth={2} />
      {holes.map((x, i) => x === undefined || !Number.isFinite(x) ? null : <g key={i}><circle cx={x * k} cy={(H / 2) * k} r={5 * k} fill="var(--color-sheet)" stroke={x < 5 || x > w - 5 ? RED : INK} strokeWidth={2} /><text x={x * k} y={-8} fontSize={12} textAnchor="middle" fill={MUTED}>{+x.toFixed(1)}</text></g>)}
      <text x={(w * k) / 2} y={H * k + 18} fontSize={12} textAnchor="middle" fill={MUTED}>Width {w} mm</text>
    </svg>
  )
}
export function IntentLab() {
  const [w, setW] = useState(100)
  const [scheme, setScheme] = useState('chain')
  const s = SCHEMES.find((x) => x.id === scheme)!
  const id = useId()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <Plate w={w} holes={s.pos(w)} label={`Plate ${w} mm wide, holes at ${s.pos(w).map((x) => x.toFixed(1)).join(', ')} mm`} />
        <label htmlFor={id} className="mt-2 block text-sm font-medium">Plate width: {w} mm</label>
        <input id={id} type="range" min={80} max={160} step={5} value={w} onChange={(e) => setW(+e.target.value)} className="w-full" />
      </div>
      <div>
        <fieldset>
          <legend className="label mb-1">Dimension scheme</legend>
          <div className="space-y-1">{SCHEMES.map((x) => <label key={x.id} className="flex min-h-6 items-center gap-2 text-sm"><input type="radio" name={`${id}-s`} checked={scheme === x.id} onChange={() => setScheme(x.id)} /> {x.label}</label>)}</div>
        </fieldset>
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Hole positions at this width for each scheme</caption>
          <thead><tr className="border-b border-line text-left"><th scope="col" className="py-1">Scheme</th><th scope="col">Holes (mm from left)</th><th scope="col">Right margin</th></tr></thead>
          <tbody>{SCHEMES.map((x) => { const p = x.pos(w); return <tr key={x.id} className={`border-b border-line/60 ${x.id === scheme ? 'font-semibold' : ''}`}><td className="py-1">{x.label.split(':')[0]}</td><td className="tabular-nums">{p.map((v) => +v.toFixed(1)).join(', ')}</td><td className="tabular-nums">{+(w - p[2]).toFixed(1)}</td></tr> })}</tbody>
        </table>
        <p className="mt-2 text-sm text-ink-2">Chain and baseline put the holes in the same place, until you ask about tolerance: with ±0.1 mm on each dimension, the third hole is ±0.3 mm from the edge in the chain and ±0.1 mm from the baseline.</p>
      </div>
    </div>
  )
}

export function EquationsLab({ eqs, setEqs, width, setWidth }: { eqs: Equation[]; setEqs: (e: Equation[]) => void; width: number; setWidth: (w: number) => void }) {
  const r = useMemo(() => evalEquations(eqs, { Width: width }), [eqs, width])
  const id = useId()
  const set = (i: number, part: Partial<Equation>) => setEqs(eqs.map((e, j) => (j === i ? { ...e, ...part } : e)))
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <Plate w={width} holes={['Hole1', 'Hole2', 'Hole3'].map((n) => r.values[n])} label={`Plate ${width} mm wide, holes at ${['Hole1', 'Hole2', 'Hole3'].map((n) => r.values[n]?.toFixed(1) ?? 'undefined').join(', ')} mm`} />
        <label htmlFor={id} className="mt-2 block text-sm font-medium">Global variable "Width" = {width} mm</label>
        <input id={id} type="range" min={80} max={160} step={5} value={width} onChange={(e) => setWidth(+e.target.value)} className="w-full" />
      </div>
      <div>
        <p className="label mb-1">Equations</p>
        <ul className="space-y-1.5">
          {eqs.map((e, i) => (
            <li key={i} className="flex flex-wrap items-center gap-1.5">
              <input aria-label={`Name of equation ${i + 1}`} className="input !w-24 font-mono !text-sm" value={e.name} onChange={(x) => set(i, { name: x.target.value.replace(/"/g, '') })} />
              <span aria-hidden>=</span>
              <input aria-label={`Expression for ${e.name || `equation ${i + 1}`}`} className="input min-w-0 flex-1 font-mono !text-sm" value={e.expr} onChange={(x) => set(i, { expr: x.target.value })} />
              <span className="w-16 text-right font-mono text-sm tabular-nums">{r.errors[e.name] ? '' : r.values[e.name] !== undefined ? +r.values[e.name].toFixed(3) : ''}</span>
              <button type="button" className="text-sm underline" aria-label={`Remove ${e.name || `equation ${i + 1}`}`} onClick={() => setEqs(eqs.filter((_, j) => j !== i))}>Remove</button>
              {r.errors[e.name] && <p className="w-full text-sm text-sred">{e.name}: {r.errors[e.name]}</p>}
            </li>
          ))}
        </ul>
        <button type="button" className="btn-ghost btn mt-2 !py-1 !text-sm" onClick={() => setEqs([...eqs, { name: `Var${eqs.length + 1}`, expr: '0' }])}>Add an equation</button>
        <p className="mt-2 text-xs text-ink-2">Hole1, Hole2 and Hole3 are drawn on the plate. Use numbers, + − * / and parentheses; refer to other names in double quotes.</p>
      </div>
    </div>
  )
}

// ---------- Feature tree ----------
export function FeatureLab({ order, setOrder }: { order: string[]; setOrder: (o: string[]) => void }) {
  const errs = rebuild(featureOrder(order))
  const [probe, setProbe] = useState('Base')
  const id = useId()
  const move = (i: number, d: -1 | 1) => { const o = [...order]; [o[i], o[i + d]] = [o[i + d], o[i]]; setOrder(o) }
  const deps = dependents(FEATURES, probe)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <p className="label mb-1">Feature tree (rebuilds top to bottom)</p>
        <ol className="space-y-1" aria-live="polite">
          {order.map((fid, i) => {
            const f = FEATURES.find((x) => x.id === fid)!
            return (
              <li key={fid} className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${errs[fid] ? 'border-sred bg-sred/5' : 'border-line'}`}>
                <span className="w-5 text-ink-2">{i + 1}</span>
                <span className="flex-1"><span className="font-semibold">{f.label}</span>{errs[fid] && <span className="block text-xs text-sred">Rebuild error: {errs[fid]}</span>}</span>
                <button type="button" className="rounded border border-line px-1.5" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${f.id} up`}>↑</button>
                <button type="button" className="rounded border border-line px-1.5" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${f.id} down`}>↓</button>
              </li>
            )
          })}
        </ol>
        <p className="mt-2 text-sm">{Object.keys(errs).length ? <span className="text-sred">{Object.keys(errs).length} feature{Object.keys(errs).length > 1 ? 's' : ''} fail to rebuild.</span> : <span className="text-sgreen">Every feature rebuilds.</span>}</p>
      </div>
      <div>
        <label htmlFor={id} className="label">What depends on…</label>
        <select id={id} className="input mt-1" value={probe} onChange={(e) => setProbe(e.target.value)}>{FEATURES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <p className="mt-2 text-sm">{deps.length ? <>Delete or suppress it and these fail too: <strong>{deps.join(', ')}</strong>.</> : 'Nothing depends on it: it can be deleted on its own.'}</p>
        <p className="mt-2 text-sm text-ink-2">References: {FEATURES.find((f) => f.id === probe)!.refs.join(', ')}.</p>
      </div>
    </div>
  )
}

// ---------- Views ----------
function VoxelIso({ vox }: { vox: Voxel[] }) {
  const s = 26
  const sorted = [...vox].sort((a, b) => (a[0] - a[1] + a[2]) - (b[0] - b[1] + b[2]))
  const P = (x: number, y: number, z: number) => { const [u, v] = iso([x * s, y * s, z * s]); return `${u},${v}` }
  const all = vox.flatMap(([x, y, z]) => [iso([x * s, y * s, z * s]), iso([(x + 1) * s, (y + 1) * s, (z + 1) * s]), iso([(x + 1) * s, y * s, z * s]), iso([x * s, (y + 1) * s, (z + 1) * s])])
  const mx = Math.min(...all.map((q) => q[0])) - 4, Mx = Math.max(...all.map((q) => q[0])) + 4, my = Math.min(...all.map((q) => q[1])) - 4, My = Math.max(...all.map((q) => q[1])) + 4
  return (
    <svg viewBox={`${mx} ${my} ${Mx - mx} ${My - my}`} className="w-full max-w-[220px]" role="img" aria-label="Isometric view of the bracket">
      {sorted.map(([x, y, z], i) => (
        <g key={i} stroke={INK} strokeWidth={0.8}>
          <polygon points={[P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)].join(' ')} fill="var(--color-sheet)" />
          <polygon points={[P(x, y, z), P(x + 1, y, z), P(x + 1, y, z + 1), P(x, y, z + 1)].join(' ')} fill="var(--color-grid)" />
          <polygon points={[P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)].join(' ')} fill="var(--color-line)" />
        </g>
      ))}
    </svg>
  )
}
function ViewBox({ vox, view, title }: { vox: Voxel[]; view: 'front' | 'top' | 'right'; title: string }) {
  const v = project(vox, view), s = 30
  return (
    <figure className="m-0 text-center">
      <svg width={v.w * s + 8} height={v.h * s + 8} viewBox={`-4 -4 ${v.w * s + 8} ${v.h * s + 8}`} role="img" aria-label={`${title} view`}>
        {v.cells.map((row, r) => row.map((d, c) => (d === null ? null : <rect key={`${r}-${c}`} x={c * s} y={r * s} width={s} height={s} fill="var(--color-paper)" />)))}
        {viewEdges(v).map(([c1, r1, c2, r2], i) => <line key={i} x1={c1 * s} y1={r1 * s} x2={c2 * s} y2={r2 * s} stroke={INK} strokeWidth={2} strokeLinecap="square" />)}
      </svg>
      <figcaption className="text-xs text-ink-2">{title}</figcaption>
    </figure>
  )
}
export function ViewsLab() {
  const [angle, setAngle] = useState<'third' | 'first'>('third')
  const third = angle === 'third'
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <VoxelIso vox={BRACKET} />
        <div className="mt-2 flex gap-1" role="group" aria-label="Projection method">
          {(['third', 'first'] as const).map((a) => <button key={a} type="button" className={`rounded-md border px-2.5 py-1 text-sm ${angle === a ? 'border-ink bg-paper font-semibold' : 'border-line'}`} aria-pressed={angle === a} onClick={() => setAngle(a)}>{a === 'third' ? 'Third angle' : 'First angle'}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="group" aria-label={`${third ? 'Third' : 'First'}-angle layout: top view ${third ? 'above' : 'below'} the front view, right-side view to the ${third ? 'right' : 'left'}`}>
        <div className="inline-grid grid-cols-[auto_auto] items-end gap-x-6 gap-y-3">
          {third ? <>
            <ViewBox vox={BRACKET} view="top" title="Top" /><span />
            <ViewBox vox={BRACKET} view="front" title="Front" /><ViewBox vox={BRACKET} view="right" title="Right side" />
          </> : <>
            <ViewBox vox={BRACKET} view="right" title="Right side" /><ViewBox vox={BRACKET} view="front" title="Front" />
            <span /><ViewBox vox={BRACKET} view="top" title="Top" />
          </>}
        </div>
        <p className="mt-2 text-sm text-ink-2">Same three pictures, different places. Lines mark edges where the surface depth changes; hidden (dashed) lines are left out.</p>
      </div>
    </div>
  )
}

// ---------- Beam ----------
const MATS = { steel: { label: 'Steel (typical: E 200 GPa, yield 250 MPa)', E: 200000, Sy: 250 }, al: { label: 'Aluminium 6061-T6 (typical: E 69 GPa, yield 276 MPa)', E: 69000, Sy: 276 } }
export function BeamLab({ init = { F: 1000, L: 300, b: 20, h: 30 }, onH }: { init?: { F: number; L: number; b: number; h: number }; onH?: (h: number) => void }) {
  const [v, setV] = useState(init)
  const [mat, setMat] = useState<keyof typeof MATS>('steel')
  const r = cantilever({ ...v, E: MATS[mat].E, Sy: MATS[mat].Sy })
  const id = useId()
  const field = (k: keyof typeof v, label: string, min: number, max: number, step: number) => (
    <label className="block text-sm"><span className="font-medium">{label}: {v[k]}</span>
      <input type="range" className="w-full" min={min} max={max} step={step} value={v[k]} onChange={(e) => { const n = +e.target.value; setV({ ...v, [k]: n }); if (k === 'h') onH?.(n) }} />
    </label>
  )
  const sag = Math.min(40, r.delta * 20)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <svg viewBox="0 0 320 130" className="w-full max-w-[420px]" role="img" aria-label={`Cantilever ${v.L} mm long, depth ${v.h} mm, tip deflection ${r.delta.toFixed(2)} mm`}>
          <rect x={8} y={20} width={14} height={90} fill="var(--color-line)" />
          <path d={`M22 ${60 - v.h / 4} L300 ${60 - v.h / 4 + sag} L300 ${60 + v.h / 4 + sag} L22 ${60 + v.h / 4} Z`} fill="var(--color-paper)" stroke={INK} />
          <line x1={300} x2={300} y1={10} y2={60 - v.h / 4 + sag - 4} stroke={RED} strokeWidth={2.5} markerEnd="url(#beam-arrow)" />
          <defs><marker id="beam-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={RED} /></marker></defs>
          <text x={292} y={14} fontSize={11} textAnchor="end" fill={MUTED}>F = {v.F} N</text>
          <text x={160} y={125} fontSize={11} textAnchor="middle" fill={MUTED}>deflection drawn ×20</text>
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
          <Stat k="Stress σ (MPa)" v={r.sigma.toFixed(1)} /><Stat k="Deflection δ (mm)" v={r.delta.toFixed(2)} cls={r.delta > 1 ? 'text-sorange' : ''} />
          <Stat k="Factor of safety" v={r.fos.toFixed(2)} cls={r.fos < 1 ? 'text-sred' : r.fos < 2 ? 'text-sorange' : 'text-sgreen'} /><Stat k="I (mm⁴)" v={Math.round(r.I).toLocaleString('en-US')} />
        </div>
      </div>
      <div className="space-y-1.5">
        {field('F', 'End load F (N)', 100, 5000, 100)}
        {field('L', 'Length L (mm)', 100, 600, 10)}
        {field('b', 'Width b (mm)', 5, 60, 1)}
        {field('h', 'Depth h (mm)', 5, 80, 1)}
        <label htmlFor={id} className="block text-sm font-medium">Material</label>
        <select id={id} className="input" value={mat} onChange={(e) => setMat(e.target.value as keyof typeof MATS)}>{Object.entries(MATS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</select>
        <p className="text-xs text-ink-2">σ = 6FL/(bh²), δ = FL³/(3EI), I = bh³/12. Typical material values: use certified data for real parts.</p>
      </div>
    </div>
  )
}

// ---------- DFA ----------
export function PartCountLab({ answers, setAnswers, reveal }: { answers: Record<string, [boolean, boolean, boolean]>; setAnswers: (a: Record<string, [boolean, boolean, boolean]>) => void; reveal: boolean }) {
  const keep = (id: string) => { const p = PARTS.find((x) => x.id === id)!; const a = answers[id] ?? [false, false, false]; return !!p.base || a.some(Boolean) }
  const min = PARTS.filter((p) => keep(p.id)).reduce((s, p) => s + p.qty, 0)
  const Q = ['Moves relative to parts already assembled?', 'Must be a different material?', 'Must be separate for assembly or service?']
  return (
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Part count worksheet, scroll sideways if it is cut off">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">Three DFA questions for each part</caption>
        <thead><tr className="border-b border-line text-left"><th scope="col" className="py-1 pr-2">Part</th><th scope="col" className="pr-2">Qty</th>{Q.map((q) => <th key={q} scope="col" className="pr-2 font-semibold">{q}</th>)}<th scope="col">Your call</th></tr></thead>
        <tbody>
          {PARTS.map((p) => {
            const a = answers[p.id] ?? [false, false, false]
            const k = keep(p.id), right = keepPart(p)
            return (
              <tr key={p.id} className="border-b border-line/60 align-top">
                <td className="py-1 pr-2">{p.part}{p.base && <span className="block text-xs text-ink-2">The base part: always counted</span>}{reveal && <span className={`mt-0.5 block text-xs ${k === right ? 'text-sgreen' : 'text-sred'}`}>{k === right ? '✓' : '✗'} {p.why}</span>}</td>
                <td className="pr-2 tabular-nums">{p.qty}</td>
                {Q.map((q, i) => <td key={q} className="pr-2"><input type="checkbox" aria-label={`${p.part}: ${q}`} checked={a[i]} disabled={!!p.base} onChange={() => { const n = [...a] as [boolean, boolean, boolean]; n[i] = !n[i]; setAnswers({ ...answers, [p.id]: n }) }} /></td>)}
                <td className={k ? 'font-semibold' : 'text-ink-2'}>{k ? 'Keep' : 'Eliminate or combine'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm" aria-live="polite">Your theoretical minimum: <strong>{min}</strong> of {PARTS.reduce((s, p) => s + p.qty, 0)} parts.</p>
    </div>
  )
}
