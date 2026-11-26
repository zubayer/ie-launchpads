// Equation Explorer experiments (EDU-04). Each one links to its canonical lesson, so the formula library
// and the lesson stay the single source of the concept; this file adds what an experiment needs:
// symbols with units and limits, a pure compute function, validity rules, spreadsheet and Python
// equivalents, and reference cases that are checked by src/lib/equations.test.ts.
import { Phi, PhiInv, mmc } from '../lib/math'

export type Vals = Record<string, number>
/** sign: the physically valid domain. Default 'positive'; counts and amounts that can be zero are 'nonneg'; signed values (temperatures, spec limits) are 'any'. */
export interface EqInput { key: string; tex: string; name: string; unit: string; min: number; max: number; step: number; value: number; py: string; integer?: boolean; sign?: 'positive' | 'nonneg' | 'any' }
export interface EqOutput { tex: string; name: string; unit: string; digits: number; scale?: number }
export interface EqExtra extends EqOutput { f: (v: Vals) => number }
/** An independent reference: a hand-worked or published case, not a re-run of compute(). */
export interface Fixture { inputs: Vals; expect: number; tol: number; source: string }
export interface Equation {
  id: string
  concept: string // canonical lesson id
  related?: string[]
  title: string
  blurb: string
  tex: string
  inputs: EqInput[]
  output: EqOutput
  compute: (v: Vals) => number
  /** Inputs for which the formula is undefined or meaningless: the message explains why. */
  invalid?: (v: Vals) => string | null
  /** Valid but worth a caution (e.g. extrapolating outside a calibrated span). */
  warn?: (v: Vals) => string | null
  extras?: EqExtra[]
  dims: string
  assumptions: string[]
  traps: string[]
  excel: string // formula with {key} placeholders for the input cells
  python: string // final line(s), using the inputs' py names
  fixtures: Fixture[]
  sweep: string // input plotted on the x axis by default
  predict?: string // input to double (or halve) in the predict-first question
  insight?: string // shown after the prediction is revealed, when the answer surprises
  explain: (v: Vals, y: number) => string
}

const pctOut = (name: string, tex: string, digits = 1): EqOutput => ({ name, tex, unit: '%', digits, scale: 100 })
const pv = (i: number, n: number) => (i === 0 ? n : (1 - (1 + i) ** -n) / i) // (P/A, i, n)
const npvAt = (P: number, A: number, n: number, i: number, S = 0) => -P + A * pv(i, n) + S * (1 + i) ** -n
const npvSlope = (A: number, n: number, i: number) => { let d = 0; for (let t = 1; t <= n; t++) d -= t * A * (1 + i) ** -(t + 1); return d }

/** Newton–Raphson on NPV(i) = 0 for a uniform series: returns the estimate after k steps (NaN if it fails). */
export function newtonIrr(P: number, A: number, n: number, guess: number, k: number) {
  let i = guess
  for (let s = 0; s < k; s++) {
    const d = npvSlope(A, n, i)
    if (!Number.isFinite(d) || Math.abs(d) < 1e-12) return NaN
    i -= npvAt(P, A, n, i) / d
    if (!(i > -1)) return NaN
  }
  return i
}

export const EQUATIONS: Equation[] = [
  {
    id: 'takt', concept: 'lean.takt-time', related: ['lean.cycle-time', 'lean.line-balancing'],
    title: 'Takt time', blurb: 'The pace customer demand sets for the line.',
    tex: 'T_{takt}=\\dfrac{\\text{available time}}{\\text{demand}}',
    inputs: [
      { key: 'A', tex: 'A', name: 'Available production time', unit: 'min per day', min: 30, max: 1440, step: 5, value: 900, py: 'available_min' },
      { key: 'D', tex: 'D', name: 'Customer demand', unit: 'units per day', min: 1, max: 5000, step: 1, value: 900, py: 'demand', integer: true },
    ],
    output: { tex: 'T_{takt}', name: 'Takt time', unit: 's per unit', digits: 1 },
    compute: ({ A, D }) => (A * 60) / D,
    extras: [{ tex: 'T_{takt}', name: 'Takt time', unit: 'min per unit', digits: 2, f: ({ A, D }) => A / D }],
    dims: '(min per day × 60 s per min) ÷ (units per day) = s per unit',
    assumptions: ['Available time already excludes planned breaks and meetings', 'Demand is averaged over the planning period; recalculate when demand changes'],
    traps: ['Using the full shift instead of available time', 'Treating takt as a speed to beat: it is a pace to match', 'Comparing takt in minutes with cycle time in seconds'],
    excel: '={A}*60/{D}', python: 'takt_s = available_min * 60 / demand',
    fixtures: [
      { inputs: { A: 900, D: 900 }, expect: 60, tol: 1e-9, source: 'Lesson example: two 8-hour shifts less 30 min of breaks each, 900 units a day' },
      { inputs: { A: 480, D: 240 }, expect: 120, tol: 1e-9, source: 'Lean Enterprise Institute lexicon: 480 min ÷ 240 units = 2 min' },
    ],
    sweep: 'D', predict: 'D',
    explain: (_, y) => `Every station must finish its work in ${y.toFixed(1)} s or less, on average, to keep up with demand.`,
  },
  {
    id: 'littles-law', concept: 'lean.littles-law', related: ['lean.lead-time', 'lean.wip'],
    title: 'Little’s Law', blurb: 'Work in process, throughput and lead time are tied together.',
    tex: 'W=\\dfrac{L}{\\lambda}',
    inputs: [
      { key: 'L', tex: 'L', name: 'Average work in process', unit: 'units', min: 0, max: 5000, step: 10, value: 240, sign: 'nonneg', py: 'wip' },
      { key: 'lam', tex: '\\lambda', name: 'Throughput', unit: 'units per day', min: 1, max: 1000, step: 1, value: 60, py: 'throughput' },
    ],
    output: { tex: 'W', name: 'Average lead time', unit: 'days', digits: 2 },
    compute: ({ L, lam }) => L / lam,
    dims: 'units ÷ (units per day) = days',
    assumptions: ['Long-run averages over a stable period: the system is not filling up or draining', 'WIP, throughput and lead time are measured over the same boundary and in the same units'],
    traps: ['Mixing pieces and batches', 'Applying it to one week while the system is ramping up', 'Expecting lead time to fall when WIP is cut below what keeps the bottleneck busy (throughput falls too)'],
    excel: '={L}/{lam}', python: 'lead_time_days = wip / throughput',
    fixtures: [
      { inputs: { L: 240, lam: 60 }, expect: 4, tol: 1e-9, source: 'Lead-time lesson example: 240 jobs in WIP, 60 finished per day' },
      { inputs: { L: 1200, lam: 300 }, expect: 4, tol: 1e-9, source: 'Little’s Law lesson picture: WIP 1,200 at 300 a day' },
    ],
    sweep: 'L', predict: 'L',
    explain: (v, y) => `With ${v.L} units in process and ${v.lam} finishing a day, a unit spends ${y.toFixed(2)} days in the system on average.`,
  },
  {
    id: 'oee', concept: 'lean.oee', related: ['lean.toc', 'lean.smed'],
    title: 'OEE from shift data', blurb: 'How much of planned time made good parts at full speed.',
    tex: '\\text{OEE}=A\\times P\\times Q=\\dfrac{\\text{run time}}{\\text{planned time}}\\times\\dfrac{t_{ideal}\\,N}{\\text{run time}}\\times\\dfrac{N-R}{N}',
    inputs: [
      { key: 'plan', tex: 'T_{plan}', name: 'Planned production time', unit: 'min', min: 1, max: 1440, step: 1, value: 420, py: 'planned_min' },
      { key: 'down', tex: 'T_{down}', name: 'Unplanned downtime', unit: 'min', min: 0, max: 1440, step: 1, value: 47, sign: 'nonneg', py: 'downtime_min' },
      { key: 'ideal', tex: 't_{ideal}', name: 'Ideal cycle time', unit: 's per part', min: 0.1, max: 120, step: 0.1, value: 1, py: 'ideal_cycle_s' },
      { key: 'N', tex: 'N', name: 'Parts made', unit: 'parts', min: 0, max: 50000, step: 1, value: 19271, sign: 'nonneg', py: 'parts_made', integer: true },
      { key: 'R', tex: 'R', name: 'Rejected parts', unit: 'parts', min: 0, max: 20000, step: 1, value: 423, sign: 'nonneg', py: 'rejects', integer: true },
    ],
    output: pctOut('OEE', '\\text{OEE}'),
    compute: ({ plan, down, ideal, N, R }) => { const run = plan - down; return (run / plan) * ((ideal * N) / 60 / run) * ((N - R) / N) },
    invalid: ({ plan, down, ideal, N, R }) =>
      down >= plan ? 'Downtime must be less than planned time.' : N <= 0 ? 'Enter the number of parts made.' : R > N ? 'Rejects can’t exceed parts made.'
      : (ideal * N) / 60 > plan - down + 1e-9 ? 'Performance comes out above 100%: those parts could not have been made in the run time at that ideal cycle time. Use the true design rate.' : null,
    extras: [
      { ...pctOut('Availability', 'A'), f: ({ plan, down }) => (plan - down) / plan },
      { ...pctOut('Performance', 'P'), f: ({ plan, down, ideal, N }) => (ideal * N) / 60 / (plan - down) },
      { ...pctOut('Quality', 'Q'), f: ({ N, R }) => (N - R) / N },
    ],
    dims: 'Each factor is a ratio of like units (min ÷ min, parts ÷ parts), so OEE has no unit',
    assumptions: ['Planned time excludes planned stops by definition; another definition gives another OEE', 'The ideal cycle time is the true design rate, not a padded standard'],
    traps: ['Comparing OEE across plants that define planned time differently', 'A slow “ideal” cycle that inflates performance', 'Counting reworked parts as good first time'],
    excel: '=(({plan}-{down})/{plan})*(({ideal}*{N}/60)/({plan}-{down}))*(({N}-{R})/{N})',
    python: 'run = planned_min - downtime_min\noee = (run / planned_min) * (ideal_cycle_s * parts_made / 60 / run) * ((parts_made - rejects) / parts_made)',
    fixtures: [{ inputs: { plan: 420, down: 47, ideal: 1, N: 19271, R: 423 }, expect: 0.748, tol: 0.001, source: 'OEE lesson example (hand-worked: 88.8% × 86.1% × 97.8%)' }],
    sweep: 'R', predict: 'down',
    insight: 'With the same number of parts made, extra downtime only moves loss from performance to availability: OEE = good parts × ideal cycle time ÷ planned time. On a real line more downtime means fewer parts, and that is what lowers OEE.',
    explain: (v, y) => `${(y * 100).toFixed(1)}% of planned time made good parts at full speed. The other ${(100 - y * 100).toFixed(1)}% is the size of the prize.`,
  },
  {
    id: 'cpk', concept: 'quality.cpk', related: ['quality.cp', 'quality.control-chart'],
    title: 'Process capability Cpk', blurb: 'How far the nearer spec limit is from the mean, in units of 3σ.',
    tex: 'C_{pk}=\\min\\!\\left(\\dfrac{USL-\\mu}{3\\sigma},\\ \\dfrac{\\mu-LSL}{3\\sigma}\\right)',
    inputs: [
      { key: 'USL', tex: 'USL', name: 'Upper spec limit', unit: 'mm', min: 9.95, max: 10.2, step: 0.005, value: 10.06, sign: 'any', py: 'usl' },
      { key: 'LSL', tex: 'LSL', name: 'Lower spec limit', unit: 'mm', min: 9.8, max: 10.05, step: 0.005, value: 9.94, sign: 'any', py: 'lsl' },
      { key: 'mu', tex: '\\mu', name: 'Process mean', unit: 'mm', min: 9.85, max: 10.15, step: 0.001, value: 10.02, sign: 'any', py: 'mean' },
      { key: 'sigma', tex: '\\sigma', name: 'Within-process standard deviation', unit: 'mm', min: 0.002, max: 0.08, step: 0.001, value: 0.015, py: 'sigma' },
    ],
    output: { tex: 'C_{pk}', name: 'Cpk', unit: '', digits: 3 },
    compute: ({ USL, LSL, mu, sigma }) => Math.min(USL - mu, mu - LSL) / (3 * sigma),
    invalid: ({ USL, LSL, sigma }) => (USL <= LSL ? 'The upper limit must be above the lower limit.' : sigma <= 0 ? 'σ must be positive.' : null),
    warn: ({ USL, LSL, mu }) => (mu > USL || mu < LSL ? 'The mean is outside the specification, so Cpk is negative: most parts are out of spec.' : null),
    extras: [
      { tex: 'C_p', name: 'Cp (potential if centred)', unit: '', digits: 3, f: ({ USL, LSL, sigma }) => (USL - LSL) / (6 * sigma) },
      { tex: '\\text{PPM}', name: 'Out of spec if normal and stable', unit: 'parts per million', digits: 0, f: ({ USL, LSL, mu, sigma }) => (1 - Phi((USL - mu) / sigma) + Phi((LSL - mu) / sigma)) * 1e6 },
    ],
    dims: 'mm ÷ mm: Cpk has no unit',
    assumptions: ['The process is stable (in statistical control); check a control chart first', 'σ is the within-subgroup (short-term) estimate; overall σ gives Ppk instead', 'The PPM figure assumes a normal distribution; real tails differ, so treat it as illustrative'],
    traps: ['Reporting Cpk for an unstable process', 'Reading Cpk alone as a defect rate', 'Using 1.33 as a universal rule: required values come from the customer or industry standard'],
    excel: '=MIN({USL}-{mu},{mu}-{LSL})/(3*{sigma})', python: 'cpk = min(usl - mean, mean - lsl) / (3 * sigma)',
    fixtures: [{ inputs: { USL: 10.06, LSL: 9.94, mu: 10.02, sigma: 0.015 }, expect: 0.8889, tol: 0.0001, source: 'Cpk lesson example: 0.04 / 0.045' }],
    sweep: 'mu', predict: 'sigma',
    explain: (_, y) => y >= 1.33 ? `Cpk ${y.toFixed(2)}: the nearer limit is ${(3 * y).toFixed(1)}σ from the mean.` : `Cpk ${y.toFixed(2)}: the nearer limit is only ${(3 * y).toFixed(1)}σ from the mean. Re-centre first if Cp is much higher, then cut the spread.`,
  },
  {
    id: 'eoq', concept: 'or.eoq', related: ['scm.reorder-point', 'scm.safety-stock'],
    title: 'Economic order quantity', blurb: 'The order size that balances ordering cost against holding cost.',
    tex: 'Q^*=\\sqrt{\\dfrac{2DS}{H}}',
    inputs: [
      { key: 'D', tex: 'D', name: 'Annual demand', unit: 'units per year', min: 100, max: 100000, step: 100, value: 12000, py: 'demand' },
      { key: 'S', tex: 'S', name: 'Cost per order', unit: '$ per order', min: 1, max: 1000, step: 1, value: 75, py: 'order_cost' },
      { key: 'H', tex: 'H', name: 'Holding cost', unit: '$ per unit per year', min: 0.1, max: 50, step: 0.1, value: 2.5, py: 'holding_cost' },
    ],
    output: { tex: 'Q^*', name: 'Order quantity', unit: 'units', digits: 1 },
    compute: ({ D, S, H }) => Math.sqrt((2 * D * S) / H),
    extras: [
      { tex: 'TC', name: 'Annual ordering + holding cost at Q*', unit: '$ per year', digits: 0, f: ({ D, S, H }) => Math.sqrt(2 * D * S * H) },
      { tex: 'D/Q^*', name: 'Orders per year', unit: 'orders', digits: 1, f: ({ D, S, H }) => D / Math.sqrt((2 * D * S) / H) },
    ],
    dims: '√((units/yr × $/order) ÷ ($/unit/yr)) = √(units²) = units',
    assumptions: ['Demand is steady and known', 'The whole order arrives at once; no shortages', 'Unit price does not depend on order size (no quantity discounts)'],
    traps: ['Using the purchase price instead of the holding cost per unit-year', 'Mixing monthly demand with an annual holding cost', 'Expecting double the demand to double the order size'],
    excel: '=SQRT(2*{D}*{S}/{H})', python: 'from math import sqrt\neoq = sqrt(2 * demand * order_cost / holding_cost)',
    fixtures: [{ inputs: { D: 12000, S: 75, H: 2.5 }, expect: 848.53, tol: 0.01, source: 'EOQ lesson example: √720,000' }],
    sweep: 'D', predict: 'D',
    explain: (v, y) => `Order about ${Math.round(y)} units at a time, about ${(v.D / y).toFixed(1)} times a year. The cost curve is flat near the optimum, so a round number nearby costs little more.`,
  },
  {
    id: 'npv', concept: 'engecon.npv', related: ['engecon.irr', 'engecon.factors', 'engecon.marr'],
    title: 'Net present value (uniform savings)', blurb: 'Today’s value of a project: savings discounted at your MARR, minus the cost.',
    tex: 'NPV=-P+A\\,\\dfrac{1-(1+i)^{-n}}{i}+S\\,(1+i)^{-n}',
    inputs: [
      { key: 'P', tex: 'P', name: 'Initial cost', unit: '$', min: 0, max: 500000, step: 1000, value: 40000, sign: 'nonneg', py: 'cost' },
      { key: 'A', tex: 'A', name: 'Net saving per year', unit: '$ per year', min: 0, max: 100000, step: 500, value: 12000, sign: 'nonneg', py: 'annual_saving' },
      { key: 'n', tex: 'n', name: 'Life', unit: 'years', min: 1, max: 40, step: 1, value: 5, py: 'years', integer: true },
      { key: 'i', tex: 'i', name: 'Discount rate (MARR)', unit: '% per year', min: 0, max: 40, step: 0.5, value: 10, sign: 'nonneg', py: 'marr_pct' },
      { key: 'S', tex: 'S', name: 'Salvage value', unit: '$', min: 0, max: 200000, step: 1000, value: 0, sign: 'nonneg', py: 'salvage' },
    ],
    output: { tex: 'NPV', name: 'Net present value', unit: '$', digits: 0 },
    compute: ({ P, A, n, i, S }) => npvAt(P, A, n, i / 100, S),
    extras: [{ tex: '(P/A,i,n)', name: 'Annuity factor', unit: '', digits: 4, f: ({ n, i }) => pv(i / 100, n) }],
    dims: '$ + ($ per year × years) + $ = $ (the factor converts a yearly amount to today’s dollars)',
    assumptions: ['Savings arrive at the end of each year and are the same every year', 'The discount rate stays constant over the life', 'Taxes, inflation and depreciation are ignored here'],
    traps: ['Entering 10 instead of 0.10 for 10% in a spreadsheet NPV', 'Excel’s NPV() discounts the first cell too: add the year-0 cost outside it', 'Choosing between mutually exclusive projects by IRR instead of NPV'],
    excel: '=-{P}+PV({i}/100,{n},-{A})+{S}/(1+{i}/100)^{n}', python: 'import numpy_financial as npf\nflows = [-cost] + [annual_saving] * (years - 1) + [annual_saving + salvage]\nnpv = npf.npv(marr_pct / 100, flows)',
    fixtures: [
      { inputs: { P: 40000, A: 12000, n: 5, i: 10, S: 0 }, expect: 5489.44, tol: 0.05, source: 'NPV lesson example: (P/A, 10%, 5) = 3.7908 from interest tables' },
      { inputs: { P: 40000, A: 12000, n: 5, i: 0, S: 0 }, expect: 20000, tol: 1e-9, source: 'At 0% the NPV is the plain sum: −40,000 + 5 × 12,000' },
    ],
    sweep: 'i', predict: 'n',
    explain: (_, y) => (y >= 0 ? `NPV is +$${Math.round(y).toLocaleString()}: the project earns more than the MARR, so accept it on this measure.` : `NPV is −$${Math.round(-y).toLocaleString()}: the project earns less than the MARR.`),
  },
  {
    id: 'irr-newton', concept: 'engecon.irr', related: ['engecon.npv'],
    title: 'Newton–Raphson: how a spreadsheet finds IRR', blurb: 'IRR has no closed form; Newton’s method homes in on the rate where NPV is zero.',
    tex: 'i_{k+1}=i_k-\\dfrac{NPV(i_k)}{NPV\'(i_k)}',
    inputs: [
      { key: 'P', tex: 'P', name: 'Initial cost', unit: '$', min: 1000, max: 500000, step: 1000, value: 40000, py: 'cost' },
      { key: 'A', tex: 'A', name: 'Net saving per year', unit: '$ per year', min: 100, max: 100000, step: 500, value: 12000, py: 'annual_saving' },
      { key: 'n', tex: 'n', name: 'Life', unit: 'years', min: 1, max: 40, step: 1, value: 5, py: 'years', integer: true },
      { key: 'g', tex: 'i_0', name: 'Starting guess', unit: '% per year', min: 0, max: 60, step: 1, value: 10, sign: 'nonneg', py: 'guess_pct' },
      { key: 'k', tex: 'k', name: 'Newton steps', unit: 'steps', min: 0, max: 10, step: 1, value: 3, sign: 'nonneg', py: 'steps', integer: true },
    ],
    output: { tex: 'i_k', name: 'Estimate of IRR after k steps', unit: '% per year', digits: 4, scale: 100 },
    compute: ({ P, A, n, g, k }) => newtonIrr(P, A, n, g / 100, k),
    invalid: ({ P, A, n }) => (A * n <= P ? 'The savings never repay the cost, so there is no positive IRR to find.' : null),
    extras: [{ tex: 'NPV(i_k)', name: 'NPV at this estimate (0 means solved)', unit: '$', digits: 2, f: ({ P, A, n, g, k }) => npvAt(P, A, n, newtonIrr(P, A, n, g / 100, k)) }],
    dims: 'NPV in $ ÷ slope in $ per unit rate = a rate',
    assumptions: ['One sign change in the cash flows (cost first, then savings), so there is one IRR', 'A starting guess near the answer; a poor guess can overshoot'],
    traps: ['Stopping after one step: the estimate is not yet the IRR', 'Expecting a unique IRR when cash flows change sign more than once'],
    excel: '=RATE({n},{A},-{P},0,0,{g}/100)', python: 'import numpy_financial as npf\nirr = npf.irr([-cost] + [annual_saving] * years)',
    fixtures: [
      { inputs: { P: 40000, A: 12000, n: 5, g: 10, k: 1 }, expect: 0.14724, tol: 0.00005, source: 'Hand-worked first step: 0.10 + 5,489.44 / 116,210' },
      { inputs: { P: 40000, A: 12000, n: 5, g: 10, k: 8 }, expect: 0.15238, tol: 0.00005, source: 'Interest tables: (P/A, 15%, 5) = 3.3522 and (P/A, 16%, 5) = 3.2743 bracket 40,000 / 12,000 = 3.3333; interpolation gives ≈ 15.24%' },
    ],
    sweep: 'k',
    explain: (_, y) => `After these steps the estimate is ${(y * 100).toFixed(4)}% a year. Each Newton step roughly doubles the number of correct digits once it is close.`,
  },
  {
    id: 'mm1', concept: 'or.mm1', related: ['or.mmc', 'lean.littles-law'],
    title: 'Single-server queue (M/M/1)', blurb: 'Why waits explode as a server gets close to 100% busy.',
    tex: 'W_q=\\dfrac{\\lambda}{\\mu(\\mu-\\lambda)},\\qquad \\rho=\\dfrac{\\lambda}{\\mu}',
    inputs: [
      { key: 'lam', tex: '\\lambda', name: 'Arrival rate', unit: 'jobs per hour', min: 0.1, max: 30, step: 0.1, value: 4, py: 'arrivals_per_h' },
      { key: 'mu', tex: '\\mu', name: 'Service rate', unit: 'jobs per hour', min: 0.5, max: 30, step: 0.1, value: 10, py: 'service_per_h' },
    ],
    output: { tex: 'W_q', name: 'Average wait in queue', unit: 'min', digits: 1 },
    compute: ({ lam, mu }) => (lam / (mu * (mu - lam))) * 60,
    invalid: ({ lam, mu }) => (lam >= mu ? 'Unstable: jobs arrive at least as fast as they are served, so the queue grows without limit.' : null),
    extras: [
      { ...pctOut('Utilisation', '\\rho'), f: ({ lam, mu }) => lam / mu },
      { tex: 'L', name: 'Average number in the system', unit: 'jobs', digits: 2, f: ({ lam, mu }) => lam / (mu - lam) },
    ],
    dims: '(jobs/h) ÷ ((jobs/h) × (jobs/h)) = h; × 60 = min',
    assumptions: ['Random (Poisson) arrivals and exponential service times', 'One server, first come first served, unlimited waiting room', 'Steady state: averages over a long run'],
    traps: ['Planning a bottleneck for 95–100% utilisation', 'Using it when service times are nearly constant (waits are then about half as long)', 'Mixing per-hour and per-minute rates'],
    excel: '={lam}/({mu}*({mu}-{lam}))*60', python: 'wq_min = arrivals_per_h / (service_per_h * (service_per_h - arrivals_per_h)) * 60',
    fixtures: [{ inputs: { lam: 8, mu: 10 }, expect: 24, tol: 1e-9, source: 'M/M/1 lesson example: 0.8 / (10 − 8) h = 24 min' }],
    sweep: 'lam', predict: 'lam',
    explain: (v, y) => `The server is busy ${((v.lam / v.mu) * 100).toFixed(0)}% of the time and a job waits ${y.toFixed(1)} min on average before service starts.`,
  },
  {
    id: 'mmc', concept: 'or.mmc', related: ['or.mm1', 'service.erlang-staffing'],
    title: 'Multi-server queue (M/M/c, Erlang C)', blurb: 'How many servers a shared line needs before waits stop exploding.',
    tex: 'W_q=\\dfrac{C(c,a)}{c\\mu-\\lambda},\\qquad a=\\dfrac{\\lambda}{\\mu},\\quad \\rho=\\dfrac{\\lambda}{c\\mu}',
    inputs: [
      { key: 'lam', tex: '\\lambda', name: 'Arrival rate', unit: 'arrivals per hour', min: 0.1, max: 200, step: 0.1, value: 10, py: 'arrivals_per_h' },
      { key: 'mu', tex: '\\mu', name: 'Service rate per server', unit: 'per hour', min: 0.1, max: 60, step: 0.1, value: 4, py: 'service_per_h' },
      { key: 'c', tex: 'c', name: 'Servers', unit: 'servers', min: 1, max: 40, step: 1, value: 3, py: 'servers', integer: true },
    ],
    output: { tex: 'W_q', name: 'Average wait in queue', unit: 'min', digits: 1 },
    compute: ({ lam, mu, c }) => mmc(lam, mu, c).wq * 60,
    invalid: ({ lam, mu, c }) => (lam >= c * mu ? 'Unstable: arrivals reach or exceed the total service rate cμ, so the line grows without limit. Add servers or speed up service.' : null),
    extras: [
      { ...pctOut('Utilisation per server', '\\rho'), f: ({ lam, mu, c }) => lam / (c * mu) },
      { ...pctOut('Probability an arrival waits (Erlang C)', 'C(c,a)'), f: ({ lam, mu, c }) => mmc(lam, mu, c).pw },
      { tex: 'L_q', name: 'Average number waiting', unit: 'customers', digits: 2, f: ({ lam, mu, c }) => mmc(lam, mu, c).lq },
    ],
    dims: 'probability ÷ (per hour − per hour) = hours; × 60 = min',
    assumptions: ['Poisson arrivals and exponential service times', 'c identical servers sharing one first-come-first-served line', 'Nobody leaves the line (no abandonment) and the waiting room is unlimited', 'Steady state: long-run averages'],
    traps: ['Dividing arrivals evenly over separate lines and calling it the same thing (pooled lines wait less)', 'Sizing staff on average utilisation alone', 'Ignoring abandonment in call centres, where Erlang A fits better'],
    excel: '=LET(a,{lam}/{mu},r,a/{c},t,a^{c}/FACT({c})/(1-r),s,SUMPRODUCT(a^(ROW(INDIRECT("1:"&{c}))-1)/FACT(ROW(INDIRECT("1:"&{c}))-1)),t/(s+t)/({c}*{mu}-{lam})*60)',
    python: 'from math import factorial\na = arrivals_per_h / service_per_h\nrho = a / servers\ntop = a**servers / factorial(servers) / (1 - rho)\np_wait = top / (sum(a**k / factorial(k) for k in range(servers)) + top)\nwq_min = p_wait / (servers * service_per_h - arrivals_per_h) * 60',
    fixtures: [
      { inputs: { lam: 10, mu: 4, c: 3 }, expect: 21.067, tol: 0.001, source: 'Hand-worked: a = 2.5, P0 = 1/22.25, P(wait) = 15.625/22.25 = 0.70225, Wq = 0.70225/2 h' },
      { inputs: { lam: 8, mu: 10, c: 1 }, expect: 24, tol: 1e-9, source: 'With one server it must equal the M/M/1 lesson example (24 min)' },
      { inputs: { lam: 10, mu: 6, c: 2 }, expect: 22.727, tol: 0.001, source: 'Hand-worked pooling case: P(wait) = (25/9)/(11/3) = 0.75758, Wq = 0.37879 h' },
    ],
    sweep: 'lam', predict: 'c',
    insight: 'Adding servers cuts the wait far more than in proportion, because the line is shared: a free server takes the next customer at once.',
    explain: (v, y) => `Each server is busy ${((v.lam / (v.c * v.mu)) * 100).toFixed(0)}% of the time; ${(mmc(v.lam, v.mu, v.c).pw * 100).toFixed(0)}% of arrivals wait, on average ${y.toFixed(1)} min.`,
  },
  {
    id: 'newsvendor', concept: 'or.newsvendor', related: ['or.eoq', 'scm.service-level'],
    title: 'Newsvendor order quantity', blurb: 'How much to stock for one selling season when demand is uncertain.',
    tex: 'Q^*=\\mu+z\\,\\sigma,\\qquad \\Phi(z)=\\dfrac{C_u}{C_u+C_o}=\\dfrac{p-c}{p-s}',
    inputs: [
      { key: 'p', tex: 'p', name: 'Selling price', unit: '$ per unit', min: 0.5, max: 200, step: 0.1, value: 12, py: 'price' },
      { key: 'c', tex: 'c', name: 'Unit cost', unit: '$ per unit', min: 0.5, max: 200, step: 0.1, value: 5, py: 'cost' },
      { key: 's', tex: 's', name: 'Salvage value', unit: '$ per unit', min: 0, max: 200, step: 0.1, value: 1, sign: 'nonneg', py: 'salvage' },
      { key: 'mu', tex: '\\mu', name: 'Mean demand', unit: 'units', min: 10, max: 5000, step: 1, value: 500, py: 'mean' },
      { key: 'sigma', tex: '\\sigma', name: 'Demand standard deviation', unit: 'units', min: 1, max: 1000, step: 0.1, value: 120, py: 'sd' },
    ],
    output: { tex: 'Q^*', name: 'Order quantity', unit: 'units', digits: 1 },
    compute: ({ p, c, s, mu, sigma }) => Math.max(0, mu + PhiInv((p - c) / (p - s)) * sigma),
    invalid: ({ p, c, s }) => (c >= p ? 'The unit cost is at or above the price, so every unit loses money: stock nothing.' : s >= c ? 'Salvage is at or above cost, so leftovers cost nothing and the model says stock without limit. Check the salvage value.' : null),
    warn: ({ p, c, s, mu, sigma }) => (mu + PhiInv((p - c) / (p - s)) * sigma < 0 ? 'The normal model’s quantile is below zero, so the order is set to zero: a thin margin and very uncertain demand mean stocking nothing loses least. A normal model is a poor fit here; use a lognormal or the empirical demand distribution.' : sigma > mu / 3 ? 'The standard deviation is more than a third of the mean, so a normal model gives real probability to negative demand. Consider a lognormal or empirical demand distribution.' : null),
    extras: [
      { ...pctOut('Critical ratio (target in-stock probability)', '\\frac{C_u}{C_u+C_o}'), f: ({ p, c, s }) => (p - c) / (p - s) },
      { tex: 'z', name: 'Standard normal quantile', unit: '', digits: 3, f: ({ p, c, s }) => PhiInv((p - c) / (p - s)) },
    ],
    dims: 'units + (dimensionless z × units) = units',
    assumptions: ['One selling period: leftovers cannot be sold at full price later', 'Demand is approximately normal with the given mean and standard deviation', 'Costs are linear: each extra unit costs c and each leftover recovers s', 'Lost sales cost only the lost margin (no goodwill penalty unless added to Cu)'],
    traps: ['Ordering the mean demand by habit', 'Using the price instead of the margin as the underage cost', 'Forgetting salvage when computing the overage cost'],
    excel: '=MAX(0,NORM.INV(({p}-{c})/({p}-{s}),{mu},{sigma}))', python: 'from scipy.stats import norm\nq = max(0, norm.ppf((price - cost) / (price - salvage), mean, sd))',
    fixtures: [
      { inputs: { p: 12, c: 5, s: 1, mu: 500, sigma: 120 }, expect: 541.85, tol: 0.05, source: 'Newsvendor lesson example: critical ratio 7/11, z ≈ 0.349' },
      { inputs: { p: 10, c: 6, s: 2, mu: 500, sigma: 120 }, expect: 500, tol: 1e-6, source: 'Cu = Co = 4 gives a critical ratio of 0.5, so Q* is the mean' },
      { inputs: { p: 20, c: 4, s: 0, mu: 1000, sigma: 200 }, expect: 1168.32, tol: 0.05, source: 'Critical ratio 16/20 = 0.80; z(0.80) = 0.8416 from the standard normal table' },
      { inputs: { p: 5.1, c: 5, s: 1, mu: 10, sigma: 120 }, expect: 0, tol: 1e-9, source: 'Order quantities cannot be negative: critical ratio 0.1/4.1 gives z ≈ −1.97 and μ + zσ ≈ −226, so stock 0' },
    ],
    sweep: 'sigma', predict: 'sigma',
    insight: 'When shortages cost more than leftovers, more uncertainty means stocking more, not less: the safety margin z·σ grows with σ.',
    explain: (v, y) => { const cr = (v.p - v.c) / (v.p - v.s); if (y === 0) return `The critical ratio is ${(cr * 100).toFixed(1)}%: the margin is so thin against the cost of a leftover that stocking nothing loses least.`; return `The critical ratio is ${(cr * 100).toFixed(1)}%, so stock enough to meet demand that often: about ${Math.round(y)} units, ${y >= v.mu ? `${Math.round(y - v.mu)} above` : `${Math.round(v.mu - y)} below`} the mean.` },
  },
  {
    id: 'calibration', concept: 'automation.sensors', related: ['manufacturing.measurement-uncertainty', 'automation.plc'],
    title: 'Two-point sensor scaling', blurb: 'Turning a 4–20 mA signal into an engineering value.',
    tex: 'y=y_0+(x-x_0)\\,\\dfrac{y_1-y_0}{x_1-x_0}',
    inputs: [
      { key: 'x', tex: 'x', name: 'Signal reading', unit: 'mA', min: 0, max: 24, step: 0.1, value: 12, sign: 'any', py: 'signal_ma' },
      { key: 'x0', tex: 'x_0', name: 'Signal at the low calibration point', unit: 'mA', min: 0, max: 24, step: 0.1, value: 4, sign: 'any', py: 'x0' },
      { key: 'x1', tex: 'x_1', name: 'Signal at the high calibration point', unit: 'mA', min: 0, max: 24, step: 0.1, value: 20, sign: 'any', py: 'x1' },
      { key: 'y0', tex: 'y_0', name: 'Value at the low point', unit: '°C', min: -100, max: 500, step: 1, value: 0, sign: 'any', py: 'y0' },
      { key: 'y1', tex: 'y_1', name: 'Value at the high point', unit: '°C', min: -100, max: 500, step: 1, value: 100, sign: 'any', py: 'y1' },
    ],
    output: { tex: 'y', name: 'Scaled value', unit: '°C', digits: 2 },
    compute: ({ x, x0, x1, y0, y1 }) => y0 + ((x - x0) * (y1 - y0)) / (x1 - x0),
    invalid: ({ x0, x1 }) => (x1 === x0 ? 'The two calibration signals must differ, or the slope is undefined.' : null),
    warn: ({ x, x0, x1 }) => (x < Math.min(x0, x1) || x > Math.max(x0, x1) ? 'The reading is outside the calibrated span, so this value is an extrapolation. In a 4–20 mA loop, a reading well below 4 mA usually means a wiring or sensor fault rather than a real low value.' : null),
    extras: [{ tex: '\\text{slope}', name: 'Sensitivity', unit: '°C per mA', digits: 3, f: ({ x0, x1, y0, y1 }) => (y1 - y0) / (x1 - x0) }],
    dims: '°C + (mA × °C per mA) = °C',
    assumptions: ['The sensor and transmitter are linear between the two calibration points', 'Calibration points were measured against a traceable reference'],
    traps: ['Scaling from 0 mA instead of 4 mA (a “live zero” lets a broken wire be told apart from a true low reading)', 'Extrapolating far outside the calibrated span'],
    excel: '={y0}+({x}-{x0})*({y1}-{y0})/({x1}-{x0})', python: 'value = y0 + (signal_ma - x0) * (y1 - y0) / (x1 - x0)',
    fixtures: [
      { inputs: { x: 12, x0: 4, x1: 20, y0: 0, y1: 100 }, expect: 50, tol: 1e-9, source: 'Mid-scale of a 4–20 mA, 0–100 °C transmitter' },
      { inputs: { x: 8, x0: 4, x1: 20, y0: 0, y1: 100 }, expect: 25, tol: 1e-9, source: 'Quarter scale: (8 − 4) / 16 × 100' },
    ],
    sweep: 'x', predict: 'y1',
    explain: (v, y) => `${v.x} mA reads as ${y.toFixed(2)} °C.`,
  },
]

export const EQUATION_MAP: Record<string, Equation> = Object.fromEntries(EQUATIONS.map((e) => [e.id, e]))
export const equationForConcept = (conceptId: string) => EQUATIONS.find((e) => e.concept === conceptId)

export type EqResult = { ok: true; y: number; extras: number[]; warn: string | null } | { ok: false; error: string }
export function evaluate(eq: Equation, v: Vals): EqResult {
  for (const inp of eq.inputs) {
    const x = v[inp.key], name = inp.name[0] + inp.name.slice(1).toLowerCase()
    if (!Number.isFinite(x)) return { ok: false, error: `Enter a number for ${inp.name.toLowerCase()}.` }
    const sign = inp.sign ?? 'positive'
    if (sign === 'positive' && x <= 0) return { ok: false, error: `${name} must be greater than zero.` }
    if (sign === 'nonneg' && x < 0) return { ok: false, error: `${name} can’t be negative.` }
    if (inp.integer && !Number.isInteger(x)) return { ok: false, error: `${name} must be a whole number.` }
  }
  const bad = eq.invalid?.(v)
  if (bad) return { ok: false, error: bad }
  const y = eq.compute(v)
  if (!Number.isFinite(y)) return { ok: false, error: 'The formula is undefined for these inputs.' }
  return { ok: true, y, extras: (eq.extras || []).map((x) => x.f(v)), warn: eq.warn?.(v) ?? null }
}

/** Fill the {key} placeholders of a spreadsheet formula with cell references B1, B2, … in input order. */
export const excelFormula = (eq: Equation) => eq.excel.replace(/\{(\w+)\}/g, (_, k) => `B${eq.inputs.findIndex((x) => x.key === k) + 1}`)

/** How the output responds when one input is multiplied by a factor, for the predict-first question. */
export type Response = 'no change' | 'halves' | 'falls, but by less than half' | 'falls by more than half' | 'doubles' | 'rises, but less than double' | 'more than doubles' | 'changes sign'
export const RESPONSES: Response[] = ['more than doubles', 'doubles', 'rises, but less than double', 'no change', 'falls, but by less than half', 'halves', 'falls by more than half']
export function responseTo(eq: Equation, v: Vals, key: string, factor: number): Response | null {
  const a = evaluate(eq, v), b = evaluate(eq, { ...v, [key]: v[key] * factor })
  if (!a.ok || !b.ok || a.y === 0 || v[key] === 0) return null
  const r = b.y / a.y
  const near = (x: number) => Math.abs(r - x) < 0.02 * x
  if (r < 0) return 'changes sign'
  return near(1) ? 'no change' : near(2) ? 'doubles' : near(0.5) ? 'halves' : r > 2 ? 'more than doubles' : r > 1 ? 'rises, but less than double' : r > 0.5 ? 'falls, but by less than half' : 'falls by more than half'
}
