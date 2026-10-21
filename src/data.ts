import {openDB} from 'idb';import type{Trip}from'./logic';
const db=()=>openDB('roamwise-v1',1,{upgrade(d){d.createObjectStore('trips',{keyPath:'id'})}});
import { createClient } from '@supabase/supabase-js';
const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
// Only use the project origin. Supabase SDK adds /auth/v1 and /rest/v1 itself.
const supabaseUrl = (() => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')
      ? parsed.origin : '';
  } catch { return ''; }
})();
export const cloudEnabled = Boolean(rawUrl && supabaseKey);
export const supabaseConfigError = cloudEnabled && !supabaseUrl
  ? 'Invalid Supabase Project URL. Use https://YOUR-PROJECT.supabase.co (no /rest/v1, /auth/v1 or dashboard path).'
  : '';
export const supabase = cloudEnabled && supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;
const requireUser = async () => {
  if (!supabase) throw Error('Cloud login is not configured');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw Error('Please sign in again');
  return user;
};
export async function listTrips(): Promise<Trip[]> {
  if (!supabase) return (await db()).getAll('trips');
  const user = await requireUser();
  const { data, error } = await supabase.from('trips').select('content').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => row.content as Trip);
}
export async function saveTrip(trip: Trip): Promise<void> {
  if (!supabase) { await (await db()).put('trips', trip); return; }
  const user = await requireUser();
  const { error } = await supabase.from('trips').upsert({ id: trip.id, user_id: user.id, content: trip, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}
export async function deleteTrip(id: string): Promise<void> {
  if (!supabase) { await (await db()).delete('trips', id); return; }
  const user = await requireUser();
  const { error } = await supabase.from('trips').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}
export async function importTrips(data: unknown) {
  if (!Array.isArray(data) || data.length > 100) throw Error('Invalid backup');
  for (const t of data) {
    if (!t || typeof t.id !== 'string' || typeof t.city !== 'string' || !Array.isArray(t.activities)) throw Error('Invalid trip');
    await saveTrip(t as Trip);
  }
}
export async function citySearch(query:string){const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query,count:'8',language:'en',format:'json'}));if(!r.ok)throw Error('Location lookup unavailable');return (await r.json()).results||[]}
export async function getWeather(t:Trip,date:string){if(t.latitude===null||t.longitude===null)return null;const url='https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:String(t.latitude),longitude:String(t.longitude),hourly:'precipitation_probability,weather_code',timezone:t.timezone||'auto',forecast_days:'16'});const r=await fetch(url);if(!r.ok)throw Error('Weather unavailable');const data=await r.json();const selected=(data.hourly?.time||[]).map((time:string,i:number)=>({time,probability:data.hourly.precipitation_probability[i]})).filter((x:{time:string})=>x.time.startsWith(date));return selected.length?Math.max(...selected.filter((x:{time:string})=>Number(x.time.slice(11,13))>=8&&Number(x.time.slice(11,13))<=20).map((x:{probability:number})=>x.probability),0):null}
export async function getRate(base:string,to:string){if(base===to)return{rate:1,date:'same currency'};const r=await fetch('https://api.frankfurter.dev/v2/rate/'+encodeURIComponent(base)+'/'+encodeURIComponent(to));if(!r.ok)throw Error('Exchange rate unavailable');const d=await r.json();if(!Number.isFinite(d.rate))throw Error('Exchange rate unavailable');return{rate:d.rate as number,date:d.date as string}}
