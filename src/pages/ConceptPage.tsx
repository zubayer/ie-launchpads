import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP, neighbors } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import { SIM_META } from '../sims/registry'
import { VIZ, EXTRA_SIM } from '../content/visuals'
import { ALGOS } from '../content/algos'
import { LEVEL_NAME, type Concept } from '../types'
import { useStore } from '../lib/store'
import { makeQuestion, rng } from '../lib/quiz'
import { links, wikiFor, type WikiSummary } from '../lib/web'
import { StatusBadge, Tex } from '../components/ui'
import { QuestionCard } from '../components/Quiz'
import { Linked, useWiki } from '../components/Glossary'
import { MiniMap, Viz } from '../components/Viz'
import { AlgoFlow } from '../components/Algo'
import { LiveWeb, prefetchLive } from '../components/LiveWeb'
import { JobsBlock, RoleChips } from '../components/Jobs'

interface Layer { id: string; name: string }

export const simFor = (c: Concept) => SIM_META.find((s) => s.id === (c.sim || EXTRA_SIM[c.id])) || SIM_META.find((s) => s.concepts.includes(c.id))

function layersFor(c: Concept): Layer[] {
  const L: Layer[] = [{ id: 'keyword', name: 'Keyword' }, { id: 'live', name: 'Live from the web' }, { id: 'plain', name: 'Plain meaning' }]
  if (c.analogy) L.push({ id: 'analogy', name: 'Analogy' })
  L.push({ id: 'picture', name: 'Picture it' })
  if (c.why) L.push({ id: 'why', name: 'Why it matters' })
  if (c.formula) L.push({ id: 'math', name: 'The math' })
  if (ALGOS[c.id]) L.push({ id: 'algo', name: 'Algorithm' })
  if (c.example) L.push({ id: 'example', name: 'Worked example' })
  if (c.real || c.used) L.push({ id: 'real', name: 'On the job' })
  L.push({ id: 'jobs', name: 'Jobs that need it' })
  if (simFor(c)) L.push({ id: 'sim', name: 'Simulate it' })
  L.push({ id: 'try', name: 'Check yourself' })
  if (c.iq?.length) L.push({ id: 'interview', name: 'Interview' })
  L.push({ id: 'more', name: 'Learn more' })
  return L
}

function Block({ id, n, name, children, onSeen }: { id: string; n: number; name: string; children: React.ReactNode; onSeen: (n: number) => void }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && onSeen(n)), { rootMargin: '0px 0px -40% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [n, onSeen])
  return (
    <section ref={ref} id={id} className="scroll-mt-20 border-t border-line py-6 first:border-t-0 first:pt-0">
      <h2 className="mb-3 flex items-baseline gap-3"><span className="wide text-sm text-ink-2">{n + 1}</span><span className="wide text-xl">{name}</span></h2>
      {children}
    </section>
  )
}

function ExploreButtons({ c, big = false, wiki }: { c: Concept; big?: boolean; wiki?: WikiSummary | null }) {
  const L = links(c)
  const items: [string, string, string][] = [
    ['Wikipedia', wiki?.url || L.wikipedia, 'W'], ...(wiki?.permalink ? [['Wikipedia permalink', wiki.permalink, '⚓'] as [string, string, string]] : []), ['Google', L.google, 'G'], ['Images', L.images, '▣'], ['YouTube video', L.youtube, '▶'], ['Research papers', L.scholar, '§'],
  ]
  return (
    <div className="no-print flex flex-wrap gap-2">
      {items.map(([label, href, icon]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={big ? 'ext-btn' : 'pop-btn !py-1'} title={`Open ${label} in a new tab`}>
          <span aria-hidden className="font-bold text-sblue">{icon}</span>{label} <span aria-hidden>↗</span>
        </a>
      ))}
    </div>
  )
}

function WorkedExample({ c }: { c: Concept }) {
  const ex = c.example!
  const [shown, setShown] = useState(0)
  const [guess, setGuess] = useState('')
  const all = shown > ex.steps.length
  return (
    <div>
      <p className="measure font-medium"><Linked text={ex.q} self={c.id} max={3} /></p>
      <div className="no-print mt-3 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Your answer first (optional)" value={guess} onChange={(e) => setGuess(e.target.value)} aria-label="Your answer" />
        {!all && <button className="btn" onClick={() => setShown((s) => s + 1)}>{shown === 0 ? 'Show first step' : shown < ex.steps.length ? 'Next step' : 'Show answer'}</button>}
        {!all && <button className="btn-ghost btn" onClick={() => setShown(ex.steps.length + 1)}>Show everything</button>}
      </div>
      <ol className="mt-4 space-y-2">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="flip-in flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sblue text-xs font-semibold text-white">{i + 1}</span>
            <span className="measure"><Linked text={s} self={c.id} max={2} /></span>
          </li>
        ))}
      </ol>
      {all && (
        <div className="flip-in mt-4 border-l-4 border-sgreen bg-sgreen/10 px-4 py-3">
          <p className="font-semibold"><Linked text={ex.a} self={c.id} max={1} /></p>
          {ex.so && <p className="mt-1 text-[0.95rem]"><Linked text={ex.so} self={c.id} max={2} /></p>}
          {ex.check && <p className="mt-2 text-xs text-sgreen">✓ Answer verified by calculation</p>}
          {guess && <p className="mt-2 text-sm text-ink-2">You answered: {guess}</p>}
        </div>
      )}
    </div>
  )
}

function InlineSim({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const s = SIM_META.find((x) => x.id === id)!
  const Comp = s.load
  return (
    <div>
      <p className="measure">{s.blurb}</p>
      {!open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-tape btn" onClick={() => setOpen(true)}>Run it here: {s.name}</button>
          <Link className="btn-ghost btn" to={`/lab/${s.id}`}>Open full screen</Link>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-line bg-paper p-3 sm:p-4">
          <Suspense fallback={<p className="text-ink-2">Loading the simulator…</p>}><Comp /></Suspense>
        </div>
      )}
    </div>
  )
}

export default function ConceptPage() {
  const { id = '' } = useParams()
  const c = CONCEPT_MAP[id]
  const open = useStore((s) => s.open)
  const reachLayer = useStore((s) => s.reachLayer)
  const addCard = useStore((s) => s.addCard)
  const inDeck = useStore((s) => !!s.cards[id])
  const bookmarked = useStore((s) => s.bookmarks.includes(id))
  const toggleBookmark = useStore((s) => s.toggleBookmark)
  const deepest = useStore((s) => s.progress[id]?.layers ?? -1)
  const [active, setActive] = useState(0)
  const [qSeed, setQSeed] = useState(1)
  const web = useWiki(() => (c ? wikiFor(c) : Promise.resolve(null)), [id])

  useEffect(() => { if (c) open(c.id) }, [c, open])
  useEffect(() => { if (!c) return; const t = setTimeout(() => prefetchLive(c), 1200); return () => clearTimeout(t) }, [c])
  const layers = useMemo(() => (c ? layersFor(c) : []), [c])
  const near = useMemo(() => (c ? neighbors(c) : []), [c])
  const question = useMemo(() => (c ? makeQuestion(c, CONCEPTS, rng(qSeed * 7919 + c.id.length)) : null), [c, qSeed])
  const onSeen = useMemo(() => (n: number) => { setActive(n); reachLayer(id, n) }, [id, reachLayer])

  if (!c) return (
    <div>
      <h1 className="display text-3xl">Concept not found</h1>
      <p className="mt-2">This link points to a card that doesn't exist. <Link className="underline" to="/directory">Browse the directory</Link>.</p>
    </div>
  )
  const d = DOMAIN_MAP[c.domain]
  const sim = simFor(c)
  const idx = (lid: string) => layers.findIndex((l) => l.id === lid)
  const spec = VIZ[c.id]

  return (
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Concept layers" className="no-print mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-8">
          <Link to={`/d/${d.id}`} className="text-sm text-ink-2 hover:text-ink">{d.name}</Link>
          <ol className="mt-3 flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible">
            {layers.map((l, i) => (
              <li key={l.id} className="shrink-0">
                <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }) }}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${i === active ? 'bg-sheet font-semibold' : 'text-ink-2 hover:text-ink'}`}>
                  <span className="h-4 w-1.5 rounded-sm" style={{ background: i <= Math.max(deepest, active) ? d.tape : 'var(--color-line)' }} />
                  {l.name}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-3 hidden text-xs text-ink-2 lg:block">Hover a <span className="term-link">dotted</span> word for its card, a <span className="wiki-link">dashed</span> word for Wikipedia — move into the popup to click. Select any word to look it up.</p>
        </div>
      </nav>

      <article className="sheet min-w-0 rounded-lg p-5 sm:p-8">
        <Block id="keyword" n={idx('keyword')} name="Keyword" onSeen={onSeen}>
          <div className="grid gap-5 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 h-1.5 w-20 rounded-sm" style={{ background: d.tape }} />
              <h1 className="display text-4xl sm:text-5xl">{c.term}</h1>
              {c.full && c.full !== c.term && <p className="wide mt-2 text-lg text-ink-2">{c.full}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge id={c.id} />
                <span className="chip">{LEVEL_NAME[c.level]}</span>
                <span className="chip">{c.sub}</span>
                {c.used?.freq && <span className="chip">In job postings: {c.used.freq}</span>}
                {c.aka?.slice(0, 5).map((a) => <span key={a} className="chip">also: {a}</span>)}
              </div>
              <RoleChips c={c} />
            </div>
            {web.data?.thumb && (
              <figure className="hidden w-44 md:block">
                <img src={web.data.thumb} alt={web.data.title} className="max-h-44 w-full rounded-md border border-line bg-white object-contain" />
                <figcaption className="mt-1 text-[11px] text-ink-2">Image: Wikipedia</figcaption>
              </figure>
            )}
          </div>
          <div className="no-print mt-4 flex flex-wrap gap-2">
            <button className="btn" onClick={() => addCard(c.id)} disabled={inDeck}>{inDeck ? 'In your review deck' : 'Add to review deck'}</button>
            <button className="btn-ghost btn" onClick={() => toggleBookmark(c.id)}>{bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
            {sim && <a className="btn-tape btn" href="#sim" onClick={(e) => { e.preventDefault(); document.getElementById('sim')?.scrollIntoView({ behavior: 'smooth' }) }}>Simulate it</a>}
          </div>
          <div className="mt-3"><ExploreButtons c={c} wiki={web.data} /></div>
        </Block>

        <Block id="live" n={idx('live')} name="Live from the web" onSeen={onSeen}>
          <LiveWeb key={c.id} c={c} wiki={web} />
        </Block>

        <Block id="plain" n={idx('plain')} name="Plain meaning" onSeen={onSeen}>
          <p className="measure text-xl leading-snug"><Linked text={c.one} self={c.id} max={3} /></p>
          <p className="measure mt-3"><Linked text={c.def} self={c.id} /></p>
          {c.confused?.map(([t, diff]) => (
            <p key={t} className="measure mt-3 border-l-4 border-sorange pl-3 text-[0.95rem]"><strong>Not to be confused with {t}:</strong> <Linked text={diff} self={c.id} max={2} /></p>
          ))}
        </Block>

        {c.analogy && (
          <Block id="analogy" n={idx('analogy')} name="Analogy" onSeen={onSeen}>
            <div className="measure flex gap-3 rounded-lg bg-tape/10 p-4">
              <span aria-hidden className="text-2xl">💡</span>
              <p className="text-lg italic"><Linked text={c.analogy} self={c.id} max={2} /></p>
            </div>
          </Block>
        )}

        <Block id="picture" n={idx('picture')} name="Picture it" onSeen={onSeen}>
          {spec && <div className="rounded-lg border border-line bg-paper/60 p-3"><Viz spec={spec} /></div>}
          {web.data?.thumb && (
            <figure className={`${spec ? 'mt-4' : ''} flex flex-col gap-3 sm:flex-row sm:items-start`}>
              <img src={web.data.thumb} alt={web.data.title} loading="lazy" className="max-h-72 rounded-md border border-line bg-white object-contain sm:max-w-sm" />
              <figcaption className="text-sm text-ink-2">
                <strong className="text-ink">{web.data.title}</strong>{web.data.desc ? ` — ${web.data.desc}` : ''}. Image from Wikipedia. <a className="underline" href={web.data.url} target="_blank" rel="noopener noreferrer">See the article ↗</a>
                <span className="mt-2 block"><a className="underline" href={links(c).images} target="_blank" rel="noopener noreferrer">More images on Google ↗</a> · <a className="underline" href={links(c).youtube} target="_blank" rel="noopener noreferrer">Watch it on YouTube ↗</a></span>
              </figcaption>
            </figure>
          )}
          {!spec && !web.data?.thumb && !web.loading && (
            <p className="mb-2 text-sm text-ink-2">No picture yet for this one — <a className="underline" href={links(c).images} target="_blank" rel="noopener noreferrer">see images on Google ↗</a> or <a className="underline" href={links(c).youtube} target="_blank" rel="noopener noreferrer">watch a video ↗</a>.</p>
          )}
          {near.length > 0 && (
            <div className="mt-4">
              <p className="label mb-1">How it connects (click a box)</p>
              <div className="rounded-lg border border-line bg-paper/60 p-2"><MiniMap c={c} /></div>
            </div>
          )}
        </Block>

        {c.why && (
          <Block id="why" n={idx('why')} name="Why it matters" onSeen={onSeen}>
            <p className="measure"><Linked text={c.why} self={c.id} /></p>
          </Block>
        )}

        {c.formula && (
          <Block id="math" n={idx('math')} name="The math" onSeen={onSeen}>
            <div className="rounded-md border border-line bg-paper/50 px-4 py-2"><Tex tex={c.formula.tex} block /></div>
            {c.formula.vars && (
              <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                {c.formula.vars.map(([s, m]) => (
                  <div key={s} className="contents"><dt className="font-semibold"><Tex tex={s} /></dt><dd className="text-ink-2"><Linked text={m} self={c.id} max={1} /></dd></div>
                ))}
              </dl>
            )}
          </Block>
        )}

        {ALGOS[c.id] && (
          <Block id="algo" n={idx('algo')} name="Algorithm" onSeen={onSeen}>
            <AlgoFlow algo={ALGOS[c.id]} />
          </Block>
        )}

        {c.example && (
          <Block id="example" n={idx('example')} name="Worked example" onSeen={onSeen}>
            <WorkedExample c={c} />
          </Block>
        )}

        {(c.real || c.used) && (
          <Block id="real" n={idx('real')} name="On the job" onSeen={onSeen}>
            {c.real && (
              <div className="measure rounded-lg border-l-4 p-4" style={{ borderColor: d.tape, background: 'color-mix(in srgb, var(--color-sblue) 5%, transparent)' }}>
                <p className="label">Real-life case — {c.real.where}</p>
                <p className="mt-1"><Linked text={c.real.story} self={c.id} /></p>
              </div>
            )}
            {c.used && (
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {c.used.ind && <div><dt className="label">Industries</dt><dd>{c.used.ind.join(', ')}</dd></div>}
                {c.used.roles && <div><dt className="label">Who uses it</dt><dd>{c.used.roles.join(', ')}</dd></div>}
                {c.used.tools && <div><dt className="label">Tools</dt><dd><Linked text={c.used.tools.join(', ')} self={c.id} /></dd></div>}
              </dl>
            )}
            {c.mistakes && (
              <div className="mt-5">
                <p className="label">Common mistakes</p>
                <ul className="measure mt-1 list-disc space-y-1 pl-5">{c.mistakes.map((m) => <li key={m}><Linked text={m} self={c.id} max={2} /></li>)}</ul>
              </div>
            )}
            {c.cert && <p className="mt-4 text-sm text-ink-2">Shows up in: {c.cert.join(', ')}</p>}
            <p className="mt-4 text-sm"><a className="underline" href={links(c).youtube} target="_blank" rel="noopener noreferrer">▶ See it done in real life on YouTube ↗</a></p>
          </Block>
        )}

        <Block id="jobs" n={idx('jobs')} name="Jobs that need it" onSeen={onSeen}>
          <JobsBlock c={c} />
        </Block>

        {sim && (
          <Block id="sim" n={idx('sim')} name="Simulate it" onSeen={onSeen}>
            <InlineSim key={sim.id} id={sim.id} />
          </Block>
        )}

        <Block id="try" n={idx('try')} name="Check yourself" onSeen={onSeen}>
          {question && <QuestionCard key={qSeed} item={question} onDone={() => setQSeed((s) => s + 1)} />}
        </Block>

        {c.iq?.length ? (
          <Block id="interview" n={idx('interview')} name="Interview" onSeen={onSeen}>
            <div className="space-y-2">
              {c.iq.map((q) => (
                <details key={q.q} className="group rounded-md border border-line px-4 py-3">
                  <summary className="cursor-pointer font-medium marker:text-ink-2">{q.q} {q.type && <span className="chip ml-2 align-middle">{q.type}</span>}</summary>
                  <p className="measure mt-2 text-[0.97rem]"><Linked text={q.a} self={c.id} /></p>
                </details>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-2">Say your answer out loud before opening the model answer. More in <Link className="underline" to="/interview">Interview prep</Link>.</p>
          </Block>
        ) : null}

        <Block id="more" n={idx('more')} name="Learn more" onSeen={onSeen}>
          <p className="label mb-2">Search further (opens a new tab)</p>
          <ExploreButtons c={c} big wiki={web.data} />
          {near.length > 0 && (
            <div className="mt-5">
              <p className="label mb-2">Connected concepts</p>
              <div className="flex flex-wrap gap-2">
                {near.map((n) => (
                  <Link key={n.id} to={`/c/${n.id}`} className="chip hover:border-ink">
                    <span className="inline-block h-2 w-3 rounded-sm" style={{ background: DOMAIN_MAP[n.domain].tape }} />{n.term}{c.pre?.includes(n.id) ? ' (learn first)' : ''}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {c.verify && <p className="mt-6 text-xs text-ink-2">Some figures on this card vary by company or source — verify before quoting them.</p>}
        </Block>
      </article>
    </div>
  )
}
