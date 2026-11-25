import { describe, expect, it } from 'vitest'
import { CONCEPTS, CONCEPT_MAP } from './index'
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
