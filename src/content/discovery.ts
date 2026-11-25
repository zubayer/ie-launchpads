// Content for the discovery tools: Method Field Guide, Confused Pairs, Factory Mysteries, Tool Cards, Spot the Waste.
// Every concept id is checked by src/lib/discovery.test.ts. Scenarios are illustrative, not documented events.

/* ---------------- Method Field Guide: a dichotomous key from problem to method ---------------- */
export interface Method { id: string; when: string; data: string; software: string }
export type GuideNode =
  | { kind: 'q'; q: string; hint?: string; options: { label: string; next: string }[] }
  | { kind: 'leaf'; title: string; methods: Method[]; note?: string }

export const GUIDE: Record<string, GuideNode> = {
  root: { kind: 'q', q: 'What are you trying to do?', options: [
    { label: 'Understand or reduce variation in a product or process', next: 'quality' },
    { label: 'Make work flow faster or cheaper: time, waste, capacity', next: 'flow' },
    { label: 'Choose the best plan or allocation', next: 'optimize' },
    { label: 'Prevent failures and manage risk', next: 'risk' },
    { label: 'Make a money decision', next: 'money' },
    { label: 'Decide how much stock to hold or order', next: 'inventory' },
  ] },
  quality: { kind: 'q', q: 'What do you need to know first?', hint: 'Work top to bottom: trust the measurement before you trust the data.', options: [
    { label: 'Can I trust my measurements?', next: 'q-msa' },
    { label: 'Is the process stable over time?', next: 'q-spc' },
    { label: 'Does it meet the specification?', next: 'q-cap' },
    { label: 'Are two or more groups different?', next: 'q-groups' },
    { label: 'Which factors drive the output?', next: 'q-factors' },
  ] },
  'q-msa': { kind: 'leaf', title: 'Measurement system analysis', methods: [
    { id: 'quality.gage-rr', when: 'Before any capability study or control chart', data: 'A crossed study, typically 10 parts × 3 operators × 2–3 repeats', software: 'Minitab, JMP' },
  ] },
  'q-spc': { kind: 'leaf', title: 'Statistical process control', methods: [
    { id: 'quality.control-chart', when: 'Monitoring a running process for shifts and trends', data: 'Time-ordered measurements, often in subgroups of 4–5', software: 'Minitab, JMP, Excel' },
  ] },
  'q-cap': { kind: 'leaf', title: 'Process capability', note: 'Check stability with a control chart first: capability of an unstable process means nothing.', methods: [
    { id: 'quality.cpk', when: 'The process is stable and you need to compare it with spec limits', data: 'At least 30, ideally 100+, measurements from a stable process, plus the spec limits', software: 'Minitab, JMP' },
    { id: 'quality.cp', when: 'You want the potential if the process were perfectly centred', data: 'Same as Cpk', software: 'Minitab, JMP' },
  ] },
  'q-groups': { kind: 'q', q: 'How many groups are you comparing?', options: [
    { label: 'Two (before vs after, A vs B)', next: 'l-ttest' },
    { label: 'Three or more', next: 'l-anova' },
  ] },
  'l-ttest': { kind: 'leaf', title: 'Compare two means', methods: [
    { id: 'stats.t-test', when: 'Two groups; roughly normal data or a large enough sample', data: 'A random sample from each group', software: 'Excel, Minitab, Python (scipy.stats)' },
  ] },
  'l-anova': { kind: 'leaf', title: 'Compare three or more means', methods: [
    { id: 'stats.anova', when: 'Three or more groups; one test instead of many t-tests', data: 'A sample from each group; check equal variances', software: 'Minitab, JMP, Python (statsmodels)' },
  ] },
  'q-factors': { kind: 'q', q: 'Can you change the factors on purpose?', options: [
    { label: 'Yes, I can run experiments', next: 'l-doe' },
    { label: 'No, I only have historical data', next: 'l-regression' },
  ] },
  'l-doe': { kind: 'leaf', title: 'Design of experiments', note: 'Screen first, then study the vital few in depth.', methods: [
    { id: 'doe.fractional-factorial', when: 'Five or more factors to screen on a limited budget', data: 'A planned subset of runs; accept some confounded interactions', software: 'Minitab, JMP' },
    { id: 'doe.full-factorial', when: 'Two to four factors, and you need every interaction', data: 'All level combinations, ideally replicated and randomised', software: 'Minitab, JMP' },
    { id: 'doe.rsm', when: 'Finding the best settings once the key factors are known', data: 'A central composite or Box–Behnken design', software: 'Minitab, JMP' },
  ] },
  'l-regression': { kind: 'leaf', title: 'Model historical data', note: 'Correlation in historical data is not proof of cause; confirm with an experiment when you can.', methods: [
    { id: 'stats.regression', when: 'Relating an output to measured inputs', data: 'Matched records of inputs and output', software: 'Excel, Minitab, Python (statsmodels)' },
  ] },
  flow: { kind: 'q', q: 'What is the main symptom?', options: [
    { label: 'Long lead times, waiting and piles of work-in-process', next: 'l-leadtime' },
    { label: 'We can’t keep up with demand', next: 'l-capacity' },
    { label: 'Changeovers take so long that batches are huge', next: 'l-smed' },
    { label: 'Errors and rework because people do it differently', next: 'l-standard' },
  ] },
  'l-leadtime': { kind: 'leaf', title: 'Find and shrink the waiting', methods: [
    { id: 'lean.vsm', when: 'You don’t yet know where lead time goes', data: 'Cycle times, inventory between steps, information flow', software: 'Paper and pencil, Visio, Lucidchart' },
    { id: 'lean.littles-law', when: 'Showing that less WIP means shorter lead time', data: 'Average WIP and throughput', software: 'Excel' },
    { id: 'lean.kanban', when: 'Capping WIP with pull signals', data: 'Demand rate, replenishment lead time, container size', software: 'Cards or an e-kanban in the ERP' },
  ] },
  'l-capacity': { kind: 'leaf', title: 'Match capacity to demand', methods: [
    { id: 'lean.takt-time', when: 'Setting the pace demand requires', data: 'Net available time and customer demand', software: 'Excel' },
    { id: 'lean.toc', when: 'Finding and exploiting the bottleneck', data: 'Capacity and load per resource', software: 'Excel, simulation' },
    { id: 'lean.oee', when: 'Measuring losses on the bottleneck', data: 'Planned time, downtime, ideal cycle time, good count', software: 'Excel, MES' },
    { id: 'lean.line-balancing', when: 'Spreading work evenly across stations', data: 'Task times and precedence', software: 'Excel' },
  ] },
  'l-smed': { kind: 'leaf', title: 'Cut changeover time', methods: [
    { id: 'lean.smed', when: 'Changeovers force large batches', data: 'A filmed changeover broken into internal and external steps', software: 'Video and a spreadsheet' },
  ] },
  'l-standard': { kind: 'leaf', title: 'Make the right way the easy way', methods: [
    { id: 'lean.standard-work', when: 'Variation comes from different methods', data: 'Observed best method, takt, work sequence', software: 'Work instruction templates' },
    { id: 'lean.poka-yoke', when: 'A mistake can be designed out', data: 'Where and how the error happens', software: 'Fixtures, sensors, checklists' },
  ] },
  optimize: { kind: 'q', q: 'What kind of decision is it?', options: [
    { label: 'How much of each thing to make or use, with limited resources', next: 'q-lp' },
    { label: 'Who does which job, one to one', next: 'l-assign' },
    { label: 'How much to ship from each source to each destination', next: 'l-transport' },
    { label: 'Which route to drive', next: 'l-route' },
    { label: 'Randomness dominates: queues, waiting, uncertain demand', next: 'q-random' },
  ] },
  'q-lp': { kind: 'q', q: 'Must the answers be whole numbers or yes/no choices?', options: [
    { label: 'No, fractions are fine (tons, hours, litres)', next: 'l-lp' },
    { label: 'Yes (open a site or not, whole trucks)', next: 'l-ip' },
  ] },
  'l-lp': { kind: 'leaf', title: 'Linear programming', methods: [
    { id: 'or.lp', when: 'Linear objective and constraints, continuous decisions', data: 'Costs or profits, resource use per unit, capacities', software: 'Excel Solver, Gurobi, PuLP, OR-Tools' },
  ] },
  'l-ip': { kind: 'leaf', title: 'Integer programming', methods: [
    { id: 'or.ip', when: 'Yes/no or whole-number decisions', data: 'As for LP, plus fixed costs and logical rules', software: 'Gurobi, PuLP (CBC), OR-Tools' },
  ] },
  'l-assign': { kind: 'leaf', title: 'Assignment', methods: [
    { id: 'or.assignment', when: 'Each person gets exactly one job', data: 'A cost or time matrix', software: 'Excel Solver, OR-Tools, scipy' },
  ] },
  'l-transport': { kind: 'leaf', title: 'Transportation', methods: [
    { id: 'or.transportation', when: 'Supplies at sources, demands at destinations, cost per unit shipped', data: 'Supplies, demands, unit shipping costs', software: 'Excel Solver, Gurobi, PuLP' },
  ] },
  'l-route': { kind: 'leaf', title: 'Routing', methods: [
    { id: 'or.tsp', when: 'One vehicle visits every stop once', data: 'Distances or travel times between stops', software: 'OR-Tools, Concorde' },
    { id: 'or.vrp', when: 'A fleet with capacities shares the stops', data: 'Distances, demands, vehicle capacities, time windows', software: 'OR-Tools, routing software' },
  ] },
  'q-random': { kind: 'q', q: 'Is it one simple queue?', options: [
    { label: 'Yes: one line, one or a few identical servers', next: 'l-queue' },
    { label: 'No: many steps, rules or uncertain inputs', next: 'l-sim' },
  ] },
  'l-queue': { kind: 'leaf', title: 'Queueing formulas', note: 'The formulas assume random (Poisson) arrivals and exponential service times.', methods: [
    { id: 'or.mm1', when: 'One server', data: 'Arrival rate and service rate', software: 'Excel' },
    { id: 'or.mmc', when: 'Several identical servers', data: 'Arrival rate, service rate, number of servers', software: 'Excel, Python' },
  ] },
  'l-sim': { kind: 'leaf', title: 'Simulation', methods: [
    { id: 'simulation.des', when: 'Entities move through queues and resources over time', data: 'Arrival and process-time distributions, routing rules', software: 'SimPy, Arena, FlexSim, AnyLogic' },
    { id: 'simulation.monte-carlo', when: 'Uncertain inputs, no queue timing (cost, risk, schedule)', data: 'Distributions for each uncertain input', software: 'Excel, Python' },
  ] },
  risk: { kind: 'q', q: 'Where are you in the life of the system?', options: [
    { label: 'Designing a product or process; nothing has failed yet', next: 'l-fmea' },
    { label: 'One serious event to analyse or quantify', next: 'l-fta' },
    { label: 'A process plant with flows, pressures and temperatures', next: 'l-hazop' },
    { label: 'Equipment keeps failing and I have failure times', next: 'l-weibull' },
    { label: 'Something went wrong and I need the cause', next: 'l-rca' },
  ] },
  'l-fmea': { kind: 'leaf', title: 'Bottom-up failure analysis', methods: [
    { id: 'safety.fmea', when: 'Rank how each step or component could fail', data: 'Process steps or functions, failure modes, causes, controls', software: 'Excel templates, APIS IQ-FMEA' },
  ] },
  'l-fta': { kind: 'leaf', title: 'Top-down analysis', methods: [
    { id: 'safety.fta', when: 'Find and quantify the causes of one top event', data: 'Basic-event probabilities and the logic linking them', software: 'Isograph FaultTree+, OpenFTA' },
    { id: 'safety.bowtie', when: 'Show threats, barriers and consequences on one page', data: 'Threats, top event, consequences, barriers', software: 'BowTieXP, whiteboard' },
  ] },
  'l-hazop': { kind: 'leaf', title: 'Process hazard analysis', methods: [
    { id: 'safety.hazop', when: 'Systematically find deviations in a process design', data: 'P&IDs, process nodes, guide words', software: 'PHA-Pro, spreadsheets' },
    { id: 'safety.lopa', when: 'Check whether protection layers are enough', data: 'Initiating-event frequency, layer failure probabilities, tolerable target', software: 'Spreadsheets, PHA-Pro' },
  ] },
  'l-weibull': { kind: 'leaf', title: 'Life-data analysis', methods: [
    { id: 'reliability.weibull', when: 'Model failure times and their trend (β)', data: 'Failure and suspension times', software: 'ReliaSoft Weibull++, Minitab, Python (reliability)' },
    { id: 'reliability.rcm', when: 'Choose a maintenance strategy per failure mode', data: 'Functions, failure modes, consequences', software: 'CMMS, spreadsheets' },
  ] },
  'l-rca': { kind: 'leaf', title: 'Root cause analysis', methods: [
    { id: 'safety.rca', when: 'Find why something happened, not just what', data: 'Timeline, evidence, interviews', software: 'Whiteboard, 5-Why and 8D templates' },
    { id: 'quality.fishbone', when: 'Brainstorm causes by category', data: 'The problem statement and team knowledge', software: 'Whiteboard, Minitab' },
  ] },
  money: { kind: 'q', q: 'What kind of money decision?', options: [
    { label: 'Accept or reject one investment', next: 'l-accept' },
    { label: 'Choose between alternatives', next: 'q-lives' },
    { label: 'Keep or replace equipment', next: 'l-replace' },
    { label: 'How many units cover our costs?', next: 'l-breakeven' },
    { label: 'Include taxes and depreciation', next: 'l-tax' },
  ] },
  'l-accept': { kind: 'leaf', title: 'Single-project test', methods: [
    { id: 'engecon.npv', when: 'Accept if NPV ≥ 0 at your MARR', data: 'Cash flows by year and the MARR', software: 'Excel NPV(), numpy_financial' },
    { id: 'engecon.irr', when: 'Compare the project’s rate of return with the MARR', data: 'Cash flows by year', software: 'Excel IRR(), numpy_financial' },
  ] },
  'q-lives': { kind: 'q', q: 'Do the alternatives last the same number of years?', options: [
    { label: 'Yes, equal lives', next: 'l-equal' },
    { label: 'No, unequal lives', next: 'l-unequal' },
  ] },
  'l-equal': { kind: 'leaf', title: 'Equal lives', note: 'Pick the highest NPV, not the highest IRR.', methods: [
    { id: 'engecon.npv', when: 'Highest NPV wins', data: 'Cash flows of each alternative, MARR', software: 'Excel' },
    { id: 'engecon.incremental', when: 'Rate-of-return comparison done correctly', data: 'The difference in cash flows between alternatives', software: 'Excel' },
  ] },
  'l-unequal': { kind: 'leaf', title: 'Unequal lives', methods: [
    { id: 'engecon.annual-worth', when: 'Compare equivalent cost or value per year', data: 'Cash flows, lives, MARR', software: 'Excel PMT()' },
  ] },
  'l-replace': { kind: 'leaf', title: 'Replacement', methods: [
    { id: 'engecon.replacement', when: 'Defender vs challenger', data: 'Market value now, future costs of each', software: 'Excel' },
  ] },
  'l-breakeven': { kind: 'leaf', title: 'Break-even', methods: [
    { id: 'engecon.break-even', when: 'Volume where revenue equals cost', data: 'Fixed cost, price and variable cost per unit', software: 'Excel' },
  ] },
  'l-tax': { kind: 'leaf', title: 'After-tax analysis', methods: [
    { id: 'engecon.macrs', when: 'US tax depreciation schedules', data: 'Cost basis and recovery class', software: 'Excel, IRS tables' },
    { id: 'engecon.after-tax', when: 'Cash flows after tax', data: 'Before-tax flows, depreciation, tax rate', software: 'Excel' },
  ] },
  inventory: { kind: 'q', q: 'What is the question?', options: [
    { label: 'How much to order', next: 'q-howmuch' },
    { label: 'When to order', next: 'l-when' },
    { label: 'Which items deserve attention', next: 'l-abc' },
    { label: 'Orders swing wildly upstream', next: 'l-bullwhip' },
  ] },
  'q-howmuch': { kind: 'q', q: 'Is demand steady and repeating, or a one-time season?', options: [
    { label: 'Steady, repeating demand', next: 'l-eoq' },
    { label: 'One-time order of perishable or seasonal goods', next: 'l-newsvendor' },
  ] },
  'l-eoq': { kind: 'leaf', title: 'Economic order quantity', methods: [
    { id: 'or.eoq', when: 'Steady demand, known ordering and holding costs', data: 'Annual demand, cost per order, holding cost per unit-year', software: 'Excel' },
  ] },
  'l-newsvendor': { kind: 'leaf', title: 'Newsvendor model', methods: [
    { id: 'or.newsvendor', when: 'One order before uncertain demand', data: 'Demand distribution, unit cost, price, salvage value', software: 'Excel, Python' },
  ] },
  'l-when': { kind: 'leaf', title: 'Reorder point and safety stock', methods: [
    { id: 'scm.reorder-point', when: 'Trigger a new order', data: 'Demand rate and lead time', software: 'ERP, Excel' },
    { id: 'scm.safety-stock', when: 'Cover variability for a target service level', data: 'Demand variability, lead time, service target', software: 'Excel, ERP' },
  ] },
  'l-abc': { kind: 'leaf', title: 'ABC classification', methods: [
    { id: 'scm.abc', when: 'Focus control on high-value items', data: 'Annual usage value per item', software: 'Excel, ERP' },
  ] },
  'l-bullwhip': { kind: 'leaf', title: 'Bullwhip effect', methods: [
    { id: 'scm.bullwhip', when: 'Order swings grow upstream', data: 'Orders and demand at each tier', software: 'Excel, the beer game' },
  ] },
}

/** Keep the longest valid prefix of a guide path: each step must be an option of the question before it. */
export function guidePath(raw: string[]): string[] {
  const path = ['root']
  for (const id of raw[0] === 'root' ? raw.slice(1) : raw) {
    const cur = GUIDE[path[path.length - 1]]
    if (cur.kind !== 'q' || !cur.options.some((o) => o.next === id)) break
    path.push(id)
  }
  return path
}

/* ---------------- Confused pairs ---------------- */
export interface Pair { a: string; b: string; diff: string; quiz: { s: string; ans: 'a' | 'b' }[] }
export const PAIRS: Pair[] = [
  { a: 'quality.cp', b: 'quality.cpk', diff: 'Cp compares spec width with process spread only. Cpk also penalises an off-centre mean, so Cpk ≤ Cp; they’re equal only when the process is centred.', quiz: [
    { s: 'You need one number that drops when the mean drifts toward a spec limit.', ans: 'b' }, { s: 'You want the capability the process would have if it were perfectly centred.', ans: 'a' }] },
  { a: 'lean.takt-time', b: 'lean.cycle-time', diff: 'Takt is the pace demand requires (available time ÷ demand). Cycle time is the pace the process actually achieves.', quiz: [
    { s: 'Demand is 480 units over 8 hours of work. What pace must the line hit?', ans: 'a' }, { s: 'A stopwatch shows a unit leaving station 3 every 52 seconds.', ans: 'b' }] },
  { a: 'engecon.npv', b: 'engecon.irr', diff: 'NPV is a dollar value at your MARR; IRR is the rate at which NPV is zero. Between mutually exclusive projects, choose by NPV.', quiz: [
    { s: 'Choose between two mutually exclusive projects of different sizes.', ans: 'a' }, { s: 'Your manager asks what return the project earns, to compare with a 12% hurdle rate.', ans: 'b' }] },
  { a: 'safety.fmea', b: 'safety.fta', diff: 'FMEA works bottom-up from each step’s or component’s failure modes. FTA works top-down from one undesired event to its causes.', quiz: [
    { s: 'List how each of 40 assembly steps could fail and rank them.', ans: 'a' }, { s: 'Compute the probability that the braking system fails to stop the car.', ans: 'b' }] },
  { a: 'or.eoq', b: 'scm.reorder-point', diff: 'EOQ answers how much to order; the reorder point answers when to order.', quiz: [
    { s: 'Each order to the supplier is for 632 units.', ans: 'a' }, { s: 'Stock falls to 300 units and a new order goes out.', ans: 'b' }] },
  { a: 'or.eoq', b: 'or.newsvendor', diff: 'EOQ is for steady, repeating demand. The newsvendor model is for a single order of perishable or seasonal goods before demand is known.', quiz: [
    { s: 'Ordering Christmas trees for one season.', ans: 'b' }, { s: 'Restocking printer paper used every week.', ans: 'a' }] },
  { a: 'reliability.mtbf', b: 'reliability.mttr', diff: 'MTBF is the average time between failures (how often it breaks). MTTR is the average time to repair (how long it stays down).', quiz: [
    { s: 'Pumps run 600 hours on average before they break.', ans: 'a' }, { s: 'A breakdown takes 3 hours to fix on average.', ans: 'b' }] },
  { a: 'quality.control-chart', b: 'quality.cpk', diff: 'A control chart asks whether the process is stable over time (the voice of the process). Cpk asks whether it meets the specification (the voice of the customer).', quiz: [
    { s: 'Did something change on the night shift last week?', ans: 'a' }, { s: 'Will this process meet the customer’s ±0.05 mm tolerance?', ans: 'b' }] },
  { a: 'or.lp', b: 'or.ip', diff: 'Linear programming allows fractional answers. Integer programming forces whole numbers or yes/no choices, and is much harder to solve.', quiz: [
    { s: 'Decide which of 5 warehouses to open.', ans: 'b' }, { s: 'Blend three crude oils into gasoline at minimum cost.', ans: 'a' }] },
  { a: 'or.tsp', b: 'or.vrp', diff: 'TSP: one traveller visits every stop once. VRP: a fleet of capacity-limited vehicles splits the stops between them.', quiz: [
    { s: 'One field technician visits 12 sites today.', ans: 'a' }, { s: 'Eight trucks carrying 20 pallets each deliver to 90 stores.', ans: 'b' }] },
  { a: 'simulation.monte-carlo', b: 'simulation.des', diff: 'Monte Carlo samples uncertain inputs to get a distribution of outcomes, with no flow of time. Discrete-event simulation moves entities through queues and resources over time.', quiz: [
    { s: 'Estimate the range of total project cost from uncertain task costs.', ans: 'a' }, { s: 'Model patients waiting for beds in an emergency department over a week.', ans: 'b' }] },
  { a: 'stats.t-test', b: 'stats.anova', diff: 'A t-test compares two means. ANOVA compares three or more without inflating the false-alarm rate of many separate t-tests.', quiz: [
    { s: 'Compare yield across four suppliers.', ans: 'b' }, { s: 'Did the new fixture change cycle time compared with the old one?', ans: 'a' }] },
  { a: 'doe.full-factorial', b: 'doe.fractional-factorial', diff: 'A full factorial runs every combination. A fractional factorial runs a planned subset to screen many factors, at the cost of confounding some interactions.', quiz: [
    { s: 'Seven two-level factors and a budget of 16 runs (a full design needs 128).', ans: 'b' }, { s: 'Three factors at two levels, 8 runs affordable, every interaction needed.', ans: 'a' }] },
  { a: 'manufacturing.mrp', b: 'lean.kanban', diff: 'MRP pushes work from a forecast-driven schedule. Kanban pulls work only when the next process uses something up.', quiz: [
    { s: 'Plan component orders for the next 12 weeks from the master schedule.', ans: 'a' }, { s: 'A bin empties at the line and its card goes back to the supplying cell.', ans: 'b' }] },
  { a: 'service.capacity-utilization', b: 'lean.oee', diff: 'Utilisation counts how busy a resource is. OEE also counts speed losses and defects, so a busy machine can still have a low OEE.', quiz: [
    { s: 'The press ran 90% of the shift but ran slow and made scrap. Which measure shows the loss?', ans: 'b' }, { s: 'How busy are the nurses compared with their available hours?', ans: 'a' }] },
  { a: 'reliability.pm', b: 'reliability.pdm', diff: 'Preventive maintenance services equipment on a fixed schedule. Predictive maintenance services it when condition data shows failure is near.', quiz: [
    { s: 'Change the gearbox oil every 500 running hours.', ans: 'a' }, { s: 'Replace the bearing when its vibration level starts rising.', ans: 'b' }] },
  { a: 'pm.cpm', b: 'pm.pert', diff: 'CPM uses one fixed duration per task. PERT uses three estimates (optimistic, most likely, pessimistic) to model uncertainty.', quiz: [
    { s: 'Tasks repeat from past builds and their durations are well known.', ans: 'a' }, { s: 'New R&D tasks with best, likely and worst-case guesses.', ans: 'b' }] },
]

/* ---------------- Factory mysteries ---------------- */
export interface Clue { title: string; cols: string[]; rows: (string | number)[][]; note?: string }
export interface MysteryQ { q: string; options: string[]; answer: number; why: string; clue?: number }
export interface Mystery { id: string; title: string; area: string; role: string; brief: string; clues: Clue[]; questions: MysteryQ[]; solution: string; methods: string[] }

export const MYSTERIES: Mystery[] = [
  {
    id: 'tuesday-scrap', title: 'The Tuesday-night scrap spike', area: 'Quality', role: 'Quality engineer, stamping plant',
    brief: 'Scrap at the stamping plant doubled this month. The plant manager wants it fixed, and the first suggestion in the meeting is to buy a new press.',
    clues: [
      { title: 'Scrapped parts by press, last 4 weeks', cols: ['Press', 'Scrapped parts'], rows: [['Press 1', 18], ['Press 2', 22], ['Press 3', 124], ['Press 4', 36], ['Total', 200]] },
      { title: 'Press 3 scrap by shift', cols: ['Shift', 'Scrapped parts'], rows: [['Day', 21], ['Swing', 25], ['Night', 78]] },
      { title: 'Press 3 night-shift scrap by weekday', cols: ['Day', 'Scrapped parts'], rows: [['Mon', 6], ['Tue', 49], ['Wed', 9], ['Thu', 7], ['Fri', 7]], note: 'Maintenance log: Press 3’s die is serviced every Tuesday evening and re-set by the night crew. There is no first-part check after a die re-set.' },
    ],
    questions: [
      { q: 'Where do you start?', options: ['Buy the new press', 'A Pareto of scrap by press', 'A designed experiment on press settings', 'Retrain every operator'], answer: 1, clue: 0, why: 'A Pareto narrows the problem fast: Press 3 makes 124 of 200 scrapped parts, 62%. Spending money before locating the problem is how plants buy the wrong fix.' },
      { q: 'Press 3 makes 62% of the scrap. What next?', options: ['Replace Press 3', 'Stratify Press 3 scrap by shift and by day', 'Run a plant-wide capability study', 'Add a final inspection station'], answer: 1, clue: 1, why: 'Stratifying (slicing the data by shift, day, operator or material) shows when the problem happens, which points at why. Night shift has 78 of Press 3’s 124.' },
      { q: 'Night shift on Tuesdays has 49 of 78 night-shift scrapped parts. What is the most likely cause?', options: ['The night crew is careless', 'A bad material lot arrives every Tuesday', 'The die re-set after Tuesday maintenance', 'The gauge drifts at night'], answer: 2, clue: 2, why: 'Only Press 3, only Tuesday nights, right after maintenance and with no first-part check: the die set-up is the prime suspect. A bad material lot would hit the other presses too.' },
      { q: 'What fix do you propose, and how do you prove it worked?', options: ['Add 100% final inspection on Press 3', 'Standard work and a first-part check after every die re-set, then track Press 3 scrap on a control chart', 'Move maintenance to the day shift and hope', 'Buy the new press after all'], answer: 1, why: 'Fix the cause (an uncontrolled set-up) with standard work and a first-part check, then show the improvement holds with a control chart. Extra inspection finds scrap; it doesn’t stop it.' },
    ],
    solution: 'The die re-set after Tuesday-evening maintenance had no standard method and no first-part check. Standard work plus a first-part check removed the spike; a control chart on Press 3 scrap confirmed the gain held.',
    methods: ['quality.pareto', 'safety.rca', 'lean.standard-work', 'quality.control-chart'],
  },
  {
    id: 'beats-takt', title: 'Every station beats takt, yet we miss demand', area: 'Lean & flow', role: 'Industrial engineer, fabrication line',
    brief: 'The line must ship 420 units per shift. Every station’s cycle time is under takt, but the line keeps falling short. Overtime is becoming routine.',
    clues: [
      { title: 'Shift facts', cols: ['Item', 'Value'], rows: [['Net available time', '7 h = 25,200 s'], ['Demand', '420 units per shift']] },
      { title: 'Stations', cols: ['Station', 'Cycle time (s)', 'Availability'], rows: [['Cut', 50, '95%'], ['Weld', 55, '80%'], ['Paint', 48, '97%'], ['Pack', 40, '98%']], note: 'Weld runs 6 product changeovers per shift.' },
    ],
    questions: [
      { q: 'What is the takt time?', options: ['50 s', '55 s', '60 s', '72 s'], answer: 2, clue: 0, why: 'Takt = 25,200 s ÷ 420 units = 60 s per unit.' },
      { q: 'Which station really limits output?', options: ['Cut', 'Weld', 'Paint', 'Pack'], answer: 1, clue: 1, why: 'Divide cycle time by availability: Weld is 55 ÷ 0.80 = 68.75 s per unit, above the 60 s takt. Cut is 52.6 s, Paint 49.5 s, Pack 40.8 s.' },
      { q: 'How many units can Weld make in a shift?', options: ['About 315', 'About 366', '420', 'About 458'], answer: 1, why: 'Capacity = 25,200 s × 0.80 ÷ 55 s ≈ 366 units, 54 short of demand.' },
      { q: 'What is the best first move?', options: ['Buy a second welder', 'SMED on Weld changeovers to raise its availability', 'Speed up Paint', 'Add inventory before Paint'], answer: 1, why: 'Weld needs availability of at least 420 × 55 ÷ 25,200 ≈ 91.7%. Cutting changeover time with SMED is far cheaper than a second welder, and speeding up a non-bottleneck adds nothing.' },
    ],
    solution: 'Cycle time alone hid the problem: Weld loses 20% of its time to changeovers, so its effective cycle time (68.75 s) is above takt. A SMED project that lifts Weld’s availability above about 92% lets the line meet 420 units without overtime.',
    methods: ['lean.takt-time', 'lean.toc', 'lean.oee', 'lean.smed'],
  },
  {
    id: 'more-stock-more-stockouts', title: 'More inventory, more stockouts', area: 'Supply chain', role: 'Supply chain analyst, spare-parts distributor',
    brief: 'Inventory value rose 30% this year, yet the most important items keep running out. Finance wants inventory cut; sales wants more stock.',
    clues: [
      { title: 'Item classes', cols: ['Class', 'Share of items', 'Share of annual value'], rows: [['A', '10%', '70%'], ['B', '20%', '20%'], ['C', '70%', '10%']] },
      { title: 'Current policy and results', cols: ['Item', 'Value'], rows: [['Ordering', 'Every item ordered every 8 weeks'], ['Safety stock', '4 weeks of average demand, every item'], ['Fill rate, A items', '88% (target 97%)'], ['Fill rate, C items', '99%']] },
      { title: 'Weekly demand variability (coefficient of variation)', cols: ['Class', 'CV'], rows: [['A', 0.6], ['B', 0.4], ['C', 0.2]] },
    ],
    questions: [
      { q: 'What do you analyse first?', options: ['Cut all safety stock by 30%', 'An ABC classification of items by annual value', 'A new forecasting system', 'Weekly cycle counts'], answer: 1, clue: 0, why: 'ABC shows where the money and the risk are: 10% of items carry 70% of the value. One policy for every item rarely fits all three classes.' },
      { q: 'Why do A items run out while total stock is high?', options: ['Suppliers are late', 'A flat 4-week safety stock ignores demand variability', 'A items are too expensive to stock', 'The warehouse is too small'], answer: 1, clue: 2, why: 'Safety stock should grow with demand variability and the service target. A items vary most (CV 0.6) and get too little buffer; steady C items (CV 0.2) get far too much, which inflates total inventory.' },
      { q: 'Which policy change fits?', options: ['Same rule, 6 weeks of safety stock', 'Safety stock per item from its variability and service target; review A items weekly; order C items in larger, less frequent lots', 'Stop stocking C items', 'Order everything weekly'], answer: 1, why: 'Differentiated policies put buffer where variability and value are, and stop wasting money on steady, cheap C items.' },
      { q: 'Ordering every 8 weeks also makes upstream orders swing. What effect is that?', options: ['Bullwhip effect', 'Little’s law', 'Learning curve', 'Pareto principle'], answer: 0, clue: 1, why: 'Order batching is a classic cause of the bullwhip effect: suppliers see big, lumpy orders instead of steady demand, and they buffer for it.' },
    ],
    solution: 'One flat policy fitted none of the classes. Setting safety stock from each item’s variability and service target, reviewing A items weekly and batching C items raised A-item fill rates while total inventory fell.',
    methods: ['scm.abc', 'scm.safety-stock', 'scm.reorder-point', 'scm.bullwhip'],
  },
]

/* ---------------- Tool cards ---------------- */
export type Cost = 'Free and open source' | 'Free version available' | 'Commercial, free academic licence' | 'Commercial'
export interface Tool { id: string; name: string; kind: string; cost: Cost; costNote: string; curve: 1 | 2 | 3 | 4 | 5; bestAt: string; roles: string[]; lessons: string[]; site: string; alt?: string }
export const TOOLS: Tool[] = [
  { id: 'excel', name: 'Excel', kind: 'Spreadsheet', cost: 'Commercial', costNote: 'Microsoft 365; a free web version needs a Microsoft account', curve: 1, bestAt: 'Quick models, Solver, pivot tables, charts', roles: ['Every IE role'], lessons: ['or.lp', 'engecon.npv'], site: 'https://www.microsoft.com/microsoft-365/excel', alt: 'Google Sheets, LibreOffice Calc' },
  { id: 'python', name: 'Python', kind: 'Programming', cost: 'Free and open source', costNote: 'With pandas, NumPy, SciPy, scikit-learn', curve: 3, bestAt: 'Data analysis, automation, optimisation and ML in one language', roles: ['Data Analyst', 'Operations Research Analyst', 'Process Engineer'], lessons: ['datasci.pandas', 'datasci.random-forest'], site: 'https://www.python.org' },
  { id: 'sql', name: 'SQL', kind: 'Database language', cost: 'Free and open source', costNote: 'Free databases include PostgreSQL and SQLite', curve: 2, bestAt: 'Pulling and joining production, quality and ERP data', roles: ['Data Analyst', 'Supply Chain Analyst', 'Industrial Engineer'], lessons: ['datasci.sql'], site: 'https://www.postgresql.org' },
  { id: 'minitab', name: 'Minitab', kind: 'Statistics', cost: 'Commercial', costNote: 'Free trial available', curve: 2, bestAt: 'SPC, capability, Gage R&R, DOE: the Six Sigma standard', roles: ['Quality Engineer', 'Process Engineer', 'Continuous Improvement Engineer'], lessons: ['quality.control-chart', 'quality.gage-rr'], site: 'https://www.minitab.com', alt: 'JMP, Python' },
  { id: 'jmp', name: 'JMP', kind: 'Statistics', cost: 'Commercial, free academic licence', costNote: 'Free JMP Student Edition', curve: 2, bestAt: 'Interactive DOE and data exploration; common in semiconductor fabs', roles: ['Process Engineer (Semiconductor)', 'Quality Engineer'], lessons: ['doe.full-factorial', 'doe.rsm'], site: 'https://www.jmp.com', alt: 'Minitab, Python' },
  { id: 'powerbi', name: 'Power BI', kind: 'Dashboards', cost: 'Free version available', costNote: 'Desktop app is free; sharing needs a paid licence', curve: 2, bestAt: 'KPI dashboards from ERP, MES and spreadsheets', roles: ['Data Analyst', 'Operations Engineer'], lessons: ['datasci.power-bi', 'lean.oee'], site: 'https://www.microsoft.com/power-platform/products/power-bi', alt: 'Tableau' },
  { id: 'tableau', name: 'Tableau', kind: 'Dashboards', cost: 'Free version available', costNote: 'Free Tableau Public (published work is public)', curve: 2, bestAt: 'Visual analytics and storytelling with data', roles: ['Data Analyst', 'Business Intelligence Analyst'], lessons: ['datasci.power-bi'], site: 'https://public.tableau.com', alt: 'Power BI' },
  { id: 'gurobi', name: 'Gurobi', kind: 'Optimisation solver', cost: 'Commercial, free academic licence', costNote: 'Free licences for students and academics', curve: 3, bestAt: 'Large LP and MILP models in production planning and logistics', roles: ['Operations Research Analyst', 'Optimization Engineer'], lessons: ['or.gurobi', 'or.ip'], site: 'https://www.gurobi.com', alt: 'OR-Tools, PuLP with CBC' },
  { id: 'ortools', name: 'OR-Tools', kind: 'Optimisation library', cost: 'Free and open source', costNote: 'From Google; Python, C++, Java, C#', curve: 3, bestAt: 'Routing (VRP), scheduling and assignment problems', roles: ['Operations Research Analyst', 'Logistics Engineer'], lessons: ['or.vrp', 'or.or-tools'], site: 'https://developers.google.com/optimization', alt: 'Gurobi' },
  { id: 'pulp', name: 'PuLP', kind: 'Optimisation modelling', cost: 'Free and open source', costNote: 'Python modelling with the free CBC solver', curve: 2, bestAt: 'Learning to write LP and MILP models in Python', roles: ['Operations Research Analyst', 'Industrial Engineer'], lessons: ['or.lp'], site: 'https://coin-or.github.io/pulp/', alt: 'Pyomo, Gurobi' },
  { id: 'simpy', name: 'SimPy', kind: 'Simulation library', cost: 'Free and open source', costNote: 'Discrete-event simulation in Python', curve: 3, bestAt: 'Code-based simulation of queues and production lines', roles: ['Simulation Engineer', 'Industrial Engineer'], lessons: ['simulation.des'], site: 'https://simpy.readthedocs.io', alt: 'Arena, FlexSim' },
  { id: 'arena', name: 'Arena', kind: 'Simulation', cost: 'Commercial, free academic licence', costNote: 'Free student edition', curve: 3, bestAt: 'Flowchart-style discrete-event models; common in IE courses', roles: ['Simulation Engineer', 'Industrial Engineer'], lessons: ['simulation.des'], site: 'https://www.rockwellautomation.com/en-us/products/software/arena-simulation.html', alt: 'FlexSim, SimPy' },
  { id: 'flexsim', name: 'FlexSim', kind: 'Simulation', cost: 'Free version available', costNote: 'Free FlexSim Express with model-size limits', curve: 3, bestAt: '3D factory and warehouse models that managers understand', roles: ['Simulation Engineer', 'Manufacturing Engineer'], lessons: ['simulation.des', 'simulation.digital-twin'], site: 'https://www.flexsim.com', alt: 'AnyLogic, Arena' },
  { id: 'anylogic', name: 'AnyLogic', kind: 'Simulation', cost: 'Free version available', costNote: 'Free Personal Learning Edition', curve: 4, bestAt: 'Mixing discrete-event, agent-based and system-dynamics models', roles: ['Simulation Engineer', 'Supply Chain Analyst'], lessons: ['simulation.des'], site: 'https://www.anylogic.com', alt: 'FlexSim' },
  { id: 'solidworks', name: 'SolidWorks', kind: 'CAD', cost: 'Commercial, free academic licence', costNote: 'Student licences usually come through your school', curve: 3, bestAt: '3D parts, assemblies and drawings for fixtures and tooling', roles: ['Manufacturing Engineer', 'Mechanical Design Engineer'], lessons: ['automation.solidworks'], site: 'https://www.solidworks.com', alt: 'Fusion 360, FreeCAD' },
  { id: 'autocad', name: 'AutoCAD', kind: 'CAD (2D)', cost: 'Commercial, free academic licence', costNote: 'Free educational licence from Autodesk', curve: 2, bestAt: 'Facility layouts and 2D drawings', roles: ['Industrial Engineer', 'Facilities Planning Engineer'], lessons: ['facilities.slp'], site: 'https://www.autodesk.com/products/autocad', alt: 'LibreCAD' },
  { id: 'matlab', name: 'MATLAB', kind: 'Numerical computing', cost: 'Commercial, free academic licence', costNote: 'Many universities provide a campus licence', curve: 3, bestAt: 'Control systems, signal processing, Simulink models', roles: ['Controls Engineer', 'Systems Engineer'], lessons: ['automation.fea'], site: 'https://www.mathworks.com/products/matlab.html', alt: 'Python, Octave' },
  { id: 'sap', name: 'SAP S/4HANA', kind: 'ERP', cost: 'Commercial', costNote: 'Enterprise software; usually learned on the job or through university programmes', curve: 4, bestAt: 'MRP, purchasing, inventory and production orders across a company', roles: ['Production Planner', 'Supply Chain Analyst'], lessons: ['manufacturing.erp', 'manufacturing.mrp'], site: 'https://www.sap.com/products/erp/s4hana.html', alt: 'Oracle, Microsoft Dynamics' },
  { id: 'msproject', name: 'Microsoft Project', kind: 'Project scheduling', cost: 'Commercial', costNote: 'Free alternatives exist', curve: 2, bestAt: 'Gantt charts, critical path, resource levelling', roles: ['Project Engineer', 'Project Manager'], lessons: ['pm.cpm', 'pm.gantt'], site: 'https://www.microsoft.com/microsoft-365/project/project-management-software', alt: 'ProjectLibre, Smartsheet' },
  { id: 'plc', name: 'Studio 5000 / TIA Portal', kind: 'PLC programming', cost: 'Commercial', costNote: 'Rockwell and Siemens tools; free simulators and trial versions exist', curve: 4, bestAt: 'Ladder logic for Allen-Bradley and Siemens PLCs', roles: ['Controls Engineer', 'Automation Engineer'], lessons: ['automation.plc', 'automation.ladder-logic'], site: 'https://www.rockwellautomation.com/en-us/products/software/factorytalk/designsuite/studio-5000.html', alt: 'CODESYS' },
]

/* ---------------- Spot the waste ---------------- */
export const WASTES = ['Transportation', 'Inventory', 'Motion', 'Waiting', 'Overproduction', 'Over-processing', 'Defects', 'Skills (unused talent)'] as const
export type Waste = (typeof WASTES)[number]
// seen: what anyone can observe at the spot, written for screen-reader users too. It must not name the waste.
export interface Hotspot { id: string; label: string; x: number; y: number; waste: Waste; seen: string; why: string }
// x, y: centre of the hotspot as a percentage of the scene's width and height.
export const HOTSPOTS: Hotspot[] = [
  { id: 'forklift', label: 'Forklift route', x: 17, y: 82, waste: 'Transportation', seen: 'A forklift carries each batch from one end of the cell to the far end and back again between steps.', why: 'Parts travel the length of the floor and back between steps. Moving material adds cost and damage risk but no value.' },
  { id: 'crates', label: 'Crates between stations', x: 37, y: 37, waste: 'Inventory', seen: 'Six full crates of half-finished housings are stacked between the polishing station and the machine.', why: 'Piles of parts between stations hide problems, tie up cash and stretch lead time (Little’s law).' },
  { id: 'cabinet', label: 'Path to the tool cabinet', x: 88, y: 20, waste: 'Motion', seen: 'The tool cabinet stands on the far wall. A dotted path runs to it from the machine, and the operator walks it at every changeover.', why: 'The operator walks across the cell for tools every changeover. Tools belong at the point of use.' },
  { id: 'operator', label: 'Operator beside the machine', x: 61, y: 37, waste: 'Waiting', seen: 'The machine shows AUTO and is running its cycle. The operator stands beside it with nothing to do until the cycle ends.', why: 'The operator stands and watches an automatic cycle. People waiting on machines (or the reverse) is time that adds nothing.' },
  { id: 'board', label: 'Production board', x: 85, y: 64, waste: 'Overproduction', seen: 'Today’s production board reads: ordered 20, built 60.', why: 'Built 60, ordered 20: making more, or sooner, than the customer needs. The worst waste, because it causes the others.' },
  { id: 'polish', label: 'Polishing station', x: 15, y: 30, waste: 'Over-processing', seen: 'Each housing gets three polishing coats, labelled coat 1, coat 2 and coat 3. The customer drawing calls for one.', why: 'Three polishing coats where the customer spec asks for one: more work than the customer values.' },
  { id: 'rework', label: 'Rework bench', x: 51, y: 82, waste: 'Defects', seen: 'A bench labelled Rework holds four housings, each marked with a red cross.', why: 'Rework and scrap consume time and material twice. Fix the cause upstream instead of inspecting it out.' },
  { id: 'suggestion', label: 'Suggestion box', x: 66, y: 72, waste: 'Skills (unused talent)', seen: 'A box labelled ideas sits on a post, shut with a padlock. Nothing shows that anyone ever empties it.', why: 'A locked suggestion box with no one reading it: the people closest to the work aren’t being asked how to improve it.' },
]
