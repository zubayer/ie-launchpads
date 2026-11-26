import { describe, expect, it } from 'vitest'
import { blockers, inputBit, lint, parseProgram, parseRung, prescan, runScript, scan, tagsOf, type Program, type Tags } from './ladder'

// Expected values in this file are worked out by hand from the instruction descriptions (Rockwell Studio 5000
// Logix Designer instruction set pages), not produced by running the engine first.
const prog = (src: string): Program => {
  const { program, errors } = parseProgram(src)
  expect(errors, JSON.stringify(errors)).toEqual([])
  return program
}
/** Run n scans of dt ms with fixed inputs. */
const run = (p: Program, inputs: Tags, n: number, tags: Tags = {}, dt = 10) => {
  let t = tags
  for (let k = 0; k < n; k++) t = scan(p, t, inputs, dt).tags
  return t
}

describe('ladder parser', () => {
  it('reads series, bracket branches and BST/NXB/BND branches', () => {
    const a = parseRung('XIC(A) [XIC(B), XIC(C) XIO(D)] OTE(Y);')
    const b = parseRung('XIC(A) BST XIC(B) NXB XIC(C) XIO(D) BND OTE(Y)')
    expect(a.nodes.length).toBe(3)
    expect(b.nodes.length).toBe(3)
    const pa: Program = { rungs: [a] }, pb: Program = { rungs: [b] }
    for (const A of [0, 1]) for (const B of [0, 1]) for (const C of [0, 1]) for (const D of [0, 1]) {
      const want = A && (B || (C && !D)) ? 1 : 0
      expect(scan(pa, {}, { A, B, C, D }, 10).tags.Y).toBe(want)
      expect(scan(pb, {}, { A, B, C, D }, 10).tags.Y).toBe(want)
    }
  })
  it('accepts nested branches and parallel outputs', () => {
    const p = prog('XIC(A) [XIC(B) [XIC(C), XIC(D)], XIC(E)] OTE(Y)\nXIC(S) [OTE(Q1), OTE(Q2)]')
    expect(scan(p, {}, { A: 1, B: 1, D: 1 }, 10).tags.Y).toBe(1)
    expect(scan(p, {}, { A: 1, B: 1 }, 10).tags.Y).toBe(0)
    const t = scan(p, {}, { S: 1 }, 10).tags
    expect([t.Q1, t.Q2]).toEqual([1, 1])
  })
  it('reports plain-language errors with the column', () => {
    const cases: [string, RegExp][] = [
      ['XIC(A) FOO(B) OTE(Y)', /Unknown instruction “FOO”/],
      ['XIC(A) [XIC(B), XIC(C) OTE(Y)', /Missing “\]”/],
      ['XIC(A) XIC(B)', /must end with an output/],
      ['XIC(A,B) OTE(Y)', /XIC needs 1 operand/],
      ['XIC A OTE(Y)', /parentheses/],
      ['XIC(A) [XIC(B)] OTE(Y)', /at least two legs/],
      ['XIC(A) [XIC(B), ] OTE(Y)', /leg is empty/],
      ['TON(T1.DN, 100)', /timer or counter tag name/],
      ['XIC(A) TON(T1, -5)', /whole number/],
    ]
    for (const [src, re] of cases) {
      const { errors } = parseProgram(src)
      expect(errors.length, src).toBe(1)
      expect(errors[0].msg, src).toMatch(re)
      expect(errors[0].col, src).toBeGreaterThan(0)
    }
  })
  it('keeps // comments with the next rung and ignores blank lines', () => {
    const p = prog('// Start the pump\nXIC(Start) OTE(Pump)\n\nXIC(B) OTE(C) // trailing note')
    expect(p.rungs.length).toBe(2)
    expect(p.rungs[0].comment).toBe('Start the pump')
  })
})

describe('bit instructions and the scan', () => {
  it('XIC is true when the bit is 1, XIO when it is 0, whatever the device', () => {
    const p = prog('XIC(B) OTE(X1)\nXIO(B) OTE(X0)')
    expect(scan(p, {}, { B: 1 }, 10).tags).toMatchObject({ X1: 1, X0: 0 })
    expect(scan(p, {}, { B: 0 }, 10).tags).toMatchObject({ X1: 0, X0: 1 })
  })
  it('a false rung still runs its OTE and clears the bit', () => {
    const p = prog('XIC(A) OTE(Y)')
    const on = run(p, { A: 1 }, 1)
    expect(on.Y).toBe(1)
    expect(run(p, { A: 0 }, 1, on).Y).toBe(0)
  })
  it('double coil: the last OTE in the scan decides', () => {
    const p = prog('XIC(A) OTE(Y)\nXIC(B) OTE(Y)')
    expect(run(p, { A: 1, B: 0 }, 1).Y).toBe(0)
    expect(run(p, { A: 0, B: 1 }, 1).Y).toBe(1)
    expect(lint(p).some((w) => /Double coil: Y/.test(w.msg))).toBe(true)
  })
  it('rung order: a later rung sees a bit in the same scan, an earlier rung one scan later', () => {
    const down = prog('XIC(S) OTE(Seen)\nXIC(Seen) OTE(L)')
    const up = prog('XIC(Seen) OTE(L)\nXIC(S) OTE(Seen)')
    expect(run(down, { S: 1 }, 1)).toMatchObject({ Seen: 1, L: 1 })
    expect(run(up, { S: 1 }, 1)).toMatchObject({ Seen: 1, L: 0 })
    expect(run(up, { S: 1 }, 2)).toMatchObject({ Seen: 1, L: 1 })
  })
  it('OTL holds the bit when the rung goes false; OTU clears it', () => {
    const p = prog('XIC(Set) OTL(Q)\nXIC(Clr) OTU(Q)')
    let t = run(p, { Set: 1 }, 1)
    t = run(p, { Set: 0 }, 5, t)
    expect(t.Q).toBe(1)
    expect(run(p, { Clr: 1 }, 1, t).Q).toBe(0)
  })
  it('ONS passes power for exactly one scan per false-to-true change', () => {
    const p = prog('XIC(PE) ONS(PE_ONS) ADD(N, 1, N)')
    let t = run(p, { PE: 1 }, 20)
    expect(t.N).toBe(1)
    t = run(p, { PE: 0 }, 3, t)
    t = run(p, { PE: 1 }, 7, t)
    expect(t.N).toBe(2)
    expect(run(prog('XIC(PE) ADD(N, 1, N)'), { PE: 1 }, 20).N).toBe(20)
  })
  it('comparisons and MOV/ADD/SUB', () => {
    const p = prog('MOV(7, A)\nGRT(A, 5) OTE(G)\nLES(A, 5) OTE(L)\nEQU(A, 7) OTE(E)\nNEQ(A, 7) OTE(N)\nGEQ(A, 7) LEQ(A, 7) OTE(GL)\nSUB(A, 2, B)')
    expect(run(p, {}, 1)).toMatchObject({ A: 7, G: 1, L: 0, E: 1, N: 0, GL: 1, B: 5 })
  })
})

describe('timers (dt = 10 ms per scan)', () => {
  it('TON: done when ACC reaches PRE; any false scan resets ACC and bits', () => {
    const p = prog('XIC(In) TON(T, 100)')
    let t = run(p, { In: 1 }, 9)
    expect(t).toMatchObject({ 'T.ACC': 90, 'T.DN': 0, 'T.TT': 1, 'T.EN': 1 })
    t = run(p, { In: 1 }, 1, t)
    expect(t).toMatchObject({ 'T.ACC': 100, 'T.DN': 1, 'T.TT': 0 })
    t = run(p, { In: 1 }, 5, t)
    expect(t['T.ACC']).toBe(100)
    t = run(p, { In: 0 }, 1, t)
    expect(t).toMatchObject({ 'T.ACC': 0, 'T.DN': 0, 'T.TT': 0, 'T.EN': 0 })
  })
  it('TON in pieces never finishes: 60 ms + 60 ms with a gap is not 100 ms', () => {
    const p = prog('XIC(In) TON(T, 100)')
    let t = run(p, { In: 1 }, 6)
    t = run(p, { In: 0 }, 1, t)
    t = run(p, { In: 1 }, 6, t)
    expect(t).toMatchObject({ 'T.ACC': 60, 'T.DN': 0 })
  })
  it('TOF: DN on while the rung is true, then for PRE after it goes false', () => {
    const p = prog('XIC(In) TOF(T, 100)\nXIC(T.DN) OTE(Fan)')
    expect(run(p, { In: 0 }, 3).Fan).toBe(0) // never enabled: nothing to time
    let t = run(p, { In: 1 }, 2)
    expect(t).toMatchObject({ 'T.DN': 1, 'T.ACC': 0, Fan: 1 })
    t = run(p, { In: 0 }, 9, t)
    expect(t).toMatchObject({ 'T.DN': 1, 'T.TT': 1, 'T.ACC': 90, Fan: 1 })
    t = run(p, { In: 0 }, 1, t)
    expect(t).toMatchObject({ 'T.DN': 0, 'T.TT': 0, Fan: 0 })
    t = run(p, { In: 1 }, 1, run(p, { In: 0 }, 4, run(p, { In: 1 }, 1, t)))
    expect(t).toMatchObject({ 'T.ACC': 0, 'T.DN': 1 })
  })
  it('RTO keeps ACC through false scans until RES', () => {
    const p = prog('XIC(In) RTO(T, 100)\nXIC(R) RES(T)')
    let t = run(p, { In: 1 }, 6)
    t = run(p, { In: 0 }, 20, t)
    expect(t).toMatchObject({ 'T.ACC': 60, 'T.DN': 0, 'T.TT': 0, 'T.EN': 0 })
    t = run(p, { In: 1 }, 4, t)
    expect(t).toMatchObject({ 'T.ACC': 100, 'T.DN': 1 })
    t = run(p, { In: 0 }, 3, t)
    expect(t['T.DN']).toBe(1)
    t = run(p, { R: 1 }, 1, t)
    expect(t).toMatchObject({ 'T.ACC': 0, 'T.DN': 0 })
  })
})

describe('counters', () => {
  it('CTU counts false-to-true transitions, not scans, and keeps counting past the preset', () => {
    const p = prog('XIC(PE) CTU(C, 3)\nXIC(R) RES(C)')
    let t = run(p, { PE: 0 }, 1) // a false first scan, so the first pulse is an edge
    for (let k = 0; k < 4; k++) { t = run(p, { PE: 1 }, 5, t); t = run(p, { PE: 0 }, 5, t) }
    expect(t).toMatchObject({ 'C.ACC': 4, 'C.DN': 1 })
    t = run(p, { R: 1 }, 1, t)
    expect(t).toMatchObject({ 'C.ACC': 0, 'C.DN': 0 })
  })
  it('a rung already true on the first scan does not count (prescan sets .CU)', () => {
    const p = prog('XIC(PE) CTU(C, 3)')
    expect(run(p, { PE: 1 }, 5)['C.ACC'] ?? 0).toBe(0)
  })
  it('CTU and CTD share one counter', () => {
    const p = prog('XIC(In) CTU(B, 5)\nXIC(Out) CTD(B, 5)')
    const idle = { In: 0, Out: 0 }
    let t = run(p, idle, 1)
    for (let k = 0; k < 3; k++) { t = run(p, { ...idle, In: 1 }, 2, t); t = run(p, idle, 2, t) }
    t = run(p, { ...idle, Out: 1 }, 2, t); t = run(p, idle, 2, t)
    expect(t['B.ACC']).toBe(2)
    expect(lint(p).length).toBe(0)
  })
})

describe('restart, field wiring and scripts', () => {
  it('prescan clears OTE bits but leaves latched bits', () => {
    const p = prog('XIC(A) OTE(Y)\nXIC(B) OTL(Q)')
    let t = run(p, { A: 1, B: 1 }, 1)
    t = prescan(p, t)
    expect([t.Y, t.Q]).toEqual([0, 1])
  })
  it('NO and NC wiring, and a broken wire', () => {
    const NO = { tag: 'x', label: '', kind: 'push' as const }, NC = { ...NO, wiring: 'NC' as const }
    expect([inputBit(NO, 0), inputBit(NO, 1), inputBit(NC, 0), inputBit(NC, 1)]).toEqual([0, 1, 1, 0])
    expect([inputBit(NO, 'broken'), inputBit(NC, 'broken')]).toEqual([0, 0])
  })
  it('a seal-in with an NC stop drops out when the stop wire breaks', () => {
    const p = prog('[XIC(Start), XIC(Motor)] XIC(Stop) OTE(Motor)')
    const dev = [{ tag: 'Start', label: '', kind: 'push' as const }, { tag: 'Stop', label: '', kind: 'push' as const, wiring: 'NC' as const }]
    const r = runScript(p, dev, [
      { set: { Start: 1 }, hold: 50, expect: { Motor: 1 }, say: 'start' },
      { set: { Start: 0 }, hold: 50, expect: { Motor: 1 }, say: 'release: sealed in' },
      { set: { Stop: 'broken' }, expect: { Motor: 0 }, say: 'wire cut' },
    ])
    expect(r.pass).toBe(true)
    expect(r.rows[2].t).toBe(110)
  })
  it('scripts report the wrong tags', () => {
    const p = prog('XIC(Start) OTE(Motor)')
    const r = runScript(p, [{ tag: 'Start', label: '', kind: 'push' }], [
      { set: { Start: 1 }, expect: { Motor: 1 }, say: 'press' },
      { set: { Start: 0 }, expect: { Motor: 1 }, say: 'release' },
    ])
    expect(r.pass).toBe(false)
    expect(r.rows[1].wrong).toEqual([{ tag: 'Motor', want: 1, got: 0 }])
  })
  it('blockers name the instruction where power stops', () => {
    const p = prog('XIC(A) XIC(B) XIO(C) OTE(Y)')
    const { traces } = scan(p, {}, { A: 1, B: 1, C: 1 }, 10)
    expect(blockers(p.rungs[0], traces[0]).map((n) => n.kind === 'ins' && n.args[0])).toEqual(['C'])
  })
  it('lists the tags a program uses', () => {
    const t = tagsOf(prog('XIC(A) TON(T1, 100)\nXIC(T1.DN) CTU(C1, 2)\nGEQ(C1.ACC, 2) MOV(5, N)'))
    expect(t.bits).toEqual(['A'])
    expect(t.numbers).toEqual(['N'])
    expect(t.structs).toEqual([{ name: 'T1', kind: 'timer' }, { name: 'C1', kind: 'counter' }])
  })
  it('lint: OTE plus latch, shared timer, writing an input, reading a bit nothing sets', () => {
    expect(lint(prog('XIC(A) OTE(Q)\nXIC(B) OTL(Q)')).some((w) => /OTE and by OTL/.test(w.msg))).toBe(true)
    expect(lint(prog('XIC(A) TON(T, 1)\nXIC(B) TON(T, 2)')).some((w) => /2 TON instructions/.test(w.msg))).toBe(true)
    expect(lint(prog('XIC(A) OTE(B)'), ['A', 'B']).some((w) => /writes to an input/.test(w.msg))).toBe(true)
    expect(lint(prog('XIC(Ghost) OTE(Y)'), ['A']).some((w) => /Ghost is read/.test(w.msg))).toBe(true)
  })
})
