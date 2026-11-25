import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { ROLES } from '../content/roles'
import { HOTSPOTS, TOOLS, WASTES, type Cost, type Waste } from '../content/discovery'
import { statusOf, useStore, type Status } from '../lib/store'
import { Bar, PageHead } from '../components/ui'

/* ================= IE subway map ================= */
const LINE_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#0d9488', '#4f46e5', '#a16207', '#9333ea', '#64748b', '#b91c1c']
const colorOf = (roleId: string) => LINE_COLORS[ROLES.findIndex((r) => r.id === roleId) % LINE_COLORS.length]
const STATUS_TEXT: Record<Status, string> = { new: 'not started', learning: 'learning', reviewing: 'reviewing', mastered: 'mastered' }

export function Subway() {
  const [params, setParams] = useSearchParams()
  const path = useStore((s) => s.settings.path)
  const progress = useStore((s) => s.progress)
  const cards = useStore((s) => s.cards)
  const fallback = [...new Set([path, 'industrial-engineer', 'quality-engineer', 'supply-chain-analyst', 'or-analyst'].filter((x): x is string => !!x && ROLES.some((r) => r.id === x)))].slice(0, 4)
  const picked = (params.get('lines')?.split(',') || fallback).filter((id) => ROLES.some((r) => r.id === id))
  const lines = ROLES.filter((r) => picked.includes(r.id)).map((r) => ({ ...r, stops: r.concepts.filter((id) => CONCEPT_MAP[id]) }))
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    setParams(next.length ? { lines: next.join(',') } : { lines: '' }, { replace: true })
  }
  // Interchanges: stations served by two or more of the visible lines.
  const served = useMemo(() => {
    const m = new Map<string, string[]>()
    lines.forEach((l) => l.stops.forEach((id) => m.set(id, [...(m.get(id) || []), l.id])))
    return m
  }, [lines])
  const interchanges = [...served.entries()].filter(([, ls]) => ls.length > 1).sort((a, b) => b[1].length - a[1].length || CONCEPT_MAP[a[0]].term.localeCompare(CONCEPT_MAP[b[0]].term))
  const st = (id: string) => statusOf(progress[id], cards[id])

  return (
    <div>
      <PageHead title="IE subway map" sub="Each job is a line and each topic is a station. Where lines cross, one topic serves several careers: learn those interchanges first. Stations fill in as you learn." />
      <fieldset className="mb-5">
        <legend className="label mb-2">Lines on the map</legend>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button key={r.id} aria-pressed={picked.includes(r.id)} onClick={() => toggle(r.id)}
              className={`pop-btn !py-1.5 !text-sm ${picked.includes(r.id) ? '!border-ink' : '!font-normal opacity-80'}`}>
              <span aria-hidden className="inline-block h-2.5 w-5 rounded-full" style={{ background: picked.includes(r.id) ? colorOf(r.id) : 'transparent', border: `2px solid ${colorOf(r.id)}` }} />
              {r.title}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2" aria-label="Legend">
        <span className="flex items-center gap-2"><span aria-hidden className="stn" style={{ ['--ln' as string]: 'var(--color-ink-2)' }} /> Not started</span>
        <span className="flex items-center gap-2"><span aria-hidden className="stn stn-part" style={{ ['--ln' as string]: 'var(--color-ink-2)' }} /> Learning or reviewing</span>
        <span className="flex items-center gap-2"><span aria-hidden className="stn stn-done" style={{ ['--ln' as string]: 'var(--color-ink-2)' }}>✓</span> Mastered</span>
        <span className="flex items-center gap-2"><span aria-hidden className="stn stn-x" style={{ ['--ln' as string]: 'var(--color-ink)' }} /> Interchange: change here for another line</span>
      </div>

      {!lines.length && <p className="sheet rounded-lg p-5">Pick at least one line above to draw the map.</p>}
      <div className="space-y-6">
        {lines.map((l) => {
          const color = colorOf(l.id)
          const mastered = l.stops.filter((id) => st(id) === 'mastered').length
          const next = l.stops.find((id) => st(id) !== 'mastered')
          return (
            <section key={l.id} className="sheet rounded-lg p-4 sm:p-5" aria-labelledby={`line-${l.id}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`line-${l.id}`} className="flex items-center gap-2 text-xl font-extrabold"><span aria-hidden className="inline-block h-3 w-8 rounded-full" style={{ background: color }} />{l.title}</h2>
                  <p className="mt-1 text-sm text-ink-2">{mastered} of {l.stops.length} stations mastered{next ? <> · Next stop: <Link className="font-semibold text-ink underline" to={`/c/${next}`}>{CONCEPT_MAP[next].term}</Link></> : ' · Line complete'}</p>
                </div>
                <div className="w-48"><Bar value={l.stops.length ? mastered / l.stops.length : 0} color={color} label={`${l.title} progress`} /><Link className="mt-1 block text-right text-sm underline" to={`/roles/${l.id}`}>Role path</Link></div>
              </div>
              <div className="mt-3 overflow-x-auto pb-2" tabIndex={0} role="region" aria-label={`${l.title} line. Scroll sideways for more stations.`}>
                <ol className="relative flex min-w-max pt-2">
                  <span aria-hidden className="absolute left-12 right-12 top-[0.95rem] h-2 rounded-full" style={{ background: color }} />
                  {l.stops.map((id) => {
                    const s = st(id); const c = CONCEPT_MAP[id]
                    const others = (served.get(id) || []).filter((x) => x !== l.id)
                    const isNext = id === next
                    const label = `${c.term}, ${STATUS_TEXT[s]}${isNext ? ', next stop' : ''}${others.length ? `, change here for ${others.map((o) => ROLES.find((r) => r.id === o)!.title).join(' and ')}` : ''}`
                    return (
                      <li key={id} className="relative w-24 shrink-0 text-center">
                        <Link to={`/c/${id}`} aria-label={label} title={label} className="group flex flex-col items-center gap-1.5 rounded-md px-1 pb-1">
                          <span aria-hidden className={`stn ${others.length ? 'stn-x' : ''} ${s === 'mastered' ? 'stn-done' : s === 'new' ? '' : 'stn-part'} ${isNext ? 'stn-next' : ''}`} style={{ ['--ln' as string]: color }}>{s === 'mastered' ? '✓' : ''}</span>
                          <span className="text-xs leading-tight group-hover:underline">{c.term}</span>
                          {isNext && <span className="rounded bg-tape px-1 text-[0.7rem] font-bold text-[#172033]">Next stop</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </section>
          )
        })}
      </div>

      {interchanges.length > 0 && (
        <section className="mt-8" aria-labelledby="ix-h">
          <h2 id="ix-h" className="display text-2xl">Interchanges on this map</h2>
          <p className="measure mt-1 text-ink-2">These {interchanges.length} topics appear on more than one of the lines you picked. One lesson moves you forward on every line it serves.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {interchanges.map(([id, ls]) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-sheet px-3 py-2">
                <Link to={`/c/${id}`} className="font-semibold hover:text-sblue hover:underline">{CONCEPT_MAP[id].term}</Link>
                <span className="flex shrink-0 items-center gap-1" aria-label={`${ls.length} lines`}>
                  {ls.map((x) => <span key={x} title={ROLES.find((r) => r.id === x)!.title} className="inline-block h-2.5 w-5 rounded-full" style={{ background: colorOf(x) }} />)}
                  <span className="ml-1 text-xs text-ink-2">{ls.length} lines</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/* ================= Tool trading cards ================= */
const COSTS: Cost[] = ['Free and open source', 'Free version available', 'Commercial, free academic licence', 'Commercial']
const ROLE_LIST = [...new Set(TOOLS.flatMap((t) => t.roles))].sort()

function Curve({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Learning curve ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} aria-hidden className={`inline-block h-2.5 w-4 rounded-sm border border-ink ${i <= n ? 'bg-ink' : ''}`} />)}
    </span>
  )
}

export function Tools() {
  const [q, setQ] = useState('')
  const [cost, setCost] = useState<Cost | ''>('')
  const [role, setRole] = useState('')
  const [cmp, setCmp] = useState<string[]>([])
  const list = TOOLS.filter((t) => (!cost || t.cost === cost) && (!role || t.roles.includes(role) || t.roles.includes('Every IE role')) &&
    (!q || `${t.name} ${t.kind} ${t.bestAt} ${t.alt || ''}`.toLowerCase().includes(q.toLowerCase())))
  const toggle = (id: string) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]))
  const chosen = cmp.map((id) => TOOLS.find((t) => t.id === id)!)
  return (
    <div>
      <PageHead title="Tool cards" sub={`${TOOLS.length} tools IE job posts ask for: what each is best at, what it costs to learn, and which lessons here prepare you. Pick up to three to compare.`} />
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem_16rem]">
        <label><span className="label">Search</span><input className="input mt-1" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “simulation” or “dashboards”" /></label>
        <label><span className="label">Cost</span>
          <select className="input mt-1" value={cost} onChange={(e) => setCost(e.target.value as Cost | '')}><option value="">Any cost</option>{COSTS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span className="label">Role</span>
          <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Any role</option>{ROLE_LIST.filter((r) => r !== 'Every IE role').map((r) => <option key={r}>{r}</option>)}</select>
        </label>
      </div>

      {chosen.length >= 2 && (
        <section className="sheet mb-6 overflow-x-auto rounded-lg p-4" aria-labelledby="cmp-h">
          <div className="flex items-center justify-between gap-3"><h2 id="cmp-h" className="text-lg font-extrabold">Comparing {chosen.map((t) => t.name).join(', ')}</h2><button className="btn-ghost btn !py-1.5" onClick={() => setCmp([])}>Clear</button></div>
          <table className="mt-3 w-full min-w-[36rem] text-sm">
            <thead><tr className="text-left"><th scope="col" className="w-36 py-1 text-xs text-ink-2">&nbsp;</th>{chosen.map((t) => <th key={t.id} scope="col" className="py-1 text-base">{t.name}</th>)}</tr></thead>
            <tbody>
              {([['Type', (t) => t.kind], ['Cost', (t) => <>{t.cost}<br /><span className="text-ink-2">{t.costNote}</span></>], ['Learning curve', (t) => <Curve n={t.curve} />], ['Best at', (t) => t.bestAt], ['Roles', (t) => t.roles.join(', ')], ['Alternatives', (t) => t.alt || '–']] as [string, (t: (typeof TOOLS)[number]) => React.ReactNode][]).map(([h, f]) => (
                <tr key={h} className="border-t border-line align-top"><th scope="row" className="py-2 text-left text-xs text-ink-2">{h}</th>{chosen.map((t) => <td key={t.id} className="py-2 pr-3">{f(t)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="mb-3 text-sm text-ink-2" aria-live="polite">{list.length} of {TOOLS.length} tools{cmp.length === 1 ? ' · pick one or two more to compare' : ''}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((t) => (
          <article key={t.id} className={`sheet tool-card flex flex-col rounded-lg ${cmp.includes(t.id) ? 'ring-2 ring-sblue' : ''}`}>
            <header className="tool-band flex items-start justify-between gap-2 rounded-t-lg px-4 pb-2 pt-3">
              <div><h2 className="text-xl font-extrabold">{t.name}</h2><p className="text-sm">{t.kind}</p></div>
              <span className="rounded border border-ink/40 px-1.5 py-0.5 text-xs font-semibold">{t.cost}</span>
            </header>
            <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
              <p className="text-sm text-ink-2">{t.costNote}</p>
              <p className="mt-3"><strong>Best at:</strong> {t.bestAt}</p>
              <p className="mt-2 flex items-center gap-2 text-sm"><span className="font-semibold">Learning curve</span><Curve n={t.curve} /></p>
              <p className="mt-2 text-sm"><span className="font-semibold">Roles:</span> {t.roles.join(', ')}</p>
              {t.alt && <p className="mt-1 text-sm"><span className="font-semibold">Alternatives:</span> {t.alt}</p>}
              <p className="label mb-1 mt-3">Learn it here</p>
              <div className="flex flex-wrap gap-1.5">{t.lessons.filter((id) => CONCEPT_MAP[id]).map((id) => <Link key={id} to={`/c/${id}`} className="chip hover:border-ink hover:text-ink">{CONCEPT_MAP[id].term}</Link>)}</div>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <button className={`pop-btn !py-1.5 ${cmp.includes(t.id) ? '!border-sblue !text-sblue' : ''}`} aria-pressed={cmp.includes(t.id)} onClick={() => toggle(t.id)} disabled={!cmp.includes(t.id) && cmp.length >= 3}>{cmp.includes(t.id) ? 'Comparing' : 'Compare'}</button>
                <a className="text-sm underline" href={t.site} target="_blank" rel="noopener noreferrer">Official site<span className="sr-only"> for {t.name} (opens in a new tab)</span></a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!list.length && <p className="sheet rounded-lg p-5">No tool matches those filters. Clear the search or pick “Any cost”.</p>}
      <p className="mt-5 text-sm text-ink-2">The learning-curve rating is our estimate for a new IE graduate, not a measured figure. Prices and licence terms change; check the vendor’s site before you rely on them.</p>
    </div>
  )
}

/* ================= Spot the waste ================= */
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function SpotWaste() {
  const [found, setFound] = useState<Record<string, true>>({})
  const [active, setActive] = useState<string | null>(null)
  const [wrong, setWrong] = useState<Record<string, Waste[]>>({})
  const [hints, setHints] = useState(false)
  const [start, setStart] = useState<number | null>(null)
  const [end, setEnd] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const logMistake = useStore((s) => s.logMistake)
  const total = HOTSPOTS.length
  const nFound = Object.keys(found).length
  const misses = Object.values(wrong).reduce((t, w) => t + w.length, 0)
  const h = HOTSPOTS.find((x) => x.id === active)
  useEffect(() => {
    if (start === null || end !== null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [start, end])
  const secs = start === null ? 0 : Math.round(((end ?? now) - start) / 1000)
  const open = (id: string) => { setActive(id); if (start === null) { setStart(Date.now()); setNow(Date.now()) } }
  const answer = (w: Waste) => {
    if (!h || found[h.id] || (wrong[h.id] || []).includes(w)) return
    if (w === h.waste) {
      const next = { ...found, [h.id]: true as const }
      setFound(next)
      if (Object.keys(next).length === total) setEnd(Date.now())
    } else {
      setWrong((x) => ({ ...x, [h.id]: [...(x[h.id] || []), w] }))
      logMistake({ concept: 'lean.eight-wastes', prompt: `Spot the waste: which waste is the “${h.label}”?`, given: w, correct: h.waste, explain: h.why })
    }
  }
  const reset = () => { setFound({}); setWrong({}); setActive(null); setStart(null); setEnd(null) }
  const done = nFound === total

  return (
    <div>
      <PageHead title="Spot the waste" sub="This cell hides one example of each of the eight wastes (TIMWOODS). Click or tab to anything that looks wrong, then name the waste." />
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="text-lg font-bold" aria-live="polite">{nFound} of {total} found</p>
        <p className="tabular-nums text-ink-2"><span className="sr-only">Time </span>{mmss(secs)}</p>
        <p className="text-ink-2">{misses} wrong {misses === 1 ? 'guess' : 'guesses'}</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Show where to look</label>
        <button className="btn-ghost btn !py-1.5" onClick={reset}>Start over</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="sheet relative overflow-hidden rounded-lg" style={{ aspectRatio: '1000 / 560' }}>
          <FactoryScene />
          <p className="sr-only">A drawing of a small production cell with eight spots to inspect. Each spot below is a button; its description says what is there.</p>
          {HOTSPOTS.map((x, i) => (
            <button key={x.id} onClick={() => open(x.id)} aria-pressed={active === x.id}
              aria-label={`${x.label}${found[x.id] ? `: ${x.waste}, found` : ''}`}
              aria-describedby={`seen-${x.id}`}
              className={`spot ${found[x.id] ? 'spot-found' : ''} ${hints ? 'spot-hint' : ''} ${active === x.id ? 'spot-active' : ''}`}
              style={{ left: `${x.x}%`, top: `${x.y}%` }}>
              {found[x.id] ? <span aria-hidden>✓</span> : hints ? <span aria-hidden>{i + 1}</span> : null}
            </button>
          ))}
          {HOTSPOTS.map((x) => <span key={x.id} id={`seen-${x.id}`} className="sr-only">{x.seen}</span>)}
        </div>

        <aside className="space-y-4" aria-live="polite">
          {done ? (
            <section className="sheet rounded-lg p-5">
              <h2 className="text-2xl font-extrabold">All {total} wastes found</h2>
              <p className="mt-2">Time {mmss(secs)}, with {misses} wrong {misses === 1 ? 'guess' : 'guesses'}. {misses ? 'Your misses are in the error notebook.' : 'A clean sweep.'}</p>
              <p className="mt-2 text-ink-2">On a real floor, walk the gemba with this list in hand: most cells show several of these at once.</p>
              <div className="mt-4 flex flex-wrap gap-2"><button className="btn" onClick={reset}>Play again</button><Link className="btn-ghost btn" to="/c/lean.eight-wastes">The eight wastes lesson</Link></div>
            </section>
          ) : h ? (
            <section className="sheet rounded-lg p-5">
              <p className="label">You picked</p>
              <h2 className="text-xl font-extrabold">{h.label}</h2>
              <p className="mt-2"><span className="font-semibold">What you see:</span> {h.seen}</p>
              {found[h.id] ? (
                <p className="mt-3"><strong className="text-sgreen">{h.waste}.</strong> {h.why}</p>
              ) : (
                <>
                  <p className="mt-2">Which waste is this?</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {WASTES.map((w) => {
                      const bad = (wrong[h.id] || []).includes(w)
                      return <button key={w} disabled={bad} onClick={() => answer(w)} className={`rounded-md border px-2 py-2 text-left text-sm answer ${bad ? 'border-sred bg-sred/10 line-through' : 'border-line hover:border-sblue'}`}>{w}</button>
                    })}
                  </div>
                  {(wrong[h.id] || []).length > 0 && <p className="mt-3 text-sm"><strong className="text-sorange">Not that one.</strong> Look again: what is being spent here that the customer doesn’t pay for?</p>}
                </>
              )}
            </section>
          ) : (
            <section className="sheet rounded-lg p-5"><p>Pick something in the scene that looks wrong. The timer starts with your first pick.</p></section>
          )}
          <section className="sheet rounded-lg p-4" aria-label="Wastes found">
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              {WASTES.map((w) => { const got = HOTSPOTS.some((x) => x.waste === w && found[x.id]); return <li key={w} className={got ? 'font-semibold' : 'text-ink-2'}><span aria-hidden>{got ? '✓ ' : '○ '}</span>{w}<span className="sr-only">{got ? ', found' : ', not found yet'}</span></li> })}
            </ul>
          </section>
        </aside>
      </div>
      <p className="mt-4 text-sm text-ink-2">An illustrated, made-up cell for practice. Each example is a typical case of its waste; on a real floor one problem often shows more than one.</p>
    </div>
  )
}

/** A hand-drawn cell. Decorative: every interactive spot is a labelled button laid over it. */
function FactoryScene() {
  const ink = 'var(--color-ink)', line = 'var(--color-line)', soft = 'var(--color-ink-2)'
  return (
    <svg viewBox="0 0 1000 560" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="1000" height="60" fill="var(--color-paper)" />
      <line x1="0" y1="60" x2="1000" y2="60" stroke={line} strokeWidth="3" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 125} y1="60" x2={i * 125} y2="560" stroke={line} strokeWidth="1" opacity=".5" />)}
      {[180, 300, 420].map((y) => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke={line} strokeWidth="1" opacity=".5" />)}
      <text x="24" y="40" fontSize="20" fontWeight="800" fill={ink}>Cell 4 · Housing line</text>
      {/* Forklift route: a long loop across the floor */}
      <path d="M90 520 H 940 V 470 H 260" fill="none" stroke="var(--color-tape)" strokeWidth="6" strokeDasharray="18 12" />
      {/* Polishing station with three coats */}
      <rect x="80" y="135" width="150" height="70" rx="6" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      {[115, 155, 195].map((x, i) => <g key={x}><circle cx={x} cy="162" r="14" fill="none" stroke={ink} strokeWidth="3" /><text x={x} y="192" textAnchor="middle" fontSize="12" fill={soft}>coat {i + 1}</text></g>)}
      <text x="155" y="125" textAnchor="middle" fontSize="14" fontWeight="700" fill={ink}>Polish</text>
      {/* Crates piled between stations */}
      {[[320, 210], [362, 210], [404, 210], [341, 168], [383, 168], [362, 126]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="40" height="40" fill="var(--color-tape)" opacity=".55" stroke={ink} strokeWidth="2.5" /><line x1={x} y1={y} x2={x + 40} y2={y + 40} stroke={ink} strokeWidth="1.5" /></g>)}
      {/* Machine with an automatic cycle */}
      <rect x="455" y="130" width="120" height="140" rx="8" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <rect x="475" y="150" width="80" height="34" rx="4" fill="var(--color-sblue)" opacity=".25" stroke={ink} strokeWidth="2" />
      <text x="515" y="173" textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>AUTO</text>
      <circle cx="515" cy="225" r="22" fill="none" stroke={ink} strokeWidth="3" />
      {/* Operator standing and watching */}
      <circle cx="612" cy="160" r="15" fill="none" stroke={ink} strokeWidth="3" />
      <path d="M612 175 V 230 M612 190 L 596 212 M612 190 L 628 212 M612 230 L 598 262 M612 230 L 626 262" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Tool cabinet across the cell, with the walking path */}
      <path d="M630 250 C 720 250, 820 210, 870 170" fill="none" stroke={soft} strokeWidth="3" strokeDasharray="4 8" strokeLinecap="round" />
      <rect x="845" y="68" width="70" height="95" rx="4" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <line x1="880" y1="68" x2="880" y2="163" stroke={ink} strokeWidth="2" />
      <text x="880" y="183" textAnchor="middle" fontSize="12" fill={soft}>tools</text>
      {/* Production board */}
      <rect x="785" y="318" width="135" height="82" rx="4" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <text x="852" y="345" textAnchor="middle" fontSize="13" fontWeight="700" fill={ink}>Today</text>
      <text x="852" y="366" textAnchor="middle" fontSize="13" fill={ink}>Ordered 20</text>
      <text x="852" y="386" textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>Built 60</text>
      {/* Rework bench */}
      <rect x="440" y="430" width="145" height="40" rx="4" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <text x="512" y="422" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--color-sred)">REWORK</text>
      {[465, 500, 535, 562].map((x) => <g key={x}><rect x={x - 11} y="438" width="22" height="22" fill="none" stroke={ink} strokeWidth="2" /><path d={`M${x - 7} 442 L ${x + 7} 456 M${x + 7} 442 L ${x - 7} 456`} stroke="var(--color-sred)" strokeWidth="2.5" /></g>)}
      {/* Locked suggestion box */}
      <line x1="660" y1="410" x2="660" y2="462" stroke={ink} strokeWidth="3" />
      <rect x="632" y="372" width="56" height="40" rx="4" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <rect x="648" y="380" width="24" height="4" fill={ink} />
      <text x="660" y="404" textAnchor="middle" fontSize="11" fill={soft}>ideas</text>
      <path d="M690 380 a7 7 0 0 1 14 0 v4 M686 384 h22 v14 h-22 z" fill="none" stroke={ink} strokeWidth="2.5" />
      {/* Forklift */}
      <rect x="120" y="430" width="78" height="45" rx="6" fill="var(--color-sblue)" opacity=".35" stroke={ink} strokeWidth="3" />
      <path d="M198 400 V 480 M198 480 H 232" stroke={ink} strokeWidth="4" fill="none" />
      <circle cx="138" cy="482" r="11" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <circle cx="182" cy="482" r="11" fill="var(--color-sheet)" stroke={ink} strokeWidth="3" />
      <rect x="208" y="452" width="26" height="24" fill="var(--color-tape)" opacity=".55" stroke={ink} strokeWidth="2" />
    </svg>
  )
}
