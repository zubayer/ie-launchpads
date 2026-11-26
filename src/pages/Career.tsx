import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CONCEPTS, CONCEPT_MAP } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { BEHAVIORAL, STAR_THEMES } from '../content/behavioral'
import { CASES } from '../content/cases'
import { statusOf, useStore, type StarStory } from '../lib/store'
import { shuffle } from '../lib/quiz'
import { Bar, ConceptRow, PageHead, Rich, Section } from '../components/ui'
import type { DomainId, InterviewQ, InterviewType } from '../types'
import { InterviewCard, TYPE_LABEL } from '../components/Interview'
import { LoadGate } from '../components/LoadGate'
import { useAllConcepts } from '../content/load'
import type { Concept } from '../types'

const TYPES = Object.keys(TYPE_LABEL) as InterviewType[]

export function Roles() {
  const path = useStore((s) => s.settings.path)
  return (
    <div>
      <PageHead title="Role paths" sub="Each path is what a hiring manager for that job expects an entry-level engineer or analyst to know: concepts in learning order, tools, KPIs, a day in the job, interview questions and a portfolio project." />
      <div className="grid gap-x-10 md:grid-cols-2">
        {ROLES.map((r) => <RoleLine key={r.id} id={r.id} active={path === r.id} />)}
      </div>
    </div>
  )
}

function useRoleProgress(ids: string[]) {
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const valid = ids.filter((i) => CONCEPT_MAP[i])
  const mastered = valid.filter((i) => statusOf(progress[i], cards[i]) === 'mastered').length
  const opened = valid.filter((i) => progress[i]?.opened).length
  return { total: valid.length, mastered, opened }
}

function RoleLine({ id, active }: { id: string; active: boolean }) {
  const r = ROLES.find((x) => x.id === id)!
  const p = useRoleProgress(r.concepts)
  return (
    <Link to={`/roles/${r.id}`} className="block border-b border-line py-4 hover:bg-sblue/5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="wide text-lg">{r.title}{active && <span className="chip ml-2 align-middle !border-tape">Your path</span>}</span>
        <span className="text-sm text-ink-2">{p.opened}/{p.total}</span>
      </span>
      <span className="block text-[0.95rem] text-ink-2">{r.summary}</span>
      <span className="mt-2 block max-w-sm"><Bar value={p.total ? p.opened / p.total : 0} label={`${r.title} progress`} /></span>
    </Link>
  )
}

export function RolePage() {
  const { id = '' } = useParams()
  const r = ROLES.find((x) => x.id === id)
  const path = useStore((s) => s.settings.path)
  const setSettings = useStore((s) => s.setSettings)
  const addCard = useStore((s) => s.addCard)
  if (!r) return <p>Role not found. <Link className="underline" to="/roles">All roles</Link></p>
  const concepts = r.concepts.map((c) => CONCEPT_MAP[c]).filter(Boolean)
  return (
    <div>
      <PageHead title={r.title} sub={r.summary}>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" disabled={path === r.id} onClick={() => setSettings({ path: r.id })}>{path === r.id ? 'This is your path' : 'Make this my path'}</button>
          <button className="btn-ghost btn" onClick={() => concepts.forEach((c) => addCard(c.id))}>Add all {concepts.length} concepts to my review deck</button>
          <Link className="btn-ghost btn" to={`/interview?role=${r.id}`}>Mock interview for this role</Link>
        </div>
      </PageHead>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <Section title="Concepts, in learning order">
            {concepts.map((c) => <ConceptRow key={c.id} c={c} />)}
          </Section>
          <Section title="Interview questions">
            <QList qs={r.questions} />
          </Section>
          <Section title={`Portfolio project: ${r.project.title}`}>
            <p className="measure">{r.project.brief}</p>
            <ol className="measure mt-3 list-decimal space-y-1 pl-5">{r.project.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </Section>
        </div>
        <aside className="space-y-6">
          <div className="sheet rounded-lg p-4">
            <h2 className="wide mb-2">A day in the job</h2>
            <ul className="list-disc space-y-1 pl-5 text-[0.95rem]">{r.day.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div className="sheet rounded-lg p-4">
            <h2 className="wide mb-2">Tools</h2>
            <div className="flex flex-wrap gap-1.5">{r.tools.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            <h2 className="wide mb-2 mt-4">KPIs you'll own</h2>
            <div className="flex flex-wrap gap-1.5">{r.kpis.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            <h2 className="wide mb-2 mt-4">Certifications that help</h2>
            <ul className="list-disc pl-5 text-[0.95rem]">{r.certs.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function QList({ qs }: { qs: InterviewQ[] }) {
  return (
    <div className="space-y-2">
      {qs.map((q) => <InterviewCard key={q.q} q={q} />)}
    </div>
  )
}

/* ---------------- Interview prep hub ---------------- */

type Tab = 'bank' | 'mock' | 'star' | 'cases' | 'decoder' | 'bullets'
const TABS: [Tab, string][] = [['bank', 'Question bank'], ['mock', 'Mock interview'], ['star', 'STAR story builder'], ['cases', 'Case interviews'], ['decoder', 'Job posting decoder'], ['bullets', 'Resume bullet builder']]

interface BankQ extends InterviewQ { src: string; domain?: DomainId; link?: string; concept?: string }

function allQuestions(concepts: Concept[]): BankQ[] {
  const fromConcepts: BankQ[] = concepts.flatMap((c) => (c.iq || []).map((q) => ({ ...q, type: q.type || 'technical', src: c.term, domain: c.domain, link: `/c/${c.id}`, concept: c.id })))
  const fromRoles: BankQ[] = ROLES.flatMap((r) => r.questions.map((q) => ({ ...q, src: r.title, link: `/roles/${r.id}` })))
  const beh: BankQ[] = BEHAVIORAL.map((q) => ({ ...q, type: 'behavioral', src: 'Behavioral' }))
  const seen = new Set<string>()
  return [...fromConcepts, ...fromRoles, ...beh].filter((q) => (seen.has(q.q) ? false : (seen.add(q.q), true)))
}

function Bank({ concepts }: { concepts: Concept[] }) {
  const qs = useMemo(() => allQuestions(concepts), [concepts])
  const [type, setType] = useState('')
  const [dom, setDom] = useState('')
  const [q, setQ] = useState('')
  const counts = useMemo(() => qs.reduce<Record<string, number>>((m, x) => { if (x.type) m[x.type] = (m[x.type] || 0) + 1; return m }, {}), [qs])
  const list = qs.filter((x) => (!type || x.type === type) && (!dom || x.domain === dom) && (!q || (x.q + x.a).toLowerCase().includes(q.toLowerCase())))
  const reported = qs.filter((x) => x.origin === 'reported').length
  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">All types</option>{TYPES.filter((t) => counts[t]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]} ({counts[t]})</option>)}
        </select>
        <select className="input" value={dom} onChange={(e) => setDom(e.target.value)} aria-label="Domain">
          <option value="">All domains</option>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <p className="mb-2 text-sm text-ink-2">{list.length} questions. Answer out loud first; then open the model answer. {reported ? `${reported} questions in the bank are reported from a cited source; every other one` : 'Every question in the bank'} is an original practice question written for this site, not a question reported from any employer.</p>
      <div className="space-y-2">
        {list.slice(0, 150).map((x) => (
          <InterviewCard key={x.q} q={x} concept={x.concept} footer={x.link ? <Link to={x.link} className="inline-block text-sm underline">From: {x.src}</Link> : null} />
        ))}
      </div>
    </div>
  )
}

function Mock({ concepts }: { concepts: Concept[] }) {
  const [params] = useSearchParams()
  const [role, setRole] = useState(params.get('role') || '')
  const [n, setN] = useState(6)
  const [set, setSet] = useState<BankQ[] | null>(null)
  const [i, setI] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [left, setLeft] = useState(120)
  const logMock = useStore((s) => s.logMock)
  const mockLog = useStore((s) => s.mockLog)
  useEffect(() => {
    if (!set || reveal) return
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(t)
  }, [set, i, reveal])
  const start = () => {
    const all = allQuestions(concepts)
    const r = ROLES.find((x) => x.id === role)
    const roleIds = new Set(r?.concepts || [])
    const tech = shuffle(all.filter((q) => q.type !== 'behavioral' && (!r || (q.link && [...roleIds].some((id) => q.link === `/c/${id}`)) || q.src === r?.title)))
    const beh = shuffle(all.filter((q) => q.type === 'behavioral'))
    const k = Math.ceil(n / 3)
    setSet(shuffle([...tech.slice(0, n - k), ...beh.slice(0, k)]))
    setI(0); setReveal(false); setLeft(120)
  }
  if (!set) {
    return (
      <div className="sheet max-w-2xl rounded-lg p-5">
        <p className="measure">A timed, mixed interview: about two-thirds technical, one-third behavioral. Two minutes per answer, spoken aloud. Then compare with the model answer and rate yourself honestly — low ratings feed your practice list.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Role focus</span>
            <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value)}><option value="">General IE</option>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label>
          <label className="block"><span className="label">Questions</span>
            <select className="input mt-1" value={n} onChange={(e) => setN(Number(e.target.value))}>{[3, 6, 9, 12].map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <button className="btn mt-4" onClick={start}>Start mock interview</button>
        {mockLog.length > 0 && <p className="mt-4 text-sm text-ink-2">{mockLog.length} answers logged · average self-rating {(mockLog.reduce((s, m) => s + m.rating, 0) / mockLog.length).toFixed(1)} / 5</p>}
      </div>
    )
  }
  if (i >= set.length) {
    return (
      <div className="sheet max-w-2xl rounded-lg p-5">
        <p className="display text-3xl">Interview complete.</p>
        <p className="mt-2 text-ink-2">Re-record the answers you rated 1–2 tomorrow. Spaced, spoken repetition is how answers become automatic.</p>
        <button className="btn mt-4" onClick={() => setSet(null)}>Back to setup</button>
      </div>
    )
  }
  const q = set[i]
  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex justify-between text-sm text-ink-2"><span>Question {i + 1} of {set.length} · {q.type}</span><span className={left < 20 ? 'font-semibold text-sred' : ''}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span></div>
      <div className="sheet rounded-lg p-6">
        <p className="wide text-xl">{q.q}</p>
        {!reveal ? (
          <button className="btn mt-5" onClick={() => setReveal(true)}>I've answered — show the model answer</button>
        ) : (
          <div className="flip-in mt-4">
            <p className="measure border-l-4 border-sgreen pl-3"><Rich text={q.a} /></p>
            <p className="label mt-4">Rate your answer</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} className="btn-ghost btn" onClick={() => { logMock(q.q, v); setI(i + 1); setReveal(false); setLeft(120) }}>
                  {v} — {['Blank', 'Weak', 'OK', 'Good', 'Strong'][v - 1]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const VERBS = /\b(I|led|built|designed|reduced|analyzed|implemented|created|drove|ran|proposed|negotiated|trained|automated|measured|cut|improved|launched)\b/i

function Star() {
  const stories = useStore((s) => s.stories)
  const save = useStore((s) => s.saveStory)
  const del = useStore((s) => s.deleteStory)
  const blank = (): StarStory => ({ id: String(Date.now()), title: '', s: '', t: '', a: '', r: '', tags: [], updated: Date.now() })
  const [st, setSt] = useState<StarStory>(blank)
  const checks = [
    { ok: st.s.split(/\s+/).filter(Boolean).length <= 60 && st.s.length > 0, msg: 'Situation is short (≤ 60 words) — set the scene, don’t narrate it.' },
    { ok: /\b(I|my)\b/.test(st.a), msg: 'Action says what you did (“I…”), not just “we”.' },
    { ok: st.a.split(/\s+/).filter(Boolean).length >= 40, msg: 'Action is the longest part (aim for 40+ words, 3–4 concrete steps).' },
    { ok: /\d/.test(st.r), msg: 'Result has a number: %, $, hours, defects, days.' },
    { ok: VERBS.test(st.a), msg: 'Action uses strong verbs (analyzed, designed, reduced…).' },
    { ok: st.tags.length > 0, msg: 'Tagged with at least one theme so you can find it for any question.' },
  ]
  const covered = new Set(stories.flatMap((s) => s.tags))
  const field = (k: 's' | 't' | 'a' | 'r', label: string, hint: string, rows = 3) => (
    <label className="block"><span className="label">{label}</span><span className="block text-xs text-ink-2">{hint}</span>
      <textarea className="input mt-1" rows={rows} value={st[k]} onChange={(e) => setSt({ ...st, [k]: e.target.value })} /></label>
  )
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="sheet space-y-3 rounded-lg p-5">
        <label className="block"><span className="label">Story title</span><input className="input mt-1" value={st.title} onChange={(e) => setSt({ ...st, title: e.target.value })} placeholder="e.g., Cut changeover time on line 3" /></label>
        {field('s', 'Situation', 'Where, when, what was at stake. 1–2 sentences.', 2)}
        {field('t', 'Task', 'Your specific responsibility or goal.', 2)}
        {field('a', 'Action', 'What you did, step by step, and why. Name the tools and methods (DMAIC, Pareto, SQL, time study).', 5)}
        {field('r', 'Result', 'Quantified outcome, what you learned, what you’d do differently.', 3)}
        <div>
          <p className="label">Themes</p>
          <div className="mt-1 flex flex-wrap gap-1.5">{STAR_THEMES.map((t) => (
            <button key={t} onClick={() => setSt({ ...st, tags: st.tags.includes(t) ? st.tags.filter((x) => x !== t) : [...st.tags, t] })} className={`chip !text-xs ${st.tags.includes(t) ? '!border-ink !text-ink font-semibold' : ''}`}>{t}</button>
          ))}</div>
        </div>
        <ul className="space-y-1 text-sm">{checks.map((c) => <li key={c.msg} className={c.ok ? 'text-sgreen' : 'text-ink-2'}>{c.ok ? '✓' : '○'} {c.msg}</li>)}</ul>
        <div className="flex gap-2">
          <button className="btn" disabled={!st.title} onClick={() => { save({ ...st, updated: Date.now() }); setSt(blank()) }}>Save story</button>
          <button className="btn-ghost btn" onClick={() => setSt(blank())}>New</button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="sheet rounded-lg p-4">
          <h2 className="wide">Theme coverage</h2>
          <p className="mb-2 text-sm text-ink-2">Aim for one strong story per theme; most behavioral questions map onto these.</p>
          <div className="flex flex-wrap gap-1.5">{STAR_THEMES.map((t) => <span key={t} className={`chip !text-xs ${covered.has(t) ? '!border-sgreen !text-sgreen' : ''}`}>{covered.has(t) ? '✓ ' : ''}{t}</span>)}</div>
        </div>
        <div className="sheet rounded-lg p-4">
          <h2 className="wide mb-2">Your stories ({stories.length})</h2>
          {!stories.length && <p className="text-sm text-ink-2">No stories yet. Start with a project from your analyst work or coursework.</p>}
          {stories.map((s) => (
            <div key={s.id} className="border-b border-line py-2">
              <button className="text-left font-semibold hover:underline" onClick={() => setSt(s)}>{s.title}</button>
              <div className="text-xs text-ink-2">{s.tags.join(', ')}</div>
              <button className="text-xs text-sred hover:underline" onClick={() => del(s.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Cases() {
  const [open, setOpen] = useState(CASES[0]?.id)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const c = CASES.find((x) => x.id === open)!
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <ul className="space-y-1">{CASES.map((x) => <li key={x.id}><button onClick={() => setOpen(x.id)} className={`w-full rounded-md px-3 py-2 text-left text-sm ${x.id === open ? 'bg-sheet font-semibold' : 'text-ink-2 hover:bg-sblue/5'}`}>{x.title}</button></li>)}</ul>
      {c && (
        <div className="sheet rounded-lg p-5">
          <h2 className="wide text-xl">{c.title}</h2>
          <p className="measure mt-2 text-lg">{c.prompt}</p>
          <label className="mt-4 block"><span className="label">Your structure (write it, then say it out loud)</span>
            <textarea className="input mt-1" rows={5} value={notes[c.id] || ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} /></label>
          {!show[c.id] ? <button className="btn mt-3" onClick={() => setShow({ ...show, [c.id]: true })}>Compare with a strong approach</button> : (
            <div className="flip-in mt-4 space-y-4">
              <div><p className="label">Framework</p><ol className="measure list-decimal space-y-1 pl-5">{c.framework.map((f) => <li key={f}><Rich text={f} /></li>)}</ol></div>
              <div><p className="label">What the interviewer will probe</p><ul className="measure list-disc space-y-1 pl-5">{c.probes.map((f) => <li key={f}>{f}</li>)}</ul></div>
              <div><p className="label">A strong answer sounds like</p><p className="measure border-l-4 border-sgreen pl-3"><Rich text={c.strongAnswer} /></p></div>
              <div className="flex flex-wrap gap-2">{c.concepts.filter((id) => CONCEPT_MAP[id]).map((id) => <Link key={id} to={`/c/${id}`} className="chip hover:border-ink">{CONCEPT_MAP[id].term}</Link>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function decode(text: string) {
  const hits = new Map<string, number>()
  for (const c of CONCEPTS) {
    const names = [c.term, c.full, ...(c.aka || [])].filter(Boolean) as string[]
    for (const n of names) {
      if (n.length < 2) continue
      const isAcr = /^[A-Z0-9&/-]{2,6}$/.test(n)
      const re = new RegExp(`(^|[^A-Za-z0-9])${escapeRe(n)}([^A-Za-z0-9]|$)`, isAcr ? 'g' : 'gi')
      const m = text.match(re)
      if (m) hits.set(c.id, (hits.get(c.id) || 0) + m.length)
    }
  }
  return [...hits.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ c: CONCEPT_MAP[id], n }))
}

function Decoder() {
  const [text, setText] = useState('')
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const hits = useMemo(() => decode(text), [text])
  const score = hits.length ? hits.reduce((s, h) => {
    const st = statusOf(progress[h.c.id], cards[h.c.id])
    return s + (st === 'mastered' ? 1 : st === 'reviewing' ? 0.6 : st === 'learning' ? 0.3 : 0)
  }, 0) / hits.length : 0
  const roleFit = ROLES.map((r) => ({ r, n: hits.filter((h) => r.concepts.includes(h.c.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 3)
  const addCard = useStore((s) => s.addCard)
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <label className="block"><span className="label">Paste a job description</span>
          <textarea className="input mt-1 min-h-80" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the full posting: responsibilities, required and preferred qualifications…" /></label>
        <p className="mt-2 text-sm text-ink-2">Nothing leaves your browser. The decoder matches the posting against every term, acronym and alias in the platform.</p>
      </div>
      <div>
        {!text ? <p className="text-ink-2">Matches and your readiness score will appear here.</p> : (
          <div className="space-y-4">
            <div className="sheet rounded-lg p-4">
              <p className="label">Readiness for this posting</p>
              <p className="display text-4xl">{Math.round(score * 100)}%</p>
              <Bar value={score} label="Readiness" />
              <p className="mt-2 text-sm text-ink-2">{hits.length} concepts found. Mastered counts fully; reviewing 60%; learning 30%.</p>
              {hits.length > 0 && <button className="btn mt-3" onClick={() => hits.forEach((h) => addCard(h.c.id))}>Add all {hits.length} to my review deck</button>}
            </div>
            {roleFit.length > 0 && <p className="text-sm">Closest role paths: {roleFit.map((x, i) => <span key={x.r.id}>{i ? ', ' : ''}<Link className="underline" to={`/roles/${x.r.id}`}>{x.r.title}</Link></span>)}</p>}
            <div>{hits.map((h) => <ConceptRow key={h.c.id} c={h.c} />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const STRONG = ['Reduced', 'Increased', 'Cut', 'Designed', 'Built', 'Automated', 'Analyzed', 'Led', 'Implemented', 'Standardized', 'Optimized', 'Developed', 'Eliminated', 'Streamlined']

function Bullets() {
  const [verb, setVerb] = useState('Reduced')
  const [what, setWhat] = useState('changeover time on a packaging line')
  const [how, setHow] = useState('applying SMED and redesigning tool carts')
  const [result, setResult] = useState('from 45 to 18 minutes (60%), adding 6 hours of weekly capacity')
  const [check, setCheck] = useState('')
  const bullet = `${verb} ${what} by ${how}, ${result.replace(/^by\s+/, '')}.`
  const issues = check ? [
    { ok: /^[A-Z][a-z]+(ed|t|d)\b/.test(check.trim()), msg: 'Starts with a past-tense action verb.' },
    { ok: /\d/.test(check), msg: 'Has a number (%, $, time, count).' },
    { ok: check.split(/\s+/).length <= 30, msg: 'Fits on about two lines (≤ 30 words).' },
    { ok: !/\b(responsible for|helped|assisted|worked on)\b/i.test(check), msg: 'Avoids weak phrases (“responsible for”, “helped”, “worked on”).' },
    { ok: CONCEPTS.some((c) => new RegExp(`\\b${escapeRe(c.term)}\\b`, 'i').test(check)), msg: 'Names a recognizable method or tool (for ATS keyword matching).' },
  ] : []
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="sheet space-y-3 rounded-lg p-5">
        <p className="measure text-sm text-ink-2">Formula: <strong>Action verb + what + how (method/tool) + quantified result.</strong></p>
        <label className="block"><span className="label">Action verb</span><select className="input mt-1" value={verb} onChange={(e) => setVerb(e.target.value)}>{STRONG.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="block"><span className="label">What</span><input className="input mt-1" value={what} onChange={(e) => setWhat(e.target.value)} /></label>
        <label className="block"><span className="label">How (method, tool)</span><input className="input mt-1" value={how} onChange={(e) => setHow(e.target.value)} /></label>
        <label className="block"><span className="label">Result (with numbers)</span><input className="input mt-1" value={result} onChange={(e) => setResult(e.target.value)} /></label>
        <div className="rounded-md border-l-4 border-tape bg-paper/60 p-3">• {bullet}</div>
        <button className="btn-ghost btn" onClick={() => navigator.clipboard?.writeText(bullet)}>Copy bullet</button>
      </div>
      <div className="sheet space-y-3 rounded-lg p-5">
        <label className="block"><span className="label">Check one of your existing bullets</span>
          <textarea className="input mt-1" rows={4} value={check} onChange={(e) => setCheck(e.target.value)} placeholder="Paste a resume bullet" /></label>
        <ul className="space-y-1 text-sm">{issues.map((i) => <li key={i.msg} className={i.ok ? 'text-sgreen' : 'text-sred'}>{i.ok ? '✓' : '✗'} {i.msg}</li>)}</ul>
      </div>
    </div>
  )
}

export function Interview() {
  const [params, setParams] = useSearchParams()
  const all = useAllConcepts()
  const tab = (params.get('tab') as Tab) || (params.get('role') ? 'mock' : 'bank')
  return (
    <div>
      <PageHead title="Interview prep" sub="Technical, behavioral and case questions; a timed mock interview; tools for STAR stories, resumes and decoding job postings." />
      <div className="no-print mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}
            className={`rounded-md border px-3 py-1.5 text-sm ${tab === k ? 'border-ink bg-sheet font-semibold' : 'border-line text-ink-2 hover:border-ink'}`}>{l}</button>
        ))}
      </div>
      {tab === 'bank' && <LoadGate state={all} what="question bank">{(c) => <Bank concepts={c} />}</LoadGate>}
      {tab === 'mock' && <LoadGate state={all} what="question bank">{(c) => <Mock concepts={c} />}</LoadGate>}
      {tab === 'star' && <Star />}
      {tab === 'cases' && <Cases />}
      {tab === 'decoder' && <Decoder />}
      {tab === 'bullets' && <Bullets />}
    </div>
  )
}

export { DOMAIN_MAP }
