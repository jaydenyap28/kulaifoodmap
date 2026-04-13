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

export const incrementRestaurantHotScore = async (restaurantId) => {
  if (!supabase) return false;
  try {
    const { data, error: selectError } = await supabase
      .from('restaurants')
      .select('hot_score')
      .eq('id', restaurantId)
      .single();
    
    if (selectError) throw selectError;
    
    const newScore = (data?.hot_score || 0) + 10;
    
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ hot_score: newScore })
      .eq('id', restaurantId);
      
    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Failed to increment hot_score:', error);
    return false;
  }
};
