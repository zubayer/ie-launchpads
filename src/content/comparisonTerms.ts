import type { Concept } from '../types'

/** Context-specific terminology; do not manufacture acronym expansions for mathematical symbols. */
export const TERM_NOTES: Record<string, { name: string; note?: string }> = {
  'quality.cp': { name: 'Process capability index (potential capability)', note: 'Cₚ is mathematical notation, not an ordinary acronym. It compares specification width with six standard deviations, without accounting for mean offset.' },
  'quality.cpk': { name: 'Process capability index adjusted for centering', note: 'Cₚₖ is mathematical notation. It uses the nearer specification limit; k is not a standalone word in an acronym. Check process stability and the variation estimate before interpreting it.' },
  'quality.ppk': { name: 'Pp: process performance index; Ppk: process performance index adjusted for centering', note: 'These indices use overall variation, in contrast to the usual within-process estimates used for Cp and Cpk.' },
  'quality.p-chart': { name: 'p: proportion nonconforming; np: number of nonconforming units' },
  'quality.c-u-chart': { name: 'c: count of nonconformities; u: nonconformities per unit' },
  'quality.ewma-cusum': { name: 'EWMA: exponentially weighted moving average; CUSUM: cumulative sum' },
  'quality.xbar-r': { name: 'X̄: sample mean; R: sample range' },
  'quality.imr': { name: 'I: individuals; MR: moving range' },
  'quality.dpmo': { name: 'DPMO: defects per million opportunities' },
  'lean.eight-wastes': { name: 'TIMWOODS: transportation, inventory, motion, waiting, overproduction, overprocessing, defects, skills (unused talent)' },
  'automation.plc-timer': { name: 'TON: on-delay timer; TOF: off-delay timer; RTO: retentive timer on (Rockwell terminology)' },
  'automation.plc-counter': { name: 'CTU: count up; CTD: count down' },
  'automation.no-nc': { name: 'NO: normally open; NC: normally closed', note: 'Physical contact state and PLC bit-test instruction semantics are distinct.' },
  'automation.gcode': { name: 'G-code: preparatory commands; M-code: miscellaneous commands', note: 'Exact command support depends on the machine controller.' },
  'manufacturing.mts-mto': { name: 'MTS: make to stock; MTO: make to order; ATO: assemble to order; ETO: engineer to order' },
  'manufacturing.ncr': { name: 'NCR: nonconformance report; MRB: material review board' },
  'manufacturing.iatf': { name: 'IATF: International Automotive Task Force' },
  'scm.ltl-ftl': { name: 'LTL: less than truckload; FTL: full truckload' },
  'scm.third-party': { name: '3PL: third-party logistics; 4PL: fourth-party logistics' },
  'engecon.annual-worth': { name: 'AW: annual worth; EUAC: equivalent uniform annual cost', note: 'Annual worth may include benefits and costs; EUAC focuses on equivalent costs.' },
  'engecon.factors': { name: 'P: present amount; F: future amount; A: uniform annual amount; G: arithmetic gradient' },
  'datasci.roc-auc': { name: 'ROC: receiver operating characteristic; AUC: area under the curve' },
  'datasci.precision-recall': { name: 'F1: harmonic mean of precision and recall', note: 'F1 is a score designation, not a word-by-word acronym.' },
  'datasci.mape': { name: 'MAD: mean absolute deviation (forecasting); MAPE: mean absolute percentage error' },
  'datasci.sql-subqueries': { name: 'SQL: structured query language; CTE: common table expression' },
  'datasci.linear-regression-ml': { name: 'ML: machine learning' },
  'or.mm1': { name: 'M/M/1: Markovian arrivals, Markovian service times, one server', note: 'The usual model assumes Poisson arrivals and exponential service times.' },
  'or.mmc': { name: 'M/M/c: Markovian arrivals, Markovian service times, c parallel servers' },
  'or.big-m': { name: 'M: a sufficiently large model-specific constant', note: 'Not an acronym. A tight valid bound is preferable to an arbitrarily huge constant.' },
  'safety.pha': { name: 'PHA: preliminary hazard analysis or process hazard analysis, depending on context' },
  'safety.action-priority': { name: 'AP: action priority' },
  'safety.jsa': { name: 'JSA: job safety analysis; JHA: job hazard analysis' },
  'safety.trir': { name: 'TRIR: total recordable incident rate; LTIR: lost time incident rate' },
  'safety.mil-std-882': { name: 'MIL-STD: military standard; 882E is the edition identifier' },
  'service.pue': { name: 'PUE: power usage effectiveness', note: 'For an energy-based reporting interval, divide total facility energy by IT equipment energy using consistent boundaries.' },
}
export function termMeaning(c: Concept): string | undefined {
  return TERM_NOTES[c.id]?.name || (c.full && c.full !== c.term ? c.full : undefined)
}
