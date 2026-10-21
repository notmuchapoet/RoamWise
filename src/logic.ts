export type Activity={id:string,name:string,date:string,start:string,duration:number,fixed:boolean,outdoor:boolean,cost:number,paid:boolean};
export type Trip={id:string,name:string,city:string,country:string,latitude:number|null,longitude:number|null,timezone:string,startDate:string,endDate:string,currency:string,homeCurrency:string,budget:number,activities:Activity[]};
export type Issue='rain'|'late'|'missed'|'cost';
export type Strategy='protect'|'relax'|'budget';
export type Proposal={activities:Activity[],changes:string[],warnings:string[],addedCost:number,potentialLoss:number,issue:Issue};
const minutes=(time:string)=>{const [h,m]=time.split(':').map(Number);return h*60+m};
const clock=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export const uid=()=>globalThis.crypto?.randomUUID?.()??String(Date.now()+Math.random());
export function rescue(trip:Trip,date:string,issue:Issue,strategy:Strategy,delay=60,expense=0):Proposal{
 const current=trip.activities.filter(a=>a.date===date).map(a=>({...a})).sort((a,b)=>a.start.localeCompare(b.start));
 const others=trip.activities.filter(a=>a.date!==date).map(a=>({...a}));
 const changes:string[]=[];const warnings:string[]=[];let potentialLoss=0;let addedCost=0;
 if(!current.some(a=>a.fixed))warnings.push('No fixed reservations marked. Check the Fixed Reservation boxes in Edit Trip to protect bookings.');
 if(issue==='cost'){addedCost=Math.max(0,expense);changes.push('Additional expense recorded; timetable remains unchanged');}
 if(issue==='missed'){
  const victim=current.find(a=>a.fixed)||current[0];
  if(victim){potentialLoss=victim.paid?victim.cost:0;warnings.push('Confirm refund and booking terms directly; the booking was not cancelled');changes.push('Booking to verify: '+victim.name);}
 }
 const movedLater:Activity[]=[];
 if(issue==='rain'){
  const nextDays=Array.from({length:30},(_,i)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i+1);return d.toISOString().slice(0,10)}).filter(d=>d<=trip.endDate);
  for(const a of current.filter(a=>a.outdoor&&!a.fixed)){
   if(nextDays.length){a.date=nextDays[0];movedLater.push(a);changes.push('Move '+a.name+' to '+a.date+' (time unverified)');}
   else warnings.push('No later trip date for '+a.name+'; consider skipping it if conditions are unsafe');
  }
  if(!current.some(a=>a.outdoor&&!a.fixed))warnings.push('No flexible outdoor activities available to move');
  warnings.push('Weather, opening hours and moved-day schedule need confirmation');
 }
 const rest=current.filter(a=>a.date===date);
 if(issue==='late'){
  const shift=Math.max(0,Math.min(720,delay));
  for(const a of rest){if(!a.fixed)a.start=clock(Math.min(1439,minutes(a.start)+shift));}
 }
 // Fixed reservations remain at their original date and time. Flexible slots are
 // arranged in chronological order, with conflict checks against all placed events.
 const fixed=rest.filter(a=>a.fixed);
 const flexible=rest.filter(a=>!a.fixed).sort((a,b)=>a.start.localeCompare(b.start));
 const placed= [...fixed].sort((a,b)=>a.start.localeCompare(b.start));
 const buffer=strategy==='relax'?30:0;
 for(const a of flexible){
  if(issue==='cost'||issue==='missed'){placed.push(a);continue}
  let start=minutes(a.start);
  for(let attempt=0;attempt<rest.length+3;attempt++){
   const collision=placed.filter(p=>start<minutes(p.start)+p.duration+buffer && start+a.duration+buffer>minutes(p.start)).sort((x,y)=>minutes(x.start)-minutes(y.start))[0];
   if(!collision)break;
   start=minutes(collision.start)+collision.duration+buffer;
  }
  if(start+a.duration>1440){warnings.push(a.name+' would end after midnight; not moved automatically');a.start=trip.activities.find(v=>v.id===a.id)?.start||a.start}
  else a.start=clock(start);
  placed.push(a);
 }
 const planned=placed.sort((a,b)=>a.start.localeCompare(b.start));
 for(let i=1;i<planned.length;i++){const prev=planned[i-1],cur=planned[i];if(minutes(cur.start)<minutes(prev.start)+prev.duration)warnings.push('Schedule overlap: '+prev.name+' and '+cur.name)}
 for(const a of rest){const before=trip.activities.find(v=>v.id===a.id);if(before && before.start!==a.start)changes.push(a.name+': '+before.start+' → '+a.start)}
 if(strategy==='budget')warnings.push('Actual transport costs cannot be optimized without route/fare data');
 if(!changes.length)changes.push('No schedule changes proposed');
 return {activities:[...others,...planned,...movedLater].sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)),changes,warnings,addedCost,potentialLoss,issue};
}
export const sumSpend=(a:Activity[])=>a.reduce((s,v)=>s+(Number(v.cost)||0),0);
