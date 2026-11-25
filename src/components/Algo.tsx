import { useEffect, useState } from 'react'
import type { Algo } from '../content/algos'

export function AlgoFlow({ algo }: { algo: Algo }) {
  const [active, setActive] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [code, setCode] = useState(false)
  const n = algo.nodes.length
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setActive((a) => { if (a >= n - 1) { setPlaying(false); return a } return a + 1 }), 1100)
    return () => clearInterval(t)
  }, [playing, n])
  return (
    <div>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <span className="wide mr-2">{algo.name}</span>
        <button className="btn !py-1.5" onClick={() => { if (active >= n - 1) setActive(-1); setPlaying((p) => !p) }}>{playing ? 'Pause' : active >= 0 && active < n - 1 ? 'Resume' : 'Play the steps'}</button>
        <button className="btn-ghost btn !py-1.5" onClick={() => { setPlaying(false); setActive((a) => Math.min(n - 1, a + 1)) }}>Next step</button>
        <button className="btn-ghost btn !py-1.5" onClick={() => { setPlaying(false); setActive(-1) }}>Reset</button>
        {algo.code && <button className="btn-ghost btn !py-1.5" onClick={() => setCode((c) => !c)}>{code ? 'Hide pseudocode' : 'Show pseudocode'}</button>}
      </div>
      <div className={`grid gap-4 ${code ? 'lg:grid-cols-[1fr_1fr]' : ''}`}>
        <ol className="space-y-0">
          {algo.nodes.map((nd, i) => {
            const on = i === active, done = i < active
            const shape = nd.k === 'decision' ? 'border-sorange border-2 rounded-md' : nd.k === 'start' || nd.k === 'end' ? 'border-sblue border-2 rounded-full' : 'border-line border rounded-md'
            return (
              <li key={i} className="flex flex-col items-center">
                <div className={`w-full max-w-xl bg-sheet px-4 py-2.5 transition-all ${shape} ${on ? 'algo-active' : ''} ${done ? 'opacity-70' : ''}`} onClick={() => setActive(i)} role="button" tabIndex={0}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold ${nd.k === 'decision' ? 'bg-sorange text-white' : 'bg-sblue text-white'}`}>{nd.k === 'decision' ? '?' : i + 1}</span>
                    <span className="flex-1">
                      <span className={nd.k === 'decision' ? 'font-semibold' : ''}>{nd.text}</span>
                      {nd.k === 'decision' && (nd.yes || nd.no) && (
                        <span className="mt-1 flex flex-wrap gap-x-4 text-sm">
                          {nd.yes && <span className="text-sgreen">✓ {nd.yes}</span>}
                          {nd.no && <span className="text-sorange">✗ {nd.no}</span>}
                          {nd.back !== undefined && nd.back < n && <span className="text-ink-2">↺ loops back to step {nd.back + 1}</span>}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {i < n - 1 && <div className={`h-5 w-0.5 ${done || on ? 'bg-sblue' : 'bg-line'}`} aria-hidden />}
              </li>
            )
          })}
        </ol>
        {code && algo.code && <pre className="h-fit overflow-auto rounded-md bg-ink p-4 text-xs leading-relaxed text-sheet"><code>{algo.code}</code></pre>}
      </div>
      {algo.note && <p className="mt-3 text-sm text-ink-2">{algo.note}</p>}
    </div>
  )
}
