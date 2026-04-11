import { supabase } from '../lib/supabaseClient';

export const supportRestaurant = async (targetRestaurantId) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('support_restaurant', {
    target_restaurant_id: targetRestaurantId,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
};
