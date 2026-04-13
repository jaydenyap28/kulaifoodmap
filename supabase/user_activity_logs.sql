-- ==========================================
-- 为全站新增【访问及点击追踪报表】
-- 追踪来客和会员的商家查看、外卖链接点击等操作
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- 如果已登录
    session_id text, -- 如果未登录，使用本地设备的 session_id
    activity_type text NOT NULL, -- 如： 'restaurant_view', 'delivery_link_click'
    restaurant_id bigint REFERENCES public.restaurants(id) ON DELETE CASCADE,
    details jsonb DEFAULT '{}'::jsonb, -- 额外的访问信息如 URL，浏览器信息等
    created_at timestamptz DEFAULT now()
);

-- 安全策略：开启Row Level Security
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 任何人可以写入 (客户端追踪)
CREATE POLICY "Anyone can insert tracking logs"
ON public.user_activity_logs
FOR INSERT
WITH CHECK (true);

-- 仅 Admin 可以读取这部分报表数据
CREATE POLICY "Admins can view tracking logs"
ON public.user_activity_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- RLS 需要开启的额外支持
GRANT ALL ON TABLE public.user_activity_logs TO authenticated;
GRANT ALL ON TABLE public.user_activity_logs TO anon;

-- 为了让管理员读取包含商家信息的报表，增加一个安全的后端读取函数
CREATE OR REPLACE FUNCTION public.admin_get_tracking_reports(
    date_filter text DEFAULT 'all'
)
RETURNS TABLE (
    log_id uuid,
    activity_type text,
    is_member boolean,
    created_at timestamptz,
    restaurant_id bigint,
    restaurant_name text,
    category text,
    details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_row public.profiles%rowtype;
    filter_start_time timestamptz;
BEGIN
    -- 验证管理员
    select * into profile_row from public.profiles where id = auth.uid();
    if coalesce(profile_row.role, '') <> 'admin' then
        raise exception 'Permission denied. Admins only.';
    end if;

    -- 判断日期参数
    if date_filter = 'today' then
        filter_start_time := date_trunc('day', now());
    elsif date_filter = 'last_7_days' then
        filter_start_time := date_trunc('day', now() - interval '7 days');
    elsif date_filter = 'this_month' then
        filter_start_time := date_trunc('month', now());
    else
        -- 包含 specific date 在前端传具体的过滤的话可以扩充，但为了简单起见，在这里我们如果不是以上的我们就给回全部，由前端进行深度过滤
        filter_start_time := '1970-01-01'::timestamptz;
    end if;

    RETURN QUERY
    SELECT 
        l.id as log_id,
        l.activity_type,
        (l.user_id IS NOT NULL) as is_member,
        l.created_at,
        r.id as restaurant_id,
        COALESCE(r.name, r.extra_details->>'name', 'Unknown') as restaurant_name,
        COALESCE(r.category, r.extra_details->>'category', '') as category,
        l.details
    FROM public.user_activity_logs l
    LEFT JOIN public.restaurants r ON l.restaurant_id = r.id
    WHERE l.created_at >= filter_start_time
    ORDER BY l.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_tracking_reports(text) TO authenticated;
