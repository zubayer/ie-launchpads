import { useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/ui'
import { JobsList, type ListState } from '../components/JobsBrowser'
import { isRole } from '../lib/jobsFeed'

/** Every open IE role from the weekly collection; role, page and search live in the address so a list can be shared. */
export function Jobs() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role')
  const state: ListState = { role: isRole(role) ? role : null, page: Number(params.get('page')) || 1, q: params.get('q') || '' }
  const onChange = (s: ListState) => {
    const next = new URLSearchParams()
    if (s.role) next.set('role', s.role)
    if (s.page > 1) next.set('page', String(s.page))
    if (s.q) next.set('q', s.q)
    setParams(next, { replace: s.q !== state.q }) // typing doesn't fill the back button; role and page changes do
  }
  return (
    <div className="max-w-4xl">
      <PageHead title="Open IE roles" sub="Industrial, quality, continuous-improvement, manufacturing and planning roles open on employer careers pages, plus federal Industrial Engineering jobs from USAJOBS. Collected every Monday." />
      <section className="sheet rounded-lg p-5" aria-label="Job list"><JobsList state={state} onChange={onChange} /></section>
    </div>
  )
}
