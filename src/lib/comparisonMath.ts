export function capabilityCompare(lsl:number,usl:number,mean:number,within:number,overall:number){
  if(![lsl,usl,mean,within,overall].every(Number.isFinite)||usl<=lsl||within<=0||overall<=0)return null
  const width=usl-lsl,nearest=Math.min(usl-mean,mean-lsl)
  return {cp:width/(6*within),cpk:nearest/(3*within),pp:width/(6*overall),ppk:nearest/(3*overall)}
}
export function timingCompare(minutes:number,demand:number,cycle:number,waiting:number){
  if(![minutes,demand,cycle,waiting].every(Number.isFinite)||minutes<=0||demand<=0||cycle<=0||waiting<0)return null
  const takt=minutes*60/demand, capacity=Math.floor(minutes*60/cycle)
  return {takt,cycle,lead:cycle+waiting,capacity,gap:capacity-demand}
}
/** Constant annual positive year-end savings, no salvage. Monotonic NPV permits a bracketed unique IRR. */
export function investmentCompare(cost:number,saving:number,years:number,rate:number){
  if(![cost,saving,years,rate].every(Number.isFinite)||cost<=0||saving<=0||!Number.isInteger(years)||years<1||years>50||rate<0)return null
  const pv=(r:number)=>Array.from({length:years},(_,i)=>saving/(1+r)**(i+1)).reduce((a,b)=>a+b,0)-cost
  let lo=-.999999,hi=1
  while(pv(hi)>0&&hi<1e6)hi*=2
  let irr:number|null=null
  if(pv(lo)>=0&&pv(hi)<=0){
    for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(pv(mid)>0)lo=mid;else hi=mid}
    irr=(lo+hi)/2
  }
  const npv=pv(rate),aw=rate===0?npv/years:npv*rate/(1-(1+rate)**-years)
  const simple=cost/saving
  return {npv,irr,aw,payback:simple<=years?Math.ceil(simple):null}
}
