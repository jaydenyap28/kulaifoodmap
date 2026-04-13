-- ==========================================
-- 1. 解除管理员 (role = 'admin') 的今日转盘最大次数限制
-- 2. 将转盘固定奖励修改为 +10 分，解决分数错乱叠加的问题
-- ==========================================

-- 修改 can_spin_today，允许 admin 无限测试
CREATE OR REPLACE FUNCTION public.can_spin_today()
RETURNS TABLE (
  can_spin boolean,
  remaining_spins integer,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
  today_date date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  spins_used integer := 0;
BEGIN
  if auth.uid() is null then
    return query select false, 0, '请先使用 Google 登录';
    return;
  end if;

  select * into profile_row from public.profiles where id = auth.uid();

  -- 如果是管理员，直接给予无限次数 (返回 999 次)
  if profile_row.role = 'admin' then
    return query select true, 999, '管理员无限制测试中';
    return;
  end if;

  if not found or profile_row.spin_date is distinct from today_date then
    return query select true, 2, '今天还可以转 2 次';
    return;
  end if;

  spins_used := coalesce(profile_row.daily_spin_count, 0);

  if spins_used >= 2 then
    return query select false, 0, '今天转盘次数已用完，明天再来哦！';
    return;
  end if;

  return query select true, 2 - spins_used, format('今天还可以转 %s 次', 2 - spins_used);
END;
$$;

-- 修改 claim_spin_reward，允许 admin 无视 2 次结算上限，并将商家奖励固定为 10 分
CREATE OR REPLACE FUNCTION public.claim_spin_reward(target_restaurant_id bigint)
RETURNS TABLE (
  success boolean,
  message text,
  total_points integer,
  daily_spin_count integer,
  restaurant_hot_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
  restaurant_row public.restaurants%rowtype;
  today_date date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  next_spin_count integer;
  next_total_points integer;
  next_restaurant_hot_score integer;
BEGIN
  if auth.uid() is null then
    return query select false, '请先使用 Google 登录', null::integer, null::integer, null::integer;
    return;
  end if;

  select * into profile_row from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select * into restaurant_row from public.restaurants 
  where id = target_restaurant_id or source_restaurant_id = target_restaurant_id for update;
  if not found then raise exception 'RESTAURANT_NOT_FOUND'; end if;

  if profile_row.spin_date is distinct from today_date then
    update public.profiles set spin_date = today_date, daily_spin_count = 0 where id = auth.uid();
    profile_row.spin_date := today_date;
    profile_row.daily_spin_count := 0;
  end if;

  -- [核心修改] 只拦截非 admin 用户
  if coalesce(profile_row.role, '') <> 'admin' and coalesce(profile_row.daily_spin_count, 0) >= 2 then
    return query select false, '今天转盘次数已用完，明天再来哦！', coalesce(profile_row.user_points, 0), coalesce(profile_row.daily_spin_count, 0), coalesce(restaurant_row.hot_score, 0);
    return;
  end if;

  next_spin_count := coalesce(profile_row.daily_spin_count, 0) + 1;
  next_total_points := coalesce(profile_row.user_points, 0) + 2;
  -- [核心修复] 将以前的 +20 改为 +10
  next_restaurant_hot_score := coalesce(restaurant_row.hot_score, 0) + 10;

  update public.profiles set user_points = next_total_points, daily_spin_count = next_spin_count, spin_date = today_date where id = auth.uid();
  update public.restaurants set hot_score = next_restaurant_hot_score where id = restaurant_row.id;

  insert into public.spin_logs (user_id, restaurant_id, user_reward_points, restaurant_reward_points)
  values (auth.uid(), restaurant_row.id, 2, 10);

  return query select true, '转盘结算成功！获得 2 积分', next_total_points, next_spin_count, next_restaurant_hot_score;
END;
$$;
