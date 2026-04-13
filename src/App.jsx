import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { UtensilsCrossed, Coffee, Download, BarChart2, Globe, Clock, RefreshCw, Shield, Settings2, Store, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeroCardStack from './components/HeroCardStack';
import RestaurantList from './components/RestaurantList';
import FilterBar from './components/FilterBar';
import Footer from './components/Footer';
import GlobalAdBanner from './components/GlobalAdBanner';
import LoginModal from './components/LoginModal';
import { trackEvent, trackPageView } from './utils/trackEvent';
import { loadRestaurantsModule } from './data/runtimeRestaurants';
import { checkOpenStatus } from './utils/businessHours';
import { analytics } from './utils/analytics';
import {
  CATEGORY_STORAGE_KEY,
  LEGACY_CATEGORY_STORAGE_KEY,
  DATA_VERSION,
  clearAppStorage,
  initializeRestaurants,
  getInitialAreaOverrides,
  buildRestaurantPatchData,
  createRestaurantPatchFileContent,
  buildRestaurantDiffChanges,
} from './utils/restaurantData';
import { DEFAULT_CATEGORIES } from './data/constants';
import { hasSupabaseConfig, supabase } from './lib/supabaseClient';
import { buildFallbackProfile, syncProfileForUser } from './services/profileService';
import { getRestaurantsFromSupabase, hydrateRestaurantsFromSupabase } from './services/restaurantService';
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from './services/siteSettingsService';

const ResultModal = lazy(() => import('./components/ResultModal'));
const SupportModal = lazy(() => import('./components/SupportModal'));
const AdminAnalytics = lazy(() => import('./components/AdminAnalytics'));
const AiFoodAssistant = lazy(() => import('./components/AiFoodAssistant'));
const AuthUserPanel = lazy(() => import('./components/AuthUserPanel'));
const AdminSettingsPage = lazy(() => import('./components/AdminSettingsPage'));
const AdminRestaurantsPage = lazy(() => import('./components/AdminRestaurantsPage'));
const AdminAdsPage = lazy(() => import('./components/AdminAdsPage'));
import RightSidebar from './components/RightSidebar';

const initializeCategories = (sourceRestaurants) => {
  const finalCategories = [];
  const processedCats = new Set();
  const deprecatedCats = new Set(['Pizza', '鐐搁浮', '涓��', '鏃犳嫑鐗岀編椋?', '椹�潵椁?', '鍗板害妗?', '鐢滃搧楗�枡', '闈㈤�', '闈㈢被', '鍜栧暋搴?']);

  try {
    const storedCats = localStorage.getItem(CATEGORY_STORAGE_KEY) || localStorage.getItem(LEGACY_CATEGORY_STORAGE_KEY);
    if (storedCats && storedCats !== 'undefined' && storedCats !== 'null') {
      const parsedCats = JSON.parse(storedCats);
      if (Array.isArray(parsedCats) && parsedCats.length > 0) {
        parsedCats.filter((category) => !deprecatedCats.has(category)).forEach((category) => {
          finalCategories.push(category);
          processedCats.add(category);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to load categories from LocalStorage', error);
  }

  DEFAULT_CATEGORIES.forEach((category) => {
    if (!processedCats.has(category) && !deprecatedCats.has(category)) {
      finalCategories.push(category);
      processedCats.add(category);
    }
  });

  sourceRestaurants.forEach((restaurant) => {
    const categoryList = Array.isArray(restaurant.category)
      ? restaurant.category
      : Array.isArray(restaurant.categories)
        ? restaurant.categories
        : [];

    categoryList.forEach((category) => {
      if (!processedCats.has(category) && !deprecatedCats.has(category)) {
        finalCategories.push(category);
        processedCats.add(category);
      }
    });
  });

  return finalCategories;
};

const DEFAULT_HERO_BG = DEFAULT_SITE_SETTINGS.hero_bg_url;

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [areaOverrides, setAreaOverrides] = useState(() => getInitialAreaOverrides());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [initialRestaurants, setInitialRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [hideDrinksDesserts, setHideDrinksDesserts] = useState(false);
  const [halalFilter, setHalalFilter] = useState(null);
  const [showHalalMenu, setShowHalalMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportQR, setSupportQR] = useState(() => {
    try { return localStorage.getItem('kulaifood-support-qr') || null; } catch { return null; }
  });

  const [authSession, setAuthSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(hasSupabaseConfig);

  const restaurantsRef = useRef([]);
  const sourceRestaurantsRef = useRef([]);
  const selectedRestaurantRef = useRef(null);
  const isAdminRoute = location.pathname === '/admin/settings' || location.pathname === '/admin/restaurants' || location.pathname === '/admin/ads';
  const isBackendAdmin = authProfile?.role === 'admin';

  useEffect(() => {
    const currentVersion = localStorage.getItem('kulaifood-data-version');
    if (currentVersion !== DATA_VERSION) {
      clearAppStorage();
      localStorage.setItem('kulaifood-data-version', DATA_VERSION);
      window.location.reload();
    }
  }, []);

  useEffect(() => { restaurantsRef.current = restaurants; }, [restaurants]);
  useEffect(() => { selectedRestaurantRef.current = selectedRestaurant; }, [selectedRestaurant]);

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');

  const handleAdminLoginClick = () => {
    if (isAdmin) {
      if (window.confirm(t('confirm_logout'))) {
        setIsAdmin(false);
      }
      return;
    }
    setShowLoginModal(true);
  };

  const handleLoginSubmit = (password) => {
    if (password === '02081104') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const refreshSiteSettings = useCallback(async () => {
    try {
      const nextSiteSettings = await getSiteSettings();
      setSiteSettings(nextSiteSettings);
      return nextSiteSettings;
    } catch (error) {
      console.error('Failed to refresh site settings', error);
      return siteSettings;
    }
  }, [siteSettings]);

  const refreshRestaurants = useCallback(async (baseRestaurants) => {
    const fallbackBaseRestaurants = Array.isArray(baseRestaurants) && baseRestaurants.length > 0
      ? baseRestaurants
      : initializeRestaurants(sourceRestaurantsRef.current);

    if (!Array.isArray(fallbackBaseRestaurants) || fallbackBaseRestaurants.length === 0) {
      return fallbackBaseRestaurants;
    }

    try {
      const remoteRestaurants = await getRestaurantsFromSupabase();
      const syncedRestaurants = hydrateRestaurantsFromSupabase(remoteRestaurants, fallbackBaseRestaurants);
      restaurantsRef.current = syncedRestaurants;
      setRestaurants(syncedRestaurants);
      const selectedId = selectedRestaurantRef.current?.id;
      if (selectedId) {
        const nextSelectedRestaurant = syncedRestaurants.find((restaurant) => restaurant.id === selectedId);
        if (nextSelectedRestaurant) {
          setSelectedRestaurant(nextSelectedRestaurant);
        }
      }
      return syncedRestaurants;
    } catch (error) {
      console.error('Failed to refresh restaurants from Supabase', error);
      return fallbackBaseRestaurants;
    }
  }, []);

  const hydrateAuthSession = useCallback(async (nextSession) => {
    setAuthSession(nextSession);
    if (!nextSession?.user) {
      setAuthProfile(null);
      setIsAuthLoading(false);
      return;
    }
    try {
      const nextProfile = await syncProfileForUser(nextSession.user);
      setAuthProfile(nextProfile);
    } catch (error) {
      console.error('Failed to hydrate auth profile', error);
      setAuthProfile(buildFallbackProfile(nextSession.user));
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return undefined;
    }

    let active = true;
    const safeHydrate = async (nextSession) => {
      if (!active) return;
      await hydrateAuthSession(nextSession);
    };

    supabase.auth.getSession().then(({ data }) => safeHydrate(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      safeHydrate(nextSession);
    });

    const handleProfileRefresh = async () => {
      const { data } = await supabase.auth.getSession();
      safeHydrate(data.session);
    };

    window.addEventListener('profile-refresh', handleProfileRefresh);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('profile-refresh', handleProfileRefresh);
    };
  }, [hydrateAuthSession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapData = async () => {
      try {
        const [{ initialRestaurants: sourceRestaurants = [] }, nextSiteSettings] = await Promise.all([
          loadRestaurantsModule(),
          getSiteSettings().catch((error) => {
            console.warn('Falling back to default site settings during bootstrap', error);
            return DEFAULT_SITE_SETTINGS;
          }),
        ]);

        const initializedRestaurants = initializeRestaurants(sourceRestaurants);
        sourceRestaurantsRef.current = sourceRestaurants;
        let syncedRestaurants = initializedRestaurants;

        try {
          const remoteRestaurants = await getRestaurantsFromSupabase();
          syncedRestaurants = hydrateRestaurantsFromSupabase(remoteRestaurants, initializedRestaurants);
        } catch (error) {
          console.warn('Falling back to local restaurant dataset during bootstrap', error);
        }

        if (cancelled) return;

        setSiteSettings(nextSiteSettings);
        setInitialRestaurants(sourceRestaurants);
        restaurantsRef.current = syncedRestaurants;
        setRestaurants(syncedRestaurants);
        setCategories(initializeCategories(sourceRestaurants));
        setIsDataReady(true);
      } catch (error) {
        console.error('Failed to load restaurant data', error);
        if (!cancelled) setDataLoadError(error);
      }
    };

    bootstrapData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isDataReady) return;
    localStorage.setItem('kulaifood-restaurants', JSON.stringify(restaurants));
    localStorage.setItem('kulaifood-data-version', DATA_VERSION);
  }, [restaurants, isDataReady]);

  useEffect(() => {
    const match = matchPath('/restaurant/:slug', location.pathname);
    if (match && match.params.slug) {
      const slug = match.params.slug;
      const restaurant = restaurants.find((item) => item.slug === slug);
      if (restaurant && selectedRestaurant?.id !== restaurant.id) {
        setSelectedRestaurant(restaurant);
        analytics.incrementView(restaurant.id);
        trackEvent('restaurant_view', {
          restaurant_id: String(restaurant.id),
          restaurant_name: restaurant.name,
          restaurant_slug: restaurant.slug || '',
        });
      }
    } else if (selectedRestaurant) {
      setSelectedRestaurant(null);
    }
  }, [location.pathname, restaurants, selectedRestaurant]);

  useEffect(() => {
    const baseTitle = '古来美食地图 Kulai Food Map | AI 智能找吃神器';
    const baseDesc = '不知道吃什么？Kulai Food Map 帮你随机抽取，内含 AI 助手，收录古来多家餐厅与美食。';
    const canonicalUrl = `https://kulaifoodmap.com${location.pathname === '/' ? '/' : location.pathname}`;

    const setMeta = (selector, attr, value) => {
      const element = document.querySelector(selector);
      if (element && value) element.setAttribute(attr, value);
    };

    const title = selectedRestaurant ? `${selectedRestaurant.name} | 古来美食地图 Kulai Food Map` : baseTitle;
    const description = selectedRestaurant
      ? `${selectedRestaurant.name} · ${selectedRestaurant.address || ''}。营业时间：${selectedRestaurant.opening_hours || '未提供'}。`
      : baseDesc;

    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="title"]', 'content', title);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="twitter:url"]', 'content', canonicalUrl);
    setMeta('meta[property="twitter:title"]', 'content', title);
    setMeta('meta[property="twitter:description"]', 'content', description);

    trackPageView(location.pathname, title);
  }, [location.pathname, selectedRestaurant]);

  const handleUpdateSupportQR = (newQR) => {
    setSupportQR(newQR);
    localStorage.setItem('kulaifood-support-qr', newQR);
  };



  useEffect(() => {
    if (!isDataReady) return;
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories, isDataReady]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isDataReady) return;
    if (restaurants !== initialRestaurants) {
      const exportData = restaurants.map(({ name, name_en, ...rest }) => ({ ...rest, desc: name, desc2: name_en }));
      console.log('--------------- UPDATED DATA (Copy below to src/data/restaurants.json) ---------------');
      console.log(JSON.stringify(exportData, null, 2));
      console.log('------------------------------------------------------------------------------------');
    }
  }, [restaurants, initialRestaurants, isDataReady]);



  useEffect(() => {
    if (!isDataReady) return undefined;

    const handleFocus = () => {
      if (window.location.pathname.startsWith('/admin')) return;
      refreshRestaurants();
      refreshSiteSettings();
    };

    const handleVisibilityChange = () => {
      if (window.location.pathname.startsWith('/admin')) return;
      if (document.visibilityState === 'visible') {
        refreshRestaurants();
        refreshSiteSettings();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('restaurants-refresh', refreshRestaurants);
    window.addEventListener('site-settings-refresh', refreshSiteSettings);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('restaurants-refresh', refreshRestaurants);
      window.removeEventListener('site-settings-refresh', refreshSiteSettings);
    };
  }, [isDataReady, refreshRestaurants, refreshSiteSettings]);

  const filteredRestaurants = useMemo(() => restaurants.filter((restaurant) => {
    if (restaurant.is_active === false || restaurant.is_hidden === true) return false;

    if (showOpenOnly) {
      const { isOpen } = checkOpenStatus(restaurant.opening_hours);
      if (!isOpen) return false;
    }

    if (hideDrinksDesserts) {
      const drinksKeywords = ['楗搧', '楗枡', 'drink', 'beverage', '楗搧搴?'];
      const dessertsKeywords = ['鐢滅偣', '铔嬬硶', 'dessert', 'cake', 'ice cream', 'waffle'];
      if (restaurant.categories && restaurant.categories.some((category) => {
        if (!category || typeof category !== 'string') return false;
        const lowerCategory = category.toLowerCase();
        return drinksKeywords.some((keyword) => lowerCategory.includes(keyword)) || dessertsKeywords.some((keyword) => lowerCategory.includes(keyword));
      })) return false;
    }

    if (halalFilter && restaurant.halalStatus !== halalFilter) return false;

    if (selectedCategory.length > 0) {
      const hasCategoryMatch = restaurant.categories && selectedCategory.some((category) => restaurant.categories.includes(category));
      const hasDietaryMatch = (selectedCategory.includes('绱犻') || selectedCategory.includes('Vegetarian'))
        && (restaurant.dietaryOption === 'vegetarian_only' || restaurant.dietaryOption === 'vegetarian_friendly');
      if (!hasCategoryMatch && !hasDietaryMatch) return false;
    }

    if (selectedArea && restaurant.area !== selectedArea) return false;
    return true;
  }), [restaurants, showOpenOnly, hideDrinksDesserts, halalFilter, selectedCategory, selectedArea]);

  const handleUpdateArea = (id, newArea) => {
    setRestaurants((currentRestaurants) => currentRestaurants.map((restaurant) => (restaurant.id === id ? { ...restaurant, area: newArea } : restaurant)));
    const nextOverrides = { ...areaOverrides, [id]: newArea };
    setAreaOverrides(nextOverrides);
    localStorage.setItem('kulaifood-area-overrides', JSON.stringify(nextOverrides));
  };

  const handleExportData = () => {
    if (!isDataReady || initialRestaurants.length === 0) return;
    const patchData = buildRestaurantPatchData(restaurants, initialRestaurants);
    if (patchData.length === 0) {
      alert(t('no_changes', 'No changes detected'));
      return;
    }
    const fileContent = createRestaurantPatchFileContent(patchData);
    navigator.clipboard.writeText(fileContent).then(() => {
      alert(t('copy_success_changes', { count: patchData.length }));
    }).catch((error) => {
      console.error('Failed to copy: ', error);
      alert(t('copy_failed'));
    });
  };

  const handleExportChanges = () => {
    if (!isDataReady || initialRestaurants.length === 0) return;
    const changes = buildRestaurantDiffChanges(restaurants, initialRestaurants);
    if (changes.length === 0) {
      alert(t('no_changes_to_export') || 'No changes detected');
      return;
    }
    const json = JSON.stringify(changes, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert(`Copied ${changes.length} modified items (Diff Only).`);
    }).catch((error) => {
      console.error('Failed to copy: ', error);
      alert('Copy Failed');
    });
  };

  const handleChoose = (result) => {
    setTimeout(() => navigate(`/restaurant/${result.slug}`), 1000);
  };

  const handleAddCategory = (newCategory) => {
    if (!categories.includes(newCategory)) {
      setCategories((currentCategories) => [...currentCategories, newCategory]);
    }
  };

  const handleCategoryClick = (category) => {
    if (category === null) {
      setSelectedCategory([]);
      return;
    }
    setSelectedCategory((currentCategories) => (
      currentCategories.includes(category)
        ? currentCategories.filter((item) => item !== category)
        : [...currentCategories, category]
    ));
  };

  const handleDeleteCategory = (categoryToDelete) => {
    setCategories((currentCategories) => currentCategories.filter((category) => category !== categoryToDelete));
    if (selectedCategory.includes(categoryToDelete)) {
      setSelectedCategory((currentCategories) => currentCategories.filter((category) => category !== categoryToDelete));
    }
  };

  const handleReorderCategories = (newOrder) => setCategories(newOrder);

  const handleUpdateRestaurant = (restaurantId, updatedFields) => {
    if (updatedFields.area !== undefined) {
      const overrides = { ...areaOverrides, [restaurantId]: updatedFields.area };
      setAreaOverrides(overrides);
      localStorage.setItem('kulaifood-area-overrides', JSON.stringify(overrides));
    }

    setRestaurants((currentRestaurants) => currentRestaurants.map((restaurant) => (
      restaurant.id === restaurantId ? { ...restaurant, ...updatedFields } : restaurant
    )));

    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant((currentRestaurant) => ({ ...currentRestaurant, ...updatedFields }));
    }
  };

  const handleDeleteRestaurant = (restaurantId) => {
    setRestaurants((currentRestaurants) => currentRestaurants.filter((restaurant) => restaurant.id !== restaurantId));
    if (selectedRestaurant?.id === restaurantId) setSelectedRestaurant(null);
  };

  const handleAddRestaurant = () => {
    const newRestaurant = {
      id: Date.now(),
      name: '新商家 (New Restaurant)',
      image: '',
      address: '请输入地址 (Address)',
      price_range: 'RM 10-20',
      menu_link: '',
      website_link: '',
      delivery_link: '',
      opening_hours: '10am - 10pm',
      categories: [],
      isVegetarian: false,
      isNoBeef: false,
      reviews: [],
      rating: 0,
      isNew: true,
      is_active: true,
      is_hidden: false,
      is_featured: false,
      sort_priority: 0,
      badge_label: '',
      ad_label: '',
      hot_score: 0,
    };

    setRestaurants((currentRestaurants) => [newRestaurant, ...currentRestaurants]);
    window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
  };

  const handleReorder = (newOrder) => {
    const reorderedWithNewIds = newOrder.map((restaurant, index) => ({ ...restaurant, id: index + 1 }));
    setRestaurants(reorderedWithNewIds);
  };

  const handleRestaurantClick = (restaurant) => navigate(`/restaurant/${restaurant.slug}`);

  if (dataLoadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6 text-white">
        <div className="max-w-md text-center">
          <h2 className="mb-3 text-2xl font-bold">Failed to load data</h2>
          <p className="mb-6 text-gray-400">The restaurant dataset could not be loaded. Please reload and try again.</p>
          <button onClick={() => window.location.reload()} className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-white" />
          <h2 className="mb-3 text-2xl font-bold">Loading Kulai Food Map</h2>
          <p className="text-gray-400">Preparing restaurants, filters, and recommendations...</p>
        </div>
      </div>
    );
  }

  if (isAdminRoute) {
    if (isAuthLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6 text-white">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-white" />
            <h2 className="mb-3 text-2xl font-bold">Loading Admin</h2>
            <p className="text-gray-400">Checking your admin permission...</p>
          </div>
        </div>
      );
    }

    if (!authSession?.user || !isBackendAdmin) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6 text-white">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur-sm">
            <Shield size={28} className="mx-auto text-white/70" />
            <h2 className="mt-4 text-2xl font-bold">后台暂未开放</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">只有 `profiles.role = admin` 的账号可以进入后台页面。</p>
            <button type="button" onClick={() => navigate('/')} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200">
              返回首页
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#121212]">
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[#121212]/90 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${location.pathname === '/admin/settings' ? 'bg-white text-black' : 'border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="inline-flex items-center gap-2"><Settings2 size={15} />首页设置</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/restaurants')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${location.pathname === '/admin/restaurants' ? 'bg-white text-black' : 'border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="inline-flex items-center gap-2"><Store size={15} />商家管理</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/ads')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${location.pathname === '/admin/ads' ? 'bg-white text-black' : 'border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="inline-flex items-center gap-2">📢 广告管理</span>
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          {location.pathname === '/admin/settings'
            ? <AdminSettingsPage onSettingsSaved={setSiteSettings} />
            : location.pathname === '/admin/ads'
            ? <AdminAdsPage />
            : <AdminRestaurantsPage onRestaurantsSaved={() => refreshRestaurants()} />}
        </Suspense>
      </div>
    );
  }

  const heroEnabled = siteSettings.hero_enabled !== false;
  const heroBackground = siteSettings.hero_bg_url || DEFAULT_HERO_BG;

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-gray-100 relative">
      {/* Background Layer properly sized to avoid stretching/blur */}
      {heroEnabled && (
        <div
          className="absolute inset-x-0 top-0 h-[400px] w-full bg-cover bg-top pointer-events-none z-0 lg:h-[600px]"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(18,18,18,0) 0%, rgba(18,18,18,0.7) 75%, #121212 100%), url("${heroBackground}")` 
          }}
        ></div>
      )}

      <div className="relative z-10 w-full pt-4 pb-12">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2 rounded-full border border-white/10 bg-black/40 p-1.5 shadow-lg backdrop-blur-md">
            <button onClick={() => setShowAnalyticsModal(true)} className="rounded-full bg-purple-600/80 p-2 text-white transition hover:bg-purple-700/80" title="数据统计与热度"><BarChart2 size={18} /></button>
            <button onClick={handleExportData} className="rounded-full bg-green-600/80 p-2 text-white transition hover:bg-green-700/80" title="导出数据代码"><Download size={18} /></button>
            <button
              onClick={() => {
                if (window.confirm('确定要重置所有本地数据吗？这将清除缓存并刷新页面。')) {
                  clearAppStorage();
                  window.location.reload();
                }
              }}
              className="rounded-full bg-red-600/80 p-2 text-white transition hover:bg-red-700/80"
              title="重置数据与修复"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        )}

        <header className="mb-6 flex flex-col gap-4 px-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white transition-opacity md:text-5xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              {siteSettings.hero_title || t('app_title')}
            </h1>
            <p className="mt-1 text-2xl text-orange-400 drop-shadow-md md:text-3xl" style={{ fontFamily: '"Lobster", cursive' }}>
              {siteSettings.hero_subtitle || 'Kulai Food Map'}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 self-start sm:flex-row sm:items-center md:self-auto">
            <Suspense fallback={<div className="h-[42px] w-[182px] rounded-full border border-white/10 bg-white/10" />}>
              <AuthUserPanel />
            </Suspense>

            {isBackendAdmin && (
              <>
                <button type="button" onClick={() => navigate('/admin/settings')} className="flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-1.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20"><Settings2 size={16} />后台设置</button>
                <button type="button" onClick={() => navigate('/admin/restaurants')} className="flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20"><Store size={16} />商家管理</button>
              </>
            )}

            <button onClick={toggleLanguage} className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-lg transition-all hover:bg-white/20" title="Switch Language">
              <Globe size={18} />
              <span className="text-sm font-bold">{i18n.language === 'zh' ? 'EN' : '中'}</span>
            </button>
          </div>
        </header>

        <div className="mt-6 mb-2">
          <FilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryClick}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            isAdmin={isAdmin}
            onExportChanges={handleExportChanges}
          />
        </div>

        <div className="mx-auto w-full max-w-[1600px] px-2 md:px-4 mt-2 mb-10 flex flex-col lg:flex-row gap-6 xl:gap-8">
          <main className="flex-1 min-w-0 flex flex-col">
          
            {/* Above Wheel Ad Position */}
            <GlobalAdBanner position="above_wheel" />

            {heroEnabled && (
              <div className="relative mb-5 flex min-h-[350px] w-full flex-col items-center md:min-h-[450px]">
                {filteredRestaurants.length > 1 ? (
                  <HeroCardStack
                    restaurants={filteredRestaurants}
                    onChoose={handleChoose}
                    onRefreshRestaurants={refreshRestaurants}
                    onSupportClick={() => {
                      trackEvent('support_click', { source: 'hero_slot' });
                      setShowSupportModal(true);
                    }}
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 text-6xl">😕</div>
                    <h3 className="mb-2 text-2xl font-bold text-white">商家不足以转动</h3>
                    <p className="mx-auto max-w-xs text-base text-gray-400">当前筛选条件下商家少于 2 家，请尝试其他分类、地区，或先清除筛选。</p>
                    <button onClick={() => { setSelectedCategory([]); setSelectedArea(null); setShowOpenOnly(false); setHideDrinksDesserts(false); setHalalFilter(null); }} className="mt-6 rounded-full bg-white px-8 py-3 font-bold text-black shadow-md transition hover:bg-gray-200">清除筛选</button>
                  </div>
                )}
              </div>
            )}

            <GlobalAdBanner position="under_wheel" />

            <div className="relative z-30 mb-8 flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => setShowOpenOnly(!showOpenOnly)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all ${showOpenOnly ? 'border-emerald-500/50 bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-500/50' : 'border-[#333] bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d]'}`}><Clock size={16} className={showOpenOnly ? 'fill-current' : ''} />{t('filter.open_now')}</button>
                <button onClick={() => setHideDrinksDesserts(!hideDrinksDesserts)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all ${hideDrinksDesserts ? 'border-orange-500/50 bg-orange-900/50 text-orange-400 ring-1 ring-orange-500/50' : 'border-[#333] bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d]'}`}><Coffee size={16} />{t('filter.no_drinks_desserts')}</button>
                <div className="relative">
                  <button onClick={() => setShowHalalMenu(!showHalalMenu)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all ${halalFilter ? 'border-green-500/50 bg-green-900/50 text-green-400 ring-1 ring-green-500/50' : 'border-[#333] bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d]'}`}><UtensilsCrossed size={16} />{halalFilter ? t(`filter.halal_options.${halalFilter}`) : t('filter.halal_status')}</button>
                  {showHalalMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowHalalMenu(false)} />
                      <div className="absolute top-full left-1/2 z-50 mt-2 flex min-w-[12rem] w-max -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-gray-700 bg-[#1e1e1e] p-1 shadow-xl md:top-0 md:left-full md:ml-2 md:translate-x-0">
                        <button onClick={() => { setHalalFilter(null); setShowHalalMenu(false); }} className={`rounded-lg px-4 py-2 text-center text-sm hover:bg-white/10 ${!halalFilter ? 'font-bold text-white' : 'text-gray-400'}`}>{t('filter.all')}</button>
                        {['certified', 'muslim_owned', 'no_pork', 'non_halal'].map((status) => (
                          <button key={status} onClick={() => { setHalalFilter(status); setShowHalalMenu(false); }} className={`rounded-lg px-4 py-2 text-center text-sm hover:bg-white/10 ${halalFilter === status ? 'font-bold text-green-400' : 'text-gray-400'}`}>{t(`filter.halal_options.${status}`)}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button onClick={() => setShowAiAssistant(true)} className="group mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-purple-900/80 to-blue-900/80 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-white/30 hover:shadow-purple-500/20 active:scale-95">
                <Sparkles size={18} className="text-purple-300 transition-colors group-hover:text-white" />
                <span className="bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent group-hover:bg-none group-hover:text-white">{t('hero.ai_tagline')}</span>
              </button>
            </div>

            <RestaurantList
              restaurants={filteredRestaurants}
              allRestaurants={restaurants}
              isAdmin={isAdmin}
              onUpdateRestaurant={handleUpdateRestaurant}
              onDeleteRestaurant={handleDeleteRestaurant}
              onRestaurantClick={handleRestaurantClick}
              onAddRestaurant={handleAddRestaurant}
              onCategoryClick={handleCategoryClick}
              onReorder={handleReorder}
              onUpdateArea={handleUpdateArea}
              onRefreshRestaurants={refreshRestaurants}
            />
          </main>

          <aside className="order-first lg:order-last w-full lg:w-[320px] xl:w-[340px] shrink-0 mb-2 lg:mb-0">
             <RightSidebar 
                restaurants={filteredRestaurants}
                onRestaurantClick={handleRestaurantClick}
                onSupportClick={() => {
                  trackEvent('support_click', { source: 'sidebar_support_button' });
                  setShowSupportModal(true);
                }} 
             />
          </aside>
          
        </div>
      </div>

      <button onClick={() => setShowAiAssistant(true)} className="group fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-tr from-purple-600 to-blue-600 p-4 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50">
        <Sparkles size={24} className="transition-transform group-hover:rotate-12" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-500 ease-in-out group-hover:max-w-xs">{t('ask_ai', 'AI 助手')}</span>
      </button>

      <Suspense fallback={null}>
        <AiFoodAssistant isOpen={showAiAssistant} onClose={() => setShowAiAssistant(false)} restaurants={restaurants} onRestaurantClick={handleRestaurantClick} />
      </Suspense>

      <Footer />

      <Suspense fallback={null}>
        {selectedRestaurant && (
          <ResultModal restaurant={selectedRestaurant} onClose={() => navigate('/')} isAdmin={isAdmin} onUpdateRestaurant={handleUpdateRestaurant} categories={categories} onAddCategory={handleAddCategory} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} isAdmin={isAdmin} supportQR={siteSettings.tng_qr_url || supportQR} onUpdateQR={handleUpdateSupportQR} />
      </Suspense>

      <Suspense fallback={null}>
        <AdminAnalytics isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} restaurants={restaurants} />
      </Suspense>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLoginSubmit} />
    </div>
  );
}

export default App;
