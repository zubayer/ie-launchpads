import { useState } from 'react'
import { round } from '../lib/math'
import { Challenges, Panel, Predict, Stat } from './kit'

type Node = { id: string; label: string; gate?: 'AND' | 'OR'; kids?: Node[]; p?: number }

const TREE: Node = {
  id: 'top', label: 'Conveyor does not stop when E-stop is pressed', gate: 'OR', kids: [
    { id: 'g1', label: 'Both redundant safety channels fail', gate: 'AND', kids: [
      { id: 'e1', label: 'Channel 1 contactor welded shut', p: 0.002 },
      { id: 'e2', label: 'Channel 2 contactor welded shut', p: 0.002 },
    ] },
    { id: 'g2', label: 'E-stop signal never reaches the safety relay', gate: 'OR', kids: [
      { id: 'e3', label: 'E-stop button mechanically jammed', p: 0.0005 },
      { id: 'e4', label: 'Wiring short bypasses E-stop', p: 0.0003 },
    ] },
    { id: 'e5', label: 'Safety relay internal failure (undetected)', p: 0.0001 },
  ],
}

/** Gate math assuming independent events: AND = product, OR = 1 − Π(1 − p). */
export function evaluate(n: Node, ps: Record<string, number>): number {
  if (!n.kids) return ps[n.id] ?? n.p ?? 0
  const v = n.kids.map((k) => evaluate(k, ps))
  return n.gate === 'AND' ? v.reduce((a, b) => a * b, 1) : 1 - v.reduce((a, b) => a * (1 - b), 1)
}

/** Minimal cut sets via MOCUS-style expansion. */
export function cutSets(n: Node, gates: Record<string, 'AND' | 'OR'>): string[][] {
  if (!n.kids) return [[n.id]]
  const sub = n.kids.map((k) => cutSets(k, gates))
  const g = gates[n.id] || n.gate
  let sets: string[][]
  if (g === 'OR') sets = sub.flat()
  else sets = sub.reduce<string[][]>((acc, s) => acc.flatMap((a) => s.map((b) => Array.from(new Set([...a, ...b])))), [[]])
  // remove non-minimal sets
  return sets.filter((s, i) => !sets.some((t, j) => j !== i && t.length < s.length && t.every((x) => s.includes(x))))
}

const leaves = (n: Node): Node[] => (n.kids ? n.kids.flatMap(leaves) : [n])

export default function FaultTree() {
  const [gates, setGates] = useState<Record<string, 'AND' | 'OR'>>({})
  const [ps, setPs] = useState<Record<string, number>>({})
  const withGates = (n: Node): Node => ({ ...n, gate: gates[n.id] || n.gate, kids: n.kids?.map(withGates) })
  const tree = withGates(TREE)
  const top = evaluate(tree, ps)
  const cs = cutSets(tree, gates)
  const names = Object.fromEntries(leaves(TREE).map((l) => [l.id, l.label]))
  const render = (n: Node, depth = 0): React.ReactNode => (
    <li key={n.id} className="mt-2">
      <div className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 ${n.kids ? 'border-ink' : 'border-line'} ${depth === 0 ? 'bg-sred/10' : ''}`}>
        {n.kids ? (
          <button className={`chip !text-xs font-semibold ${n.gate === 'AND' ? '!border-sblue !text-sblue' : '!border-sorange !text-sorange'}`}
            onClick={() => setGates({ ...gates, [n.id]: n.gate === 'AND' ? 'OR' : 'AND' })} title="Toggle gate type">{n.gate} gate</button>
        ) : <span className="chip !text-xs">basic event</span>}
        <span className="flex-1">{n.label}</span>
        {n.kids ? <span className="text-sm text-ink-2">P = {evaluate(n, ps).toExponential(2)}</span> : (
          <label className="text-sm">P = <input type="number" step={0.0001} min={0} max={1} className="input !inline-block !w-28 !py-1" value={ps[n.id] ?? n.p}
            onChange={(e) => setPs({ ...ps, [n.id]: Math.min(1, Math.max(0, Number(e.target.value))) })} aria-label={`Probability of ${n.label}`} /></label>
        )}
      </div>
      {n.kids && <ul className="ml-5 border-l-2 border-line pl-4">{n.kids.map((k) => render(k, depth + 1))}</ul>}
    </li>
  )
  return (
    <div className="space-y-4">
      <Predict prompt="The two redundant channels each fail with probability 0.002. Is the redundant pair the biggest contributor to the top event — or something else?" />
      <Panel><ul>{render(tree)}</ul></Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <Stat label="Top-event probability (per demand)" value={top.toExponential(3)} tone={top < 1e-3 ? 'good' : 'warn'} />
          <p className="mt-2 text-sm">≈ 1 in {Math.round(1 / top).toLocaleString()} demands. Assumes independent events — common-cause failures (same batch of contactors, same power spike) break that assumption, which is why safety standards add diversity, not just redundancy.</p>
        </Panel>
        <Panel>
          <p className="label mb-1">Minimal cut sets ({cs.length})</p>
          <ul className="space-y-1 text-sm">
            {cs.map((s) => ({ s, p: s.reduce((a, id) => a * (ps[id] ?? leaves(TREE).find((l) => l.id === id)!.p!), 1) }))
              .sort((a, b) => b.p - a.p)
              .map(({ s, p }) => <li key={s.join()}><strong>{s.length === 1 ? 'Single point' : `Order ${s.length}`}:</strong> {s.map((id) => names[id]).join(' + ')} <span className="text-ink-2">({p.toExponential(1)})</span></li>)}
          </ul>
        </Panel>
      </div>
      <Challenges items={['Toggle the top gate to AND. Why does the probability collapse?', 'Which single-point failure dominates? What design change removes it?', 'Make channel 1 and 2 probabilities 0.05 (poor maintenance). What happens to the order-2 cut set?']} />
    </div>
  )
}
