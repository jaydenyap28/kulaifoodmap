-- ==========================================
-- 为后台新增【管理员获取全站加分记录】报表接口
-- 包含：转盘中奖记录(Spin) 和 助力打赏记录(Support)
-- ==========================================

CREATE OR REPLACE FUNCTION public.admin_get_activity_logs()
RETURNS TABLE (
  log_type text,
  restaurant_name text,
  added_hot_score integer,
  user_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
BEGIN
  -- 验证是否为管理员 (安全性检查)
  select * into profile_row from public.profiles where id = auth.uid();
  if coalesce(profile_row.role, '') <> 'admin' then
    raise exception 'Permission denied. Admins only.';
  end if;

  RETURN QUERY
  SELECT 
    '转盘大奖 (Wheel Spin)'::text as log_type,
    r.name::text as restaurant_name,
    s.restaurant_reward_points as added_hot_score,
    s.user_id,
    s.created_at
  FROM public.spin_logs s
  JOIN public.restaurants r ON s.restaurant_id = r.id

  UNION ALL

  SELECT 
    '助力打赏 (Support)'::text as log_type,
    r.name::text as restaurant_name,
    sl.added_hot_score as added_hot_score,
    sl.user_id,
    sl.created_at
  FROM public.support_logs sl
  JOIN public.restaurants r ON sl.restaurant_id = r.id

  ORDER BY created_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_activity_logs() TO authenticated;
