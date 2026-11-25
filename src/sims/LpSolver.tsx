import { useMemo, useState } from 'react'
import solver from 'javascript-lp-solver'
import { round } from '../lib/math'
import { Challenges, Panel, Predict, Stat } from './kit'

interface Product { name: string; profit: number; use: number[] }
interface Resource { name: string; cap: number }

const P0: Product[] = [
  { name: 'Chair', profit: 45, use: [2, 1, 3] },
  { name: 'Table', profit: 80, use: [3, 2, 6] },
  { name: 'Desk', profit: 110, use: [4, 3, 8] },
]
const R0: Resource[] = [
  { name: 'Carpentry hours', cap: 400 },
  { name: 'Finishing hours', cap: 250 },
  { name: 'Wood (board ft)', cap: 650 },
]

const key = (s: string, i: number) => `${s.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'x'}_${i}`

export function solveMix(products: Product[], res: Resource[], integer: boolean, capOverride?: number[]) {
  const constraints: Record<string, { max: number }> = {}
  res.forEach((r, j) => (constraints[key(r.name, j)] = { max: capOverride ? capOverride[j] : r.cap }))
  const variables: Record<string, Record<string, number>> = {}
  products.forEach((p, i) => {
    const v: Record<string, number> = { profit: p.profit }
    res.forEach((r, j) => (v[key(r.name, j)] = p.use[j] || 0))
    variables[key(p.name, i)] = v
  })
  const ints = integer ? Object.fromEntries(products.map((p, i) => [key(p.name, i), 1])) : undefined
  const out = solver.Solve({ optimize: 'profit', opType: 'max', constraints, variables, ...(ints ? { ints } : {}) } as never) as Record<string, number | boolean>
  const x = products.map((p, i) => Number(out[key(p.name, i)] || 0))
  return { feasible: !!out.feasible, z: Number(out.result || 0), x }
}

export default function LpSolver() {
  const [products, setProducts] = useState(P0)
  const [res, setRes] = useState(R0)
  const [integer, setInteger] = useState(false)
  const [tab, setTab] = useState<'gurobi' | 'pulp'>('gurobi')
  const sol = useMemo(() => solveMix(products, res, integer), [products, res, integer])
  const usage = res.map((_, j) => products.reduce((s, p, i) => s + (p.use[j] || 0) * sol.x[i], 0))
  // Shadow price = change in optimal profit per extra unit of a resource (LP relaxation, finite difference).
  const shadow = useMemo(() => res.map((r, j) => {
    const caps = res.map((q) => q.cap)
    caps[j] += 1
    return solveMix(products, res, false, caps).z - solveMix(products, res, false).z
  }), [products, res])

  const setP = (i: number, f: Partial<Product>) => setProducts((ps) => ps.map((p, k) => (k === i ? { ...p, ...f } : p)))
  const setR = (j: number, f: Partial<Resource>) => setRes((rs) => rs.map((r, k) => (k === j ? { ...r, ...f } : r)))
  const vn = (p: Product, i: number) => key(p.name, i)

  const gurobi = `import gurobipy as gp
from gurobipy import GRB

m = gp.Model("product_mix")
${products.map((p, i) => `${vn(p, i)} = m.addVar(${integer ? 'vtype=GRB.INTEGER, ' : ''}lb=0, name="${p.name}")`).join('\n')}

m.setObjective(${products.map((p, i) => `${p.profit}*${vn(p, i)}`).join(' + ')}, GRB.MAXIMIZE)
${res.map((r, j) => `m.addConstr(${products.map((p, i) => `${p.use[j] || 0}*${vn(p, i)}`).join(' + ')} <= ${r.cap}, name="${r.name}")`).join('\n')}

m.optimize()
for v in m.getVars():
    print(v.VarName, v.X)
print("Profit:", m.ObjVal)${integer ? '' : `
for c in m.getConstrs():
    print(c.ConstrName, "shadow price:", c.Pi, "slack:", c.Slack)`}`

  const pulp = `import pulp

m = pulp.LpProblem("product_mix", pulp.LpMaximize)
${products.map((p, i) => `${vn(p, i)} = pulp.LpVariable("${p.name.replace(/\s/g, '_')}", lowBound=0${integer ? ', cat="Integer"' : ''})`).join('\n')}

m += ${products.map((p, i) => `${p.profit}*${vn(p, i)}`).join(' + ')}
${res.map((r, j) => `m += ${products.map((p, i) => `${p.use[j] || 0}*${vn(p, i)}`).join(' + ')} <= ${r.cap}, "${r.name.replace(/\W+/g, '_')}"`).join('\n')}

m.solve()
for v in m.variables():
    print(v.name, v.varValue)
print("Profit:", pulp.value(m.objective))`

  return (
    <div className="space-y-4">
      <Predict prompt="Desks earn the most per unit. Will the optimal plan make only desks? Guess, then solve." />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-1">Product</th><th>Profit / unit ($)</th>
                {res.map((r, j) => <th key={j}><input className="input !py-1" value={r.name} onChange={(e) => setR(j, { name: e.target.value })} aria-label="Resource name" /></th>)}
                <th>Optimal qty</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-1 pr-2"><input className="input !py-1" value={p.name} onChange={(e) => setP(i, { name: e.target.value })} aria-label="Product name" /></td>
                  <td className="pr-2"><input type="number" className="input !py-1" value={p.profit} onChange={(e) => setP(i, { profit: Number(e.target.value) })} aria-label={`${p.name} profit`} /></td>
                  {res.map((_, j) => (
                    <td key={j} className="pr-2"><input type="number" className="input !py-1" value={p.use[j] ?? 0} onChange={(e) => setP(i, { use: res.map((__, k) => (k === j ? Number(e.target.value) : p.use[k] || 0)) })} aria-label={`${p.name} use of resource ${j + 1}`} /></td>
                  ))}
                  <td className="wide text-lg">{round(sol.x[i], 2)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">Capacity</td><td />
                {res.map((r, j) => <td key={j} className="pr-2"><input type="number" className="input !py-1" value={r.cap} onChange={(e) => setR(j, { cap: Number(e.target.value) })} aria-label={`${r.name} capacity`} /></td>)}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={integer} onChange={(e) => setInteger(e.target.checked)} /> Whole units only (integer program)</label>
          <button className="btn-ghost btn" onClick={() => setProducts((p) => [...p, { name: `Product ${p.length + 1}`, profit: 50, use: res.map(() => 1) }])}>Add product</button>
          <button className="btn-ghost btn" onClick={() => { setRes((r) => [...r, { name: `Resource ${r.length + 1}`, cap: 100 }]); setProducts((ps) => ps.map((p) => ({ ...p, use: [...p.use, 0] }))) }}>Add resource</button>
          <button className="btn-ghost btn" onClick={() => { setProducts(P0); setRes(R0) }}>Reset</button>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <Stat label="Maximum profit" value={sol.feasible ? `$${round(sol.z, 2).toLocaleString()}` : 'Infeasible'} tone="good" />
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-ink-2"><th>Resource</th><th>Used</th><th>Slack</th><th>Shadow price</th></tr></thead>
            <tbody>
              {res.map((r, j) => (
                <tr key={j} className="border-t border-line/60">
                  <td className="py-1">{r.name}</td><td>{round(usage[j], 1)} / {r.cap}</td>
                  <td className={r.cap - usage[j] < 1e-6 ? 'font-semibold text-sred' : ''}>{round(r.cap - usage[j], 1)}{r.cap - usage[j] < 1e-6 ? ' (binding)' : ''}</td>
                  <td>${round(shadow[j], 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-2">Shadow price: how much profit one more unit of the resource would add (from the LP relaxation). Non-binding resources are worth $0 at the margin.</p>
        </Panel>
        <Panel>
          <div className="mb-2 flex gap-2">
            <button className={`chip !text-sm ${tab === 'gurobi' ? '!border-ink !text-ink font-semibold' : ''}`} onClick={() => setTab('gurobi')}>Gurobi (gurobipy)</button>
            <button className={`chip !text-sm ${tab === 'pulp' ? '!border-ink !text-ink font-semibold' : ''}`} onClick={() => setTab('pulp')}>PuLP</button>
          </div>
          <pre tabIndex={0} aria-label={`${tab === 'gurobi' ? 'Gurobi' : 'PuLP'} model code`} className="max-h-80 overflow-auto rounded-md bg-ink p-3 text-xs leading-relaxed text-sheet"><code>{tab === 'gurobi' ? gurobi : pulp}</code></pre>
          <button className="btn-ghost btn mt-2 text-sm" onClick={() => navigator.clipboard?.writeText(tab === 'gurobi' ? gurobi : pulp)}>Copy code</button>
        </Panel>
      </div>
      <Challenges items={['Which resource is the bottleneck? What is one extra hour of it worth?', 'Raise chair profit until chairs enter the optimal plan.', 'Turn on whole units. Does profit drop? That gap is the cost of integrality.']} />
    </div>
  )
}
