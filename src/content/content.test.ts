import { describe, expect, it } from 'vitest'
import { CONCEPTS, CONCEPT_MAP, ENRICHED_IDS } from './index'
import { SOURCES } from './sources'
import katex from 'katex'
import { mathIn, splitMath } from '../lib/inlineMath'
import { DOMAINS } from './domains'
import { ROLES } from './roles'
import { CASES } from './cases'
import { SIM_META } from '../sims/registry'
import { VIZ, EXTRA_SIM } from './visuals'
import { ALGOS } from './algos'
import { WIKI_TITLE, SE_SITE } from '../lib/web'
import { SUB_ROLES, TITLE_PATH, jobsFor } from './jobs'
import { WIKI_TERMS, CONCEPT_ALIAS } from './wikiTerms'
import { mmc, npv, irr } from '../lib/math'
import { capability } from '../sims/Capability'
import { oee } from '../sims/Oee'
import { cpm } from '../sims/Cpm'
import { solveMix } from '../sims/LpSolver'
import { evaluate } from '../sims/FaultTree'
import { diesPerWafer, poisson } from '../sims/Yield'
import { rwl } from '../sims/Niosh'
import { cornerPoints } from '../sims/GraphicalLp'
import { effects } from '../sims/DoeFactorial'
import { autoBalance } from '../sims/LineBalancing'

describe('content integrity', () => {
  it('has unique concept ids', () => {
    const ids = CONCEPTS.map((c) => c.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
  })

  it('every rel/pre reference points to a real concept', () => {
    const broken: string[] = []
    CONCEPTS.forEach((c) => [...(c.rel || []), ...(c.pre || [])].forEach((r) => { if (!CONCEPT_MAP[r]) broken.push(`${c.id} -> ${r}`) }))
    expect(broken).toEqual([])
  })

  it('every concept has the required layers and a known sub-domain', () => {
    const bad: string[] = []
    CONCEPTS.forEach((c) => {
      if (!c.term || !c.one || !c.def) bad.push(`${c.id}: missing core text`)
      const d = DOMAINS.find((x) => x.id === c.domain)
      if (!d) bad.push(`${c.id}: unknown domain`)
      else if (!d.subs.includes(c.sub)) bad.push(`${c.id}: sub "${c.sub}" not in ${d.id}`)
      if (c.sim && !SIM_META.some((s) => s.id === c.sim)) bad.push(`${c.id}: unknown sim ${c.sim}`)
    })
    expect(bad).toEqual([])
  })

  it('every worked example with a machine check computes the stated value', () => {
    const fails: string[] = []
    CONCEPTS.forEach((c) => {
      const ck = c.example?.check
      if (!ck) return
      const got = ck.compute()
      if (!Number.isFinite(got) || !Number.isFinite(ck.value) || Math.abs(got - ck.value) > (ck.tol ?? 1e-6)) fails.push(`${c.id}: expected ${ck.value}, computed ${got}`)
    })
    expect(fails).toEqual([])
  })

  it('role paths, cases and simulators reference real concepts', () => {
    const broken: string[] = []
    ROLES.forEach((r) => r.concepts.forEach((id) => { if (!CONCEPT_MAP[id]) broken.push(`role ${r.id} -> ${id}`) }))
    CASES.forEach((k) => k.concepts.forEach((id) => { if (!CONCEPT_MAP[id]) broken.push(`case ${k.id} -> ${id}`) }))
    SIM_META.forEach((s) => s.concepts.forEach((id) => { if (!CONCEPT_MAP[id]) broken.push(`sim ${s.id} -> ${id}`) }))
    expect(broken).toEqual([])
  })

  it('visuals, algorithms, wiki titles and extra sim links point to real concepts', () => {
    const bad: string[] = []
    Object.keys(VIZ).forEach((k) => { if (!CONCEPT_MAP[k]) bad.push('viz ' + k) })
    Object.keys(ALGOS).forEach((k) => { if (!CONCEPT_MAP[k]) bad.push('algo ' + k) })
    Object.keys(WIKI_TITLE).forEach((k) => { if (!CONCEPT_MAP[k]) bad.push('wiki ' + k) })
    Object.entries(EXTRA_SIM).forEach(([k, v]) => { if (!CONCEPT_MAP[k]) bad.push('sim-concept ' + k); if (!SIM_META.some((s) => s.id === v)) bad.push('sim ' + v) })
    expect(bad).toEqual([])
  })

  it('algorithm loop targets are valid steps', () => {
    const bad: string[] = []
    Object.entries(ALGOS).forEach(([k, a]) => a.nodes.forEach((n, i) => { if (n.k === 'decision' && n.back !== undefined && n.back !== 99 && (n.back < 0 || n.back >= a.nodes.length)) bad.push(`${k} step ${i}`) }))
    expect(bad).toEqual([])
  })

  it('every domain has content', () => {
    const empty = DOMAINS.filter((d) => !CONCEPTS.some((c) => c.domain === d.id)).map((d) => d.id)
    expect(empty).toEqual([])
  })
})

describe('simulator math', () => {
  it('M/M/c matches the textbook Erlang C case', () => {
    const r = mmc(10, 4, 3)
    expect(r.pw).toBeCloseTo(0.7022, 3)
    expect(r.wq * 60).toBeCloseTo(21.07, 1)
  })
  it('capability: centered σ = 0.015 gives Cpk 1.33', () => {
    expect(capability(10, 0.015, 9.94, 10.06).cpk).toBeCloseTo(1.333, 3)
  })
  it('OEE textbook example ≈ 74.8%', () => {
    expect(oee(420, 47, 1.0, 19271, 423).oee).toBeCloseTo(0.748, 2)
  })
  it('CPM finds the expected critical path length', () => {
    const r = cpm([{ id: 'A', d: 3, pre: [] }, { id: 'B', d: 4, pre: ['A'] }, { id: 'C', d: 2, pre: ['A'] }, { id: 'D', d: 1, pre: ['B', 'C'] }])
    expect(r.end).toBe(8)
    expect(r.slack.C).toBe(2)
  })
  it('LP product-mix solves to a feasible optimum', () => {
    const s = solveMix([{ name: 'T', profit: 30, use: [2, 3] }, { name: 'C', profit: 40, use: [4, 2] }], [{ name: 'Assembly', cap: 80 }, { name: 'Machining', cap: 60 }], false)
    expect(s.z).toBeCloseTo(900, 6)
  })
  it('graphical LP corners include (10, 15)', () => {
    expect(cornerPoints(2, 4, 80, 3, 2, 60).some(([x, y]) => Math.abs(x - 10) < 1e-9 && Math.abs(y - 15) < 1e-9)).toBe(true)
  })
  it('fault tree gate math', () => {
    const t = { id: 't', label: '', gate: 'OR' as const, kids: [{ id: 'a', label: '', p: 0.1 }, { id: 'b', label: '', p: 0.2 }] }
    expect(evaluate(t, {})).toBeCloseTo(0.28, 10)
  })
  it('yield helpers', () => {
    expect(diesPerWafer(300, 100)).toBe(640)
    expect(poisson(1, 0.1)).toBeCloseTo(0.9048, 4)
  })
  it('NIOSH: ideal lift gives RWL = 23 kg', () => {
    expect(rwl(25, 75, 25, 0, 1, 1).RWL).toBeCloseTo(23, 6)
  })
  it('DOE effects recover the hidden model without noise', () => {
    const runs = [[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]]
    const y = runs.map((r) => 550 + 40 * r[0] + 15 * r[1] - 5 * r[2] + 25 * r[0] * r[1])
    const e = Object.fromEntries(effects(runs, y).map((x) => [x.name, x.effect]))
    expect(e.A).toBeCloseTo(80, 9)
    expect(e.AB).toBeCloseTo(50, 9)
  })
  it('line balancing respects takt', () => {
    const tasks = [{ id: 'A', t: 30, pre: [], desc: '' }, { id: 'B', t: 30, pre: ['A'], desc: '' }, { id: 'C', t: 20, pre: [], desc: '' }]
    const a = autoBalance(tasks, 50)
    expect(Math.max(...Object.values(a))).toBe(2)
  })
  it('NPV / IRR', () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 9)
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6)
  })
})

describe('jobs and Wikipedia keywords', () => {
  it('every sub-area role list points at a real domain/sub', () => {
    for (const key of Object.keys(SUB_ROLES)) {
      const [dom, sub] = key.split('/')
      const d = DOMAINS.find((x) => x.id === dom)
      expect(d, key).toBeTruthy()
      expect(d!.subs, key).toContain(sub)
    }
  })
  it('title → path links resolve to real role paths', () => {
    for (const [t, id] of Object.entries(TITLE_PATH)) expect(ROLES.some((r) => r.id === id), `${t} → ${id}`).toBe(true)
  })
  it('every concept lists at least 4 job titles', () => {
    for (const c of CONCEPTS) expect(jobsFor(c).titles.length, c.id).toBeGreaterThanOrEqual(4)
  })
  it('role-path hits report a valid step', () => {
    for (const c of CONCEPTS) for (const p of jobsFor(c).paths) expect(p.step >= 1 && p.step <= p.of).toBe(true)
  })
  it('Wikipedia keywords have titles and concept aliases resolve', () => {
    for (const [k, t] of Object.entries(WIKI_TERMS)) { expect(k.length, k).toBeGreaterThan(1); expect(t.trim().length, k).toBeGreaterThan(0) }
    for (const [k, id] of Object.entries(CONCEPT_ALIAS)) expect(CONCEPT_MAP[id], `${k} → ${id}`).toBeTruthy()
  })
  it('Stack Exchange site chosen for every domain', () => {
    for (const d of DOMAINS) expect(SE_SITE[d.id]?.site, d.id).toBeTruthy()
  })
})

describe('sources and review statuses', () => {
  const DATE = /^\d{4}-\d{2}-\d{2}$/
  it('source registry entries are well formed', () => {
    for (const s of Object.values(SOURCES)) {
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.checkedOn, s.id).toMatch(DATE)
      expect([1, 2, 3, 4]).toContain(s.tier)
      if (s.doi) expect(s.doi, s.id).toMatch(/^10\.\d{4,9}\//)
    }
  })
  it('every citation points at a registered source with a claim', () => {
    for (const c of CONCEPTS) for (const ct of c.cites || []) {
      expect(SOURCES[ct.src], `${c.id} → ${ct.src}`).toBeTruthy()
      expect(ct.supports.trim().length, c.id).toBeGreaterThan(5)
      if (ct.url) expect(ct.url, c.id).toMatch(/^https:\/\//)
    }
  })
  it('review statuses are honest and dated', () => {
    for (const c of CONCEPTS) {
      const r = c.review
      if (!r) continue
      expect(r.on, c.id).toMatch(DATE)
      expect(r.by.trim().length, c.id).toBeGreaterThan(2)
      if (r.status === 'expert-reviewed') expect(r.by, `${c.id}: expert review needs a named human reviewer`).not.toMatch(/AI|Claude|automated/i)
      if (r.status === 'source-checked' || r.status === 'source-identified') expect(c.cites?.length ?? 0, `${c.id}: ${r.status} needs citations`).toBeGreaterThan(0)
      if (r.status === 'update-required' || r.status === 'draft') expect(r.note, `${c.id}: say what is missing`).toBeTruthy()
    }
  })
  it('enriched lessons meet the lesson standard', () => {
    for (const id of ENRICHED_IDS) {
      const c = CONCEPT_MAP[id]
      expect(c, id).toBeTruthy()
      expect(c.objectives?.length, `${id} objectives`).toBeGreaterThanOrEqual(2)
      expect(c.why, `${id} why`).toBeTruthy()
      expect(c.mistakes?.length, `${id} mistakes`).toBeGreaterThan(0)
      expect(c.review, `${id} review`).toBeTruthy()
      if (c.assumptions?.length) expect(!!(c.why || c.formula), `${id}: assumptions need a why or math layer to show in`).toBe(true)
    }
  })
})

describe('inline math and dollar amounts', () => {
  it('dollar amounts stay text; $…$ math still renders', () => {
    expect(mathIn('Up to 20 h, gaining about $6 an hour, roughly $120.')).toEqual([])
    expect(mathIn('Profits: $600 at (20, 0); $800 at (0, 20); −$200k.')).toEqual([])
    expect(mathIn('Wait grows like $\\rho/(1-\\rho)$ near full load.')).toEqual(['\\rho/(1-\\rho)'])
    expect(mathIn('Costs $5 when $x^2$ exceeds $y$.')).toEqual(['x^2', 'y'])
    expect(splitMath('a $x$ b').length).toBe(3)
  })
})

describe('interview questions and teach-back', () => {
  const all = () => [...CONCEPTS.flatMap((c) => (c.iq || []).map((q) => ({ where: c.id, q }))), ...ROLES.flatMap((r) => r.questions.map((q) => ({ where: r.id, q })))]
  it('a question marked reported names a registered source; practice questions carry no report', () => {
    const bad: string[] = []
    for (const { where, q } of all()) {
      if (q.origin === 'reported' && !(q.reported && SOURCES[q.reported.src] && q.reported.supports.trim().length > 5)) bad.push(`${where}: “${q.q.slice(0, 40)}” is marked reported without a registered source`)
      if (q.origin !== 'reported' && q.reported) bad.push(`${where}: “${q.q.slice(0, 40)}” has a report but is not marked reported`)
    }
    expect(bad).toEqual([])
  })
  it('hints, follow-ups and rubrics are real text', () => {
    const bad: string[] = []
    for (const { where, q } of all()) {
      if (q.hint !== undefined && q.hint.trim().length < 10) bad.push(`${where}: hint`)
      if (q.hint && q.a.toLowerCase().startsWith(q.hint.toLowerCase().slice(0, 30))) bad.push(`${where}: the hint gives away the answer`)
      for (const f of q.followUps || []) if (f.trim().length < 10) bad.push(`${where}: follow-up “${f}” is too short to be a real prompt`)
      if (q.rubric && q.rubric.length < 2) bad.push(`${where}: a rubric needs at least two criteria`)
      if (new Set(q.rubric || []).size !== (q.rubric || []).length) bad.push(`${where}: duplicate rubric points`)
    }
    expect(bad).toEqual([])
  })
  it('teach-back prompts have at least three checkable points', () => {
    for (const c of CONCEPTS) if (c.teachBack) {
      expect(c.teachBack.prompt.trim().length, c.id).toBeGreaterThan(20)
      expect(c.teachBack.points.length, c.id).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('content quality', () => {
  it('prerequisites form no cycles', () => {
    const state = new Map<string, 0 | 1 | 2>()
    const cycles: string[] = []
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 2) return
      if (state.get(id) === 1) { cycles.push([...path, id].join(' → ')); return }
      state.set(id, 1)
      for (const p of CONCEPT_MAP[id]?.pre || []) visit(p, [...path, id])
      state.set(id, 2)
    }
    for (const c of CONCEPTS) visit(c.id, [])
    expect(cycles).toEqual([])
  })
  it('no two lessons share the same term', () => {
    const seen = new Map<string, string>()
    const dups: string[] = []
    for (const c of CONCEPTS) {
      const k = c.term.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (seen.has(k)) dups.push(`${seen.get(k)} / ${c.id}`); else seen.set(k, c.id)
    }
    expect(dups).toEqual([])
  })
  it('every formula and inline $math$ renders in KaTeX', () => {
    const bad: string[] = []
    const tryTex = (id: string, tex: string) => { try { katex.renderToString(tex, { throwOnError: true }) } catch (e) { bad.push(`${id}: ${tex} — ${(e as Error).message.slice(0, 60)}`) } }
    for (const c of CONCEPTS) {
      if (c.formula) { tryTex(c.id, c.formula.tex); c.formula.vars?.forEach(([s]) => tryTex(c.id, s)) }
      const prose = [c.one, c.def, c.why, c.analogy, c.example?.q, c.example?.a, ...(c.example?.steps || [])].filter(Boolean) as string[]
      for (const p of prose) for (const m of mathIn(p)) tryTex(c.id, m)
    }
    expect(bad).toEqual([])
  })
})
