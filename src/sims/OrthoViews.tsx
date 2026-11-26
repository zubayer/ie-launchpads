import { Link } from 'react-router-dom'
import { ViewsLab } from '../components/CadLabs'

export default function OrthoViews() {
  return (
    <div className="space-y-3">
      <ViewsLab />
      <p className="text-sm">The full lesson: <Link className="font-semibold underline" to="/studio/cad/drawings">CAD studio: drawings, views and projection</Link></p>
    </div>
  )
}
