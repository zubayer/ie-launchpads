import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPTS, bySub, byDomain } from '../content'
import { DOMAINS, DOMAIN_MAP, GROUPS } from '../content/domains'
import { ROLES } from '../content/roles'
import { SIM_META } from '../sims/registry'
import { LEVEL_NAME, type DomainId, type Level } from '../types'
import { statusOf, useStore } from '../lib/store'
import { Bar, ConceptRow, PageHead, Rich, Section, Tex } from '../components/ui'
import { WebAnswer } from '../components/Layout'

export function Directory() {
  const [q, setQ] = useState('')
  const [dom, setDom] = useState<DomainId | ''>('')
  const [lvl, setLvl] = useState<Level | 0>(0)
  const [status, setStatus] = useState('')
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return CONCEPTS.filter(
      (c) =>
        (!dom || c.domain === dom) &&
        (!lvl || c.level === lvl) &&
        (!status || statusOf(progress[c.id], cards[c.id]) === status) &&
        (!ql || [c.term, c.full, c.one, ...(c.aka || [])].join(' ').toLowerCase().includes(ql)),
    ).sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
  }, [q, dom, lvl, status, progress, cards])
  const letters = useMemo(() => {
    const m = new Map<string, typeof list>()
    list.forEach((c) => {
      const L = /[a-z]/i.test(c.term[0]) ? c.term[0].toUpperCase() : '#'
      m.set(L, [...(m.get(L) || []), c])
    })
    return [...m.entries()]
  }, [list])

  return (
    <div>
      <PageHead title="A–Z directory" sub="Every keyword, acronym and method in the platform. Filter by domain, level or your own status." />
      <div className="sheet mb-4 grid gap-3 rounded-lg p-4 sm:grid-cols-4">
        <input className="input sm:col-span-4" placeholder="Filter by word or acronym" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter" />
        <select className="input" value={dom} onChange={(e) => setDom(e.target.value as DomainId)} aria-label="Domain">
          <option value="">All domains</option>
          {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input" value={lvl} onChange={(e) => setLvl(Number(e.target.value) as Level)} aria-label="Level">
          <option value={0}>All levels</option>
          {([1, 2, 3, 4] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_NAME[l]}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="new">New</option><option value="learning">Learning</option>
          <option value="reviewing">Reviewing</option><option value="mastered">Mastered</option>
        </select>
        <p className="self-center text-sm text-ink-2">{list.length} terms</p>
      </div>
      <nav className="no-print mb-4 flex flex-wrap gap-1" aria-label="Jump to letter">
        {letters.map(([L]) => <a key={L} href={`#L-${L}`} className="rounded border border-line px-2 py-0.5 text-sm hover:border-ink">{L}</a>)}
      </nav>
      {!list.length && q.trim().length > 1 && (
        <div className="sheet rounded-lg p-5">
          <p className="mb-3">No card matches “{q}” yet. Here is what the web says:</p>
          <WebAnswer query={q.trim()} />
        </div>
      )}
      {letters.map(([L, items]) => (
        <section key={L} id={`L-${L}`} className="mb-6 scroll-mt-16">
          <h2 className="display mb-1 text-2xl">{L}</h2>
          {items.map((c) => <ConceptRow key={c.id} c={c} />)}
        </section>
      ))}
    </div>
  )
}

function useDomainProgress(id: DomainId) {
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const list = byDomain(id)
  const mastered = list.filter((c) => statusOf(progress[c.id], cards[c.id]) === 'mastered').length
  const opened = list.filter((c) => progress[c.id]?.opened).length
  return { total: list.length, mastered, opened }
}

function DomainLine({ id }: { id: DomainId }) {
  const d = DOMAIN_MAP[id]
  const p = useDomainProgress(id)
  return (
    <Link to={`/d/${id}`} className="group grid grid-cols-[0.5rem_1fr] gap-4 border-b border-line py-4 hover:bg-sblue/5">
      <span className="rounded-sm" style={{ background: d.tape }} />
      <span>
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="wide text-lg group-hover:underline">{d.name}</span>
          <span className="text-sm text-ink-2">{p.opened}/{p.total} opened · {p.mastered} mastered</span>
        </span>
        <span className="measure block text-[0.95rem] text-ink-2">{d.blurb}</span>
        <span className="mt-2 block max-w-md"><Bar value={p.total ? p.opened / p.total : 0} color={d.tape} label={`${d.name} progress`} /></span>
      </span>
    </Link>
  )
}

export function Domains() {
  return (
    <div>
      <PageHead title="Domains" sub="Coursework and the job, organized the way IE teams are: core methods, manufacturing and tech, analytics, management, people and places." />
      {GROUPS.map((g) => (
        <Section key={g} title={g}>
          {DOMAINS.filter((d) => d.group === g).map((d) => <DomainLine key={d.id} id={d.id} />)}
        </Section>
      ))}
    </div>
  )
}

export function DomainPage() {
  const { id = '' } = useParams()
  const d = DOMAIN_MAP[id as DomainId]
  if (!d) return <p>Domain not found. <Link className="underline" to="/domains">All domains</Link></p>
  const groups = bySub(d.id)
  const sims = SIM_META.filter((s) => s.domain === d.id)
  const roles = ROLES.filter((r) => r.concepts.some((c) => c.startsWith(d.id + '.') || byDomain(d.id).some((x) => x.id === c)))
  return (
    <div>
      <PageHead title={d.name} sub={d.blurb} tape={d.tape}>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <Link className="btn" to={`/practice?d=${d.id}`}>Quiz this domain</Link>
          <Link className="btn-ghost btn" to={`/review?d=${d.id}`}>Flashcards for this domain</Link>
          <Link className="btn-ghost btn" to={`/d/${d.id}/cheatsheet`}>Printable cheat sheet</Link>
        </div>
      </PageHead>
      <div className="grid gap-8 lg:grid-cols-[1fr_17rem]">
        <div>
          {groups.map((g) => (
            <Section key={g.sub} title={g.sub}>
              {g.items.map((c) => <ConceptRow key={c.id} c={c} showDomain={false} />)}
            </Section>
          ))}
        </div>
        <aside className="space-y-6">
          {sims.length > 0 && (
            <div className="sheet rounded-lg p-4">
              <h2 className="wide mb-2">Simulators</h2>
              <ul className="space-y-1.5">{sims.map((s) => <li key={s.id}><Link className="hover:underline" to={`/lab/${s.id}`}>{s.name}</Link></li>)}</ul>
            </div>
          )}
          {roles.length > 0 && (
            <div className="sheet rounded-lg p-4">
              <h2 className="wide mb-2">Roles that use this</h2>
              <ul className="space-y-1.5">{roles.map((r) => <li key={r.id}><Link className="hover:underline" to={`/roles/${r.id}`}>{r.title}</Link></li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export function CheatSheet() {
  const { id = '' } = useParams()
  const d = DOMAIN_MAP[id as DomainId]
  if (!d) return <p>Domain not found.</p>
  const groups = bySub(d.id)
  return (
    <div className="sheet rounded-lg p-6 print:p-0">
      <div className="no-print mb-4 flex gap-2">
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
        <Link className="btn-ghost btn" to={`/d/${d.id}`}>Back to {d.short}</Link>
      </div>
      <h1 className="display text-3xl">{d.name} — cheat sheet</h1>
      <div className="mt-4 columns-1 gap-8 text-[0.9rem] md:columns-2">
        {groups.map((g) => (
          <section key={g.sub} className="mb-4 break-inside-avoid">
            <h2 className="wide mb-1 border-b border-line text-base">{g.sub}</h2>
            {g.items.map((c) => (
              <div key={c.id} className="mb-2 break-inside-avoid">
                <strong>{c.term}</strong>{c.full && c.full !== c.term ? ` (${c.full})` : ''}: <Rich text={c.one} />
                {c.formula && <div className="my-1"><Tex tex={c.formula.tex} /></div>}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
