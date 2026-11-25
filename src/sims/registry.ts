import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { DomainId } from '../types'

export interface SimMeta {
  id: string
  name: string
  blurb: string
  domain: DomainId
  concepts: string[]
  load: LazyExoticComponent<ComponentType>
}

const L = (f: () => Promise<{ default: ComponentType }>) => lazy(f)

export const SIM_META: SimMeta[] = [
  { id: 'control-chart', name: 'Control chart simulator', domain: 'quality', blurb: 'Run a process, inject a shift, and catch it with the Western Electric rules.', concepts: ['quality.control-chart', 'quality.xbar-r', 'quality.we-rules'], load: L(() => import('./ControlChart')) },
  { id: 'capability', name: 'Process capability explorer', domain: 'quality', blurb: 'Slide the mean and spread; watch Cp, Cpk and defect PPM respond.', concepts: ['quality.cpk', 'quality.cp'], load: L(() => import('./Capability')) },
  { id: 'doe-factorial', name: '2³ factorial DOE lab', domain: 'doe', blurb: 'Run a plasma-etch experiment, compute main effects and interactions.', concepts: ['doe.full-factorial', 'doe.main-effect', 'doe.interaction'], load: L(() => import('./DoeFactorial')) },
  { id: 'hypothesis', name: 'Hypothesis test & power', domain: 'stats', blurb: 'See α, β and power as overlapping curves; change n and effect size.', concepts: ['stats.hypothesis-test', 'stats.power', 'stats.type-errors'], load: L(() => import('./Hypothesis')) },
  { id: 'regression', name: 'Regression playground', domain: 'stats', blurb: 'Click to add points; the least-squares line and R² update live.', concepts: ['stats.regression', 'stats.r-squared'], load: L(() => import('./Regression')) },
  { id: 'clt', name: 'Central limit theorem sampler', domain: 'stats', blurb: 'Draw samples from a skewed process and watch the averages turn normal.', concepts: ['stats.clt'], load: L(() => import('./Clt')) },
  { id: 'lp-solver', name: 'LP / MILP product-mix solver', domain: 'or', blurb: 'Build a production-planning model, solve it in the browser, read shadow prices and the Gurobi code.', concepts: ['or.lp', 'or.shadow-price', 'or.milp', 'or.gurobi'], load: L(() => import('./LpSolver')) },
  { id: 'graphical-lp', name: 'Graphical LP', domain: 'or', blurb: 'Two products, two constraints: see the feasible region and the optimal corner.', concepts: ['or.lp', 'or.feasible-region'], load: L(() => import('./GraphicalLp')) },
  { id: 'queueing', name: 'Queueing simulator (M/M/c)', domain: 'or', blurb: 'Set arrival and service rates and servers; compare formulas with a live simulation.', concepts: ['or.mm1', 'or.mmc', 'lean.littles-law'], load: L(() => import('./Queueing')) },
  { id: 'inventory', name: 'Inventory lab: EOQ, ROP, newsvendor', domain: 'scm', blurb: 'Find the order quantity that minimizes cost and the stock level that maximizes profit.', concepts: ['or.eoq', 'scm.safety-stock', 'or.newsvendor'], load: L(() => import('./Inventory')) },
  { id: 'scheduling', name: 'Scheduling Grand Prix', domain: 'manufacturing', blurb: 'Race FCFS, SPT and EDD on the same jobs: predict the winner, then compare flow time, lateness and late jobs.', concepts: ['manufacturing.dispatch-rules'], load: L(() => import('./Scheduling')) },
  { id: 'line-balancing', name: 'Line balancing', domain: 'lean', blurb: 'Assign tasks to stations under takt time and measure balance efficiency.', concepts: ['lean.line-balancing', 'lean.takt-time'], load: L(() => import('./LineBalancing')) },
  { id: 'factory', name: 'Visual factory', domain: 'lean', blurb: 'Build a serial line from stations with cycle time, availability and yield; see takt, the true bottleneck, good output and lead time.', concepts: ['lean.toc', 'lean.takt-time', 'lean.littles-law', 'lean.line-balancing'], load: L(() => import('./Factory')) },
  { id: 'oee', name: 'OEE & six big losses', domain: 'lean', blurb: 'Enter a shift’s downtime, speed and scrap; see where capacity disappears.', concepts: ['lean.oee'], load: L(() => import('./Oee')) },
  { id: 'fmea', name: 'FMEA worksheet', domain: 'safety', blurb: 'Score severity, occurrence and detection; prioritize by RPN and Action Priority.', concepts: ['safety.fmea', 'safety.rpn'], load: L(() => import('./Fmea')) },
  { id: 'fault-tree', name: 'Fault tree calculator', domain: 'safety', blurb: 'Combine basic events with AND/OR gates and compute top-event probability.', concepts: ['safety.fta', 'safety.cut-set'], load: L(() => import('./FaultTree')) },
  { id: 'bowtie', name: 'Bow-tie builder', domain: 'safety', blurb: 'Map threats, the top event, consequences and the barriers on each side.', concepts: ['safety.bowtie', 'safety.barrier'], load: L(() => import('./BowTie')) },
  { id: 'risk-matrix', name: 'Risk matrix', domain: 'safety', blurb: 'Place hazards by severity and likelihood, then apply controls from the hierarchy.', concepts: ['safety.risk-matrix', 'safety.hierarchy-controls'], load: L(() => import('./RiskMatrix')) },
  { id: 'reliability', name: 'Reliability block diagram & Weibull', domain: 'reliability', blurb: 'Series vs parallel systems, and how β shapes the failure curve.', concepts: ['reliability.rbd', 'reliability.weibull'], load: L(() => import('./Reliability')) },
  { id: 'cpm', name: 'CPM / PERT scheduler & EVM', domain: 'pm', blurb: 'Enter tasks and dependencies; get the critical path, float, Gantt and earned value.', concepts: ['pm.cpm', 'pm.pert', 'pm.evm'], load: L(() => import('./Cpm')) },
  { id: 'plc-ladder', name: 'PLC ladder logic simulator', domain: 'automation', blurb: 'Toggle inputs and watch rungs energize: seal-in, interlocks, timers and counters.', concepts: ['automation.ladder-logic', 'automation.seal-in', 'automation.plc-timer'], load: L(() => import('./PlcLadder')) },
  { id: 'ml-playground', name: 'ML playground', domain: 'datasci', blurb: 'k-means clustering and k-NN classification on points you place.', concepts: ['datasci.kmeans', 'datasci.knn', 'datasci.overfitting'], load: L(() => import('./MlPlayground')) },
  { id: 'forecasting', name: 'Forecasting lab', domain: 'datasci', blurb: 'Moving average vs exponential smoothing vs Holt’s trend on real-looking demand.', concepts: ['datasci.exp-smoothing', 'datasci.mape'], load: L(() => import('./Forecasting')) },
  { id: 'wafer-flow', name: 'Wafer process flow', domain: 'semiconductor', blurb: 'Step through oxidation, lithography, etch and deposition on a wafer cross-section.', concepts: ['semiconductor.photolithography', 'semiconductor.etching', 'semiconductor.deposition'], load: L(() => import('./WaferFlow')) },
  { id: 'yield', name: 'Die yield calculator', domain: 'semiconductor', blurb: 'Dies per wafer and Poisson vs Murphy yield as defect density changes.', concepts: ['semiconductor.yield'], load: L(() => import('./Yield')) },
  { id: 'engecon', name: 'Cash flow, NPV & IRR', domain: 'engecon', blurb: 'Build a cash-flow diagram and compare alternatives at your MARR.', concepts: ['engecon.npv', 'engecon.irr'], load: L(() => import('./EngEcon')) },
  { id: 'niosh', name: 'NIOSH lifting equation', domain: 'ergo', blurb: 'Compute the recommended weight limit and lifting index for a task.', concepts: ['ergo.niosh'], load: L(() => import('./Niosh')) },
  { id: 'standard-time', name: 'Time study & standard time', domain: 'work', blurb: 'Observed times, performance rating and allowances into a labor standard.', concepts: ['work.standard-time', 'work.time-study'], load: L(() => import('./StandardTime')) },
  { id: 'bullwhip', name: 'Bullwhip game', domain: 'scm', blurb: 'Four-tier supply chain: watch small demand changes amplify upstream.', concepts: ['scm.bullwhip'], load: L(() => import('./Bullwhip')) },
  { id: 'monte-carlo', name: 'Monte Carlo project risk', domain: 'simulation', blurb: 'Simulate thousands of project runs with uncertain task times.', concepts: ['simulation.monte-carlo'], load: L(() => import('./MonteCarlo')) },
]
