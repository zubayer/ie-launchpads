import { describe, expect, it } from 'vitest'
import { PLC_LESSONS, PLC_LESSON_MAP } from '../content/plc/course'
import { CONCEPT_MAP } from '../content'
import { SOURCES } from '../content/sources'
import { DEEP_DIVE } from '../content/deepDives'
import { blockers, insText, lint, parseProgram, runScript, walk, type Device, type Program, type Step } from './ladder'

const load = (src: string, where: string): Program => {
  const { program, errors } = parseProgram(src)
  expect(errors, `${where}: ${JSON.stringify(errors)}`).toEqual([])
  return program
}
const failing = (r: ReturnType<typeof runScript>) => r.rows.filter((x) => x.wrong.length).map((x) => `${x.say}: ${x.wrong.map((w) => `${w.tag}=${w.got} (want ${w.want})`).join(', ')}`)
const devicesCover = (devices: Device[], steps: Step[], where: string) => {
  for (const s of steps) for (const k of Object.keys(s.set ?? {})) expect(devices.some((d) => d.tag === k), `${where}: ${k} is not a device`).toBe(true)
  for (const s of steps) expect(s.say.trim().length, where).toBeGreaterThan(2)
}

describe('PLC studio course', () => {
  it('lessons are well formed and point at real lesson pages and sources', () => {
    expect(PLC_LESSONS.length).toBeGreaterThanOrEqual(9)
    expect(new Set(PLC_LESSONS.map((l) => l.id)).size).toBe(PLC_LESSONS.length)
    const ids = new Set<string>()
    for (const l of PLC_LESSONS) {
      expect(CONCEPT_MAP[l.concept], `${l.id} → ${l.concept}`).toBeTruthy()
      expect(PLC_LESSON_MAP[l.id]).toBe(l)
      expect(l.examples.length, l.id).toBeGreaterThan(0)
      expect(l.mistakes.length, l.id).toBeGreaterThan(0)
      expect(l.tasks.length, l.id).toBeGreaterThan(0)
      expect(l.checks.length, l.id).toBeGreaterThan(0)
      expect(l.model.length, l.id).toBeGreaterThanOrEqual(4)
      for (const c of l.cites) expect(SOURCES[c.src], `${l.id} cites ${c.src}`).toBeTruthy()
      for (const x of [...l.examples, ...l.mistakes, ...l.tasks, ...l.checks, ...(l.puzzles ?? [])]) {
        expect(ids.has(x.id), `duplicate id ${x.id}`).toBe(false)
        ids.add(x.id)
      }
      for (const c of l.checks) {
        expect(c.answer, c.id).toBeGreaterThanOrEqual(0)
        expect(c.answer, c.id).toBeLessThan(c.options.length)
        expect(new Set(c.options).size, c.id).toBe(c.options.length)
      }
    }
  })

  it('every example behaves exactly as its scenario says, with no review warnings', () => {
    for (const l of PLC_LESSONS) for (const e of l.examples) {
      const p = load(e.program, e.id)
      devicesCover(e.devices, e.script, e.id)
      const r = runScript(p, e.devices, e.script)
      expect(failing(r), e.id).toEqual([])
      expect(e.script.some((s) => s.expect), `${e.id} checks something`).toBe(true)
      expect(lint(p, e.devices.map((d) => d.tag)), e.id).toEqual([])
    }
  })

  it('every mistake fails its scenario and every fix passes it', () => {
    for (const l of PLC_LESSONS) for (const m of l.mistakes) {
      const wrong = load(m.wrong, `${m.id} wrong`), fix = load(m.fix, `${m.id} fix`)
      devicesCover(m.devices, m.script, m.id)
      expect(runScript(wrong, m.wrongDevices ?? m.devices, m.script).pass, `${m.id}: the wrong version should fail`).toBe(false)
      const r = runScript(fix, m.devices, m.script)
      expect(failing(r), `${m.id} fix`).toEqual([])
      expect(lint(fix, m.devices.map((d) => d.tag)), `${m.id} fix`).toEqual([])
    }
  })

  it('every practice solution passes and every starter fails', () => {
    for (const l of PLC_LESSONS) for (const t of l.tasks) {
      devicesCover(t.devices, t.script, t.id)
      const sol = load(t.solution, `${t.id} solution`)
      expect(failing(runScript(sol, t.devices, t.script)), t.id).toEqual([])
      expect(lint(sol, t.devices.map((d) => d.tag)), t.id).toEqual([])
      if (t.forbid) walk(sol, (n) => expect(t.forbid!.includes(n.op), `${t.id} solution uses a forbidden ${n.op}`).toBe(false))
      if (t.starter) expect(runScript(load(t.starter, `${t.id} starter`), t.devices, t.script).pass, `${t.id} starter should fail`).toBe(false)
      for (const tag of t.show) expect(t.script.some((s) => s.expect && tag in s.expect), `${t.id}: ${tag} shown but never checked`).toBe(true)
    }
  })

  it('a solution that only passes some steps is not graded correct', () => {
    // The double-coil version of scan-t2 passes three of its four steps.
    const t = PLC_LESSON_MAP.scan.tasks.find((x) => x.id === 'scan-t2')!
    const r = runScript(load('XIC(Fault_1) OTE(Horn)\nXIC(Fault_2) OTE(Horn)', 'double coil'), t.devices, t.script)
    expect(r.pass).toBe(false)
    expect(r.rows.filter((x) => x.wrong.length).length).toBe(1)
  })

  it('debug puzzles have exactly one blocking instruction, as the story says', () => {
    const want: Record<string, string> = { 'puz-jam': 'XIO(Jam_Alarm)', 'puz-pump': 'XIC(Overload_OK)', 'puz-press': 'XIC(Door_T.DN)' }
    for (const l of PLC_LESSONS) for (const z of l.puzzles ?? []) {
      const p = load(z.program, z.id)
      devicesCover(z.devices, z.setup, z.id)
      const { traces } = runScript(p, z.devices, z.setup)
      const b = blockers(p.rungs[z.rung], traces[z.rung])
      expect(b.map(insText), z.id).toEqual([want[z.id]])
    }
  })

  it('the takeaway numbers match the scenarios', () => {
    // seq-c2 says a held Next button ends in step 3 with ascending transitions.
    const m = PLC_LESSON_MAP.sequence.mistakes.find((x) => x.id === 'seq-double-jump')!
    const r = runScript(load(m.wrong, 'wrong'), m.devices, m.script.slice(0, 1))
    expect(r.rows[0].tags.Step).toBe(3)
    expect(PLC_LESSON_MAP.sequence.checks.find((c) => c.id === 'seq-c2')!.answer).toBe(2)
    // add-every-scan says one part in view for 20 scans adds 20.
    const a = PLC_LESSON_MAP.counters.mistakes.find((x) => x.id === 'add-every-scan')!
    expect(runScript(load(a.wrong, 'wrong'), a.devices, a.script).rows.at(-1)!.tags.Shift_Total).toBe(20)
  })

  it('PLC lesson pages link to the studio, and every studio lesson is linked', () => {
    for (const l of PLC_LESSONS) expect(DEEP_DIVE[l.concept]?.some((d) => d.to === `/studio/plc/${l.id}`), `${l.concept} → ${l.id}`).toBe(true)
    for (const links of Object.values(DEEP_DIVE)) for (const d of links) if (d.to.startsWith('/studio/plc')) expect(PLC_LESSON_MAP[d.to.split('/').pop()!], d.to).toBeTruthy()
  })
})

