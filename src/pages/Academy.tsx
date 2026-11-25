import { useState } from 'react'
import { Link } from 'react-router-dom'

const sources = [
  ['NIST Engineering Statistics Handbook','Government','Statistics, quality, DOE and reliability','https://www.itl.nist.gov/div898/handbook/'],
  ['IISE Body of Knowledge','Professional','Industrial and systems engineering curriculum','https://www.iise.org/details.aspx?id=43631'],
  ['MIT OpenCourseWare','Academic','Mathematics, operations and engineering','https://ocw.mit.edu/'],
  ['OpenStax','Academic','Mathematics and statistics fundamentals','https://openstax.org/'],
  ['OSHA','Government','Occupational safety guidance','https://www.osha.gov/'],
  ['NIOSH','Government','Ergonomics and occupational research','https://www.cdc.gov/niosh/'],
  ['SEBoK','Professional','Systems engineering','https://sebokwiki.org/'],
  ['Lean Enterprise Institute','Professional','Lean methods and practices','https://www.lean.org/'],
  ['ASQ','Professional','Quality and improvement','https://asq.org/'],
  ['INFORMS','Professional','Operations research and analytics','https://www.informs.org/'],
  ['O*NET','Government','Industrial engineering occupations and skills','https://www.onetonline.org/link/summary/17-2112.00'],
  ['OpenAlex','Exploratory','Research discovery, not automatic evidence verification','https://openalex.org/'],
]
const tools = [
  {name:'Excel',skills:'Formulas → PivotTables → Solver → dashboard',task:'Calculate defect rates and compare daily performance.',url:'https://support.microsoft.com/excel'},
  {name:'Python / pandas',skills:'Python basics → data cleaning → aggregation → charts',task:'Analyze the provided shift data and identify performance losses.',url:'https://pandas.pydata.org/docs/getting_started/'},
  {name:'SQL',skills:'SELECT → GROUP BY → JOIN → window functions',task:'Summarize production by shift, then identify the highest downtime.',url:'https://www.postgresql.org/docs/current/tutorial-sql.html'},
  {name:'Power BI',skills:'Import → relationships → DAX → dashboard',task:'Build a production KPI dashboard using the mission dataset.',url:'https://learn.microsoft.com/power-bi/'},
  {name:'Gurobi',skills:'Decision variables → constraints → objective → solve',task:'Optimize a product mix under limited labor and machine capacity.',url:'https://gurobi.github.io/modeling-examples/'},
  {name:'OR-Tools',skills:'Model → scheduling → routing → solution interpretation',task:'Build an assignment or scheduling model.',url:'https://developers.google.com/optimization'},
  {name:'SimPy',skills:'Environment → process → resource → experiment',task:'Model a queue and compare staffing alternatives.',url:'https://simpy.readthedocs.io/'},
  {name:'Minitab',skills:'Data → control charts → capability → DOE',task:'Investigate a production process with variable performance.',url:'https://support.minitab.com/'},
]
const missions = [
  {id:'production', title:'Improve production performance',brief:'You are an industrial engineer asked to investigate a line with inconsistent output. Use the synthetic shift records to locate losses and recommend an improvement.',csv:'shift,planned_minutes,downtime_minutes,total_units,defects\nA,480,45,390,12\nB,480,60,365,18\nC,480,30,420,8\nD,480,50,380,15\n',steps:['Calculate good units and availability by shift','Compare defects and downtime; identify the largest observed loss','Propose a root-cause investigation and improvement','Write a one-page recommendation with assumptions and limitations'],rubric:'Correct units and arithmetic (30%), evidence-based diagnosis (30%), feasible proposal (25%), clear communication (15%).'},
  {id:'inventory',title:'Improve inventory replenishment',brief:'A warehouse needs an initial replenishment policy. Compare products using synthetic demand and cost data; state assumptions before calculating EOQ.',csv:'sku,annual_demand,order_cost,holding_cost_per_unit_year\nA,12000,40,3\nB,6800,55,5\nC,3200,25,2\n',steps:['Calculate EOQ for each SKU','Estimate annual ordering and holding costs','Discuss demand uncertainty and safety stock','Present a replenishment recommendation'],rubric:'Correct EOQ (35%), costs (25%), assumptions and uncertainty (25%), communication (15%).'},
  {id:'economics',title:'Evaluate a capital investment',brief:'Compare two equipment alternatives using the synthetic annual cash flows. Assume a 10% MARR and end-of-year flows.',csv:'year,option_a,option_b\n0,-100000,-140000\n1,32000,44000\n2,32000,44000\n3,32000,44000\n4,32000,44000\n5,42000,59000\n',steps:['Draw both cash-flow diagrams','Calculate NPV at 10% for both options','Test sensitivity at 8% and 12%','Recommend an alternative and explain the decision'],rubric:'Cash flow interpretation (20%), NPV (40%), sensitivity (20%), recommendation (20%).'},
]
type Tab = 'sources' | 'software' | 'missions' | 'factory'
function download(name:string, content:string) {
  const url = URL.createObjectURL(new Blob([content], {type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function loadChecks(): Record<string, boolean> {
  try { const v=JSON.parse(localStorage.getItem('ie-launchpads-v2-missions')||'{}'); return v && typeof v==='object' && !Array.isArray(v) ? v : {} } catch { return {} }
}
function Factory() {
  const [times,setTimes]=useState([35,50,40,30])
  const [demand,setDemand]=useState(80)
  const bottleneck=Math.max(...times), capacity=3600/bottleneck, takt=3600/demand
  const [prediction,setPrediction]=useState('')
  const [reveal,setReveal]=useState(false)
  return <section className="sheet rounded-lg p-5 space-y-4">
    <h2 className="display text-2xl">Factory bottleneck experiment</h2>
    <p>Mission: meet customer demand by changing station cycle times. Predict which station limits the line before checking your result.</p>
    <div className="grid gap-3 sm:grid-cols-4">{times.map((t,i)=><div key={i} className="rounded border border-line p-3">
      <label htmlFor={'station-'+i} className="font-semibold">Station {i+1}: {t} s</label>
      <input id={'station-'+i} className="w-full" type="range" min={10} max={100} step={5} value={t} onChange={e=>{setTimes(old=>old.map((x,j)=>i===j?Number(e.target.value):x));setReveal(false)}}/>
      <p className="text-sm text-ink-2">Individual capacity: {(3600/t).toFixed(1)} units/hr</p>
    </div>)}</div>
    <label htmlFor="demand" className="block font-semibold">Demand: {demand} units/hour</label>
    <input id="demand" type="range" min={20} max={150} step={5} className="w-full" value={demand} onChange={e=>setDemand(Number(e.target.value))}/>
    <label htmlFor="prediction" className="block">Which station is a bottleneck?</label>
    <select id="prediction" className="input" value={prediction} onChange={e=>{setPrediction(e.target.value);setReveal(false)}}><option value="">Select one station</option>{times.map((_,i)=><option key={i} value={i}>{i+1}</option>)}</select>
    <button className="btn" disabled={!prediction} onClick={()=>setReveal(true)}>Check prediction</button>
    {reveal && <p role="status" className="font-semibold">{times[Number(prediction)]===bottleneck?'Correct: that station has the longest cycle time.':'Try again: the bottleneck has the longest cycle time.'}</p>}
    <div className="grid gap-3 sm:grid-cols-3">{[['Capacity',capacity.toFixed(1)+' units/hr'],['Takt time',takt.toFixed(1)+' s'],['Balance efficiency',(100*times.reduce((a,b)=>a+b,0)/(times.length*bottleneck)).toFixed(1)+'%']].map(([k,v])=><div key={k} className="rounded border border-line p-3"><p className="text-sm text-ink-2">{k}</p><p className="text-xl font-semibold">{v}</p></div>)}</div>
    <p role="status">{capacity>=demand?'The theoretical capacity meets demand.':'The line cannot meet demand at its current theoretical capacity.'}</p>
    <p className="text-sm text-ink-2">Model: serial stations, one unit per cycle, no downtime, no variability or blocking. Capacity = 3600 / longest cycle time. Actual throughput may be lower.</p>
    <button className="btn-ghost btn" onClick={()=>{setTimes([35,50,40,30]);setDemand(80);setPrediction('');setReveal(false)}}>Reset experiment</button>
  </section>
}
export function Academy() {
  const [tab,setTab]=useState<Tab>('sources')
  const [query,setQuery]=useState('')
  const [checks,setChecks]=useState(loadChecks)
  const tabs: [Tab,string][]=[['sources','Source library'],['software','Software pathways'],['missions','Engineering missions'],['factory','Factory lab']]
  const toggle=(key:string)=>setChecks(old=>{const next={...old,[key]:!old[key]};try{localStorage.setItem('ie-launchpads-v2-missions',JSON.stringify(next))}catch{/* browser storage unavailable */}return next})
  return <div className="space-y-5">
    <header><p className="label">IE Launchpad V2 · Workbench</p><h1 className="display text-4xl">Engineering Academy</h1><p className="mt-2 text-ink-2">Discover trustworthy references, practice professional workflows and build evidence of engineering skills.</p></header>
    <nav aria-label="Academy sections" className="flex flex-wrap gap-2">{tabs.map(([id,label])=><button key={id} className={'btn '+(tab===id?'':'btn-ghost')} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    {tab==='sources'&&<section className="space-y-3"><h2 className="display text-2xl">Source discovery</h2><p>These curated starting points are not claim-level lesson citations. Check the exact section, date, assumptions and license before relying on a source.</p><label htmlFor="source-search" className="block">Filter sources</label><input id="source-search" className="input w-full" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search topic or publisher"/><div className="grid gap-3 sm:grid-cols-2">{sources.filter(s=>s.join(' ').toLowerCase().includes(query.toLowerCase())).map(([title,type,desc,url])=><article className="sheet rounded-lg p-4" key={title}><p className="label">{type}</p><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-ink-2">{desc}</p><a className="mt-2 inline-block underline" href={url} target="_blank" rel="noopener noreferrer">Open resource ↗</a></article>)}</div>{!sources.some(s=>s.join(' ').toLowerCase().includes(query.toLowerCase()))&&<p>No matching sources. Try another search.</p>}</section>}
    {tab==='software'&&<section className="space-y-3"><h2 className="display text-2xl">Professional software learning paths</h2><p>Follow the suggested sequence, use the official documentation, then attempt the practice task. Commercial products may require a license.</p><div className="grid gap-3 sm:grid-cols-2">{tools.map(t=><article key={t.name} className="sheet rounded-lg p-4 space-y-2"><h3 className="font-semibold text-lg">{t.name}</h3><p>{t.skills}</p><p className="text-sm"><strong>Practice:</strong> {t.task}</p><a href={t.url} target="_blank" rel="noopener noreferrer" className="underline">Official learning resource ↗</a><label className="flex gap-2 items-center"><input type="checkbox" checked={!!checks['tool-'+t.name]} onChange={()=>toggle('tool-'+t.name)}/> Practice completed (self-reported)</label></article>)}</div></section>}
    {tab==='missions'&&<section className="space-y-3"><h2 className="display text-2xl">Engineering missions</h2><p>All datasets are synthetic training data, not actual employment experience. Complete each deliverable independently and use the rubric to self-review.</p>{missions.map(m=><article key={m.id} className="sheet rounded-lg p-5 space-y-3"><h3 className="display text-xl">{m.title}</h3><p>{m.brief}</p><button className="btn" onClick={()=>download(m.id+'-synthetic.csv',m.csv)}>Download CSV dataset</button><p className="text-sm font-semibold">{m.steps.filter((_,i)=>checks[m.id+'-'+i]).length} / {m.steps.length} tasks completed</p>{m.steps.map((step,i)=><label key={i} className="flex gap-2 items-start"><input type="checkbox" checked={!!checks[m.id+'-'+i]} onChange={()=>toggle(m.id+'-'+i)}/>{step}</label>)}<p className="text-sm text-ink-2"><strong>Rubric:</strong> {m.rubric}</p></article>)}</section>}
    {tab==='factory'&&<Factory/>}
    <p className="text-sm text-ink-2">Explore the existing <Link className="underline" to="/domains">curriculum</Link>, <Link className="underline" to="/lab">simulator lab</Link> or <Link className="underline" to="/roles">career paths</Link>.</p>
  </div>
}
