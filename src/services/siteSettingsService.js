import { supabase } from '../lib/supabaseClient';

export const DEFAULT_SITE_SETTINGS = {
  hero_bg_url: 'https://i.ibb.co/7J5qjZtv/image.png?v=2',
  hero_title: '古来美食地图',
  hero_subtitle: 'Kulai Food Map',
  hero_enabled: true,
  whatsapp_link: 'https://chat.whatsapp.com/GzBIsY60q0P7uI8SOfE2C7',
  tng_qr_url: '',
  community_enabled: true,
  community_title: '加入古来吃货群!',
  community_desc: '不定期搞活动送福利，还能一起拼桌约饭。',
  support_enabled: true,
  support_title: '请站长喝杯 Kopi ☕',
  support_desc: '网站好用？随心赞助一杯咖啡，支持服务器续费！'
};

const SETTINGS_COLUMNS = 'id, hero_bg_url, hero_title, hero_subtitle, hero_enabled, whatsapp_link, tng_qr_url, community_enabled, community_title, community_desc, support_enabled, support_title, support_desc, updated_at';

export const normalizeSiteSettings = (settings) => ({
  ...DEFAULT_SITE_SETTINGS,
  ...(settings || {}),
});

export const getSiteSettings = async () => {
  if (!supabase) {
    return normalizeSiteSettings();
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select(SETTINGS_COLUMNS)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeSiteSettings(data);
};

export const saveSiteSettings = async (payload) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const normalizedPayload = normalizeSiteSettings(payload);

  const { data: existingRecord, error: fetchError } = await supabase
    .from('site_settings')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const updateFields = {
    hero_bg_url: normalizedPayload.hero_bg_url,
    hero_title: normalizedPayload.hero_title,
    hero_subtitle: normalizedPayload.hero_subtitle,
    hero_enabled: normalizedPayload.hero_enabled,
    whatsapp_link: normalizedPayload.whatsapp_link,
    tng_qr_url: normalizedPayload.tng_qr_url,
    community_enabled: normalizedPayload.community_enabled,
    community_title: normalizedPayload.community_title,
    community_desc: normalizedPayload.community_desc,
    support_enabled: normalizedPayload.support_enabled,
    support_title: normalizedPayload.support_title,
    support_desc: normalizedPayload.support_desc,
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from('site_settings')
      .update(updateFields)
      .eq('id', existingRecord.id)
      .select(SETTINGS_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return normalizeSiteSettings(data);
  }

  const { data, error } = await supabase
    .from('site_settings')
    .insert(updateFields)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return normalizeSiteSettings(data);
};
