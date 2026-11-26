// A teaching ladder-logic engine: parses rungs written in the text form Allen-Bradley (Rockwell) Logix uses,
// and runs them scan by scan. It models the documented behaviour of each instruction it supports (see the
// Studio 5000 Logix Designer instruction pages cited in the PLC studio), not every controller detail:
// timers count the scan time on every true scan, I/O is read at the start of a scan and written at the end
// (the classic synchronous model), and a restart only applies the prescan rules listed in `prescan`.
// It is not a controller emulator and is not for commissioning real machines.

export type Op =
  | 'XIC' | 'XIO' | 'ONS' | 'GRT' | 'GEQ' | 'LES' | 'LEQ' | 'EQU' | 'NEQ'
  | 'OTE' | 'OTL' | 'OTU' | 'TON' | 'TOF' | 'RTO' | 'CTU' | 'CTD' | 'RES' | 'MOV' | 'ADD' | 'SUB'

export interface Ins { kind: 'ins'; id: number; op: Op; args: string[]; col: number }
export interface Branch { kind: 'branch'; id: number; legs: Node[][]; col: number }
export type Node = Ins | Branch
export interface Rung { nodes: Node[]; text: string; comment?: string; size: number }
export interface Program { rungs: Rung[] }
export interface ParseError { rung: number; line: number; col: number; msg: string }

export const INPUT_OPS: Op[] = ['XIC', 'XIO', 'ONS', 'GRT', 'GEQ', 'LES', 'LEQ', 'EQU', 'NEQ']
export const OUTPUT_OPS: Op[] = ['OTE', 'OTL', 'OTU', 'TON', 'TOF', 'RTO', 'CTU', 'CTD', 'RES', 'MOV', 'ADD', 'SUB']
const ALL = new Set<string>([...INPUT_OPS, ...OUTPUT_OPS])
export const isOutput = (op: Op) => OUTPUT_OPS.includes(op)

/** Operand kinds: b = bit tag, s = timer/counter structure, n = number literal, v = tag or number, d = destination tag. */
const SIG: Record<Op, string[]> = {
  XIC: ['b'], XIO: ['b'], ONS: ['b'], OTE: ['b'], OTL: ['b'], OTU: ['b'],
  GRT: ['v', 'v'], GEQ: ['v', 'v'], LES: ['v', 'v'], LEQ: ['v', 'v'], EQU: ['v', 'v'], NEQ: ['v', 'v'],
  TON: ['s', 'n', 'n?'], TOF: ['s', 'n', 'n?'], RTO: ['s', 'n', 'n?'], CTU: ['s', 'n', 'n?'], CTD: ['s', 'n', 'n?'],
  RES: ['s'], MOV: ['v', 'd'], ADD: ['v', 'v', 'd'], SUB: ['v', 'v', 'd'],
}
export const OP_NAME: Record<Op, string> = {
  XIC: 'Examine If Closed', XIO: 'Examine If Open', ONS: 'One Shot', GRT: 'Greater Than', GEQ: 'Greater Than or Equal',
  LES: 'Less Than', LEQ: 'Less Than or Equal', EQU: 'Equal', NEQ: 'Not Equal', OTE: 'Output Energize', OTL: 'Output Latch',
  OTU: 'Output Unlatch', TON: 'Timer On Delay', TOF: 'Timer Off Delay', RTO: 'Retentive Timer On', CTU: 'Count Up',
  CTD: 'Count Down', RES: 'Reset', MOV: 'Move', ADD: 'Add', SUB: 'Subtract',
}

const TAG = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)?$/
const STRUCT = /^[A-Za-z_][A-Za-z0-9_]*$/
const NUM = /^-?\d+(\.\d+)?$/

type Tok = { t: string; col: number }
function tokenize(s: string, off: number): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (/\s/.test(ch)) { i++; continue }
    if ('()[],;'.includes(ch)) { out.push({ t: ch, col: off + i + 1 }); i++; continue }
    const m = /^-?[A-Za-z0-9_.]+/.exec(s.slice(i))
    if (!m) throw { col: off + i + 1, msg: `Unexpected character “${ch}”` }
    out.push({ t: m[0], col: off + i + 1 })
    i += m[0].length
  }
  return out
}

class RungParser {
  private i = 0
  id = 0
  constructor(private toks: Tok[], private endCol: number) {}
  private peek() { return this.toks[this.i] }
  private err(msg: string, col = this.peek()?.col ?? this.endCol): never { throw { col, msg } }
  series(stop: string[]): Node[] {
    const nodes: Node[] = []
    while (this.peek() && !stop.includes(this.peek().t.toUpperCase())) nodes.push(this.item())
    return nodes
  }
  private legs(open: Tok, sep: string, close: string): Branch {
    const b: Branch = { kind: 'branch', id: this.id++, legs: [], col: open.col }
    for (;;) {
      const leg = this.series([sep, close])
      if (!leg.length) this.err('A branch leg is empty: each leg needs at least one instruction')
      b.legs.push(leg)
      const t = this.peek()
      if (!t) this.err(`Missing ${close === ']' ? '“]”' : 'BND'} to close the branch that starts at column ${open.col}`)
      this.i++
      if (t.t.toUpperCase() === close) break
    }
    if (b.legs.length < 2) this.err(`A branch needs at least two legs (column ${open.col})`, open.col)
    return b
  }
  private item(): Node {
    const t = this.peek()
    const up = t.t.toUpperCase()
    if (t.t === '[') { this.i++; return this.legs(t, ',', ']') }
    if (up === 'BST') { this.i++; return this.legs(t, 'NXB', 'BND') }
    if (t.t === ']' || t.t === ',' || up === 'NXB' || up === 'BND') this.err(`“${t.t}” without an open branch`)
    if (t.t === '(' || t.t === ')' || t.t === ';') this.err(`Unexpected “${t.t}”`)
    if (!ALL.has(up)) this.err(`Unknown instruction “${t.t}”. This engine knows ${[...ALL].join(', ')}`)
    const op = up as Op
    this.i++
    if (this.peek()?.t !== '(') this.err(`${op} needs its operands in parentheses, for example ${op}(${SIG[op].map(argHint).join(',')})`)
    this.i++
    const args: string[] = []
    while (this.peek() && this.peek().t !== ')') {
      const a = this.peek()
      if (a.t === ',') { this.i++; continue }
      if ('()[];'.includes(a.t)) this.err(`Unexpected “${a.t}” inside ${op}( )`)
      args.push(a.t); this.i++
    }
    if (!this.peek()) this.err(`Missing “)” after ${op}(`)
    this.i++
    checkArgs(op, args, t.col)
    return { kind: 'ins', id: this.id++, op, args, col: t.col }
  }
  done() { return this.i >= this.toks.length }
}

const argHint = (k: string) => ({ b: 'Bit', s: 'Timer', n: '1000', 'n?': '0', v: 'Value', d: 'Dest' }[k] ?? 'x')
function checkArgs(op: Op, args: string[], col: number) {
  const sig = SIG[op]
  const need = sig.filter((k) => !k.endsWith('?')).length
  if (args.length < need || args.length > sig.length) throw { col, msg: `${op} needs ${need === sig.length ? need : `${need} or ${sig.length}`} operand${sig.length > 1 ? 's' : ''}, got ${args.length}: ${op}(${sig.map(argHint).join(',')})` }
  args.forEach((a, k) => {
    const kind = sig[k].replace('?', '')
    if (kind === 'b' && !TAG.test(a)) throw { col, msg: `${op} needs a bit tag, not “${a}”` }
    if (kind === 's' && !STRUCT.test(a)) throw { col, msg: `${op} needs a timer or counter tag name (no dot), not “${a}”` }
    if (kind === 'n' && !(NUM.test(a) && Number(a) >= 0)) throw { col, msg: `${op} needs a whole number ≥ 0 here, not “${a}”` }
    if (kind === 'v' && !(TAG.test(a) || NUM.test(a))) throw { col, msg: `${op} needs a tag or a number, not “${a}”` }
    if (kind === 'd' && !TAG.test(a)) throw { col, msg: `${op} needs a destination tag, not “${a}”` }
  })
}

const endsWithOutput = (nodes: Node[]): boolean => {
  const last = nodes[nodes.length - 1]
  if (!last) return false
  return last.kind === 'ins' ? isOutput(last.op) : last.legs.every(endsWithOutput)
}

export function parseRung(text: string, off = 0): Rung {
  const body = text.replace(/;\s*$/, '')
  const toks = tokenize(body, off)
  const p = new RungParser(toks, off + body.length + 1)
  const nodes = p.series([])
  if (!p.done()) throw { col: toks[toks.length - 1].col, msg: 'Unexpected text at the end of the rung' }
  if (!nodes.length) throw { col: off + 1, msg: 'Empty rung' }
  if (!endsWithOutput(nodes)) throw { col: off + body.length, msg: 'A rung must end with an output instruction (OTE, OTL, OTU, TON, TOF, RTO, CTU, CTD, RES, MOV, ADD or SUB)' }
  return { nodes, text: body.trim(), size: p.id }
}

/** One rung per line; `//` lines are comments attached to the next rung. */
export function parseProgram(src: string): { program: Program; errors: ParseError[] } {
  const rungs: Rung[] = []
  const errors: ParseError[] = []
  let comment: string[] = []
  src.split('\n').forEach((raw, li) => {
    const line = raw.trim()
    if (!line) return
    if (line.startsWith('//')) { comment.push(line.replace(/^\/\/\s?/, '')); return }
    const code = raw.replace(/\/\/.*$/, '')
    try {
      const r = parseRung(code)
      if (comment.length) r.comment = comment.join(' ')
      rungs.push(r)
    } catch (e) {
      const x = e as { col?: number; msg?: string }
      errors.push({ rung: rungs.length + errors.length, line: li + 1, col: x.col ?? 1, msg: x.msg ?? String(e) })
    }
    comment = []
  })
  return { program: { rungs }, errors }
}

// ---------- Running ----------
export type Tags = Record<string, number>
export interface Trace { rin: boolean; rout: boolean }
export type RungTrace = Record<number, Trace>

const num = (t: Tags, a: string) => (NUM.test(a) ? Number(a) : t[a] ?? 0)
const bit = (t: Tags, a: string) => (t[a] ?? 0) !== 0
const setb = (t: Tags, a: string, v: boolean) => { t[a] = v ? 1 : 0 }

function exec(n: Ins, rin: boolean, t: Tags, dt: number): boolean {
  const [a, b, c] = n.args
  switch (n.op) {
    case 'XIC': return rin && bit(t, a)
    case 'XIO': return rin && !bit(t, a)
    case 'ONS': { const was = bit(t, a); setb(t, a, rin); return rin && !was }
    case 'GRT': return rin && num(t, a) > num(t, b)
    case 'GEQ': return rin && num(t, a) >= num(t, b)
    case 'LES': return rin && num(t, a) < num(t, b)
    case 'LEQ': return rin && num(t, a) <= num(t, b)
    case 'EQU': return rin && num(t, a) === num(t, b)
    case 'NEQ': return rin && num(t, a) !== num(t, b)
    case 'OTE': setb(t, a, rin); return rin
    case 'OTL': if (rin) setb(t, a, true); return rin
    case 'OTU': if (rin) setb(t, a, false); return rin
    case 'TON': {
      const pre = Number(b); t[`${a}.PRE`] = pre
      if (rin) {
        t[`${a}.EN`] = 1
        const acc = Math.min(pre, (t[`${a}.ACC`] ?? 0) + dt)
        t[`${a}.ACC`] = acc; t[`${a}.DN`] = acc >= pre ? 1 : 0; t[`${a}.TT`] = acc >= pre ? 0 : 1
      } else { t[`${a}.EN`] = 0; t[`${a}.TT`] = 0; t[`${a}.DN`] = 0; t[`${a}.ACC`] = 0 }
      return rin
    }
    case 'TOF': {
      const pre = Number(b); t[`${a}.PRE`] = pre
      if (rin) { t[`${a}.EN`] = 1; t[`${a}.DN`] = 1; t[`${a}.TT`] = 0; t[`${a}.ACC`] = 0 }
      else {
        t[`${a}.EN`] = 0
        if (bit(t, `${a}.DN`)) {
          const acc = Math.min(pre, (t[`${a}.ACC`] ?? 0) + dt)
          t[`${a}.ACC`] = acc
          if (acc >= pre) { t[`${a}.DN`] = 0; t[`${a}.TT`] = 0 } else t[`${a}.TT`] = 1
        }
      }
      return rin
    }
    case 'RTO': {
      const pre = Number(b); t[`${a}.PRE`] = pre
      t[`${a}.EN`] = rin ? 1 : 0
      if (rin) {
        const acc = Math.min(pre, (t[`${a}.ACC`] ?? 0) + dt)
        t[`${a}.ACC`] = acc; t[`${a}.DN`] = acc >= pre ? 1 : 0; t[`${a}.TT`] = acc >= pre ? 0 : 1
      } else t[`${a}.TT`] = 0
      return rin
    }
    case 'CTU': case 'CTD': {
      const pre = Number(b); t[`${a}.PRE`] = pre
      const edge = n.op === 'CTU' ? `${a}.CU` : `${a}.CD`
      const was = t[edge] ?? 1 // prescan sets .CU/.CD so the first scan cannot count
      if (rin && !was) t[`${a}.ACC`] = (t[`${a}.ACC`] ?? 0) + (n.op === 'CTU' ? 1 : -1)
      t[edge] = rin ? 1 : 0
      t[`${a}.DN`] = (t[`${a}.ACC`] ?? 0) >= pre ? 1 : 0
      return rin
    }
    case 'RES': if (rin) for (const m of ['ACC', 'DN', 'TT', 'EN']) t[`${a}.${m}`] = 0; return rin
    case 'MOV': if (rin) t[b] = num(t, a); return rin
    case 'ADD': if (rin) t[c] = num(t, a) + num(t, b); return rin
    case 'SUB': if (rin) t[c] = num(t, a) - num(t, b); return rin
  }
}

function series(nodes: Node[], rin: boolean, t: Tags, dt: number, tr: RungTrace): boolean {
  let r = rin
  for (const n of nodes) {
    const before = r
    if (n.kind === 'ins') r = exec(n, r, t, dt)
    else { let any = false; for (const leg of n.legs) any = series(leg, r, t, dt, tr) || any; r = any }
    tr[n.id] = { rin: before, rout: r }
  }
  return r
}

/** One scan: copy the input image in, solve every rung top to bottom (every instruction runs, true or false), and
 *  return the tags at the end of the scan. `dt` is the scan time in milliseconds. */
export function scan(p: Program, tags: Tags, inputs: Tags, dt: number): { tags: Tags; traces: RungTrace[]; rungs: boolean[] } {
  const t: Tags = { ...tags, ...inputs }
  const traces: RungTrace[] = []
  const rungs = p.rungs.map((r) => { const tr: RungTrace = {}; const v = series(r.nodes, true, t, dt, tr); traces.push(tr); return v })
  return { tags: t, traces, rungs }
}

/** The prescan rules this engine applies when the program is restarted: OTE bits are cleared, ONS storage bits and
 *  counter .CU/.CD bits are set so the first scan can't trigger them. Every other tag keeps its value. */
export function prescan(p: Program, tags: Tags): Tags {
  const t = { ...tags }
  walk(p, (n) => {
    if (n.op === 'OTE') t[n.args[0]] = 0
    if (n.op === 'ONS') t[n.args[0]] = 1
    if (n.op === 'CTU') t[`${n.args[0]}.CU`] = 1
    if (n.op === 'CTD') t[`${n.args[0]}.CD`] = 1
  })
  return t
}

export function walk(p: Program, f: (n: Ins, rung: number) => void) {
  const go = (nodes: Node[], r: number) => nodes.forEach((n) => (n.kind === 'ins' ? f(n, r) : n.legs.forEach((l) => go(l, r))))
  p.rungs.forEach((r, i) => go(r.nodes, i))
}

/** Every tag the program reads or writes, structures expanded to the members it uses. */
export function tagsOf(p: Program): { bits: string[]; numbers: string[]; structs: { name: string; kind: 'timer' | 'counter' }[] } {
  const bits = new Set<string>(), numbers = new Set<string>(), structs = new Map<string, 'timer' | 'counter'>()
  walk(p, (n) => {
    const sig = SIG[n.op]
    n.args.forEach((a, k) => {
      const kind = sig[k].replace('?', '')
      if (kind === 'b') bits.add(a)
      if (kind === 's') structs.set(a, ['CTU', 'CTD'].includes(n.op) ? 'counter' : structs.get(a) ?? 'timer')
      if ((kind === 'v' || kind === 'd') && !NUM.test(a)) numbers.add(a)
    })
  })
  for (const b of [...bits]) if (b.includes('.') && structs.has(b.split('.')[0])) bits.delete(b)
  for (const v of [...numbers]) if (v.includes('.') && structs.has(v.split('.')[0])) numbers.delete(v)
  return { bits: [...bits], numbers: [...numbers], structs: [...structs].map(([name, kind]) => ({ name, kind })) }
}

export interface Warning { rung: number; msg: string }
/** Problems a reviewer would flag: double coils, mixed OTE and latch on one bit, a structure shared by two kinds of
 *  instruction, and (when the inputs are known) writing to an input or reading a bit nothing sets. */
export function lint(p: Program, inputs: string[] = []): Warning[] {
  const w: Warning[] = []
  const ote = new Map<string, number[]>(), latch = new Map<string, number[]>(), struct = new Map<string, Op[]>()
  const written = new Set<string>(), read: { tag: string; rung: number }[] = []
  walk(p, (n, r) => {
    const a = n.args[0]
    if (n.op === 'OTE') ote.set(a, [...(ote.get(a) ?? []), r])
    if (n.op === 'OTL' || n.op === 'OTU') latch.set(a, [...(latch.get(a) ?? []), r])
    if (['TON', 'TOF', 'RTO', 'CTU', 'CTD'].includes(n.op)) struct.set(a, [...(struct.get(a) ?? []), n.op])
    if (['OTE', 'OTL', 'OTU', 'ONS'].includes(n.op)) written.add(a)
    if (['TON', 'TOF', 'RTO', 'CTU', 'CTD'].includes(n.op)) ['DN', 'EN', 'TT', 'ACC', 'PRE', 'CU', 'CD'].forEach((m) => written.add(`${a}.${m}`))
    if (n.op === 'MOV') written.add(n.args[1])
    if (n.op === 'ADD' || n.op === 'SUB') written.add(n.args[2])
    if (n.op === 'XIC' || n.op === 'XIO') read.push({ tag: a, rung: r })
    if (inputs.includes(a) && ['OTE', 'OTL', 'OTU'].includes(n.op)) w.push({ rung: r, msg: `${n.op}(${a}) writes to an input. The next scan's input image overwrites it.` })
  })
  for (const [tag, rs] of ote) if (rs.length > 1) w.push({ rung: rs[rs.length - 1], msg: `Double coil: ${tag} has an OTE on rungs ${rs.join(', ')}. Every one runs each scan, so the last one decides the bit; put the conditions in parallel on one rung.` })
  for (const [tag, rs] of latch) if (ote.has(tag)) w.push({ rung: rs[0], msg: `${tag} is written by OTE and by OTL/OTU. The OTE overwrites the latch every scan.` })
  for (const [tag, ops] of struct) {
    const kinds = [...new Set(ops)]
    const counter = kinds.every((k) => k === 'CTU' || k === 'CTD')
    if (!counter && kinds.length > 1) w.push({ rung: 0, msg: `${tag} is used by ${kinds.join(' and ')}. Give each timer its own tag.` })
    else for (const k of kinds) if (ops.filter((o) => o === k).length > 1) w.push({ rung: 0, msg: `${tag} is used by ${ops.filter((o) => o === k).length} ${k} instructions. They fight over one accumulator; give each its own tag.` })
  }
  if (inputs.length) for (const r of read) if (!inputs.includes(r.tag) && !written.has(r.tag)) w.push({ rung: r.rung, msg: `${r.tag} is read on rung ${r.rung} but no input or instruction ever sets it, so it is always 0.` })
  return dedupe(w)
}
const dedupe = (w: Warning[]) => w.filter((x, i) => w.findIndex((y) => y.msg === x.msg) === i)

// ---------- Field devices and test scripts ----------
/** A field device wired to an input. NC devices give bit 1 while NOT actuated; a broken wire always reads 0. */
export interface Device { tag: string; label: string; kind: 'push' | 'toggle'; wiring?: 'NO' | 'NC' }
export type Phys = Record<string, 0 | 1 | 'broken'>
export const inputBit = (d: Device | undefined, s: 0 | 1 | 'broken' | undefined): number => {
  if (s === 'broken') return 0
  const on = s === 1
  return (d?.wiring === 'NC' ? !on : on) ? 1 : 0
}
export const inputImage = (devices: Device[], phys: Phys): Tags => Object.fromEntries(devices.map((d) => [d.tag, inputBit(d, phys[d.tag] ?? 0)]))

export interface Step {
  /** Change field devices: 1 = pressed/actuated, 0 = released, 'broken' = wire cut. Values persist to later steps. */
  set?: Phys
  /** Milliseconds to keep scanning after the change (default: one scan). */
  hold?: number
  /** Restart the program (prescan) before scanning. */
  restart?: boolean
  /** Tag values expected after the hold. */
  expect?: Tags
  say: string
}
export interface StepResult { say: string; phys: Phys; tags: Tags; wrong: { tag: string; want: number; got: number }[]; t: number }
export const SCAN_MS = 10

export function runScript(p: Program, devices: Device[], steps: Step[], dt = SCAN_MS): { rows: StepResult[]; pass: boolean; traces: RungTrace[]; tags: Tags } {
  // One idle scan first: the program is already running when the scenario starts, so prescan protection on
  // counters and one-shots doesn't swallow the first event.
  let tags: Tags = scan(p, {}, inputImage(devices, {}), dt).tags
  let phys: Phys = {}
  let t = 0
  const rows: StepResult[] = []
  let traces: RungTrace[] = []
  for (const s of steps) {
    phys = { ...phys, ...(s.set ?? {}) }
    if (s.restart) tags = prescan(p, tags)
    const n = Math.max(1, Math.round((s.hold ?? dt) / dt))
    for (let k = 0; k < n; k++) { const r = scan(p, tags, inputImage(devices, phys), dt); tags = r.tags; traces = r.traces; t += dt }
    const wrong = Object.entries(s.expect ?? {}).filter(([k, v]) => (tags[k] ?? 0) !== v).map(([tag, want]) => ({ tag, want, got: tags[tag] ?? 0 }))
    rows.push({ say: s.say, phys: { ...phys }, tags: { ...tags }, wrong, t })
  }
  return { rows, pass: rows.every((r) => r.wrong.length === 0), traces, tags }
}

/** Press-and-release pulses on one device: `n` times, `on` ms pressed and `off` ms released. */
export function pulses(tag: string, n: number, on = 100, off = 100): Step[] {
  return Array.from({ length: n }, (_, k) => [
    { set: { [tag]: 1 as const }, hold: on, say: `${tag} pulse ${k + 1}: on` },
    { set: { [tag]: 0 as const }, hold: off, say: `${tag} pulse ${k + 1}: off` },
  ]).flat()
}

/** Instructions on the rung's main line that receive power but don't pass it on: where an online view would show
 *  the rung stop. Branches count as one item, named by their legs. */
export function blockers(r: Rung, tr: RungTrace): Node[] {
  return r.nodes.filter((n) => tr[n.id]?.rin && !tr[n.id]?.rout)
}

export const insText = (n: Node): string => (n.kind === 'ins' ? `${n.op}(${n.args.join(',')})` : `[${n.legs.map((l) => l.map(insText).join(' ')).join(', ')}]`)
