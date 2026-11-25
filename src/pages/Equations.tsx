import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { EQUATION_MAP, EQUATIONS, RESPONSES, evaluate, excelFormula, responseTo, type Equation, type EqOutput, type Response, type Vals } from '../content/equations'
import { PageHead, Tex } from '../components/ui'

const fmt = (o: EqOutput, y: number) => {
  const v = y * (o.scale ?? 1)
  return v.toLocaleString('en-US', { minimumFractionDigits: o.digits, maximumFractionDigits: o.digits })
}
const unitText = (o: EqOutput) => (o.unit === '%' ? '%' : o.unit ? ` ${o.unit}` : '')
/** Lower-case a name for use mid-sentence, but keep acronyms such as OEE or NPV. */
const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)
function useNarrow() {
  const q = '(max-width: 639px)'
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const m = window.matchMedia(q); const f = () => setN(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return n
}
const showNum = (x: number) => (Number.isInteger(x) ? x.toLocaleString('en-US') : x.toLocaleString('en-US', { maximumFractionDigits: 4 }))

/** Equation Explorer strip for the formula library. */
export function EquationStrip() {
  return (
    <section className="no-print mb-6" aria-labelledby="eqx-h">
      <h2 id="eqx-h" className="text-lg font-extrabold">Equation Explorer</h2>
      <p className="mt-1 text-sm text-ink-2">Change the inputs and watch the answer, the units and a sensitivity chart respond. Each experiment links back to its lesson.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {EQUATIONS.map((e) => (
          <li key={e.id}><Link to={`/formulas/${e.id}`} className="sheet block h-full rounded-lg px-4 py-3 hover:border-sblue"><span className="font-bold">{e.title}</span><span className="mt-0.5 block text-sm text-ink-2">{e.blurb}</span></Link></li>
        ))}
      </ul>
    </section>
  )
}

export function EquationPage() {
  const { id = '' } = useParams()
  const eq = EQUATION_MAP[id]
  if (!eq) return <div><h1 className="display text-3xl">No such experiment</h1><p className="mt-2">That equation isn’t in the explorer. <Link className="underline" to="/formulas">Open the formula library</Link>.</p></div>
  return <Explorer key={eq.id} eq={eq} />
}

function Explorer({ eq }: { eq: Equation }) {
  const [params, setParams] = useSearchParams()
  const defaults = Object.fromEntries(eq.inputs.map((i) => [i.key, i.value])) as Vals
  const v: Vals = { ...defaults }
  eq.inputs.forEach((i) => { const p = params.get(i.key); if (p !== null && p !== '' && Number.isFinite(Number(p))) v[i.key] = Number(p) })
  const set = (next: Vals) => setParams(Object.fromEntries(eq.inputs.map((i) => [i.key, String(next[i.key])])), { replace: true })
  const r = evaluate(eq, v)
  const c = CONCEPT_MAP[eq.concept]
  const [sweep, setSweep] = useState(eq.sweep)

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-2"><Link className="underline" to="/formulas">Formula library</Link> › Equation Explorer</nav>
      <PageHead title={eq.title} sub={eq.blurb}>
        <p className="mt-2 text-sm">From the lesson <Link className="font-semibold underline" to={`/c/${c.id}`}>{c.term}</Link>{eq.related?.length ? <> · related: {eq.related.map((id, n) => <span key={id}>{n ? ', ' : ''}<Link className="underline" to={`/c/${id}`}>{CONCEPT_MAP[id].term}</Link></span>)}</> : null}</p>
      </PageHead>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="eq-inputs">
          <div className="overflow-x-auto rounded-md border border-line bg-paper/50 px-3 py-1"><Tex tex={eq.tex} block /></div>
          <h2 id="eq-inputs" className="label mb-2 mt-4">Inputs</h2>
          <div className="space-y-3">
            {eq.inputs.map((i) => {
              const id = `in-${eq.id}-${i.key}`
              const out = v[i.key] < i.min || v[i.key] > i.max
              return (
                <div key={i.key} className="grid grid-cols-[auto_minmax(0,1fr)_7.5rem] items-center gap-x-3 gap-y-1">
                  <span className="min-w-10 text-center text-lg" aria-hidden><Tex tex={i.tex} /></span>
                  <label htmlFor={id} className="text-sm leading-tight"><span className="font-semibold">{i.name}</span><span className="block text-ink-2">{i.unit}</span></label>
                  <input id={id} className="input !py-1.5 tabular-nums" type="number" inputMode="decimal" step={i.step} value={Number.isFinite(v[i.key]) ? v[i.key] : ''}
                    onChange={(e) => set({ ...v, [i.key]: e.target.value === '' ? NaN : Number(e.target.value) })} />
                  <span />
                  <input type="range" className="col-span-2" min={i.min} max={i.max} step={i.step} value={Math.min(i.max, Math.max(i.min, Number.isFinite(v[i.key]) ? v[i.key] : i.min))}
                    aria-label={`${i.name} slider`} onChange={(e) => set({ ...v, [i.key]: Number(e.target.value) })} />
                  {out && <p className="col-span-3 text-xs text-sorange">Outside the slider range ({showNum(i.min)}–{showNum(i.max)} {i.unit}); the formula still applies if its assumptions do.</p>}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {eq.fixtures.map((f, n) => (
              <button key={n} className="pop-btn !py-1.5 !text-sm" onClick={() => set({ ...v, ...f.inputs })} title={f.source}>Load reference case{eq.fixtures.length > 1 ? ` ${n + 1}` : ''}</button>
            ))}
            <button className="pop-btn !py-1.5 !text-sm" onClick={() => setParams({}, { replace: true })}>Reset</button>
          </div>
          <ul className="mt-2 space-y-0.5 text-xs text-ink-2">{eq.fixtures.map((f, n) => <li key={n}>Reference case{eq.fixtures.length > 1 ? ` ${n + 1}` : ''}: {f.source}. Checked by the test suite.</li>)}</ul>
        </section>

        <div className="space-y-5">
          <section className="sheet rounded-lg p-4 sm:p-5" aria-live="polite" aria-labelledby="eq-result">
            <h2 id="eq-result" className="label">{eq.output.name}</h2>
            {r.ok ? (
              <>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3"><span className="text-lg"><Tex tex={eq.output.tex + '='} /></span><span className="display text-4xl tabular-nums">{fmt(eq.output, r.y)}</span><span className="text-lg text-ink-2">{eq.output.unit === '%' ? '%' : eq.output.unit}</span></p>
                <p className="mt-2">{eq.explain(v, r.y)}</p>
                {r.warn && <p className="mt-2 border-l-4 border-sorange pl-3 text-sm">{r.warn}</p>}
                {eq.extras?.length ? (
                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    {eq.extras.map((x, n) => (
                      <div key={x.name} className="rounded-md border border-line px-3 py-2">
                        <dt className="text-xs text-ink-2">{x.name}</dt>
                        <dd className="text-lg font-bold tabular-nums">{Number.isFinite(r.extras[n]) ? `${fmt(x, r.extras[n])}${unitText(x)}` : '–'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </>
            ) : (
              <p className="mt-2 border-l-4 border-sred pl-3"><strong>No result.</strong> {r.error}</p>
            )}
            <p className="mt-4 text-sm text-ink-2"><span className="font-semibold text-ink">Units check:</span> {eq.dims}</p>
          </section>
          <Sensitivity eq={eq} v={v} sweep={sweep} setSweep={setSweep} />
        </div>
      </div>

      {eq.predict && <Predict key={eq.id} eq={eq} v={v} />}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="sheet rounded-lg p-4 sm:p-5"><h2 className="label mb-2">Assumptions and limits</h2><ul className="list-disc space-y-1 pl-5 text-[0.95rem]">{eq.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></section>
        <section className="sheet rounded-lg p-4 sm:p-5"><h2 className="label mb-2">Common traps</h2><ul className="list-disc space-y-1 pl-5 text-[0.95rem]">{eq.traps.map((a) => <li key={a}>{a}</li>)}</ul></section>
        <section className="sheet rounded-lg p-4 sm:p-5">
          <h2 className="label mb-2">In a spreadsheet</h2>
          <p className="text-sm text-ink-2">Put the inputs in B1–B{eq.inputs.length} ({eq.inputs.map((i) => i.name.toLowerCase()).join(', ')}), then:</p>
          <pre className="mt-1 overflow-x-auto rounded-md border border-line bg-paper/50 p-2 text-sm" tabIndex={0} aria-label="Spreadsheet formula"><code>{excelFormula(eq)}</code></pre>
          <h2 className="label mb-2 mt-4">In Python</h2>
          <pre className="overflow-x-auto rounded-md border border-line bg-paper/50 p-2 text-sm" tabIndex={0} aria-label="Python code"><code>{eq.inputs.map((i) => `${i.py} = ${showNum(v[i.key]).replace(/,/g, '')}`).join('\n')}{'\n'}{eq.python}</code></pre>
        </section>
      </div>
    </div>
  )
}

function Sensitivity({ eq, v, sweep, setSweep }: { eq: Equation; v: Vals; sweep: string; setSweep: (k: string) => void }) {
  const narrow = useNarrow()
  const inp = eq.inputs.find((i) => i.key === sweep) || eq.inputs[0]
  const data = useMemo(() => {
    const N = inp.integer ? Math.min(60, inp.max - inp.min) : 80
    const pts: { x: number; y: number | null }[] = []
    for (let s = 0; s <= N; s++) {
      const x = inp.integer ? Math.round(inp.min + ((inp.max - inp.min) * s) / N) : inp.min + ((inp.max - inp.min) * s) / N
      const r = evaluate(eq, { ...v, [inp.key]: x })
      pts.push({ x, y: r.ok ? r.y * (eq.output.scale ?? 1) : null })
    }
    return pts
  }, [eq, v, inp])
  const ys = data.map((d) => d.y).filter((y): y is number => y !== null).sort((a, b) => a - b)
  const cur = evaluate(eq, v)
  const curY = cur.ok ? cur.y * (eq.output.scale ?? 1) : null
  if (!ys.length) return <section className="sheet rounded-lg p-4 text-sm">No valid points to plot for {lc(inp.name)} with the other inputs as they are.</section>
  const q90 = ys[Math.floor(0.9 * (ys.length - 1))]
  let hi = Math.max(ys[ys.length - 1], curY ?? -Infinity), lo = Math.min(ys[0], curY ?? Infinity, 0)
  const clipped = hi > Math.abs(q90) * 3 + 1e-9 && q90 > 0
  if (clipped) hi = Math.max(q90 * 3, curY ?? 0)
  if (hi === lo) { hi += 1; lo -= lo === 0 ? 0 : 1 }
  const W = narrow ? 360 : 620, H = 250, L = narrow ? 52 : 64, B = 34, T = 12, R = 14
  const fs = narrow ? 12 : 11
  const X = (x: number) => L + ((x - inp.min) / (inp.max - inp.min || 1)) * (W - L - R)
  const Y = (y: number) => T + (1 - (Math.min(y, hi) - lo) / (hi - lo)) * (H - T - B)
  const segs: string[] = []
  let d = ''
  data.forEach((p) => { if (p.y === null) { if (d) segs.push(d); d = '' } else d += `${d ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}` })
  if (d) segs.push(d)
  const yt = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4)
  const xt = (narrow ? [0, 2, 4] : [0, 1, 2, 3, 4]).map((k) => inp.min + ((inp.max - inp.min) * k) / 4)
  const f = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('en-US') : +n.toPrecision(3))
  const gaps = data.some((p) => p.y === null)
  const sample = data.filter((_, n) => n % Math.ceil(data.length / 8) === 0)
  return (
    <section className="sheet rounded-lg p-4 sm:p-5" aria-labelledby="eq-sens">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="eq-sens" className="label">How {lc(eq.output.name)} responds</h2>
        <label className="text-sm">Vary <select className="input ml-1 inline-block w-auto !py-1" value={inp.key} onChange={(e) => setSweep(e.target.value)}>{eq.inputs.map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}</select></label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`${eq.output.name} against ${lc(inp.name)} from ${showNum(inp.min)} to ${showNum(inp.max)} ${inp.unit}, other inputs held at their current values.${gaps ? ' The line breaks where the formula is invalid.' : ''}`}>
        {yt.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="var(--color-grid)" /><text x={L - 6} y={Y(t) + 4} textAnchor="end" fontSize={fs} fill="var(--color-ink-2)">{f(t)}</text></g>)}
        {xt.map((t, n) => <text key={t} x={X(t)} y={H - B + 16} textAnchor={n === 0 ? 'start' : n === xt.length - 1 ? 'end' : 'middle'} fontSize={fs} fill="var(--color-ink-2)">{f(t)}</text>)}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--color-line)" />
        <text x={(W + L) / 2} y={H - 3} textAnchor="middle" fontSize={fs} fill="var(--color-ink-2)">{inp.name} ({inp.unit})</text>
        {segs.map((s, n) => <path key={n} d={s} fill="none" stroke="var(--color-sblue)" strokeWidth="2.5" />)}
        {curY !== null && v[inp.key] >= inp.min && v[inp.key] <= inp.max && <circle cx={X(v[inp.key])} cy={Y(curY)} r="6" fill="var(--color-tape)" stroke="var(--color-ink)" strokeWidth="2" />}
      </svg>
      <p className="mt-1 text-xs text-ink-2">Vertical axis: {lc(eq.output.name)}{eq.output.unit ? ` (${eq.output.unit})` : ''}. The dot is your current input.{clipped ? ` Values above ${f(hi)} are cut off at the top.` : ''}{gaps ? ' Gaps are where the formula is invalid.' : ''}</p>
      <details className="mt-2 text-sm"><summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full max-w-sm tabular-nums"><thead><tr className="text-left text-xs text-ink-2"><th scope="col">{inp.name}</th><th scope="col" className="text-right">{eq.output.name}</th></tr></thead>
          <tbody>{sample.map((p) => <tr key={p.x} className="border-t border-line"><td className="py-1">{showNum(+p.x.toPrecision(6))}</td><td className="text-right">{p.y === null ? 'invalid' : p.y.toLocaleString('en-US', { maximumFractionDigits: eq.output.digits })}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  )
}

function Predict({ eq, v }: { eq: Equation; v: Vals }) {
  const key = eq.predict!
  const inp = eq.inputs.find((i) => i.key === key)!
  const factor = responseTo(eq, v, key, 2) ? 2 : responseTo(eq, v, key, 0.5) ? 0.5 : null
  const [ask, setAsk] = useState<{ v: Vals; factor: number; pick: Response } | null>(null)
  if (!factor && !ask) return null
  const shown = ask ?? { v, factor: factor!, pick: null }
  const actual = responseTo(eq, shown.v, key, shown.factor)
  const before = evaluate(eq, shown.v), after = evaluate(eq, { ...shown.v, [key]: shown.v[key] * shown.factor })
  const options = actual === 'changes sign' ? [...RESPONSES, 'changes sign' as Response] : RESPONSES
  return (
    <section className="mt-5 border-l-4 border-tape bg-tape/10 px-4 py-3" aria-live="polite">
      <p><strong>Predict first:</strong> with the other inputs as they are, if {lc(inp.name)} {shown.factor === 2 ? 'doubles' : 'halves'} (from {showNum(shown.v[key])} to {showNum(shown.v[key] * shown.factor)} {inp.unit}), what happens to {lc(eq.output.name)}?</p>
      {!ask ? (
        <div className="mt-2 flex flex-wrap gap-2">{options.map((o) => <button key={o} className="pop-btn !py-1.5" onClick={() => setAsk({ v: { ...v }, factor: factor!, pick: o })}>It {o}</button>)}</div>
      ) : (
        <div className="mt-2">
          <p><strong className={ask.pick === actual ? 'text-sgreen' : 'text-sorange'}>{ask.pick === actual ? 'Right.' : `Not quite: it ${actual}.`}</strong>{' '}
            {before.ok && after.ok && <>It goes from {fmt(eq.output, before.y)}{unitText(eq.output)} to {fmt(eq.output, after.y)}{unitText(eq.output)}.</>}</p>
          {eq.insight && <p className="mt-1">{eq.insight}</p>}
          <button className="btn-ghost btn mt-2 !py-1.5" onClick={() => setAsk(null)}>Ask again with the current inputs</button>
        </div>
      )}
    </section>
  )
}
