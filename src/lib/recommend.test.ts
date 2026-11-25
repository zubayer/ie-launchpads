import { describe, expect, it } from 'vitest'
import { plan, suggestions, type LearnerState } from './recommend'
import { ROLES } from '../content/roles'
import { CONCEPT_MAP } from '../content'
import type { Attempt, Mistake } from './store'
import { PATHWAYS, itemKey } from '../content/pathways'

const NOW = new Date(2026, 10, 25, 12).getTime()
const base: LearnerState = { cards: {}, progress: {}, mistakes: [], attempts: [], path: null, now: NOW }
const card = (due: number) => ({ ease: 2.5, interval: 1, reps: 1, lapses: 0, due })
const miss = (concept: string, n: number): Mistake[] => Array.from({ length: n }, (_, i) => ({ id: `${concept}${i}`, concept, prompt: 'q', given: 'a', correct: 'b', explain: 'c', at: NOW - i }))

describe('Do next: fixed learner scenarios', () => {
  it('a brand-new learner with no goal is offered the guided pathway, with a reason', () => {
    const s = suggestions(base)
    expect(s[0].kind).toBe('pathway')
    expect(s[0].why).toMatch(/role path/)
  })
  it('a returning learner with due cards reviews first', () => {
    const s = suggestions({ ...base, cards: { 'lean.oee': card(NOW - 1000), 'quality.cpk': card(NOW - 1), 'or.lp': card(NOW + 86400000) } })
    expect(s[0]).toMatchObject({ kind: 'review', title: 'Review 2 due flashcards' })
  })
  it('recurring mistakes come before new lessons; a single miss goes to the notebook item instead', () => {
    const s = suggestions({ ...base, path: 'quality-engineer', mistakes: [...miss('quality.cpk', 3), ...miss('lean.oee', 1)] })
    const kinds = s.map((x) => x.id)
    expect(kinds.indexOf('mistake:quality.cpk')).toBeLessThan(kinds.findIndex((k) => k.startsWith('lesson:')))
    expect(kinds).not.toContain('mistake:lean.oee')
    expect(s.find((x) => x.id === 'notebook')?.title).toMatch(/1 open mistake/)
  })
  it('a goal-path learner gets the next lesson, but an unopened prerequisite first', () => {
    // a role lesson with a prerequisite that is not itself on the role's list
    const outside = (r: (typeof ROLES)[number], id: string) => (CONCEPT_MAP[id]?.pre || []).filter((p) => CONCEPT_MAP[p] && !r.concepts.includes(p))
    const role = ROLES.find((r) => r.concepts.some((id) => outside(r, id).length))!
    const idx = role.concepts.findIndex((id) => outside(role, id).length)
    const target = role.concepts[idx]
    const progress = Object.fromEntries(role.concepts.slice(0, idx).map((id) => [id, { opened: NOW - 5000 }]))
    const pre = outside(role, target)
    const s = suggestions({ ...base, path: role.id, progress })
    const lesson = s.find((x) => x.kind === 'lesson')!
    expect(pre).toContain(lesson.to.replace('/c/', ''))
    expect(lesson.why).toContain(CONCEPT_MAP[target].term)
  })
  it('a learner who finished a pathway yesterday is offered the delayed check; not on the same day', () => {
    const p = PATHWAYS[0]
    const done = (at: number): Attempt[] => p.steps.flatMap((st) => st.items).map((it) => ({ item: itemKey(p, it), concept: 'lean.oee', dim: 'calculate', correct: true, at }))
    expect(suggestions({ ...base, attempts: done(NOW - 86400000) }).some((x) => x.id === `path-review:${p.id}`)).toBe(true)
    expect(suggestions({ ...base, attempts: done(NOW - 60000) }).some((x) => x.id === `path-review:${p.id}`)).toBe(false)
  })
  it('fills the chosen session length and respects skips', () => {
    const s = suggestions({ ...base, path: 'industrial-engineer', cards: { a: card(NOW - 1) }, mistakes: [...miss('quality.cpk', 2), ...miss('lean.oee', 1)] })
    const five = plan(s, 5)
    expect(five.chosen.length).toBe(1)
    const sixty = plan(s, 60)
    expect(sixty.used).toBeLessThanOrEqual(72)
    expect(sixty.chosen.length).toBeGreaterThan(1)
    expect(plan(s, 60, [s[0].id]).chosen[0].id).not.toBe(s[0].id)
    s.forEach((x) => expect(x.why.length).toBeGreaterThan(20))
  })
})
