import type { ReactNode } from 'react'

export function Slider({ label, value, min, max, step = 1, onChange, unit = '', fmt }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; fmt?: (v: number) => string
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm"><span className="font-medium">{label}</span><span className="text-ink-2">{fmt ? fmt(value) : value}{unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  )
}

export function Num({ label, value, onChange, step = 1, min, max, className = '' }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <input type="number" className="input mt-1" value={Number.isFinite(value) ? value : ''} step={step} min={min} max={max}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
    </label>
  )
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'bad' | 'warn' }) {
  const c = tone === 'good' ? 'text-sgreen' : tone === 'bad' ? 'text-sred' : tone === 'warn' ? 'text-sorange' : ''
  return (
    <div className="rounded-md border border-line px-3 py-2">
      <div className="text-xs text-ink-2">{label}</div>
      <div className={`wide text-xl ${c}`}>{value}</div>
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`sheet rounded-lg p-4 sm:p-5 ${className}`}>{children}</div>
}

export function Predict({ prompt, children }: { prompt: string; children?: ReactNode }) {
  return (
    <div className="mb-4 border-l-4 border-tape bg-tape/10 px-4 py-3 text-[0.95rem]">
      <strong>Predict first:</strong> {prompt} {children}
    </div>
  )
}

export function Challenges({ items }: { items: string[] }) {
  return (
    <div className="mt-4">
      <p className="label mb-1">Challenges</p>
      <ol className="list-decimal space-y-1 pl-5 text-[0.95rem]">{items.map((x) => <li key={x}>{x}</li>)}</ol>
    </div>
  )
}

/** Linear scale helper for hand-drawn SVG charts. */
export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0)

export function Axes({ w, h, pad, xTicks, yTicks, x, y, xLabel, yLabel }: {
  w: number; h: number; pad: number; xTicks: number[]; yTicks: number[]; x: (v: number) => number; y: (v: number) => number; xLabel?: string; yLabel?: string
}) {
  return (
    <g fontSize="11" fill="var(--color-ink-2)">
      <line x1={pad} x2={w - 8} y1={h - pad} y2={h - pad} stroke="var(--color-line)" />
      <line x1={pad} x2={pad} y1={8} y2={h - pad} stroke="var(--color-line)" />
      {xTicks.map((t) => <text key={'x' + t} x={x(t)} y={h - pad + 15} textAnchor="middle">{+t.toFixed(2)}</text>)}
      {yTicks.map((t) => (
        <g key={'y' + t}>
          <line x1={pad} x2={w - 8} y1={y(t)} y2={y(t)} stroke="var(--color-grid)" />
          <text x={pad - 5} y={y(t) + 4} textAnchor="end">{+t.toFixed(2)}</text>
        </g>
      ))}
      {xLabel && <text x={(w + pad) / 2} y={h - 4} textAnchor="middle">{xLabel}</text>}
      {yLabel && <text x={12} y={h / 2} textAnchor="middle" transform={`rotate(-90 12 ${h / 2})`}>{yLabel}</text>}
    </g>
  )
}

export const ticks = (lo: number, hi: number, n = 5) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n)
