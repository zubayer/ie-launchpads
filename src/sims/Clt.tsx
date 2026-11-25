import { useRef, useState } from 'react'
import { makeRng, mean, phi, round, sd } from '../lib/math'
import { Challenges, Panel, Predict, Slider, Stat } from './kit'

type Pop = 'expo' | 'uniform' | 'bimodal'
const POP: Record<Pop, { name: string; mu: number; s: number }> = {
  expo: { name: 'Skewed (exponential repair times)', mu: 1, s: 1 },
  uniform: { name: 'Flat (uniform 0–2)', mu: 1, s: 2 / Math.sqrt(12) },
  bimodal: { name: 'Two-peaked (two machines)', mu: 1, s: Math.sqrt(0.09 + 0.36) },
}

export default function Clt() {
  const rng = useRef(makeRng(5))
  const [pop, setPop] = useState<Pop>('expo')
  const [n, setN] = useState(5)
  const [means, setMeans] = useState<number[]>([])
  const draw1 = () => {
    const r = rng.current
    if (pop === 'expo') return r.expo(1)
    if (pop === 'uniform') return r.u() * 2
    return r.u() < 0.5 ? r.normal(0.4, 0.3) : r.normal(1.6, 0.3)
  }
  const draw = (k: number) => setMeans((m) => [...m, ...Array.from({ length: k }, () => mean(Array.from({ length: n }, draw1)))].slice(-5000))
  const bins = 40, lo = 0, hi = 3
  const counts = Array(bins).fill(0)
  means.forEach((v) => { const b = Math.floor(((v - lo) / (hi - lo)) * bins); if (b >= 0 && b < bins) counts[b]++ })
  const maxC = Math.max(1, ...counts)
  const W = 640, H = 240, bw = (W - 20) / bins
  const se = POP[pop].s / Math.sqrt(n)
  const normY = (v: number) => (means.length * ((hi - lo) / bins) * phi((v - POP[pop].mu) / se)) / se
  const scaleY = (c: number) => H - 20 - (c / Math.max(maxC, normY(POP[pop].mu))) * (H - 30)
  return (
    <div className="space-y-4">
      <Predict prompt="Repair times are heavily skewed. If you average 30 of them at a time, what shape will the histogram of those averages have?" />
      <Panel>
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(POP) as Pop[]).map((p) => (
            <button key={p} onClick={() => { setPop(p); setMeans([]) }} aria-pressed={pop === p} className={`chip !text-sm ${pop === p ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>{POP[p].name}</button>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Histogram of sample means">
          {counts.map((c, i) => <rect key={i} x={10 + i * bw} width={bw - 1} y={scaleY(c)} height={H - 20 - scaleY(c)} fill="var(--color-sblue)" opacity={0.75} />)}
          {means.length > 20 && (
            <path fill="none" stroke="var(--color-sorange)" strokeWidth={2.5}
              d={Array.from({ length: 121 }, (_, i) => lo + (i * (hi - lo)) / 120).map((v, i) => `${i ? 'L' : 'M'}${10 + ((v - lo) / (hi - lo)) * (W - 20)} ${scaleY(normY(v))}`).join(' ')} />
          )}
          <line x1={10} x2={W - 10} y1={H - 20} y2={H - 20} stroke="var(--color-line)" />
          {[0, 1, 2, 3].map((t) => <text key={t} x={10 + (t / 3) * (W - 20)} y={H - 5} fontSize="11" textAnchor="middle" fill="var(--color-ink-2)">{t}</text>)}
        </svg>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Slider label="Sample size n (values averaged each draw)" value={n} min={1} max={50} onChange={(v) => { setN(v); setMeans([]) }} />
          <div className="flex gap-2 self-end">
            <button className="btn" onClick={() => draw(100)}>Draw 100 samples</button>
            <button className="btn-ghost btn" onClick={() => draw(1000)}>1,000</button>
          </div>
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Samples drawn" value={means.length} />
        <Stat label="Mean of means" value={means.length ? round(mean(means), 3) : '—'} />
        <Stat label="SD of means (observed)" value={means.length > 1 ? round(sd(means), 3) : '—'} />
        <Stat label="σ/√n (theory)" value={round(se, 3)} />
      </div>
      <Challenges items={['Set n = 1: you see the raw population. Then n = 5, 30.', 'Check that the SD of means ≈ σ/√n. Why is this why X̄ charts use subgroups?', 'Which population needs the largest n before averages look normal?']} />
    </div>
  )
}
