import type { Concept, DomainId, Citation } from '../types'

export type PilotKind = 'takt' | 'ladder' | 'newton' | 'npv' | 'capability'
export type Lens = 'beginner' | 'student' | 'engineer' | 'researcher' | 'interview'
export interface Pilot {
  kind: PilotKind
  question: string
  mental: string
  inputs: string
  outputs: string
  explanations: Record<Lens, string>
  example: string
  limit: string
  compare: string
  practice: { question: string; options: string[]; answer: number; why: string }
  sources: Citation[]
}
const capability: Pilot = {
  kind: 'capability', question: 'Will our process variation fit the specification?',
  mental: 'Imagine a parking space: Cp measures whether the car fits; Cpk also accounts for how far it is parked off center.',
  inputs: 'Lower and upper specification limits, mean, standard deviation', outputs: 'Dimensionless Cp and Cpk indices',
  explanations: {
    beginner: 'Even identical-looking products vary. A capable process has small variation relative to the allowed range and is sufficiently centered.',
    student: 'Cp compares the tolerance width with six standard deviations. Cpk uses the nearer specification limit, scaled by three standard deviations.',
    engineer: 'Use stable-process estimates, verify measurement quality, then investigate whether the problem is excessive spread, poor centering, or both.',
    researcher: 'Separate estimated within-process variation from overall variation, report estimation uncertainty and check whether the distributional assumptions support tail predictions.',
    interview: 'Cp measures potential capability; Cpk penalizes off-centering. I check stability first and do not infer defect rates from a normal model without validating it.',
  },
  example: 'Illustrative shaft dimensions: specifications 40–60 mm, mean 50 mm, standard deviation 2 mm. Cp and Cpk are both approximately 1.67. Shift the mean to 54 mm and Cpk falls to 1.00 while Cp is unchanged.',
  limit: 'The experiment assumes fixed two-sided specifications and a stable process. A normal curve is illustrative; do not infer defect probabilities without checking the model. Targets vary by customer and application.',
  compare: 'Specification limits are engineering requirements; control limits describe observed process behavior. Cp ignores centering; Cpk includes it.',
  practice: { question: 'Mean shifts toward the upper limit while spread stays constant. What happens?', options: ['Cp falls but Cpk stays constant', 'Cp stays constant; Cpk can fall', 'Both must increase'], answer: 1, why: 'Cp depends on specification width and spread; Cpk also depends on the nearest specification limit.' },
  sources: [{ src: 'nist-handbook', section: '6.1.6 What is Process Capability?', url: 'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm', supports: 'Capability indices, centering, stability and distributional assumptions.' }],
}
export const PILOTS: Record<string, Pilot> = {
  'lean.takt-time': {
    kind: 'takt', question: 'How often must a finished unit be produced to meet demand?',
    mental: 'A bakery needs 60 loaves in an hour: its required average output rhythm is one loaf per minute, not necessarily its oven cycle.',
    inputs: 'Net scheduled production time and customer demand for the same period', outputs: 'Required seconds per good unit',
    explanations: {
      beginner: 'Divide the time you have by the number of items people need. That tells you the required pace.',
      student: 'Takt is net available production time divided by demand. Compare it with effective completion intervals, not total lead time.',
      engineer: 'Use takt to size capacity and balance work. Account separately for availability, yield, variability and parallel machines.',
      researcher: 'Specify the system boundary, product family, demand horizon and time convention before comparing takt with measured throughput.',
      interview: 'Takt is the customer-driven pace. I compare it with effective cycle times, investigate constraints and improve the system without sacrificing safety or quality.',
    },
    example: 'Illustrative eight-hour shift: 60 minutes of planned breaks, 420 units requested. (480 − 60) × 60 ÷ 420 = 60 seconds/unit. At a constant 75-second cycle the ideal single-station capacity is 336 units.',
    limit: 'Demand must be positive and the time horizon consistent. This ideal capacity model excludes scrap, unplanned downtime and startup losses; do not subtract losses twice.',
    compare: 'Takt is the required pace; cycle time is the actual processing/completion interval; lead time includes waiting and other elapsed time.',
    practice: { question: 'Demand doubles while available time is fixed. What happens to takt?', options: ['It doubles', 'It halves', 'It stays the same'], answer: 1, why: 'Demand is the denominator; twice as many units require half as much time per unit.' },
    sources: [{ src: 'lei-lexicon', section: 'Takt Time', url: 'https://www.lean.org/lexicon-terms/takt-time/', supports: 'The definition and demand-driven production rhythm.' }],
  },
  'automation.ladder-logic': {
    kind: 'ladder', question: 'How can a controller decide whether an output should be on?',
    mental: 'A logical path must satisfy all series conditions; a parallel branch offers an alternative path.',
    inputs: 'Boolean input bits A, B and C', outputs: 'Boolean output Y',
    explanations: {
      beginner: 'Think of gates on a path. A series gate must be true; either parallel path can make that part true.',
      student: 'The example rung evaluates (A OR NOT B) AND C. A normally-open instruction tests a true bit; a normally-closed instruction tests a false bit.',
      engineer: 'Identify input-bit semantics, verify scan behavior and test every combination before deployment. Physical wiring and safety functions require separate engineering.',
      researcher: 'Treat the rung as a Boolean expression with explicit state assumptions; temporal behavior and scan sequencing are outside this combinational model.',
      interview: 'Series instructions implement AND, parallel branches implement OR, and XIO tests the negated bit. I verify the truth table and actual input mapping.',
    },
    example: 'Illustrative sorting permissive: either A or NOT B must be true, and C must be true. With A=false, B=false, C=true, Y=true.',
    limit: 'This is an educational combinational rung, not a controller runtime, safety-rated design, physical wiring diagram or real machinery instruction.',
    compare: 'NO/NC ladder instructions test bits; a physical normally-open or normally-closed switch has a separate wiring meaning.',
    practice: { question: 'A=false, B=true, C=true. Is (A OR NOT B) AND C true?', options: ['True', 'False'], answer: 1, why: 'A and NOT B are both false, so the parallel branch is false.' },
    sources: [{ src: 'rockwell-bit-instructions', section: 'Common instructions: XIC, XIO, OTE', supports: 'Boolean contact and output instruction semantics.' }],
  },
  'or.newton-raphson': {
    kind: 'newton', question: 'How can we approximate a root without solving the equation algebraically?',
    mental: 'Follow the tangent of a curve down to the horizontal axis, then repeat from the new guess.',
    inputs: 'Differentiable function, derivative and starting guess', outputs: 'Successive root approximations and residual',
    explanations: {
      beginner: 'Start with a guess, use the slope to correct it, and repeat until the equation is nearly satisfied.',
      student: 'Newton uses x_next = x − f(x)/f′(x). This lab uses f(x)=x²−2 and positive starting guesses.',
      engineer: 'Use a residual and iteration cap, check derivative size, and consider a bracketed solver if convergence fails. IRR is one possible application.',
      researcher: 'Local convergence depends on the root and starting point. A small step alone is insufficient evidence of a small residual.',
      interview: 'Newton is an iterative root finder using a tangent approximation. It can converge quickly near a simple root but is not globally guaranteed.',
    },
    example: 'Starting at x=2 for x²−2=0, the first estimate is 1.5; the second is about 1.4166667. The positive root is approximately 1.41421356.',
    limit: 'The bounded positive starting values in this demonstration are deliberately favorable. General Newton iterations can diverge or encounter zero derivatives.',
    compare: 'Newton uses derivatives; bisection uses a sign-changing bracket and has different convergence guarantees.',
    practice: { question: 'What makes a Newton update undefined?', options: ['A nonzero residual', 'A zero derivative with nonzero residual', 'A positive starting value'], answer: 1, why: 'The update divides by the derivative; a zero derivative prevents the stated update.' },
    sources: [{ src: 'openstax-newton', section: '4.9 Newton’s Method', supports: 'Tangent update, iteration example and failure modes.' }],
  },
  'engecon.npv': {
    kind: 'npv', question: 'Is a future stream of savings worth its upfront investment today?',
    mental: 'Money today and money later are not interchangeable; discount future amounts to the same date before adding them.',
    inputs: 'Initial cost, annual net cash flow, discount rate, study period', outputs: 'Net present value in dollars at time zero',
    explanations: {
      beginner: 'Compare what you spend now with what future savings are worth today.',
      student: 'NPV is the sum of discounted cash flows, including the initial investment at time zero.',
      engineer: 'Use incremental cash flows and a consistent MARR, horizon and inflation convention. Include relevant tax, salvage and replacement effects in a real model.',
      researcher: 'Test cash-flow and discount-rate sensitivity; distinguish deterministic scenarios from probability-based risk modeling.',
      interview: 'A positive NPV indicates an independent project meets the chosen return criterion under the assumptions. Mutually exclusive alternatives require a consistent comparison.',
    },
    example: 'Illustrative equipment: 10,000 dollars upfront, 3,000 dollars net savings at each of five year ends and a 10% discount rate. Present savings are about 11,372.36 dollars; NPV is about 1,372.36 dollars.',
    limit: 'This lab assumes equal end-of-year net savings, no taxes, inflation adjustment or salvage. A positive result is not a guarantee.',
    compare: 'NPV measures value in today’s money; IRR is a rate that makes NPV zero; EUAC expresses equivalent annual cost.',
    practice: { question: 'For positive future savings, what happens to their present value if MARR rises?', options: ['It increases', 'It decreases', 'It never changes'], answer: 1, why: 'A larger positive discount rate increases the denominator of future cash-flow terms.' },
    sources: [{ src: 'openstax-npv', section: '16.2 Net Present Value Method', supports: 'Discounting, decision criterion and sensitivity to discount rate.' }],
  },
  'quality.cpk': capability,
  'quality.cp': capability,
}

export const LENSES: { id: Lens; label: string }[] = [
  { id: 'beginner', label: 'Absolute beginner' }, { id: 'student', label: 'Student' },
  { id: 'engineer', label: 'Engineer' }, { id: 'researcher', label: 'Researcher' },
  { id: 'interview', label: 'Interview' },
]

// These are discovery destinations, not verified claim-level citations for every lesson.
export const DISCOVERY: Record<DomainId, [string, string]> = {
  lean: ['Lean Enterprise Institute', 'https://www.lean.org/'],
  stats: ['NIST statistics handbook', 'https://www.itl.nist.gov/div898/handbook/'],
  quality: ['NIST statistics handbook', 'https://www.itl.nist.gov/div898/handbook/'],
  doe: ['NIST statistics handbook', 'https://www.itl.nist.gov/div898/handbook/'],
  automation: ['Siemens industry support', 'https://support.industry.siemens.com/'],
  systems: ['NASA systems engineering', 'https://www.nasa.gov/reference/systems-engineering-handbook/'],
  safety: ['OSHA', 'https://www.osha.gov/'], ergo: ['NIOSH', 'https://www.cdc.gov/niosh/'],
  reliability: ['NIST statistics handbook', 'https://www.itl.nist.gov/div898/handbook/'],
  manufacturing: ['NIST MEP', 'https://www.nist.gov/mep'],
  semiconductor: ['ASML technology', 'https://www.asml.com/en/technology'],
  or: ['MIT OpenCourseWare', 'https://ocw.mit.edu/'], simulation: ['SimPy documentation', 'https://simpy.readthedocs.io/'],
  datasci: ['scikit-learn documentation', 'https://scikit-learn.org/stable/'],
  engecon: ['OpenStax', 'https://openstax.org/'], scm: ['MIT OpenCourseWare', 'https://ocw.mit.edu/'],
  pm: ['PMI', 'https://www.pmi.org/'], work: ['ILO', 'https://www.ilo.org/'],
  facilities: ['MIT OpenCourseWare', 'https://ocw.mit.edu/'], service: ['AHRQ', 'https://www.ahrq.gov/'],
  sustain: ['EPA', 'https://www.epa.gov/'], career: ['O*NET OnLine', 'https://www.onetonline.org/'],
}

export function studioCitations(c: Concept): Citation[] {
  const all = [...(PILOTS[c.id]?.sources || []), ...(c.cites || [])]
  return all.filter((x, i) => all.findIndex((y) => (y.url || y.src) === (x.url || x.src)) === i)
}
