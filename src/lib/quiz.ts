import type { Concept } from '../types'

export interface QuizItem {
  conceptId: string
  kind: 'def' | 'one' | 'analogy' | 'formula' | 'acronym' | 'reverse'
  prompt: string
  promptTex?: string
  options: string[]
  answer: number
  explain: string
}

// Deterministic PRNG so a quiz can be re-generated with the same seed.
export function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Hide the term (and its aliases) in a sentence so the question doesn't give the answer away. */
export function mask(text: string, c: Concept) {
  const names = [c.term, c.full, ...(c.aka || [])].filter(Boolean) as string[]
  let out = text
  for (const n of names.sort((a, b) => b.length - a.length)) {
    if (n.length < 2) continue
    out = out.replace(new RegExp(`\\b${escapeRe(n)}\\b`, 'gi'), '_____')
  }
  return out
}

function distractors(c: Concept, pool: Concept[], n: number, rand: () => number) {
  const same = pool.filter((x) => x.id !== c.id && x.domain === c.domain)
  const other = pool.filter((x) => x.id !== c.id && x.domain !== c.domain)
  const picked = shuffle(same, rand).slice(0, n)
  if (picked.length < n) picked.push(...shuffle(other, rand).slice(0, n - picked.length))
  return picked
}

const label = (c: Concept) => (c.full && c.full !== c.term ? `${c.term} (${c.full})` : c.term)

export function makeQuestion(c: Concept, pool: Concept[], rand = Math.random): QuizItem {
  const kinds: QuizItem['kind'][] = ['def', 'one', 'reverse']
  if (c.analogy) kinds.push('analogy')
  if (c.formula) kinds.push('formula')
  if (c.full && c.full.toLowerCase() !== c.term.toLowerCase() && c.term.length <= 8) kinds.push('acronym')
  const kind = kinds[Math.floor(rand() * kinds.length)]
  const ds = distractors(c, pool, 3, rand)
  const build = (correct: string, wrong: string[], prompt: string, extra: Partial<QuizItem> = {}): QuizItem => {
    const opts = shuffle([correct, ...wrong], rand)
    return { conceptId: c.id, kind, prompt, options: opts, answer: opts.indexOf(correct), explain: `${label(c)}: ${c.one}`, ...extra }
  }
  switch (kind) {
    case 'def':
      return build(c.term, ds.map((d) => d.term), `Which term matches this definition?\n\n“${mask(c.def, c)}”`)
    case 'one':
      return build(c.term, ds.map((d) => d.term), `Which term is this?\n\n“${mask(c.one, c)}”`)
    case 'analogy':
      return build(c.term, ds.map((d) => d.term), `Which concept does this analogy describe?\n\n“${mask(c.analogy!, c)}”`)
    case 'formula':
      return build(c.term, ds.map((d) => d.term), 'Which concept uses this formula?', { promptTex: c.formula!.tex })
    case 'acronym': {
      const wrong = ds.filter((d) => d.full).map((d) => d.full!) as string[]
      while (wrong.length < 3) wrong.push(ds[wrong.length]?.term || 'None of these')
      return build(c.full!, wrong.slice(0, 3), `What does ${c.term} stand for?`)
    }
    default:
      return build(mask(c.one, c), ds.map((d) => mask(d.one, d)), `Which statement best describes ${label(c)}?`)
  }
}

export function makeQuiz(targets: Concept[], pool: Concept[], n: number, seed = Date.now()): QuizItem[] {
  const rand = rng(seed)
  return shuffle(targets, rand).slice(0, n).map((c) => makeQuestion(c, pool, rand))
}
