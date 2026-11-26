import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MateLab } from '../components/CadLabs'

/** Assembly mates lab: which motions remain after each mate. */
export default function MateDof() {
  const [picked, setPicked] = useState<string[]>([])
  return (
    <div className="space-y-3">
      <MateLab picked={picked} setPicked={setPicked} />
      <p className="text-sm">The full lesson, with practice: <Link className="font-semibold underline" to="/studio/cad/mates">CAD studio: assemblies, mates and degrees of freedom</Link></p>
    </div>
  )
}
