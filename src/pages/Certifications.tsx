import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import {
  CERTS, CERT_MAP, DEMAND_LABEL, EXPERIENCE_LABEL, FAMILY_LABEL, JOB_SNAPSHOT, OTHER_CERTS,
  coverage, demand, rankNext, type Cert, type DemandKey, type Eligible, type Experience, type Family,
} from '../content/certs'
import { statusOf, useStore, type Status } from '../lib/store'
import { PageHead } from '../components/ui'

// Inline colours: the .chip class sets its own border and text colour, which would win over utility classes.
const tone = (v: string) => ({ color: `var(--color-${v})`, borderColor: `var(--color-${v})` })
const ELIGIBLE: Record<Eligible, { label: string; style: { color: string; borderColor: string } }> = {
  yes: { label: 'Can sit it as a student', style: tone('sgreen') },
  check: { label: 'Depends: check the rule', style: tone('sorange') },
  no: { label: 'Needs work experience', style: tone('ink-2') },
}
const STATUS_DOT: Record<Status, string> = { new: 'bg-line', learning: 'bg-sorange', reviewing: 'bg-sblue', mastered: 'bg-sgreen' }
const STATUS_LABEL: Record<Status, string> = { new: 'not opened', learning: 'learning', reviewing: 'reviewing', mastered: 'mastered' }
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

function useLessonStatus() {
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  return (id: string): Status => statusOf(progress[id], cards[id])
}

function Readiness({ cert }: { cert: Cert }) {
  const status = useLessonStatus()
  const { lessons } = coverage(cert)
  const s = lessons.map(status)
  const opened = s.filter((x) => x !== 'new').length
  const mastered = s.filter((x) => x === 'mastered').length
  return <span>You’ve opened {opened} of {lessons.length} mapped lessons{mastered ? `, mastered ${mastered}` : ''}</span>
}

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <span className="block">
      <span className="sr-only">{label}</span>
      <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-grid"><span className="block h-full rounded-full bg-sblue" style={{ width: `${pct}%` }} /></span>
    </span>
  )
}

/* ---------- Hub ---------- */

export function Certifications() {
  const [family, setFamily] = useState<Family | ''>('')
  const [exp, setExp] = useState<Experience>('none')
  const [held, setHeld] = useState<string[]>([])
  const picks = useMemo(() => rankNext({ family: family || undefined, exp, held, coverage: (c) => coverage(c).pct }), [family, exp, held])
  const tally = useMemo(() => {
    const keys = Object.keys(DEMAND_LABEL) as DemandKey[]
    return keys.map((k) => ({ k, ...demand([k]) })).filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits)
  }, [])
  const none = JOB_SNAPSHOT.postings.filter((p) => p.names.length === 0).length

  return (
    <div>
      <PageHead title="Certifications" sub="Which industrial engineering certifications employers name, who can sit each one, what the official syllabus covers, and the lessons here that teach it. Every fact links to the page it came from; fees are on the official pages, because they change." />

      <section className="sheet rounded-lg p-5" aria-labelledby="next-h">
        <h2 id="next-h" className="wide text-xl">Which certification next?</h2>
        <p className="mt-1 text-sm text-ink-2">Ranked by: can you sit it now, then how often our sample of job postings names it, then how much of its syllabus we teach. Your answers stay on this page and aren’t saved.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block"><span className="label">Jobs you’re aiming for</span>
            <select className="input mt-1" value={family} onChange={(e) => setFamily(e.target.value as Family | '')}>
              <option value="">Any industrial engineering job</option>
              {(Object.keys(FAMILY_LABEL) as Family[]).map((f) => <option key={f} value={f}>{FAMILY_LABEL[f]}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Full-time work experience</span>
            <select className="input mt-1" value={exp} onChange={(e) => setExp(e.target.value as Experience)}>
              {(Object.keys(EXPERIENCE_LABEL) as Experience[]).map((x) => <option key={x} value={x}>{EXPERIENCE_LABEL[x]}</option>)}
            </select>
          </label>
          <fieldset><legend className="label">I already hold</legend>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {CERTS.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={held.includes(c.id)} onChange={(e) => setHeld((h) => e.target.checked ? [...h, c.id] : h.filter((x) => x !== c.id))} />
                  {c.short}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          {picks.map((p, i) => (
            <li key={p.cert.id} className={`rounded-lg border p-4 ${i === 0 ? 'border-sblue' : 'border-line'}`}>
              <div className="flex items-start justify-between gap-2">
                <Link to={`/certifications/${p.cert.id}`} className="font-bold hover:text-sblue hover:underline"><span className="text-ink-2">{i + 1}.</span> {p.cert.name}</Link>
                <span className="chip shrink-0" style={ELIGIBLE[p.eligible].style}>{p.eligible === 'yes' ? 'Can sit now' : p.eligible === 'check' ? 'Check' : 'Not yet'}</span>
              </div>
              <p className="text-sm text-ink-2">{p.cert.body.split(' (')[0]} · {p.cert.field}</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">{p.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </li>
          ))}
        </ol>
        {!picks.length && <p className="mt-4 text-sm text-ink-2">You hold all six. See the other certifications below.</p>}
      </section>

      <section className="mt-10" aria-labelledby="all-h">
        <h2 id="all-h" className="wide text-xl">Six certifications, mapped to lessons</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CERTS.map((c) => {
            const v = coverage(c)
            return (
              <li key={c.id}>
                <Link to={`/certifications/${c.id}`} className="sheet flex h-full flex-col gap-2 rounded-lg p-4 hover:border-sblue">
                  <span className="flex items-start justify-between gap-2"><span className="font-bold">{c.name}</span><span className="chip shrink-0" style={ELIGIBLE[c.student].style}>{ELIGIBLE[c.student].label}</span></span>
                  <span className="text-sm text-ink-2">{c.body} · {c.field} · {c.level}</span>
                  <span className="mt-auto text-sm">We teach {v.covered} of {v.total} syllabus headings</span>
                  <Bar pct={v.pct} label={`${v.pct}% of headings taught`} />
                  <span className="text-xs text-ink-2"><Readiness cert={c} /></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="jobs-h">
        <h2 id="jobs-h" className="wide text-xl">What 16 real job postings asked for</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-2">
          US full-time postings read in full on {fmt(JOB_SNAPSHOT.read)}: industrial, quality, continuous-improvement, manufacturing, operations and planning roles.
          A small sample, and three of the four searches included a certification or method name, so it leans towards postings that mention one.
          {' '}{none} of 16 named no certification at all, yet almost every one asked for the skills: Lean, DMAIC, SPC and capability, FMEA, time studies.
        </p>
        <div className="sheet mt-4 overflow-x-auto rounded-lg">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Credentials named in 16 job postings</caption>
            <thead><tr className="border-b border-line"><th scope="col" className="px-4 py-2">Credential named</th><th scope="col" className="px-4 py-2">Postings</th><th scope="col" className="px-4 py-2">Where</th></tr></thead>
            <tbody>
              {tally.map((x) => (
                <tr key={x.k} className="border-b border-line/60 align-top">
                  <td className="px-4 py-2 font-semibold">{DEMAND_LABEL[x.k]}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{x.hits} of {x.of}</td>
                  <td className="px-4 py-2 text-ink-2">{JOB_SNAPSHOT.postings.filter((p) => p.names.includes(x.k)).map((p) => `${p.company} (${p.title})`).join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">All 16 postings, with what each said</summary>
          <ul className="mt-2 space-y-1">
            {JOB_SNAPSHOT.postings.map((p) => (
              <li key={p.url}><a className="underline" href={p.url} target="_blank" rel="noopener">{p.title}, {p.company}</a> <span className="text-ink-2">· posted {fmt(p.posted)} · {FAMILY_LABEL[p.family]} · {p.names.length ? p.names.map((k) => DEMAND_LABEL[k]).join(', ') : 'no certification named'}{p.how ? ` · ${p.how}` : ''}</span></li>
            ))}
          </ul>
        </details>
      </section>

      <section className="mt-10" aria-labelledby="more-h">
        <h2 id="more-h" className="wide text-xl">Other certifications to know</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {OTHER_CERTS.map((o) => (
            <li key={o.name} className="sheet rounded-lg p-4 text-sm">
              <a className="font-bold hover:text-sblue hover:underline" href={o.url} target="_blank" rel="noopener">{o.name} ↗</a>
              <span className="block text-ink-2">{o.body}</span>
              <span className="mt-1 block">{o.note}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-8 text-xs text-ink-2">Facts read on the official pages on {fmt(CERTS[0].asOf)}. Rules and syllabi change: check the linked page before you register.</p>
    </div>
  )
}

/* ---------- One certification ---------- */

export function CertificationPage() {
  const { id = '' } = useParams()
  const cert = CERT_MAP[id]
  const status = useLessonStatus()
  if (!cert) return (
    <div><PageHead title="Certification not found" /><p>There is no certification with this address. <Link className="underline" to="/certifications">See all certifications</Link>.</p></div>
  )
  const v = coverage(cert)
  const todo = v.lessons.filter((l) => status(l) === 'new' && CONCEPT_MAP[l]).slice(0, 6)
  const jobs = JOB_SNAPSHOT.postings.filter((p) => p.names.some((k) => cert.demandKeys.includes(k)))
  return (
    <div>
      <p className="mb-2 text-sm"><Link className="text-ink-2 hover:text-ink" to="/certifications">← All certifications</Link></p>
      <PageHead title={cert.name} sub={`${cert.body} · ${cert.field} · ${cert.level}`} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="sheet rounded-lg p-5" aria-labelledby="facts-h">
          <h2 id="facts-h" className="wide text-lg">The facts</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
            {cert.facts.map((f) => (
              <div key={f.label} className="contents">
                <dt className="font-semibold">{f.label}</dt>
                <dd>{f.value} <a className="text-sblue underline" href={f.src} target="_blank" rel="noopener">Source</a></dd>
              </div>
            ))}
            <dt className="font-semibold">As a student?</dt>
            <dd><span className="chip mr-2" style={ELIGIBLE[cert.student].style}>{ELIGIBLE[cert.student].label}</span>{cert.studentWhy}</dd>
            <dt className="font-semibold">Fees</dt>
            <dd>On the official page, because they change.</dd>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="btn" href={cert.url} target="_blank" rel="noopener">Official page ↗</a>
            <a className="btn btn-ghost" href={cert.outline.url} target="_blank" rel="noopener">Syllabus source ↗</a>
          </div>
          <p className="mt-3 text-xs text-ink-2">Read on {fmt(cert.asOf)}. Syllabus: {cert.outline.label} ({cert.outline.version}).</p>
        </section>
        <aside className="space-y-4">
          <section className="sheet rounded-lg p-5 text-sm" aria-labelledby="cov-h">
            <h2 id="cov-h" className="font-bold">Coverage here</h2>
            <p className="mt-1">We teach {v.covered} of {v.total} syllabus headings with {v.lessons.length} lessons.</p>
            <div className="mt-2"><Bar pct={v.pct} label={`${v.pct}% of headings taught`} /></div>
            <p className="mt-2 text-ink-2"><Readiness cert={cert} /></p>
          </section>
          {todo.length > 0 && (
            <section className="sheet rounded-lg p-5 text-sm" aria-labelledby="todo-h">
              <h2 id="todo-h" className="font-bold">Start here</h2>
              <p className="text-ink-2">Lessons on this syllabus you haven’t opened, in syllabus order.</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">{todo.map((l) => <li key={l}><Link className="hover:text-sblue hover:underline" to={`/c/${l}`}>{CONCEPT_MAP[l].term}</Link></li>)}</ol>
            </section>
          )}
        </aside>
      </div>

      {cert.outline.kind === 'partner' && (
        <p className="mt-6 rounded-lg border-l-4 border-sorange bg-sorange/5 px-4 py-3 text-sm">{cert.outline.label} Check them against your own course materials.</p>
      )}

      <section className="mt-8" aria-labelledby="syl-h">
        <h2 id="syl-h" className="wide text-xl">Syllabus, heading by heading</h2>
        <p className="mt-1 text-sm text-ink-2">Official headings only; the full text is on the {cert.outline.kind === 'official' ? 'official' : 'source'} page. Each heading links to the lessons here that teach it. Dots: grey not opened, orange learning, blue reviewing, green mastered.</p>
        <div className="mt-4 space-y-4">
          {cert.sections.map((s) => (
            <section key={s.code} className="sheet rounded-lg p-4" aria-label={`${s.code}. ${s.title}`}>
              <h3 className="flex flex-wrap items-baseline justify-between gap-2 font-bold"><span>{cert.sections.length > 1 ? `${s.code}. ` : ''}{s.title}</span>{s.weight && <span className="text-sm font-normal text-ink-2">{s.weight}</span>}</h3>
              <ul className="mt-2 divide-y divide-line/60">
                {s.topics.map((tp) => (
                  <li key={tp.code} className="grid gap-1 py-2 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-4">
                    <span className="text-sm font-semibold">{tp.code}. {tp.title}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {tp.lessons.length ? tp.lessons.filter((l) => CONCEPT_MAP[l]).map((l) => {
                        const st = status(l)
                        return (
                          <Link key={l} to={`/c/${l}`} className="chip hover:border-sblue hover:text-sblue">
                            <span aria-hidden className={`h-2 w-2 rounded-full ${STATUS_DOT[st]}`} />{CONCEPT_MAP[l].term}<span className="sr-only"> ({STATUS_LABEL[st]})</span>
                          </Link>
                        )
                      }) : <span className="chip border-dashed">Not taught here yet</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="cj-h">
        <h2 id="cj-h" className="wide text-xl">In the job postings we read</h2>
        {jobs.length ? (
          <ul className="mt-2 space-y-1 text-sm">{jobs.map((p) => <li key={p.url}><a className="underline" href={p.url} target="_blank" rel="noopener">{p.title}, {p.company}</a>{p.how ? <span className="text-ink-2"> · {p.how}</span> : null}</li>)}</ul>
        ) : <p className="mt-2 text-sm text-ink-2">None of the 16 postings named it by name.</p>}
        <p className="mt-2 text-xs text-ink-2">Sample of 16 postings read on {fmt(JOB_SNAPSHOT.read)}; see <Link className="underline" to="/certifications">the certifications page</Link> for how it was drawn.</p>
      </section>
    </div>
  )
}
