create table if not exists public.restaurants (
  id bigint generated always as identity primary key,
  source_restaurant_id bigint unique,
  name text not null,
  category text,
  address text,
  image_url text,
  hot_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists restaurants_set_updated_at on public.restaurants;

create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute procedure public.set_updated_at();

alter table public.profiles
  add column if not exists spin_date date,
  add column if not exists daily_spin_count integer not null default 0;

update public.profiles
set daily_spin_count = coalesce(daily_spin_count, 0);

alter table public.profiles
  alter column daily_spin_count set default 0,
  alter column daily_spin_count set not null;

create table if not exists public.spin_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_reward_points integer not null,
  restaurant_reward_points integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  cost_points integer not null,
  added_hot_score integer not null,
  created_at timestamptz not null default now()
);

alter table public.spin_logs enable row level security;
alter table public.support_logs enable row level security;

drop policy if exists "Users can view their own spin logs" on public.spin_logs;
create policy "Users can view their own spin logs"
on public.spin_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own support logs" on public.support_logs;
create policy "Users can view their own support logs"
on public.support_logs
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.can_spin_today()
returns table (
  can_spin boolean,
  remaining_spins integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  today_date date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  spins_used integer := 0;
begin
  if auth.uid() is null then
    return query
    select false, 0, '请先使用 Google 登录';
    return;
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid();

  if not found or profile_row.spin_date is distinct from today_date then
    return query
    select true, 2, '今天还可以转 2 次';
    return;
  end if;

  spins_used := coalesce(profile_row.daily_spin_count, 0);

  if spins_used >= 2 then
    return query
    select false, 0, '今天转盘次数已用完，明天再来哦！';
    return;
  end if;

  return query
  select true, 2 - spins_used, format('今天还可以转 %s 次', 2 - spins_used);
end;
$$;

create or replace function public.claim_spin_reward(target_restaurant_id bigint)
returns table (
  success boolean,
  message text,
  total_points integer,
  daily_spin_count integer,
  restaurant_hot_score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  restaurant_row public.restaurants%rowtype;
  today_date date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  next_spin_count integer;
  next_total_points integer;
  next_restaurant_hot_score integer;
begin
  if auth.uid() is null then
    return query
    select false, '请先使用 Google 登录', null::integer, null::integer, null::integer;
    return;
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select *
  into restaurant_row
  from public.restaurants
  where id = target_restaurant_id
     or source_restaurant_id = target_restaurant_id
  for update;

  if not found then
    raise exception 'RESTAURANT_NOT_FOUND';
  end if;

  if profile_row.spin_date is distinct from today_date then
    update public.profiles
    set
      spin_date = today_date,
      daily_spin_count = 0
    where id = auth.uid();

    profile_row.spin_date := today_date;
    profile_row.daily_spin_count := 0;
  end if;

  if coalesce(profile_row.daily_spin_count, 0) >= 2 then
    return query
    select
      false,
      '今天转盘次数已用完，明天再来哦！',
      coalesce(profile_row.user_points, 0),
      coalesce(profile_row.daily_spin_count, 0),
      coalesce(restaurant_row.hot_score, 0);
    return;
  end if;

  next_spin_count := coalesce(profile_row.daily_spin_count, 0) + 1;
  next_total_points := coalesce(profile_row.user_points, 0) + 2;
  next_restaurant_hot_score := coalesce(restaurant_row.hot_score, 0) + 20;

  update public.profiles
  set
    user_points = next_total_points,
    daily_spin_count = next_spin_count,
    spin_date = today_date
  where id = auth.uid();

  update public.restaurants
  set hot_score = next_restaurant_hot_score
  where id = restaurant_row.id;

  insert into public.spin_logs (
    user_id,
    restaurant_id,
    user_reward_points,
    restaurant_reward_points
  )
  values (
    auth.uid(),
    restaurant_row.id,
    2,
    20
  );

  return query
  select
    true,
    '转盘结算成功！获得 2 积分',
    next_total_points,
    next_spin_count,
    next_restaurant_hot_score;
end;
$$;

create or replace function public.support_restaurant(target_restaurant_id bigint)
returns table (
  success boolean,
  message text,
  total_points integer,
  restaurant_hot_score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  restaurant_row public.restaurants%rowtype;
  next_total_points integer;
  next_restaurant_hot_score integer;
begin
  if auth.uid() is null then
    return query
    select false, '请先使用 Google 登录', null::integer, null::integer;
    return;
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select *
  into restaurant_row
  from public.restaurants
  where id = target_restaurant_id
     or source_restaurant_id = target_restaurant_id
  for update;

  if not found then
    raise exception 'RESTAURANT_NOT_FOUND';
  end if;

  if coalesce(profile_row.user_points, 0) < 10 then
    return query
    select
      false,
      '积分不足，请先去签到或转盘赚取积分！',
      coalesce(profile_row.user_points, 0),
      coalesce(restaurant_row.hot_score, 0);
    return;
  end if;

  next_total_points := coalesce(profile_row.user_points, 0) - 10;
  next_restaurant_hot_score := coalesce(restaurant_row.hot_score, 0) + 10;

  update public.profiles
  set user_points = next_total_points
  where id = auth.uid();

  update public.restaurants
  set hot_score = next_restaurant_hot_score
  where id = restaurant_row.id;

  insert into public.support_logs (
    user_id,
    restaurant_id,
    cost_points,
    added_hot_score
  )
  values (
    auth.uid(),
    restaurant_row.id,
    10,
    10
  );

  return query
  select
    true,
    '助力成功！扣除 10 积分。该商家热度 +10！',
    next_total_points,
    next_restaurant_hot_score;
end;
$$;

grant execute on function public.claim_spin_reward(bigint) to authenticated;
grant execute on function public.support_restaurant(bigint) to authenticated;
grant execute on function public.can_spin_today() to authenticated;
grant execute on function public.can_spin_today() to anon;
