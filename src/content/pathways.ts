// Guided pathways (EDU-01/03 gold-standard slice): a sequence of existing lessons, labs and cases with
// assessment items that record evidence by dimension. Numeric items are generated from a seed, so a retry
// or a delayed review gets new numbers; their answers are checked by src/lib/pathways.test.ts.
import { makeRng } from '../lib/math'
import type { NumericAnswer } from '../lib/answers'
import type { Dimension } from '../lib/store'

export interface ChoiceItem { kind: 'choice'; id: string; concept: string; dim: Dimension; prompt: string; options: { text: string; why: string }[]; answer: number; predict?: boolean }
export interface Generated { prompt: string; answer: NumericAnswer; steps: string[]; hint: string }
export interface NumericItem { kind: 'numeric'; id: string; concept: string; dim: Dimension; make: (seed: number) => Generated }
/** Evidence earned elsewhere in the app (a mystery case or lab); the pathway only reads it. */
export interface ExternalItem { kind: 'external'; id: string; concept: string; dim: Dimension; prompt: string; to: string; label: string; item: string }
export type Item = ChoiceItem | NumericItem | ExternalItem
export interface PathStep { id: string; title: string; goal: string; lessons: string[]; links?: { to: string; label: string }[]; items: Item[] }
export interface Pathway { id: string; title: string; blurb: string; minutes: number; outcomes: string[]; steps: PathStep[]; review: Item[] }

/** Per-item salt so two items built from the same generator never show the same numbers. */
const salt = (id: string) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 100000
const pick = <T,>(u: number, xs: T[]) => xs[Math.min(xs.length - 1, Math.floor(u * xs.length))]
const f1 = (x: number) => (Number.isInteger(x) ? x.toLocaleString('en-US') : x.toLocaleString('en-US', { maximumFractionDigits: 2 }))

const takt = (id: string): NumericItem => ({
  kind: 'numeric', id, concept: 'lean.takt-time', dim: 'calculate',
  make: (seed) => {
    const r = makeRng(seed * 7919 + 101 + salt(id))
    const shifts = pick(r.u(), [1, 2, 3]), hours = pick(r.u(), [8, 8, 10]), brk = pick(r.u(), [20, 30, 40])
    const avail = shifts * (hours * 60 - brk)
    const demand = Math.round((avail * 60) / (30 + 5 * Math.floor(r.u() * 19)))
    const t = (avail * 60) / demand
    return {
      prompt: `Your line runs ${shifts} shift${shifts > 1 ? 's' : ''} of ${hours} hours a day, each with ${brk} minutes of breaks. Customers need ${f1(demand)} units a day. What is the takt time?`,
      answer: { value: t, unit: 's/unit', acceptNumeratorOnly: true, tol: { abs: 0.05, rel: 0.005 }, traps: [{ value: (shifts * hours * 3600) / demand, msg: 'That uses the whole shift. Takt uses available time: subtract the breaks first.' }] },
      steps: [`Available time = ${shifts} × (${hours * 60} − ${brk}) min = ${f1(avail)} min = ${f1(avail * 60)} s`, `Takt = ${f1(avail * 60)} s ÷ ${f1(demand)} units = ${f1(+t.toFixed(2))} s per unit`],
      hint: 'Takt = available time ÷ demand. Work in seconds.',
    }
  },
})

const littles = (id: string): NumericItem => ({
  kind: 'numeric', id, concept: 'lean.littles-law', dim: 'calculate',
  make: (seed) => {
    const r = makeRng(seed * 7919 + 404 + salt(id))
    const lam = pick(r.u(), [20, 25, 40, 50, 60, 80, 100, 120]), W = pick(r.u(), [2, 2.5, 3, 4, 5, 6, 8])
    const L = lam * W
    return {
      prompt: `A cell holds ${f1(L)} jobs in work-in-process on average and completes ${lam} jobs a day. On average, how long does a job spend in the cell?`,
      answer: { value: W, unit: 'days', tol: { abs: 0.01 }, traps: [{ value: lam / L, msg: 'That is throughput ÷ WIP, upside down. Lead time = WIP ÷ throughput.' }, { value: L * lam, msg: 'Multiplying gives a meaningless unit (jobs² per day). Lead time = WIP ÷ throughput.' }] },
      steps: [`Little’s Law: lead time = WIP ÷ throughput`, `= ${f1(L)} jobs ÷ ${lam} jobs per day = ${f1(W)} days`],
      hint: 'Little’s Law: L = λW. Which one are you solving for?',
    }
  },
})

export const PATHWAYS: Pathway[] = [
  {
    id: 'lean-throughput',
    title: 'Lean throughput: from takt to the bottleneck',
    blurb: 'Why a line that looks fast enough still misses demand, and how to find and fix the real limit.',
    minutes: 75,
    outcomes: ['Compute takt from shift data and demand', 'Find the true bottleneck once downtime is counted', 'Compute OEE and say which loss to attack', 'Use Little’s Law to connect WIP and lead time', 'Test a fix in a line model and defend it in a case'],
    steps: [
      { id: 'takt', title: 'Set the pace: takt time', goal: 'Turn demand into the pace every station must match.', lessons: ['lean.takt-time'], links: [{ to: '/formulas/takt', label: 'Explore the takt equation' }], items: [takt('takt')] },
      {
        id: 'limit', title: 'Find what limits output', goal: 'See why cycle time alone can hide the bottleneck.', lessons: ['lean.cycle-time', 'lean.toc'],
        items: [
          {
            kind: 'choice', id: 'predict-limit', concept: 'lean.toc', dim: 'explain', predict: true,
            prompt: 'Takt is 60 s. Cut takes 50 s, Weld 55 s, Paint 48 s and Pack 40 s per unit. Weld loses 20% of the shift to changeovers. Can the line keep up with demand?',
            options: [
              { text: 'Yes: every cycle time is under takt', why: 'Cycle time is the time per unit while the station runs. Weld only runs 80% of the time, so it really needs 55 ÷ 0.8 = 68.75 s per unit of shift time.' },
              { text: 'No: Weld really needs 68.75 s per unit once its downtime is counted', why: 'Right. Time per unit = cycle time ÷ availability, and 68.75 s is above the 60 s takt.' },
              { text: 'Yes: Paint has spare time to make up for Weld', why: 'Spare time at a non-bottleneck can’t make units Weld hasn’t welded. Output is set by the slowest step.' },
              { text: 'It depends only on the slowest cycle time, 55 s', why: 'That ignores downtime. A station that stops for changeovers needs more shift time per unit than its cycle time.' },
            ],
            answer: 1,
          },
          {
            kind: 'numeric', id: 'effective', concept: 'lean.toc', dim: 'calculate',
            make: (seed) => {
              const r = makeRng(seed * 7919 + 202)
              const ct = 44 + Math.floor(r.u() * 13), av = pick(r.u(), [0.75, 0.8, 0.85, 0.9])
              return {
                prompt: `A station’s cycle time is ${ct} s, but it is available only ${Math.round(av * 100)}% of the shift because of changeovers and stops. On average, how much shift time does it need per unit?`,
                answer: { value: ct / av, unit: 's/unit', acceptNumeratorOnly: true, tol: { abs: 0.05 }, traps: [{ value: ct, msg: 'That is the time per unit while it runs. Downtime stretches it: divide by availability.' }, { value: ct * av, msg: 'Multiplying makes it shorter, but downtime makes each unit take longer on average. Divide by availability.' }] },
                steps: [`Time per unit = cycle time ÷ availability`, `= ${ct} s ÷ ${av} = ${f1(+(ct / av).toFixed(2))} s`],
                hint: 'If a station runs only part of the time, does each unit take more or less shift time than its cycle time?',
              }
            },
          },
        ],
      },
      {
        id: 'oee', title: 'Measure the losses: OEE', goal: 'Split lost capacity into downtime, speed and quality losses.', lessons: ['lean.oee'], links: [{ to: '/formulas/oee', label: 'Explore OEE from shift data' }],
        items: [{
          kind: 'numeric', id: 'oee', concept: 'lean.oee', dim: 'calculate',
          make: (seed) => {
            const r = makeRng(seed * 7919 + 303)
            const A = 80 + Math.floor(r.u() * 16), P = 82 + Math.floor(r.u() * 15), Q = 95 + Math.floor(r.u() * 5)
            const oee = (A * P * Q) / 10000
            return {
              prompt: `A press has availability ${A}%, performance ${P}% and quality ${Q}%. What is its OEE?`,
              answer: { value: oee, unit: '%', tol: { abs: 0.06 }, traps: [{ value: (A + P + Q) / 3, msg: 'That averages the three factors. OEE multiplies them, because each loss applies to what is left after the one before.' }, { value: Math.min(A, P, Q), msg: 'That is the worst single factor. OEE multiplies all three.' }] },
              steps: [`OEE = A × P × Q = ${A / 100} × ${P / 100} × ${Q / 100}`, `= ${f1(+(oee / 100).toFixed(4))} = ${oee.toFixed(1)}%`],
              hint: 'Write each factor as a decimal and multiply.',
            }
          },
        }],
      },
      { id: 'littles', title: 'Connect WIP and lead time: Little’s Law', goal: 'Predict lead time from WIP and throughput without a simulation.', lessons: ['lean.littles-law', 'lean.lead-time'], links: [{ to: '/formulas/littles-law', label: 'Explore Little’s Law' }], items: [littles('littles')] },
      {
        id: 'lab', title: 'Test a fix in the Visual factory', goal: 'Use a line model to size an improvement before spending money.', lessons: [], links: [{ to: '/lab/factory', label: 'Open the Visual factory' }],
        items: [{
          kind: 'numeric', id: 'lab-weld', concept: 'lean.toc', dim: 'apply',
          make: () => ({
            prompt: 'In the Visual factory, choose “Every station beats takt”. What is the lowest Weld availability, as a whole percentage, that lets the line make 420 good units a shift?',
            answer: { value: 92, unit: '%', tol: { abs: 0.35 }, traps: [{ value: 80, msg: 'That is today’s availability, which gives about 366 units. Raise it until good units reach 420.' }, { value: 91, msg: 'Close, but 91% gives 25,200 × 0.91 ÷ 55 ≈ 416.9 units, just short of 420.' }] },
            steps: ['Weld needs 420 units × 55 s = 23,100 s of running time', 'Availability ≥ 23,100 ÷ 25,200 = 91.7%, so the lowest whole percentage is 92%'],
            hint: 'Change Weld’s availability in the lab and watch “Good units”. Or compute it: units × cycle time ÷ shift time.',
          }),
        }],
      },
      {
        id: 'case', title: 'Defend the decision in a case', goal: 'Make the calls an engineer would, in order, and explain them.', lessons: [], links: [{ to: '/mysteries?case=beats-takt', label: 'Open the case' }],
        items: [{ kind: 'external', id: 'case', concept: 'lean.toc', dim: 'apply', prompt: 'Solve the factory mystery “Every station beats takt, yet we miss demand” with at least 3 of its 4 best calls.', to: '/mysteries?case=beats-takt', label: 'Take the case', item: 'case:beats-takt' }],
      },
    ],
    review: [
      {
        kind: 'choice', id: 'r-takt', concept: 'lean.takt-time', dim: 'recall', prompt: 'Takt time is…',
        options: [
          { text: 'the pace customer demand requires', why: 'Right: available time ÷ demand.' },
          { text: 'the pace the process actually achieves', why: 'That is cycle time. Takt comes from demand, not from the process.' },
          { text: 'the time one unit spends in the system', why: 'That is lead time (or flow time).' },
          { text: 'the time to change over a machine', why: 'That is changeover or setup time.' },
        ],
        answer: 0,
      },
      {
        kind: 'choice', id: 'r-leadtime', concept: 'lean.littles-law', dim: 'explain', prompt: 'Which change shortens lead time without adding capacity?',
        options: [
          { text: 'Speed up a station that is not the bottleneck', why: 'Output is still set by the bottleneck, and WIP piles up in front of it, so lead time doesn’t fall.' },
          { text: 'Cap the work-in-process released to the line', why: 'Right. With the same throughput, Little’s Law says less WIP means proportionally less lead time, as long as the bottleneck stays busy.' },
          { text: 'Add a buffer of inventory everywhere', why: 'More WIP at the same throughput means a longer lead time.' },
          { text: 'Run bigger batches', why: 'Bigger batches raise WIP and waiting, so lead time grows.' },
        ],
        answer: 1,
      },
      {
        kind: 'choice', id: 'r-oee', concept: 'lean.oee', dim: 'recall', prompt: 'Availability 90%, performance 95%, quality 99%. OEE is about…',
        options: [
          { text: '84.6%', why: 'Right: 0.90 × 0.95 × 0.99 = 0.846.' },
          { text: '94.7%', why: 'That is the average of the three. OEE multiplies them.' },
          { text: '90%', why: 'That is only the worst factor. OEE multiplies all three.' },
          { text: '99%', why: 'That is only the quality factor.' },
        ],
        answer: 0,
      },
      takt('r-takt-calc'),
      littles('r-littles-calc'),
    ],
  },
]

export const PATHWAY_MAP: Record<string, Pathway> = Object.fromEntries(PATHWAYS.map((p) => [p.id, p]))
export const itemKey = (p: Pathway, it: Item) => (it.kind === 'external' ? it.item : `${p.id}:${it.id}`)
export const allItems = (p: Pathway) => [...p.steps.flatMap((s) => s.items), ...p.review]
