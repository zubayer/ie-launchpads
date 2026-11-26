import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  OP_NAME, SCAN_MS, inputImage, isOutput, lint, parseProgram, prescan, scan, tagsOf,
  type Device, type Ins, type Node, type Phys, type Program, type Rung, type RungTrace, type StepResult, type Tags,
} from '../lib/ladder'

// ---------- Static diagram ----------
const ROW = 52, WIRE = 28, CELL = 84, BOX = 128, BOXH = 100, PAD = 10, GUTTER = 34, TAIL = 18
const BOXES = new Set(['TON', 'TOF', 'RTO', 'CTU', 'CTD', 'RES', 'MOV', 'ADD', 'SUB', 'GRT', 'GEQ', 'LES', 'LEQ', 'EQU', 'NEQ'])
type Size = { w: number; h: number }
const sizeOf = (n: Node): Size => {
  if (n.kind === 'ins') return BOXES.has(n.op) ? { w: BOX, h: BOXH } : { w: CELL, h: ROW }
  const legs = n.legs.map(seriesSize)
  return { w: Math.max(...legs.map((l) => l.w)) + 2 * PAD, h: legs.reduce((a, l) => a + l.h, 0) }
}
const seriesSize = (ns: Node[]): Size => ns.reduce((a, n) => { const s = sizeOf(n); return { w: a.w + s.w, h: Math.max(a.h, s.h) } }, { w: 0, h: ROW })
const tailIsOutput = (r: Rung) => { const l = r.nodes[r.nodes.length - 1]; return l.kind === 'ins' ? isOutput(l.op) : l.legs.every((g) => g.length === 1 && g[0].kind === 'ins' && isOutput(g[0].op)) }
export const rungWidth = (r: Rung) => GUTTER + seriesSize(r.nodes).w + TAIL + 16

const ON = 'var(--color-sgreen)', OFF = 'var(--color-ink-2)', INK = 'var(--color-ink)'
const short = (s: string, n = 13) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const fmt = (v: number | undefined) => (v === undefined ? '0' : Number.isInteger(v) ? String(v) : v.toFixed(1))

function Wire({ x1, x2, y, on }: { x1: number; x2: number; y: number; on: boolean }) {
  return x2 > x1 ? <line x1={x1} x2={x2} y1={y} y2={y} stroke={on ? ON : OFF} strokeWidth={on ? 3.5 : 2} /> : null
}

function Instr({ n, x, y, tags, tr }: { n: Ins; x: number; y: number; tags: Tags; tr?: RungTrace }) {
  const rin = !!tr?.[n.id]?.rin, rout = !!tr?.[n.id]?.rout
  const wy = y + WIRE
  const a = n.args[0]
  const bit = (tags[a] ?? 0) !== 0
  const title = `${n.op}(${n.args.join(', ')}): ${OP_NAME[n.op]}`
  if (BOXES.has(n.op)) {
    const lines = boxLines(n, tags)
    const done = ['TON', 'TOF', 'RTO', 'CTU', 'CTD'].includes(n.op) && (tags[`${a}.DN`] ?? 0) !== 0
    return (
      <g>
        <title>{title}</title>
        <Wire x1={x} x2={x + 10} y={wy} on={rin} />
        <rect x={x + 10} y={y + 8} width={BOX - 20} height={BOXH - 16} rx={3} fill="var(--color-sheet)" stroke={rin ? ON : INK} strokeWidth={rin ? 2.5 : 1.5} />
        <text x={x + 18} y={y + 24} fontSize={12} fontWeight={700} fill={INK}>{n.op}</text>
        {done && <text x={x + BOX - 16} y={y + 24} fontSize={11} fontWeight={700} textAnchor="end" fill={ON}>DN</text>}
        {lines.map((l, i) => <text key={i} x={x + 18} y={y + 42 + i * 15} fontSize={11} fill={INK} className="font-mono">{short(l, 15)}</text>)}
        <Wire x1={x + BOX - 10} x2={x + BOX} y={wy} on={rout} />
      </g>
    )
  }
  // Highlight only in an online view (with a trace); a static drawing shows no state.
  const lit = !tr ? false : n.op === 'XIC' ? bit : n.op === 'XIO' ? !bit : n.op === 'ONS' ? rout : rin
  const cx = x + CELL / 2
  return (
    <g>
      <title>{title}</title>
      <text x={cx} y={y + 11} fontSize={11} textAnchor="middle" fill={INK} className="font-mono">{short(a)}</text>
      <Wire x1={x} x2={cx - 11} y={wy} on={rin} />
      <Wire x1={cx + 11} x2={x + CELL} y={wy} on={rout} />
      {isOutput(n.op) ? (
        <>
          <path d={`M${cx - 7} ${wy - 11} Q${cx - 13} ${wy} ${cx - 7} ${wy + 11}`} fill="none" stroke={lit ? ON : INK} strokeWidth={2.5} />
          <path d={`M${cx + 7} ${wy - 11} Q${cx + 13} ${wy} ${cx + 7} ${wy + 11}`} fill="none" stroke={lit ? ON : INK} strokeWidth={2.5} />
          {bit && <circle cx={cx} cy={wy} r={5} fill={ON} />}
          {n.op !== 'OTE' && <text x={cx} y={wy + 4} fontSize={10} fontWeight={700} textAnchor="middle" fill={INK}>{n.op === 'OTL' ? 'L' : 'U'}</text>}
        </>
      ) : (
        <>
          {lit && <rect x={cx - 10} y={wy - 12} width={20} height={24} fill={ON} opacity={0.3} />}
          <line x1={cx - 9} x2={cx - 9} y1={wy - 12} y2={wy + 12} stroke={INK} strokeWidth={2.5} />
          <line x1={cx + 9} x2={cx + 9} y1={wy - 12} y2={wy + 12} stroke={INK} strokeWidth={2.5} />
          {n.op === 'XIO' && <line x1={cx - 11} x2={cx + 11} y1={wy + 12} y2={wy - 12} stroke={INK} strokeWidth={2} />}
          {n.op === 'ONS' && <text x={cx} y={wy + 24} fontSize={9} fontWeight={700} textAnchor="middle" fill={INK}>ONS</text>}
        </>
      )}
    </g>
  )
}

function boxLines(n: Ins, t: Tags): string[] {
  const [a, b, c] = n.args
  const v = (x: string) => (/^-?\d/.test(x) ? x : `${x} = ${fmt(t[x])}`)
  switch (n.op) {
    case 'TON': case 'TOF': case 'RTO': return [a, `PRE ${b} ms`, `ACC ${fmt(t[`${a}.ACC`])}`]
    case 'CTU': case 'CTD': return [a, `PRE ${b}`, `ACC ${fmt(t[`${a}.ACC`])}`]
    case 'RES': return [a]
    case 'MOV': return [`from ${v(a)}`, `to ${b}`]
    case 'ADD': case 'SUB': return [`${a} ${n.op === 'ADD' ? '+' : '−'} ${b}`, `→ ${c}`, `= ${fmt(t[c])}`]
    default: return [v(a), v(b)]
  }
}

function Series({ nodes, x, y, tags, tr, right }: { nodes: Node[]; x: number; y: number; tags: Tags; tr?: RungTrace; right?: number }): ReactNode {
  const out: ReactNode[] = []
  let cx = x
  nodes.forEach((n, i) => {
    const s = sizeOf(n)
    if (right !== undefined && i === nodes.length - 1) {
      const nx = right - s.w
      out.push(<Wire key={`gap${i}`} x1={cx} x2={nx} y={y + WIRE} on={!!tr?.[n.id]?.rin} />)
      cx = nx
    }
    out.push(n.kind === 'ins' ? <Instr key={i} n={n} x={cx} y={y} tags={tags} tr={tr} /> : <BranchView key={i} b={n} x={cx} y={y} tags={tags} tr={tr} />)
    cx += s.w
  })
  return <>{out}</>
}

function BranchView({ b, x, y, tags, tr }: { b: Extract<Node, { kind: 'branch' }>; x: number; y: number; tags: Tags; tr?: RungTrace }) {
  const s = sizeOf(b)
  const rin = !!tr?.[b.id]?.rin, rout = !!tr?.[b.id]?.rout
  const tops: number[] = []
  let ty = y
  for (const leg of b.legs) { tops.push(ty); ty += seriesSize(leg).h }
  const lx = x + 4, rx = x + s.w - 4
  return (
    <g>
      <Wire x1={x} x2={lx} y={y + WIRE} on={rin} />
      <line x1={lx} x2={lx} y1={y + WIRE} y2={tops[tops.length - 1] + WIRE} stroke={rin ? ON : OFF} strokeWidth={rin ? 3.5 : 2} />
      <line x1={rx} x2={rx} y1={y + WIRE} y2={tops[tops.length - 1] + WIRE} stroke={rout ? ON : OFF} strokeWidth={rout ? 3.5 : 2} />
      {b.legs.map((leg, i) => {
        const w = seriesSize(leg).w
        const last = leg[leg.length - 1]
        const legOut = !!tr?.[last.id]?.rout
        return (
          <g key={i}>
            <Wire x1={lx} x2={x + PAD} y={tops[i] + WIRE} on={rin} />
            <Series nodes={leg} x={x + PAD} y={tops[i]} tags={tags} tr={tr} />
            <Wire x1={x + PAD + w} x2={rx} y={tops[i] + WIRE} on={legOut} />
          </g>
        )
      })}
      <Wire x1={rx} x2={x + s.w} y={y + WIRE} on={rout} />
    </g>
  )
}

/** One rung, drawn like an online editor: green wires carry power, green contacts are true. */
export function RungView({ r, n, tags = {}, tr, width, label }: { r: Rung; n: number; tags?: Tags; tr?: RungTrace; width?: number; label?: string }) {
  const s = seriesSize(r.nodes)
  const W = Math.max(width ?? 0, rungWidth(r))
  const right = W - TAIL
  const out = tr ? !!tr[r.nodes[r.nodes.length - 1].id]?.rout : false
  const lastOut = tailIsOutput(r)
  const power = !!tr
  return (
    <figure className="m-0">
      {r.comment && <figcaption className="mb-0.5 pl-1 text-xs text-ink-2">{r.comment}</figcaption>}
      <svg width={W} height={s.h + 8} viewBox={`0 0 ${W} ${s.h + 8}`} role="img" aria-label={label ?? `Rung ${n}: ${r.text}${tr ? `. Rung is ${out ? 'true' : 'false'}.` : ''}`} className="block">
        <text x={4} y={WIRE + 8} fontSize={11} fill={OFF} className="font-mono">{n}</text>
        <line x1={GUTTER - 6} x2={GUTTER - 6} y1={0} y2={s.h + 8} stroke={INK} strokeWidth={3} />
        <line x1={W - 4} x2={W - 4} y1={0} y2={s.h + 8} stroke={INK} strokeWidth={3} />
        <Wire x1={GUTTER - 6} x2={GUTTER} y={WIRE + 4} on={power} />
        <g transform="translate(0 4)">
          <Series nodes={r.nodes} x={GUTTER} y={0} tags={tags} tr={tr} right={lastOut ? right : undefined} />
          <Wire x1={lastOut ? right : GUTTER + s.w} x2={W - 4} y={WIRE} on={out} />
        </g>
      </svg>
    </figure>
  )
}

export function LadderDiagram({ program, tags, traces, label }: { program: Program; tags?: Tags; traces?: RungTrace[]; label?: string }) {
  const W = Math.max(...program.rungs.map(rungWidth), 300)
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-paper/40 p-2" tabIndex={0} role="group" aria-label={label ?? 'Ladder diagram, scroll sideways if it is cut off'}>
      <div className="space-y-1.5" style={{ minWidth: W }}>
        {program.rungs.map((r, i) => <RungView key={i} r={r} n={i} tags={tags} tr={traces?.[i]} width={W} />)}
      </div>
    </div>
  )
}

export const Code = ({ src, label }: { src: string; label: string }) => (
  <pre className="overflow-x-auto rounded-md border border-line bg-paper/60 p-3 text-[0.85rem] leading-relaxed" tabIndex={0} aria-label={label}><code>{src}</code></pre>
)

// ---------- Scenario table ----------
const physText = (d: Device, v: Phys[string] | undefined) => (v === 'broken' ? 'wire cut' : v === 1 ? (d.kind === 'push' ? 'pressed' : 'on') : '–')
export function ScenarioTable({ rows, devices, show, caption, graded }: { rows: StepResult[]; devices: Device[]; show: string[]; caption: string; graded?: boolean }) {
  const used = devices.filter((d) => rows.some((r) => r.phys[d.tag] !== undefined && r.phys[d.tag] !== 0))
  return (
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label={`${caption}, scroll sideways if it is cut off`}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="py-1 pr-3 font-semibold">What happens</th>
            <th scope="col" className="py-1 pr-3 font-semibold">t (s)</th>
            {used.map((d) => <th key={d.tag} scope="col" className="py-1 pr-3 font-semibold text-ink-2">{d.label}</th>)}
            {show.map((t) => <th key={t} scope="col" className="py-1 pr-3 font-mono text-[0.8rem] font-semibold">{t}</th>)}
            {graded && <th scope="col" className="py-1 font-semibold">Check</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-line/60 ${r.wrong.length ? 'bg-sred/5' : ''}`}>
              <td className="min-w-[8rem] py-1 pr-3">{r.say}</td>
              <td className="py-1 pr-3 tabular-nums text-ink-2">{(r.t / 1000).toFixed(2)}</td>
              {used.map((d) => <td key={d.tag} className="py-1 pr-3 text-ink-2">{physText(d, r.phys[d.tag])}</td>)}
              {show.map((t) => {
                const w = r.wrong.find((x) => x.tag === t)
                return <td key={t} className={`py-1 pr-3 font-mono tabular-nums ${w ? 'font-bold text-sred' : ''}`}>{fmt(r.tags[t])}{w && <span className="font-sans font-normal"> (want {w.want})</span>}</td>
              })}
              {graded && <td className="py-1">{r.wrong.length ? <span className="font-semibold text-sred">✗ {r.wrong.filter((w) => !show.includes(w.tag)).map((w) => `${w.tag} is ${w.got}, want ${w.want}`).join('; ')}</span> : <span className="text-sgreen">✓</span>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Live runner ----------
function DeviceControl({ d, value, set }: { d: Device; value: Phys[string] | undefined; set: (v: 0 | 1 | 'broken') => void }) {
  const broken = value === 'broken'
  const on = value === 1
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-line px-2 py-1.5">
      {d.kind === 'push' ? (
        <button type="button" className={`btn !py-1 !text-sm ${on ? '!border-sgreen !bg-sgreen' : ''}`} disabled={broken} aria-pressed={on}
          onPointerDown={(e) => { e.preventDefault(); set(1) }} onPointerUp={() => set(0)} onPointerLeave={() => on && set(0)}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(1) } }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') set(0) }}>{d.label}</button>
      ) : (
        <label className="flex items-center gap-1.5 text-sm font-medium"><input type="checkbox" checked={on} disabled={broken} onChange={(e) => set(e.target.checked ? 1 : 0)} /> {d.label}</label>
      )}
      <span className="text-xs text-ink-2">{d.wiring === 'NC' ? 'NC' : 'NO'} → <span className="font-mono">{d.tag}</span></span>
      <label className="ml-auto flex items-center gap-1 text-xs text-ink-2"><input type="checkbox" checked={broken} onChange={(e) => set(e.target.checked ? 'broken' : 0)} /> cut wire</label>
    </div>
  )
}

function TagTable({ program, tags, devices }: { program: Program; tags: Tags; devices: Device[] }) {
  const t = tagsOf(program)
  const inputs = new Set(devices.map((d) => d.tag))
  const bits = [...new Set([...devices.map((d) => d.tag), ...t.bits])]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="label mb-1">Bits</p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
          {bits.map((b) => {
            const v = (tags[b] ?? 0) !== 0
            return <li key={b} className="flex items-center gap-2"><span aria-hidden className={`inline-block h-3 w-3 rounded-full border border-ink ${v ? 'bg-sgreen' : 'bg-transparent'}`} /><span className="font-mono">{b}</span><span className="text-ink-2">= {v ? 1 : 0}{inputs.has(b) ? ' (input)' : ''}</span></li>
          })}
        </ul>
      </div>
      {(t.structs.length > 0 || t.numbers.length > 0) && (
        <div>
          <p className="label mb-1">Timers, counters and numbers</p>
          <ul className="space-y-0.5 text-sm">
            {t.structs.map((s) => (
              <li key={s.name} className="font-mono">{s.name}: ACC {fmt(tags[`${s.name}.ACC`])} / PRE {fmt(tags[`${s.name}.PRE`])}
                <span className="font-sans text-ink-2"> · {(s.kind === 'timer' ? ['EN', 'TT', 'DN'] : ['CU', 'CD', 'DN']).filter((m) => tags[`${s.name}.${m}`] !== undefined).map((m) => `${m} ${tags[`${s.name}.${m}`] ?? 0}`).join(' · ')}</span></li>
            ))}
            {t.numbers.map((nm) => <li key={nm} className="font-mono">{nm} = {fmt(tags[nm])}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Edit a program and run it live: push buttons, flip switches, cut wires, step one scan at a time or restart. */
export function LadderRunner({ initial, devices, title = 'Run it' }: { initial: string; devices: Device[]; title?: string }) {
  const id = useId()
  const [src, setSrc] = useState(initial)
  const [phys, setPhys] = useState<Phys>({})
  const [tags, setTags] = useState<Tags>({})
  const [traces, setTraces] = useState<RungTrace[]>([])
  const [running, setRunning] = useState(true)
  const [scans, setScans] = useState(0)
  const parsed = useMemo(() => parseProgram(src), [src])
  const prog = parsed.errors.length ? null : parsed.program
  const warnings = useMemo(() => (prog ? lint(prog, devices.map((d) => d.tag)) : []), [prog, devices])
  const live = useRef({ prog, phys, tags, devices })
  live.current = { prog, phys, tags, devices }
  useEffect(() => { setSrc(initial); setPhys({}) }, [initial, devices])
  useEffect(() => { setTags({}); setTraces([]); setScans(0) }, [src])
  const step = (n: number) => {
    const { prog: p, phys: ph, devices: dev } = live.current
    if (!p) return
    let t = live.current.tags, tr: RungTrace[] = []
    for (let k = 0; k < n; k++) { const r = scan(p, t, inputImage(dev, ph), SCAN_MS); t = r.tags; tr = r.traces }
    live.current.tags = t
    setTags(t); setTraces(tr); setScans((s) => s + n)
  }
  useEffect(() => {
    if (!running || !prog) return
    const iv = window.setInterval(() => step(5), 50)
    return () => window.clearInterval(iv)
  }, [running, prog]) // eslint-disable-line react-hooks/exhaustive-deps
  const setDev = (tag: string, v: 0 | 1 | 'broken') => setPhys((p) => ({ ...p, [tag]: v }))
  const reset = () => { setTags({}); setTraces([]); setScans(0); live.current.tags = {} }
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={id} className="label">{title}: rung text, one rung per line</label>
        <textarea id={id} className="input mt-1 font-mono text-[0.85rem] leading-relaxed" rows={Math.min(12, Math.max(3, src.split('\n').length + 1))} spellCheck={false} value={src} onChange={(e) => setSrc(e.target.value)} aria-describedby={`${id}-e`} />
        <div id={`${id}-e`} aria-live="polite">
          {parsed.errors.map((e) => <p key={`${e.line}-${e.col}`} className="mt-1 rounded-md border-l-4 border-sred bg-sred/5 px-3 py-1.5 text-sm"><strong>Line {e.line}, column {e.col}:</strong> {e.msg}</p>)}
          {warnings.map((w) => <p key={w.msg} className="mt-1 rounded-md border-l-4 border-sorange bg-sorange/5 px-3 py-1.5 text-sm"><strong>Review:</strong> {w.msg}</p>)}
        </div>
      </div>
      {prog && <LadderDiagram program={prog} tags={tags} traces={traces} label="Live ladder view, scroll sideways if it is cut off" />}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className="btn !py-1.5" onClick={() => setRunning(!running)} disabled={!prog} aria-pressed={running}>{running ? 'Pause' : 'Run'}</button>
        <button type="button" className="btn-ghost btn !py-1.5" onClick={() => step(1)} disabled={!prog || running}>One scan</button>
        <button type="button" className="btn-ghost btn !py-1.5" onClick={() => { if (prog) { const t = prescan(prog, live.current.tags); live.current.tags = t; setTags(t) } }} disabled={!prog}>Restart (prescan)</button>
        <button type="button" className="btn-ghost btn !py-1.5" onClick={reset}>Clear all tags</button>
        <button type="button" className="btn-ghost btn !py-1.5" onClick={() => setSrc(initial)}>Original program</button>
        <span className="text-ink-2" aria-live="off">Scan {scans} · {(scans * SCAN_MS / 1000).toFixed(2)} s</span>
      </div>
      {devices.length > 0 && (
        <div>
          <p className="label mb-1">Field devices{devices.some((d) => d.kind === 'push') ? ' (hold a button down to press it)' : ''}</p>
          <div className="grid gap-2 sm:grid-cols-2">{devices.map((d) => <DeviceControl key={d.tag} d={d} value={phys[d.tag]} set={(v) => setDev(d.tag, v)} />)}</div>
        </div>
      )}
      {prog && <TagTable program={prog} tags={tags} devices={devices} />}
      <p className="text-xs text-ink-2">Each scan reads the devices, solves every rung top to bottom and updates the tags; it runs 10 ms scans in real time. A teaching engine, not a controller emulator.</p>
    </div>
  )
}
