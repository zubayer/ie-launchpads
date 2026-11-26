// Kernels behind the CAD studio. They compute real answers, not lookups:
//  - sketch degrees of freedom from the rank of the constraint Jacobian (how a sketch solver decides
//    under-, fully or over-defined),
//  - assembly degrees of freedom from the instantaneous kinematics of mates between two rigid bodies,
//  - equations with dependencies and cycle detection, feature-tree rebuild order, orthographic views of a
//    voxel part, and cantilever-beam hand calculations.

// ---------- Linear algebra ----------
const TOL = 1e-8
/** Reduced row echelon form of rows (each row normalised first). Returns pivot columns and the reduced rows. */
export function rref(rows: number[][], n: number): { R: number[][]; pivots: number[] } {
  const A = rows.map((r) => { const s = Math.hypot(...r); return s > 1e-12 ? r.map((x) => x / s) : r.map(() => 0) })
  const pivots: number[] = []
  let r = 0
  for (let c = 0; c < n && r < A.length; c++) {
    let best = r
    for (let i = r + 1; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[best][c])) best = i
    if (Math.abs(A[best][c]) < TOL) continue
    ;[A[r], A[best]] = [A[best], A[r]]
    const p = A[r][c]
    A[r] = A[r].map((x) => x / p)
    for (let i = 0; i < A.length; i++) if (i !== r && Math.abs(A[i][c]) > 0) { const f = A[i][c]; A[i] = A[i].map((x, j) => x - f * A[r][j]) }
    pivots.push(c)
    r++
  }
  return { R: A.slice(0, r), pivots }
}
export const rank = (rows: number[][], n: number) => rref(rows, n).pivots.length
/** A basis of the null space: the directions in which the variables can still move. */
export function nullSpace(rows: number[][], n: number): number[][] {
  const { R, pivots } = rref(rows, n)
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c))
  return free.map((f) => {
    const v = Array(n).fill(0)
    v[f] = 1
    R.forEach((row, i) => { v[pivots[i]] = -row[f] })
    const s = Math.hypot(...v)
    return v.map((x) => x / s)
  })
}

// ---------- Sketches ----------
export interface SPoint { id: string; x: number; y: number }
export interface SLine { id: string; a: string; b: string }
export interface SCircle { id: string; c: string; r: number }
export interface Sketch { points: SPoint[]; lines: SLine[]; circles: SCircle[] }
export type SCon =
  | { k: 'origin' | 'fix'; p: string }
  | { k: 'horizontal' | 'vertical'; l: string }
  | { k: 'parallel' | 'perpendicular' | 'equal'; l1: string; l2: string }
  | { k: 'length'; l: string; v: number }
  | { k: 'hdist' | 'vdist'; p: string; q: string; v: number }
  | { k: 'diameter'; c: string; v: number }
  | { k: 'coincident'; p: string; q: string }
  | { k: 'midpoint'; p: string; l: string }
  | { k: 'concentric' | 'equalRadius'; c1: string; c2: string }
  | { k: 'tangent'; l: string; c: string }

type Vars = { index: Map<string, number>; x0: number[] }
function sketchVars(s: Sketch): Vars {
  const index = new Map<string, number>(), x0: number[] = []
  for (const p of s.points) { index.set(`${p.id}.x`, x0.length); x0.push(p.x); index.set(`${p.id}.y`, x0.length); x0.push(p.y) }
  for (const c of s.circles) { index.set(`${c.id}.r`, x0.length); x0.push(c.r) }
  return { index, x0 }
}

/** Residuals of one constraint at the variable vector x (zero when satisfied). */
function residual(s: Sketch, V: Vars, k: SCon, x: number[]): number[] {
  const P = (id: string) => [x[V.index.get(`${id}.x`)!], x[V.index.get(`${id}.y`)!]]
  const L = (id: string) => { const l = s.lines.find((q) => q.id === id)!; return [P(l.a), P(l.b)] }
  const Cc = (id: string) => { const c = s.circles.find((q) => q.id === id)!; return { c: P(c.c), r: x[V.index.get(`${id}.r`)!] } }
  const d = (l: number[][]) => [l[1][0] - l[0][0], l[1][1] - l[0][1]]
  switch (k.k) {
    case 'origin': { const p = P(k.p); return [p[0], p[1]] }
    case 'fix': { const p = P(k.p), q = V.x0; return [p[0] - q[V.index.get(`${k.p}.x`)!], p[1] - q[V.index.get(`${k.p}.y`)!]] }
    case 'horizontal': { const l = L(k.l); return [l[1][1] - l[0][1]] }
    case 'vertical': { const l = L(k.l); return [l[1][0] - l[0][0]] }
    case 'parallel': { const a = d(L(k.l1)), b = d(L(k.l2)); return [(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(...a) * Math.hypot(...b))] }
    case 'perpendicular': { const a = d(L(k.l1)), b = d(L(k.l2)); return [(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))] }
    case 'equal': return [Math.hypot(...d(L(k.l1))) - Math.hypot(...d(L(k.l2)))]
    case 'length': return [Math.hypot(...d(L(k.l))) - k.v]
    case 'hdist': return [P(k.q)[0] - P(k.p)[0] - k.v]
    case 'vdist': return [P(k.q)[1] - P(k.p)[1] - k.v]
    case 'diameter': return [2 * Cc(k.c).r - k.v]
    case 'coincident': { const p = P(k.p), q = P(k.q); return [p[0] - q[0], p[1] - q[1]] }
    case 'midpoint': { const p = P(k.p), l = L(k.l); return [p[0] - (l[0][0] + l[1][0]) / 2, p[1] - (l[0][1] + l[1][1]) / 2] }
    case 'concentric': { const a = Cc(k.c1).c, b = Cc(k.c2).c; return [a[0] - b[0], a[1] - b[1]] }
    case 'equalRadius': return [Cc(k.c1).r - Cc(k.c2).r]
    case 'tangent': {
      const l = L(k.l), { c, r } = Cc(k.c), u = d(l)
      return [Math.abs(u[0] * (c[1] - l[0][1]) - u[1] * (c[0] - l[0][0])) / Math.hypot(...u) - r]
    }
  }
}

function jacobian(s: Sketch, V: Vars, k: SCon): number[][] {
  const n = V.x0.length
  const f0 = residual(s, V, k, V.x0)
  const rows = f0.map(() => Array(n).fill(0))
  for (let j = 0; j < n; j++) {
    const h = 1e-6 * Math.max(1, Math.abs(V.x0[j]))
    const xp = [...V.x0], xm = [...V.x0]
    xp[j] += h; xm[j] -= h
    const fp = residual(s, V, k, xp), fm = residual(s, V, k, xm)
    fp.forEach((v, i) => { rows[i][j] = (v - fm[i]) / (2 * h) })
  }
  return rows.map((r) => r.map((v) => (Math.abs(v) < 1e-9 ? 0 : v)))
}

export const consEquations = (k: SCon) => (['origin', 'fix', 'coincident', 'midpoint', 'concentric'].includes(k.k) ? 2 : 1)
export interface SketchAnalysis {
  dof: number
  equations: number
  redundant: number
  status: 'under' | 'fully' | 'over'
  /** For each constraint, in order: how many degrees of freedom it removed (0 = redundant). */
  removed: number[]
  /** Points, lines and circles that can still move. */
  free: Set<string>
  satisfied: boolean
}

/** Degrees of freedom of a sketch: variables minus the rank of the constraint Jacobian at the drawn geometry. */
export function analyzeSketch(s: Sketch, cons: SCon[]): SketchAnalysis {
  const V = sketchVars(s)
  const n = V.x0.length
  const rows: number[][] = []
  const removed: number[] = []
  let r = 0
  for (const k of cons) {
    rows.push(...jacobian(s, V, k))
    const nr = rank(rows, n)
    removed.push(nr - r)
    r = nr
  }
  const equations = rows.length
  const basis = nullSpace(rows, n)
  const moves = (v: string) => basis.some((b) => Math.abs(b[V.index.get(v)!]) > 1e-6)
  const free = new Set<string>()
  for (const p of s.points) if (moves(`${p.id}.x`) || moves(`${p.id}.y`)) free.add(p.id)
  for (const l of s.lines) if (free.has(l.a) || free.has(l.b)) free.add(l.id)
  for (const c of s.circles) if (free.has(c.c) || moves(`${c.id}.r`)) free.add(c.id)
  const satisfied = cons.every((k) => residual(s, V, k, V.x0).every((v) => Math.abs(v) < 1e-6))
  const dof = n - r, redundant = equations - r
  return { dof, equations, redundant, status: redundant > 0 ? 'over' : dof > 0 ? 'under' : 'fully', removed, free, satisfied }
}

// ---------- Assembly mates (two rigid bodies) ----------
export type V3 = [number, number, number]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const perpBasis = (n: V3): [V3, V3] => {
  const t: V3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const u = cross(n, t), us = Math.hypot(...u)
  const u1: V3 = [u[0] / us, u[1] / us, u[2] / us]
  return [u1, cross(n, u1)]
}
export type Feature = { kind: 'plane'; p: V3; n: V3 } | { kind: 'axis'; p: V3; d: V3 } | { kind: 'point'; p: V3 }
export type MateKind = 'coincident' | 'distance' | 'parallel' | 'perpendicular' | 'concentric' | 'lock'
export interface Mate { kind: MateKind; moving: string; fixed: string }

/** Rows of the linearised mate equations in the moving body's small motion q = (tx, ty, tz, wx, wy, wz).
 *  A point p moves by t + w × p; a direction n turns by w × n. Features coincide at the starting pose. */
export function mateRows(m: Mate, mv: Feature, fx: Feature): number[][] {
  const W = (a: V3): number[] => [0, 0, 0, ...a] // w·a
  const pos = (p: V3, m: V3): number[] => [m[0], m[1], m[2], ...cross(p, m)] // (t + w×p)·m
  const turn = (n: V3, m: V3): number[] => W(cross(n, m)) // (w×n)·m = w·(n×m)
  if (m.kind === 'lock') return [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]]
  if (mv.kind === 'plane' && fx.kind === 'plane') {
    const [u, v] = perpBasis(fx.n)
    const align = [turn(mv.n, u), turn(mv.n, v)]
    if (m.kind === 'parallel') return align
    if (m.kind === 'perpendicular') return [turn(mv.n, fx.n)]
    return [...align, pos(mv.p, fx.n)] // coincident or distance (offset): normals aligned, one separation fixed
  }
  if (mv.kind === 'axis' && fx.kind === 'axis' && m.kind === 'concentric') {
    const [u, v] = perpBasis(fx.d)
    return [turn(mv.d, u), turn(mv.d, v), pos(mv.p, u), pos(mv.p, v)]
  }
  if (mv.kind === 'point' && fx.kind === 'point' && m.kind === 'coincident') return [pos(mv.p, [1, 0, 0]), pos(mv.p, [0, 1, 0]), pos(mv.p, [0, 0, 1])]
  if (mv.kind === 'point' && fx.kind === 'plane' && m.kind === 'coincident') return [pos(mv.p, fx.n)]
  throw new Error(`Unsupported mate: ${m.kind} between ${mv.kind} and ${fx.kind}`)
}

export interface Motion { kind: 'slide' | 'rotate'; dir: V3; through?: V3 }
export interface MateAnalysis { dof: number; equations: number; redundant: number; removed: number[]; motions: Motion[]; rotations: number; translations: number }
export function analyzeMates(mates: Mate[], moving: Record<string, Feature>, fixed: Record<string, Feature>): MateAnalysis {
  const rows: number[][] = []
  const removed: number[] = []
  let r = 0
  for (const m of mates) {
    rows.push(...(m.kind === 'lock' ? mateRows(m, moving[m.moving] ?? { kind: 'point', p: [0, 0, 0] }, fixed[m.fixed] ?? { kind: 'point', p: [0, 0, 0] }) : mateRows(m, moving[m.moving], fixed[m.fixed])))
    const nr = rank(rows, 6)
    removed.push(nr - r)
    r = nr
  }
  const basis = rows.length ? nullSpace(rows, 6) : [...Array(6).keys()].map((i) => Array.from({ length: 6 }, (_, j) => (i === j ? 1 : 0)))
  const motions: Motion[] = basis.map((b) => {
    const t: V3 = [b[0], b[1], b[2]], w: V3 = [b[3], b[4], b[5]]
    const ww = dot(w, w)
    if (ww < 1e-12) { const s = Math.hypot(...t); return { kind: 'slide', dir: [t[0] / s, t[1] / s, t[2] / s] } }
    const c = cross(w, t).map((x) => x / ww) as V3
    const s = Math.sqrt(ww)
    return { kind: 'rotate', dir: [w[0] / s, w[1] / s, w[2] / s], through: c.map((x) => Math.round(x * 1e6) / 1e6) as V3 }
  })
  const rotations = rank(basis.map((b) => b.slice(3)), 3)
  return { dof: 6 - r, equations: rows.length, redundant: rows.length - r, removed, motions, rotations, translations: 6 - r - rotations }
}

// ---------- Equations ----------
export interface Equation { name: string; expr: string }
/** Evaluate SOLIDWORKS-style equations: names in double quotes, numbers, + − × ÷, parentheses and unary minus. */
export function evalEquations(eqs: Equation[], globals: Record<string, number> = {}): { values: Record<string, number>; errors: Record<string, string> } {
  const byName = new Map(eqs.map((e) => [e.name, e.expr]))
  const values: Record<string, number> = { ...globals }
  const errors: Record<string, string> = {}
  const visiting = new Set<string>()
  const get = (name: string): number => {
    if (name in values) return values[name]
    if (!byName.has(name)) throw new Error(`“${name}” is not defined`)
    if (visiting.has(name)) throw new Error(`circular reference through “${name}”`)
    visiting.add(name)
    try { return (values[name] = parseExpr(byName.get(name)!, get)) } finally { visiting.delete(name) }
  }
  for (const e of eqs) { try { get(e.name) } catch (x) { errors[e.name] = (x as Error).message } }
  return { values, errors }
}
function parseExpr(src: string, get: (n: string) => number): number {
  let i = 0
  const ws = () => { while (/\s/.test(src[i] ?? '')) i++ }
  const expr = (): number => { let v = term(); for (;;) { ws(); const c = src[i]; if (c === '+' || c === '-') { i++; const r = term(); v = c === '+' ? v + r : v - r } else return v } }
  const term = (): number => { let v = factor(); for (;;) { ws(); const c = src[i]; if (c === '*' || c === '/') { i++; const r = factor(); if (c === '/' && r === 0) throw new Error('division by zero'); v = c === '*' ? v * r : v / r } else return v } }
  const factor = (): number => {
    ws()
    const c = src[i]
    if (c === '-') { i++; return -factor() }
    if (c === '(') { i++; const v = expr(); ws(); if (src[i] !== ')') throw new Error('missing “)”'); i++; return v }
    if (c === '"') { const j = src.indexOf('"', i + 1); if (j < 0) throw new Error('missing closing quote'); const name = src.slice(i + 1, j); i = j + 1; return get(name) }
    const m = /^\d+(\.\d+)?/.exec(src.slice(i))
    if (m) { i += m[0].length; return Number(m[0]) }
    throw new Error(c ? `unexpected “${c}”` : 'the expression is incomplete')
  }
  const v = expr()
  ws()
  if (i < src.length) throw new Error(`unexpected “${src[i]}”`)
  return v
}

// ---------- Feature tree ----------
export interface FeatureNode { id: string; label: string; refs: string[] }
/** Rebuild in the given order: a feature fails if anything it references comes later or failed. */
export function rebuild(order: FeatureNode[]): Record<string, string> {
  const ok = new Set<string>(['Top Plane', 'Front Plane', 'Right Plane', 'Origin'])
  const errors: Record<string, string> = {}
  for (const f of order) {
    const missing = f.refs.filter((r) => !ok.has(r))
    if (missing.length) errors[f.id] = `references ${missing.join(' and ')}, which ${missing.length > 1 ? 'are' : 'is'} not built yet`
    else ok.add(f.id)
  }
  return errors
}
/** Everything that depends on a feature, directly or through other features. */
export function dependents(all: FeatureNode[], id: string): string[] {
  const out = new Set<string>()
  const walk = (x: string) => all.filter((f) => f.refs.includes(x) && !out.has(f.id)).forEach((f) => { out.add(f.id); walk(f.id) })
  walk(id)
  return all.filter((f) => out.has(f.id)).map((f) => f.id)
}

// ---------- Orthographic views of a voxel part ----------
/** Voxels as [x, y, z]: x to the right, y away from the viewer of the front view, z up. */
export type Voxel = [number, number, number]
export interface View { w: number; h: number; cells: (number | null)[][] } // depth of the nearest face per cell, null = empty
export function project(vox: Voxel[], view: 'front' | 'top' | 'right'): View {
  const X = Math.max(...vox.map((v) => v[0])) + 1, Y = Math.max(...vox.map((v) => v[1])) + 1, Z = Math.max(...vox.map((v) => v[2])) + 1
  const has = new Set(vox.map((v) => v.join(',')))
  const at = (x: number, y: number, z: number) => has.has(`${x},${y},${z}`)
  // Each view: grid (col, row from top) and a ray into the part; depth = steps until the first voxel.
  const spec = {
    front: { w: X, h: Z, ray: (c: number, r: number, k: number) => at(c, k, Z - 1 - r), n: Y },
    top: { w: X, h: Y, ray: (c: number, r: number, k: number) => at(c, Y - 1 - r, Z - 1 - k), n: Z },
    right: { w: Y, h: Z, ray: (c: number, r: number, k: number) => at(X - 1 - k, c, Z - 1 - r), n: X },
  }[view]
  const cells = Array.from({ length: spec.h }, (_, r) => Array.from({ length: spec.w }, (_, c) => {
    for (let k = 0; k < spec.n; k++) if (spec.ray(c, r, k)) return k
    return null
  }))
  return { w: spec.w, h: spec.h, cells }
}
/** Visible edges of a view: boundaries between cells of different depth (or part and empty space). */
export function viewEdges(v: View): [number, number, number, number][] {
  const e: [number, number, number, number][] = []
  const d = (c: number, r: number) => (r < 0 || r >= v.h || c < 0 || c >= v.w ? null : v.cells[r][c])
  for (let r = 0; r <= v.h; r++) for (let c = 0; c < v.w; c++) if (d(c, r - 1) !== d(c, r)) e.push([c, r, c + 1, r])
  for (let c = 0; c <= v.w; c++) for (let r = 0; r < v.h; r++) if (d(c - 1, r) !== d(c, r)) e.push([c, r, c, r + 1])
  return e
}

// ---------- Beam hand calculation ----------
export interface Beam { F: number; L: number; b: number; h: number; E: number; Sy: number } // N, mm, mm, mm, MPa, MPa
/** Cantilever with an end load and a rectangular section (Euler–Bernoulli beam theory). */
export function cantilever({ F, L, b, h, E, Sy }: Beam) {
  const I = (b * h ** 3) / 12 // mm⁴
  const M = F * L // N·mm at the fixed end
  const sigma = (M * (h / 2)) / I // MPa
  const delta = (F * L ** 3) / (3 * E * I) // mm
  return { I, M, sigma, delta, fos: Sy / sigma }
}
