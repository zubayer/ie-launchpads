import { describe, expect, it } from 'vitest'
import { analyzeMates, analyzeSketch, cantilever, dependents, evalEquations, nullSpace, project, rank, rebuild, viewEdges, type Feature, type SCon, type Sketch, type Voxel } from './cad'

// Expected values are worked out by hand: counting variables and independent equations, small-motion
// kinematics, and textbook beam formulas.
const RECT: Sketch = {
  points: [{ id: 'P1', x: 0, y: 0 }, { id: 'P2', x: 100, y: 0 }, { id: 'P3', x: 100, y: 60 }, { id: 'P4', x: 0, y: 60 }],
  lines: [{ id: 'L1', a: 'P1', b: 'P2' }, { id: 'L2', a: 'P2', b: 'P3' }, { id: 'L3', a: 'P3', b: 'P4' }, { id: 'L4', a: 'P4', b: 'P1' }],
  circles: [],
}
const HV: SCon[] = [{ k: 'horizontal', l: 'L1' }, { k: 'horizontal', l: 'L3' }, { k: 'vertical', l: 'L2' }, { k: 'vertical', l: 'L4' }]

describe('linear algebra', () => {
  it('rank and null space', () => {
    expect(rank([[1, 2], [2, 4]], 2)).toBe(1)
    expect(rank([[1, 0, 0], [0, 1, 0], [1, 1, 0]], 3)).toBe(2)
    const ns = nullSpace([[1, 0, 0], [0, 1, 0]], 3)
    expect(ns.length).toBe(1)
    expect(Math.abs(ns[0][2])).toBeCloseTo(1, 9)
  })
})

describe('sketch degrees of freedom', () => {
  it('a free rectangle has 8: four points, two coordinates each', () => {
    const a = analyzeSketch(RECT, [])
    expect([a.dof, a.status]).toEqual([8, 'under'])
  })
  it('horizontal and vertical relations leave position (2) and size (2)', () => {
    expect(analyzeSketch(RECT, HV).dof).toBe(4)
  })
  it('origin plus width and height fully define it', () => {
    const a = analyzeSketch(RECT, [...HV, { k: 'origin', p: 'P1' }, { k: 'length', l: 'L1', v: 100 }, { k: 'length', l: 'L2', v: 60 }])
    expect([a.dof, a.redundant, a.status, a.free.size, a.satisfied]).toEqual([0, 0, 'fully', 0, true])
  })
  it('a parallel relation on two horizontal lines is redundant: over defined', () => {
    const a = analyzeSketch(RECT, [...HV, { k: 'parallel', l1: 'L1', l2: 'L3' }])
    expect(a.removed).toEqual([1, 1, 1, 1, 0])
    expect([a.redundant, a.status]).toEqual([1, 'over'])
  })
  it('a second width dimension is redundant even when its value agrees', () => {
    const a = analyzeSketch(RECT, [...HV, { k: 'length', l: 'L1', v: 100 }, { k: 'length', l: 'L3', v: 100 }])
    expect(a.removed.slice(-2)).toEqual([1, 0])
  })
  it('a sketch with only size dimensions still moves: blue lines', () => {
    const a = analyzeSketch(RECT, [...HV, { k: 'length', l: 'L1', v: 100 }, { k: 'length', l: 'L2', v: 60 }])
    expect(a.dof).toBe(2)
    expect([...a.free].sort()).toEqual(['L1', 'L2', 'L3', 'L4', 'P1', 'P2', 'P3', 'P4'])
  })
  it('a hole: centre (2) and radius (1), located by two dimensions and a diameter', () => {
    const s: Sketch = { ...RECT, points: [...RECT.points, { id: 'H', x: 30, y: 30 }], circles: [{ id: 'C1', c: 'H', r: 10 }] }
    const base: SCon[] = [...HV, { k: 'origin', p: 'P1' }, { k: 'length', l: 'L1', v: 100 }, { k: 'length', l: 'L2', v: 60 }]
    expect(analyzeSketch(s, base).dof).toBe(3)
    const a = analyzeSketch(s, [...base, { k: 'hdist', p: 'P1', q: 'H', v: 30 }, { k: 'vdist', p: 'P1', q: 'H', v: 30 }, { k: 'diameter', c: 'C1', v: 20 }])
    expect([a.dof, a.status]).toEqual([0, 'fully'])
  })
  it('tangency removes one, and a line tangent to a fixed circle can still slide', () => {
    const s: Sketch = { points: [{ id: 'O', x: 0, y: 0 }, { id: 'A', x: -20, y: 10 }, { id: 'B', x: 20, y: 10 }], lines: [{ id: 'T', a: 'A', b: 'B' }], circles: [{ id: 'C', c: 'O', r: 10 }] }
    const a = analyzeSketch(s, [{ k: 'origin', p: 'O' }, { k: 'diameter', c: 'C', v: 20 }, { k: 'tangent', l: 'T', c: 'C' }, { k: 'horizontal', l: 'T' }])
    expect(a.removed).toEqual([2, 1, 1, 1])
    expect(a.dof).toBe(2) // 7 variables − 5: the endpoints can slide along the tangent line
    expect(a.satisfied).toBe(true)
  })
})

const BASE: Record<string, Feature> = {
  top: { kind: 'plane', p: [0, 0, 0], n: [0, 0, 1] },
  front: { kind: 'plane', p: [0, 0, 0], n: [0, -1, 0] },
  side: { kind: 'plane', p: [0, 0, 0], n: [-1, 0, 0] },
  hole1: { kind: 'axis', p: [20, 20, 0], d: [0, 0, 1] },
  hole2: { kind: 'axis', p: [60, 20, 0], d: [0, 0, 1] },
}
const BLOCK: Record<string, Feature> = {
  bottom: { kind: 'plane', p: [0, 0, 0], n: [0, 0, -1] },
  front: { kind: 'plane', p: [0, 0, 0], n: [0, -1, 0] },
  side: { kind: 'plane', p: [0, 0, 0], n: [-1, 0, 0] },
  pin1: { kind: 'axis', p: [20, 20, 0], d: [0, 0, 1] },
  pin2: { kind: 'axis', p: [60, 20, 0], d: [0, 0, 1] },
}
const m = (kind: 'coincident' | 'concentric' | 'parallel' | 'lock', moving: string, fixed: string) => ({ kind, moving, fixed })

describe('mate degrees of freedom', () => {
  it('an unmated part has 6', () => {
    expect(analyzeMates([], BLOCK, BASE)).toMatchObject({ dof: 6, rotations: 3, translations: 3 })
  })
  it('a concentric mate removes 2 translations and 2 rotations', () => {
    const a = analyzeMates([m('concentric', 'pin1', 'hole1')], BLOCK, BASE)
    expect([a.removed[0], a.dof, a.rotations, a.translations]).toEqual([4, 2, 1, 1])
  })
  it('concentric plus a coincident face leaves one rotation about the pin axis: a hinge', () => {
    const a = analyzeMates([m('concentric', 'pin1', 'hole1'), m('coincident', 'bottom', 'top')], BLOCK, BASE)
    expect([a.dof, a.rotations, a.redundant]).toEqual([1, 1, 2])
    const r = a.motions[0]
    expect(r.kind).toBe('rotate')
    expect(Math.abs(r.dir[2])).toBeCloseTo(1, 9)
    expect(r.through![0]).toBeCloseTo(20, 6)
    expect(r.through![1]).toBeCloseTo(20, 6)
  })
  it('two perpendicular face mates leave one slide, with one redundant rotation equation', () => {
    const a = analyzeMates([m('coincident', 'bottom', 'top'), m('coincident', 'front', 'front')], BLOCK, BASE)
    expect([a.dof, a.translations, a.redundant]).toEqual([1, 1, 1])
    expect(Math.abs(a.motions[0].dir[0])).toBeCloseTo(1, 9)
  })
  it('two parallel pins: the second concentric adds only one constraint (rotation about the first pin)', () => {
    const a = analyzeMates([m('concentric', 'pin1', 'hole1'), m('concentric', 'pin2', 'hole2')], BLOCK, BASE)
    expect([a.removed[1], a.dof, a.redundant]).toEqual([1, 1, 3])
    expect(a.motions[0].kind).toBe('slide')
  })
  it('three face mates or a lock fix the part', () => {
    expect(analyzeMates([m('coincident', 'bottom', 'top'), m('coincident', 'front', 'front'), m('coincident', 'side', 'side')], BLOCK, BASE)).toMatchObject({ dof: 0, redundant: 3 })
    expect(analyzeMates([m('lock', 'bottom', 'top')], BLOCK, BASE)).toMatchObject({ dof: 0, redundant: 0 })
  })
  it('a parallel mate removes two rotations only', () => {
    expect(analyzeMates([m('parallel', 'front', 'front')], BLOCK, BASE)).toMatchObject({ dof: 4, rotations: 1, translations: 3 })
  })
})

describe('equations', () => {
  it('evaluates with precedence, parentheses and dependencies in any order', () => {
    const r = evalEquations([{ name: 'Pitch', expr: '"Width" / 4' }, { name: 'Width', expr: '120' }, { name: 'X3', expr: '3 * "Pitch"' }, { name: 'Y', expr: '-(2 + 3) * 4 - 1' }])
    expect(r.errors).toEqual({})
    expect(r.values).toMatchObject({ Width: 120, Pitch: 30, X3: 90, Y: -21 })
  })
  it('reports unknown names, circular references and syntax errors', () => {
    const r = evalEquations([{ name: 'A', expr: '"B" + 1' }, { name: 'B', expr: '"A" * 2' }, { name: 'C', expr: '"Nope"' }, { name: 'D', expr: '2 +' }, { name: 'E', expr: '4 / (2 - 2)' }])
    expect(r.errors.A).toMatch(/circular/)
    expect(r.errors.C).toMatch(/not defined/)
    expect(r.errors.D).toMatch(/incomplete/)
    expect(r.errors.E).toMatch(/division by zero/)
  })
  it('uses global values passed in', () => {
    expect(evalEquations([{ name: 'H1', expr: '"Width" / 2' }], { Width: 150 }).values.H1).toBe(75)
  })
})

describe('feature tree', () => {
  const F = [
    { id: 'Sketch1', label: 'Sketch1', refs: ['Top Plane'] },
    { id: 'Base', label: 'Boss-Extrude1', refs: ['Sketch1'] },
    { id: 'Sketch2', label: 'Sketch2', refs: ['Base'] },
    { id: 'Boss', label: 'Boss-Extrude2', refs: ['Sketch2'] },
    { id: 'Fillet', label: 'Fillet1', refs: ['Boss', 'Base'] },
  ]
  it('rebuilds in order and flags features whose parents come later', () => {
    expect(rebuild(F)).toEqual({})
    const bad = rebuild([F[0], F[1], F[4], F[2], F[3]])
    expect(Object.keys(bad)).toEqual(['Fillet'])
    expect(bad.Fillet).toMatch(/Boss/)
  })
  it('finds every feature that depends on one', () => {
    expect(dependents(F, 'Base')).toEqual(['Sketch2', 'Boss', 'Fillet'])
    expect(dependents(F, 'Fillet')).toEqual([])
  })
})

describe('orthographic views', () => {
  // An L-bracket: a slab (z = 0) two deep, and a wall at the back (y = 1) two high.
  const L: Voxel[] = []
  for (let x = 0; x < 3; x++) { L.push([x, 0, 0], [x, 1, 0], [x, 1, 1], [x, 1, 2]) }
  it('front view: the slab is nearer than the wall', () => {
    expect(project(L, 'front').cells).toEqual([[1, 1, 1], [1, 1, 1], [0, 0, 0]])
  })
  it('top view: the wall top is nearest, the slab two levels down', () => {
    expect(project(L, 'top').cells).toEqual([[0, 0, 0], [2, 2, 2]])
  })
  it('right view: an L profile', () => {
    expect(project(L, 'right').cells).toEqual([[null, 0], [null, 0], [0, 0]])
  })
  it('visible edges include the step between slab and wall in the front view', () => {
    const e = viewEdges(project(L, 'front'))
    expect(e.some(([c1, r1, c2, r2]) => r1 === 2 && r2 === 2 && c2 - c1 === 1)).toBe(true)
    expect(e.length).toBe(3 * 2 + 3 + 3 * 2) // outline: 3 top + 3 bottom + 3 left + 3 right, plus the 3-cell step
  })
})

describe('cantilever hand calculation', () => {
  it('matches the textbook formulas (worked by hand)', () => {
    const r = cantilever({ F: 1000, L: 200, b: 20, h: 40, E: 200000, Sy: 250 })
    expect(r.I).toBeCloseTo(106666.667, 2)
    expect(r.sigma).toBeCloseTo(37.5, 9)
    expect(r.delta).toBeCloseTo(0.125, 9)
    expect(r.fos).toBeCloseTo(6.6667, 4)
  })
  it('doubling the depth quarters the stress and divides deflection by 8', () => {
    const a = cantilever({ F: 500, L: 300, b: 10, h: 20, E: 69000, Sy: 276 }), b = cantilever({ F: 500, L: 300, b: 10, h: 40, E: 69000, Sy: 276 })
    expect(a.sigma / b.sigma).toBeCloseTo(4, 9)
    expect(a.delta / b.delta).toBeCloseTo(8, 9)
  })
})

import { BRACKET, CAD_LESSONS, CAD_LESSON_MAP, FEATURES, MATES, MATE_FEATURES, PARTS, SKETCHES } from '../content/cad/course'
import { grade, keepPart, mateState, sketchState, smallestDepth, theoreticalMinimum } from '../content/cad/grade'
import { CONCEPT_MAP } from '../content'
import { SOURCES } from '../content/sources'
import { DEEP_DIVE } from '../content/deepDives'

describe('CAD studio course', () => {
  it('lessons are well formed and point at real lesson pages and sources', () => {
    expect(CAD_LESSONS.length).toBe(7)
    for (const l of CAD_LESSONS) {
      expect(CONCEPT_MAP[l.concept], l.concept).toBeTruthy()
      expect(CAD_LESSON_MAP[l.id]).toBe(l)
      expect(l.model.length, l.id).toBeGreaterThanOrEqual(4)
      expect(l.labs.length, l.id).toBeGreaterThan(0)
      expect(l.checks.length, l.id).toBeGreaterThan(0)
      for (const c of l.cites) expect(SOURCES[c.src], c.src).toBeTruthy()
      expect(l.cites.length > 0 || !!l.unsourced, `${l.id}: cite a source or say what is unsourced`).toBe(true)
      for (const c of l.checks) expect(c.answer).toBeLessThan(c.options.length)
      expect(DEEP_DIVE[l.concept]?.some((d) => d.to === `/studio/cad/${l.id}`), `${l.concept} → ${l.id}`).toBe(true)
    }
  })
  it('every relation offered in a sketch preset is true of the drawn geometry', () => {
    for (const p of SKETCHES) for (const o of [...p.given, ...p.options]) {
      expect(analyzeSketch(p.sketch, [o.value]).satisfied, `${p.id}: ${o.label}`).toBe(true)
    }
    for (const p of SKETCHES) for (const g of p.given) expect(p.options.some((o) => o.id === g.id), `${p.id}: ${g.id} is both given and optional`).toBe(false)
  })
  it('sketch claims: the plate starts with 3 free (the hole), and both-sides dimensioning is redundant', () => {
    expect(sketchState('plate', []).dof).toBe(3)
    const a = sketchState('plate', ['hx-left', 'hx-right'])
    expect(a.redundant).toBe(1)
    expect(sketchState('rect', ['h-bottom', 'h-top', 'v-right', 'v-left', 'parallel']).status).toBe('over')
    expect(sketchState('rect', ['h-bottom', 'h-top', 'v-right', 'v-left', 'w-bottom', 'h-right']).dof).toBe(2) // sized, not located
  })
  it('mate presets match the kernel test geometry, and the two-pin mistake leaves a slide', () => {
    expect(MATE_FEATURES.fixed).toEqual(BASE)
    expect(MATE_FEATURES.moving).toEqual(BLOCK)
    const a = mateState(['pin1', 'pin2'])
    expect([a.dof, a.redundant, a.motions[0].kind]).toEqual([1, 3, 'slide'])
    expect(MATES.length).toBe(7)
  })
  it('every task’s model answer passes its grader, and an empty answer does not', () => {
    for (const l of CAD_LESSONS) for (const t of l.tasks) {
      const g = t.goal
      const ans = g.kind === 'sketch' || g.kind === 'mates' ? { picked: t.model as string[] }
        : g.kind === 'equations' ? { eqs: t.model as { name: string; expr: string }[] }
          : g.kind === 'features' ? { order: ['Sketch1', 'Base', 'Sketch2', 'Boss', 'Hole', 'Fillet', 'Shell'] }
            : g.kind === 'beam' ? { h: g.answer }
              : { keep: Object.fromEntries(PARTS.map((p) => [p.id, keepPart(p)])) }
      expect(grade(g, ans), t.id).toMatchObject({ ok: true })
      const empty = g.kind === 'features' ? { order: g.start } : g.kind === 'beam' ? { h: g.answer - 1 } : {}
      expect(grade(g, empty).ok, `${t.id} empty`).toBe(false)
    }
  })
  it('the equations lab starts with typed-in chain values that fail both intents', () => {
    const start = CAD_LESSON_MAP.intent.labs.find((x) => x.kind === 'equations')!
    if (start.kind !== 'equations') throw new Error('lab')
    for (const t of CAD_LESSON_MAP.intent.tasks) expect(grade(t.goal, { eqs: start.start }).ok, t.id).toBe(false)
  })
  it('feature tree claims: deleting the upright fails the fillet and the shell', () => {
    expect(dependents(FEATURES, 'Boss')).toEqual(['Fillet', 'Shell'])
    const c = CAD_LESSON_MAP.features.checks.find((x) => x.id === 'ft-c1')!
    expect(c.options[c.answer]).toBe('Fillet1 and Shell1')
    expect(Object.keys(rebuild(FEATURES))).toEqual([])
  })
  it('beam task numbers are recomputed', () => {
    expect(smallestDepth(1000, 300, 20, 200000, 250, 3, 1)).toBe(33)
    const r = cantilever({ F: 1000, L: 300, b: 20, h: 33, E: 200000, Sy: 250 })
    expect(r.sigma).toBeCloseTo(82.6, 1)
    expect(r.fos).toBeCloseTo(3.03, 2)
    expect(r.delta).toBeCloseTo(0.75, 2)
    expect(Math.sqrt(90000 / (250 / 3))).toBeCloseTo(32.9, 1) // stress limit on h
    expect(Math.cbrt(27000)).toBeCloseTo(30, 9) // deflection limit on h
  })
  it('DFA: theoretical minimum of the sensor housing is 5 of 12', () => {
    expect(theoreticalMinimum()).toBe(5)
    expect(PARTS.reduce((a, p) => a + p.qty, 0)).toBe(12)
  })
  it('the bracket projects to sensible views', () => {
    const f = project(BRACKET, 'front')
    expect([f.w, f.h]).toEqual([4, 3])
    expect(f.cells[0]).toEqual([2, null, null, 2]) // the notch is open at the top of the wall
  })
})
