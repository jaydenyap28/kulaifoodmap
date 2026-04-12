import { supabase } from '../lib/supabaseClient';

const ADMIN_RESTAURANT_COLUMNS = `
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
  updated_at
`;

export const getAdminRestaurants = async () => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(ADMIN_RESTAURANT_COLUMNS)
    .order('is_featured', { ascending: false })
    .order('sort_priority', { ascending: false })
    .order('hot_score', { ascending: false })
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export const updateAdminRestaurant = async (restaurantId, payload) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('restaurants')
    .update(payload)
    .eq('id', restaurantId)
    .select(ADMIN_RESTAURANT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
