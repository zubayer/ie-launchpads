import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from '../content/full'
import { OR_V3 } from '../content/lessons/or'
import { Phi, mmc } from './math'

// Independent recomputation of every worked number in the OR depth batch (src/content/lessons/or.ts).
// Nothing here calls the lesson's own check.compute: each answer is found again by brute force,
// vertex enumeration or a separate implementation of the algorithm.

const shown = (id: string) => CONCEPT_MAP[id].example!.check!.value

/** Max c·x over {x ∈ R² : A x ≤ b} by enumerating every vertex (all constraints, including x, y ≥ 0, in A). */
function lp2(c: [number, number], A: [number, number][], b: number[]) {
  let best: { z: number; x: number; y: number } | null = null
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
    const [a1, b1] = A[i], [a2, b2] = A[j]
    const det = a1 * b2 - a2 * b1
    if (Math.abs(det) < 1e-12) continue
    const x = (b[i] * b2 - b[j] * b1) / det, y = (a1 * b[j] - a2 * b[i]) / det
    if (A.every(([p, q], k) => p * x + q * y <= b[k] + 1e-9)) {
      const z = c[0] * x + c[1] * y
      if (!best || z > best.z + 1e-12) best = { z, x, y }
    }
  }
  return best!
}
const NN: [number, number][] = [[-1, 0], [0, -1]]
const shop = (assembly = 80, extra: [number, number][] = [], eb: number[] = [], c: [number, number] = [30, 40]) =>
  lp2(c, [[2, 4], [3, 2], ...NN, ...extra], [assembly, 60, 0, 0, ...eb])

const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])))

describe('OR depth batch: linear programming', () => {
  it('product mix: vertex enumeration gives $900 at (10, 15)', () => {
    const r = shop()
    expect(r.z).toBeCloseTo(900, 9)
    expect([r.x, r.y]).toEqual([10, 15])
    expect(shown('or.simplex')).toBeCloseTo(r.z, 9)
  })
  it('feasible region: a 12-chair limit moves the optimum to (12, 12) and frees 8 assembly hours', () => {
    const r = shop(80, [[0, 1]], [12])
    expect(r.z).toBeCloseTo(shown('or.feasible-region'), 9)
    expect(r.x).toBeCloseTo(12, 9); expect(r.y).toBeCloseTo(12, 9)
    expect(80 - (2 * r.x + 4 * r.y)).toBeCloseTo(8, 9)
  })
  it('duality: the dual (min 80u + 60v) has the same value, with u = 7.5 and v = 5', () => {
    // min 80u + 60v s.t. 2u + 3v ≥ 30, 4u + 2v ≥ 40, u, v ≥ 0  ⇔  max −80u − 60v with ≤ rows
    const d = lp2([-80, -60], [[-2, -3], [-4, -2], ...NN], [-30, -40, 0, 0])
    expect(-d.z).toBeCloseTo(shown('or.duality'), 9)
    expect(d.x).toBeCloseTo(7.5, 9); expect(d.y).toBeCloseTo(5, 9)
  })
  it('shadow price: one more assembly hour is worth $7.50, valid from 40 to 120 hours', () => {
    expect(shop(81).z - shop(80).z).toBeCloseTo(shown('or.shadow-price'), 9)
    for (let h = 40; h < 120; h += 7) expect(shop(h + 1).z - shop(h).z).toBeCloseTo(7.5, 9)
    expect(shop(121).z - shop(120).z).not.toBeCloseTo(7.5, 3) // above the range the value changes
    expect(shop(40).z - shop(39).z).not.toBeCloseTo(7.5, 3) // below it too
  })
  it('sensitivity: (10, 15) stays optimal for table profits between $20 and $60', () => {
    expect(shown('or.sensitivity')).toBe(20)
    for (const c1 of [20.5, 30, 45, 59.5]) { const r = shop(80, [], [], [c1, 40]); expect([r.x, r.y]).toEqual([10, 15]) }
    for (const c1 of [19.5, 60.5]) { const r = shop(80, [], [], [c1, 40]); expect([r.x, r.y]).not.toEqual([10, 15]) }
  })
})

describe('OR depth batch: integer programming', () => {
  const ipPoints = () => { const pts: { x: number; y: number; z: number }[] = []; for (let x = 0; x <= 9; x++) for (let y = 0; y <= 6; y++) if (x + y <= 6 && 5 * x + 9 * y <= 45) pts.push({ x, y, z: 5 * x + 8 * y }); return pts }
  it('the integer optimum is (0, 5) = 40, below the LP bound of 41.25, and rounding fails', () => {
    const best = ipPoints().reduce((a, b) => (b.z > a.z ? b : a))
    expect([best.x, best.y, best.z]).toEqual([0, 5, 40])
    expect(shown('or.ip')).toBe(40); expect(shown('or.branch-bound')).toBe(40)
    const relax = lp2([5, 8], [[1, 1], [5, 9], ...NN], [6, 45, 0, 0])
    expect(relax.z).toBeCloseTo(41.25, 9); expect(relax.x).toBeCloseTo(2.25, 9)
    expect(5 * 2 + 9 * 4).toBeGreaterThan(45) // (2, 4) is infeasible
  })
  it('the branch-and-bound node values match the LP relaxations', () => {
    const node = (extra: [number, number][], eb: number[]) => lp2([5, 8], [[1, 1], [5, 9], ...NN, ...extra], [6, 45, 0, 0, ...eb])
    expect(node([[0, 1]], [3]).z).toBeCloseTo(39, 9) // y ≤ 3
    expect(node([[0, -1]], [-4]).z).toBeCloseTo(41, 9) // y ≥ 4
    expect(node([[0, -1], [1, 0]], [-4, 1]).z).toBeCloseTo(5 + 8 * 40 / 9, 9) // y ≥ 4, x ≤ 1
    expect(node([[0, -1], [1, 0], [0, 1]], [-4, 1, 4]).z).toBeCloseTo(37, 9) // … y ≤ 4
    expect(node([[0, -1], [1, 0]], [-5, 1]).z).toBeCloseTo(40, 9) // … y ≥ 5
  })
  it('big-M: the relaxation charges x/M of the setup', () => {
    expect((60 / 80) * 500).toBe(shown('or.big-m'))
    expect((60 / 10000) * 500).toBeCloseTo(3, 9)
  })
  it('knapsack: B + C (140) beats the ratio ranking (134); checked over all 16 subsets', () => {
    const P = [[60, 90], [50, 70], [50, 70], [40, 44]]
    let best = 0
    for (let m = 0; m < 16; m++) { let c = 0, v = 0; P.forEach(([w, val], i) => { if (m & (1 << i)) { c += w; v += val } }); if (c <= 100) best = Math.max(best, v) }
    expect(best).toBe(shown('or.knapsack'))
    let left = 100, greedy = 0
    for (const [w, v] of [...P].sort((a, b) => b[1] / b[0] - a[1] / a[0])) if (w <= left) { left -= w; greedy += v }
    expect(greedy).toBe(134)
  })
})

describe('OR depth batch: networks', () => {
  it('transportation: $1,190 is the cheapest plan over every whole-number allocation', () => {
    const cA = [4, 6, 9], cB = [5, 3, 7], dem = [80, 90, 80]
    let best = Infinity
    for (let a1 = 0; a1 <= 80; a1++) for (let a2 = 0; a2 <= Math.min(90, 100 - a1); a2++) {
      const a3 = 100 - a1 - a2
      if (a3 > 80) continue
      const a = [a1, a2, a3], bb = dem.map((d, j) => d - a[j])
      if (bb.some((x) => x < 0) || bb.reduce((s, x) => s + x, 0) > 150) continue
      best = Math.min(best, a.reduce((s, x, j) => s + x * cA[j], 0) + bb.reduce((s, x, j) => s + x * cB[j], 0))
    }
    expect(best).toBe(shown('or.transportation'))
  })
  it('assignment: 16 h over all 24 permutations; greedy gives 18 h', () => {
    const C = [[7, 3, 6, 9], [5, 8, 4, 6], [6, 5, 9, 3], [8, 6, 5, 7]]
    const costs = perms([0, 1, 2, 3]).map((p) => p.reduce((s, j, i) => s + C[i][j], 0))
    expect(costs.length).toBe(24)
    expect(Math.min(...costs)).toBe(shown('or.assignment'))
    const used = new Set<number>(); let g = 0
    C.forEach((row) => { const j = [0, 1, 2, 3].filter((k) => !used.has(k)).reduce((a, b) => (row[b] < row[a] ? b : a)); used.add(j); g += row[j] })
    expect(g).toBe(18)
  })
  it('max flow (augmenting paths) and the minimum cut (all cuts) are both 18', () => {
    const N = ['S', 'A', 'B', 'C', 'D', 'T']
    const cap: Record<string, number> = { SA: 12, SB: 8, AB: 2, AC: 6, AD: 3, BC: 4, BD: 5, CT: 12, DT: 9 }
    const r: Record<string, number> = { ...cap }
    const res = (u: string, v: string) => r[u + v] ?? 0
    let flow = 0
    for (;;) {
      const par: Record<string, string | null> = { S: null }, q = ['S']
      while (q.length) { const u = q.shift()!; for (const v of N) if (!(v in par) && res(u, v) > 0) { par[v] = u; q.push(v) } }
      if (!('T' in par)) break
      let b = Infinity
      for (let v = 'T'; par[v]; v = par[v]!) b = Math.min(b, res(par[v]!, v))
      for (let v = 'T'; par[v]; v = par[v]!) { const u = par[v]!; r[u + v] = res(u, v) - b; r[v + u] = res(v, u) + b }
      flow += b
    }
    let cut = Infinity
    for (let m = 0; m < 16; m++) {
      const S = new Set(['S', ...['A', 'B', 'C', 'D'].filter((_, i) => m & (1 << i))])
      cut = Math.min(cut, Object.entries(cap).reduce((s, [k, c]) => s + (S.has(k[0]) && !S.has(k[1]) ? c : 0), 0))
    }
    expect(flow).toBe(shown('or.network-flow'))
    expect(cut).toBe(flow)
  })
  it('shortest path: Dijkstra gives 11 min via S→B→A→C→T', () => {
    const E: Record<string, Record<string, number>> = { S: { A: 4, B: 2 }, A: { C: 5, D: 10 }, B: { A: 1, D: 8 }, C: { D: 2, T: 3 }, D: { T: 4 }, T: {} }
    const dist: Record<string, number> = { S: 0 }, prev: Record<string, string> = {}, done = new Set<string>()
    while (done.size < Object.keys(E).length) {
      const u = Object.keys(dist).filter((k) => !done.has(k)).sort((a, b) => dist[a] - dist[b])[0]
      if (!u) break
      done.add(u)
      for (const [v, w] of Object.entries(E[u])) if (dist[u] + w < (dist[v] ?? Infinity)) { dist[v] = dist[u] + w; prev[v] = u }
    }
    const path = ['T']; while (path[0] !== 'S') path.unshift(prev[path[0]])
    expect(dist.T).toBe(shown('or.shortest-path'))
    expect(path.join('')).toBe('SBACT')
  })
  it('TSP: the best of all tours is 28; nearest neighbour gives 32', () => {
    const P = [[0, 0], [2, 1], [2, 6], [8, 3], [0, 5]]
    const d = (i: number, j: number) => Math.abs(P[i][0] - P[j][0]) + Math.abs(P[i][1] - P[j][1])
    const len = (t: number[]) => t.reduce((s, x, k) => s + d(x, t[(k + 1) % t.length]), 0)
    expect(Math.min(...perms([1, 2, 3, 4]).map((p) => len([0, ...p])))).toBe(shown('or.tsp'))
    const t = [0], left = new Set([1, 2, 3, 4])
    while (left.size) { const j = [...left].reduce((a, b) => (d(t[t.length - 1], b) < d(t[t.length - 1], a) ? b : a)); t.push(j); left.delete(j) }
    expect(len(t)).toBe(32)
  })
})

describe('OR depth batch: stochastic models', () => {
  it('Markov chain: iterating to convergence gives 27/31 running', () => {
    const P = [[0.8, 0.15, 0.05], [0, 0.7, 0.3], [0.9, 0, 0.1]]
    let pi = [1, 0, 0]
    for (let k = 0; k < 500; k++) pi = [0, 1, 2].map((j) => pi.reduce((s, p, i) => s + p * P[i][j], 0))
    expect(pi[0]).toBeCloseTo(18 / 31, 9); expect(pi[1]).toBeCloseTo(9 / 31, 9)
    expect(pi[0] + pi[1]).toBeCloseTo(shown('or.markov'), 3)
  })
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
  const erlangWq = (lam: number, mu: number, c: number) => {
    const a = lam / mu, rho = a / c
    const top = a ** c / fact(c) / (1 - rho)
    let s = 0; for (let k = 0; k < c; k++) s += a ** k / fact(k)
    return top / (s + top) / (c * mu - lam)
  }
  it('M/M/c: pooling two clerks cuts the wait from 50 to about 23 minutes', () => {
    expect(((5 / 6) / (6 - 5)) * 60).toBeCloseTo(50, 9)
    expect(erlangWq(10, 6, 2) * 60).toBeCloseTo(22.727, 3)
    expect(mmc(10, 6, 2).wq).toBeCloseTo(erlangWq(10, 6, 2), 12)
    expect(mmc(10, 6, 2).pw).toBeCloseTo(0.7576, 4)
  })
  it('M/M/c: four nurses are the fewest that keep the wait under 5 minutes', () => {
    expect(erlangWq(10, 4, 3) * 60).toBeGreaterThan(5)
    expect(erlangWq(10, 4, 4) * 60).toBeLessThan(5)
    expect(erlangWq(10, 4, 4) * 60).toBeLessThan(4)
  })
  it('newsvendor: critical ratio 0.80 gives about 1,168 units', () => {
    let lo = -5, hi = 5
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (Phi(m) < 16 / 20) lo = m; else hi = m }
    expect(Math.round(1000 + lo * 200)).toBe(1168)
  })
  it('decision tree: EV 220, EV with perfect information 340, EVPI 120', () => {
    const ev = 0.6 * 500 + 0.4 * -200, evpi = 0.6 * Math.max(500, 100) + 0.4 * Math.max(-200, 100) - Math.max(ev, 100)
    expect(ev).toBe(shown('or.decision-tree'))
    expect(evpi).toBeCloseTo(120, 9)
  })
})

describe('OR depth batch: lesson standard', () => {
  it('every enriched OR lesson has objectives, mistakes, a review and rich practice questions', () => {
    const bad: string[] = []
    for (const [id, o] of Object.entries(OR_V3)) {
      const c = CONCEPT_MAP[id]
      if (!c) { bad.push(`${id}: unknown lesson`); continue }
      if ((o.objectives?.length ?? 0) < 2) bad.push(`${id}: objectives`)
      if (!o.mistakes?.length) bad.push(`${id}: mistakes`)
      if (!o.review) bad.push(`${id}: review`)
      if (!c.iq?.length) bad.push(`${id}: no interview questions`)
      for (const q of o.iq || []) if (!q.type || !q.hint || !q.followUps?.length || (q.rubric?.length ?? 0) < 2) bad.push(`${id}: “${q.q.slice(0, 40)}” needs a type, hint, follow-ups and rubric (AGENTS.md)`)
      if (o.real && o.real.kind !== 'illustrative') bad.push(`${id}: scenario must be labelled illustrative`)
      if (o.real && /^illustrative/i.test(o.real.story)) bad.push(`${id}: the label is shown already; don’t repeat it in the story`)
      if (o.review?.status === 'math-validated' && !c.example?.check && !c.iq?.length) bad.push(`${id}: math-validated without numbers to validate`)
    }
    expect(bad).toEqual([])
  })
})
