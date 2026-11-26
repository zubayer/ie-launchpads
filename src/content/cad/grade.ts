// Graders for CAD studio tasks. Each one recomputes the answer with the kernels in src/lib/cad.ts.
import { analyzeMates, analyzeSketch, cantilever, evalEquations, rebuild, type Equation } from '../../lib/cad'
import { FEATURES, MATE_FEATURES, MATE_MAP, PARTS, SKETCH_MAP, type CadGoal, type PartCount } from './course'

export interface Verdict { ok: boolean; msg: string }
const NAMES: Record<string, string> = { under: 'under defined', fully: 'fully defined', over: 'over defined' }

export function sketchState(preset: string, picked: string[]) {
  const p = SKETCH_MAP[preset]
  const cons = [...p.given.map((g) => g.value), ...p.options.filter((o) => picked.includes(o.id)).map((o) => o.value)]
  return analyzeSketch(p.sketch, cons)
}
export function mateState(picked: string[]) {
  return analyzeMates(picked.map((id) => MATE_MAP[id].value), MATE_FEATURES.moving, MATE_FEATURES.fixed)
}
export const featureOrder = (ids: string[]) => ids.map((id) => FEATURES.find((f) => f.id === id)!)
/** Smallest whole-millimetre depth meeting a factor of safety and a deflection limit. */
export function smallestDepth(F: number, L: number, b: number, E: number, Sy: number, fos: number, maxDelta: number): number {
  for (let h = 1; h <= 500; h++) { const r = cantilever({ F, L, b, h, E, Sy }); if (r.fos >= fos && r.delta <= maxDelta) return h }
  return NaN
}
export const keepPart = (p: PartCount) => !!p.base || p.moves || p.material || p.separate
export const theoreticalMinimum = (parts: PartCount[] = PARTS) => parts.filter(keepPart).reduce((a, p) => a + p.qty, 0)

export function grade(goal: CadGoal, answer: { picked?: string[]; eqs?: Equation[]; order?: string[]; h?: number; keep?: Record<string, boolean> }): Verdict {
  switch (goal.kind) {
    case 'sketch': {
      const picked = answer.picked ?? []
      const a = sketchState(goal.preset, picked)
      if (a.status !== 'fully') return { ok: false, msg: a.status === 'over' ? `Over defined: ${a.redundant} redundant equation${a.redundant > 1 ? 's' : ''}. Remove the relation or dimension that repeats another.` : `Still ${a.dof} degree${a.dof > 1 ? 's' : ''} of freedom: the blue entities can move.` }
      if (goal.maxOptions && picked.length > goal.maxOptions) return { ok: false, msg: `Fully defined, but with ${picked.length} items; this task asks for ${goal.maxOptions}.` }
      return { ok: true, msg: 'Fully defined: no freedoms left and nothing redundant.' }
    }
    case 'mates': {
      const picked = answer.picked ?? []
      if (goal.noLock && picked.includes('lock')) return { ok: false, msg: 'This task asks you to locate the block with real features, not a Lock mate.' }
      const a = mateState(picked)
      if (a.dof !== goal.dof) return { ok: false, msg: `${a.dof} degree${a.dof === 1 ? '' : 's'} of freedom left; the task needs ${goal.dof}.` }
      if (goal.rotations !== undefined && a.rotations !== goal.rotations) return { ok: false, msg: `The freedom left is ${a.rotations ? 'a rotation' : 'a translation'}, not what the task asks for.` }
      if (goal.translations !== undefined && a.translations !== goal.translations) return { ok: false, msg: `The freedom left is ${a.translations ? 'a translation' : 'a rotation'}, not what the task asks for.` }
      if (goal.maxRedundant !== undefined && a.redundant > goal.maxRedundant) return { ok: false, msg: `Fixed, but with ${a.redundant} redundant equations; the task allows ${goal.maxRedundant}.` }
      return { ok: true, msg: `${a.dof} degree${a.dof === 1 ? '' : 's'} of freedom left${a.redundant ? `, ${a.redundant} redundant equation${a.redundant > 1 ? 's' : ''}` : ''}.` }
    }
    case 'equations': {
      for (const w of goal.widths) {
        const r = evalEquations(answer.eqs ?? [], { Width: w })
        const bad = Object.entries(r.errors)[0]
        if (bad) return { ok: false, msg: `${bad[0]}: ${bad[1]}.` }
        for (const [name, f] of Object.entries(goal.want)) {
          const got = r.values[name]
          if (got === undefined) return { ok: false, msg: `Define an equation for “${name}”.` }
          if (Math.abs(got - f(w)) > 1e-6) return { ok: false, msg: `With Width = ${w}, ${name} is ${+got.toFixed(3)} but should be ${+f(w).toFixed(3)}.` }
        }
      }
      return { ok: true, msg: `Correct for widths ${goal.widths.join(', ')}.` }
    }
    case 'features': {
      const errs = rebuild(featureOrder(answer.order ?? []))
      const first = Object.entries(errs)[0]
      return first ? { ok: false, msg: `${first[0]} ${first[1]}.` } : { ok: true, msg: 'Every feature rebuilds.' }
    }
    case 'beam':
      return answer.h === goal.answer ? { ok: true, msg: `h = ${goal.answer} mm is the smallest depth that meets both limits.` } : { ok: false, msg: answer.h && answer.h > goal.answer ? 'That works, but a smaller depth also does.' : 'That depth fails one of the limits. Check both the factor of safety and the deflection.' }
    case 'partcount': {
      const keep = answer.keep ?? {}
      const wrong = PARTS.filter((p) => !!keep[p.id] !== keepPart(p))
      return wrong.length ? { ok: false, msg: `Look again at: ${wrong.map((p) => p.part.toLowerCase()).join(', ')}.` } : { ok: true, msg: `Theoretical minimum: ${theoreticalMinimum()} of ${PARTS.reduce((a, p) => a + p.qty, 0)} parts.` }
    }
  }
}
