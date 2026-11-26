import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PartCountLab } from '../components/CadLabs'

export default function DfaCount() {
  const [answers, setAnswers] = useState<Record<string, [boolean, boolean, boolean]>>({})
  const [reveal, setReveal] = useState(false)
  return (
    <div className="space-y-3">
      <PartCountLab answers={answers} setAnswers={setAnswers} reveal={reveal} />
      <button type="button" className="btn-ghost btn !py-1.5" onClick={() => setReveal(!reveal)} aria-expanded={reveal}>{reveal ? 'Hide the reasoning' : 'Show the reasoning for each part'}</button>
      <p className="text-sm">The full lesson, with practice: <Link className="font-semibold underline" to="/studio/cad/dfx">CAD studio: DFM and DFA</Link></p>
    </div>
  )
}
