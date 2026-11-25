import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP, byDomain, learningOrder } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { isDue, previewIntervals, RATING_LABEL, type Rating } from '../lib/srs'
import { useStore } from '../lib/store'
import { makeQuiz } from '../lib/quiz'
import { PageHead, Rich, Tex } from '../components/ui'
import { QuizRunner } from '../components/Quiz'
import type { DomainId } from '../types'

export function Review() {
  const [params] = useSearchParams()
  const dom = (params.get('d') || '') as DomainId | ''
  const cards = useStore((s) => s.cards)
  const progress = useStore((s) => s.progress)
  const addCard = useStore((s) => s.addCard)
  const rate = useStore((s) => s.rate)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [cram, setCram] = useState(false)
  const [cramIdx, setCramIdx] = useState(0)
  const [snapshot] = useState(() => Date.now())

  const queue = useMemo(() => {
    const ids = Object.keys(cards).filter((id) => CONCEPT_MAP[id] && (!dom || CONCEPT_MAP[id].domain === dom))
    return cram ? ids : ids.filter((id) => isDue(cards[id], snapshot + done)).sort((a, b) => cards[a].due - cards[b].due)
  }, [cards, dom, cram, snapshot, done])

  const current = cram ? queue[cramIdx % Math.max(queue.length, 1)] : queue[0]
  const c = current ? CONCEPT_MAP[current] : undefined

  const answer = (r: Rating) => {
    if (!c) return
    if (cram) setCramIdx((i) => i + 1)
    else { rate(c.id, r); setDone((d) => d + 1) }
    setFlipped(false)
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select')) return
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) answer((Number(e.key) - 1) as Rating)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const pool = dom ? byDomain(dom) : CONCEPTS
  const fresh = learningOrder(pool).filter((x) => !cards[x.id])
  const addBatch = (n: number) => fresh.slice(0, n).forEach((x) => addCard(x.id))
  const opened = pool.filter((x) => progress[x.id]?.opened && !cards[x.id])

  return (
    <div>
      <PageHead title="Flashcard review" sub="Spaced repetition: each card comes back just before you'd forget it. Space flips the card; 1–4 rates it." tape={dom ? DOMAIN_MAP[dom].tape : undefined}>
        <div className="no-print mt-4 flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={dom} onChange={(e) => { const v = e.target.value; window.location.hash = v ? `#/review?d=${v}` : '#/review' }} aria-label="Domain">
            <option value="">All domains</option>
            {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cram} onChange={(e) => { setCram(e.target.checked); setFlipped(false) }} /> Cram mode (practice without changing the schedule)</label>
        </div>
      </PageHead>

      {c ? (
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-sm text-ink-2">{cram ? `Cram ${cramIdx % queue.length + 1} of ${queue.length}` : `${queue.length} due · ${done} reviewed this session`}</p>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="sheet block min-h-72 w-full rounded-lg p-8 text-left shadow-sm"
            aria-label={flipped ? 'Card back' : 'Card front, press to flip'}
          >
            <div className="mb-4 h-1.5 w-16 rounded-sm" style={{ background: DOMAIN_MAP[c.domain].tape }} />
            <p className="display text-4xl">{c.term}</p>
            {c.full && c.full !== c.term && !flipped && <p className="mt-2 text-ink-2">What does it stand for, and what does it mean?</p>}
            {!flipped && !c.full && <p className="mt-2 text-ink-2">Explain it out loud, then flip.</p>}
            {flipped && (
              <div className="flip-in mt-4 space-y-3">
                {c.full && c.full !== c.term && <p className="wide text-lg">{c.full}</p>}
                <p className="text-lg"><Rich text={c.one} /></p>
                <p className="text-[0.95rem] text-ink-2"><Rich text={c.def} /></p>
                {c.formula && <Tex tex={c.formula.tex} block />}
                {c.analogy && <p className="text-[0.95rem] italic"><Rich text={c.analogy} /></p>}
              </div>
            )}
          </button>
          {flipped ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {([0, 1, 2, 3] as Rating[]).map((r) => (
                <button key={r} onClick={() => answer(r)} className={`btn ${r === 0 ? '!bg-sred !border-sred' : r === 3 ? '!bg-sgreen !border-sgreen' : r === 1 ? 'btn-ghost' : ''} flex-col !gap-0`}>
                  <span>{RATING_LABEL[r]}</span>
                  {!cram && <span className="text-xs opacity-80">{previewIntervals(cards[c.id])[r]}</span>}
                </button>
              ))}
            </div>
          ) : (
            <button className="btn mt-4 w-full" onClick={() => setFlipped(true)}>Show answer</button>
          )}
          <p className="mt-3 text-center text-sm"><Link className="underline" to={`/c/${c.id}`}>Open the full card</Link></p>
        </div>
      ) : (
        <div className="sheet mx-auto max-w-2xl rounded-lg p-6">
          <p className="display text-2xl">{Object.keys(cards).length ? 'All caught up.' : 'Your deck is empty.'}</p>
          <p className="mt-2 text-ink-2">
            {Object.keys(cards).length ? 'Nothing is due right now. Add new cards, or come back tomorrow — spacing is what makes it stick.' : 'Add cards to start. New cards come in learning order, prerequisites first.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {opened.length > 0 && <button className="btn" onClick={() => opened.forEach((x) => addCard(x.id))}>Add the {opened.length} concepts you've opened</button>}
            <button className="btn-ghost btn" onClick={() => addBatch(10)} disabled={!fresh.length}>Add 10 new cards{dom ? ` from ${DOMAIN_MAP[dom].short}` : ''}</button>
            <button className="btn-ghost btn" onClick={() => addBatch(25)} disabled={!fresh.length}>Add 25</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Practice() {
  const [params] = useSearchParams()
  const initial = params.get('d')
  const [domains, setDomains] = useState<DomainId[]>(initial ? [initial as DomainId] : [])
  const [n, setN] = useState(10)
  const [source, setSource] = useState<'all' | 'opened' | 'weak'>('all')
  const [seed, setSeed] = useState<number | null>(null)
  const progress = useStore((s) => s.progress)

  const targets = useMemo(() => {
    let list = domains.length ? CONCEPTS.filter((c) => domains.includes(c.domain)) : CONCEPTS
    if (source === 'opened') list = list.filter((c) => progress[c.id]?.opened)
    if (source === 'weak') {
      list = list
        .filter((c) => (progress[c.id]?.results || []).length)
        .map((c) => ({ c, acc: (progress[c.id]!.results!).reduce((a, b) => a + b, 0) / progress[c.id]!.results!.length }))
        .filter((x) => x.acc < 0.8)
        .sort((a, b) => a.acc - b.acc)
        .map((x) => x.c)
    }
    return list
  }, [domains, source, progress])

  const items = useMemo(() => (seed ? makeQuiz(targets, CONCEPTS, n, seed) : []), [seed]) // eslint-disable-line

  if (seed) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="display text-2xl">Practice quiz</h1>
          <button className="btn-ghost btn" onClick={() => setSeed(null)}>Change settings</button>
        </div>
        <QuizRunner key={seed} items={items} onFinish={() => setSeed(Date.now())} />
      </div>
    )
  }

  const toggle = (id: DomainId) => setDomains((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  return (
    <div>
      <PageHead title="Practice quiz" sub="Retrieval practice with interleaving: questions mix definitions, analogies, formulas and acronyms across the domains you pick. Every answer updates your mastery." />
      <div className="sheet rounded-lg p-5">
        <p className="label mb-2">Domains (none selected = everything, fully interleaved)</p>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button key={d.id} onClick={() => toggle(d.id)} aria-pressed={domains.includes(d.id)}
              className={`chip !text-sm ${domains.includes(d.id) ? '!border-ink !text-ink bg-paper font-semibold' : ''}`}>
              <span className="inline-block h-2 w-3 rounded-sm" style={{ background: d.tape }} />{d.short}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Questions</span>
            <select className="input mt-1" value={n} onChange={(e) => setN(Number(e.target.value))}>
              {[5, 10, 20, 30].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Draw from</span>
            <select className="input mt-1" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
              <option value="all">All concepts in these domains</option>
              <option value="opened">Only concepts I've opened</option>
              <option value="weak">My weak spots (below 80%)</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-sm text-ink-2">{targets.length} concepts in the pool.</p>
        <button className="btn mt-3" disabled={!targets.length} onClick={() => setSeed(Date.now())}>Start quiz</button>
      </div>
    </div>
  )
}
