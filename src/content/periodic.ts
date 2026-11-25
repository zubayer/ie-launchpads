import type { Concept } from '../types'
import { CONCEPT_MAP } from './index'

// The Periodic Table of Industrial Engineering: 107 core methods as "elements" in 10 families.
// Inside a family, elements run from Foundation (level 1) to Advanced (level 4), like periods.

export interface Family { id: FamilyId; name: string; long: string; light: string; dark: string }
export type FamilyId = 'measure' | 'quality' | 'lean' | 'optimize' | 'make' | 'protect' | 'flow' | 'decide' | 'people' | 'data'

// `light` is the text colour on the light theme (≥4.5:1 on a tinted tile), `dark` the one on the dark theme.
export const FAMILIES: Family[] = [
  { id: 'measure', name: 'Measure', long: 'Statistics & design of experiments', light: '#1d4ed8', dark: '#60a5fa' },
  { id: 'quality', name: 'Quality', long: 'Quality control & Six Sigma', light: '#be123c', dark: '#fb7185' },
  { id: 'lean', name: 'Lean', long: 'Lean & flow', light: '#8a5a00', dark: '#facc15' },
  { id: 'optimize', name: 'Optimize', long: 'Operations research & simulation', light: '#0f766e', dark: '#2dd4bf' },
  { id: 'make', name: 'Make', long: 'Manufacturing, automation & semiconductors', light: '#475569', dark: '#a9b6c8' },
  { id: 'protect', name: 'Protect', long: 'Safety, reliability & systems', light: '#c2410c', dark: '#fb923c' },
  { id: 'flow', name: 'Flow', long: 'Inventory, supply chain & facilities', light: '#15803d', dark: '#4ade80' },
  { id: 'decide', name: 'Decide', long: 'Engineering economics & projects', light: '#7e22ce', dark: '#c084fc' },
  { id: 'people', name: 'People', long: 'Work measurement & ergonomics', light: '#a21caf', dark: '#f0abfc' },
  { id: 'data', name: 'Data', long: 'Data science & machine learning', light: '#4d7c0f', dark: '#a3e635' },
]

/** [concept id, symbol] per family. Symbols are unique across the table. */
const RAW: Record<FamilyId, [string, string][]> = {
  measure: [["stats.std-dev", "Sd"], ["stats.normal", "Nd"], ["stats.clt", "Cl"], ["stats.hypothesis-test", "Ht"], ["stats.p-value", "Pv"], ["stats.regression", "Lr"], ["doe.full-factorial", "Ff"], ["doe.fractional-factorial", "Fr"], ["doe.rsm", "Rs"], ["doe.taguchi", "Tg"]],
  quality: [["quality.control-chart", "Cc"], ["quality.dmaic", "Dm"], ["quality.six-sigma", "Ss"], ["quality.pareto", "Pa"], ["quality.fishbone", "Fb"], ["quality.sipoc", "Si"], ["quality.cp", "Cp"], ["quality.cpk", "Ck"], ["quality.gage-rr", "Gr"], ["quality.aql", "Aq"]],
  lean: [["lean.eight-wastes", "Wa"], ["lean.takt-time", "Tk"], ["lean.five-s", "5s"], ["lean.poka-yoke", "Pk"], ["lean.vsm", "Vs"], ["lean.kanban", "Kb"], ["lean.smed", "Sm"], ["lean.oee", "Oe"], ["lean.littles-law", "Ll"], ["lean.toc", "Tc"], ["lean.a3", "A3"], ["lean.heijunka", "Hj"]],
  optimize: [["or.lp", "Lp"], ["or.transportation", "Tp"], ["or.assignment", "As"], ["or.mm1", "Mq"], ["simulation.des", "De"], ["simulation.monte-carlo", "Mo"], ["or.simplex", "Sx"], ["or.ip", "Ip"], ["or.tsp", "Ts"], ["or.vrp", "Vr"], ["or.markov", "Mk"], ["simulation.digital-twin", "Dt"], ["or.branch-bound", "Bb"]],
  make: [["manufacturing.machining", "Mn"], ["automation.plc", "Pl"], ["automation.cnc", "Cn"], ["semiconductor.photolithography", "Ph"], ["semiconductor.etching", "Et"], ["manufacturing.mrp", "Mr"], ["manufacturing.mes", "Me"], ["manufacturing.gdt", "Gd"], ["manufacturing.ppap", "Pp"], ["automation.ladder-logic", "Ld"], ["semiconductor.cvd", "Cv"], ["semiconductor.yield", "Dy"], ["semiconductor.euv", "Eu"]],
  protect: [["safety.rca", "Rc"], ["reliability.mtbf", "Mb"], ["reliability.bathtub", "Bc"], ["systems.v-model", "Vm"], ["safety.fmea", "Fm"], ["safety.fta", "Ft"], ["safety.bowtie", "Bt"], ["safety.hazop", "Hz"], ["systems.mbse", "Ms"], ["safety.lopa", "Lo"], ["reliability.weibull", "Wb"], ["reliability.rcm", "Rm"], ["safety.stpa", "Sp"]],
  flow: [["scm.reorder-point", "Ro"], ["scm.abc", "Ab"], ["or.eoq", "Eq"], ["scm.safety-stock", "Sf"], ["scm.bullwhip", "Bw"], ["scm.sop", "So"], ["scm.cross-docking", "Cd"], ["facilities.slp", "Sl"], ["facilities.asrs", "Ar"], ["or.newsvendor", "Nv"]],
  decide: [["engecon.tvm", "Tv"], ["engecon.npv", "Np"], ["engecon.marr", "Ma"], ["engecon.payback", "Pb"], ["pm.wbs", "Ws"], ["engecon.irr", "Ir"], ["pm.cpm", "Cm"], ["pm.pert", "Pe"], ["engecon.macrs", "Mx"], ["pm.evm", "Ev"]],
  people: [["work.time-study", "Ty"], ["work.standard-time", "St"], ["work.learning-curve", "Lc"], ["ergo.niosh", "Ni"], ["ergo.rula-reba", "Ru"], ["work.pmts", "Pm"], ["ergo.fitts", "Fi"], ["ergo.hick", "Hk"]],
  data: [["datasci.confusion-matrix", "Cx"], ["datasci.overfitting", "Of"], ["datasci.sql", "Sq"], ["datasci.decision-tree", "Dc"], ["datasci.random-forest", "Rf"], ["datasci.kmeans", "Km"], ["datasci.gradient-boosting", "Gb"], ["datasci.pca", "Pc"]],
}

export interface Element { n: number; id: string; sym: string; family: FamilyId; c: Concept }

/** Elements numbered 1…107: family by family, Foundation first inside each family. */
export const ELEMENTS: Element[] = (() => {
  const out: Element[] = []
  for (const f of FAMILIES) {
    const list = RAW[f.id].map(([id, sym]) => ({ id, sym, c: CONCEPT_MAP[id] })).filter((e) => e.c)
    list.sort((a, b) => a.c.level - b.c.level)
    for (const e of list) out.push({ n: out.length + 1, id: e.id, sym: e.sym, family: f.id, c: e.c })
  }
  return out
})()

export const RAW_ELEMENT_IDS = Object.values(RAW).flat().map(([id]) => id)

/** What goes in and what comes out, written per element. Elements without an entry show their lesson's formula, worked answer and traps. */
export interface ElementIO { ins: string[]; out: string; example?: string; traps?: string[] }
export const ELEMENT_IO: Record<string, ElementIO> = {
  'lean.takt-time': { ins: ['Net available time per shift (breaks and meetings removed)', 'Customer demand per shift'], out: 'The pace every station must match, in seconds per unit', example: '27,000 s available ÷ 450 units = 60 s per unit.' },
  'quality.cpk': { ins: ['Spec limits USL and LSL', 'Mean μ and short-term σ from a stable process'], out: 'One capability number; 1.33 is a common minimum', example: 'USL 10.6, LSL 9.4, μ 10.1, σ 0.1 → min(1.67, 2.33) = 1.67.' },
  'safety.fmea': { ins: ['Process steps or design functions', 'Failure modes, effects, causes and current controls'], out: 'A ranked list of risks with owners, actions and re-ratings', example: 'Under-formed crimp → fluid leak, Severity 10: high priority even when occurrence is low.' },
  'or.eoq': { ins: ['Annual demand D', 'Cost per order S and holding cost H per unit-year'], out: 'The order size that balances ordering cost against holding cost', example: 'D 12,000, S $50, H $3 → √400,000 ≈ 632 units per order.', traps: ['Applying it to lumpy demand without safety stock', 'Understating holding cost (space, capital, obsolescence)'] },
  'engecon.npv': { ins: ['Cash flows by year, year 0 included', 'Required rate of return (MARR) i'], out: 'The project’s value today; accept if NPV > 0', example: '−$20,000 now, +$7,000 a year for 5 years at 10% → −20,000 + 7,000 × 3.7908 ≈ $6,536.' },
  'lean.oee': { ins: ['Planned time and downtime', 'Ideal cycle time, total count and good count'], out: 'The share of planned time spent making good parts at full speed', example: '0.90 × 0.95 × 0.99 ≈ 84.6% OEE.' },
}
