-- 添加更多的全站设置列 (WhatsApp 群连接、打赏图床连接)
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS whatsapp_link TEXT,
ADD COLUMN IF NOT EXISTS tng_qr_url TEXT,
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS community_title TEXT DEFAULT '加入古来吃货群!',
ADD COLUMN IF NOT EXISTS community_desc TEXT DEFAULT '不定期搞活动送福利，还能一起拼桌约饭。',
ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS support_title TEXT DEFAULT '请站长喝杯 Kopi ☕',
ADD COLUMN IF NOT EXISTS support_desc TEXT DEFAULT '网站好用？随心赞助一杯咖啡，支持服务器续费！';

-- 更新默认测试数据（若表为空的话会自动生成一条）
INSERT INTO public.site_settings (hero_bg_url, hero_title, hero_subtitle, hero_enabled, whatsapp_link, tng_qr_url)
SELECT 
  'https://i.ibb.co/7J5qjZtv/image.png?v=2', 
  '古来美食地图', 
  'Kulai Food Map', 
  true,
  '', 
  ''
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
