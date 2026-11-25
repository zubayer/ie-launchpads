// "Do next" (UX-03 / AI-01): a deterministic, explainable ranking of what to do in the time available.
// Order: due reviews → recurring mistakes → a started pathway → the goal path's next lesson (prerequisites
// first) → applied work in a lab → open mistakes. Every suggestion says why it is there.
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { ROLES } from '../content/roles'
import { PATHWAYS, itemKey } from '../content/pathways'
import { SIM_META } from '../sims/registry'
import { EXTRA_SIM } from '../content/visuals'
import { isDue, type SrsCard } from './srs'
import { solved, triesOf } from './answers'
import { today, type Attempt, type ConceptProgress, type Mistake } from './store'

export interface Suggestion { id: string; kind: 'review' | 'mistake' | 'pathway' | 'lesson' | 'lab' | 'notebook'; title: string; to: string; minutes: number; why: string }
export interface LearnerState { cards: Record<string, SrsCard>; progress: Record<string, ConceptProgress>; mistakes: Mistake[]; attempts: Attempt[]; path: string | null; now?: number }

const simFor = (id: string) => SIM_META.find((s) => s.id === (CONCEPT_MAP[id]?.sim || EXTRA_SIM[id])) || SIM_META.find((s) => s.concepts.includes(id))

export function suggestions(s: LearnerState): Suggestion[] {
  const now = s.now ?? Date.now()
  const out: Suggestion[] = []
  const opened = (id: string) => !!s.progress[id]?.opened

  // 1. Spaced review that is due.
  const due = Object.values(s.cards).filter((c) => isDue(c, now)).length
  if (due) out.push({ id: 'review', kind: 'review', title: `Review ${due} due flashcard${due > 1 ? 's' : ''}`, to: '/review', minutes: Math.min(15, Math.max(3, Math.ceil(due * 0.75))), why: 'They are due today. Reviewing on schedule is what keeps them from fading.' })

  // 2. Mistakes that keep coming back.
  const open = s.mistakes.filter((m) => !m.resolved)
  const byConcept = new Map<string, number>()
  open.forEach((m) => byConcept.set(m.concept, (byConcept.get(m.concept) || 0) + 1))
  ;[...byConcept.entries()].filter(([id, n]) => n >= 2 && CONCEPT_MAP[id]).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([id, n]) =>
    out.push({ id: `mistake:${id}`, kind: 'mistake', title: `Re-read ${CONCEPT_MAP[id].term}`, to: `/c/${id}`, minutes: 10, why: `You have missed questions on it ${n} times. Re-reading the lesson before more practice fixes the idea, not just the answer.` }))

  // 3. A pathway already started.
  for (const p of PATHWAYS) {
    const started = p.steps.some((st) => st.items.some((it) => triesOf(s.attempts, itemKey(p, it)) > 0))
    if (!started) continue
    const next = p.steps.find((st) => !st.items.every((it) => (it.kind === 'choice' && it.predict ? triesOf(s.attempts, itemKey(p, it)) > 0 : solved(s.attempts, itemKey(p, it)))))
    if (next) out.push({ id: `path:${p.id}`, kind: 'pathway', title: `Continue “${p.title}”: ${next.title}`, to: `/paths/${p.id}`, minutes: 10, why: 'You started this pathway. Finishing the next step keeps the chain of ideas connected.' })
    else if (!p.review.every((it) => solved(s.attempts, itemKey(p, it)))) {
      const last = Math.max(0, ...s.attempts.filter((a) => a.item.startsWith(`${p.id}:`)).map((a) => a.at))
      if (today(new Date(last)) !== today(new Date(now))) out.push({ id: `path-review:${p.id}`, kind: 'pathway', title: `Take the delayed check for “${p.title}”`, to: `/paths/${p.id}`, minutes: 10, why: 'At least a day has passed since you finished the steps: the right moment to test what stuck.' })
    }
  }

  // 4. The goal path's next lesson, prerequisites first.
  const role = ROLES.find((r) => r.id === s.path)
  if (role) {
    const nextId = role.concepts.find((id) => CONCEPT_MAP[id] && !opened(id))
    if (nextId) {
      const missing = (CONCEPT_MAP[nextId].pre || []).find((p) => CONCEPT_MAP[p] && !opened(p))
      if (missing) out.push({ id: `lesson:${missing}`, kind: 'lesson', title: `Learn ${CONCEPT_MAP[missing].term}`, to: `/c/${missing}`, minutes: 10, why: `${CONCEPT_MAP[nextId].term} is next on your ${role.title} path, and it builds on this.` })
      else out.push({ id: `lesson:${nextId}`, kind: 'lesson', title: `Learn ${CONCEPT_MAP[nextId].term}`, to: `/c/${nextId}`, minutes: 10, why: `Next on your ${role.title} path${CONCEPT_MAP[nextId].pre?.length ? '; you have opened its prerequisites' : ''}.` })
    }
  } else if (!PATHWAYS.some((p) => p.steps.some((st) => st.items.some((it) => triesOf(s.attempts, itemKey(p, it)) > 0)))) {
    const p = PATHWAYS[0]
    out.push({ id: `path:${p.id}`, kind: 'pathway', title: `Start “${p.title}”`, to: `/paths/${p.id}`, minutes: 15, why: 'No role goal is set yet. This pathway is a complete route from a lesson to a lab and a case; pick a role path any time to tailor these suggestions.' })
  }

  // 5. Apply the most recently opened lesson in a lab.
  const recent = Object.entries(s.progress).filter(([id, p]) => p.opened && CONCEPT_MAP[id]).sort((a, b) => (b[1].opened || 0) - (a[1].opened || 0))
  for (const [id] of recent.slice(0, 5)) {
    const sim = simFor(id)
    if (sim) { out.push({ id: `lab:${sim.id}`, kind: 'lab', title: `Try ${CONCEPT_MAP[id].term} in the ${sim.name}`, to: `/lab/${sim.id}`, minutes: 15, why: `You opened ${CONCEPT_MAP[id].term} recently. Using it in a lab turns reading into skill.` }); break }
  }

  // 6. Any other open mistakes.
  const single = open.filter((m) => (byConcept.get(m.concept) || 0) < 2).length
  if (single) out.push({ id: 'notebook', kind: 'notebook', title: `Go through ${single} open mistake${single > 1 ? 's' : ''} in your error notebook`, to: '/notebook', minutes: 5, why: 'Each one has the right answer and why. Mark them understood as you go.' })

  if (!out.length) {
    const first = CONCEPTS.find((c) => c.level === 1 && !opened(c.id))
    if (first) out.push({ id: `lesson:${first.id}`, kind: 'lesson', title: `Learn ${first.term}`, to: `/c/${first.id}`, minutes: 10, why: 'A foundation lesson you haven’t opened yet.' })
  }
  return out
}

/** Fill a session of `minutes` in priority order (estimates may run 20% over); always at least one item. Skipped ids are left out. */
export function plan(list: Suggestion[], minutes: number, skipped: string[] = []) {
  const pool = list.filter((x) => !skipped.includes(x.id))
  const chosen: Suggestion[] = []
  let used = 0
  for (const x of pool) {
    if (!chosen.length || used + x.minutes <= minutes * 1.2) { chosen.push(x); used += x.minutes }
  }
  return { chosen, rest: pool.filter((x) => !chosen.includes(x)), used }
}
