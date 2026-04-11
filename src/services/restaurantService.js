import { supabase } from '../lib/supabaseClient';

export const getTopRestaurants = async (limit = 20) => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, source_restaurant_id, name, category, address, image_url, hot_score')
    .order('hot_score', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
};
