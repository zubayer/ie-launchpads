import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTS } from '../content'
import { DOMAINS, DOMAIN_MAP } from '../content/domains'
import { SIM_META } from '../sims/registry'
import { EXTRA_SIM } from '../content/visuals'
import { useStore } from '../lib/store'
import { PageHead, Tex } from '../components/ui'
import type { Concept } from '../types'

const simOf = (c: Concept) => SIM_META.find((s) => s.id === (c.sim || EXTRA_SIM[c.id])) || SIM_META.find((s) => s.concepts.includes(c.id))

/** Every concept with a formula, in domain order. */
export const FORMULAS = CONCEPTS.filter((c) => c.formula)

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ')

export function Formulas() {
  const [q, setQ] = useState('')
  const [dom, setDom] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const pinned = useStore((s) => s.pinnedFormulas)
  const togglePin = useStore((s) => s.togglePinnedFormula)
  const domains = useMemo(() => DOMAINS.filter((d) => FORMULAS.some((c) => c.domain === d.id)), [])
  const list = useMemo(() => {
    const words = norm(q).split(' ').filter(Boolean)
    return FORMULAS.filter((c) => {
      if (dom && c.domain !== dom) return false
      if (pinnedOnly && !pinned.includes(c.id)) return false
      if (!words.length) return true
      const hay = norm([c.term, c.full, c.sub, DOMAIN_MAP[c.domain].name, c.one, ...(c.aka || []), ...(c.formula!.vars || []).map((v) => v[1])].join(' '))
      return words.every((w) => hay.includes(w))
    })
  }, [q, dom, pinnedOnly, pinned])

  return (
    <div>
      <PageHead title="Formula library" sub={`${FORMULAS.length} formulas from the lessons, each with its variables, assumptions, a worked example and a calculator where one exists. Pin the ones you need and print them as your own formula sheet.`} />
      <div className="no-print sheet mb-6 grid gap-3 rounded-lg p-4 sm:grid-cols-[1fr_14rem_auto_auto] sm:items-end">
        <label className="block"><span className="label">Search</span><input className="input mt-1" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “capability”, “inventory” or “demand”…" /></label>
        <label className="block"><span className="label">Domain</span>
          <select className="input mt-1" value={dom} onChange={(e) => setDom(e.target.value)}>
            <option value="">All domains</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} /> My sheet only ({pinned.length})</label>
        <button className="btn-ghost btn" onClick={() => window.print()}>Print this list</button>
      </div>
      <p className="mb-3 text-sm text-ink-2" aria-live="polite">{list.length} of {FORMULAS.length} formulas</p>
      {list.length === 0 && (
        <p className="sheet rounded-lg p-6 text-ink-2">{pinnedOnly && !pinned.length ? 'Your sheet is empty. Use “Pin to my sheet” on any formula to add it.' : 'No formula matches. Try a broader word, or clear the domain filter.'}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((c) => {
          const f = c.formula!
          const sim = simOf(c)
          const on = pinned.includes(c.id)
          return (
            <article key={c.id} className="sheet break-inside-avoid rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-ink-2"><span className="inline-block h-2 w-4 rounded-sm" style={{ background: DOMAIN_MAP[c.domain].tape }} />{DOMAIN_MAP[c.domain].name} · {c.sub}</p>
                  <h2 className="mt-1 text-lg font-semibold"><Link to={`/c/${c.id}`} className="hover:text-sblue hover:underline">{c.term}</Link></h2>
                </div>
                <button className={`no-print pop-btn shrink-0 ${on ? '!border-sblue !text-sblue' : ''}`} aria-pressed={on} onClick={() => togglePin(c.id)}>{on ? 'On my sheet' : 'Pin to my sheet'}</button>
              </div>
              <div className="mt-3 overflow-x-auto rounded-md border border-line bg-paper/50 px-3 py-1"><Tex tex={f.tex} block /></div>
              {f.vars?.length ? (
                <dl className="mt-3 grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  {f.vars.map(([sym, m]) => <div key={sym} className="contents"><dt className="font-semibold"><Tex tex={sym} /></dt><dd className="text-ink-2">{m}</dd></div>)}
                </dl>
              ) : null}
              <p className="mt-3 text-sm">{c.one}</p>
              {c.assumptions?.length ? (
                <div className="mt-3 text-sm"><p className="label">Assumptions and limits</p><ul className="mt-1 list-disc space-y-0.5 pl-5">{c.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>
              ) : null}
              {c.example && (
                <details className="mt-3 rounded-md border border-line px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-semibold">Worked example{c.example.check ? ' (answer checked by the test suite)' : ''}</summary>
                  <p className="mt-2">{c.example.q}</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">{c.example.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  <p className="mt-2 font-semibold">{c.example.a}</p>
                </details>
              )}
              <p className="no-print mt-3 flex flex-wrap gap-2 text-sm">
                <Link className="pop-btn" to={`/c/${c.id}`}>Open the lesson</Link>
                {sim && <Link className="pop-btn !border-tape" to={`/lab/${sim.id}`}>Calculator: {sim.name}</Link>}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
