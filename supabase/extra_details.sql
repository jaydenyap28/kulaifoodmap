-- ==========================================
-- 1. 升级 restaurants 表：添加 extra_details (JSONB) 存储附加数据
-- ==========================================
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS extra_details JSONB DEFAULT '{}'::jsonb;

-- 2. 更新 snapshot 函数以包含新字段 extra_details
DROP FUNCTION IF EXISTS public.get_restaurants_snapshot();

CREATE OR REPLACE FUNCTION public.get_restaurants_snapshot()
RETURNS TABLE (
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
  affiliate_url text,
  extra_details jsonb, -- 新增的大容量附加字段
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    source_restaurant_id,
    name,
    category,
    address,
    image_url,
    hot_score,
    is_featured,
    is_active,
    is_hidden,
    sort_priority,
    badge_label,
    ad_label,
    affiliate_url,
    extra_details,     -- 新增
    updated_at
  FROM public.restaurants
  ORDER BY id ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurants_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurants_snapshot() TO anon;
