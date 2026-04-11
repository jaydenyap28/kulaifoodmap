create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'full_name'
  ) then
    alter table public.profiles rename column name to full_name;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'points'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_points'
  ) then
    alter table public.profiles rename column points to user_points;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'last_spin_date'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'last_checkin_date'
  ) then
    alter table public.profiles rename column last_spin_date to last_checkin_date;
  end if;
end $$;

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists user_points integer not null default 0,
  add column if not exists last_checkin_date date,
  add column if not exists consecutive_days integer not null default 0;

update public.profiles
set
  user_points = coalesce(user_points, 0),
  consecutive_days = coalesce(consecutive_days, 0);

alter table public.profiles
  alter column user_points set default 0,
  alter column user_points set not null,
  alter column consecutive_days set default 0,
  alter column consecutive_days set not null;

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

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
    consecutive_days
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    0,
    null,
    0
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.claim_daily_checkin()
returns table (
  user_points integer,
  consecutive_days integer,
  last_checkin_date date,
  awarded_points integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  today_date date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  next_consecutive_days integer;
  next_awarded_points integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    insert into public.profiles (id, user_points, consecutive_days)
    values (auth.uid(), 0, 0)
    on conflict (id) do nothing;

    select *
    into profile_row
    from public.profiles
    where id = auth.uid()
    for update;
  end if;

  if profile_row.last_checkin_date = today_date then
    raise exception 'ALREADY_CHECKED_IN_TODAY';
  end if;

  if profile_row.last_checkin_date = today_date - 1 then
    next_consecutive_days := coalesce(profile_row.consecutive_days, 0) + 1;
  else
    next_consecutive_days := 1;
  end if;

  if next_consecutive_days > 7 then
    next_consecutive_days := 1;
  end if;

  next_awarded_points := case next_consecutive_days
    when 1 then 10
    when 2 then 15
    when 3 then 20
    when 4 then 25
    when 5 then 30
    when 6 then 35
    when 7 then 50
    else 10
  end;

  update public.profiles
  set
    user_points = coalesce(profile_row.user_points, 0) + next_awarded_points,
    consecutive_days = next_consecutive_days,
    last_checkin_date = today_date
  where id = auth.uid();

  return query
  select
    p.user_points,
    p.consecutive_days,
    p.last_checkin_date,
    next_awarded_points as awarded_points
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

grant execute on function public.claim_daily_checkin() to authenticated;
