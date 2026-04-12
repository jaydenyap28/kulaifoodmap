create table if not exists public.site_settings (
  id bigint generated always as identity primary key,
  hero_bg_url text,
  hero_title text,
  hero_subtitle text,
  hero_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create unique index if not exists site_settings_single_row_idx
on public.site_settings ((true));

insert into public.site_settings (hero_bg_url, hero_title, hero_subtitle, hero_enabled)
select
  'https://i.ibb.co/7J5qjZtv/image.png?v=2',
  '古来美食地图',
  'Kulai Food Map',
  true
where not exists (
  select 1 from public.site_settings
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute procedure public.set_updated_at();

alter table public.restaurants
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists sort_priority integer not null default 0,
  add column if not exists badge_label text,
  add column if not exists ad_label text;

update public.restaurants
set
  is_featured = coalesce(is_featured, false),
  is_active = coalesce(is_active, true),
  is_hidden = coalesce(is_hidden, false),
  sort_priority = coalesce(sort_priority, 0);

alter table public.restaurants
  alter column is_featured set default false,
  alter column is_featured set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column is_hidden set default false,
  alter column is_hidden set not null,
  alter column sort_priority set default 0,
  alter column sort_priority set not null;

alter table public.profiles
  add column if not exists role text not null default 'user';

update public.profiles
set role = coalesce(nullif(role, ''), 'user');

alter table public.profiles
  alter column role set default 'user',
  alter column role set not null;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    user_points,
    last_checkin_date,
    consecutive_days,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    0,
    null,
    0,
    'user'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

alter table public.site_settings enable row level security;
alter table public.restaurants enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
drop policy if exists "Public can read restaurants" on public.restaurants;
drop policy if exists "Admins can update restaurants" on public.restaurants;

create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "Admins can insert site settings"
on public.site_settings
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read restaurants"
on public.restaurants
for select
to anon, authenticated
using (true);

create policy "Admins can update restaurants"
on public.restaurants
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_restaurants_snapshot()
returns table (
  id bigint,
  source_restaurant_id bigint,
  name text,
  category text,
  address text,
  image_url text,
  hot_score integer,
  is_featured boolean,
  is_active boolean,
  is_hidden boolean,
  sort_priority integer,
  badge_label text,
  ad_label text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    restaurants.id,
    restaurants.source_restaurant_id,
    restaurants.name,
    restaurants.category,
    restaurants.address,
    restaurants.image_url,
    restaurants.hot_score,
    restaurants.is_featured,
    restaurants.is_active,
    restaurants.is_hidden,
    restaurants.sort_priority,
    restaurants.badge_label,
    restaurants.ad_label,
    restaurants.updated_at
  from public.restaurants
  order by restaurants.id asc;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_restaurants_snapshot() to authenticated;
grant execute on function public.get_restaurants_snapshot() to anon;
