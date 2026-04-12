import { supabase } from '../lib/supabaseClient';

const getProfileName = (user) => {
  const metadata = user?.user_metadata || {};

  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    user?.email?.split('@')[0] ||
    'Kulai Foodie'
  );
};

const getProfileAvatar = (user) => {
  const metadata = user?.user_metadata || {};
  return metadata.avatar_url || metadata.picture || '';
};

export const buildFallbackProfile = (user) => ({
  id: user?.id,
  full_name: getProfileName(user),
  avatar_url: getProfileAvatar(user),
  user_points: 0,
  last_checkin_date: null,
  consecutive_days: 0,
  role: 'user',
});

export const syncProfileForUser = async (user) => {
  if (!supabase || !user) {
    return null;
  }

  const fallbackProfile = buildFallbackProfile(user);

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, user_points, last_checkin_date, consecutive_days, role')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existingProfile) {
    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(fallbackProfile)
      .select('id, full_name, avatar_url, user_points, last_checkin_date, consecutive_days, role')
      .single();

    if (insertError) {
      throw insertError;
    }

    return insertedProfile;
  }

  const needsUpdate =
    existingProfile.full_name !== fallbackProfile.full_name ||
    existingProfile.avatar_url !== fallbackProfile.avatar_url;

  if (!needsUpdate) {
    return existingProfile;
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
      .update({
        full_name: fallbackProfile.full_name,
        avatar_url: fallbackProfile.avatar_url,
      })
      .eq('id', user.id)
      .select('id, full_name, avatar_url, user_points, last_checkin_date, consecutive_days, role')
      .single();

  if (updateError) {
    throw updateError;
  }

  return updatedProfile;
};

export const claimDailyCheckin = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('claim_daily_checkin');

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
};
