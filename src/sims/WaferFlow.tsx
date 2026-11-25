import { useState } from 'react'
import { Challenges, Panel, Predict } from './kit'

const STEPS = [
  { name: 'Bare silicon wafer', tool: 'Wafer start', text: 'A polished 300 mm single-crystal silicon wafer (grown by the Czochralski process) enters the fab. Every later step is either adding, patterning, removing or modifying a thin layer.' },
  { name: 'Thermal oxidation', tool: 'Oxidation / diffusion furnace', text: 'At 900–1200 °C in O₂ (dry) or steam (wet), silicon reacts to form SiO₂. The oxide grows partly into the silicon. Dry oxide is slower and denser (gate oxides); wet is faster (thick field oxides).' },
  { name: 'Spin-coat photoresist', tool: 'Coater / track', text: 'Liquid photoresist is dispensed and spun at thousands of rpm into a uniform film, then soft-baked to drive out solvent.' },
  { name: 'Expose through a mask', tool: 'Scanner (DUV 193 nm or EUV 13.5 nm)', text: 'Light passes through the reticle and projection lens. Resolution ≈ k₁·λ/NA — shorter wavelength and higher numerical aperture print smaller features. Overlay to the previous layer must be within nanometres.' },
  { name: 'Post-exposure bake & develop', tool: 'Track', text: 'With positive resist, exposed areas become soluble and wash away in developer, leaving a resist pattern. CD-SEM then measures the critical dimension (CD).' },
  { name: 'Etch the oxide', tool: 'Plasma (dry) or wet bench', text: 'Etch removes oxide where resist is open. Dry plasma / RIE etch is anisotropic — straight walls. Wet etch (e.g., HF for oxide) is isotropic — it undercuts the resist. Key metrics: etch rate, selectivity, uniformity, profile.' },
  { name: 'Strip resist & clean', tool: 'Asher, wet clean', text: 'Oxygen plasma ashing removes the resist; wet cleans (RCA-style SC-1/SC-2) remove particles, organics and metals. The patterned oxide remains.' },
  { name: 'Ion implantation', tool: 'Ion implanter, then anneal (RTP)', text: 'Dopant ions (B for p-type, P/As for n-type) are accelerated into exposed silicon; the oxide blocks them elsewhere. Dose sets concentration, energy sets depth. An anneal repairs lattice damage and activates the dopant.' },
  { name: 'Deposit a film', tool: 'PVD (sputter), CVD/PECVD, or ALD', text: 'Material is added on top. PVD is line-of-sight (poor step coverage in deep trenches). CVD is more conformal; ALD builds the film one atomic layer per cycle — near-perfect conformality and thickness control.' },
  { name: 'CMP planarization', tool: 'Chemical mechanical polisher', text: 'A rotating pad with chemical slurry polishes the wafer flat so the next lithography layer can focus. Watch for dishing and erosion. Repeat this loop 50–100+ times for a modern chip.' },
]

export default function WaferFlow() {
  const [i, setI] = useState(0)
  const [aniso, setAniso] = useState(true)
  const [ald, setAld] = useState(true)
  const s = STEPS[i]
  const W = 600, Y0 = 200
  const ox = i >= 1, resist = i >= 2 && i <= 5, exposed = i >= 3, developed = i >= 4, etched = i >= 5, stripped = i >= 6, implanted = i >= 7, deposited = i >= 8, polished = i >= 9
  const open = [[220, 300], [380, 440]] // openings in the mask
  const under = aniso ? 0 : 18
  return (
    <div className="space-y-4">
      <Predict prompt="Why would a fab choose a slow, expensive ALD step over faster sputtering for a film inside a deep trench?" />
      <Panel>
        <svg viewBox={`0 0 ${W} 280`} className="w-full" role="img" aria-label={`Wafer cross-section: ${s.name}`}>
          {/* silicon */}
          <rect x="20" y={Y0} width={W - 40} height="70" fill="#8a9099" />
          <text x="30" y={Y0 + 60} fontSize="12" fill="#fff">Si substrate</text>
          {implanted && open.map(([a, b], k) => <rect key={k} x={a - under} y={Y0} width={b - a + 2 * under} height="16" fill="#c95b8f" opacity="0.8" />)}
          {/* oxide with openings after etch */}
          {ox && (etched ? (
            <g fill="#7fb3d5">
              <rect x="20" y={Y0 - 30} width={open[0][0] - 20 - under} height="30" />
              <rect x={open[0][1] + under} y={Y0 - 30} width={open[1][0] - open[0][1] - 2 * under} height="30" />
              <rect x={open[1][1] + under} y={Y0 - 30} width={W - 20 - open[1][1] - under} height="30" />
            </g>
          ) : <rect x="20" y={Y0 - 30} width={W - 40} height="30" fill="#7fb3d5" />)}
          {ox && !deposited && <text x="30" y={Y0 - 10} fontSize="12" fill="#123">SiO₂</text>}
          {/* resist */}
          {resist && !stripped && (developed ? (
            <g fill="#e8a33d">
              <rect x="20" y={Y0 - 52} width={open[0][0] - 20} height="22" />
              <rect x={open[0][1]} y={Y0 - 52} width={open[1][0] - open[0][1]} height="22" />
              <rect x={open[1][1]} y={Y0 - 52} width={W - 20 - open[1][1]} height="22" />
            </g>
          ) : <rect x="20" y={Y0 - 52} width={W - 40} height="22" fill="#e8a33d" />)}
          {resist && exposed && !developed && open.map(([a, b], k) => <rect key={k} x={a} y={Y0 - 52} width={b - a} height="22" fill="#f6d28b" />)}
          {/* mask + light */}
          {i === 3 && (
            <g>
              <rect x="20" y="40" width={W - 40} height="12" fill="var(--color-ink)" />
              {open.map(([a, b], k) => <rect key={k} x={a} y="40" width={b - a} height="12" fill="var(--color-sheet)" />)}
              {open.map(([a, b], k) => Array.from({ length: 5 }, (_, j) => a + ((b - a) * (j + 0.5)) / 5).map((xx) => <line key={k + '-' + xx} x1={xx} x2={xx} y1="10" y2={Y0 - 54} stroke="#7b5cd6" strokeWidth="2" strokeDasharray="5 4" />))}
              <text x={W - 24} y="34" fontSize="12" textAnchor="end" fill="var(--color-ink-2)">reticle (mask)</text>
            </g>
          )}
          {/* deposited film */}
          {deposited && !polished && (ald ? (
            <path d={`M20 ${Y0 - 42} H${open[0][0] - under - 12} V${Y0 - 12} ${aniso ? '' : ''}H${open[0][1] + under + 12} V${Y0 - 42} H${open[1][0] - under - 12} V${Y0 - 12} H${open[1][1] + under + 12} V${Y0 - 42} H${W - 20} V${Y0 - 30} H${open[1][1] + under} V${Y0} H${open[1][0] - under} V${Y0 - 30} H${open[0][1] + under} V${Y0} H${open[0][0] - under} V${Y0 - 30} H20 Z`} fill="#c9a227" />
          ) : (
            <g fill="#c9a227">
              <rect x="20" y={Y0 - 50} width={W - 40} height="20" />
              {open.map(([a, b], k) => <rect key={k} x={a - under + 10} y={Y0 - 8} width={b - a + 2 * under - 20} height="8" />)}
              {open.map(([a, b], k) => <path key={'v' + k} d={`M${a - under} ${Y0 - 30} h10 l-4 16 h-6 Z M${b + under} ${Y0 - 30} h-10 l4 16 h6 Z`} />)}
            </g>
          ))}
          {polished && open.map(([a, b], k) => <rect key={k} x={a - under} y={Y0 - 30} width={b - a + 2 * under} height="30" fill="#c9a227" />)}
          {polished && <line x1="20" x2={W - 20} y1={Y0 - 30} y2={Y0 - 30} stroke="var(--color-sgreen)" strokeWidth="2" strokeDasharray="6 4" />}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className="btn-ghost btn" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>Previous step</button>
          <button className="btn" onClick={() => setI((x) => Math.min(STEPS.length - 1, x + 1))} disabled={i === STEPS.length - 1}>Next step</button>
          <span className="text-sm text-ink-2">Step {i + 1} of {STEPS.length}</span>
          <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={aniso} onChange={(e) => setAniso(e.target.checked)} /> Anisotropic (dry) etch</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ald} onChange={(e) => setAld(e.target.checked)} /> Conformal deposition (ALD/CVD)</label>
        </div>
      </Panel>
      <Panel>
        <h2 className="wide text-xl">{s.name}</h2>
        <p className="text-sm text-ink-2">{s.tool}</p>
        <p className="measure mt-2">{s.text}</p>
        <ol className="mt-4 flex flex-wrap gap-1 text-xs">
          {STEPS.map((x, k) => <li key={k}><button onClick={() => setI(k)} className={`chip ${k === i ? '!border-ink !text-ink font-semibold' : ''}`}>{k + 1}. {x.name}</button></li>)}
        </ol>
      </Panel>
      <Challenges items={['Toggle wet (isotropic) etch at step 6. What happens under the resist edge, and why does that limit feature size?', 'At step 9, compare sputtering and ALD in the trench. Where would a void form?', 'Which steps add material, which remove it, which pattern it, and which modify it?']} />
    </div>
  )
}
