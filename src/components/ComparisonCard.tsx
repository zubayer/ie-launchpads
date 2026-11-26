import { Link } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import type { Pair } from '../content/discovery'
import { termMeaning, TERM_NOTES } from '../content/comparisonTerms'
import { Tex, Rich } from './ui'

function PairVisual({ p }: { p: Pair }) {
  if(p.a==='quality.cp' && p.b==='quality.cpk') {
    const curve=(mean:number)=>Array.from({length:101},(_,i)=>{const x=35+i*.3;return (20+(x-35)*10)+','+(100-65*Math.exp(-.5*((x-mean)/2)**2))}).join(' ')
    return <figure className="mt-3 rounded-md border border-line p-3">
      <svg viewBox="0 0 340 132" className="w-full max-w-lg mx-auto" role="img" aria-label="Two curves with equal spread. One is centered at 50 mm, the other shifted to 54 mm toward the upper specification limit.">
        <rect x="70" y="20" width="200" height="80" fill="currentColor" opacity=".04"/>
        {[70,270].map((x,i)=><g key={x}><line x1={x} x2={x} y1="15" y2="102" stroke="currentColor" strokeDasharray="4 3"/><text x={x} y="118" textAnchor="middle" fontSize="11" fill="currentColor">{i?'USL 60':'LSL 40'}</text></g>)}
        <line x1="20" y1="100" x2="320" y2="100" stroke="currentColor"/>
        <polyline points={curve(50)} stroke="#2563eb" strokeWidth="2.5" fill="none"/>
        <polyline points={curve(54)} stroke="#b45309" strokeWidth="2.5" strokeDasharray="5 3" fill="none"/>
        <text x="170" y="25" textAnchor="middle" fill="currentColor" fontSize="11">50</text><text x="210" y="25" textAnchor="middle" fill="currentColor" fontSize="11">54</text>
      </svg>
      <figcaption className="text-sm"><strong>Same spread, different centering.</strong> Illustrative limits 40–60 mm; sigma = 2 mm. Centered mean 50: Cp = Cpk ≈ 1.67. Shifted mean 54: Cp ≈ 1.67 but Cpk = 1.00. Solid blue: centered; dashed orange: shifted. <a className="underline" href="https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm" target="_blank" rel="noopener noreferrer">NIST capability reference</a>.</figcaption>
    </figure>
  }
  if(p.a==='lean.takt-time' && p.b==='lean.cycle-time') return <figure className="mt-3 rounded-md border border-line p-3">
    <svg viewBox="0 0 340 114" className="w-full max-w-lg mx-auto" role="img" aria-label="Required takt 60 seconds per unit versus actual cycle 75 seconds per unit, a 15-second gap.">
      <text x="8" y="14" fill="currentColor" fontSize="12">Required takt · 60 s/unit</text><rect x="8" y="22" width="240" height="18" rx="3" fill="#2563eb"/>
      <text x="8" y="65" fill="currentColor" fontSize="12">Actual cycle · 75 s/unit</text><rect x="8" y="73" width="300" height="18" rx="3" fill="#b45309"/>
      <line x1="248" x2="248" y1="18" y2="96" stroke="currentColor" strokeDasharray="4 3"/><text x="278" y="107" textAnchor="middle" fill="currentColor" fontSize="10">15 s gap</text>
    </svg><figcaption className="text-sm">Illustrative single station: 420 available minutes and demand of 420 units gives 60 s/unit takt. A 75 s cycle gives ideal capacity of 336 units, short of demand by 84, ignoring additional losses. <a className="underline" href="https://www.lean.org/lexicon-terms/takt-time/" target="_blank" rel="noopener noreferrer">LEI takt reference</a>.</figcaption>
  </figure>
  return null
}

export function ComparisonCard({ pair: p }: { pair: Pair }) {
  const A=CONCEPT_MAP[p.a], B=CONCEPT_MAP[p.b]
  return <article className="sheet min-w-0 rounded-xl border border-line p-3 sm:p-5">
    <h2 className="mb-3 text-lg font-bold break-words">{A.term} <span className="text-ink-2 font-normal">vs.</span> {B.term}</h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[A,B].map((c,i)=>{
        const meaning=termMeaning(c)
        return <section key={c.id} aria-label={'Concept '+(i?'B':'A')+': '+c.term} className={'min-w-0 rounded-lg border border-line border-t-4 p-3 '+(i?'border-t-sorange bg-sorange/5':'border-t-sblue bg-sblue/5')}>
          <p className="label mb-1">Concept {i?'B':'A'}</p>
          <Link to={'/c/'+c.id} className="text-lg font-extrabold break-words hover:underline">{c.term}</Link>
          {meaning && <p className="mt-1 text-sm font-medium break-words">{meaning}</p>}
          <p className="mt-2 text-sm"><Rich text={c.one}/></p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">Definition, analogy & formula</summary>
            <p className="mt-2 text-sm break-words"><Rich text={c.def}/></p>
            {TERM_NOTES[c.id]?.note && <p className="mt-2 text-sm">{TERM_NOTES[c.id].note}</p>}
            {c.analogy && <p className="mt-2 text-sm"><strong>Think of:</strong> <Rich text={c.analogy}/></p>}
            {c.formula && <div className="mt-2 min-w-0"><Tex tex={c.formula.tex} block/>{!!c.formula.vars?.length&&<ul className="mt-1 list-disc pl-4 text-xs">{c.formula.vars.map(([v,meaning],j)=><li key={j}><Tex tex={v}/> — {meaning}</li>)}</ul>}</div>}
            {c.assumptions?.[0] && <p className="mt-2 text-xs"><strong>Keep in mind:</strong> <Rich text={c.assumptions[0]}/></p>}
          </details>
          <Link className="mt-3 inline-block text-sm font-semibold underline" to={'/c/'+c.id}>Open full lesson</Link>
        </section>
      })}
    </div>
    <div className="mt-3 rounded-md border-l-4 border-sgreen bg-sheet p-3">
      <p className="label">The key difference</p><p className="mt-1 text-sm"><Rich text={p.diff}/></p>
    </div>
    <PairVisual p={p}/>
    {p.a==='quality.cpk'&&p.b==='quality.ppk'&&<p className="mt-2 text-xs"><a className="underline" href="https://support.minitab.com/en-us/minitab/help-and-how-to/quality-and-process-improvement/capability-analysis/supporting-topics/capability-metrics/potential-and-overall-capability/" target="_blank" rel="noopener noreferrer">Minitab reference: potential versus overall capability</a></p>}
    <details className="mt-3 rounded-md border border-line p-3">
      <summary className="cursor-pointer font-semibold text-sm">When to use each · interview practice</summary>
      <p className="mt-2 text-xs text-ink-2">Original practice scenarios. Predict the concept before revealing the answer.</p>
      {p.quiz.map((q,i)=><details className="mt-2 border-t border-line pt-2" key={i}><summary className="cursor-pointer text-sm">{q.s}</summary><p className="mt-2 text-sm font-semibold">{CONCEPT_MAP[p[q.ans]].term}</p><p className="text-sm">{p.diff}</p></details>)}
    </details>
  </article>
}
