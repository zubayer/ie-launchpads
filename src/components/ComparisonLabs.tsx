import { useState } from 'react'
import { capabilityCompare,timingCompare,investmentCompare } from '../lib/comparisonMath'
const colors=['#2563eb','#0d9488','#b45309','#7c3aed']
function Range({name,value,min,max,step=1,unit='',set}:{name:string;value:number;min:number;max:number;step?:number;unit?:string;set:(n:number)=>void}){
  return <label className="block text-sm"><span className="flex justify-between gap-2 font-semibold"><span>{name}</span><span>{value} {unit}</span></span><input className="w-full accent-sblue" type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))}/></label>
}
function Metrics({values}:{values:[string,string][]}){
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">{values.map(([label,value],i)=><div key={label} className="rounded-md border border-line border-t-4 p-3" style={{borderTopColor:colors[i%4]}}><p className="text-xs text-ink-2">{label}</p><p className="text-xl font-bold break-words">{value}</p></div>)}</div>
}
function Capability(){
  const [mean,setMean]=useState(50),[within,setWithin]=useState(2),[overall,setOverall]=useState(3)
  const r=capabilityCompare(40,60,mean,within,overall)!
  const px=(x:number)=>15+(x-25)*6.2
  const curve=(sd:number)=>Array.from({length:151},(_,i)=>{const x=25+i/3;return px(x)+','+(115-95/sd*Math.exp(-.5*((x-mean)/sd)**2))}).join(' ')
  return <div className="space-y-3">
    <h3 className="font-bold">Same specifications, two variation estimates</h3>
    <svg viewBox="0 0 340 142" className="w-full max-w-xl mx-auto" role="img" aria-label="Illustrative normal distributions using the within and overall standard deviations, with specification limits 40 and 60">
      <rect x={px(40)} y="12" width={px(60)-px(40)} height="103" fill="currentColor" opacity=".04"/>
      {[40,60].map(v=><g key={v}><line x1={px(v)} x2={px(v)} y1="12" y2="115" stroke="currentColor" strokeDasharray="4 3"/><text x={px(v)} y="132" textAnchor="middle" fontSize="10" fill="currentColor">{v===40?'LSL 40':'USL 60'}</text></g>)}
      <line x1="15" x2="325" y1="115" y2="115" stroke="currentColor"/><polyline points={curve(within)} fill="none" stroke={colors[0]} strokeWidth="2.5"/><polyline points={curve(overall)} fill="none" stroke={colors[3]} strokeDasharray="5 3" strokeWidth="2.5"/>
    </svg>
    <p className="text-xs text-ink-2">Solid blue: within-process estimate. Dashed purple: overall estimate. Curves illustrate spread, not measured data or defect probabilities.</p>
    <div className="grid gap-3 sm:grid-cols-3"><Range name="Mean" value={mean} min={35} max={65} step={.5} unit="mm" set={setMean}/><Range name="Within SD" value={within} min={1} max={6} step={.25} unit="mm" set={setWithin}/><Range name="Overall SD" value={overall} min={1} max={7} step={.25} unit="mm" set={setOverall}/></div>
    <Metrics values={[['Cp',r.cp.toFixed(2)],['Cpk',r.cpk.toFixed(2)],['Pp',r.pp.toFixed(2)],['Ppk',r.ppk.toFixed(2)]]}/>
    <p className="text-sm">Cp and Pp stay constant when only the mean moves; Cpk and Ppk decrease with off-centering. Negative centered indices indicate a mean outside the specification interval. Pp and Ppk share one existing lesson.</p>
    <button className="btn-ghost btn" onClick={()=>{setMean(50);setWithin(2);setOverall(3)}}>Reset capability</button>
    <p className="text-xs text-ink-2">Illustrative two-sided specifications; validate stability and estimates. No universal pass threshold. <a className="underline" href="https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm" target="_blank" rel="noopener noreferrer">NIST capability reference</a> · <a className="underline" href="https://support.minitab.com/en-us/minitab/help-and-how-to/quality-and-process-improvement/capability-analysis/supporting-topics/capability-metrics/potential-and-overall-capability/" target="_blank" rel="noopener noreferrer">Minitab within vs overall capability</a>.</p>
  </div>
}
function Timing(){
  const [minutes,setMinutes]=useState(420),[demand,setDemand]=useState(420),[cycle,setCycle]=useState(75),[waiting,setWaiting]=useState(525)
  const r=timingCompare(minutes,demand,cycle,waiting)!,max=Math.max(r.takt,r.cycle,r.lead)
  return <div className="space-y-3">
    <h3 className="font-bold">One work station, three time measures</h3>
    <div className="space-y-2">{([['Takt',r.takt],['Cycle',r.cycle],['Lead',r.lead]] as [string,number][]).map(([label,value],i)=><div key={label}><p className="text-sm font-medium">{label}: {value.toFixed(1)} s</p><div className="h-4 rounded bg-paper overflow-hidden"><div className="h-full rounded" style={{background:colors[i],width:(value/max*100)+'%'}}/></div></div>)}</div>
    <div className="grid gap-3 sm:grid-cols-2"><Range name="Available time" value={minutes} min={240} max={720} step={30} unit="min" set={setMinutes}/><Range name="Demand" value={demand} min={100} max={1000} step={20} unit="units" set={setDemand}/><Range name="Cycle" value={cycle} min={20} max={180} step={5} unit="s/unit" set={setCycle}/><Range name="Illustrative waiting" value={waiting} min={0} max={900} step={25} unit="s" set={setWaiting}/></div>
    <Metrics values={[['Takt',r.takt.toFixed(1)+' s/unit'],['Cycle',r.cycle+' s/unit'],['Lead',r.lead+' s'],['Ideal capacity',String(r.capacity)]]}/>
    <p className="text-sm" aria-live="polite">{r.gap<0?String(-r.gap)+' units short of demand.':'Ideal capacity meets demand.'} Changing waiting alone changes this illustrative lead time, not ideal capacity.</p>
    <button className="btn-ghost btn" onClick={()=>{setMinutes(420);setDemand(420);setCycle(75);setWaiting(525)}}>Reset timing</button>
    <p className="text-xs text-ink-2">One serial station, fixed cycle, no scrap or downtime; waiting is an input, not a computed queue prediction. <a className="underline" href="https://www.lean.org/lexicon-terms/takt-time/" target="_blank" rel="noopener noreferrer">LEI takt reference</a>.</p>
  </div>
}
function Economics(){
  const [cost,setCost]=useState(10000),[saving,setSaving]=useState(3000),[years,setYears]=useState(5),[rate,setRate]=useState(10)
  const r=investmentCompare(cost,saving,years,rate/100)!
  const cash=Array.from({length:years+1},(_,i)=>i===0?-cost:saving/(1+rate/100)**i),max=Math.max(...cash.map(Math.abs))
  const money=(v:number)=>v.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2})
  return <div className="space-y-3">
    <h3 className="font-bold">One investment, four decision measures</h3>
    <div className="flex flex-wrap gap-2 items-end" aria-label="Discounted cash flows by year">{cash.map((v,i)=><div key={i} className="flex-1 min-w-10 text-center"><div className="h-24 flex items-end justify-center"><div className="w-8 rounded-t" style={{height:(Math.abs(v)/max*100)+'%',background:v<0?colors[2]:colors[0]}}/></div><p className="text-xs font-semibold">Y{i}</p><p className="text-xs break-words">{money(v)}</p></div>)}</div>
    <div className="grid gap-3 sm:grid-cols-2"><Range name="Initial cost" value={cost} min={5000} max={25000} step={1000} unit="USD" set={setCost}/><Range name="Annual savings" value={saving} min={1000} max={8000} step={500} unit="USD" set={setSaving}/><Range name="Study horizon" value={years} min={2} max={10} unit="years" set={setYears}/><Range name="MARR" value={rate} min={0} max={25} unit="%" set={setRate}/></div>
    <Metrics values={[['NPV',money(r.npv)],['IRR',r.irr===null?'Not bracketed':(r.irr*100).toFixed(2)+'%'],['Annual worth',money(r.aw)],['Simple payback',r.payback===null?'Not recovered':r.payback+' yr']]}/>
    <p className="text-sm">Positive NPV and positive annual worth agree under the same horizon and discount rate. IRR is not MARR. Payback reports the first year-end at which cumulative undiscounted cash flows recover cost.</p>
    <button className="btn-ghost btn" onClick={()=>{setCost(10000);setSaving(3000);setYears(5);setRate(10)}}>Reset investment</button>
    <p className="text-xs text-ink-2">Illustrative constant year-end net savings; excludes taxes, salvage and inflation adjustments. <a className="underline" href="https://openstax.org/books/principles-finance/pages/16-2-net-present-value-npv-method" target="_blank" rel="noopener noreferrer">OpenStax NPV reference</a>.</p>
  </div>
}
export default function ComparisonLabs({kind}:{kind:'capability'|'timing'|'economics'}){
  return kind==='capability'?<Capability/>:kind==='timing'?<Timing/>:<Economics/>
}
