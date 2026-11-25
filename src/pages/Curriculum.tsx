import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DOMAIN_MAP } from '../content/domains'
import { ROLES } from '../content/roles'
import { SIM_META } from '../sims/registry'
import { EXTRA_SIM } from '../content/visuals'
import { coverage, type AreaCoverage } from '../lib/coverage'
import { PageHead } from '../components/ui'

const LEVEL_STYLE: Record<AreaCoverage['level'], string> = {
  None: 'var(--color-sred)', Low: 'var(--color-sred)', Partial: 'var(--color-sorange)', Good: 'var(--color-sblue)', Strong: 'var(--color-sgreen)',
}
const LEVELS: AreaCoverage['level'][] = ['None', 'Low', 'Partial', 'Good', 'Strong']

function simsFor(a: AreaCoverage) {
  const ids = new Set(a.covered.map((x) => x.concept.id))
  return SIM_META.filter((s) => s.concepts.some((c) => ids.has(c)) || [...ids].some((id) => EXTRA_SIM[id] === s.id))
}
function rolesFor(a: AreaCoverage) {
  const ids = new Set(a.covered.map((x) => x.concept.id))
  return ROLES.filter((r) => r.concepts.some((c) => ids.has(c)))
}

export function Curriculum() {
  const all = useMemo(coverage, [])
  const [level, setLevel] = useState<'all' | AreaCoverage['level']>('all')
  const [q, setQ] = useState('')
  const total = all.reduce((n, a) => n + a.area.topics.length, 0)
  const done = all.reduce((n, a) => n + a.covered.length, 0)
  const rows = all.filter((a) => (level === 'all' || a.level === level) && (!q || `${a.area.name} ${a.area.topics.join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <div>
      <PageHead title="Curriculum coverage" sub={<>The V2 blueprint has {all.length} knowledge areas and {total} required topics. {done} of them ({Math.round((100 * done) / total)}%) already have a lesson. Open an area to see which topics are covered, which are missing, and the simulators and career paths that use it.</>} />

      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Find an area or topic</span>
          <input className="input !w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Kanban, PID, MACRS" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Coverage level</span>
          <select className="input !w-40" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
            <option value="all">All levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <p className="text-sm text-ink-2" aria-live="polite">{rows.length} of {all.length} areas shown</p>
      </div>

      <div className="space-y-2">
        {rows.map((a) => {
          const sims = simsFor(a)
          const roles = rolesFor(a)
          return (
            <details key={a.area.id} className="sheet group rounded-lg">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-8 shrink-0 font-semibold text-ink-2">{a.area.code}</span>
                <span className="min-w-0 flex-1 font-semibold">{a.area.name}</span>
                <span className="flex w-56 items-center gap-2 text-sm">
                  <span className="h-2 flex-1 overflow-hidden rounded bg-line" aria-hidden>
                    <span className="block h-full rounded" style={{ width: `${a.pct}%`, background: LEVEL_STYLE[a.level] }} />
                  </span>
                  <span className="w-16 text-right tabular-nums">{a.covered.length}/{a.area.topics.length}</span>
                </span>
                <span className="chip w-20 justify-center" style={{ borderColor: LEVEL_STYLE[a.level], color: LEVEL_STYLE[a.level] }}>{a.level}</span>
              </summary>
              <div className="grid gap-5 border-t border-line px-4 py-4 md:grid-cols-2">
                <div>
                  <h3 className="label mb-2">Covered ({a.covered.length})</h3>
                  {a.covered.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {a.covered.map(({ topic, concept }) => (
                        <li key={topic}><Link className="chip hover:border-sblue hover:text-sblue" to={`/c/${concept.id}`} title={`Lesson: ${concept.term}`}>{topic}</Link></li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-ink-2">No lessons yet in this area.</p>}
                  <h3 className="label mb-2 mt-4">Missing ({a.missing.length})</h3>
                  {a.missing.length ? (
                    <ul className="flex flex-wrap gap-1.5">{a.missing.map((m) => <li key={m} className="chip border-dashed text-ink-2">{m}</li>)}</ul>
                  ) : <p className="text-sm text-sgreen">Every required topic has a lesson.</p>}
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="label mb-1">Where the lessons live</h3>
                    <p>{a.area.domains.length ? a.area.domains.map((d) => <Link key={d} className="mr-2 underline" to={`/d/${d}`}>{DOMAIN_MAP[d].name}</Link>) : 'Planned new domain'}</p>
                  </div>
                  <div>
                    <h3 className="label mb-1">Simulators ({sims.length})</h3>
                    <p>{sims.length ? sims.map((s) => <Link key={s.id} className="mr-2 underline" to={`/lab/${s.id}`}>{s.name}</Link>) : 'None yet'}</p>
                  </div>
                  <div>
                    <h3 className="label mb-1">Career paths that use it ({roles.length})</h3>
                    <p>{roles.length ? roles.map((r) => <Link key={r.id} className="mr-2 underline" to={`/roles/${r.id}`}>{r.title}</Link>) : 'None yet'}</p>
                  </div>
                </div>
              </div>
            </details>
          )
        })}
        {!rows.length && <p className="text-ink-2">No areas match. Clear the search or choose another level.</p>}
      </div>
      <p className="mt-6 text-xs text-ink-2">Coverage means a lesson exists for the topic, not that the lesson is complete or reviewed. Topic lists follow the V2 curriculum blueprint; lesson review status is shown on each lesson.</p>
    </div>
  )
}
