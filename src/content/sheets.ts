// Printable exam-and-job cheat sheets: each formula by hand, in Excel and in Python.
// Every number printed on a sheet is recomputed in src/lib/learning.test.ts.

export interface SheetRow { want: string; tag?: string; formula: string; excel: string; python: string; concept: string }
export interface Sheet {
  id: string
  title: string
  sub: string
  python: string // the library the Python column uses
  rows: SheetRow[]
  example: { setup: string; work: string; excel: string }
  rules: string[]
  traps: { title: string; text: string }[]
}

export const SHEETS: Record<string, Sheet> = {
  engecon: {
    id: 'engecon',
    title: 'Engineering Economics',
    sub: 'Interest factors and decision tools, by hand, in Excel and in Python',
    python: 'numpy_financial (import numpy_financial as npf)',
    rows: [
      { want: 'Future worth of P', formula: 'F = P(1 + i)ⁿ', excel: '=FV(i, n, 0, -P)', python: 'npf.fv(i, n, 0, -P)', concept: 'engecon.tvm' },
      { want: 'Equal payments that repay P', tag: 'A/P', formula: 'A = P · i(1 + i)ⁿ ÷ ((1 + i)ⁿ − 1)', excel: '=PMT(i, n, -P)', python: 'npf.pmt(i, n, -P)', concept: 'engecon.factors' },
      { want: 'Value today of equal yearly A', tag: 'P/A', formula: 'P = A · ((1 + i)ⁿ − 1) ÷ (i(1 + i)ⁿ)', excel: '=PV(i, n, -A)', python: 'npf.pv(i, n, -A)', concept: 'engecon.factors' },
      { want: 'Net present worth', formula: 'NPV = Σ CFₜ ÷ (1 + i)ᵗ, t = 0…n', excel: '=NPV(i, CF1:CFn) + CF0', python: 'npf.npv(i, [CF0, CF1, …])', concept: 'engecon.npv' },
      { want: 'Internal rate of return', formula: 'the i where NPV = 0', excel: '=IRR(CF0:CFn)', python: 'npf.irr([CF0, …, CFn])', concept: 'engecon.irr' },
      { want: 'Capital recovery with salvage S', formula: 'CR = (P − S)(A/P, i, n) + S · i', excel: '=PMT(i, n, -P, S)', python: 'npf.pmt(i, n, -P, S)', concept: 'engecon.annual-worth' },
    ],
    example: {
      setup: 'A machine costs $50,000 and sells for $10,000 after 5 years. MARR is 10%.',
      work: 'CR = 40,000 × 0.2638 + 10,000 × 0.10 = $11,552 a year',
      excel: '=PMT(10%, 5, -50000, 10000) → 11,551.90',
    },
    rules: [
      'Draw the cash-flow diagram first. Year 0 is now; each flow sits at the end of its year. Money in +, money out −.',
      'Mutually exclusive projects with equal lives: pick the highest NPV, not the highest IRR. Unequal lives: compare annual worth.',
    ],
    traps: [
      { title: 'Excel and Python disagree on NPV.', text: 'Excel’s NPV() discounts its first value by one year, so add CF0 outside it. numpy_financial’s npv() treats the first value as year 0. Mix them up and you are off by a factor of (1 + i).' },
      { title: 'Nominal is not effective.', text: '12% compounded monthly is (1.01)¹² − 1 = 12.68% a year; in Excel, =EFFECT(12%, 12).' },
    ],
  },
}
