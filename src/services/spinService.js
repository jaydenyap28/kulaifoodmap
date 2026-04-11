import { supabase } from '../lib/supabaseClient';

export const getCurrentSessionUser = async () => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.user || null;
};

export const claimSpinReward = async (targetRestaurantId) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('claim_spin_reward', {
    target_restaurant_id: targetRestaurantId,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
};

export const canSpinToday = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('can_spin_today');

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
};
