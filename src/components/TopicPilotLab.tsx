import { useState } from 'react'
import type { PilotKind } from '../content/topicStudio'
import { taktLab, ladderLab, newtonLab, npvLab, capabilityLab } from '../lib/topicStudioMath'

function Range({ name, value, min, max, step = 1, unit = '', set }: { name: string; value: number; min: number; max: number; step?: number; unit?: string; set: (v: number) => void }) {
  return <label className="block text-sm font-medium"><span className="flex justify-between gap-2"><span>{name}</span><span>{value} {unit}</span></span><input className="mt-1 w-full accent-sblue" type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} /></label>
}
function Metric({ name, value }: { name: string; value: string }) {
  return <div className="rounded-md border border-line bg-sheet p-3"><p className="text-xs text-ink-2">{name}</p><p className="wide text-xl font-semibold">{value}</p></div>
}
function Takt() {
  const [shift, setShift] = useState(480), [breaks, setBreaks] = useState(60), [demand, setDemand] = useState(420), [cycle, setCycle] = useState(75)
  const r = taktLab(shift, breaks, demand, cycle)!
  const scale = Math.max(r.takt, cycle)
  return <div className="space-y-3">
    <svg viewBox="0 0 320 92" className="w-full" role="img" aria-label="Required takt and actual cycle time compared on the same scale">
      <text x="4" y="13" fontSize="11" fill="currentColor">Required pace</text><rect x="4" y="21" width={310 * r.takt / scale} height="20" rx="3" fill="#2563eb"/>
      <text x="4" y="59" fontSize="11" fill="currentColor">Actual cycle</text><rect x="4" y="67" width={310 * cycle / scale} height="20" rx="3" fill={r.capacity >= demand ? '#0d9488' : '#b45309'}/>
    </svg>
    <Range name="Shift duration" value={shift} min={240} max={720} step={30} unit="min" set={setShift}/>
    <Range name="Planned breaks" value={breaks} min={0} max={120} step={15} unit="min" set={setBreaks}/>
    <Range name="Demand" value={demand} min={100} max={1000} step={20} unit="units" set={setDemand}/>
    <Range name="Actual cycle time" value={cycle} min={20} max={180} step={5} unit="s/unit" set={setCycle}/>
    <div className="grid grid-cols-2 gap-2"><Metric name="Required takt" value={r.takt.toFixed(1)+' s/unit'}/><Metric name="Ideal capacity" value={String(r.capacity)+' units'}/></div>
    <p aria-live="polite" className="text-sm font-semibold">{r.capacity >= demand ? 'Ideal capacity meets demand.' : String(demand-r.capacity)+' units short of demand.'}</p>
    <details><summary className="cursor-pointer font-medium">Calculation and software</summary><p className="mt-2 text-sm">Net seconds = ({shift} − {breaks}) × 60 = {r.seconds}. Divide by {demand} for takt; divide by {cycle} and round down for capacity.</p><p className="mt-2 break-all text-sm">Excel: =(A2-B2)*60/C2</p><p className="text-sm">Python: (shift-breaks)*60/demand</p></details>
    <button className="btn-ghost btn" onClick={()=>{setShift(480);setBreaks(60);setDemand(420);setCycle(75)}}>Reset experiment</button>
  </div>
}
function Ladder() {
  const [a, setA] = useState(false), [b, setB] = useState(false), [c, setC] = useState(true)
  const y = ladderLab(a,b,c), color = (on: boolean) => on ? '#0d9488' : 'currentColor'
  return <div className="space-y-3">
    <p className="font-semibold">Y = (A OR NOT B) AND C</p>
    <svg viewBox="0 0 320 144" className="w-full" role="img" aria-label={'Ladder rung: A or not B in parallel, then C in series. Output '+(y?'true':'false')}>
      <path d="M8 12V132 M312 12V132" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 35H50 M72 35H136V105H72 M50 105H24V35 M136 70H174 M196 70H254 M278 70H312" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 35H50 M72 35H136V70" stroke={color(a)} strokeWidth="3" fill="none"/>
      <path d="M24 35V105H50 M72 105H136V70" stroke={color(!b)} strokeWidth="3" fill="none"/>
      <path d="M136 70H174" stroke={color(a||!b)} strokeWidth="3"/>
      <path d="M196 70H254 M278 70H312" stroke={color(y)} strokeWidth="3"/>
      <path d="M50 24V46 M72 24V46" stroke={color(a)} strokeWidth="3"/>
      <path d="M50 94V116 M72 94V116 M48 118L74 92" stroke={color(!b)} strokeWidth="2.5"/>
      <path d="M174 59V81 M196 59V81" stroke={color(c)} strokeWidth="3"/>
      <path d="M259 58Q247 70 259 82 M273 58Q285 70 273 82" stroke={color(y)} strokeWidth="3" fill="none"/>
      <g fontSize="12" fill="currentColor" textAnchor="middle"><text x="61" y="18">A</text><text x="61" y="88">B (XIO)</text><text x="185" y="50">C</text><text x="266" y="48">Y</text></g>
    </svg>
    <div className="grid gap-2 sm:grid-cols-3">{([{name:'A (XIC)',v:a,set:setA},{name:'B (XIO)',v:b,set:setB},{name:'C (XIC)',v:c,set:setC}]).map(x=><label key={x.name} className="flex items-center gap-2 rounded border border-line p-2"><input type="checkbox" checked={x.v} onChange={e=>x.set(e.target.checked)}/>{x.name}: {x.v?'1':'0'}</label>)}</div>
    <p aria-live="polite" className="font-semibold">Output Y: {y?'ON — at least one branch and C are true':'OFF — a required condition is false'}</p>
    <details><summary className="cursor-pointer font-medium">All eight input combinations</summary><table className="mt-2 w-full text-center text-sm"><thead><tr>{['A','B','C','Y'].map(x=><th key={x} scope="col">{x}</th>)}</tr></thead><tbody>{Array.from({length:8},(_,i)=>{const x=!!(i&4),z=!!(i&2),w=!!(i&1);return <tr key={i}>{[x,z,w,ladderLab(x,z,w)].map((v,j)=><td key={j}>{v?'1':'0'}</td>)}</tr>})}</tbody></table></details>
    <button className="btn-ghost btn" onClick={()=>{setA(false);setB(false);setC(true)}}>Reset experiment</button>
  </div>
}
function Newton() {
  const [start,setStart]=useState(2),[step,setStep]=useState(0)
  const values=newtonLab(start,step), x=values[values.length-1]
  const xmax=4, px=(v:number)=>20+280*v/xmax, py=(v:number)=>125-7*v
  const curve=Array.from({length:81},(_,i)=>{const z=i/20;return px(z)+','+py(z*z-2)}).join(' ')
  return <div className="space-y-3"><p className="font-semibold">f(x) = x² − 2; update x ← (x + 2/x)/2</p>
    <svg className="w-full" viewBox="0 0 320 150" role="img" aria-label="Function curve, horizontal axis, successive tangent intersections">
      <path d="M20 10V140 M20 125H308" stroke="currentColor" fill="none"/><polyline points={curve} fill="none" stroke="#2563eb" strokeWidth="2"/>
      {values.slice(0,-1).map((v,i)=><line key={i} x1={px(v)} y1={py(v*v-2)} x2={px(values[i+1])} y2={125} stroke="#b45309" strokeWidth="2"/>)}
      <circle cx={px(x)} cy="125" r="4" fill="#0d9488"/>
    </svg><Range name="Starting guess" value={start} min={0.5} max={3} step={0.25} set={v=>{setStart(v);setStep(0)}}/>
    <div className="grid grid-cols-2 gap-2"><Metric name={'Iteration '+step} value={x.toFixed(8)}/><Metric name="Absolute residual" value={Math.abs(x*x-2).toExponential(3)}/></div>
    <div className="flex flex-wrap gap-2"><button className="btn-ghost btn" onClick={()=>setStep(0)}>Restart</button><button className="btn" disabled={step>=8} onClick={()=>setStep(s=>s+1)}>Next iteration</button></div>
    <details><summary className="cursor-pointer font-medium">Iteration history</summary><ol className="mt-2 list-decimal pl-5 text-sm">{values.map((v,i)=><li key={i}>x = {v.toFixed(10)}, residual = {(v*v-2).toExponential(3)}</li>)}</ol><p className="mt-2 text-sm">Excel: =(A2+2/A2)/2 · Python: x = (x+2/x)/2</p></details>
  </div>
}
function Npv() {
  const [cost,setCost]=useState(10000),[saving,setSaving]=useState(3000),[rate,setRate]=useState(10)
  const value=npvLab(cost,saving,rate/100)!
  const f=(i:number)=>npvLab(cost,saving,i/100)!
  const samples=Array.from({length:26},(_,i)=>f(i)); const lo=Math.min(0,...samples),hi=Math.max(0,...samples), scale=Math.max(hi-lo,1)
  const py=(v:number)=>112-(v-lo)*100/scale
  return <div className="space-y-3">
    <svg className="w-full" viewBox="0 0 320 138" role="img" aria-label="Net present value versus discount rate, with zero-value reference"><line x1="12" y1={py(0)} x2="308" y2={py(0)} stroke="currentColor" strokeDasharray="4 4"/><polyline points={samples.map((v,i)=>(12+i*296/25)+','+py(v)).join(' ')} stroke="#2563eb" strokeWidth="2.5" fill="none"/><circle cx={12+rate*296/25} cy={py(value)} r="4" fill="#0d9488"/><text x="12" y="132" fontSize="11" fill="currentColor">0%</text><text x="308" y="132" textAnchor="end" fontSize="11" fill="currentColor">25% MARR</text></svg>
    <Range name="Initial investment" value={cost} min={5000} max={20000} step={1000} unit="USD" set={setCost}/>
    <Range name="Annual net savings" value={saving} min={1000} max={6000} step={500} unit="USD" set={setSaving}/>
    <Range name="Discount rate" value={rate} min={0} max={25} unit="%" set={setRate}/>
    <Metric name="Five-year NPV (USD)" value={value.toLocaleString('en-US',{style:'currency',currency:'USD'})}/>
    <p className="text-sm" aria-live="polite">{Math.abs(value)<0.005?'Break-even at displayed precision.':value>0?'Positive NPV under these assumptions.':'Negative NPV under these assumptions.'}</p>
    <details><summary className="cursor-pointer font-medium">Discount every cash flow</summary><ol className="list-decimal pl-5 text-sm">{Array.from({length:5},(_,i)=><li key={i}>Year {i+1}: {(saving/(1+rate/100)**(i+1)).toFixed(2)} USD present value</li>)}</ol><p className="mt-2 text-sm">Excel: =NPV(B2,B3:B7)-B8 (B2 decimal rate, B8 positive initial cost)</p></details>
    <button className="btn-ghost btn" onClick={()=>{setCost(10000);setSaving(3000);setRate(10)}}>Reset experiment</button>
  </div>
}
function Capability() {
  const [mean,setMean]=useState(50),[sigma,setSigma]=useState(2)
  const r=capabilityLab(mean,sigma)!
  const px=(v:number)=>12+(v-25)*296/50
  const path=Array.from({length:151},(_,i)=>{const x=25+i/3;return px(x)+','+(110-80/sigma*Math.exp(-0.5*((x-mean)/sigma)**2))}).join(' ')
  return <div className="space-y-3">
    <svg viewBox="0 0 320 136" className="w-full" role="img" aria-label="Illustrative normal curve relative to lower and upper specification limits">
      <rect x={px(40)} y="10" width={px(60)-px(40)} height="100" fill="#0d9488" opacity=".12"/>
      {[40,60].map(v=><line key={v} x1={px(v)} x2={px(v)} y1="10" y2="110" stroke="#b45309" strokeDasharray="4 3"/>)}
      <polyline points={path} stroke="#2563eb" strokeWidth="2" fill="none"/><line x1="12" y1="110" x2="308" y2="110" stroke="currentColor"/>
      <text x={px(40)} y="128" textAnchor="middle" fontSize="11" fill="currentColor">LSL 40</text><text x={px(60)} y="128" textAnchor="middle" fontSize="11" fill="currentColor">USL 60</text>
    </svg>
    <Range name="Process mean" value={mean} min={35} max={65} step={0.5} unit="mm" set={setMean}/>
    <Range name="Standard deviation" value={sigma} min={1} max={7} step={0.25} unit="mm" set={setSigma}/>
    <div className="grid grid-cols-2 gap-2"><Metric name="Cp" value={r.cp.toFixed(2)}/><Metric name="Cpk" value={r.cpk.toFixed(2)}/></div>
    <details><summary className="cursor-pointer font-medium">Equation anatomy</summary><p className="mt-2 text-sm">Cp = (60−40)/(6×{sigma}); Cpk = min(60−{mean}, {mean}−40)/(3×{sigma}). Both are dimensionless.</p><p className="text-sm">Excel: =MIN(60-A2,A2-40)/(3*B2)</p></details>
    <button className="btn-ghost btn" onClick={()=>{setMean(50);setSigma(2)}}>Reset experiment</button>
  </div>
}
export default function TopicPilotLab({ kind }: { kind: PilotKind }) {
  switch(kind) {
    case 'takt': return <Takt/>
    case 'ladder': return <Ladder/>
    case 'newton': return <Newton/>
    case 'npv': return <Npv/>
    case 'capability': return <Capability/>
  }
}
