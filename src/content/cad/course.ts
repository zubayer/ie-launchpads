// The CAD studio course: seven lessons on SolidWorks-style parametric modelling, built on the kernels in
// src/lib/cad.ts. src/lib/cad.test.ts checks every preset (relations hold on the drawn geometry, model answers
// meet their goals, wrong answers don't). SOLIDWORKS help pages are cited where a claim depends on them; the
// rest is general engineering (geometry, kinematics, beam theory) checked by the tests.
import type { Citation } from '../../types'
import type { Equation, FeatureNode, Mate, SCon, Sketch, Voxel } from '../../lib/cad'

export interface Choice<T> { id: string; label: string; value: T }
export interface SketchPreset { id: string; title: string; sketch: Sketch; given: Choice<SCon>[]; options: Choice<SCon>[]; start: string[] }
export interface PartCount { id: string; part: string; qty: number; moves: boolean; material: boolean; separate: boolean; base?: boolean; why: string }
export type CadLabSpec =
  | { kind: 'sketch'; preset: string; intro: string }
  | { kind: 'mates'; intro: string; start: string[] }
  | { kind: 'intent'; intro: string }
  | { kind: 'equations'; intro: string; start: Equation[] }
  | { kind: 'features'; intro: string; start: string[] }
  | { kind: 'views'; intro: string }
  | { kind: 'beam'; intro: string }
  | { kind: 'partcount'; intro: string }
export type CadGoal =
  | { kind: 'sketch'; preset: string; status: 'fully'; maxOptions?: number }
  | { kind: 'mates'; dof: number; rotations?: number; translations?: number; maxRedundant?: number; noLock?: boolean }
  | { kind: 'equations'; widths: number[]; want: Record<string, (w: number) => number> }
  | { kind: 'features'; start: string[] }
  | { kind: 'beam'; answer: number }
  | { kind: 'partcount' }
export interface CadTask { id: string; task: string; hint: string; goal: CadGoal; model: string[] | Equation[] | string; start?: string[] }
export interface CadCheck { id: string; q: string; options: string[]; answer: number; why: string }
export interface CadMistake { id: string; title: string; wrong: string; right: string; why: string }
export interface CadLesson {
  id: string; concept: string; title: string; level: 'Foundation' | 'Core' | 'Applied'; minutes: number
  goal: string; intuition: string; analogy: string; model: string[]
  labs: CadLabSpec[]; mistakes: CadMistake[]; tasks: CadTask[]; checks: CadCheck[]
  interview: { q: string; a: string }[]; onTheJob: string; cites: Citation[]; unsourced?: string
}

// ---------- Presets ----------
const RECT: Sketch = {
  points: [{ id: 'P1', x: 0, y: 0 }, { id: 'P2', x: 100, y: 0 }, { id: 'P3', x: 100, y: 60 }, { id: 'P4', x: 0, y: 60 }],
  lines: [{ id: 'L1', a: 'P1', b: 'P2' }, { id: 'L2', a: 'P2', b: 'P3' }, { id: 'L3', a: 'P3', b: 'P4' }, { id: 'L4', a: 'P4', b: 'P1' }],
  circles: [],
}
const RECT_HV: Choice<SCon>[] = [
  { id: 'h-bottom', label: 'Horizontal: bottom line', value: { k: 'horizontal', l: 'L1' } },
  { id: 'h-top', label: 'Horizontal: top line', value: { k: 'horizontal', l: 'L3' } },
  { id: 'v-right', label: 'Vertical: right line', value: { k: 'vertical', l: 'L2' } },
  { id: 'v-left', label: 'Vertical: left line', value: { k: 'vertical', l: 'L4' } },
]
const RECT_DONE: Choice<SCon>[] = [
  ...RECT_HV,
  { id: 'origin', label: 'Coincident: bottom-left corner on the origin', value: { k: 'origin', p: 'P1' } },
  { id: 'w-bottom', label: 'Dimension: bottom line = 100 mm', value: { k: 'length', l: 'L1', v: 100 } },
  { id: 'h-right', label: 'Dimension: right line = 60 mm', value: { k: 'length', l: 'L2', v: 60 } },
]
export const SKETCHES: SketchPreset[] = [
  {
    id: 'rect', title: 'A rectangle for a base plate', sketch: RECT, start: [], given: [],
    options: [
      ...RECT_HV,
      { id: 'origin', label: 'Coincident: bottom-left corner on the origin', value: { k: 'origin', p: 'P1' } },
      { id: 'w-bottom', label: 'Dimension: bottom line = 100 mm', value: { k: 'length', l: 'L1', v: 100 } },
      { id: 'w-top', label: 'Dimension: top line = 100 mm', value: { k: 'length', l: 'L3', v: 100 } },
      { id: 'h-right', label: 'Dimension: right line = 60 mm', value: { k: 'length', l: 'L2', v: 60 } },
      { id: 'parallel', label: 'Parallel: top and bottom lines', value: { k: 'parallel', l1: 'L1', l2: 'L3' } },
      { id: 'equal', label: 'Equal: top and bottom lines', value: { k: 'equal', l1: 'L1', l2: 'L3' } },
      { id: 'perp', label: 'Perpendicular: bottom and left lines', value: { k: 'perpendicular', l1: 'L1', l2: 'L4' } },
    ],
  },
  {
    id: 'plate', title: 'Locating a hole in the plate',
    sketch: { ...RECT, points: [...RECT.points, { id: 'H', x: 30, y: 30 }], circles: [{ id: 'C1', c: 'H', r: 10 }] },
    start: [], given: RECT_DONE,
    options: [
      { id: 'hx-left', label: 'Dimension: hole centre 30 mm from the left edge', value: { k: 'hdist', p: 'P1', q: 'H', v: 30 } },
      { id: 'hx-right', label: 'Dimension: hole centre 70 mm from the right edge', value: { k: 'hdist', p: 'H', q: 'P2', v: 70 } },
      { id: 'hy-bottom', label: 'Dimension: hole centre 30 mm above the bottom edge', value: { k: 'vdist', p: 'P1', q: 'H', v: 30 } },
      { id: 'hy-top', label: 'Dimension: hole centre 30 mm below the top edge', value: { k: 'vdist', p: 'H', q: 'P4', v: 30 } },
      { id: 'dia', label: 'Dimension: hole diameter = 20 mm', value: { k: 'diameter', c: 'C1', v: 20 } },
    ],
  },
  {
    id: 'tangent', title: 'A line tangent to an arc boss',
    sketch: { points: [{ id: 'O', x: 0, y: 0 }, { id: 'A', x: -20, y: 10 }, { id: 'B', x: 20, y: 10 }], lines: [{ id: 'T', a: 'A', b: 'B' }], circles: [{ id: 'C', c: 'O', r: 10 }] },
    start: [], given: [],
    options: [
      { id: 'o', label: 'Coincident: circle centre on the origin', value: { k: 'origin', p: 'O' } },
      { id: 'd', label: 'Dimension: circle diameter = 20 mm', value: { k: 'diameter', c: 'C', v: 20 } },
      { id: 't', label: 'Tangent: line and circle', value: { k: 'tangent', l: 'T', c: 'C' } },
      { id: 'h', label: 'Horizontal: line', value: { k: 'horizontal', l: 'T' } },
      { id: 'len', label: 'Dimension: line = 40 mm', value: { k: 'length', l: 'T', v: 40 } },
      { id: 'ax', label: 'Dimension: left end 20 mm left of the centre', value: { k: 'hdist', p: 'A', q: 'O', v: 20 } },
    ],
  },
]
export const SKETCH_MAP = Object.fromEntries(SKETCHES.map((s) => [s.id, s]))

/** Base plate (fixed) and a block (moving) whose features coincide at the starting pose. Millimetres. */
export const MATE_FEATURES = {
  fixed: {
    top: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [0, 0, 1] as [number, number, number] },
    front: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [0, -1, 0] as [number, number, number] },
    side: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [-1, 0, 0] as [number, number, number] },
    hole1: { kind: 'axis' as const, p: [20, 20, 0] as [number, number, number], d: [0, 0, 1] as [number, number, number] },
    hole2: { kind: 'axis' as const, p: [60, 20, 0] as [number, number, number], d: [0, 0, 1] as [number, number, number] },
  },
  moving: {
    bottom: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [0, 0, -1] as [number, number, number] },
    front: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [0, -1, 0] as [number, number, number] },
    side: { kind: 'plane' as const, p: [0, 0, 0] as [number, number, number], n: [-1, 0, 0] as [number, number, number] },
    pin1: { kind: 'axis' as const, p: [20, 20, 0] as [number, number, number], d: [0, 0, 1] as [number, number, number] },
    pin2: { kind: 'axis' as const, p: [60, 20, 0] as [number, number, number], d: [0, 0, 1] as [number, number, number] },
  },
}
export const MATES: Choice<Mate>[] = [
  { id: 'face', label: 'Coincident: block bottom face to plate top face', value: { kind: 'coincident', moving: 'bottom', fixed: 'top' } },
  { id: 'pin1', label: 'Concentric: pin 1 to hole 1', value: { kind: 'concentric', moving: 'pin1', fixed: 'hole1' } },
  { id: 'pin2', label: 'Concentric: pin 2 to hole 2', value: { kind: 'concentric', moving: 'pin2', fixed: 'hole2' } },
  { id: 'front', label: 'Coincident: block front face to plate front face', value: { kind: 'coincident', moving: 'front', fixed: 'front' } },
  { id: 'side', label: 'Coincident: block side face to plate side face', value: { kind: 'coincident', moving: 'side', fixed: 'side' } },
  { id: 'par', label: 'Parallel: block front face to plate front face', value: { kind: 'parallel', moving: 'front', fixed: 'front' } },
  { id: 'lock', label: 'Lock: block to plate', value: { kind: 'lock', moving: 'bottom', fixed: 'top' } },
]
export const MATE_MAP = Object.fromEntries(MATES.map((m) => [m.id, m]))

export const FEATURES: FeatureNode[] = [
  { id: 'Sketch1', label: 'Sketch1 (on Top Plane)', refs: ['Top Plane'] },
  { id: 'Base', label: 'Boss-Extrude1: the base plate', refs: ['Sketch1'] },
  { id: 'Sketch2', label: 'Sketch2 (on the top face of the base)', refs: ['Base'] },
  { id: 'Boss', label: 'Boss-Extrude2: the upright', refs: ['Sketch2'] },
  { id: 'Hole', label: 'Hole Wizard: two mounting holes in the base', refs: ['Base'] },
  { id: 'Fillet', label: 'Fillet1: edges where the upright meets the base', refs: ['Boss', 'Base'] },
  { id: 'Shell', label: 'Shell1: hollow out from the bottom face', refs: ['Base', 'Fillet'] },
]

/** A bracket made of unit cubes: a slab, a back wall and a notch in the wall. */
export const BRACKET: Voxel[] = (() => {
  const v: Voxel[] = []
  for (let x = 0; x < 4; x++) for (let y = 0; y < 3; y++) v.push([x, y, 0])
  for (let x = 0; x < 4; x++) for (let z = 1; z < 3; z++) if (!(x >= 1 && x <= 2 && z === 2)) v.push([x, 2, z])
  return v
})()

export const PARTS: PartCount[] = [
  { id: 'base', part: 'Housing base (molded plastic)', qty: 1, moves: false, material: false, separate: false, base: true, why: 'Something has to be first; the base is the theoretical minimum of one part that everything else is checked against.' },
  { id: 'cover', part: 'Cover (same plastic)', qty: 1, moves: false, material: false, separate: true, why: 'It must come off to service the board, so it has to be separate.' },
  { id: 'screws', part: 'Cover screws', qty: 4, moves: false, material: false, separate: false, why: 'Fasteners never pass the test on their own: snap fits could replace them, if the cover is opened rarely.' },
  { id: 'gasket', part: 'Gasket (rubber)', qty: 1, moves: false, material: true, separate: false, why: 'A different, soft material for sealing; it could also be overmolded onto the cover, so it counts once at most.' },
  { id: 'pcb', part: 'Circuit board', qty: 1, moves: false, material: true, separate: true, why: 'Different material and must be replaceable.' },
  { id: 'standoffs', part: 'Board standoffs', qty: 2, moves: false, material: false, separate: false, why: 'They could be molded into the base.' },
  { id: 'pipe', part: 'Light pipe (clear plastic)', qty: 1, moves: false, material: true, separate: false, why: 'Optically clear material, so it can’t be molded in the opaque base: it stays.' },
  { id: 'label', part: 'Label', qty: 1, moves: false, material: false, separate: false, why: 'Markings can be molded or printed on the cover.' },
]
// Theoretical minimum here: base, cover, gasket, circuit board, light pipe = 5 of 12 parts.

const SW = 'https://help.solidworks.com'
const C = {
  status: { src: 'solidworks-help', url: `${SW}/2023/english/SolidWorks/sldworks/c_Sketch_Status_Conventions.htm`, section: 'Sketch Status Conventions (2023)', supports: 'Sketches can be under defined (free to change), fully defined or over defined (dimensions or relations conflicting or redundant); a sketch need not be fully defined to make a feature, but should be fully defined before the part is complete' },
  colors: { src: 'solidworks-help', url: `${SW}/2020/english/SolidWorks/sldworks/c_Sketch_Geometry_Status.htm`, section: 'Sketch Geometry Status (2020)', supports: 'Under-defined entities appear blue, fully defined black; a redundant dimension can be made driven (gray)' },
  dof: { src: 'solidworks-help', url: `${SW}/2020/english/SolidWorks/motionstudies/c_degrees_freedom_motion.htm`, section: 'Degrees of Freedom (motion studies, 2020)', supports: 'An unconstrained rigid body has six degrees of freedom; mates remove degrees of freedom; Motion Analysis can count degrees of freedom and redundancies' },
  concentric: { src: 'solidworks-help', url: `${SW}/2012/English/SolidWorks/MotionStudies/Degrees_of_Freedom.htm`, section: 'Degrees of Freedom (2012)', supports: 'A concentric mate removes two translational and two rotational degrees of freedom; a distance or coincident mate on the faces removes the last translation; a four-bar linkage with all-concentric mates has three redundant mates' },
  mates: { src: 'solidworks-help', url: `${SW}/2017/English/SolidWorks/sldworks/c_Mates_Overview_Assemblies.htm`, section: 'Mates overview (2017)', supports: 'Mates create geometric relationships between components and define their allowable motion' },
  misalign: { src: 'solidworks-help', url: `${SW}/2018/English/SolidWorks/Sldworks/HIDD_NEW_ADD_MATE.htm`, section: 'Mate PropertyManager: Mates tab (2018)', supports: 'Linked concentric mates can absorb misalignment: solve one exactly and put the misalignment on the other, or split it symmetrically' },
} satisfies Record<string, Citation>

export const CAD_LESSONS: CadLesson[] = [
  {
    id: 'sketch', concept: 'automation.parametric', title: 'Sketches, relations and degrees of freedom', level: 'Foundation', minutes: 20,
    goal: 'Fully define a sketch on purpose: count its degrees of freedom, remove them with relations and dimensions, and spot an over-defined sketch.',
    intuition: 'Every sketch entity can move until something pins it down. A point can slide in x and y: two degrees of freedom. A line is two points, four. Relations (horizontal, coincident, tangent) and dimensions each remove some. When none are left, the sketch is fully defined: it can only change when you change a dimension, which is exactly what makes a model editable later.',
    analogy: 'Pinning a paper shape to a corkboard: one pin lets it spin, two pins fix it; a third pin in the same spot adds nothing but a hole.',
    model: [
      'Count the freedoms: point 2, line 4 (its two end points), circle 3 (centre and radius).',
      'Each relation or dimension removes the freedoms it pins: coincident to a point 2, horizontal 1, tangent 1, a length 1.',
      'Fully defined = no freedoms left and nothing redundant. In SOLIDWORKS the entities turn from blue to black.',
      'A relation that pins something already pinned (parallel on two horizontal lines, a second width) is redundant: the sketch is over defined, even if the values agree. Make one of them a driven (reference) dimension instead.',
      'Anchor the sketch to the origin (or other model geometry), otherwise the whole shape can still slide.',
      'SOLIDWORKS lets you build features from under-defined sketches, but its help says to fully define them before you call a part complete.',
    ],
    labs: [
      { kind: 'sketch', preset: 'rect', intro: 'Tick relations and dimensions. The counter is the real rank calculation a sketch solver does: degrees of freedom = variables − independent equations.' },
      { kind: 'sketch', preset: 'plate', intro: 'The rectangle is already fully defined. Locate and size the hole: try dimensioning it from both the left and the right edge.' },
      { kind: 'sketch', preset: 'tangent', intro: 'Tangency removes one freedom. Which extra condition stops the line sliding along the circle?' },
    ],
    mistakes: [
      { id: 'sk-float', title: 'Sized but not located', wrong: 'Width and height dimensions only, no relation to the origin.', right: 'Add a coincident relation from a corner (or the centre) to the origin.', why: 'The size is fixed but the whole rectangle can still slide: 2 degrees of freedom left, and the part moves when someone edits a neighbouring feature.' },
      { id: 'sk-double', title: 'Dimensioning both sides', wrong: 'The hole located 30 mm from the left edge and 70 mm from the right.', right: 'One location dimension per direction, from the datum that matters; show the other as a driven (reference) dimension if the drawing needs it.', why: 'With the plate width fixed, the second dimension is redundant: the sketch is over defined, and if the width changes the two can conflict.' },
    ],
    tasks: [
      { id: 'sk-t1', task: 'Fully define the rectangle with no redundant relations.', hint: 'Four horizontal/vertical relations, one coincident to the origin, a width and a height: 8 equations for 8 freedoms.', goal: { kind: 'sketch', preset: 'rect', status: 'fully' }, model: ['h-bottom', 'h-top', 'v-right', 'v-left', 'origin', 'w-bottom', 'h-right'] },
      { id: 'sk-t2', task: 'Fully define the hole with exactly three dimensions.', hint: 'Two location dimensions (one horizontal, one vertical) and the diameter.', goal: { kind: 'sketch', preset: 'plate', status: 'fully', maxOptions: 3 }, model: ['hx-left', 'hy-bottom', 'dia'] },
      { id: 'sk-t3', task: 'Fully define the tangent line and its circle.', hint: 'Origin, diameter, tangent, horizontal, length, and one more position.', goal: { kind: 'sketch', preset: 'tangent', status: 'fully' }, model: ['o', 'd', 't', 'h', 'len', 'ax'] },
    ],
    checks: [
      { id: 'sk-c1', q: 'How many degrees of freedom does a free circle have in a 2D sketch?', options: ['1', '2', '3', '4'], answer: 2, why: 'Centre x, centre y and radius.' },
      { id: 'sk-c2', q: 'Both lines of a rectangle are horizontal. You add a parallel relation between them. What happens?', options: ['Nothing changes', 'The sketch becomes over defined: the relation is redundant', 'One more freedom is removed', 'The lines become equal length'], answer: 1, why: 'Two horizontal lines are already parallel; the new relation pins nothing new.' },
    ],
    interview: [
      { q: 'Why fully define sketches?', a: 'So the geometry only changes when a dimension changes. Under-defined sketches can shift when someone edits a related feature or drags an entity, and the change ripples silently into faces, mates and drawings.' },
      { q: 'What does over defined mean, and how do you fix it?', a: 'Some dimensions or relations conflict or repeat each other. Delete the redundant one, or make it a driven (reference) dimension so it reports a value without controlling it.' },
    ],
    onTheJob: 'Fixtures, gauges and workstation parts get revised constantly. A fully defined sketch dimensioned from the right datums means the next engineer can change one number instead of rebuilding the part.',
    cites: [C.status, C.colors],
  },
  {
    id: 'intent', concept: 'automation.solidworks', title: 'Design intent: dimension schemes and equations', level: 'Core', minutes: 25,
    goal: 'Choose dimensions that make a model change the way the design should, and drive related sizes with equations.',
    intuition: 'Two sketches can look identical and still behave completely differently when you change the width. Which edge do the holes belong to? Must they stay centred? Equally spaced? Your choice of dimensions and equations records that intent, so the model makes the right decision when someone edits it a year later.',
    analogy: 'Giving directions by landmarks: “two doors from the corner” and “halfway down the street” describe the same door today, but not after the street is extended.',
    model: [
      'Dimension from the feature that matters to the function: the mating edge, the datum, the centre line.',
      'Chain dimensions (each from the previous feature) are easy to write but stack tolerances: the last hole carries every tolerance in the chain.',
      'Baseline dimensions (all from one datum) keep each position independent of the others.',
      'Symmetry (a midpoint or a symmetric relation) keeps a pattern centred whatever the width.',
      'Equations and global variables tie sizes together: "Pitch" = "Width" / 4. Change one value and the rest follow.',
      'Configurations (and design tables) store variants of one part, such as lengths of a bracket, in one file.',
    ],
    labs: [
      { kind: 'intent', intro: 'Three holes in a plate, four ways to dimension them. Drag the plate width and watch which holes move.' },
      { kind: 'equations', intro: 'Drive the hole positions from the global variable “Width”. Names go in double quotes, like SOLIDWORKS equations.', start: [{ name: 'Hole1', expr: '20' }, { name: 'Hole2', expr: '"Hole1" + 30' }, { name: 'Hole3', expr: '"Hole2" + 30' }] },
    ],
    mistakes: [
      { id: 'in-chain', title: 'Chain dimensions on a bolt pattern', wrong: 'Holes at 20, then +30, then +30 from each other, each ±0.1 mm.', right: 'Dimension each hole from the same datum edge (baseline), or from the centre for a centred pattern.', why: 'The third hole’s position from the edge carries three tolerances: ±0.3 mm. From one datum it is ±0.1 mm.' },
      { id: 'in-magic', title: 'Typed-in numbers that should be related', wrong: 'Hole positions typed as 30, 60 and 90 on a 120 mm plate.', right: 'Link them: "Pitch" = "Width" / 4 and positions as multiples of the pitch.', why: 'When the plate becomes 160 mm, nothing moves, and someone has to find and fix every number by hand.' },
    ],
    tasks: [
      { id: 'in-t1', task: 'Write equations so the three holes stay equally spaced with equal edge margins for any width: margins and gaps all equal.', hint: 'Four equal spaces across the width: each is "Width" / 4.', goal: { kind: 'equations', widths: [100, 130, 160], want: { Hole1: (w) => w / 4, Hole2: (w) => w / 2, Hole3: (w) => (3 * w) / 4 } }, model: [{ name: 'Pitch', expr: '"Width" / 4' }, { name: 'Hole1', expr: '"Pitch"' }, { name: 'Hole2', expr: '2 * "Pitch"' }, { name: 'Hole3', expr: '3 * "Pitch"' }] },
      { id: 'in-t2', task: 'A different intent: keep the hole spacing at 30 mm but keep the pattern centred on the plate.', hint: 'The middle hole sits at half the width; the others are 30 mm either side.', goal: { kind: 'equations', widths: [100, 130, 160], want: { Hole1: (w) => w / 2 - 30, Hole2: (w) => w / 2, Hole3: (w) => w / 2 + 30 } }, model: [{ name: 'Hole2', expr: '"Width" / 2' }, { name: 'Hole1', expr: '"Hole2" - 30' }, { name: 'Hole3', expr: '"Hole2" + 30' }] },
    ],
    checks: [
      { id: 'in-c1', q: 'A cover plate must always have its hole pattern centred, whatever its width. Which scheme records that?', options: ['Chain dimensions from the left edge', 'Baseline dimensions from the left edge', 'A symmetric (centred) scheme', 'Any: they all look the same'], answer: 2, why: 'Only a centred scheme keeps the pattern in the middle when the width changes.' },
      { id: 'in-c2', q: 'Each dimension is ±0.1 mm. Holes are chain-dimensioned 20, 30, 30 from the left edge. Worst-case tolerance of the third hole’s position from that edge?', options: ['±0.1 mm', '±0.2 mm', '±0.3 mm', '±0.6 mm'], answer: 2, why: 'Three dimensions in the chain, worst case: 0.1 + 0.1 + 0.1.' },
    ],
    interview: [
      { q: 'What is design intent?', a: 'How the model should behave when it changes: what stays centred, what is equal, what is measured from which datum. You capture it with relations, the choice of dimensions, equations and feature order, so edits produce the right part instead of a broken one.' },
    ],
    onTheJob: 'IEs often own fixtures and workstation parts that come in families: one design, five lengths. Equations and configurations make that one file instead of five, and dimensioning from the locating datums keeps the fixture right when the product changes.',
    cites: [C.status],
    unsourced: 'Tolerance stacking and dimensioning schemes are general engineering practice; no source page is attached yet.',
  },
  {
    id: 'features', concept: 'automation.parametric', title: 'Features and the feature tree', level: 'Core', minutes: 20,
    goal: 'Read a feature tree as parents and children, predict what breaks when you edit, reorder or delete, and build robust models.',
    intuition: 'A part is a recipe: sketch, extrude, add a boss, round the edges, hollow it out. Every step refers to things made earlier: a face, an edge, a sketch. Those references make the tree a family. Change a parent and every child rebuilds on top of it; delete it and the children lose what they stood on.',
    analogy: 'A stack of instructions where step 5 says “drill through the plate from step 2”: remove step 2 and step 5 no longer makes sense.',
    model: [
      'Features rebuild top to bottom. A feature can only reference what exists above it.',
      'Parent/child: a feature that uses a sketch, face or edge of another becomes its child. Deleting or suppressing a parent affects every descendant.',
      'Prefer references to planes, the origin and sketch geometry over references to edges and faces that change when the model changes.',
      'Put cosmetic features (fillets, chamfers) late: fewer children depend on their edges.',
      'Order changes the shape, not only the history: a fillet made before a shell is rounded inside too; made after, only outside.',
      'Name the features that matter (Base_Plate, Mounting_Holes) so the next person can read the tree.',
    ],
    labs: [{ kind: 'features', intro: 'Reorder the features with the arrows. The rebuild runs live: a feature that references something below it fails. Pick any feature to see everything that depends on it.', start: ['Sketch1', 'Base', 'Sketch2', 'Boss', 'Hole', 'Fillet', 'Shell'] }],
    mistakes: [
      { id: 'ft-edge', title: 'Hanging features on fragile edges', wrong: 'A sketch placed on a filleted face; a hole located from a fillet edge.', right: 'Sketch on planes or main faces; locate from sketch geometry, planes or the origin.', why: 'Remove or resize the fillet and the face or edge disappears; every child fails to rebuild.' },
    ],
    tasks: [
      { id: 'ft-t1', task: 'This tree was scrambled. Reorder it so every feature rebuilds.', hint: 'Work down: each feature needs everything it references above it.', goal: { kind: 'features', start: ['Fillet', 'Sketch2', 'Shell', 'Sketch1', 'Hole', 'Boss', 'Base'] }, model: 'Sketch1, Base, Sketch2, Boss, Hole, Fillet, Shell (Hole can go anywhere after Base).', start: ['Fillet', 'Sketch2', 'Shell', 'Sketch1', 'Hole', 'Boss', 'Base'] },
    ],
    checks: [
      { id: 'ft-c1', q: 'You delete Boss-Extrude2 (the upright). Which features fail?', options: ['Only Fillet1', 'Fillet1 and Shell1', 'Sketch2, Fillet1 and Shell1', 'Nothing: the base is unaffected'], answer: 1, why: 'Fillet1 uses the upright’s edges, and Shell1 depends on Fillet1. Sketch2 is the upright’s parent, not its child.' },
      { id: 'ft-c2', q: 'Why put fillets late in the tree?', options: ['They rebuild faster at the end', 'Fewer later features then depend on fillet edges and faces, which change easily', 'SOLIDWORKS requires it', 'Fillets can’t have children'], answer: 1, why: 'Fillet geometry changes with every size change; keeping it out of the parent chain keeps the model robust.' },
    ],
    interview: [
      { q: 'A model fails to rebuild after a small change. How do you investigate?', a: 'Read the errors top down, because one failed parent cascades. Check what the first failing feature references (a face or edge that disappeared?), repair the reference to a stable one (plane, sketch, origin), and use the parent/child view or rollback to see what depends on it.' },
    ],
    onTheJob: 'Inherited models are the norm in manufacturing. Reading a feature tree quickly tells you whether a change is a two-minute edit or a rebuild.',
    cites: [],
    unsourced: 'Feature-order practice is general CAD practice; no SOLIDWORKS help page is cited yet for it.',
  },
  {
    id: 'mates', concept: 'automation.assembly-mates', title: 'Assemblies, mates and degrees of freedom', level: 'Core', minutes: 25,
    goal: 'Predict how a part can still move after each mate, build hinges and slides on purpose, and recognise redundant mates.',
    intuition: 'A part floating in space has six ways to move: three slides and three rotations. Each mate takes some away. A hinge is “everything taken away except one rotation”; a drawer slide is “everything except one slide”. Thinking in degrees of freedom tells you which mate to add next, and why some mate combinations fight each other.',
    analogy: 'A door on hinges: the frame removes five of the door’s six possible motions and leaves the one you want.',
    model: [
      'A free rigid body has 6 degrees of freedom: 3 translations and 3 rotations.',
      'Coincident face to face removes 3 (one slide, two tilts). Concentric removes 4 (two slides and two tilts across the axis). Parallel removes 2 rotations.',
      'Concentric + coincident face = a hinge: one rotation about the pin axis is left.',
      'Mates are solved together, so order doesn’t matter, but some equations can repeat others: redundancy. A Motion Analysis study counts it; the assembly still solves if the geometry agrees.',
      'Redundancy becomes a real problem when parts aren’t perfect: two concentric pins over-constrain a part, and any spacing error turns into a mate error. SOLIDWORKS offers misalignment options for linked concentric mates.',
      'Fully mated parts don’t move; parts that should move (hinges, slides) should keep exactly the intended freedoms, so motion studies and interference checks mean something.',
    ],
    labs: [{ kind: 'mates', intro: 'A block with two pins on a plate with two holes. Tick mates and see which motions remain: the calculation is the small-motion kinematics of the two bodies.', start: [] }],
    mistakes: [
      { id: 'mt-lock', title: 'Locking everything', wrong: 'Fix or lock every component so nothing moves.', right: 'Fully constrain static parts with mates that reflect how they locate; leave mechanisms the freedom they really have.', why: 'Locked parts don’t follow design changes or show motion, so interference and range-of-motion checks prove nothing.' },
      { id: 'mt-twopins', title: 'Two concentric pins and nothing else', wrong: 'Pin 1 and pin 2 both concentric, expecting a fixed block.', right: 'Add a face mate to stop the slide; treat the second pin as a redundant locator (or use a misalignment option).', why: 'The second pin only removes the rotation about the first, so the block can still slide along the pins, and three of its equations repeat the first pin’s.' },
    ],
    tasks: [
      { id: 'mt-t1', task: 'Make a hinge: exactly one rotation left.', hint: 'One pin and one face.', goal: { kind: 'mates', dof: 1, rotations: 1 }, model: ['pin1', 'face'] },
      { id: 'mt-t2', task: 'Make a slide: exactly one translation left.', hint: 'Two faces at right angles.', goal: { kind: 'mates', dof: 1, translations: 1 }, model: ['face', 'front'] },
      { id: 'mt-t3', task: 'Fix the block (0 degrees of freedom) without a Lock mate, with no more than 3 redundant equations.', hint: 'A pin and a face leave one rotation. Which mate removes only rotations?', goal: { kind: 'mates', dof: 0, maxRedundant: 3, noLock: true }, model: ['face', 'pin1', 'par'] },
    ],
    checks: [
      { id: 'mt-c1', q: 'How many degrees of freedom does a concentric mate remove?', options: ['2', '3', '4', '5'], answer: 2, why: 'Two translations across the axis and two rotations that would tilt the axis.' },
      { id: 'mt-c2', q: 'After a concentric pin mate and a coincident face mate, what can the part still do?', options: ['Nothing', 'Slide along the pin', 'Rotate about the pin', 'Rotate and slide'], answer: 2, why: 'The face stops the slide; only the rotation about the pin axis remains: a hinge.' },
    ],
    interview: [
      { q: 'How do you mate a part that should rotate on a shaft?', a: 'Concentric between the bore and the shaft (removes 4) and a coincident or distance mate between a face and the shoulder (removes the slide), leaving one rotation. Check it by dragging, or with a motion study.' },
      { q: 'What is a redundant mate?', a: 'A mate whose constraints are already enforced by others, such as a second concentric pin on a part that one pin and a face already locate. If geometry isn’t perfect it creates conflicts; a motion study reports redundancies.' },
    ],
    onTheJob: 'Line layouts, fixtures and end-of-arm tooling are assemblies. Mating them the way they really locate (pins, faces, slots) lets you check reach, clearance and interference before anything is built.',
    cites: [C.dof, C.concentric, C.mates, C.misalign],
  },
  {
    id: 'drawings', concept: 'automation.drawings', title: 'Drawings: views and projection', level: 'Core', minutes: 15,
    goal: 'Read and arrange orthographic views, and tell first-angle from third-angle projection.',
    intuition: 'A drawing flattens a 3D part into views that each look straight at one side. The rule that decides where each view goes is the projection method. Get it wrong and the shop machines a mirror image of your part.',
    analogy: 'Looking at a house from the front, from above and from the side, then laying the photos out so each one sits next to the side it shows (third angle) or opposite it (first angle).',
    model: [
      'Orthographic views look straight along one axis: front, top, right side. Edges show where the surface depth changes.',
      'Third-angle projection: the top view goes above the front view and the right-side view to its right.',
      'First-angle projection: the top view goes below the front view and the right-side view to its left.',
      'The projection symbol (a truncated cone shown in two views) in the title block says which method the drawing uses. North American drawings normally use third angle; many European and Asian drawings use first angle.',
      'Section and detail views show what outside views can’t; hidden lines (dashed) show edges behind surfaces.',
      'The drawing, with its dimensions, tolerances and notes, is what the part is inspected against.',
    ],
    labs: [{ kind: 'views', intro: 'A bracket with a notch. Switch the projection method and watch the top and side views swap places. The views are projected from the 3D voxel model.' }],
    mistakes: [
      { id: 'dr-angle', title: 'Reading a first-angle drawing as third angle', wrong: 'Assuming the view below the front view is the bottom view.', right: 'Check the projection symbol before reading any view.', why: 'In first angle, the view below the front view is the top view. Misreading it swaps features top to bottom: a notch machined on the wrong side.' },
    ],
    tasks: [],
    checks: [
      { id: 'dr-c1', q: 'In third-angle projection, where does the right-side view go?', options: ['Left of the front view', 'Right of the front view', 'Above the front view', 'Below the front view'], answer: 1, why: 'Third angle puts each view next to the side of the front view it looks at.' },
      { id: 'dr-c2', q: 'In first-angle projection, where does the top view go?', options: ['Above the front view', 'Below the front view', 'Left of the front view', 'It isn’t shown'], answer: 1, why: 'First angle places views on the opposite side: the top view below the front view.' },
    ],
    interview: [{ q: 'What tells you a drawing is first or third angle?', a: 'The projection symbol in the title block, a truncated cone drawn in two views. Check it before reading the views, especially with suppliers in other regions.' }],
    onTheJob: 'Manufacturing engineers read drawings from customers and suppliers worldwide. Checking projection, units and revision before quoting or inspecting a part prevents expensive scrap.',
    cites: [],
    unsourced: 'Projection rules and regional conventions are general drafting knowledge (ASME Y14.3, ISO 128); the standards themselves haven’t been checked here.',
  },
  {
    id: 'analysis', concept: 'automation.fea', title: 'Simulation sanity checks: hand calculations and factor of safety', level: 'Applied', minutes: 20,
    goal: 'Estimate stress and deflection by hand before trusting an FEA plot, and size a part for a factor of safety.',
    intuition: 'Simulation software always gives you a colourful answer, even when the loads, fixtures or mesh are wrong. A two-line hand calculation for the same part tells you what order of magnitude to expect. If FEA and the hand calculation disagree by a factor of ten, the model is wrong, not the physics.',
    analogy: 'Estimating a restaurant bill in your head before checking the receipt: you don’t need the exact number to notice a missing decimal point.',
    model: [
      'A cantilever with an end load F: bending moment at the wall M = F·L; for a rectangle b × h, I = b·h³/12.',
      'Maximum bending stress σ = M·(h/2)/I = 6·F·L/(b·h²); tip deflection δ = F·L³/(3·E·I).',
      'Factor of safety = yield strength ÷ maximum stress. Required values depend on the application, the load certainty and the applicable codes.',
      'Depth matters most: doubling h cuts stress by 4 and deflection by 8. Doubling the width only halves both.',
      'In FEA, check units, loads, fixtures and materials, then refine the mesh until the answer stops changing. Stress at sharp corners and point loads keeps growing with refinement: a singularity, not a real number.',
      'Material values here (steel E = 200 GPa, yield 250 MPa; aluminium 6061-T6 E = 69 GPa, yield 276 MPa) are typical figures. Use your material’s certified data for real work.',
    ],
    labs: [{ kind: 'beam', intro: 'A rectangular cantilever with an end load. Change the section and material and watch stress, deflection and factor of safety respond.' }],
    mistakes: [
      { id: 'an-units', title: 'Mixed units', wrong: 'Load in newtons, lengths in metres, E in MPa.', right: 'Use one consistent set: N, mm and MPa (N/mm²) go together.', why: 'Mixing metres and millimetres changes the stress by factors of a thousand or more, and the plot still looks plausible.' },
      { id: 'an-peak', title: 'Designing to a singularity', wrong: 'Reporting the peak stress at a sharp internal corner of the mesh.', right: 'Model the real fillet, or read stress away from the singularity, and compare with a hand calculation.', why: 'A perfectly sharp corner has theoretically infinite stress; the plotted value is set by the mesh size, not the part.' },
    ],
    tasks: [
      { id: 'an-t1', task: 'Steel cantilever (E = 200 GPa, yield 250 MPa), L = 300 mm, b = 20 mm, end load 1,000 N. What is the smallest whole-millimetre depth h that gives a factor of safety of at least 3 and a tip deflection of at most 1 mm?', hint: 'Try depths in the lab, or solve 6FL/(bh²) ≤ 250/3 and FL³/(3EI) ≤ 1 for h. Here stress is the tighter limit.', goal: { kind: 'beam', answer: 33 }, model: 'h = 33 mm: σ ≈ 82.6 MPa (factor of safety ≈ 3.03) and δ ≈ 0.75 mm. Stress needs h ≥ 32.9 mm; deflection only needs h ≥ 30 mm.' },
    ],
    checks: [
      { id: 'an-c1', q: 'You double the depth h of a rectangular cantilever. What happens to the maximum bending stress?', options: ['Halves', 'Quarters', 'Divided by 8', 'Unchanged'], answer: 1, why: 'σ = 6FL/(bh²): h appears squared.' },
      { id: 'an-c2', q: 'FEA reports 1,200 MPa in a steel bracket; your hand calculation says about 40 MPa. First step?', options: ['Order a stronger steel', 'Check units, loads, fixtures and whether the peak is at a sharp corner', 'Refine the mesh until the number rises further', 'Trust the FEA: it is more accurate'], answer: 1, why: 'A 30× disagreement means a modelling error or a singularity, not a material problem.' },
    ],
    interview: [{ q: 'How do you know an FEA result is right?', a: 'Compare with a hand calculation or a known case, check reactions against the applied loads, check units and material data, refine the mesh until results converge, and ignore stress singularities at sharp corners or point loads.' }],
    onTheJob: 'An IE designing a fixture or a lifting frame rarely needs a full FEA study, but always needs to show the part won’t bend or break. A hand calculation with a clear factor of safety is often the right first answer.',
    cites: [],
    unsourced: 'Beam formulas are standard Euler–Bernoulli results (recomputed by the tests); the material figures are typical values and should be checked against certified data.',
  },
  {
    id: 'dfx', concept: 'automation.dfa', title: 'DFM and DFA: designing for the shop floor', level: 'Applied', minutes: 20,
    goal: 'Find the parts a design could lose, and spot features that are hard to make, before tooling is ordered.',
    intuition: 'Every part in a product has to be designed, bought, stored, handled, inspected and assembled. A classic design-for-assembly test asks three questions of each part. If the answer to all three is no, the part could in principle be combined with another or eliminated. That gives a theoretical minimum part count to aim at.',
    analogy: 'Flat-pack furniture that snaps together, versus one that needs 40 screws of four different sizes.',
    model: [
      'For each part ask: does it move relative to the parts already assembled? Must it be a different material? Must it be separate for assembly or service? Any yes: it is a candidate to keep. All no: a candidate to eliminate or combine.',
      'Fasteners almost never pass: they exist to join other parts. Snap fits, molded bosses and fewer, standard fasteners are the usual answers.',
      'DFA also means: parts that locate themselves, top-down assembly, symmetric parts (or obviously asymmetric ones, so they can only go one way: poka-yoke).',
      'DFM: design for the chosen process. Uniform walls and draft for molding, standard hole sizes and reachable features for machining, generous bend radii for sheet metal, and tolerances only as tight as the function needs.',
      'The theoretical minimum is a target for discussion, not an order: cost, service and suppliers can justify keeping a part.',
    ],
    labs: [{ kind: 'partcount', intro: 'A sensor housing with 12 parts. Answer the three questions for each part, then check your theoretical minimum against the reasoning.' }],
    mistakes: [
      { id: 'dx-fast', title: 'Optimising the screws, not the design', wrong: 'Switching to cheaper screws to cut cost.', right: 'Ask whether the joint needs screws at all: snap fits, a molded hinge, fewer standard fasteners.', why: 'Each fastener adds part cost, inventory, handling and assembly time; removing it usually beats buying it cheaper.' },
    ],
    tasks: [{ id: 'dx-t1', task: 'Classify every part in the sensor housing and find the theoretical minimum part count.', hint: 'Only five parts pass at least one question.', goal: { kind: 'partcount' }, model: 'Base, cover, gasket, circuit board and light pipe: 5 of 12.' }],
    checks: [
      { id: 'dx-c1', q: 'Which part almost never passes the three DFA questions?', options: ['A gasket', 'A screw', 'A circuit board', 'A rotating shaft'], answer: 1, why: 'It doesn’t move, isn’t a necessarily different material and exists only to join other parts.' },
      { id: 'dx-c2', q: 'Why involve manufacturing engineers before tooling is ordered?', options: ['To approve the colour', 'Changes are cheap on the drawing and expensive once a mold or die exists', 'They sign the purchase order', 'It is a legal requirement'], answer: 1, why: 'Design changes cost the least while the design is still on screen.' },
    ],
    interview: [{ q: 'How would you reduce assembly cost of a product?', a: 'Run a DFA review: for each part ask the three questions (relative motion, different material, separate for assembly or service), target the theoretical minimum, replace fasteners with snap fits where service allows, make parts self-locating and one-way, then estimate the savings in parts, inventory and assembly time.' }],
    onTheJob: 'DFM/DFA reviews are where industrial and manufacturing engineers change a product the most, usually at the lowest cost. Bring the assembly line’s data: which steps take longest, which parts cause rework.',
    cites: [],
    unsourced: 'The three-question minimum-part test is the classic Boothroyd–Dewhurst DFA method; the original texts haven’t been checked here.',
  },
]

export const CAD_LESSON_MAP: Record<string, CadLesson> = Object.fromEntries(CAD_LESSONS.map((l) => [l.id, l]))
