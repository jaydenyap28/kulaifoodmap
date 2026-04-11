const restaurantsDataUrl = new URL('./restaurants.json', import.meta.url).href;

let restaurantsModulePromise = null;

export const loadRestaurantsModule = async () => {
  if (!restaurantsModulePromise) {
    restaurantsModulePromise = fetch(restaurantsDataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load restaurant data: ${response.status}`);
        }

        return response.json();
      })
      .then((initialRestaurants) => ({ initialRestaurants }));
  }

  return restaurantsModulePromise;
};

export const loadInitialRestaurants = async () => {
  const module = await loadRestaurantsModule();
  return module.initialRestaurants || [];
};
