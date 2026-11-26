import type { Citation, Concept, Review } from '../../types'

// V3 depth batch for Operations Research. Merged over the base lessons in src/content/index.ts.
// Every worked example below is recomputed independently (brute force, vertex enumeration or an
// exact algorithm) in src/lib/or.test.ts. Scenarios are illustrative, not documented events.
// Interview questions are original practice questions written for this site; none is reported from an employer.
const ON = '2026-11-26'
const BY = 'AI-assisted (Claude); not expert-reviewed'
const math = (note: string): Review => ({ status: 'math-validated', on: ON, by: BY, note })
const identified = (note: string): Review => ({ status: 'source-identified', on: ON, by: BY, note })
const ill = (where: string, story: string) => ({ where, story, kind: 'illustrative' as const })
const TESTED = 'Worked numbers are recomputed independently in src/lib/or.test.ts.'
const SEARCHED = 'Solver documentation was matched against the search engine’s copy of each page; the pages were not opened here.'

const G = 'https://docs.gurobi.com/projects/optimizer/en'
const PI: Citation = { src: 'gurobi-reference', url: `${G}/13.0/reference/attributes/constraintlinear.html`, section: 'Linear constraint attributes: Pi', supports: 'Pi is the constraint dual value, also called the shadow price, available for continuous models' }
const RC: Citation = { src: 'gurobi-reference', url: `${G}/10.0/reference/attributes/variable.html`, section: 'Variable attributes: RC', supports: 'RC is the reduced cost of a variable in the current solution, available only for continuous models' }
const GAP: Citation = { src: 'gurobi-reference', url: 'https://gurobi.com/documentation/11.0/refman/mipgap2.html', section: 'Parameters: MIPGap', supports: 'The solver stops when the relative gap between the best solution and the best bound falls below MIPGap (default 1e-4)' }
const BB: Citation = { src: 'gurobi-mip-basics', section: 'Mixed Integer Programming Basics', supports: 'LP-based branch and bound drops the integrality restrictions to get the LP relaxation, branches on fractional variables and discards nodes whose relaxation is infeasible or cannot beat the incumbent' }
const OT = 'https://developers.google.com/optimization'
const ASSIGN: Citation = { src: 'ortools-guides', url: `${OT}/assignment`, section: 'Assignment', supports: 'In the assignment problem each worker does at most one task and each task is done by one worker, minimizing total cost' }
const ROUTE: Citation = { src: 'ortools-guides', url: `${OT}/routing`, section: 'Vehicle routing', supports: 'The TSP is the routing problem with one vehicle; for large instances the routing solver may return good solutions that are not proven optimal' }
const VRP: Citation = { src: 'ortools-guides', url: `${OT}/routing/vrp`, section: 'Vehicle Routing Problem', supports: 'VRPs generalize the TSP to a fleet and are intractable to solve exactly at scale, so heuristics and search are used' }
const FLOW: Citation = { src: 'ortools-guides', url: `${OT}/flow`, section: 'Network flows', supports: 'Max flow finds the most flow from source to sink within arc capacities; min cost flow meets supplies and demands at least cost' }
const KNAP: Citation = { src: 'ortools-guides', url: `${OT}/pack/knapsack`, section: 'The Knapsack Problem', supports: 'The knapsack problem packs a subset of items with values and sizes into a container of fixed capacity to maximize total value' }

// The table-and-chair LP used through the LP lessons: max 30x + 40y, 2x + 4y ≤ 80 (assembly h), 3x + 2y ≤ 60 (machining h).
const LP_TEXT = 'Tables earn $30 and chairs $40. Assembly: 2 h per table and 4 h per chair, 80 h available. Machining: 3 h per table and 2 h per chair, 60 h available.'

export const OR_V3: Record<string, Partial<Concept>> = {
  'or.lp': {
    objectives: ['Turn a word problem into decision variables, an objective and constraints', 'Solve a two-variable LP by checking corner points', 'Read which constraints are binding and say what that means for the plant'],
    assumptions: ['Proportionality: profit and resource use scale linearly with each decision', 'Additivity: no interaction terms between products', 'Divisibility: fractional answers are acceptable (otherwise use integer programming)', 'Certainty: every coefficient is known; test the plan with sensitivity analysis'],
    mistakes: ['Writing a constraint in the wrong units (hours per unit against units per hour)', 'Forgetting non-negativity, so the solver “makes” negative chairs', 'Trusting the optimum without checking it on a case small enough to solve by hand', 'Reporting only the plan, without which resources are binding and what extra capacity is worth'],
    real: ill('Furniture shop weekly plan', 'A planner builds the weekly mix in a spreadsheet LP. Both assembly and machining come out binding, so she takes the shadow prices to the supervisor: an overtime hour in assembly is worth more than one in machining, and that decides where the overtime goes.'),
    iq: [
      { q: 'Formulate an LP for blending animal feed at minimum cost.', a: 'Variables: pounds of each ingredient. Objective: minimize Σ cost × pounds. Constraints: total weight equals the batch size; each nutrient (protein, fat, fiber) within its min/max, written as Σ nutrient content × pounds ≥ or ≤ the limit times batch weight; ingredient availability limits; non-negativity. Then check the shadow prices to see which nutrient limits are driving cost.', type: 'technical',
        hint: 'Start with “what can I choose?”, then “what am I paying?”, then list every rule the blend must obey.',
        followUps: ['How would you handle an ingredient that can only be bought in 50 lb bags?', 'The model says use zero corn. How do you check whether that is real or a data error?'],
        rubric: ['Defines variables with units (pounds of each ingredient)', 'Writes a cost objective', 'Writes nutrient constraints as ratios of the batch, not fixed pounds', 'Includes availability and non-negativity', 'Mentions validating the result or reading shadow prices'] },
      { q: 'What are the assumptions of linear programming, and which one breaks most often in practice?', a: 'Proportionality, additivity, divisibility and certainty. Certainty breaks most often: demand, yields and run rates are estimates. I handle it with sensitivity analysis on the coefficients that matter and, if needed, scenarios or stochastic programming. Divisibility breaks when decisions are trucks or machines, which calls for integer variables.', type: 'conceptual',
        followUps: ['Give an example where additivity fails.', 'How would you show a manager that the plan is robust to a 10% error in demand?'],
        rubric: ['Names all four assumptions', 'Picks one and gives a concrete plant example', 'Offers a remedy (sensitivity, scenarios, integer variables)'] },
    ],
    teachBack: { prompt: 'Explain to a new planner what a linear program is, using a product-mix example of your own.', points: ['Decision variables: what we choose, with units', 'One objective to maximize or minimize', 'Constraints from limited resources or requirements', 'The best answer sits at a corner of the feasible region', 'Read binding constraints and shadow prices, not just the plan'] },
    review: math(`The $900 product-mix example is recomputed by vertex enumeration. ${TESTED}`),
  },

  'or.feasible-region': {
    why: 'Seeing the feasible region explains everything else in LP: why the optimum is at a corner, why a new constraint can move it, and why a model can be infeasible or unbounded.',
    objectives: ['Draw the feasible region of a two-variable LP', 'Find its corner points and evaluate the objective at each', 'Tell infeasible, unbounded and redundant constraints apart'],
    example: {
      q: `${LP_TEXT} Sales says it can sell at most 12 chairs. Find the new best plan.`,
      steps: ['Add y ≤ 12 to 2x + 4y ≤ 80 and 3x + 2y ≤ 60.', 'The old optimum (10, 15) breaks y ≤ 12, so it is cut off.', 'New corners: (0, 0), (20, 0), (0, 12) and where y = 12 meets machining: 3x + 24 = 60 → x = 12.', 'Check (12, 12) against assembly: 24 + 48 = 72 ≤ 80, so assembly now has 8 h of slack.', 'Profits: $600 at (20, 0); $480 at (0, 12); 30·12 + 40·12 = $840 at (12, 12).'],
      a: 'Make 12 tables and 12 chairs for $840; machining and the chair limit are binding, and assembly has 8 h spare.',
      so: 'A market limit changed which resource is the bottleneck: assembly overtime is now worth nothing.',
      check: { value: 840, compute: () => 30 * 12 + 40 * 12 },
    },
    mistakes: ['Shading the wrong side of a ≥ constraint', 'Checking only the corners on the axes', 'Calling a model “unbounded” when a constraint was simply forgotten'],
    real: ill('Promotion planning', 'Marketing caps a product at what the stores can display. Adding that cap to the planning model moves the optimum to a new corner and frees capacity in a department that used to be the bottleneck.'),
    iq: [
      { q: 'Your LP solver reports “infeasible.” How do you find out why?', a: 'Ask the solver for an irreducible infeasible subsystem (IIS), the smallest set of constraints that cannot hold together. Then check those for unit errors, a wrong inequality direction or a demand larger than total capacity. A practical fix is to add slack variables with a penalty, so the model tells you how far short each requirement falls.', type: 'troubleshooting',
        hint: 'You want the smallest group of constraints that conflict.',
        followUps: ['What is the risk of adding penalized slack to every constraint?', 'How would you explain an infeasible plan to a production manager?'],
        rubric: ['Mentions IIS or isolating the conflicting constraints', 'Lists likely causes (units, sign, demand above capacity)', 'Offers penalized slack or elastic constraints', 'Talks about communicating the shortfall'] },
    ],
    review: math(`The corner-point example with the chair limit is recomputed by vertex enumeration. ${TESTED}`),
  },

  'or.simplex': {
    why: 'Knowing what the simplex method does lets you read solver output (basis, pivots, reduced costs) and explain why the optimum is a corner and why the final tableau already contains the shadow prices.',
    objectives: ['Describe a pivot: entering variable, ratio test, leaving variable', 'Run two pivots of the simplex method by hand on a small LP', 'Read the shadow prices from the final objective row'],
    example: {
      q: `${LP_TEXT} Solve it with the simplex method, starting from making nothing.`,
      steps: ['Start: x = y = 0, slacks s₁ = 80 and s₂ = 60, profit 0.', 'Pivot 1: y has the larger profit (40), so it enters. Ratio test: 80/4 = 20 and 60/2 = 30, so s₁ leaves; y = 20, profit $800. Now profit = 800 + 10x − 10s₁.', 'Pivot 2: x still improves profit (+10 per table), so it enters. Ratio test on y = 20 − 0.5x and s₂ = 20 − 2x gives x = 10; s₂ leaves.', 'Now x = 10, y = 15 and profit = 900 − 7.5s₁ − 5s₂: no variable improves profit, so stop.'],
      a: 'Two pivots reach x = 10, y = 15 and $900; the final row shows shadow prices of $7.50 per assembly hour and $5 per machining hour.',
      so: 'The path visits corners (0, 0) → (0, 20) → (10, 15), each better than the last.',
      check: { value: 900, compute: () => 800 + 10 * 10 },
    },
    mistakes: ['Picking the leaving variable by the largest ratio instead of the smallest', 'Stopping while a variable still has a positive coefficient in the profit row', 'Thinking the simplex method searches every corner'],
    iq: [
      { q: 'What does the ratio test in the simplex method protect against?', a: 'It picks the constraint that runs out first as the entering variable grows, so every other basic variable stays non-negative and the solution stays feasible. Using any larger ratio would push some variable below zero.', type: 'conceptual',
        followUps: ['What does it mean if no ratio is positive?', 'What is degeneracy, and why can it cause cycling?'],
        rubric: ['Says it keeps the solution feasible', 'Explains smallest ratio = first resource to run out', 'Links no positive ratio to an unbounded LP'] },
    ],
    teachBack: { prompt: 'Explain one pivot of the simplex method to a classmate who knows only the graphical method.', points: ['A basic solution is a corner of the feasible region', 'The entering variable is one that improves the objective', 'The ratio test finds the first constraint to bind', 'A pivot moves along an edge to the next corner', 'Stop when no variable can improve the objective'] },
    review: math(`The two-pivot example is checked against the vertex optimum and the dual solution. ${TESTED}`),
  },

  'or.duality': {
    why: 'Duality turns “how much should we make?” into “what is each resource worth?” Those resource prices drive capacity, overtime and make-or-buy decisions, and they give a certificate that a solution is optimal.',
    objectives: ['Write the dual of a small maximization LP', 'Solve the dual and confirm strong duality', 'Use complementary slackness to reason about which constraints bind'],
    formula: { tex: '\\max\\,c^\\top x\\ \\text{s.t.}\\ Ax\\le b,\\ x\\ge 0\\quad\\Longleftrightarrow\\quad \\min\\,b^\\top u\\ \\text{s.t.}\\ A^\\top u\\ge c,\\ u\\ge 0', vars: [['u', 'price of each resource (shadow price)'], ['b', 'resources available'], ['c', 'profit per unit of each product']] },
    example: {
      q: `${LP_TEXT} Write and solve the dual, where u = value of an assembly hour and v = value of a machining hour.`,
      steps: ['Dual: minimize 80u + 60v subject to 2u + 3v ≥ 30 (a table’s hours are worth at least its profit), 4u + 2v ≥ 40 (same for a chair), u, v ≥ 0.', 'Both products are made at the primal optimum, so both dual constraints hold with equality.', 'Solve 2u + 3v = 30 and 4u + 2v = 40: v = 5, u = 7.5.', 'Dual objective: 80 × 7.5 + 60 × 5 = $900.'],
      a: 'An assembly hour is worth $7.50 and a machining hour $5; the dual optimum is $900, equal to the primal profit.',
      so: 'Equal primal and dual values prove both solutions are optimal, without trusting the solver.',
      check: { value: 900, compute: () => 80 * 7.5 + 60 * 5 },
    },
    assumptions: ['The primal has an optimal solution (then the dual does too, with the same value)', 'For a maximization with ≤ constraints the dual prices are non-negative; sign conventions differ between solvers'],
    mistakes: ['Mixing up which dual constraints are ≥ and which are ≤', 'Reading a dual value as valid for any size of change (it holds only within the allowable range)', 'Copying solver duals without checking the sign convention'],
    iq: [
      { q: 'A colleague’s model makes no chairs, yet the chair’s dual constraint holds with equality. Is that a problem?', a: 'Not necessarily. Complementary slackness says that if a product is made its dual constraint must be tight, not the reverse. A tight constraint with zero production means the chair earns exactly what its resources are worth: a tie, so another optimal plan that makes chairs may exist.', type: 'analytical',
        hint: 'Complementary slackness is an “if”, not an “if and only if”.',
        followUps: ['How would you find the alternative optimum?', 'What does the chair’s reduced cost equal here?'],
        rubric: ['States complementary slackness correctly', 'Recognizes degeneracy or alternative optima', 'Links the tight constraint to a zero reduced cost'] },
    ],
    teachBack: { prompt: 'Explain the dual of a product-mix LP using the idea of a buyer who wants to rent the factory’s resources.', points: ['Dual variables are prices for each resource', 'Each product’s resources must be priced at least at its profit', 'The buyer minimizes the total rent', 'At the optimum rent equals the best profit (strong duality)', 'A resource with slack has a price of zero'] },
    cites: [PI],
    review: math(`The dual solution and strong duality are recomputed in the tests. Pi’s meaning: ${SEARCHED}`),
  },

  'or.shadow-price': {
    objectives: ['Compute a shadow price by re-solving with one more unit of a resource', 'Explain why a constraint with slack has a shadow price of zero', 'Use a shadow price to accept or reject an overtime or rental offer'],
    example: {
      q: `${LP_TEXT} What is one extra assembly hour worth?`,
      steps: ['Re-solve with 81 assembly hours: 2x + 4y = 81 and 3x + 2y = 60.', 'From the second, x = (60 − 2y)/3; substituting gives y = 15.375 and x = 9.75.', 'Profit = 30 × 9.75 + 40 × 15.375 = $907.50.', 'Increase over the $900 plan: $7.50.'],
      a: 'One more assembly hour adds $7.50 of profit, so pay no more than $7.50 for it.',
      so: 'The value matches the dual price u = 7.5 and holds while assembly hours stay between 40 and 120 (see sensitivity analysis).',
      check: { value: 7.5, compute: () => 30 * 9.75 + 40 * 15.375 - 900 },
    },
    assumptions: ['Valid only within the allowable range of the right-hand side', 'Describes a one-at-a-time change; changing two resources at once needs a re-solve', 'Not directly available for integer models, where duals are not defined in the same way'],
    mistakes: ['Applying the shadow price to a large capacity increase beyond the allowable range', 'Treating a shadow price as the market cost of the resource', 'Reading MIP “duals” as if they were LP shadow prices'],
    real: ill('Overtime decision', 'A supervisor is offered weekend overtime on the test bench at $40 an hour. The plan’s shadow price for test hours is $65 and the allowable increase is 16 h, so he books 16 hours, not the 40 the vendor suggested.'),
    iq: [
      { q: 'A constraint has slack. What is its shadow price, and what does that mean?', a: 'Zero. The resource isn’t fully used at the optimum, so more of it wouldn’t change the best plan — spending money to expand it is wasted.', type: 'technical',
        followUps: ['Can a binding constraint also have a zero shadow price?', 'How would the answer change for a ≥ demand constraint?'],
        rubric: ['Says zero', 'Explains unused capacity', 'Draws the business consequence (don’t buy more)'] },
      { q: 'Overtime in a bottleneck costs $12 an hour and its shadow price is $18 with an allowable increase of 20 h. How much overtime would you buy, and what would you check first?', a: 'Up to 20 h, gaining about $6 an hour, roughly $120. Beyond 20 h the shadow price is no longer guaranteed, so I would re-solve before buying more. First I would confirm the model’s hour data, that demand exists for the extra output and that overtime doesn’t create a new bottleneck downstream.', type: 'decision',
        hint: 'Compare the cost with the value, then remember the range.',
        followUps: ['What would you do if the overtime supplier insists on a 30-hour minimum?'],
        rubric: ['Compares $12 with $18 and finds a $6/h gain', 'Limits the purchase to the allowable increase', 'Plans to re-solve beyond the range', 'Checks data, demand and downstream effects'] },
    ],
    teachBack: { prompt: 'Explain shadow price to a plant manager who wants to know whether to rent a second machine.', points: ['It is the gain in the objective per extra unit of a resource', 'It is zero for a resource that is not fully used', 'It only holds within an allowable range', 'Compare it with what the extra unit costs'] },
    cites: [PI],
    review: math(`The re-solve with 81 hours is recomputed in the tests. Pi’s meaning: ${SEARCHED}`),
  },

  'or.sensitivity': {
    why: 'Model inputs are estimates. Sensitivity analysis tells you which estimates can be wrong without changing the plan and which ones you must get right, before anyone acts on the result.',
    objectives: ['Find the range of a right-hand side over which a shadow price holds', 'Find the range of an objective coefficient over which the plan stays optimal', 'Explain reduced cost for a product that is not made'],
    example: {
      q: `${LP_TEXT} (a) Over what range of assembly hours does the $7.50 shadow price hold? (b) How low can the table profit fall before the plan (10, 15) changes?`,
      steps: ['(a) With b assembly hours, solving the two binding constraints gives x = (120 − b)/4 and y = (3b − 120)/8.', 'Both must stay ≥ 0: b ≤ 120 and b ≥ 40.', '(b) The corner stays optimal while the profit line’s slope lies between the two constraint slopes: 2/4 ≤ c₁/40 ≤ 3/2.', 'So 20 ≤ c₁ ≤ 60.'],
      a: 'The shadow price holds from 40 to 120 assembly hours, and the plan stays optimal while the table profit is between $20 and $60.',
      so: 'If the table profit estimate of $30 could really be $25, the plan is safe; at $18 it is not.',
      check: { value: 20, compute: () => (2 / 4) * 40 },
    },
    mistakes: ['Changing two coefficients at once and trusting one-at-a-time ranges', 'Reading reduced cost as a cost rather than the improvement a variable needs', 'Skipping sensitivity analysis because the solver said “optimal”'],
    iq: [
      { q: 'What is the reduced cost of a product that the optimal plan does not make?', a: 'How much its objective coefficient must improve before making it becomes worthwhile, equal to the value of the resources it would use minus its profit. A product with a reduced cost of $4 needs $4 more profit per unit (or less resource use) to enter the plan.', type: 'conceptual',
        followUps: ['What is the reduced cost of a product that is made?', 'Why does a MIP solver not report reduced costs in the same way?'],
        rubric: ['Defines it as the needed improvement', 'Relates it to resource prices', 'Says a product in the plan has zero reduced cost'] },
      { q: 'The plan is optimal, but the demand forecast could be 15% off. How do you show the planner whether to worry?', a: 'Check whether a 15% change stays inside the allowable ranges for the demand right-hand sides and the coefficients it affects. If it does, the same constraints stay binding and the shadow prices still hold. If not, re-solve the high and low scenarios and compare the plans and profits. Present the two or three numbers that would change the decision.', type: 'scenario',
        rubric: ['Uses allowable ranges first', 'Re-solves scenarios outside the range', 'Summarizes what would change the decision'] },
    ],
    cites: [RC],
    review: math(`Both ranges are recomputed in the tests. Reduced cost meaning: ${SEARCHED}`),
  },

  'or.ip': {
    why: 'Many decisions are whole numbers or yes/no. Rounding an LP answer can break constraints or miss the best plan, so integer programming is how you get a plan you can actually carry out.',
    objectives: ['Explain why rounding an LP solution can fail', 'Formulate yes/no decisions with binary variables', 'Find an integer optimum on a small problem and compare it with the LP bound'],
    example: {
      q: 'A shop chooses x small presses ($5k profit each) and y large presses ($8k each). Floor space: x + y ≤ 6 bays. Power: 5x + 9y ≤ 45 kW. Find the best whole-number plan.',
      steps: ['The LP relaxation gives x = 2.25, y = 3.75 and $41.25k: not buildable.', 'Rounding to (2, 4) needs 10 + 36 = 46 kW: infeasible.', 'Rounding down to (2, 3) gives only $34k.', 'Checking all whole-number plans, the best is x = 0, y = 5: 45 kW, 5 bays, $40k.'],
      a: 'Buy 0 small and 5 large presses for $40k; the LP bound of $41.25k shows no integer plan can do better than that.',
      so: 'The integer optimum is not next to the LP optimum: rounding would have lost money or broken the power limit.',
      check: { value: 40, compute: () => 5 * 0 + 8 * 5 },
    },
    assumptions: ['Integrality is required by the decision itself (people, machines, open/closed), not just preferred', 'Solve time can grow quickly with the number of integer variables'],
    mistakes: ['Rounding the LP answer and calling it optimal', 'Using integer variables for large quantities where rounding a continuous answer is harmless', 'Forgetting that the LP relaxation is a bound, not a feasible plan'],
    real: ill('Forklift fleet', 'A warehouse models forklift purchases as continuous and gets 3.6 trucks. Rounding up breaks the budget; the integer model chooses 3 trucks plus a rental option for peaks.'),
    iq: [
      { q: 'Why can’t you just round the LP solution of an integer problem?', a: 'Rounding can violate constraints, and even a feasible rounded point can be far from the integer optimum. In a two-press example the LP says 2.25 and 3.75; rounding gives an infeasible (2, 4) or a weak (2, 3), while the true best is (0, 5). Integer methods such as branch and bound search the whole-number plans while using the LP as a bound.', type: 'conceptual',
        followUps: ['When is rounding acceptable?', 'Which network problems give integer LP solutions automatically?'],
        rubric: ['Infeasibility after rounding', 'Suboptimality after rounding', 'Mentions the LP relaxation as a bound', 'Names branch and bound or a solver'] },
    ],
    teachBack: { prompt: 'Explain to a supervisor why the optimizer says “5 large presses” when the spreadsheet said “2.25 small and 3.75 large”.', points: ['Presses come in whole numbers', 'Rounding can break the power or space limit', 'The integer search checks whole-number plans', 'The LP answer is an upper bound on what is possible'] },
    cites: [BB],
    review: math(`The integer optimum is recomputed by enumerating every whole-number plan. ${TESTED} Branch-and-bound description: ${SEARCHED}`),
  },

  'or.milp': {
    objectives: ['Combine continuous and binary decisions in one model', 'Interpret the MIP gap and decide when a solution is good enough', 'List practical ways to speed up a slow MILP'],
    why: 'Most industrial optimization (network design, scheduling, unit commitment, lot sizing) mixes “how much” with “whether”. MILP is the language for that, and reading its gap is how you know what you are getting.',
    formula: { tex: '\\text{gap}=\\frac{|z_{\\text{best}}-z_{\\text{bound}}|}{|z_{\\text{best}}|}', vars: [['z_{\\text{best}}', 'best feasible solution found (incumbent)'], ['z_{\\text{bound}}', 'best possible value proven so far']] },
    mistakes: ['Stopping on a time limit and reporting the plan as optimal', 'Using huge big-M values that make the relaxation weak', 'Modelling with integer variables where a continuous one would do'],
    real: ill('Distribution network', 'A network-design MILP stalls at a 6% gap. Tightening the big-M on each warehouse’s throughput to its real capacity and adding a constraint that each customer is served by an open site brings the gap under 1% in minutes.'),
    iq: [
      { q: 'Your MILP has run for an hour with a 4% gap. What do you do?', a: 'Check whether 4% is good enough for the business decision; tighten the formulation (better big-M values, symmetry-breaking, valid inequalities); give a good starting solution from a heuristic; tune solver parameters; or decompose the problem. Often a tighter formulation matters more than more run time.', type: 'troubleshooting',
        hint: 'Separate “is this good enough?” from “how do I make it faster?”.',
        followUps: ['What does the gap actually measure?', 'How would you give the solver a starting solution?'],
        rubric: ['Relates the gap to the business tolerance', 'Names formulation tightening (big-M, symmetry, cuts)', 'Names warm start or heuristics', 'Names parameter tuning or decomposition'] },
      { q: 'Explain the MIP gap to a manager in one sentence.', a: 'The plan we have is proven to be within 4% of the best plan that could exist; finding and proving anything better would take more time.', type: 'screen',
        rubric: ['Plain language', 'Says it is a proven bound, not an estimate'] },
    ],
    cites: [GAP, BB],
    review: identified(`MIPGap definition and default, and the branch-and-bound outline, matched in Gurobi’s documentation. ${SEARCHED}`),
  },

  'or.big-m': {
    why: 'Real plans have logic: a setup cost only if you produce, a warehouse can ship only if open. Big-M is the standard way to write that logic linearly, and choosing M well decides whether the model solves in seconds or hours.',
    objectives: ['Write a fixed-charge constraint with a binary variable', 'Choose the smallest valid M from the data', 'Explain why a loose M weakens the LP relaxation'],
    example: {
      q: 'A line can make up to 80 units a shift, and producing at all costs a $500 setup: x ≤ M·y, y ∈ {0, 1}. In the LP relaxation, how much setup cost does a plan of x = 60 carry with M = 80, and with M = 10,000?',
      steps: ['The relaxation lets y be fractional, and the cheapest y satisfying x ≤ M·y is y = x/M.', 'M = 80: y = 60/80 = 0.75, setup charged = 0.75 × 500 = $375.', 'M = 10,000: y = 0.006, setup charged = $3.'],
      a: 'With M = 80 the relaxation charges $375 of the $500 setup; with M = 10,000 it charges only $3.',
      so: 'The loose M makes the relaxation think setups are almost free, so its bound is weak and branch and bound has far more to search.',
      check: { value: 375, compute: () => (60 / 80) * 500 },
    },
    mistakes: ['Picking M = 10⁶ “to be safe”', 'Choosing M smaller than the true maximum, which cuts off valid plans', 'Using big-M when the solver offers indicator constraints that avoid numerical trouble'],
    iq: [
      { q: 'How do you choose M in x ≤ M·y?', a: 'As the smallest value that never cuts off a valid plan: the tightest upper bound on x implied by the data, such as the line capacity or the total demand it could serve. A smaller M gives a tighter relaxation and a faster solve; a too-small M makes the model wrong. Where available, an indicator constraint avoids the choice.', type: 'technical',
        followUps: ['What numerical problems can a huge M cause?', 'How would you bound M for a warehouse that serves many customers?'],
        rubric: ['Smallest valid upper bound from data', 'Explains the relaxation strength trade-off', 'Warns that too small is wrong', 'Mentions indicator constraints or numerics'] },
    ],
    review: math(`The relaxation cost comparison is recomputed in the tests. ${TESTED}`),
  },

  'or.branch-bound': {
    why: 'Branch and bound is how every MILP solver works. Knowing it explains the solver log: the bound, the incumbent, the gap and why a good starting solution helps.',
    objectives: ['Branch on a fractional variable and solve both subproblems', 'Prune nodes by bound, by infeasibility and by integrality', 'Trace a small search tree to the optimum'],
    example: {
      q: 'Solve max 5x + 8y subject to x + y ≤ 6, 5x + 9y ≤ 45, x, y ≥ 0 and integer, by branch and bound.',
      steps: ['Root LP: x = 2.25, y = 3.75, z = 41.25. Branch on y.', 'y ≤ 3: LP gives x = 3, y = 3, z = 39, all integer: first incumbent, 39.', 'y ≥ 4: LP gives x = 1.8, y = 4, z = 41; 41 > 39 so branch on x.', 'x ≥ 2 (with y ≥ 4) is infeasible: 10 + 36 > 45. Prune.', 'x ≤ 1: LP gives x = 1, y = 4.44, z = 40.56; branch on y. y ≤ 4 gives (1, 4), z = 37 (no better). y ≥ 5 gives (0, 5), z = 40: new incumbent.', 'No open node has a bound above 40, so stop.'],
      a: 'The optimum is x = 0, y = 5 with z = 40, proven after seven LP solves.',
      so: 'The first incumbent (39) was found quickly; most of the work was proving nothing beats 40.',
      check: { value: 40, compute: () => 5 * 0 + 8 * 5 },
    },
    mistakes: ['Pruning a node whose bound is above the incumbent', 'Forgetting that a maximization bound comes from the LP relaxation and only falls as you branch', 'Assuming the first integer solution found is optimal'],
    iq: [
      { q: 'In a solver log the incumbent is improving but the bound barely moves. What does that tell you, and what would you try?', a: 'The search finds good plans but cannot prove optimality: the LP relaxation is weak. I would tighten the formulation (smaller big-M values, symmetry breaking, valid inequalities), check for many equivalent solutions, and accept a stated gap if the plan is already good enough for the decision.', type: 'troubleshooting',
        followUps: ['What would it mean if the bound improved but no incumbent was found?'],
        rubric: ['Diagnoses a weak relaxation', 'Names tightening tactics', 'Mentions symmetry', 'Connects to an acceptable gap'] },
    ],
    teachBack: { prompt: 'Explain branch and bound to a classmate using a shopping analogy of your own.', points: ['Relax the whole-number rule to get an optimistic bound', 'Split on a fractional decision', 'Keep the best whole-number plan found so far', 'Discard any branch whose bound cannot beat it', 'Stop when no branch can do better'] },
    cites: [BB],
    review: math(`The search tree values are recomputed and the final optimum is confirmed by enumeration. ${TESTED} Algorithm outline: ${SEARCHED}`),
  },

  'or.transportation': {
    why: 'Deciding which plant serves which customer is one of the most common cost levers in a supply chain, and its structure means whole-number supplies and demands give whole-number shipments.',
    objectives: ['Formulate a balanced transportation problem', 'Use cost differences to see which shipments are cheapest overall', 'Check a plan for supply and demand feasibility'],
    example: {
      q: 'Plant A can ship 100 units and plant B 150. Markets need 80, 90 and 80. Cost per unit from A: $4, $6, $9; from B: $5, $3, $7. Minimize shipping cost.',
      steps: ['Supply 250 = demand 250, so the problem is balanced.', 'Compare the plants market by market: A costs $1 less than B for market 1, $3 more for market 2 and $2 more for market 3. So A should serve market 1 first, then market 3.', 'A sends 80 to market 1 and its remaining 20 to market 3.', 'B sends 90 to market 2 and 60 to market 3.', 'Cost = 80×4 + 20×9 + 90×3 + 60×7 = 320 + 180 + 270 + 420.'],
      a: 'Ship A→1: 80, A→3: 20, B→2: 90, B→3: 60, for $1,190.',
      so: 'Market 3 is the split market: its cost difference sets how the plants share it.',
      check: { value: 1190, compute: () => 80 * 4 + 20 * 9 + 90 * 3 + 60 * 7 },
    },
    mistakes: ['Assigning each market to its cheapest plant without checking capacity', 'Forgetting a dummy market or plant when supply and demand are unequal', 'Ignoring that a cheap lane may have its own capacity limit'],
    real: ill('Regional bakeries', 'Two bakeries serve three café clusters. Re-solving after a fuel surcharge shows only the split market changes hands, so dispatch changes one route instead of redrawing all of them.'),
    iq: [
      { q: 'Supply exceeds demand by 50 units. How do you set up the transportation model?', a: 'Add a dummy market with demand 50 and zero shipping cost (or a holding cost if leftover stock costs money). Units “shipped” to it stay at the plant. Alternatively, write supply constraints as ≤ instead of =.', type: 'technical',
        followUps: ['What if demand exceeds supply instead?', 'How would you add a penalty for unmet demand?'],
        rubric: ['Dummy destination or ≤ supply constraints', 'Cost on the dummy is zero or a holding cost', 'Explains interpretation'] },
    ],
    review: math(`The $1,190 plan is confirmed optimal by enumerating every whole-number shipment plan. ${TESTED}`),
  },

  'or.assignment': {
    why: 'Matching people to jobs, docks to trucks or gates to flights is a daily decision. Greedy matching feels right but often isn’t, and the assignment model gives the best match quickly.',
    objectives: ['Formulate the assignment problem with binary variables', 'Show that a greedy match can be worse than the optimum', 'Name the Hungarian method and solver tools that solve it'],
    example: {
      q: 'Four technicians must each take one of four machine repairs. Hours (rows T1–T4, columns M1–M4): T1: 7, 3, 6, 9; T2: 5, 8, 4, 6; T3: 6, 5, 9, 3; T4: 8, 6, 5, 7. Minimize total hours.',
      steps: ['Greedy, in order: T1 takes M2 (3), T2 takes M3 (4), T3 takes M4 (3), T4 is left with M1 (8): 18 h.', 'Better: give M3 to T4 (5) and M1 to T2 (5).', 'T1→M2 (3), T2→M1 (5), T3→M4 (3), T4→M3 (5).', 'Checking all 24 possible matches confirms 16 h is the minimum.'],
      a: 'Assign T1→M2, T2→M1, T3→M4, T4→M3 for 16 hours, 2 hours better than the greedy match.',
      so: 'Greedy choices early on can strand a later person with a bad job.',
      check: { value: 16, compute: () => 3 + 5 + 3 + 5 },
    },
    mistakes: ['Assigning greedily row by row', 'Forgetting to add dummy jobs or people when the numbers differ', 'Using integer programming solvers without noting the LP already gives a whole-number answer'],
    real: ill('Cross-dock doors', 'A cross-dock assigns arriving trailers to doors by hand, nearest free door first. A nightly assignment model that minimizes forklift travel cuts the average move by a few minutes per pallet.'),
    iq: [
      { q: 'Why does the assignment LP give whole-number answers without integer constraints?', a: 'Its constraint matrix is totally unimodular: each variable appears once in a worker row and once in a task row with coefficient 1. Every corner of the feasible region is then a 0–1 point, so the simplex method lands on a valid assignment.', type: 'analytical',
        followUps: ['Which other problems share this property?', 'What breaks it?'],
        rubric: ['Total unimodularity or network structure', 'Corners are integer', 'Names transportation or min-cost flow as similar'] },
    ],
    cites: [ASSIGN],
    review: math(`The 16-hour optimum is confirmed by checking all 24 permutations. Problem definition: ${SEARCHED}`),
  },

  'or.network-flow': {
    why: 'Flows through plants, docks, conveyors and networks are limited by their narrowest set of links. Max-flow min-cut finds that set, which is exactly where capacity investment pays.',
    objectives: ['Model a system as nodes, arcs and capacities', 'Find a maximum flow and the matching minimum cut', 'Use the cut to say where to add capacity'],
    example: {
      q: 'Arcs and capacities (pallets per hour): S→A 12, S→B 8, A→B 2, A→C 6, A→D 3, B→C 4, B→D 5, C→T 12, D→T 9. What is the most that can flow from S to T, and what limits it?',
      steps: ['Send 6 on S→A→C→T, 3 on S→A→D→T, 4 on S→B→C→T and 4 on S→B→D→T: 17.', 'Use A→B: S→A→B→D→T carries 1 more (B→D is now full at 5). Total 18.', 'The cut between {S, A, B} and {C, D, T} has capacity A→C 6 + A→D 3 + B→C 4 + B→D 5 = 18.', 'A flow equal to a cut proves both are optimal.'],
      a: 'The maximum flow is 18 pallets per hour, limited by the four middle arcs A→C, A→D, B→C and B→D.',
      so: 'The dock doors (C→T, D→T) have spare capacity; adding there gains nothing. Widen a middle lane instead.',
      check: { value: 18, compute: () => 6 + 3 + 4 + 5 },
    },
    mistakes: ['Adding capacity where it is easiest rather than on the minimum cut', 'Forgetting reverse (residual) arcs, so augmenting stalls early', 'Mixing per-hour and per-shift capacities'],
    iq: [
      { q: 'Explain the max-flow min-cut theorem and how you would use it in a plant.', a: 'The most flow from source to sink equals the smallest total capacity of arcs that, if removed, separate them. In a plant the cut is the set of operations or conveyors that bound throughput; it tells you which few links to expand, and expanding anything else does not raise throughput.', type: 'conceptual',
        followUps: ['How does this relate to the theory of constraints?', 'What happens to the cut after you expand one of its arcs?'],
        rubric: ['States flow = cut capacity', 'Defines a cut', 'Applies it to choosing where to add capacity', 'Notes the cut may move after expansion'] },
    ],
    cites: [FLOW],
    review: math(`Max flow is recomputed with an augmenting-path algorithm and the minimum cut by checking every cut. Definitions: ${SEARCHED}`),
  },

  'or.shortest-path': {
    why: 'Routing AGVs, picking paths and even equipment replacement plans are shortest-path problems; knowing Dijkstra’s rule explains why a navigation answer can be trusted and when it cannot (negative costs).',
    objectives: ['Run Dijkstra’s algorithm by hand on a small network', 'Explain why it needs non-negative arc costs', 'Recognize a planning problem that can be written as a shortest path'],
    example: {
      q: 'Travel times (min): S→A 4, S→B 2, B→A 1, A→C 5, A→D 10, B→D 8, C→D 2, C→T 3, D→T 4. Find the fastest S→T route.',
      steps: ['Start: S = 0. Closest unvisited: B (2). From B: A = min(4, 2 + 1) = 3, D = 10.', 'Next: A (3). From A: C = 8, D stays 10 (3 + 10 = 13).', 'Next: C (8). From C: T = 11, D stays 10.', 'Next: D (10): T stays 11 (10 + 4 = 14). Then T (11) is final.'],
      a: 'The fastest route is S→B→A→C→T in 11 minutes.',
      so: 'Going S→A directly (4 min) looks quicker but the detour through B reaches A in 3.',
      check: { value: 11, compute: () => 2 + 1 + 5 + 3 },
    },
    mistakes: ['Finalizing a node before it is the closest unvisited one', 'Using Dijkstra with negative arc costs', 'Optimizing distance when the real cost is time with congestion'],
    iq: [
      { q: 'How can an equipment replacement decision be written as a shortest-path problem?', a: 'Make a node for each year. An arc from year i to year j means buy new in year i and keep the machine until year j; its cost is the purchase price plus operating costs minus salvage for that span. The shortest path from the first year to the end of the horizon is the cheapest replacement plan.', type: 'analytical',
        followUps: ['How would you include inflation or a discount rate?'],
        rubric: ['Nodes are time points', 'Arcs are keep-until decisions', 'Arc cost combines purchase, operating and salvage', 'Shortest path = best plan'] },
    ],
    review: math(`The route is recomputed with an independent Dijkstra implementation. ${TESTED}`),
  },

  'or.tsp': {
    why: 'Pick routes, drill paths and sequence-dependent setups are all tours. Knowing that simple heuristics can miss by double-digit percentages explains why routing software and improvement steps such as 2-opt matter.',
    objectives: ['Count the tours of a small TSP and explain why exact search explodes', 'Build a nearest-neighbor tour and measure its gap from the optimum', 'Describe one improvement heuristic (2-opt)'],
    example: {
      q: 'A picker starts at the depot (0, 0) and visits slots at (2, 1), (2, 6), (8, 3) and (0, 5), walking along aisles (rectilinear distance). Compare nearest neighbor with the best tour.',
      steps: ['Nearest neighbor: depot→(2, 1) 3, →(2, 6) 5, →(0, 5) 3, →(8, 3) 10, →depot 11: 32.', 'With 4 stops there are 4!/2 = 12 distinct tours; check them all.', 'Best: depot→(2, 1) 3, →(8, 3) 8, →(2, 6) 9, →(0, 5) 3, →depot 5: 28.'],
      a: 'The best tour is 28 units long; nearest neighbor gives 32, about 14% longer.',
      so: 'Greedy left the far slot (8, 3) for last and paid for the long walk back; a 2-opt swap would fix it.',
      check: { value: 28, compute: () => 3 + 8 + 9 + 3 + 5 },
    },
    mistakes: ['Assuming nearest neighbor is near-optimal', 'Using straight-line distance in a warehouse with aisles', 'Trying exact enumeration on more than about a dozen stops'],
    iq: [
      { q: 'You need routes for 300 stops by tomorrow morning. How do you approach it?', a: 'Not exact enumeration. Use a construction heuristic (nearest neighbor or savings) and improve it with local search (2-opt, relocate) or a metaheuristic, ideally in a routing solver such as OR-Tools with a time limit. Validate distances on real roads, report the gap to a lower bound if one is available, and check the routes with the drivers.', type: 'scenario',
        followUps: ['How would time windows change your approach?', 'How would you measure route quality?'],
        rubric: ['Rules out brute force with a reason', 'Construction plus improvement heuristic', 'Uses a solver with a time limit', 'Validates against real distances or a bound'] },
    ],
    teachBack: { prompt: 'Explain why a computer cannot just try every route for 50 delivery stops.', points: ['The number of tours grows like a factorial', 'Even fast computers cannot check them all', 'Heuristics build a good tour and then improve it', 'Good tools report how close they are to optimal when they can'] },
    cites: [ROUTE],
    review: math(`Both tour lengths are recomputed by full enumeration. TSP–routing link: ${SEARCHED}`),
  },

  'or.vrp': {
    why: 'Delivery and field-service costs are mostly driving time. VRP models cut miles and overtime while respecting truck capacity and customer time windows, and they are among the most used OR models in logistics.',
    objectives: ['Name the main VRP variants (capacity, time windows, pickup and delivery)', 'Explain why practical VRPs are solved with heuristics and search', 'List the data a routing study needs and the KPIs it should report'],
    assumptions: ['Travel times are known or estimated by time of day', 'Each customer is served once (unless split deliveries are allowed)', 'Large instances return good, not proven-optimal, routes within a time limit'],
    mistakes: ['Using straight-line distances for road networks', 'Ignoring driver hours and breaks', 'Reporting total miles but not lateness against time windows'],
    real: ill('Parts distributor', 'A distributor feeds its delivery stops, truck capacities and two-hour time windows into a routing solver. The first plan fails because loading-dock opening hours were missing; adding them produces routes the drivers accept.'),
    iq: [
      { q: 'What data do you need before running a vehicle routing study?', a: 'Stop locations and demand, service time per stop, time windows, vehicle capacities and costs, driver shift and break rules, depot opening hours and a road-network travel-time matrix by time of day. Then a baseline of current routes to compare against.', type: 'technical',
        followUps: ['Which of these is most often wrong, and how do you check it?'],
        rubric: ['Demand and locations', 'Time windows and service times', 'Vehicle and driver constraints', 'Road-based travel times', 'A baseline for comparison'] },
    ],
    cites: [VRP, ROUTE],
    review: identified(`VRP and its relation to the TSP matched in the OR-Tools routing guides. ${SEARCHED}`),
  },

  'or.knapsack': {
    why: 'Capital budgeting, cargo loading and project selection share one structure: pick the best set within a limit. It is also the clearest example of why ranking by ratio is not the same as optimizing.',
    objectives: ['Formulate a 0–1 knapsack for project selection', 'Show that ranking by value per dollar can miss the optimum', 'Explain how dynamic programming or branch and bound solves it'],
    example: {
      q: 'Budget $100k. Projects (cost, NPV in $k): A (60, 90), B (50, 70), C (50, 70), D (40, 44). Choose projects to maximize total NPV.',
      steps: ['Ratios: A 1.5, B 1.4, C 1.4, D 1.1.', 'Greedy by ratio: A (60), then B and C don’t fit, then D (40): NPV 134.', 'Try B + C: cost 100, NPV 140.', 'Checking all 16 subsets confirms 140 is the best.'],
      a: 'Fund B and C for an NPV of $140k, $6k more than the ratio ranking’s $134k.',
      so: 'Ratio ranking ignores how well items fill the budget; the leftover after A forced a weak project in.',
      check: { value: 140, compute: () => 70 + 70 },
    },
    mistakes: ['Ranking projects by NPV/cost and stopping there', 'Ignoring project dependencies (B requires A) that need extra constraints', 'Comparing projects of different lives by NPV without an equal horizon'],
    iq: [
      { q: 'Finance ranks projects by benefit–cost ratio and funds from the top. When does that fail?', a: 'When the budget can’t be filled exactly: a high-ratio project can leave a remainder that only weak projects fit, while a different set uses the budget better. It also ignores dependencies and exclusivity between projects. A 0–1 knapsack (or a small integer program with those logical constraints) finds the best portfolio.', type: 'decision',
        hint: 'Think about the money left over after the first pick.',
        followUps: ['How would you add “if B then A” to the model?', 'What if the budget is spread over two years?'],
        rubric: ['Explains the leftover-budget effect', 'Mentions dependencies or exclusivity', 'Proposes a 0–1 model', 'Gives or references a numeric case'] },
    ],
    cites: [KNAP],
    review: math(`The portfolio optimum is confirmed by checking every subset. Problem definition: ${SEARCHED}`),
  },

  'or.markov': {
    why: 'Machine condition, customer churn and inventory levels move between states with steady probabilities. A Markov chain turns those probabilities into long-run availability and cost, which is what maintenance and service decisions need.',
    objectives: ['Write a transition matrix from a description', 'Solve π = πP for a steady state', 'Turn the steady state into availability or cost'],
    example: {
      q: 'Each week a machine is Good, Worn or Broken. From Good: 80% stays Good, 15% becomes Worn, 5% Broken. From Worn: 70% stays Worn, 30% Broken. From Broken: repair returns it to Good 90% of the time, 10% still Broken. What fraction of weeks is it running (not Broken)?',
      steps: ['Balance for Worn: π_W = 0.15π_G + 0.7π_W → π_W = 0.5π_G.', 'Balance for Broken: π_B = 0.05π_G + 0.3π_W + 0.1π_B → 0.9π_B = 0.2π_G → π_B = (2/9)π_G.', 'Sum to 1: π_G(1 + 0.5 + 2/9) = 1 → π_G = 18/31.', 'π_W = 9/31 and π_B = 4/31, so running = 27/31.'],
      a: 'In the long run it is Good 58%, Worn 29% and Broken 13% of weeks, so it is running 87.1% of the time.',
      so: 'Worn → Broken (30%) drives most failures: replacing worn parts before they fail is the obvious lever to test.',
      check: { value: 0.871, compute: () => 27 / 31, tol: 0.0005, shown: { value: 87.1, rule: { scale: 100 } } },
    },
    assumptions: ['Memoryless: next week depends only on this week’s state', 'Transition probabilities are constant over time', 'The chain is regular, so a single steady state exists'],
    mistakes: ['Rows of the matrix not summing to 1', 'Writing π = Pπ instead of π = πP (row vector times matrix)', 'Using a Markov model when wear depends on age, not just the current state'],
    iq: [
      { q: 'How would you test whether a preventive policy “replace when Worn” is worth it, using this model?', a: 'Change the Worn row to the policy’s transitions (for example Worn → Good after a planned replacement), re-solve the steady state, and compare long-run cost per week: state probabilities times the cost of being in each state plus the cost of each action. Adopt the policy if its long-run cost is lower, and check the result is robust to the estimated probabilities.', type: 'decision',
        followUps: ['How would you estimate the transition probabilities from maintenance records?', 'When would you switch to a semi-Markov or simulation model?'],
        rubric: ['Modifies the transition matrix for the policy', 'Re-solves the steady state', 'Compares expected cost per period', 'Checks sensitivity of the estimates'] },
    ],
    review: math(`The steady state is recomputed by iterating the chain to convergence. ${TESTED}`),
  },

  'or.mmc': {
    why: 'Staffing a clinic, a call centre or a maintenance crew is a question of how many servers keep waits acceptable. M/M/c shows that waits fall steeply with each added server and that one shared line beats separate lines.',
    objectives: ['Compute utilization, the probability of waiting and the average wait for an M/M/c queue', 'Show why one pooled line beats separate lines with the same staff', 'Pick a server count against a wait target'],
    assumptions: ['Poisson arrivals and exponential service times', 'Identical servers and one first-come-first-served line', 'No abandonment; use Erlang A or simulation when callers hang up'],
    mistakes: ['Planning staff to 100% average utilization', 'Comparing pooled and separate lines without keeping total staff equal', 'Using hourly averages when arrivals peak within the hour'],
    real: ill('Tool crib', 'Two tool cribs each have their own clerk and their own line. Merging them into one counter with both clerks cuts the average wait from about 50 to 23 minutes without adding staff.'),
    iq: [
      { q: 'Two separate lines each get 5 arrivals an hour and each clerk serves 6 an hour. How much would merging into one line with both clerks help?', a: 'Separate: each is M/M/1 with ρ = 5/6, so Wq = ρ/(μ − λ) = 0.833 h ≈ 50 min. Merged: M/M/2 with λ = 10 and μ = 6; Erlang C gives P(wait) ≈ 0.758 and Wq = 0.758/(12 − 10) ≈ 0.379 h ≈ 23 min. Same staff, waits cut by more than half.', type: 'numerical',
        hint: 'Same utilization, different structure: compute each Wq.',
        followUps: ['Why does pooling help?', 'When might separate lines still be preferred?'],
        rubric: ['M/M/1 wait ≈ 50 min', 'M/M/2 wait ≈ 23 min', 'Keeps staff and utilization equal', 'Explains why pooling helps (no idle server while someone waits)'] },
      { q: 'The target is an average wait under 5 minutes. How do you pick the number of nurses?', a: 'Increase c from the smallest stable value (cμ > λ) and compute Wq each time; choose the first c that meets the target, then check it against peak-hour arrivals, breaks (shrinkage) and the cost of an extra nurse. In the clinic example (λ = 10, μ = 4) three nurses give about 21 min and four give under 4 min, so four.', type: 'decision',
        rubric: ['Starts from stability', 'Iterates c against the target', 'Allows for peaks and shrinkage', 'Lands on a number with the check'] },
    ],
    teachBack: { prompt: 'Explain to a clinic manager why adding one nurse can cut the wait from 21 minutes to under 4.', points: ['Waits depend on how close servers are to fully busy', 'Near full utilization, small capacity changes have big effects', 'One shared line means no nurse is idle while someone waits', 'Check against peak hours, not the daily average'] },
    review: math(`The pooling comparison and staffing check are recomputed with an independent Erlang C formula; the Equation Explorer reproduces both hand-worked cases. ${TESTED}`),
  },

  'or.newsvendor': {
    why: 'Seasonal stock, perishable food, event capacity and spare parts for a one-time build all face a single chance to order. The newsvendor model turns the cost of being short versus being over into the right order quantity.',
    objectives: ['Compute underage and overage costs from prices and salvage', 'Find the critical ratio and the order quantity for normal demand', 'Explain why the answer is above or below mean demand'],
    assumptions: ['One period: leftovers lose value', 'A known demand distribution (normal is common but not required)', 'Linear costs; add goodwill to the underage cost if a stockout costs more than the margin'],
    mistakes: ['Ordering the forecast mean by habit', 'Using the price instead of the margin as the underage cost', 'Forgetting salvage value in the overage cost'],
    real: ill('Holiday kits', 'A retailer orders holiday gift kits once. The margin is high and leftovers can be sold at a deep discount, so the critical ratio is well above one half and the buyer orders above the forecast instead of at it.'),
    iq: [
      { q: 'Price $20, cost $4, no salvage, demand ~ Normal(1,000, 200). What should you order?', a: 'Cu = 16, Co = 4, so the critical ratio is 16/20 = 0.80. z(0.80) ≈ 0.842, so Q* = 1,000 + 0.842 × 200 ≈ 1,168 units.', type: 'numerical',
        hint: 'Underage is the lost margin; overage is the cost of a leftover.',
        followUps: ['What happens to Q* if the supplier offers buy-back at $3?', 'What service level does this order give?'],
        rubric: ['Cu = 16 and Co = 4', 'Critical ratio 0.80', 'z ≈ 0.84', 'Q* ≈ 1,168'] },
      { q: 'A manager says “just order the forecast.” How do you respond?', a: 'Ordering the mean is right only if being short and being over cost the same. Here a stockout loses $16 and a leftover costs $4, so we should be in stock about 80% of the time, which means ordering above the forecast. I would show the expected profit at both quantities so the decision rests on money, not habit.', type: 'behavioral',
        rubric: ['Explains when the mean is right', 'Uses the cost asymmetry', 'Proposes showing expected profit'] },
    ],
    teachBack: { prompt: 'Explain the newsvendor idea to a store manager without using any formulas.', points: ['You get one chance to order', 'Running out and having leftovers cost different amounts', 'Lean toward the cheaper mistake', 'The bigger the uncertainty, the bigger that lean'] },
    review: math(`The interview example is recomputed in the tests and reproduced in the Equation Explorer. ${TESTED}`),
  },

  'or.decision-tree': {
    why: 'Capacity expansion, make-or-buy and pilot-or-launch decisions all mix choices with uncertain outcomes. A decision tree makes the logic explicit and puts a price on better information.',
    objectives: ['Roll back a decision tree to the best choice', 'Compute the expected value of perfect information (EVPI)', 'Explain when expected value is not the right criterion'],
    assumptions: ['Probabilities and payoffs are estimates; test how far they can move before the choice changes', 'Expected value assumes the firm can absorb the bad outcome (risk-neutral)'],
    mistakes: ['Choosing at chance nodes instead of averaging', 'Paying more for a study than the EVPI', 'Ignoring that a large possible loss may be unacceptable even with a good expected value'],
    real: ill('Packaging line', 'A plant weighs a second packaging line against overtime. The tree shows the line wins on expected value, but a market study worth less than the EVPI is run first because the downside would strain cash.'),
    iq: [
      { q: 'Expand now: 60% chance of +$500k, 40% chance of −$200k; or wait for a sure +$100k. What is perfect market information worth?', a: 'Without information, EV(expand) = 0.6 × 500 − 0.4 × 200 = $220k, better than $100k. With perfect information you would expand only in the good market: 0.6 × 500 + 0.4 × 100 = $340k. EVPI = 340 − 220 = $120k, so never pay more than $120k for a study, and less for an imperfect one.', type: 'numerical',
        hint: 'With perfect information you pick the best action after you know the outcome.',
        followUps: ['How would you value an imperfect study that is right 80% of the time?', 'At what probability of a good market do you become indifferent?'],
        rubric: ['EV without information $220k', 'EV with perfect information $340k', 'EVPI $120k', 'Says imperfect information is worth less'] },
    ],
    review: math(`The base example and the EVPI question are recomputed in the tests. ${TESTED}`),
  },
}
