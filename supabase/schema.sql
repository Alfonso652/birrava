-- Birrava: esquema completo. Pegar entero en Supabase > SQL Editor > Run.
-- Es idempotente en lo posible para poder re-ejecutarlo tras cambios.

-- ─── Tablas ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.bars (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  city        text check (char_length(city) <= 60),
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

-- Id del bar en OpenStreetMap ("node/123"): evita duplicar el mismo bar real.
alter table public.bars add column if not exists osm_id text unique check (char_length(osm_id) <= 40);

create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),
  -- Referencia a profiles (no a auth.users) para que PostgREST pueda embeber el username.
  user_id     uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  beer_name   text not null check (char_length(beer_name) between 1 and 80),
  brewery     text check (char_length(brewery) <= 80),
  style       text not null check (char_length(style) between 1 and 40),
  abv         numeric(4,1) check (abv between 0 and 70),
  rating      smallint not null check (rating between 1 and 5),
  note        text check (char_length(note) <= 500),
  bar_id      uuid references public.bars (id) on delete set null,
  photo_path  text check (char_length(photo_path) <= 200),
  created_at  timestamptz not null default now()
);

create index if not exists checkins_created_idx on public.checkins (created_at desc);
create index if not exists checkins_user_idx on public.checkins (user_id, created_at desc);
create index if not exists checkins_bar_idx on public.checkins (bar_id);

create table if not exists public.cheers (
  checkin_id  uuid not null references public.checkins (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at  timestamptz not null default now(),
  primary key (checkin_id, user_id)
);

-- ─── RLS: todo usuario logueado lee todo; cada uno solo escribe lo suyo ─────

alter table public.profiles enable row level security;
alter table public.bars     enable row level security;
alter table public.checkins enable row level security;
alter table public.cheers   enable row level security;

drop policy if exists "leer perfiles" on public.profiles;
create policy "leer perfiles" on public.profiles for select to authenticated using (true);
drop policy if exists "crear mi perfil" on public.profiles;
create policy "crear mi perfil" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "leer bares" on public.bars;
create policy "leer bares" on public.bars for select to authenticated using (true);
drop policy if exists "crear bares" on public.bars;
create policy "crear bares" on public.bars for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "editar mis bares" on public.bars;
create policy "editar mis bares" on public.bars for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "leer checkins" on public.checkins;
create policy "leer checkins" on public.checkins for select to authenticated using (true);
drop policy if exists "crear mis checkins" on public.checkins;
create policy "crear mis checkins" on public.checkins for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "borrar mis checkins" on public.checkins;
create policy "borrar mis checkins" on public.checkins for delete to authenticated using (user_id = auth.uid());

drop policy if exists "leer cheers" on public.cheers;
create policy "leer cheers" on public.cheers for select to authenticated using (true);
drop policy if exists "dar cheers" on public.cheers;
create policy "dar cheers" on public.cheers for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "quitar cheers" on public.cheers;
create policy "quitar cheers" on public.cheers for delete to authenticated using (user_id = auth.uid());

-- ─── Rankings ──────────────────────────────────────────────────────────────
-- security invoker: respetan RLS del que llama. Se puntúa variedad, no volumen:
-- una cerveza cuenta una vez aunque se repita.

create or replace function public.ranking(desde timestamptz default null)
returns table (user_id uuid, username text, cervezas bigint, estilos bigint, bares bigint, checkins bigint)
language sql stable security invoker set search_path = public as $$
  select p.id, p.username,
         count(distinct lower(c.beer_name) || '|' || lower(coalesce(c.brewery, ''))),
         count(distinct lower(c.style)),
         count(distinct c.bar_id),
         count(*)
  from public.checkins c
  join public.profiles p on p.id = c.user_id
  where desde is null or c.created_at >= desde
  group by p.id, p.username
  order by 3 desc, 4 desc, 5 desc
  limit 100
$$;

create or replace function public.ranking_bar(bar uuid)
returns table (user_id uuid, username text, cervezas bigint, estilos bigint, checkins bigint)
language sql stable security invoker set search_path = public as $$
  select p.id, p.username,
         count(distinct lower(c.beer_name) || '|' || lower(coalesce(c.brewery, ''))),
         count(distinct lower(c.style)),
         count(*)
  from public.checkins c
  join public.profiles p on p.id = c.user_id
  where c.bar_id = bar
  group by p.id, p.username
  order by 3 desc, 4 desc
  limit 50
$$;

-- Bares con su nº de check-ins, para el listado.
-- drop + create: b.* cambia de columnas al añadir osm_id y "create or replace" no lo admite.
drop view if exists public.bars_stats;
create view public.bars_stats with (security_invoker = on) as
  select b.*, count(c.id) as checkins
  from public.bars b
  left join public.checkins c on c.bar_id = b.id
  group by b.id;

-- ─── Storage: fotos públicas; cada usuario sube solo a su carpeta <uid>/ ────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "subir mis fotos" on storage.objects;
create policy "subir mis fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "borrar mis fotos" on storage.objects;
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
