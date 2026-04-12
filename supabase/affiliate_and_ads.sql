-- ==========================================
-- 1. 升级 restaurants 表 (确保所有涉及的字段都存在)
-- ==========================================
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_priority INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_label TEXT,
  ADD COLUMN IF NOT EXISTS ad_label TEXT,
  ADD COLUMN IF NOT EXISTS source_restaurant_id BIGINT;

-- 2. 更新 snapshot 函数以包含新字段
-- 因为返回的表格结构改变了，我们需要先删除旧的再创建新的
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
  affiliate_url text, -- 新增字段
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
    affiliate_url, -- 新增字段
    updated_at
  FROM public.restaurants
  ORDER BY id ASC;
$$;

-- 重新赋予权限
GRANT EXECUTE ON FUNCTION public.get_restaurants_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurants_snapshot() TO anon;


-- ==========================================
-- 2. 准备必备的基础权限函数 (防止此前遗漏)
-- ==========================================
-- (a) 确保 profiles 有 role
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- (b) 重建 is_admin() 检查函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ==========================================
-- 3. 建立全局广告系统 (global_ads 表)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.global_ads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_name TEXT NOT NULL,         -- 广告名称备注
  image_url TEXT NOT NULL,       -- 图片链接
  target_url TEXT NOT NULL,      -- 点击跳转链接
  position TEXT NOT NULL,        -- 'top_banner', 'under_wheel' 等
  is_active BOOLEAN DEFAULT true,-- 是否启用
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 开启 RLS 权限控制
ALTER TABLE public.global_ads ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有人可以查看已启用的广告
DROP POLICY IF EXISTS "Public can read active ads" ON public.global_ads;
CREATE POLICY "Public can read active ads" 
ON public.global_ads 
FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

-- 策略 2: 只有管理员可以增删改
DROP POLICY IF EXISTS "Admins can manage ads" ON public.global_ads;
CREATE POLICY "Admins can manage ads" 
ON public.global_ads 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS global_ads_set_updated_at ON public.global_ads;
CREATE TRIGGER global_ads_set_updated_at
BEFORE UPDATE ON public.global_ads
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- (可选) 插入一个测试数据
-- INSERT INTO public.global_ads (ad_name, image_url, target_url, position, is_active)
-- VALUES ('首页轮播广告', 'https://via.placeholder.com/1200x300?text=Involve+Asia+Ads', 'https://shopee.com.my', 'under_wheel', true);
