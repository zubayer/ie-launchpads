import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { phi } from '../lib/math'
import { neighbors } from '../content'
import { DOMAIN_MAP } from '../content/domains'
import type { Concept } from '../types'

/* A small library of parametric diagrams. Specs live in content/visuals.ts. */
export interface TNode { label: string; gate?: 'AND' | 'OR'; kids?: TNode[] }
export type VizSpec =
  | { t: 'bell'; lsl?: number; usl?: number; note?: string }
  | { t: 'cycle'; items: string[]; center?: string }
  | { t: 'steps'; items: string[]; note?: string }
  | { t: 'pyramid'; items: string[]; topLabel?: string; bottomLabel?: string }
  | { t: 'bathtub' }
  | { t: 'tree'; root: TNode }
  | { t: 'bowtie'; hazard?: string; left: string[]; center: string; right: string[] }
  | { t: 'matrix'; rows: string[]; cols: string[]; cells: string[][]; xLabel?: string; yLabel?: string; heat?: boolean }
  | { t: 'vmodel' }
  | { t: 'curve'; x: [number, number]; lines: { f: (x: number) => number; label: string; color?: string; dash?: boolean }[]; xLabel?: string; yLabel?: string; marks?: { x: number; label: string }[]; y?: [number, number] }
  | { t: 'pareto'; items: [string, number][] }
  | { t: 'fishbone'; effect: string; bones: [string, string[]][] }
  | { t: 'gantt'; tasks: [string, number, number, boolean?][] }
  | { t: 'network'; nodes: { id: string; label: string; x: number; y: number; hl?: boolean }[]; edges: [string, string, string?][]; h?: number }
  | { t: 'layers'; items: { label: string; color: string; h?: number }[]; note?: string }
  | { t: 'bars'; items: [string, number, string?][]; unit?: string }
  | { t: 'compare'; a: { title: string; points: string[] }; b: { title: string; points: string[] } }
  | { t: 'queue'; servers?: number }
  | { t: 'control' }
  | { t: 'scatter'; line?: boolean; clusters?: boolean }

const C = { ink: 'var(--color-ink)', ink2: 'var(--color-ink-2)', line: 'var(--color-line)', blue: 'var(--color-sblue)', red: 'var(--color-sred)', green: 'var(--color-sgreen)', orange: 'var(--color-sorange)', tape: 'var(--color-tape)', sheet: 'var(--color-sheet)', paper: 'var(--color-paper)' }
const PALETTE = [C.blue, C.orange, C.green, C.red, '#7c4ddb', '#0e8a8c', '#e0a800', '#475569']

function Box({ x, y, w, h, text, fill = C.sheet, stroke = C.ink, color = C.ink, size = 12, rx = 8, bold = false }: { x: number; y: number; w: number; h: number; text: string; fill?: string; stroke?: string; color?: string; size?: number; rx?: number; bold?: boolean }) {
  const words = text.split(' ')
  const lines: string[] = []
  const maxChars = Math.max(6, Math.floor(w / (size * 0.55)))
  let cur = ''
  for (const wd of words) { if ((cur + ' ' + wd).trim().length > maxChars) { if (cur) lines.push(cur); cur = wd } else cur = (cur + ' ' + wd).trim() }
  if (cur) lines.push(cur)
  const lh = size * 1.2
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.slice(0, 4).map((l, i) => (
        <text key={i} x={x + w / 2} y={y + h / 2 + (i - (Math.min(lines.length, 4) - 1) / 2) * lh + size * 0.35} textAnchor="middle" fontSize={size} fill={color} fontWeight={bold ? 700 : 500}>{l}</text>
      ))}
    </g>
  )
}
const Arrow = ({ x1, y1, x2, y2, color = C.ink2, label }: { x1: number; y1: number; x2: number; y2: number; color?: string; label?: string }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} markerEnd="url(#arr)" />
    {label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} fontSize={10} textAnchor="middle" fill={C.ink2}>{label}</text>}
  </g>
)
const Svg = ({ h, children, label }: { h: number; children: ReactNode; label: string }) => (
  <svg viewBox={`0 0 640 ${h}`} className="w-full" role="img" aria-label={label}>
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C.ink2} /></marker></defs>
    {children}
  </svg>
)

function Bell({ s }: { s: Extract<VizSpec, { t: 'bell' }> }) {
  const x = (z: number) => 320 + z * 80
  const y = (z: number) => 200 - phi(z) * 420
  const path = (a: number, b: number) => { const pts = []; for (let z = a; z <= b + 1e-9; z += 0.05) pts.push(`${x(z)},${y(z)}`); return `M${x(a)},200 L${pts.join(' L')} L${x(b)},200Z` }
  return (
    <Svg h={240} label="Normal curve with sigma bands">
      <path d={path(-3, 3)} fill={C.blue} opacity={0.12} /><path d={path(-2, 2)} fill={C.blue} opacity={0.15} /><path d={path(-1, 1)} fill={C.blue} opacity={0.22} />
      <path d={`M${x(-3.8)},${y(-3.8)} ${Array.from({ length: 153 }, (_, i) => -3.8 + i * 0.05).map((z) => `L${x(z)},${y(z)}`).join(' ')}`} fill="none" stroke={C.ink} strokeWidth={2.5} />
      <line x1={20} x2={620} y1={200} y2={200} stroke={C.line} />
      {[-3, -2, -1, 0, 1, 2, 3].map((z) => <text key={z} x={x(z)} y={218} fontSize={12} textAnchor="middle" fill={C.ink2}>{z === 0 ? 'μ' : `${z > 0 ? '+' : '−'}${Math.abs(z)}σ`}</text>)}
      {[['68.3%', 1, 120], ['95.4%', 2, 150], ['99.7%', 3, 180]].map(([l, z, yy]) => (
        <g key={l as string}><line x1={x(-(z as number))} x2={x(z as number)} y1={yy as number} y2={yy as number} stroke={C.blue} strokeWidth={1.2} /><text x={320} y={(yy as number) - 4} fontSize={11} textAnchor="middle" fill={C.blue} fontWeight={600}>{l}</text></g>
      ))}
      {s.lsl !== undefined && <g><line x1={x(s.lsl)} x2={x(s.lsl)} y1={30} y2={200} stroke={C.red} strokeWidth={2} /><text x={x(s.lsl)} y={24} fontSize={11} textAnchor="middle" fill={C.red}>LSL</text></g>}
      {s.usl !== undefined && <g><line x1={x(s.usl)} x2={x(s.usl)} y1={30} y2={200} stroke={C.red} strokeWidth={2} /><text x={x(s.usl)} y={24} fontSize={11} textAnchor="middle" fill={C.red}>USL</text></g>}
      {s.note && <text x={320} y={236} fontSize={11} textAnchor="middle" fill={C.ink2}>{s.note}</text>}
    </Svg>
  )
}

function Cycle({ s }: { s: Extract<VizSpec, { t: 'cycle' }> }) {
  const n = s.items.length, R = 110, cx = 320, cy = 150
  const pos = (i: number) => [cx + R * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), cy + R * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]
  return (
    <Svg h={300} label="Cycle diagram">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.line} strokeWidth={10} />
      {s.items.map((_, i) => { const a = (2 * Math.PI * (i + 0.5)) / n - Math.PI / 2; return <path key={'a' + i} d={`M${cx + R * Math.cos(a - 0.12)},${cy + R * Math.sin(a - 0.12)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a + 0.12)},${cy + R * Math.sin(a + 0.12)}`} fill="none" stroke={C.ink2} strokeWidth={2} markerEnd="url(#arr)" /> })}
      {s.items.map((it, i) => { const [x, y] = pos(i); return <Box key={i} x={x - 62} y={y - 22} w={124} h={44} text={it} fill={C.sheet} stroke={PALETTE[i % PALETTE.length]} bold size={12} /> })}
      {s.center && <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={800} fill={C.ink}>{s.center}</text>}
    </Svg>
  )
}

function Steps({ s }: { s: Extract<VizSpec, { t: 'steps' }> }) {
  const n = s.items.length, perRow = Math.min(n, 5), rows = Math.ceil(n / perRow)
  const w = (600 - (perRow - 1) * 22) / perRow
  return (
    <Svg h={rows * 92 + (s.note ? 24 : 0)} label="Process steps">
      {s.items.map((it, i) => {
        const r = Math.floor(i / perRow), c = i % perRow
        const x = 20 + c * (w + 22), y = 14 + r * 92
        return (
          <g key={i}>
            <Box x={x} y={y} w={w} h={64} text={it} stroke={PALETTE[i % PALETTE.length]} size={12} />
            <circle cx={x + 12} cy={y + 12} r={10} fill={PALETTE[i % PALETTE.length]} /><text x={x + 12} y={y + 16} fontSize={11} textAnchor="middle" fill="#fff" fontWeight={700}>{i + 1}</text>
            {c < perRow - 1 && i < n - 1 && <Arrow x1={x + w + 2} y1={y + 32} x2={x + w + 20} y2={y + 32} />}
          </g>
        )
      })}
      {s.note && <text x={320} y={rows * 92 + 14} fontSize={11} textAnchor="middle" fill={C.ink2}>{s.note}</text>}
    </Svg>
  )
}

function Pyramid({ s }: { s: Extract<VizSpec, { t: 'pyramid' }> }) {
  const n = s.items.length, H = 52
  return (
    <Svg h={n * H + 30} label="Pyramid diagram">
      {s.items.map((it, i) => {
        const top = 10 + i * H, wTop = 120 + i * (400 / n), wBot = 120 + (i + 1) * (400 / n)
        return (
          <g key={i}>
            <path d={`M${320 - wTop / 2},${top} L${320 + wTop / 2},${top} L${320 + wBot / 2},${top + H - 4} L${320 - wBot / 2},${top + H - 4}Z`} fill={PALETTE[i % PALETTE.length]} opacity={0.85} />
            <text x={320} y={top + H / 2 + 3} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">{it}</text>
          </g>
        )
      })}
      {s.topLabel && <text x={20} y={30} fontSize={11} fill={C.ink2}>▲ {s.topLabel}</text>}
      {s.bottomLabel && <text x={20} y={n * H} fontSize={11} fill={C.ink2}>▼ {s.bottomLabel}</text>}
    </Svg>
  )
}

function Bathtub() {
  const f = (t: number) => 0.9 * Math.exp(-t / 0.08) + 0.15 + 0.6 * Math.max(0, t - 0.7) ** 2 * 6
  const x = (t: number) => 50 + t * 560, y = (v: number) => 200 - v * 150
  return (
    <Svg h={240} label="Bathtub curve">
      <rect x={x(0)} y={20} width={x(0.15) - x(0)} height={180} fill={C.orange} opacity={0.08} /><rect x={x(0.7)} y={20} width={x(1) - x(0.7)} height={180} fill={C.red} opacity={0.08} />
      <path d={Array.from({ length: 101 }, (_, i) => i / 100).map((t, i) => `${i ? 'L' : 'M'}${x(t)},${y(Math.min(1.2, f(t)))}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={3} />
      <line x1={50} x2={620} y1={200} y2={200} stroke={C.line} /><line x1={50} x2={50} y1={20} y2={200} stroke={C.line} />
      <text x={x(0.07)} y={36} textAnchor="middle" fontSize={12} fill={C.orange} fontWeight={700}>Infant mortality</text><text x={x(0.07)} y={50} textAnchor="middle" fontSize={10} fill={C.ink2}>β &lt; 1, falling rate</text>
      <text x={x(0.42)} y={150} textAnchor="middle" fontSize={12} fill={C.blue} fontWeight={700}>Useful life — random failures</text><text x={x(0.42)} y={164} textAnchor="middle" fontSize={10} fill={C.ink2}>β ≈ 1, constant rate</text>
      <text x={x(0.86)} y={36} textAnchor="middle" fontSize={12} fill={C.red} fontWeight={700}>Wear-out</text><text x={x(0.86)} y={50} textAnchor="middle" fontSize={10} fill={C.ink2}>β &gt; 1, rising rate</text>
      <text x={330} y={222} textAnchor="middle" fontSize={11} fill={C.ink2}>Time →</text><text x={16} y={110} fontSize={11} fill={C.ink2} transform="rotate(-90 16 110)">Failure rate</text>
    </Svg>
  )
}

function Tree({ s }: { s: Extract<VizSpec, { t: 'tree' }> }) {
  const leaves = (n: TNode): number => (n.kids?.length ? n.kids.reduce((a, k) => a + leaves(k), 0) : 1)
  const depth = (n: TNode): number => 1 + Math.max(0, ...(n.kids || []).map(depth))
  const total = leaves(s.root), D = depth(s.root), H = D * 90 + 10
  const out: ReactNode[] = []
  const place = (n: TNode, x0: number, x1: number, lvl: number, key: string): [number, number] => {
    const cx = (x0 + x1) / 2, cy = 14 + lvl * 90
    let acc = x0
    ;(n.kids || []).forEach((k, i) => {
      const w = ((x1 - x0) * leaves(k)) / leaves(n)
      const [kx, ky] = place(k, acc, acc + w, lvl + 1, key + i)
      out.push(<line key={key + 'l' + i} x1={cx} y1={cy + 62} x2={kx} y2={ky} stroke={C.ink2} strokeWidth={1.4} />)
      acc += w
    })
    const bw = Math.min(150, (x1 - x0) - 8)
    out.push(<Box key={key} x={cx - bw / 2} y={cy} w={bw} h={40} text={n.label} stroke={n.kids ? C.ink : C.blue} size={11} rx={n.kids ? 4 : 18} />)
    if (n.gate) out.push(
      <g key={key + 'g'}>
        {n.gate === 'AND'
          ? <path d={`M${cx - 14},${cy + 62} L${cx - 14},${cy + 50} A14,14 0 0 1 ${cx + 14},${cy + 50} L${cx + 14},${cy + 62}Z`} fill={C.sheet} stroke={C.blue} strokeWidth={2} />
          : <path d={`M${cx - 14},${cy + 62} Q${cx},${cy + 54} ${cx + 14},${cy + 62} Q${cx + 10},${cy + 46} ${cx},${cy + 42} Q${cx - 10},${cy + 46} ${cx - 14},${cy + 62}Z`} fill={C.sheet} stroke={C.orange} strokeWidth={2} />}
        <line x1={cx} y1={cy + 40} x2={cx} y2={cy + 44} stroke={C.ink2} />
        <text x={cx + 20} y={cy + 58} fontSize={10} fontWeight={700} fill={n.gate === 'AND' ? C.blue : C.orange}>{n.gate}</text>
      </g>,
    )
    return [cx, cy]
  }
  place(s.root, 10, 630, 0, 'n')
  void total
  return <Svg h={H} label="Tree diagram">{out}</Svg>
}

function Bowtie({ s }: { s: Extract<VizSpec, { t: 'bowtie' }> }) {
  const n = Math.max(s.left.length, s.right.length), H = Math.max(200, n * 56 + 40)
  const yy = (i: number, m: number) => H / 2 + (i - (m - 1) / 2) * 56
  return (
    <Svg h={H + (s.hazard ? 26 : 0)} label="Bow-tie diagram">
      <g transform={`translate(0,${s.hazard ? 26 : 0})`}>
        <path d={`M150,20 L320,${H / 2} L150,${H - 20}Z M490,20 L320,${H / 2} L490,${H - 20}Z`} fill={C.blue} opacity={0.07} />
        {s.left.map((t, i) => <g key={'l' + i}><Box x={4} y={yy(i, s.left.length) - 20} w={140} h={40} text={t} stroke={C.blue} size={11} /><Arrow x1={146} y1={yy(i, s.left.length)} x2={262} y2={H / 2} /><rect x={196} y={(yy(i, s.left.length) + H / 2) / 2 - 10} width={7} height={20} fill={C.ink} /></g>)}
        {s.right.map((t, i) => <g key={'r' + i}><Arrow x1={378} y1={H / 2} x2={494} y2={yy(i, s.right.length)} /><rect x={437} y={(yy(i, s.right.length) + H / 2) / 2 - 10} width={7} height={20} fill={C.ink} /><Box x={496} y={yy(i, s.right.length) - 20} w={140} h={40} text={t} stroke={C.orange} size={11} /></g>)}
        <circle cx={320} cy={H / 2} r={56} fill={C.sheet} stroke={C.red} strokeWidth={3} />
        <Box x={268} y={H / 2 - 30} w={104} h={60} text={s.center} fill="transparent" stroke="transparent" size={11} bold />
        <text x={74} y={12} textAnchor="middle" fontSize={11} fill={C.blue} fontWeight={700}>Threats</text>
        <text x={566} y={12} textAnchor="middle" fontSize={11} fill={C.orange} fontWeight={700}>Consequences</text>
        <text x={200} y={H - 2} textAnchor="middle" fontSize={10} fill={C.ink2}>preventive barriers ▮</text>
        <text x={440} y={H - 2} textAnchor="middle" fontSize={10} fill={C.ink2}>▮ mitigative barriers</text>
      </g>
      {s.hazard && <g><rect x={250} y={0} width={140} height={22} rx={4} fill={C.tape} /><text x={320} y={15} textAnchor="middle" fontSize={11} fontWeight={700} fill="#172033">Hazard: {s.hazard}</text></g>}
    </Svg>
  )
}

function Matrix({ s }: { s: Extract<VizSpec, { t: 'matrix' }> }) {
  const R = s.rows.length, K = s.cols.length, cw = 480 / K, ch = Math.min(56, 260 / R)
  const heat = (r: number, c: number) => { const v = ((R - r) + (c + 1)) / (R + K); return v > 0.75 ? C.red : v > 0.5 ? C.orange : v > 0.35 ? C.tape : C.green }
  return (
    <Svg h={R * ch + 60} label="Matrix">
      {s.rows.map((r, i) => <text key={r} x={146} y={20 + i * ch + ch / 2 + 4} textAnchor="end" fontSize={11} fill={C.ink}>{r}</text>)}
      {s.cols.map((c, j) => <text key={c} x={150 + j * cw + cw / 2} y={20 + R * ch + 16} textAnchor="middle" fontSize={11} fill={C.ink}>{c}</text>)}
      {s.cells.map((row, i) => row.map((v, j) => (
        <g key={i + '-' + j}>
          <rect x={150 + j * cw} y={20 + i * ch} width={cw - 3} height={ch - 3} rx={4} fill={s.heat ? heat(i, j) : C.blue} opacity={s.heat ? 0.35 : 0.08} stroke={C.line} />
          <text x={150 + j * cw + cw / 2} y={20 + i * ch + ch / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.ink}>{v}</text>
        </g>
      )))}
      {s.xLabel && <text x={390} y={R * ch + 54} textAnchor="middle" fontSize={11} fill={C.ink2}>{s.xLabel} →</text>}
      {s.yLabel && <text x={12} y={20 + (R * ch) / 2} fontSize={11} fill={C.ink2} transform={`rotate(-90 12 ${20 + (R * ch) / 2})`} textAnchor="middle">{s.yLabel} →</text>}
    </Svg>
  )
}

function VModel() {
  const L = ['Concept of operations', 'System requirements', 'High-level design', 'Detailed design']
  const Rr = ['Validation', 'System verification', 'Integration test', 'Unit test']
  return (
    <Svg h={300} label="V-model">
      {L.map((t, i) => <Box key={t} x={20 + i * 55} y={14 + i * 58} w={170} h={42} text={t} stroke={C.blue} size={11} />)}
      {Rr.map((t, i) => <Box key={t} x={450 - i * 55} y={14 + i * 58} w={170} h={42} text={t} stroke={C.green} size={11} />)}
      {L.map((_, i) => <line key={i} x1={190 + i * 55} y1={35 + i * 58} x2={450 - i * 55} y2={35 + i * 58} stroke={C.line} strokeDasharray="5 4" />)}
      <Box x={250} y={248} w={140} h={40} text="Implementation" stroke={C.ink} size={12} bold />
      <text x={70} y={290} fontSize={11} fill={C.blue}>Decompose & define ↓</text><text x={480} y={290} fontSize={11} fill={C.green}>↑ Integrate & verify</text>
    </Svg>
  )
}

function Curve({ s }: { s: Extract<VizSpec, { t: 'curve' }> }) {
  const [a, b] = s.x, N = 160, xs = Array.from({ length: N + 1 }, (_, i) => a + ((b - a) * i) / N)
  const all = s.lines.flatMap((l) => xs.map(l.f)).filter(Number.isFinite)
  const [y0, y1] = s.y || [Math.min(0, ...all), Math.max(...all) * 1.08]
  const X = (v: number) => 60 + ((v - a) / (b - a)) * 560, Y = (v: number) => 210 - ((v - y0) / (y1 - y0 || 1)) * 190
  return (
    <Svg h={250} label="Curve plot">
      <line x1={60} x2={620} y1={210} y2={210} stroke={C.line} /><line x1={60} x2={60} y1={16} y2={210} stroke={C.line} />
      {s.lines.map((l, i) => (
        <g key={l.label}>
          <path d={xs.map((v, k) => { const yv = l.f(v); return Number.isFinite(yv) ? `${k ? 'L' : 'M'}${X(v)},${Y(Math.max(y0, Math.min(y1, yv)))}` : '' }).join(' ')} fill="none" stroke={l.color || PALETTE[i]} strokeWidth={2.6} strokeDasharray={l.dash ? '6 4' : undefined} />
          <rect x={70 + i * 150} y={228} width={14} height={4} fill={l.color || PALETTE[i]} /><text x={90 + i * 150} y={234} fontSize={11} fill={C.ink2}>{l.label}</text>
        </g>
      ))}
      {s.marks?.map((m) => <g key={m.label}><line x1={X(m.x)} x2={X(m.x)} y1={16} y2={210} stroke={C.green} strokeDasharray="4 4" /><text x={X(m.x) + 4} y={28} fontSize={11} fill={C.green} fontWeight={700}>{m.label}</text></g>)}
      {s.xLabel && <text x={600} y={204} fontSize={11} textAnchor="end" fill={C.ink2}>{s.xLabel}</text>}
      {s.yLabel && <text x={66} y={26} fontSize={11} fill={C.ink2}>{s.yLabel}</text>}
    </Svg>
  )
}

function Pareto({ s }: { s: Extract<VizSpec, { t: 'pareto' }> }) {
  const items = [...s.items].sort((p, q) => q[1] - p[1]), total = items.reduce((a, i) => a + i[1], 0), max = items[0][1]
  const bw = 520 / items.length
  let cum = 0
  const pts = items.map((it, i) => { cum += it[1]; return [70 + i * bw + bw / 2, 210 - (cum / total) * 190] })
  return (
    <Svg h={250} label="Pareto chart">
      {items.map((it, i) => <g key={it[0]}><rect x={72 + i * bw} y={210 - (it[1] / max) * 170} width={bw - 8} height={(it[1] / max) * 170} fill={i < 2 ? C.blue : C.line} /><text x={72 + i * bw + (bw - 8) / 2} y={228} fontSize={10} textAnchor="middle" fill={C.ink}>{it[0]}</text></g>)}
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.orange} strokeWidth={2.4} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={C.orange} />)}
      <line x1={70} x2={600} y1={210 - 0.8 * 190} y2={210 - 0.8 * 190} stroke={C.orange} strokeDasharray="4 4" opacity={0.6} /><text x={604} y={210 - 0.8 * 190 + 4} fontSize={10} fill={C.orange}>80%</text>
      <line x1={70} x2={600} y1={210} y2={210} stroke={C.line} />
    </Svg>
  )
}

function Fishbone({ s }: { s: Extract<VizSpec, { t: 'fishbone' }> }) {
  const top = s.bones.slice(0, Math.ceil(s.bones.length / 2)), bot = s.bones.slice(Math.ceil(s.bones.length / 2))
  const bone = ([name, causes]: [string, string[]], i: number, up: boolean) => {
    const x = 120 + i * 150, yEnd = up ? 40 : 240
    return (
      <g key={name}>
        <line x1={x} y1={yEnd} x2={x + 70} y2={140} stroke={C.ink2} strokeWidth={2} />
        <text x={x} y={up ? 28 : 258} fontSize={12} fontWeight={700} textAnchor="middle" fill={PALETTE[i + (up ? 0 : 3)]}>{name}</text>
        {causes.slice(0, 3).map((c, k) => { const t = (k + 1) / 4, cx = x + 70 * t, cy = yEnd + (140 - yEnd) * t; return <g key={c}><line x1={cx - 50} y1={cy} x2={cx} y2={cy} stroke={C.line} /><text x={cx - 52} y={cy + 3} fontSize={10} textAnchor="end" fill={C.ink}>{c}</text></g> })}
      </g>
    )
  }
  return (
    <Svg h={270} label="Fishbone diagram">
      <line x1={60} x2={540} y1={140} y2={140} stroke={C.ink} strokeWidth={3} markerEnd="url(#arr)" />
      {top.map((b, i) => bone(b, i, true))}{bot.map((b, i) => bone(b, i, false))}
      <Box x={545} y={110} w={90} h={60} text={s.effect} stroke={C.red} size={11} bold />
    </Svg>
  )
}

function Gantt({ s }: { s: Extract<VizSpec, { t: 'gantt' }> }) {
  const end = Math.max(...s.tasks.map((t) => t[1] + t[2])), X = (v: number) => 170 + (v / end) * 450
  return (
    <Svg h={s.tasks.length * 34 + 40} label="Gantt chart">
      {Array.from({ length: end + 1 }, (_, i) => i).filter((i) => i % Math.ceil(end / 10) === 0).map((i) => <g key={i}><line x1={X(i)} x2={X(i)} y1={10} y2={s.tasks.length * 34 + 14} stroke={C.line} /><text x={X(i)} y={s.tasks.length * 34 + 30} fontSize={10} textAnchor="middle" fill={C.ink2}>{i}</text></g>)}
      {s.tasks.map(([n, st, d, crit], i) => <g key={n}><text x={160} y={30 + i * 34} textAnchor="end" fontSize={11} fill={C.ink}>{n}</text><rect x={X(st)} y={16 + i * 34} width={X(st + d) - X(st)} height={22} rx={4} fill={crit ? C.red : C.blue} opacity={0.85} /></g>)}
    </Svg>
  )
}

function Network({ s }: { s: Extract<VizSpec, { t: 'network' }> }) {
  const H = s.h || 240, N = Object.fromEntries(s.nodes.map((n) => [n.id, n]))
  return (
    <Svg h={H} label="Network diagram">
      {s.edges.map(([a, b, l], i) => { const p = N[a], q = N[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), k = 50 / d; return <Arrow key={i} x1={p.x + dx * k} y1={p.y + dy * (24 / d)} x2={q.x - dx * k} y2={q.y - dy * (24 / d)} label={l} /> })}
      {s.nodes.map((n) => <Box key={n.id} x={n.x - 50} y={n.y - 22} w={100} h={44} text={n.label} stroke={n.hl ? C.red : C.blue} fill={n.hl ? 'color-mix(in srgb, var(--color-sred) 8%, var(--color-sheet))' : C.sheet} size={11} />)}
    </Svg>
  )
}

function Layers({ s }: { s: Extract<VizSpec, { t: 'layers' }> }) {
  let y = 10
  return (
    <Svg h={s.items.reduce((a, l) => a + (l.h || 34), 20) + (s.note ? 20 : 0)} label="Layer stack">
      {s.items.map((l) => { const h = l.h || 34, yy = y; y += h; return <g key={l.label}><rect x={80} y={yy} width={480} height={h - 2} fill={l.color} rx={3} /><text x={320} y={yy + h / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,.25)', strokeWidth: 2 }}>{l.label}</text></g> })}
      {s.note && <text x={320} y={y + 16} textAnchor="middle" fontSize={11} fill={C.ink2}>{s.note}</text>}
    </Svg>
  )
}

function Bars({ s }: { s: Extract<VizSpec, { t: 'bars' }> }) {
  const max = Math.max(...s.items.map((i) => i[1])), bh = 30
  return (
    <Svg h={s.items.length * (bh + 10) + 16} label="Bar chart">
      {s.items.map(([l, v, col], i) => <g key={l}><text x={190} y={10 + i * (bh + 10) + bh / 2 + 4} textAnchor="end" fontSize={12} fill={C.ink}>{l}</text><rect x={200} y={10 + i * (bh + 10)} width={(v / max) * 360} height={bh} rx={4} fill={col || PALETTE[i % PALETTE.length]} opacity={0.85} /><text x={206 + (v / max) * 360} y={10 + i * (bh + 10) + bh / 2 + 4} fontSize={12} fontWeight={700} fill={C.ink}>{v}{s.unit || ''}</text></g>)}
    </Svg>
  )
}

function Compare({ s }: { s: Extract<VizSpec, { t: 'compare' }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[s.a, s.b].map((side, i) => (
        <div key={side.title} className="rounded-lg border-2 p-4" style={{ borderColor: i ? 'var(--color-sorange)' : 'var(--color-sblue)' }}>
          <p className="wide mb-2 text-lg" style={{ color: i ? 'var(--color-sorange)' : 'var(--color-sblue)' }}>{side.title}</p>
          <ul className="list-disc space-y-1 pl-5 text-[0.95rem]">{side.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      ))}
    </div>
  )
}

function Queue({ s }: { s: Extract<VizSpec, { t: 'queue' }> }) {
  const c = s.servers || 3
  return (
    <Svg h={220} label="Queueing system">
      <text x={40} y={20} fontSize={11} fill={C.ink2}>Arrivals λ</text>
      {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 26} cy={110} r={10} fill={C.orange} opacity={0.5 + i * 0.2} />)}
      <Arrow x1={110} y1={110} x2={150} y2={110} />
      <rect x={155} y={88} width={200} height={44} rx={6} fill="none" stroke={C.ink2} strokeDasharray="5 4" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={175 + i * 32} cy={110} r={11} fill={C.blue} opacity={0.85} />)}
      <text x={255} y={150} fontSize={11} textAnchor="middle" fill={C.ink2}>Queue (Lq, Wq)</text>
      {Array.from({ length: c }, (_, i) => { const y = 110 + (i - (c - 1) / 2) * 56; return <g key={i}><Arrow x1={360} y1={110} x2={440} y2={y} /><rect x={445} y={y - 20} width={90} height={40} rx={8} fill={C.sheet} stroke={C.green} strokeWidth={2} /><text x={490} y={y + 4} textAnchor="middle" fontSize={11} fill={C.ink}>Server {i + 1} (μ)</text><Arrow x1={537} y1={y} x2={600} y2={110} /></g> })}
      <text x={600} y={100} fontSize={11} fill={C.ink2} textAnchor="end">Departures</text>
    </Svg>
  )
}

function Control() {
  const vals = [0.2, -0.5, 0.8, -0.2, 0.4, -1.1, 0.3, 1.2, -0.4, 0.6, -0.8, 0.1, 3.4, 0.5, -0.3]
  const X = (i: number) => 60 + i * 38, Y = (z: number) => 120 - z * 28
  return (
    <Svg h={240} label="Control chart">
      {[3, -3].map((z) => <g key={z}><line x1={50} x2={620} y1={Y(z)} y2={Y(z)} stroke={C.red} strokeDasharray="6 4" /><text x={622} y={Y(z) + 4} fontSize={10} fill={C.red}>{z > 0 ? 'UCL' : 'LCL'}</text></g>)}
      <line x1={50} x2={620} y1={Y(0)} y2={Y(0)} stroke={C.ink2} /><text x={622} y={Y(0) + 4} fontSize={10} fill={C.ink2}>CL</text>
      <polyline points={vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={2} />
      {vals.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={v > 3 ? 7 : 4} fill={v > 3 ? C.tape : C.ink} stroke={v > 3 ? C.ink : 'none'} strokeWidth={2} />)}
      <text x={X(12) + 10} y={Y(3.4) + 4} fontSize={11} fill={C.ink} fontWeight={700}>special cause → investigate</text>
      <text x={330} y={232} fontSize={11} textAnchor="middle" fill={C.ink2}>Points inside the limits = common-cause noise. Don’t adjust for them.</text>
    </Svg>
  )
}

function Scatter({ s }: { s: Extract<VizSpec, { t: 'scatter' }> }) {
  const pts = s.clusters
    ? [[110, 80], [130, 100], [95, 110], [140, 70], [120, 125], [420, 70], [450, 95], [400, 90], [470, 60], [440, 120], [260, 180], [290, 200], [240, 205], [300, 170], [270, 215]]
    : Array.from({ length: 16 }, (_, i) => [70 + i * 34, 200 - i * 10 + ((i * 37) % 23) - 11])
  return (
    <Svg h={240} label="Scatter plot">
      <line x1={50} x2={620} y1={225} y2={225} stroke={C.line} /><line x1={50} x2={50} y1={10} y2={225} stroke={C.line} />
      {s.line && <line x1={60} y1={205} x2={600} y2={45} stroke={C.blue} strokeWidth={2.5} />}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill={s.clusters ? PALETTE[Math.floor(i / 5)] : C.ink} opacity={0.85} />)}
      {s.clusters && [[118, 97], [436, 87], [272, 194]].map(([x, y], i) => <rect key={i} x={x - 8} y={y - 8} width={16} height={16} transform={`rotate(45 ${x} ${y})`} fill={PALETTE[i]} stroke={C.ink} strokeWidth={2} />)}
    </Svg>
  )
}

/** Every concept gets at least this: a mini map of what it connects to. */
export function MiniMap({ c }: { c: Concept }) {
  const nav = useNavigate()
  const near = neighbors(c).slice(0, 8)
  if (!near.length) return null
  const cx = 320, cy = 130, R = 100
  return (
    <svg viewBox="0 0 640 260" className="w-full" role="img" aria-label={`Concepts connected to ${c.term}`}>
      {near.map((n, i) => { const a = (2 * Math.PI * i) / near.length - Math.PI / 2, x = cx + R * 2.3 * Math.cos(a) * 0.95, y = cy + R * Math.sin(a); return <line key={'e' + n.id} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth={2} /> })}
      {near.map((n, i) => {
        const a = (2 * Math.PI * i) / near.length - Math.PI / 2, x = cx + R * 2.3 * Math.cos(a) * 0.95, y = cy + R * Math.sin(a)
        return <g key={n.id} className="cursor-pointer" onClick={() => nav(`/c/${n.id}`)}><Box x={x - 62} y={y - 18} w={124} h={36} text={n.term} stroke={DOMAIN_MAP[n.domain].tape} size={11} /></g>
      })}
      <Box x={cx - 75} y={cy - 24} w={150} h={48} text={c.term} fill={DOMAIN_MAP[c.domain].tape} stroke={DOMAIN_MAP[c.domain].tape} color="#fff" size={13} bold />
    </svg>
  )
}

export function Viz({ spec }: { spec: VizSpec }) {
  switch (spec.t) {
    case 'bell': return <Bell s={spec} />
    case 'cycle': return <Cycle s={spec} />
    case 'steps': return <Steps s={spec} />
    case 'pyramid': return <Pyramid s={spec} />
    case 'bathtub': return <Bathtub />
    case 'tree': return <Tree s={spec} />
    case 'bowtie': return <Bowtie s={spec} />
    case 'matrix': return <Matrix s={spec} />
    case 'vmodel': return <VModel />
    case 'curve': return <Curve s={spec} />
    case 'pareto': return <Pareto s={spec} />
    case 'fishbone': return <Fishbone s={spec} />
    case 'gantt': return <Gantt s={spec} />
    case 'network': return <Network s={spec} />
    case 'layers': return <Layers s={spec} />
    case 'bars': return <Bars s={spec} />
    case 'compare': return <Compare s={spec} />
    case 'queue': return <Queue s={spec} />
    case 'control': return <Control />
    case 'scatter': return <Scatter s={spec} />
  }
}
