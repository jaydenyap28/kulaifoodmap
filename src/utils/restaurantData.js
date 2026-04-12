export const CATEGORY_STORAGE_KEY = 'kulaifood-categories-v3';
export const LEGACY_CATEGORY_STORAGE_KEY = 'kulaifood-categories-v2';
export const DATA_VERSION = 'v48';

const STORAGE_PREFIX = 'kulaifood-';

export const clearAppStorage = ({ preserveKeys = [] } = {}) => {
  try {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(STORAGE_PREFIX) && !preserveKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear app storage safely', error);
  }
};

export const normalizeRestaurant = (restaurant) => ({
  ...restaurant,
  name: restaurant.name || restaurant.desc,
  name_en: restaurant.name_en || restaurant.desc2,
  categories: restaurant.categories || restaurant.category || [],
  subscriptionLevel: restaurant.subscriptionLevel || 0,
  isVIP: (restaurant.subscriptionLevel || 0) > 0,
  priority: restaurant.priority || 0,
  whatsappLink: restaurant.whatsappLink || '',
  price_range: restaurant.price_range || 'RM 10-20',
  subStalls: (restaurant.subStalls || [])
    .map((stall) => {
      if (!stall) return null;
      if (typeof stall === 'string') {
        return { name: stall, image: '' };
      }
      return stall;
    })
    .filter(Boolean),
  branches: (restaurant.branches || [])
    .map((branch) => {
      if (!branch) return null;
      if (typeof branch === 'string') {
        return { name: branch, address: '' };
      }
      return branch;
    })
    .filter(Boolean),
});

export const getInitialAreaOverrides = () => {
  try {
    const storedVersion = localStorage.getItem('kulaifood-data-version');
    if (storedVersion !== DATA_VERSION) {
      return {};
    }

    const stored = localStorage.getItem('kulaifood-area-overrides');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load area overrides', error);
    return {};
  }
};

export const initializeRestaurants = (sourceRestaurants) => {
  console.log(`[App] Initializing Data. Codebase has ${sourceRestaurants.length} items.`);

  const storedVersion = localStorage.getItem('kulaifood-data-version');
  const shouldClearStorage = storedVersion !== DATA_VERSION;

  if (shouldClearStorage) {
    console.log(`[App] Data version mismatch (${storedVersion} vs ${DATA_VERSION}). Refreshing data...`);
    localStorage.removeItem('kulaifood-restaurants');
    localStorage.removeItem(CATEGORY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CATEGORY_STORAGE_KEY);
    localStorage.removeItem('kulaifood-area-overrides');
  }

  let storedData = [];
  try {
    if (!shouldClearStorage) {
      const item = localStorage.getItem('kulaifood-restaurants');
      if (item) {
        storedData = JSON.parse(item);
      }
    }
  } catch (error) {
    console.warn('Failed to load restaurants from LocalStorage', error);
  }

  const overrides = getInitialAreaOverrides();
  const codeMap = new Map(sourceRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  let mergedData = [];
  const processedIds = new Set();

  if (Array.isArray(storedData) && storedData.length > 0) {
    storedData.forEach((stored) => {
      if (codeMap.has(stored.id)) {
        const codeData = codeMap.get(stored.id);
        const area = overrides[stored.id] || codeData.area;
        const mergedItem = { ...stored, ...codeData, area };

        if ((!codeData.branches || codeData.branches.length === 0) && stored.branches?.length > 0) {
          mergedItem.branches = stored.branches;
        }

        mergedData.push(mergedItem);
        processedIds.add(stored.id);
        return;
      }

      mergedData.push(stored);
      processedIds.add(stored.id);
    });
  }

  sourceRestaurants.forEach((restaurant) => {
    if (!processedIds.has(restaurant.id)) {
      mergedData.push({
        ...restaurant,
        area: overrides[restaurant.id] || restaurant.area,
      });
    }
  });

  if (mergedData.length === 0) {
    mergedData = [...sourceRestaurants];
  }

  const deduped = [];
  const seenBusinessKey = new Set();
  const seenSlug = new Set();
  const seenName = new Map();

  for (const item of mergedData) {
    const nameForKey = (item.name || item.desc || '').trim().toLowerCase();
    const addrForKey = (item.address || '').trim().toLowerCase();
    const businessKey = `${nameForKey}|${addrForKey}`;
    const slugKey = (item.slug || '').trim().toLowerCase();

    if (nameForKey && seenName.has(nameForKey)) {
      const existingId = seenName.get(nameForKey);
      if (item.id > existingId) continue;
    }

    if (businessKey !== '|' && seenBusinessKey.has(businessKey)) continue;
    if (slugKey && seenSlug.has(slugKey)) continue;

    if (nameForKey) seenName.set(nameForKey, item.id);
    if (businessKey !== '|') seenBusinessKey.add(businessKey);
    if (slugKey) seenSlug.add(slugKey);
    deduped.push(item);
  }

  return deduped.map(normalizeRestaurant);
};

export const buildRestaurantPatchData = (restaurants, initialRestaurants) => {
  const normalizedInitial = initialRestaurants.map(normalizeRestaurant);
  const initialMap = new Map(normalizedInitial.map((restaurant) => [restaurant.id, restaurant]));

  return restaurants
    .map((restaurant) => {
      const original = initialMap.get(restaurant.id);

      if (!original) {
        return restaurant;
      }

      const changes = { id: restaurant.id };
      let hasChanges = false;

      const check = (key) => {
        const currentValue = restaurant[key];
        const originalValue = original[key];
        const currentSerialized = typeof currentValue === 'object' ? JSON.stringify(currentValue) : currentValue;
        const originalSerialized = typeof originalValue === 'object' ? JSON.stringify(originalValue) : originalValue;

        if (currentSerialized !== originalSerialized) {
          changes[key] = currentValue;
          hasChanges = true;
        }
      };

      [
        'name',
        'name_en',
        'image',
        'opening_hours',
        'address',
        'intro_zh',
        'intro_en',
        'categories',
        'price_range',
        'subStalls',
        'branches',
        'isVegetarian',
        'isNoBeef',
        'area',
        'affiliate_url'
      ].forEach(check);

      return hasChanges ? changes : null;
    })
    .filter(Boolean)
    .map((item) => (item.categories ? { ...item, category: item.categories } : item));
};

export const createRestaurantPatchFileContent = (patchData) =>
  `// PATCH DATA: Contains only changed fields. Do not replace the full restaurant dataset directly.\n// Use this to update specific fields or send to developer.\nexport const restaurantUpdates = ${JSON.stringify(patchData, null, 2)};`;

export const buildRestaurantDiffChanges = (restaurants, initialRestaurants) =>
  restaurants.reduce((accumulator, current) => {
    const original = initialRestaurants.find((initialRestaurant) => initialRestaurant.id === current.id);

    if (!original) {
      accumulator.push(current);
      return accumulator;
    }

    const diff = { id: current.id };
    let hasChanges = false;

    [
      'name',
      'name_en',
      'address',
      'opening_hours',
      'price_range',
      'image',
      'rating',
      'area',
      'menu_link',
      'website_link',
      'delivery_link',
      'affiliate_url',
      'isVegetarian',
      'isNoBeef',
      'manualStatus',
      'intro_zh',
      'intro_en',
      'categories',
      'subStalls',
      'branches',
      'location',
      'tags',
      'subscriptionLevel',
      'priority',
      'whatsappLink',
    ].forEach((key) => {
      const currentValue = current[key];
      const originalValue = original[key];

      if (typeof currentValue === 'object' && currentValue !== null) {
        const currentSerialized = JSON.stringify(currentValue);
        const originalSerialized = JSON.stringify(originalValue || (Array.isArray(currentValue) ? [] : {}));

        if (currentSerialized !== originalSerialized) {
          diff[key] = currentValue;
          hasChanges = true;
        }
        return;
      }

      const normalizedCurrent = currentValue === undefined || currentValue === null ? '' : currentValue;
      const normalizedOriginal = originalValue === undefined || originalValue === null ? '' : originalValue;

      if (normalizedCurrent != normalizedOriginal) {
        diff[key] = currentValue;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      accumulator.push(diff);
    }

    return accumulator;
  }, []);
