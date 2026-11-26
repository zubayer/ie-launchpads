// Riverbend Plant: a small synthetic manufacturing database for the SQL studio. Every value is generated
// from a fixed seed, so every query in the lessons gives the same answer everywhere. It is not real data.
// Deliberate data problems, for the data-quality lesson: run 81 duplicates run 23; one defect row points at
// a run that doesn't exist (run 999); one run has no downtime reading (NULL); two downtime events have no reason.
import { makeRng } from '../../lib/math'

export interface Product { product_id: string; name: string; family: string; std_cycle_s: number; unit_cost: number }
export interface Machine { machine_id: string; name: string; line: string; type: string; installed: number }
export interface WorkOrder { wo_id: number; product_id: string; qty_ordered: number; due_date: string; status: string }
export interface Run { run_id: number; wo_id: number; machine_id: string; run_date: string; shift: string; good_qty: number; scrap_qty: number; run_min: number; down_min: number | null }
export interface Defect { defect_id: number; run_id: number; code: string; qty: number }
export interface Downtime { event_id: number; machine_id: string; event_date: string; minutes: number; reason: string | null }

export const PRODUCTS: Product[] = [
  { product_id: 'P100', name: 'Housing A', family: 'Housings', std_cycle_s: 42, unit_cost: 18.5 },
  { product_id: 'P200', name: 'Housing B', family: 'Housings', std_cycle_s: 55, unit_cost: 22 },
  { product_id: 'P300', name: 'Bracket', family: 'Brackets', std_cycle_s: 30, unit_cost: 6.75 },
  { product_id: 'P400', name: 'Shaft', family: 'Shafts', std_cycle_s: 48, unit_cost: 12.4 },
  { product_id: 'P500', name: 'Cover plate', family: 'Brackets', std_cycle_s: 25, unit_cost: 4.9 }, // no orders yet
]
export const MACHINES: Machine[] = [
  { machine_id: 'M1', name: 'Press 1', line: 'L1', type: 'Press', installed: 2015 },
  { machine_id: 'M2', name: 'Press 2', line: 'L1', type: 'Press', installed: 2018 },
  { machine_id: 'M3', name: 'CNC 1', line: 'L1', type: 'CNC', installed: 2012 },
  { machine_id: 'M4', name: 'CNC 2', line: 'L2', type: 'CNC', installed: 2021 },
  { machine_id: 'M5', name: 'Welder 1', line: 'L2', type: 'Welder', installed: 2019 },
  { machine_id: 'M6', name: 'Laser 1', line: 'L2', type: 'Laser', installed: 2026 }, // commissioned, no runs yet
]
export const WORK_ORDERS: WorkOrder[] = [
  { wo_id: 101, product_id: 'P300', qty_ordered: 14000, due_date: '2026-10-06', status: 'closed' },
  { wo_id: 102, product_id: 'P300', qty_ordered: 12000, due_date: '2026-10-12', status: 'open' },
  { wo_id: 103, product_id: 'P100', qty_ordered: 10000, due_date: '2026-10-07', status: 'closed' },
  { wo_id: 104, product_id: 'P400', qty_ordered: 7000, due_date: '2026-10-09', status: 'late' },
  { wo_id: 105, product_id: 'P200', qty_ordered: 6000, due_date: '2026-10-10', status: 'open' },
  { wo_id: 106, product_id: 'P100', qty_ordered: 5000, due_date: '2026-10-14', status: 'open' },
  { wo_id: 107, product_id: 'P400', qty_ordered: 1500, due_date: '2026-10-15', status: 'open' }, // not started
]

// Which work order each machine runs on each day (1..8).
const WO_FOR: Record<string, (day: number) => number> = {
  M1: (d) => (d <= 4 ? 101 : 102),
  M2: (d) => (d <= 5 ? 101 : 102),
  M3: (d) => (d <= 4 ? 103 : 104),
  M4: (d) => (d <= 3 ? 104 : 105),
  M5: (d) => (d <= 5 ? 103 : 106),
}
const SCRAP: Record<string, number> = { M1: 0.012, M2: 0.03, M3: 0.06, M4: 0.015, M5: 0.02 }
const DOWN: Record<string, [number, number]> = { M1: [5, 30], M2: [10, 45], M3: [30, 95], M4: [0, 25], M5: [5, 40] }
const CODES: Record<string, string[]> = { Press: ['CRACK', 'SCRATCH'], CNC: ['DIM', 'BURR'], Welder: ['POROSITY', 'DIM'] }
const REASONS: Record<string, string[]> = { Press: ['Die change', 'Jam'], CNC: ['Tool change', 'Probe fault', 'Setup'], Welder: ['Wire feed', 'Setup'] }

function build() {
  const r = makeRng(20261001)
  const runs: Run[] = []
  const defects: Defect[] = []
  const downtime: Downtime[] = []
  let id = 1
  for (let day = 1; day <= 8; day++) {
    const date = `2026-10-0${day}`
    for (const shift of ['Day', 'Night']) {
      for (const m of MACHINES.filter((x) => x.machine_id !== 'M6')) {
        const wo = WO_FOR[m.machine_id](day)
        const prod = PRODUCTS.find((p) => p.product_id === WORK_ORDERS.find((w) => w.wo_id === wo)!.product_id)!
        const [lo, hi] = DOWN[m.machine_id]
        const down = Math.round(lo + (hi - lo) * r.u()) + (shift === 'Night' && m.machine_id === 'M3' ? 15 : 0)
        const run = 480
        const made = Math.floor((((run - down) * 60) / prod.std_cycle_s) * (0.86 + 0.1 * r.u()))
        const rate = SCRAP[m.machine_id] * (0.6 + 0.8 * r.u()) * (shift === 'Night' && m.machine_id === 'M3' ? 1.5 : 1)
        const scrap = Math.round(made * rate)
        runs.push({ run_id: id, wo_id: wo, machine_id: m.machine_id, run_date: date, shift, good_qty: made - scrap, scrap_qty: scrap, run_min: run, down_min: down })
        if (scrap > 0) {
          const codes = CODES[m.type]
          const first = Math.round(scrap * (0.55 + 0.3 * r.u()))
          defects.push({ defect_id: defects.length + 1, run_id: id, code: codes[0], qty: first })
          if (scrap - first > 0) defects.push({ defect_id: defects.length + 1, run_id: id, code: codes[1], qty: scrap - first })
        }
        if (down >= 30) {
          const reasons = REASONS[m.type]
          downtime.push({ event_id: downtime.length + 1, machine_id: m.machine_id, event_date: date, minutes: down, reason: reasons[Math.floor(r.u() * reasons.length)] })
        }
        id++
      }
    }
  }
  // Deliberate problems for the data-quality lesson.
  const gap = runs.find((x) => x.run_date === '2026-10-05' && x.shift === 'Night' && x.machine_id === 'M4')!
  gap.down_min = null
  runs.push({ ...runs[22], run_id: 81 })
  defects.push({ defect_id: defects.length + 1, run_id: 999, code: 'DIM', qty: 4 })
  downtime[3].reason = null
  downtime[10].reason = null
  return { runs, defects, downtime }
}
export const { runs: PRODUCTION, defects: DEFECTS, downtime: DOWNTIME } = build()

/** What each table holds, shown beside the playground. */
export const SCHEMA: { table: string; about: string; columns: [string, string, string][] }[] = [
  { table: 'products', about: 'What the plant makes', columns: [['product_id', 'TEXT', 'Key, e.g. P100'], ['name', 'TEXT', ''], ['family', 'TEXT', 'Housings, Brackets, Shafts'], ['std_cycle_s', 'REAL', 'Standard cycle time, seconds per part'], ['unit_cost', 'REAL', 'Dollars per part']] },
  { table: 'machines', about: 'Equipment on lines L1 and L2', columns: [['machine_id', 'TEXT', 'Key, e.g. M3'], ['name', 'TEXT', ''], ['line', 'TEXT', 'L1 or L2'], ['type', 'TEXT', 'Press, CNC, Welder, Laser'], ['installed', 'INTEGER', 'Year installed']] },
  { table: 'work_orders', about: 'What customers ordered', columns: [['wo_id', 'INTEGER', 'Key'], ['product_id', 'TEXT', '→ products'], ['qty_ordered', 'INTEGER', ''], ['due_date', 'TEXT', 'YYYY-MM-DD'], ['status', 'TEXT', 'open, closed, late']] },
  { table: 'production', about: 'One row per machine per shift (Oct 1–8, 2026)', columns: [['run_id', 'INTEGER', 'Key'], ['wo_id', 'INTEGER', '→ work_orders'], ['machine_id', 'TEXT', '→ machines'], ['run_date', 'TEXT', 'YYYY-MM-DD'], ['shift', 'TEXT', 'Day or Night'], ['good_qty', 'INTEGER', 'Good parts'], ['scrap_qty', 'INTEGER', 'Scrapped parts'], ['run_min', 'INTEGER', 'Scheduled minutes'], ['down_min', 'INTEGER', 'Unplanned downtime minutes; can be NULL']] },
  { table: 'defects', about: 'Why parts were scrapped', columns: [['defect_id', 'INTEGER', 'Key'], ['run_id', 'INTEGER', '→ production'], ['code', 'TEXT', 'CRACK, SCRATCH, DIM, BURR, POROSITY'], ['qty', 'INTEGER', 'Parts with this defect']] },
  { table: 'downtime', about: 'Logged stops of 30 minutes or more', columns: [['event_id', 'INTEGER', 'Key'], ['machine_id', 'TEXT', '→ machines'], ['event_date', 'TEXT', 'YYYY-MM-DD'], ['minutes', 'INTEGER', ''], ['reason', 'TEXT', 'Can be NULL']] },
]

const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`)
const insert = (table: string, rows: object[]) => rows.length ? `INSERT INTO ${table} VALUES\n${rows.map((o) => `(${Object.values(o).map((v) => q(v as string | number | null)).join(', ')})`).join(',\n')};` : ''

/** The whole database as one SQL script (CREATE + INSERT). */
export function plantSql() {
  return [
    'CREATE TABLE products (product_id TEXT PRIMARY KEY, name TEXT NOT NULL, family TEXT NOT NULL, std_cycle_s REAL NOT NULL, unit_cost REAL NOT NULL);',
    'CREATE TABLE machines (machine_id TEXT PRIMARY KEY, name TEXT NOT NULL, line TEXT NOT NULL, type TEXT NOT NULL, installed INTEGER NOT NULL);',
    'CREATE TABLE work_orders (wo_id INTEGER PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products, qty_ordered INTEGER NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL);',
    'CREATE TABLE production (run_id INTEGER PRIMARY KEY, wo_id INTEGER REFERENCES work_orders, machine_id TEXT REFERENCES machines, run_date TEXT NOT NULL, shift TEXT NOT NULL, good_qty INTEGER NOT NULL, scrap_qty INTEGER NOT NULL, run_min INTEGER NOT NULL, down_min INTEGER);',
    'CREATE TABLE defects (defect_id INTEGER PRIMARY KEY, run_id INTEGER, code TEXT NOT NULL, qty INTEGER NOT NULL);',
    'CREATE TABLE downtime (event_id INTEGER PRIMARY KEY, machine_id TEXT REFERENCES machines, event_date TEXT NOT NULL, minutes INTEGER NOT NULL, reason TEXT);',
    insert('products', PRODUCTS), insert('machines', MACHINES), insert('work_orders', WORK_ORDERS),
    insert('production', PRODUCTION), insert('defects', DEFECTS), insert('downtime', DOWNTIME),
  ].join('\n')
}
