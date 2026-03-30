-- =============================================
-- TARJETAS AMIGOS - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Players table
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  emoji text default '⚽',
  created_at timestamptz default now()
);

-- Gatherings (juntadas)
create table gatherings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date date not null default current_date,
  referee_id uuid references players(id),
  assistant_id uuid references players(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Attendance
create table attendance (
  id uuid default gen_random_uuid() primary key,
  gathering_id uuid references gatherings(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  unique(gathering_id, player_id)
);

-- Cards
create table cards (
  id uuid default gen_random_uuid() primary key,
  gathering_id uuid references gatherings(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  issued_by uuid references players(id),
  type text not null check (type in ('yellow', 'blue', 'red')),
  reason text,
  created_at timestamptz default now()
);

-- Enable realtime on cards table
alter publication supabase_realtime add table cards;

-- Enable RLS but allow all (no auth needed for this app)
alter table players enable row level security;
alter table gatherings enable row level security;
alter table attendance enable row level security;
alter table cards enable row level security;

create policy "Allow all on players" on players for all using (true) with check (true);
create policy "Allow all on gatherings" on gatherings for all using (true) with check (true);
create policy "Allow all on attendance" on attendance for all using (true) with check (true);
create policy "Allow all on cards" on cards for all using (true) with check (true);

-- Seed: Los 20 amigos (update names as needed)
insert into players (name, emoji) values
  ('Joaquín Ibáñez', '🦅'),
  ('Jugador 2', '⚽'),
  ('Jugador 3', '🔥'),
  ('Jugador 4', '💀'),
  ('Jugador 5', '🎯'),
  ('Jugador 6', '🐐'),
  ('Jugador 7', '🤡'),
  ('Jugador 8', '👑'),
  ('Jugador 9', '🎪'),
  ('Jugador 10', '🚀'),
  ('Jugador 11', '💣'),
  ('Jugador 12', '🦈'),
  ('Jugador 13', '🐺'),
  ('Jugador 14', '⚡'),
  ('Jugador 15', '🏆'),
  ('Jugador 16', '🎸'),
  ('Jugador 17', '🌶️'),
  ('Jugador 18', '🦁'),
  ('Jugador 19', '🍕'),
  ('Jugador 20', '🎲');
