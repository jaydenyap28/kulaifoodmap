-- 添加更多的全站设置列 (WhatsApp 群连接、打赏图床连接)
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS whatsapp_link TEXT,
ADD COLUMN IF NOT EXISTS tng_qr_url TEXT;

-- 若不需要更新，您可以忽略以下。
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
