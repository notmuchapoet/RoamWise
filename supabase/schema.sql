-- Run in Supabase SQL Editor. Each signed-in person sees only their own trips.
create table if not exists public.trips (
 id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 content jsonb not null,
 updated_at timestamptz not null default now()
);
create index if not exists trips_user_id_updated_idx on public.trips (user_id, updated_at desc);
alter table public.trips enable row level security;
create policy "Users read their own trips" on public.trips for select to authenticated using (auth.uid() = user_id);
create policy "Users create their own trips" on public.trips for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their own trips" on public.trips for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own trips" on public.trips for delete to authenticated using (auth.uid() = user_id);
