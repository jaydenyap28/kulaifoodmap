import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import HeroCardStack from './components/HeroCardStack';
import RestaurantList from './components/RestaurantList';
import FilterBar from './components/FilterBar';
import Footer from './components/Footer';
import AdBanner from './components/AdBanner';
import LoginModal from './components/LoginModal';
import { trackEvent, trackPageView } from './utils/trackEvent';
import { loadRestaurantsModule } from './data/runtimeRestaurants';

const ResultModal = lazy(() => import('./components/ResultModal'));
const SupportModal = lazy(() => import('./components/SupportModal'));
const AdminAnalytics = lazy(() => import('./components/AdminAnalytics'));
const AiFoodAssistant = lazy(() => import('./components/AiFoodAssistant'));
const AuthUserPanel = lazy(() => import('./components/AuthUserPanel'));
import { UtensilsCrossed, Lock, X, Coffee, Image as ImageIcon, Upload, Save, Download, BarChart2, Globe, Clock, Dessert, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { checkOpenStatus } from './utils/businessHours';
import { analytics } from './utils/analytics';
import { compressImage } from './utils/imageUtils';
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

import { AVAILABLE_AREAS, DEFAULT_CATEGORIES } from './data/constants';
import { getRestaurantHotScores, mergeRestaurantsWithRemoteHotScores } from './services/restaurantService';

const DEFAULT_HERO_BG = "https://i.ibb.co/7J5qjZtv/image.png";

const initializeCategories = (sourceRestaurants) => {
  const finalCategories = [];
  const processedCats = new Set();
  const deprecatedCats = new Set(["Pizza", "炸鸡", "中餐", "无招牌美食", "马来餐", "印度档", "甜品饮料", "面食", "面类", "咖啡店"]);

  try {
    const storedCats = localStorage.getItem(CATEGORY_STORAGE_KEY) || localStorage.getItem(LEGACY_CATEGORY_STORAGE_KEY);
    if (storedCats && storedCats !== 'undefined' && storedCats !== 'null') {
      const parsedCats = JSON.parse(storedCats);
      if (Array.isArray(parsedCats) && parsedCats.length > 0) {
        parsedCats
          .filter((category) => !deprecatedCats.has(category))
          .forEach((category) => {
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

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check version and clear if needed
    const currentVersion = localStorage.getItem('kulaifood-data-version');
    if (currentVersion !== DATA_VERSION) {
      console.log(`Version mismatch: ${currentVersion} vs ${DATA_VERSION}. Clearing storage.`);
      clearAppStorage();
      localStorage.setItem('kulaifood-data-version', DATA_VERSION);
      // Reload to ensure clean state
      window.location.reload();
    }
  }, []);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  // Area Overrides State (for manual fixes)
  const [areaOverrides, setAreaOverrides] = useState(() => getInitialAreaOverrides());

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false); // Default to false for visitors
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

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
    if (password === "02081104") {
        setIsAdmin(true);
        return true;
    }
    return false;
  };
  
  // Hero Background State
  const [heroBg, setHeroBg] = useState(() => {
    try {
        const storedBg = localStorage.getItem('kulaifood-hero-bg');
        return storedBg || DEFAULT_HERO_BG;
    } catch (e) {
        return DEFAULT_HERO_BG;
    }
  });

  const fileInputRef = useRef(null);

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    try {
      const compressedImage = await compressImage(file, 1600, 0.82);
      setHeroBg(compressedImage);
      localStorage.setItem('kulaifood-hero-bg', compressedImage);
    } catch (error) {
      console.error('Failed to process hero background image', error);
      alert(t('copy_failed'));
    } finally {
      e.target.value = '';
    }
  };

  const resetHeroBg = () => {
      if (window.confirm(t('confirm_reset_bg'))) {
        setHeroBg(DEFAULT_HERO_BG);
        localStorage.removeItem('kulaifood-hero-bg');
      }
  };

  const handleManualSave = () => {
      // Force save everything to LocalStorage (Redundant but reassuring)
      localStorage.setItem('kulaifood-restaurants', JSON.stringify(restaurants));
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
      localStorage.setItem('kulaifood-hero-bg', heroBg);
      
      alert(t('settings_saved'));
  };

  const handleExportData = () => {
    if (!isDataReady || initialRestaurants.length === 0) {
      return;
    }

    const patchData = buildRestaurantPatchData(restaurants, initialRestaurants);

    if (patchData.length === 0) {
      alert(t('no_changes', 'No changes detected'));
      return;
    }

    const fileContent = createRestaurantPatchFileContent(patchData);

    navigator.clipboard.writeText(fileContent).then(() => {
      alert(t('copy_success_changes', { count: patchData.length }));
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert(t('copy_failed'));
    });
  };

  // Version Control for Data (Increment this when adding new hardcoded data to force refresh)
  // Moved to top of file as const DATA_VERSION  

  const [initialRestaurants, setInitialRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(null);
  const restaurantsRef = useRef([]);

  useEffect(() => {
    restaurantsRef.current = restaurants;
  }, [restaurants]);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const selectedRestaurantRef = useRef(null);

  useEffect(() => {
    selectedRestaurantRef.current = selectedRestaurant;
  }, [selectedRestaurant]);

  const refreshRestaurants = useCallback(async (baseRestaurants) => {
    const sourceRestaurants = Array.isArray(baseRestaurants) ? baseRestaurants : restaurantsRef.current;

    if (!Array.isArray(sourceRestaurants) || sourceRestaurants.length === 0) {
      return sourceRestaurants;
    }

    try {
      const remoteRestaurants = await getRestaurantHotScores();
      const syncedRestaurants = mergeRestaurantsWithRemoteHotScores(sourceRestaurants, remoteRestaurants);

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
      return sourceRestaurants;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapData = async () => {
      try {
        const { initialRestaurants: sourceRestaurants = [] } = await loadRestaurantsModule();
        const initializedRestaurants = initializeRestaurants(sourceRestaurants);
        let syncedRestaurants = initializedRestaurants;

        try {
          const remoteRestaurants = await getRestaurantHotScores();
          syncedRestaurants = mergeRestaurantsWithRemoteHotScores(initializedRestaurants, remoteRestaurants);
        } catch (error) {
          console.warn('Falling back to local restaurant hot scores during bootstrap', error);
        }

        if (cancelled) {
          return;
        }

        setInitialRestaurants(sourceRestaurants);
        restaurantsRef.current = syncedRestaurants;
        setRestaurants(syncedRestaurants);
        setCategories(initializeCategories(sourceRestaurants));
        setIsDataReady(true);
      } catch (error) {
        console.error('Failed to load restaurant data', error);
        if (!cancelled) {
          setDataLoadError(error);
        }
      }
    };

    bootstrapData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDataReady) {
      return;
    }

    localStorage.setItem('kulaifood-restaurants', JSON.stringify(restaurants));
    localStorage.setItem('kulaifood-data-version', DATA_VERSION);
  }, [restaurants, isDataReady]);

  // Sync URL with Selected Restaurant
  useEffect(() => {
    const match = matchPath('/restaurant/:slug', location.pathname);
    if (match && match.params.slug) {
        const slug = match.params.slug;
        const restaurant = restaurants.find(r => r.slug === slug);
        if (restaurant) {
            // Only update if not already selected to avoid loops/re-renders
            if (selectedRestaurant?.id !== restaurant.id) {
                setSelectedRestaurant(restaurant);
                // Increment view count when opened via URL (or navigation)
                analytics.incrementView(restaurant.id);
                trackEvent('restaurant_view', {
                  restaurant_id: String(restaurant.id),
                  restaurant_name: restaurant.name,
                  restaurant_slug: restaurant.slug || ''
                });
            }
        }
    } else {
        // If URL is not /restaurant/:slug, ensure modal is closed
        if (selectedRestaurant) {
            setSelectedRestaurant(null);
        }
    }
  }, [location.pathname, restaurants]);

  useEffect(() => {
    const baseTitle = '古来美食地图 Kulai Food Map | AI 智能找吃神器 (收录400+商家)';
    const baseDesc = '不懂吃什么？Kulai Food Map 帮你随机抽取！内含 AI 助手，收录古来 400+ 间餐厅、路边摊及美食中心。';
    const canonicalUrl = `https://kulaifoodmap.com${location.pathname === '/' ? '/' : location.pathname}`;

    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute(attr, value);
    };

    const title = selectedRestaurant
      ? `${selectedRestaurant.name} | 古来美食地图 Kulai Food Map`
      : baseTitle;

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
  const [selectedCategory, setSelectedCategory] = useState([]); // Changed to array for multi-select
  const [selectedArea, setSelectedArea] = useState(null); // New Area State
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [hideDrinksDesserts, setHideDrinksDesserts] = useState(false);
  const [halalFilter, setHalalFilter] = useState(null);
  const [showHalalMenu, setShowHalalMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportQR, setSupportQR] = useState(() => {
    try {
        return localStorage.getItem('kulaifood-support-qr') || null;
    } catch (e) { return null; }
  });

  const handleUpdateSupportQR = (newQR) => {
    setSupportQR(newQR);
    localStorage.setItem('kulaifood-support-qr', newQR);
  };

  // Ad Banner State
  const [adBannerData, setAdBannerData] = useState(() => {
    try {
        const storedAds = localStorage.getItem('kulaifood-ads');
        return storedAds ? JSON.parse(storedAds) : [];
    } catch (e) {
        console.warn("Failed to load ads", e);
        return [];
    }
  });

  // Save Ads Persistence
  useEffect(() => {
    localStorage.setItem('kulaifood-ads', JSON.stringify(adBannerData));
  }, [adBannerData]);


  // Save Categories Only
  useEffect(() => {
    if (!isDataReady) {
      return;
    }

    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories, isDataReady]);

  // Log Restaurants changes to Console for Manual Update
  useEffect(() => {
    if (!import.meta.env.DEV || !isDataReady) {
        return;
    }

    if (restaurants !== initialRestaurants) {
        console.log("--------------- UPDATED DATA (Copy below to src/data/restaurants.json) ---------------");
        const exportData = restaurants.map(({ name, name_en, ...rest }) => ({
            ...rest,
            desc: name,
            desc2: name_en
        }));
        console.log(JSON.stringify(exportData, null, 2));
        console.log("------------------------------------------------------------------------------------");
    }
  }, [restaurants, initialRestaurants, isDataReady]);

  // Log AdBanner changes
  useEffect(() => {
    if (!import.meta.env.DEV) {
        return;
    }

    if (adBannerData && adBannerData.length > 0) {
        console.log("--------------- UPDATED AD BANNER DATA (Update useState in src/App.jsx) ---------------");
        console.log(JSON.stringify(adBannerData, null, 2));
        console.log("---------------------------------------------------------------------------------------");
    }
  }, [adBannerData]);

  useEffect(() => {
    if (!isDataReady) {
      return undefined;
    }

    const handleFocus = () => {
      refreshRestaurants();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRestaurants();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDataReady, refreshRestaurants]);

  // Filtering Logic
  const filteredRestaurants = useMemo(() => restaurants.filter(r => {
    // 1. Open Now Filter
    if (showOpenOnly) {
      const { isOpen } = checkOpenStatus(r.opening_hours);
      if (!isOpen) {
        return false;
      }
    }

    // 2. Hide Drinks & Desserts Filter
    if (hideDrinksDesserts) {
        // Keywords for Drinks and Desserts
        const drinksKeywords = ['饮品', '饮料', 'drink', 'beverage', '饮品店'];
        const dessertsKeywords = ['甜点', '蛋糕', 'dessert', 'cake', 'ice cream', 'waffle'];
        
        if (r.categories && r.categories.some(c => {
            if (!c || typeof c !== 'string') return false;
            const lowerC = c.toLowerCase();
            return drinksKeywords.some(k => lowerC.includes(k)) || dessertsKeywords.some(k => lowerC.includes(k));
        })) {
            return false;
        }
    }

    // 3. Halal Status Filter
    if (halalFilter && r.halalStatus !== halalFilter) {
        return false;
    }

    // 4. Category Filter (Multi-select)
    if (selectedCategory && selectedCategory.length > 0) {
      const hasCategoryMatch = r.categories && selectedCategory.some(cat => r.categories.includes(cat));
      // Special handling for Vegetarian filter to include dietaryOption tagged items
      const hasDietaryMatch = (selectedCategory.includes('素食') || selectedCategory.includes('Vegetarian')) && 
                              (r.dietaryOption === 'vegetarian_only' || r.dietaryOption === 'vegetarian_friendly');

      if (!hasCategoryMatch && !hasDietaryMatch) {
        return false;
      }
    }

    // 5. Area Filter
    if (selectedArea && r.area !== selectedArea) {
        return false;
    }

    return true;
  }), [restaurants, showOpenOnly, hideDrinksDesserts, halalFilter, selectedCategory, selectedArea]);

  const handleUpdateArea = (id, newArea) => {
    // 1. Update State
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, area: newArea } : r));
    
    // 2. Update Overrides
    const newOverrides = { ...areaOverrides, [id]: newArea };
    setAreaOverrides(newOverrides);
    localStorage.setItem('kulaifood-area-overrides', JSON.stringify(newOverrides));
  };

  const handleExportChanges = () => {
    if (!isDataReady || initialRestaurants.length === 0) {
        return;
    }

    const changes = buildRestaurantDiffChanges(restaurants, initialRestaurants);

    if (changes.length === 0) {
        alert(t('no_changes_to_export') || "No changes detected");
        return;
    }

    const json = JSON.stringify(changes, null, 2);
    
    navigator.clipboard.writeText(json).then(() => {
        alert(`Copied ${changes.length} modified items (Diff Only).`);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Copy Failed");
    });
  };

  const handleChoose = (result) => {
    setTimeout(() => {
      // Navigate to the URL, let the useEffect handle the state update and analytics
      // This ensures that closing the modal (which navigates to '/') correctly resets the state
      navigate(`/restaurant/${result.slug}`);
    }, 1000);
  };

  const handleAddCategory = (newCat) => {
    if (!categories.includes(newCat)) {
      setCategories(prev => [...prev, newCat]);
    }
  };

  const handleCategoryClick = (category) => {
    if (category === null) {
      setSelectedCategory([]);
      return;
    }
    setSelectedCategory(prev => {
        if (prev.includes(category)) {
            return prev.filter(c => c !== category);
        } else {
            return [...prev, category];
        }
    });
  };

  const handleDeleteCategory = (catToDelete) => {
    setCategories(prev => prev.filter(c => c !== catToDelete));
    if (selectedCategory.includes(catToDelete)) {
        setSelectedCategory(prev => prev.filter(c => c !== catToDelete));
    }
  };

  const handleReorderCategories = (newOrder) => {
    setCategories(newOrder);
  };

  const handleUpdateRestaurant = (restaurantId, updatedFields) => {
    // Check if area is changing
    if (updatedFields.area !== undefined) {
        const overrides = { ...areaOverrides, [restaurantId]: updatedFields.area };
        setAreaOverrides(overrides);
        localStorage.setItem('kulaifood-area-overrides', JSON.stringify(overrides));
    }

    setRestaurants(prev => 
      prev.map(r => r.id === restaurantId ? { ...r, ...updatedFields } : r)
    );
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant(prev => ({ ...prev, ...updatedFields }));
    }
  };

  const handleDeleteRestaurant = (restaurantId) => {
    setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant(null);
    }
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
      categories: [], // Initialize empty categories
      isVegetarian: false,
      isNoBeef: false,
      reviews: [],
      rating: 0,
      isNew: true // Flag to trigger auto-edit mode
    };
    setRestaurants(prev => [newRestaurant, ...prev]);
    // Scroll to top to see the new item
    window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
  };

  const handleReorder = (newOrder) => {
      // Automatically reassign IDs based on new order
      const reorderedWithNewIds = newOrder.map((r, index) => ({
          ...r,
          id: index + 1
      }));
      setRestaurants(reorderedWithNewIds);
  };

  const handleRestaurantClick = (restaurant) => {
    // Navigate to the URL, let the useEffect handle the state update and analytics
    navigate(`/restaurant/${restaurant.slug}`);
  };

  if (dataLoadError) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-3">Failed to load data</h2>
          <p className="text-gray-400 mb-6">The restaurant dataset could not be loaded. Please reload and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 border-4 border-white/15 border-t-white rounded-full animate-spin mx-auto mb-5"></div>
          <h2 className="text-2xl font-bold mb-3">Loading Kulai Food Map</h2>
          <p className="text-gray-400">Preparing restaurants, filters, and recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-gray-100">
      {/* Top Zone: Hero Section */}
      <div className="relative w-full pt-4 pb-8 px-4 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(18,18,18,0.3), #121212), url("${heroBg}")` }}>
        
        {/* Admin Background Control */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/40 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleBgUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-700/80 text-white rounded-full hover:bg-gray-600 transition"
              title="更换背景图片 (Change Background)"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              onClick={handleManualSave}
              className="p-2 bg-blue-600/80 text-white rounded-full hover:bg-blue-700/80 transition shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              title="保存设置 (Save Settings)"
            >
              <Save size={18} />
            </button>
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="p-2 bg-purple-600/80 text-white rounded-full hover:bg-purple-700/80 transition shadow-[0_0_10px_rgba(147,51,234,0.3)]"
              title="数据统计与权重 (Analytics)"
            >
              <BarChart2 size={18} />
            </button>
             <button 
              onClick={handleExportData}
              className="p-2 bg-green-600/80 text-white rounded-full hover:bg-green-700/80 transition shadow-[0_0_10px_rgba(22,163,74,0.3)]"
              title="导出数据代码 (Export Data Code)"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => {
                if(window.confirm("确定要重置所有本地数据吗？这将清除缓存并刷新页面。\nAre you sure to reset all local data?")) {
                    clearAppStorage();
                    window.location.reload();
                }
              }}
              className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-700/80 transition shadow-[0_0_10px_rgba(220,38,38,0.3)]"
              title="重置数据 & 修复 (Reset Data & Fix)"
            >
              <RefreshCw size={18} />
            </button>
            {heroBg !== DEFAULT_HERO_BG && (
               <button 
               onClick={resetHeroBg}
               className="p-2 bg-red-900/50 text-white rounded-full hover:bg-red-800/80 transition"
               title="重置背景 (Reset Background)"
             >
               <X size={18} />
             </button>
            )}
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start mb-6 relative z-10">
          <div>
            <h1 
              onClick={handleAdminLoginClick}
              className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] cursor-pointer hover:opacity-90 transition-opacity" 
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}
            >
              {t('app_title')}
            </h1>
            <p className="text-2xl md:text-3xl text-orange-400 mt-1 drop-shadow-md" style={{ fontFamily: '"Lobster", cursive' }}>
              Kulai Food Map
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto">
            <Suspense fallback={<div className="h-[42px] w-[182px] rounded-full bg-white/10 border border-white/10" />}>
              <AuthUserPanel />
            </Suspense>
            <button 
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all shadow-lg"
              title="Switch Language"
            >
              <Globe size={18} />
              <span className="font-bold text-sm">{i18n.language === 'zh' ? 'EN' : '??'}</span>
            </button>
          </div>
        </header>

        {/* Filter Bar */}
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

        {/* Ad Section - Temporarily Hidden as per user request */}
        {/* <AdBanner 
            data={adBannerData}
            onUpdate={setAdBannerData}
            isAdmin={isAdmin}
        /> */}

        {/* Hero Stack Section */}
        <div className="relative w-full flex flex-col items-center min-h-[350px] md:min-h-[450px] mb-5">
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
             <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold text-white mb-2">商家不足以转动</h3>
                <p className="text-gray-400 text-base max-w-xs mx-auto">
                    当前筛选条件下商家少于2家，请尝试选择其他分类/地区或清除筛选。
                </p>
                <button 
                    onClick={() => {
                        setSelectedCategory([]);
                        setSelectedArea(null);
                        setShowOpenOnly(false);
                        setHideDrinksDesserts(false);
                        setHalalFilter(null);
                    }}
                    className="mt-6 px-8 py-3 bg-white text-black rounded-full font-bold shadow-md hover:bg-gray-200 transition"
                >
                    清除筛选 (Clear Filters)
                </button>
             </div>
          )}
        </div>

        {/* Special Filters Row (Below Hero Stack) */}
        <div className="flex flex-col items-center gap-4 mb-8 relative z-30">
            
            {/* Filter Buttons Group */}
            <div className="flex flex-wrap justify-center gap-3">
                {/* Show Open Only */}
                <button
                    onClick={() => setShowOpenOnly(!showOpenOnly)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    showOpenOnly
                        ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50 ring-1 ring-emerald-500/50'
                        : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d] border-[#333]'
                    } border shadow-sm`}
                >
                    <Clock size={16} className={showOpenOnly ? "fill-current" : ""} />
                    {t('filter.open_now')}
                </button>

                {/* No Drinks & Desserts */}
                <button
                    onClick={() => setHideDrinksDesserts(!hideDrinksDesserts)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    hideDrinksDesserts
                        ? 'bg-orange-900/50 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/50'
                        : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d] border-[#333]'
                    } border shadow-sm`}
                >
                    <Coffee size={16} />
                    {t('filter.no_drinks_desserts')}
                </button>

                {/* Halal Status Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowHalalMenu(!showHalalMenu)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        halalFilter
                            ? 'bg-green-900/50 text-green-400 border-green-500/50 ring-1 ring-green-500/50'
                            : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d] border-[#333]'
                        } border shadow-sm`}
                    >
                        <UtensilsCrossed size={16} />
                        {halalFilter ? t(`filter.halal_options.${halalFilter}`) : t('filter.halal_status')}
                    </button>

                    {showHalalMenu && (
                        <>
                            {/* Backdrop to close menu */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowHalalMenu(false)}></div>
                            
                            {/* Menu */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 md:top-0 md:left-full md:ml-2 md:translate-x-0 w-max min-w-[12rem] bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1">
                                <button
                                    onClick={() => { setHalalFilter(null); setShowHalalMenu(false); }}
                                    className={`px-4 py-2 text-center text-sm rounded-lg hover:bg-white/10 ${!halalFilter ? 'text-white font-bold' : 'text-gray-400'}`}
                                >
                                    {t('filter.all')}
                                </button>
                                {['certified', 'muslim_owned', 'no_pork', 'non_halal'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => { setHalalFilter(status); setShowHalalMenu(false); }}
                                        className={`px-4 py-2 text-center text-sm rounded-lg hover:bg-white/10 ${halalFilter === status ? 'text-green-400 font-bold' : 'text-gray-400'}`}
                                    >
                                        {t(`filter.halal_options.${status}`)}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* AI Assistant Button (Inserted here) */}
            <button
                onClick={() => setShowAiAssistant(true)}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-900/80 to-blue-900/80 border border-white/10 hover:border-white/30 text-white font-bold shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
            >
                <Sparkles size={18} className="text-purple-300 group-hover:text-white transition-colors" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200 group-hover:text-white group-hover:bg-none">
                    {t('hero.ai_tagline')}
                </span>
            </button>
        </div>

        {/* Donate / Support Section (Moved here) */}
        <div className="flex justify-center mb-8 relative z-20">
            <button
                onClick={() => {
                    trackEvent('support_click', { source: 'support_button' });
                    setShowSupportModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
            >
                <Coffee size={18} />
                <span>{t('hero.support_btn')}</span>
            </button>
        </div>
      </div>

      {/* Bottom Zone: Restaurant List */}
      <div className="bg-[#121212] w-full max-w-[1600px] mx-auto relative z-10">
        <RestaurantList 
            restaurants={filteredRestaurants} // Pass filtered list
            allRestaurants={restaurants} // Pass all for context if needed, but mainly filtered
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
        
      </div>

      {/* AI Assistant Floating Button */}
      <button 
        onClick={() => setShowAiAssistant(true)}
        className="fixed bottom-6 left-6 z-40 bg-gradient-to-tr from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 group flex items-center gap-2 border border-white/20"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-sm font-bold">
            {t('ask_ai', 'AI 助手')}
        </span>
      </button>

      {/* AI Assistant Modal */}
      <Suspense fallback={null}>
        <AiFoodAssistant 
          isOpen={showAiAssistant} 
          onClose={() => setShowAiAssistant(false)}
          restaurants={restaurants}
          onRestaurantClick={handleRestaurantClick}
        />
      </Suspense>

      <Footer onAdminLogin={() => setShowLoginModal(true)} />

      {/* Result Modal */}
      <Suspense fallback={null}>
        {selectedRestaurant && (
          <ResultModal 
            restaurant={selectedRestaurant} 
            onClose={() => navigate('/')} 
            isAdmin={isAdmin}
            onUpdateRestaurant={handleUpdateRestaurant}
            categories={categories} // Pass available categories
            onAddCategory={handleAddCategory} // Allow adding from modal too
          />
        )}
      </Suspense>

      {/* Support Modal */}
      <Suspense fallback={null}>
        <SupportModal 
          isOpen={showSupportModal} 
          onClose={() => setShowSupportModal(false)} 
          isAdmin={isAdmin}
          supportQR={supportQR}
          onUpdateQR={handleUpdateSupportQR}
        />
      </Suspense>
      
      {/* Admin Analytics Modal */}
      <Suspense fallback={null}>
        <AdminAnalytics 
          isOpen={showAnalyticsModal} 
          onClose={() => setShowAnalyticsModal(false)}
          restaurants={restaurants}
        />
      </Suspense>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={handleLoginSubmit}
      />
    </div>
  );
}

export default App;
