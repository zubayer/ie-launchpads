import { useState } from 'react'
import { Challenges, Panel, Predict } from './kit'

interface Side { name: string; barriers: string[] }
const INIT = {
  hazard: 'Hydrofluoric (HF) acid in a wet-etch bench',
  top: 'Loss of containment — HF released outside the bench',
  threats: [
    { name: 'Supply line or fitting ruptures', barriers: ['Double-contained chemical lines', 'Leak sensor with auto shut-off valve'] },
    { name: 'Tank overfill during chemical change', barriers: ['High-level interlock stops fill pump', 'Two-person verification in the procedure'] },
    { name: 'Operator spill while handling', barriers: ['Automated dispense (no manual pouring)', 'Training and chemical-handling certification'] },
  ] as Side[],
  consequences: [
    { name: 'Chemical burn / systemic HF exposure', barriers: ['Face shield, apron and HF-rated gloves', 'Calcium gluconate gel and safety shower within 10 s', 'Emergency response and medical protocol'] },
    { name: 'Release to drains / environment', barriers: ['Secondary containment tray', 'Acid waste neutralization system'] },
    { name: 'Tool down, wafers scrapped', barriers: ['Spill response kit and trained responders'] },
  ] as Side[],
}

function Column({ title, items, onChange, color, side }: { title: string; items: Side[]; onChange: (s: Side[]) => void; color: string; side: 'left' | 'right' }) {
  return (
    <div>
      <p className="label mb-2">{title}</p>
      <div className="space-y-3">
        {items.map((t, i) => (
          <div key={i} className={`flex items-stretch gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 rounded-md border-2 p-2" style={{ borderColor: color }}>
              <input className="w-full bg-transparent font-semibold outline-none" value={t.name} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} aria-label={title} />
            </div>
            <div className={`flex flex-wrap items-center gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
              {t.barriers.map((b, j) => (
                <span key={j} className="group relative flex max-w-[11rem] items-center rounded-sm border-y-4 border-ink bg-sheet px-2 py-1 text-xs">
                  {b}
                  <button className="ml-1 text-ink-2 hover:text-sred" aria-label={`Remove barrier ${b}`}
                    onClick={() => onChange(items.map((x, k) => (k === i ? { ...x, barriers: x.barriers.filter((_, q) => q !== j) } : x)))}>×</button>
                </span>
              ))}
              <button className="chip !text-xs" onClick={() => {
                const name = prompt('Barrier name')
                if (name) onChange(items.map((x, k) => (k === i ? { ...x, barriers: [...x.barriers, name] } : x)))
              }}>+ barrier</button>
            </div>
          </div>
        ))}
        <button className="btn-ghost btn !py-1 text-sm" onClick={() => onChange([...items, { name: 'New item', barriers: [] }])}>Add {side === 'left' ? 'threat' : 'consequence'}</button>
      </div>
    </div>
  )
}

export default function BowTie() {
  const [s, setS] = useState(INIT)
  const weak = [...s.threats, ...s.consequences].filter((x) => x.barriers.length < 2)
  return (
    <div className="space-y-4">
      <Predict prompt="Which side of a bow-tie stops the event from happening, and which side limits the damage once it has happened?" />
      <Panel>
        <div className="mb-4 text-center">
          <div className="hazard mx-auto mb-2 h-2 w-40 rounded-sm" />
          <p className="label">Hazard</p>
          <input className="input mx-auto max-w-lg text-center font-semibold" value={s.hazard} onChange={(e) => setS({ ...s, hazard: e.target.value })} aria-label="Hazard" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_14rem_1fr] lg:items-center">
          <Column title="Threats → preventive barriers" side="left" color="var(--color-sblue)" items={s.threats} onChange={(threats) => setS({ ...s, threats })} />
          <div className="flex items-center justify-center">
            <div className="flex aspect-square w-48 items-center justify-center rounded-full border-4 border-sred bg-sred/10 p-4 text-center">
              <textarea className="w-full resize-none bg-transparent text-center font-semibold outline-none" rows={4} value={s.top} onChange={(e) => setS({ ...s, top: e.target.value })} aria-label="Top event" />
            </div>
          </div>
          <Column title="Mitigative barriers → consequences" side="right" color="var(--color-sorange)" items={s.consequences} onChange={(consequences) => setS({ ...s, consequences })} />
        </div>
      </Panel>
      <Panel>
        <p className="text-sm"><strong>Barrier check:</strong> {weak.length ? `${weak.length} path${weak.length > 1 ? 's have' : ' has'} fewer than two barriers: ${weak.map((w) => w.name).join('; ')}.` : 'Every threat and consequence has at least two barriers.'} A common rule of thumb is at least two independent barriers per path; training and procedures are weaker than engineered barriers.</p>
      </Panel>
      <Challenges items={['Classify each barrier with the hierarchy of controls. How many are engineering controls?', 'Add an escalation factor: what could make the safety shower fail?', 'Build a bow-tie for a forklift–pedestrian collision in a warehouse.']} />
    </div>
  )
}
