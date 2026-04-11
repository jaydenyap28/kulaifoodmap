import { supabase } from '../lib/supabaseClient';
import { normalizeRestaurant } from '../utils/restaurantData';

export const getRestaurantsFromSupabase = async () => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_restaurants_snapshot');

  if (error) {
    throw error;
  }

  return data || [];
};

const normalizeRemoteCategory = (categoryValue) => {
  if (Array.isArray(categoryValue)) {
    return categoryValue;
  }

  if (typeof categoryValue === 'string' && categoryValue.trim()) {
    return categoryValue
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const hydrateRestaurantsFromSupabase = (remoteRestaurants = [], baseRestaurants = []) => {
  if (!Array.isArray(remoteRestaurants) || remoteRestaurants.length === 0) {
    return [];
  }

  const baseBySourceId = new Map();
  baseRestaurants.forEach((restaurant) => {
    baseBySourceId.set(restaurant.id, restaurant);
  });

  return remoteRestaurants.map((remoteRestaurant) => {
    const sourceRestaurant =
      baseBySourceId.get(remoteRestaurant.source_restaurant_id) ||
      baseBySourceId.get(remoteRestaurant.id) ||
      {};

    return normalizeRestaurant({
      ...sourceRestaurant,
      id: sourceRestaurant.id ?? remoteRestaurant.source_restaurant_id ?? remoteRestaurant.id,
      database_id: remoteRestaurant.id,
      source_restaurant_id: remoteRestaurant.source_restaurant_id ?? sourceRestaurant.id ?? null,
      name: sourceRestaurant.name || sourceRestaurant.desc || remoteRestaurant.name || 'Unknown Restaurant',
      name_en: sourceRestaurant.name_en || sourceRestaurant.desc2 || '',
      image: remoteRestaurant.image_url || sourceRestaurant.image || '',
      address: remoteRestaurant.address || sourceRestaurant.address || '',
      categories: sourceRestaurant.categories?.length
        ? sourceRestaurant.categories
        : normalizeRemoteCategory(remoteRestaurant.category),
      hot_score: remoteRestaurant.hot_score ?? 0,
    });
  });
};

export const getRestaurantHotScores = async () => {
  const restaurants = await getRestaurantsFromSupabase();
  return restaurants.map(({ id, source_restaurant_id, hot_score, updated_at }) => ({
    id,
    source_restaurant_id,
    hot_score,
    updated_at,
  }));
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
