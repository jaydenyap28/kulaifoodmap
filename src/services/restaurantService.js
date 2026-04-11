import { supabase } from '../lib/supabaseClient';

export const getRestaurantHotScores = async () => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, source_restaurant_id, hot_score, updated_at');

  if (error) {
    throw error;
  }

  return data || [];
};

export const mergeRestaurantsWithRemoteHotScores = (localRestaurants = [], remoteRestaurants = []) => {
  if (!Array.isArray(localRestaurants) || localRestaurants.length === 0) {
    return [];
  }

  const remoteBySourceId = new Map();
  const remoteById = new Map();

  remoteRestaurants.forEach((restaurant) => {
    if (restaurant?.source_restaurant_id != null) {
      remoteBySourceId.set(restaurant.source_restaurant_id, restaurant);
    }

    if (restaurant?.id != null) {
      remoteById.set(restaurant.id, restaurant);
    }
  });

  return localRestaurants.map((restaurant) => {
    const remoteRestaurant =
      remoteBySourceId.get(restaurant.id) ||
      remoteById.get(restaurant.id);

    if (!remoteRestaurant) {
      return restaurant;
    }

    return {
      ...restaurant,
      hot_score: remoteRestaurant.hot_score ?? restaurant.hot_score ?? 0,
    };
  });
};

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
