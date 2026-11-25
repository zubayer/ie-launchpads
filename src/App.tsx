import { lazy, Suspense, type ComponentType } from 'react'
import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ConceptPage from './pages/ConceptPage'

const page = <M extends Record<string, unknown>>(f: () => Promise<M>, name: keyof M) =>
  lazy(() => f().then((m) => ({ default: m[name] as ComponentType })))
const Directory = page(() => import('./pages/Browse'), 'Directory')
const Domains = page(() => import('./pages/Browse'), 'Domains')
const DomainPage = page(() => import('./pages/Browse'), 'DomainPage')
const CheatSheet = page(() => import('./pages/Browse'), 'CheatSheet')
const Review = page(() => import('./pages/Study'), 'Review')
const Practice = page(() => import('./pages/Study'), 'Practice')
const Lab = page(() => import('./pages/Lab'), 'Lab')
const LabPage = page(() => import('./pages/Lab'), 'LabPage')
const Roles = page(() => import('./pages/Career'), 'Roles')
const RolePage = page(() => import('./pages/Career'), 'RolePage')
const Interview = page(() => import('./pages/Career'), 'Interview')
const Plan = page(() => import('./pages/Misc'), 'Plan')
const Graph = page(() => import('./pages/Misc'), 'Graph')
const Progress = page(() => import('./pages/Misc'), 'Progress')
const Academy = page(() => import('./pages/Academy'), 'Academy')
const Curriculum = page(() => import('./pages/Curriculum'), 'Curriculum')
const Formulas = page(() => import('./pages/Formulas'), 'Formulas')
const Notebook = page(() => import('./pages/Notebook'), 'Notebook')
const Method = page(() => import('./pages/Misc'), 'Method')

function NotFound() {
  return (
    <div>
      <h1 className="display text-3xl">Page not found</h1>
      <p className="mt-2">That address doesn't match a page. <Link className="underline" to="/">Go to Today</Link> or press / to search.</p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<p className="p-8 text-ink-2">Loading…</p>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="directory" element={<Directory />} />
          <Route path="domains" element={<Domains />} />
          <Route path="d/:id" element={<DomainPage />} />
          <Route path="d/:id/cheatsheet" element={<CheatSheet />} />
          <Route path="c/:id" element={<ConceptPage />} />
          <Route path="review" element={<Review />} />
          <Route path="practice" element={<Practice />} />
          <Route path="lab" element={<Lab />} />
          <Route path="lab/:id" element={<LabPage />} />
          <Route path="roles" element={<Roles />} />
          <Route path="roles/:id" element={<RolePage />} />
          <Route path="interview" element={<Interview />} />
          <Route path="plan" element={<Plan />} />
          <Route path="graph" element={<Graph />} />
          <Route path="progress" element={<Progress />} />
          <Route path="academy" element={<Academy />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="formulas" element={<Formulas />} />
          <Route path="notebook" element={<Notebook />} />
          <Route path="method" element={<Method />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </HashRouter>
  )
}
