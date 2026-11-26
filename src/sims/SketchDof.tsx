import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SketchLab } from '../components/CadLabs'
import { SKETCHES } from '../content/cad/course'

/** Sketch degrees-of-freedom lab: tick relations and dimensions, watch the solver count. */
export default function SketchDof() {
  const [preset, setPreset] = useState(SKETCHES[0].id)
  const [picked, setPicked] = useState<string[]>([])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sketch">
        {SKETCHES.map((s) => <button key={s.id} type="button" aria-pressed={preset === s.id} className={`chip !text-sm ${preset === s.id ? '!border-ink !text-ink bg-paper font-semibold' : ''}`} onClick={() => { setPreset(s.id); setPicked([]) }}>{s.title}</button>)}
      </div>
      <SketchLab preset={preset} picked={picked} setPicked={setPicked} />
      <p className="text-sm">The full lesson, with practice: <Link className="font-semibold underline" to="/studio/cad/sketch">CAD studio: sketches, relations and degrees of freedom</Link></p>
    </div>
  )
}
