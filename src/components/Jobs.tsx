import { Link } from 'react-router-dom'
import type { Concept } from '../types'
import { TITLE_PATH, jobLinks, jobsFor, skillJobLinks } from '../content/jobs'
import { useStore } from '../lib/store'
import type { ConceptIndex } from '../content/assemble'

/** Compact chips for the top of a concept page. */
export function RoleChips({ c }: { c: ConceptIndex }) {
  const { paths, titles } = jobsFor(c)
  const names = [...paths.map((p) => p.role.title), ...titles.filter((t) => !paths.some((p) => TITLE_PATH[t] === p.role.id))].slice(0, 5)
  return (
    <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="text-ink-2">Needed for:</span>
      {names.map((n) => <span key={n} className="chip">{n}</span>)}
      <a href="#jobs" onClick={(e) => { e.preventDefault(); document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-sm font-semibold text-sblue hover:underline">See jobs</a>
    </p>
  )
}

export function JobsBlock({ c }: { c: ConceptIndex }) {
  const { paths, titles } = jobsFor(c)
  const where = useStore((s) => s.settings.jobLocation || '')
  const setSettings = useStore((s) => s.setSettings)
  const skill = skillJobLinks(c.term, where)
  return (
    <div>
      {paths.length > 0 && (
        <>
          <p className="label mb-2">Core skill in these career paths</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map(({ role, step, of }) => (
              <div key={role.id} className="rounded-lg border border-line p-3">
                <Link to={`/roles/${role.id}`} className="font-semibold text-sblue hover:underline">{role.title}</Link>
                <p className="mt-0.5 text-sm text-ink-2">{role.summary}</p>
                <p className="mt-1.5 text-xs text-ink-2">Step {step} of {of} in this path · tools: {role.tools.slice(0, 3).join(', ')}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className={`label mb-2 ${paths.length ? 'mt-5' : ''}`}>Job titles that ask for {c.term}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {titles.map((t) => {
          const L = jobLinks(t, where)
          const path = TITLE_PATH[t]
          return (
            <li key={t} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
              <span className="min-w-0 font-medium">{path ? <Link to={`/roles/${path}`} className="text-sblue hover:underline" title="Open the guided path for this role">{t}</Link> : t}</span>
              <span className="no-print flex shrink-0 gap-1">
                <a className="pop-btn" href={L.indeed} target="_blank" rel="noopener noreferrer">Indeed ↗</a>
                <a className="pop-btn" href={L.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="no-print mt-5 rounded-lg border border-sblue/30 bg-sblue/5 p-4">
        <p className="font-semibold">See live postings that mention “{c.term.replace(/\s*\(.*?\)\s*/g, ' ').trim()}”</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input className="input !w-56" value={where} onChange={(e) => setSettings({ jobLocation: e.target.value })} placeholder="Location (optional) e.g. Texas, Remote" aria-label="Job location" />
          <a className="ext-btn" href={skill.indeed} target="_blank" rel="noopener noreferrer">Indeed ↗</a>
          <a className="ext-btn" href={skill.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          <a className="ext-btn" href={skill.google} target="_blank" rel="noopener noreferrer">Google Jobs ↗</a>
        </div>
        <p className="mt-2 text-xs text-ink-2">Read three postings and copy the exact phrases they use for this skill into your résumé bullets.{c.used?.freq ? ` How often it appears: ${c.used.freq}.` : ''}</p>
      </div>
    </div>
  )
}
