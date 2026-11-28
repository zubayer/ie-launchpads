import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from 'd3-force'
import { CONCEPTS, CONCEPT_MAP, byDomain, learningOrder } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { statusOf, streak, today, useStore } from '../lib/store'
import { isDue } from '../lib/srs'
import { TEXT_SIZES, THEMES, type TextSize } from '../lib/display'
import { Bar, ConceptRow, PageHead, Section } from '../components/ui'
import type { DomainId } from '../types'
import { FocusTimer } from '../components/FocusTimer'

const DoNext = lazy(() => import('../components/DoNext'))

/* ---------- Daily plan: one module per day through the target date ---------- */
export function Plan() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const ratings = useStore((s) => s.ratings)
  const rateSkill = useStore((s) => s.rateSkill)
  const progress = useStore((s) => s.progress)
  // Module sequence: each role path, then each domain not yet covered
  const modules = useMemo(() => {
    const m = ROLES.map((r) => ({ id: 'role:' + r.id, title: r.title, kind: 'Role', concepts: r.concepts.filter((c) => CONCEPT_MAP[c]), skills: r.tools.slice(0, 5) }))
    DOMAINS.forEach((d) => m.push({ id: 'dom:' + d.id, title: d.name, kind: 'Domain', concepts: learningOrder(byDomain(d.id)).map((c) => c.id).slice(0, 12), skills: d.subs.slice(0, 5) }))
    return m
  }, [])
  // A cleared or half-typed date input gives '' — fall back to today so the page keeps working.
  const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + 'T00:00:00').getTime())
  const start = new Date((isDate(settings.planStart) ? settings.planStart : today()) + 'T00:00:00')
  const end = new Date((isDate(settings.planEnd) ? settings.planEnd : today()) + 'T00:00:00')
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const dayN = Math.floor((new Date(today() + 'T00:00:00').getTime() - start.getTime()) / 86400000)
  const idx = ((dayN % modules.length) + modules.length) % modules.length
  const mod = modules[idx]
  const todayR = ratings[today()] || {}
  return (
    <div>
      <PageHead title="Daily plan" sub="One module a day — a role or a domain — on a loop until your end date. Rate yourself on each skill daily; the trend is your evidence of progress." />
      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="sheet rounded-lg p-5" aria-labelledby="session-h">
          <h2 id="session-h" className="wide text-xl">Today's session</h2>
          <Suspense fallback={<p className="mt-4 text-sm text-ink-2">Working out what to do next…</p>}><DoNext /></Suspense>
        </section>
        <FocusTimer />
      </div>
      <div className="sheet mb-6 grid gap-3 rounded-lg p-4 sm:grid-cols-4">
        <label className="block"><span className="label">Start date</span><input type="date" className="input mt-1" value={settings.planStart} onChange={(e) => setSettings({ planStart: e.target.value })} /></label>
        <label className="block"><span className="label">End date</span><input type="date" className="input mt-1" value={settings.planEnd} onChange={(e) => setSettings({ planEnd: e.target.value })} /></label>
        <label className="block"><span className="label">New concepts per day</span><input type="number" min={1} max={30} className="input mt-1" value={settings.dailyNew} onChange={(e) => setSettings({ dailyNew: Number(e.target.value) })} /></label>
        <div className="self-end text-sm text-ink-2">Day {Math.max(1, dayN + 1)} of {days} · {modules.length} modules per loop</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="sheet rounded-lg p-5">
          <p className="label">Today's module · {mod.kind}</p>
          <h2 className="display mt-1 text-3xl">{mod.title}</h2>
          <div className="mt-4">{mod.concepts.map((id) => <ConceptRow key={id} c={CONCEPT_MAP[id]} />)}</div>
          <Link to={mod.kind === 'Role' ? `/roles/${mod.id.slice(5)}` : `/d/${mod.id.slice(4)}`} className="btn mt-4">Open the full module</Link>
        </div>
        <div className="space-y-4">
          <div className="sheet rounded-lg p-4">
            <h2 className="wide mb-2">Rate yourself today (1–5)</h2>
            {mod.skills.map((s) => (
              <div key={s} className="mb-2">
                <p className="text-sm">{s}</p>
                <div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => rateSkill(s, v)} className={`h-8 w-8 rounded-md border text-sm ${todayR[s] === v ? 'border-ink bg-tape font-bold text-ink' : 'border-line'}`} aria-label={`${s}: ${v}`}>{v}</button>
                ))}</div>
              </div>
            ))}
          </div>
          <div className="sheet rounded-lg p-4">
            <h2 className="wide mb-2">Up next</h2>
            <ol className="space-y-1 text-sm">{[1, 2, 3, 4, 5].map((k) => { const m = modules[(idx + k) % modules.length]; return <li key={k}>{new Date(Date.now() + k * 86400000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} — {m.title}</li> })}</ol>
          </div>
          <p className="text-sm text-ink-2">{Object.values(progress).filter((p) => p.opened).length} of {CONCEPTS.length} concepts opened so far.</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Knowledge map ---------- */
interface GNode extends SimulationNodeDatum { id: string; term: string; domain: DomainId; deg: number }

export function Graph() {
  const [dom, setDom] = useState<DomainId | ''>('lean')
  const [nodes, setNodes] = useState<GNode[]>([])
  const [hover, setHover] = useState<string | null>(null)
  const nav = useNavigate()
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const W = 900, H = 620
  const { list, links } = useMemo(() => {
    const base = dom ? CONCEPTS.filter((c) => c.domain === dom) : CONCEPTS
    const ids = new Set(base.map((c) => c.id))
    // include direct neighbors from other domains when filtering
    if (dom) base.forEach((c) => [...(c.rel || []), ...(c.pre || [])].forEach((r) => CONCEPT_MAP[r] && ids.add(r)))
    const list = [...ids].map((i) => CONCEPT_MAP[i])
    const links: { source: string; target: string }[] = []
    list.forEach((c) => [...(c.rel || []), ...(c.pre || [])].forEach((r) => ids.has(r) && links.push({ source: c.id, target: r })))
    return { list, links }
  }, [dom])
  const sim = useRef<ReturnType<typeof forceSimulation<GNode>> | null>(null)
  useEffect(() => {
    const deg: Record<string, number> = {}
    links.forEach((l) => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1 })
    const ns: GNode[] = list.map((c) => ({ id: c.id, term: c.term, domain: c.domain, deg: deg[c.id] || 0 }))
    sim.current?.stop()
    const s = forceSimulation(ns)
      .force('link', forceLink(links.map((l) => ({ ...l }))).id((d) => (d as GNode).id).distance(dom ? 70 : 40))
      .force('charge', forceManyBody().strength(dom ? -180 : -40))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide(dom ? 22 : 8))
    s.on('tick', () => { ns.forEach((n) => { n.x = Math.max(40, Math.min(W - 40, n.x ?? 0)); n.y = Math.max(24, Math.min(H - 16, n.y ?? 0)) }); setNodes([...ns]) })
    sim.current = s
    return () => { s.stop() }
  }, [list, links, dom])
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const nearHover = new Set(hover ? links.filter((l) => l.source === hover || l.target === hover).flatMap((l) => [l.source, l.target]) : [])
  return (
    <div>
      <PageHead title="Knowledge map" sub="Every line is a prerequisite or a close relationship. Color shows your status; size shows how connected a concept is. Click a node to open it." />
      <select className="input mb-4 !w-auto" value={dom} onChange={(e) => setDom(e.target.value as DomainId)} aria-label="Domain">
        <option value="">Everything ({CONCEPTS.length} concepts)</option>
        {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <div className="sheet overflow-hidden rounded-lg">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Concept network">
          {links.map((l, i) => {
            const a = pos[l.source], b = pos[l.target]
            if (!a || !b) return null
            const hl = hover && (l.source === hover || l.target === hover)
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hl ? 'var(--color-ink)' : 'var(--color-line)'} strokeWidth={hl ? 2 : 1} />
          })}
          {nodes.map((n) => {
            const st = statusOf(progress[n.id], cards[n.id])
            const fill = st === 'mastered' ? 'var(--color-sgreen)' : st === 'reviewing' ? 'var(--color-sblue)' : st === 'learning' ? 'var(--color-sorange)' : 'var(--color-sheet)'
            const r = (dom ? 7 : 3.5) + Math.min(8, n.deg) * (dom ? 0.9 : 0.5)
            const dim = hover && !nearHover.has(n.id) && hover !== n.id
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer" opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => nav(`/c/${n.id}`)}>
                <circle r={r} fill={fill} stroke={DOMAIN_MAP[n.domain].tape} strokeWidth={2.5} />
                {(dom || hover === n.id) && <text y={-r - 4} textAnchor="middle" fontSize="11" fill="var(--color-ink)">{n.term}</text>}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ---------- Progress & settings ---------- */
export function Progress() {
  const state = useStore()
  const { progress, cards, activity, settings, setSettings, importAll, reset } = state
  const [msg, setMsg] = useState('')
  const due = Object.values(cards).filter((c) => isDue(c)).length
  const by = DOMAINS.map((d) => {
    const list = byDomain(d.id)
    const m = list.filter((c) => statusOf(progress[c.id], cards[c.id]) === 'mastered').length
    const o = list.filter((c) => progress[c.id]?.opened).length
    return { d, total: list.length, m, o }
  })
  const weak = CONCEPTS.filter((c) => (progress[c.id]?.results?.length || 0) >= 2)
    .map((c) => ({ c, acc: progress[c.id]!.results!.reduce((a, b) => a + b, 0) / progress[c.id]!.results!.length }))
    .filter((x) => x.acc < 0.7).sort((a, b) => a.acc - b.acc).slice(0, 10)
  const weeks = 18
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (weeks * 7 - 1 - i))
    return { k: today(d), v: activity[today(d)] || 0 }
  })
  const exportData = () => {
    const { progress, cards, activity, ratings, stories, bookmarks, settings, mockLog } = useStore.getState()
    const blob = new Blob([JSON.stringify({ progress, cards, activity, ratings, stories, bookmarks, settings, mockLog, exported: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ie-launchpad-progress-${today()}.json`
    a.click()
  }
  const total = { m: by.reduce((s, x) => s + x.m, 0), o: by.reduce((s, x) => s + x.o, 0) }
  return (
    <div>
      <PageHead title="Progress" sub="Mastery means you answered correctly on at least two different days, or a card has survived a 2-week review interval." />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Opened', total.o], ['Mastered', total.m], ['Cards in deck', Object.keys(cards).length], ['Due now', due], ['Day streak', streak(activity)], ['Bookmarks', state.bookmarks.length], ['STAR stories', state.stories.length], ['Mock answers', state.mockLog.length]].map(([l, v]) => (
          <div key={l as string} className="sheet rounded-lg p-4"><div className="display text-3xl">{v}</div><div className="text-sm text-ink-2">{l}</div></div>
        ))}
      </div>
      <Section title="Activity (last 18 weeks)">
        <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
          {cells.map((c) => <div key={c.k} title={`${c.k}: ${c.v} actions`} className="h-3.5 w-3.5 rounded-sm" style={{ background: c.v ? `color-mix(in srgb, var(--color-sgreen) ${Math.min(100, 25 + c.v * 6)}%, transparent)` : 'var(--color-line)' }} />)}
        </div>
      </Section>
      <Section title="By domain">
        <div className="grid gap-x-10 gap-y-3 md:grid-cols-2">
          {by.map(({ d, total, m, o }) => (
            <Link key={d.id} to={`/d/${d.id}`} className="block hover:underline">
              <div className="flex justify-between text-sm"><span>{d.name}</span><span className="text-ink-2">{m} mastered · {o}/{total} opened</span></div>
              <Bar value={total ? o / total : 0} color={d.tape} label={d.name} />
            </Link>
          ))}
        </div>
      </Section>
      {weak.length > 0 && (
        <Section title="Weak spots" right={<Link className="btn" to="/practice">Drill weak spots</Link>}>
          {weak.map(({ c, acc }) => <div key={c.id} className="flex items-center gap-3"><div className="flex-1"><ConceptRow c={c} /></div><span className="text-sm text-sred">{Math.round(acc * 100)}%</span></div>)}
        </Section>
      )}
      <Section title="Settings & data">
        <div className="sheet grid gap-4 rounded-lg p-5 sm:grid-cols-2">
          <label className="block"><span className="label">Theme</span>
            <select className="input mt-1" value={settings.theme} onChange={(e) => setSettings({ theme: e.target.value as typeof settings.theme })}>{THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}: {t.hint.toLowerCase()}</option>)}</select></label>
          <label className="block"><span className="label">Text size</span>
            <select className="input mt-1" value={settings.textSize ?? 'standard'} onChange={(e) => setSettings({ textSize: e.target.value as TextSize })}>{TEXT_SIZES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label className="block"><span className="label">Focus block length (minutes)</span>
            <input type="number" min={5} max={90} className="input mt-1" value={settings.focusMin} onChange={(e) => setSettings({ focusMin: Number(e.target.value) })} /></label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
            <button className="btn" onClick={exportData}>Export progress (JSON)</button>
            <label className="btn-ghost btn">Import progress<input type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return
              try { importAll(await f.text()); setMsg('Progress imported.') } catch (err) { setMsg((err as Error).message) }
            }} /></label>
            <button className="btn-ghost btn !border-sred !text-sred" onClick={() => { if (confirm('Erase all progress in this browser? Export first if you want a backup.')) { reset(); setMsg('Progress reset.') } }}>Reset all progress</button>
          </div>
          {msg && <p className="text-sm sm:col-span-2">{msg}</p>}
        </div>
      </Section>
    </div>
  )
}

/* ---------- Method ---------- */
const METHODS = [
  ['Spaced repetition', 'Reviews are scheduled just before you would forget (SM-2 algorithm). Spacing beats cramming for long-term retention in study after study.', '/review'],
  ['Retrieval practice', 'Pulling an answer out of memory strengthens it far more than re-reading. Every card has a “Check yourself” question, and quizzes update mastery.', '/practice'],
  ['Interleaving', 'Mixing topics (Cpk, EOQ, random forests in one quiz) is harder in the moment and better for exams and interviews, where questions arrive unlabeled.', '/practice'],
  ['Dual coding', 'Words plus a picture. Each domain has simulators and diagrams so the idea has a visual handle.', '/lab'],
  ['Concrete → abstract', 'Every card moves from plain meaning and analogy to the math — so the formula arrives already making sense.', '/directory'],
  ['Worked → faded examples', 'Worked examples reveal one step at a time. Try the next step before you click; then solve the practice version from scratch.', '/directory'],
  ['Prediction (generation effect)', 'Every simulator asks you to predict first. Being wrong before seeing the answer is one of the fastest ways to learn.', '/lab'],
  ['Deliberate practice', 'Weak spots are ranked by error rate; drill the bottom ten instead of re-reading what you already know.', '/progress'],
  ['Focus blocks', 'Short, single-task sessions (Pomodoro) with breaks keep attention high. One concept per block works well.', '/'],
]

export function Method() {
  return (
    <div>
      <PageHead title="How to learn fast" sub="The platform is built around a few learning-science methods with strong evidence. Here is the loop, and why each step is there." />
      <div className="sheet mb-8 rounded-lg p-5">
        <p className="label mb-3">The daily loop</p>
        <ol className="grid gap-3 sm:grid-cols-4">
          {['Review what’s due (10–15 min)', 'Learn today’s new concepts, layer by layer', 'Predict, then run one simulator', 'Mixed quiz, then one mock interview answer out loud'].map((s, i) => (
            <li key={s} className="flex gap-3"><span className="display text-3xl text-ink-2">{i + 1}</span><span className="pt-1">{s}</span></li>
          ))}
        </ol>
      </div>
      <div className="grid gap-x-10 md:grid-cols-2">
        {METHODS.map(([t, d, to]) => (
          <div key={t} className="border-b border-line py-4">
            <h2 className="wide text-lg">{t}</h2>
            <p className="measure text-[0.97rem] text-ink-2">{d}</p>
            <Link to={to} className="mt-1 inline-block text-sm underline">Try it</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
