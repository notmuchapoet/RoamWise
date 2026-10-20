export type Activity={id:string,name:string,date:string,start:string,duration:number,fixed:boolean,outdoor:boolean,cost:number,paid:boolean};
export type Trip={id:string,name:string,city:string,country:string,latitude:number|null,longitude:number|null,timezone:string,startDate:string,endDate:string,currency:string,homeCurrency:string,budget:number,activities:Activity[]};
export type Issue='rain'|'late'|'missed'|'cost';
export type Strategy='protect'|'relax'|'budget';
export type Proposal={activities:Activity[],changes:string[],warnings:string[],addedCost:number,potentialLoss:number,issue:Issue};
const minutes=(time:string)=>{const [h,m]=time.split(':').map(Number);return h*60+m};
const clock=(n:number)=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export const uid=()=>globalThis.crypto?.randomUUID?.()??String(Date.now()+Math.random());
export function rescue(trip:Trip,date:string,issue:Issue,strategy:Strategy,delay=60,expense=0):Proposal{
 const today=trip.activities.filter(a=>a.date===date).sort((a,b)=>a.start.localeCompare(b.start));
 const all=trip.activities.filter(a=>a.date!==date).map(a=>({...a}));
 const changes:string[]=[];const warnings:string[]=[];let potentialLoss=0;let addedCost=0;
 const rest=today.map(a=>({...a}));
 if(issue==='cost'){addedCost=Math.max(0,expense);changes.push('Extra expense recorded in scenario; original itinerary preserved');}
 if(issue==='missed'){
  const victim=rest.find(a=>a.fixed)||rest[0];if(victim){potentialLoss=victim.paid?victim.cost:0;warnings.push('Check booking terms directly; refund or rebooking is not verified');changes.push('Flagged '+victim.name+' for confirmation; no booking was automatically cancelled');}
 }
 if(issue==='rain'){
  const outdoor=rest.filter(a=>a.outdoor&&!a.fixed);
  if(!outdoor.length)warnings.push('No flexible outdoor activities to reschedule');
  for(const a of outdoor){const nextDate=trip.activities.map(v=>v.date).concat([trip.endDate]).filter(v=>v>date).sort()[0];if(nextDate && nextDate<=trip.endDate){a.date=nextDate;changes.push('Move '+a.name+' to '+nextDate+' (timing requires confirmation)');}else{warnings.push('No later trip day available for '+a.name);changes.push('Consider skipping '+a.name+' if weather is unsuitable');}}
  rest.splice(0,rest.length,...rest.filter(a=>a.date===date));
 }
 if(issue==='late'){
  const shift=Math.max(0,Math.min(720,delay));
  for(const a of rest){if(!a.fixed){a.start=clock(minutes(a.start)+shift);changes.push('Shift '+a.name+' by '+shift+' minutes');}}
 }
 const fixed=rest.filter(a=>a.fixed);const flexible=rest.filter(a=>!a.fixed);let cursor=0;
 for(const a of flexible){let start=minutes(a.start);if(strategy==='relax')start=Math.max(start,cursor+30);for(const f of fixed){const fs=minutes(f.start),fe=fs+f.duration;if(start<fe&&start+a.duration>fs){start=fe+ (strategy==='relax'?30:15);changes.push('Reschedule '+a.name+' to avoid '+f.name);}}
 if(start+a.duration>1440){warnings.push(a.name+' extends past midnight; review manually');start=Math.min(1439,start);}a.start=clock(start);cursor=start+a.duration;}
 const planned=[...fixed,...flexible].sort((a,b)=>a.start.localeCompare(b.start));
 for(let i=1;i<planned.length;i++){let prev=planned[i-1],cur=planned[i];if(minutes(cur.start)<minutes(prev.start)+prev.duration)warnings.push('Schedule overlap: '+prev.name+' and '+cur.name);}
 if(strategy==='budget')warnings.push('Transport and entry-fee changes are not calculated without user-supplied amounts');
 if(issue==='rain')warnings.push('Weather suitability and opening hours require confirmation; later-day slots may conflict');
 if(!changes.length)changes.push('No automatic schedule changes necessary');
 return {activities:[...all,...planned,...(issue==='rain'?today.filter(a=>a.date!==date):[])].sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)),changes,warnings,addedCost,potentialLoss,issue};
}
export const sumSpend=(a:Activity[])=>a.reduce((s,v)=>s+(Number(v.cost)||0),0);
