import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SIM_META } from '../sims/registry'
import { CONCEPT_MAP } from '../content'
import { DOMAIN_MAP, DOMAINS } from '../content/domains'
import { PageHead } from '../components/ui'

export function Lab() {
  const groups = DOMAINS.map((d) => ({ d, sims: SIM_META.filter((s) => s.domain === d.id) })).filter((g) => g.sims.length)
  return (
    <div>
      <PageHead title="Simulator lab" sub={`${SIM_META.length} hands-on tools. Each starts with a prediction — guess first, then run it. Being wrong before you see the answer is what makes it stick.`} />
      <div className="grid gap-x-10 md:grid-cols-2">
        {groups.map(({ d, sims }) => (
          <section key={d.id} className="mb-6">
            <h2 className="wide mb-1 flex items-center gap-2 text-lg"><span className="inline-block h-2 w-6 rounded-sm" style={{ background: d.tape }} />{d.name}</h2>
            {sims.map((s) => (
              <Link key={s.id} to={`/lab/${s.id}`} className="block border-b border-line py-2.5 hover:bg-sblue/5">
                <span className="font-semibold">{s.name}</span>
                <span className="block text-sm text-ink-2">{s.blurb}</span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

export function LabPage() {
  const { id = '' } = useParams()
  const s = SIM_META.find((x) => x.id === id)
  if (!s) return <p>Simulator not found. <Link className="underline" to="/lab">All simulators</Link></p>
  const Comp = s.load
  const d = DOMAIN_MAP[s.domain]
  return (
    <div>
      <PageHead title={s.name} sub={s.blurb} tape={d.tape}>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link to={`/d/${d.id}`} className="chip hover:border-ink">{d.name}</Link>
          {s.concepts.filter((c) => CONCEPT_MAP[c]).map((c) => <Link key={c} to={`/c/${c}`} className="chip hover:border-ink">Card: {CONCEPT_MAP[c].term}</Link>)}
        </div>
      </PageHead>
      <Suspense fallback={<p className="text-ink-2">Loading the simulator…</p>}>
        <Comp />
      </Suspense>
    </div>
  )
}
