import { Link } from 'react-router-dom'
import { BeamLab } from '../components/CadLabs'

export default function BeamCheck() {
  return (
    <div className="space-y-3">
      <BeamLab />
      <p className="text-sm">The full lesson, with practice: <Link className="font-semibold underline" to="/studio/cad/analysis">CAD studio: hand calculations and factor of safety</Link></p>
    </div>
  )
}
