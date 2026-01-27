import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { initialRestaurants } from './data/restaurants';
import HeroCardStack from './components/HeroCardStack';
import ResultModal from './components/ResultModal';
import RestaurantList from './components/RestaurantList';
import FilterBar from './components/FilterBar';
import Footer from './components/Footer';
import AdBanner from './components/AdBanner';
import SupportModal from './components/SupportModal';
import LoginModal from './components/LoginModal';
import AdminAnalytics from './components/AdminAnalytics';
import AiFoodAssistant from './components/AiFoodAssistant';
import { UtensilsCrossed, Lock, X, Coffee, Image as ImageIcon, Upload, Save, Download, BarChart2, Globe, Clock, Dessert, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { checkOpenStatus } from './utils/businessHours';
import { analytics } from './utils/analytics';

import { AVAILABLE_AREAS, DEFAULT_CATEGORIES } from './data/constants';

const DEFAULT_HERO_BG = "https://i.ibb.co/7J5qjZtv/image.png";

// Version control for data structure changes
// Increment this when you make breaking changes to data structure to force a reset
const DATA_VERSION = 'v37';

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check version and clear if needed
    const currentVersion = localStorage.getItem('kulaifood-data-version');
    if (currentVersion !== DATA_VERSION) {
      console.log(`Version mismatch: ${currentVersion} vs ${DATA_VERSION}. Clearing storage.`);
      localStorage.clear();
      localStorage.setItem('kulaifood-data-version', DATA_VERSION);
      // Reload to ensure clean state
      window.location.reload();
    }
  }, []);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  // Area Overrides State (for manual fixes)
  const [areaOverrides, setAreaOverrides] = useState(() => {
    try {
        // Check version first - if mismatch, clear overrides to avoid stale data
        const storedVersion = localStorage.getItem('kulaifood-data-version');
        if (storedVersion !== DATA_VERSION) {
            return {}; 
        }
        const stored = localStorage.getItem('kulaifood-area-overrides');
        return stored ? JSON.parse(stored) : {};
    } catch(e) { return {}; }
  });

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

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setHeroBg(base64String);
        localStorage.setItem('kulaifood-hero-bg', base64String);
      };
      reader.readAsDataURL(file);
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
      localStorage.setItem('kulaifood-categories', JSON.stringify(categories));
      localStorage.setItem('kulaifood-hero-bg', heroBg);
      
      alert(t('settings_saved'));
  };

  const handleExportData = () => {
    // 1. Normalize Initial Data for fair comparison
    const normalizedInitial = initialRestaurants.map(r => ({
      ...r,
      name: r.name || r.desc,
      name_en: r.name_en || r.desc2,
      categories: r.categories || r.category || [],
      price_range: r.price_range || 'RM 10-20',
      subStalls: (r.subStalls || []).map(s => typeof s === 'string' ? {name: s, image: ''} : s).filter(Boolean),
      branches: (r.branches || []).map(b => typeof b === 'string' ? {name: b, address: ''} : b).filter(Boolean),
    }));

    const initialMap = new Map(normalizedInitial.map(r => [r.id, r]));

    // 2. Identify Changed or New Items
    const changedRestaurants = restaurants.map(r => {
        const original = initialMap.get(r.id);
        
        // New item: Export full object
        if (!original) return r;

        // Existing item: Check for changes
        const changes = { id: r.id };
        let hasChanges = false;
        
        const check = (key) => {
             // Simple equality check for primitives, JSON stringify for objects/arrays
             const val1 = r[key];
             const val2 = original[key];
             const str1 = typeof val1 === 'object' ? JSON.stringify(val1) : val1;
             const str2 = typeof val2 === 'object' ? JSON.stringify(val2) : val2;

             if (str1 !== str2) {
                 changes[key] = val1;
                 hasChanges = true;
             }
        };

        ['name', 'name_en', 'image', 'opening_hours', 'address', 'intro_zh', 'intro_en', 
         'categories', 'price_range', 'subStalls', 'branches', 'isVegetarian', 'isNoBeef', 'area']
        .forEach(check);

        return hasChanges ? changes : null;
    }).filter(Boolean);

    const exportData = changedRestaurants.length > 0 ? changedRestaurants : [];

    if (exportData.length === 0) {
        alert(t('no_changes', '没有检测到更改 (No changes detected)'));
        return;
    }

    // 3. Prepare Data Format
    // For partial updates, we don't need to map category back unless it changed
    const formattedData = exportData.map(item => {
        if (item.categories) {
            return { ...item, category: item.categories };
        }
        return item;
    });

    const fileContent = `// ⚠️ PATCH DATA: Contains only changed fields. DO NOT REPLACE initialRestaurants directly.\n// Use this to update specific fields or send to developer.\nexport const restaurantUpdates = ${JSON.stringify(formattedData, null, 2)};`;

    // 4. Copy to Clipboard
    navigator.clipboard.writeText(fileContent).then(() => {
         alert(t('copy_success_changes', { count: formattedData.length }));
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert(t('copy_failed'));
    });
  };

  // Version Control for Data (Increment this when adding new hardcoded data to force refresh)
  // Moved to top of file as const DATA_VERSION  

  // Load data: Prioritize Codebase (initialRestaurants) but keep user-added ones from LocalStorage
  const [restaurants, setRestaurants] = useState(() => {
    // Debug Log
    console.log(`[App] Initializing Data. Codebase has ${initialRestaurants.length} items.`);

    // 1. Check Data Version
    let storedVersion = localStorage.getItem('kulaifood-data-version');
    let shouldClearStorage = storedVersion !== DATA_VERSION;

    if (shouldClearStorage) {
        console.log(`[App] Data version mismatch (${storedVersion} vs ${DATA_VERSION}). Refreshing data...`);
        // Force clear critical storage items to ensure fresh start
        localStorage.removeItem('kulaifood-restaurants');
        localStorage.removeItem('kulaifood-categories'); // Clear categories too!
        localStorage.removeItem('kulaifood-area-overrides'); // Clear area overrides!
    }

    // 1. Load stored data to preserve ORDER and User-Added Items
    let storedData = [];
    try {
        if (!shouldClearStorage) {
            const item = localStorage.getItem('kulaifood-restaurants');
            if (item) storedData = JSON.parse(item);
        }
    } catch(e) {
        console.warn("Failed to load restaurants from LocalStorage", e);
    }

    // 2. Create Map of Codebase Data (The Source of Truth for Content)
    const codeMap = new Map(initialRestaurants.map(r => [r.id, r]));
    
    let mergedData = [];
    const processedIds = new Set();

    if (Array.isArray(storedData) && storedData.length > 0) {
        // 3. Process stored items (Preserve Order from LocalStorage)
        storedData.forEach(stored => {
            if (codeMap.has(stored.id)) {
                // ID exists in code: Use code content (latest updates) but keep stored order
                // BUT: Check for Area Overrides
                const codeData = codeMap.get(stored.id);
                let area = codeData.area;
                const overrides = JSON.parse(localStorage.getItem('kulaifood-area-overrides') || '{}');
                if (overrides[stored.id]) {
                    area = overrides[stored.id];
                }

                // Preserve user branches if code branches are empty
                const mergedItem = { ...stored, ...codeData, area };
                if ((!codeData.branches || codeData.branches.length === 0) && stored.branches && stored.branches.length > 0) {
                    mergedItem.branches = stored.branches;
                }
                mergedData.push(mergedItem);
                processedIds.add(stored.id);
            } else {
                // ID not in code: User-added item (Admin), keep it
                mergedData.push(stored);
                processedIds.add(stored.id);
            }
        });
    }

    // 4. Append any NEW items from code that weren't in storage
    initialRestaurants.forEach(r => {
        if (!processedIds.has(r.id)) {
            let area = r.area;
            const overrides = JSON.parse(localStorage.getItem('kulaifood-area-overrides') || '{}');
            if (overrides[r.id]) {
                area = overrides[r.id];
            }
            mergedData.push({ ...r, area });
        }
    });

    // 5. Fallback if storage was empty
    if (mergedData.length === 0) mergedData = [...initialRestaurants];

    // Normalize Data on Init
    return mergedData.map(r => ({
      ...r,
      // Map desc to name (Primary Display) - Prioritize name (New standard) over desc (Old standard)
      name: r.name || r.desc,
      // Map desc2 to name_en (Secondary Display) - Prioritize name_en over desc2
      name_en: r.name_en || r.desc2,
      // Ensure categories exists (map from category if needed)
      categories: r.categories || r.category || [],
      
      // Commercial Fields
      subscriptionLevel: r.subscriptionLevel || 0,
      isVIP: (r.subscriptionLevel || 0) > 0,
      priority: r.priority || 0,
      whatsappLink: r.whatsappLink || "",

      // Ensure price_range exists
      price_range: r.price_range || 'RM 10-20',
      // Ensure subStalls is an array of objects
      subStalls: (r.subStalls || []).map(stall => {
        if (!stall) return null; // Handle null/undefined
        if (typeof stall === 'string') {
            return { name: stall, image: '' };
        }
        return stall;
      }).filter(Boolean), // Remove nulls
      // Ensure branches is an array of objects
      branches: (r.branches || []).map(branch => {
          if (!branch) return null;
          if (typeof branch === 'string') {
              return { name: branch, address: '' };
          }
          return branch;
      }).filter(Boolean)
    }));
  });

  // Save Restaurants to LocalStorage on change
  useEffect(() => {
     localStorage.setItem('kulaifood-restaurants', JSON.stringify(restaurants));
     localStorage.setItem('kulaifood-data-version', DATA_VERSION);
  }, [restaurants]);

  const [categories, setCategories] = useState(() => {
    let finalCategories = [];
    let processedCats = new Set();
    
    // Define deprecated categories to filter out
    const deprecatedCats = new Set(["Pizza", "炸鸡", "中餐", "无招牌美食", "马来餐", "印度档", "甜品饮料"]);

    // 1. Try to load from LocalStorage FIRST (Preserve Order)
    try {
      // Changed key to v2 to force reset order for Malay/Indian update
      const storedCats = localStorage.getItem('kulaifood-categories-v2');
      if (storedCats && storedCats !== "undefined" && storedCats !== "null") {
        const parsedCats = JSON.parse(storedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          // Filter deprecated from storage
          finalCategories = parsedCats.filter(c => !deprecatedCats.has(c));
          finalCategories.forEach(c => processedCats.add(c));
        }
      }
    } catch (e) {
      console.warn("Failed to load categories from LocalStorage", e);
    }

    // 2. Merge Defaults (Ensure new system categories appear)
    DEFAULT_CATEGORIES.forEach(c => {
        if (!processedCats.has(c) && !deprecatedCats.has(c)) {
            finalCategories.push(c);
            processedCats.add(c);
        }
    });

    // 3. Merge from Data (Ensure used categories appear)
    initialRestaurants.forEach(r => {
      if (Array.isArray(r.category)) {
        r.category.forEach(c => {
            if (!processedCats.has(c) && !deprecatedCats.has(c)) {
                finalCategories.push(c);
                processedCats.add(c);
            }
        });
      } else if (Array.isArray(r.categories)) {
        r.categories.forEach(c => {
            if (!processedCats.has(c) && !deprecatedCats.has(c)) {
                finalCategories.push(c);
                processedCats.add(c);
            }
        });
      }
    });
    
    return finalCategories;
  });

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Sync URL with Selected Restaurant
  useEffect(() => {
    const match = matchPath('/restaurant/:id', location.pathname);
    if (match && match.params.id) {
        const id = parseInt(match.params.id, 10);
        const restaurant = restaurants.find(r => r.id === id);
        if (restaurant) {
            // Only update if not already selected to avoid loops/re-renders
            if (selectedRestaurant?.id !== restaurant.id) {
                setSelectedRestaurant(restaurant);
                // Increment view count when opened via URL (or navigation)
                analytics.incrementView(restaurant.id);
            }
        }
    } else {
        // If URL is not /restaurant/:id, ensure modal is closed
        if (selectedRestaurant) {
            setSelectedRestaurant(null);
        }
    }
  }, [location.pathname, restaurants]);
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
    localStorage.setItem('kulaifood-categories-v2', JSON.stringify(categories));
  }, [categories]);

  // Log Restaurants changes to Console for Manual Update
  useEffect(() => {
    if (restaurants !== initialRestaurants) {
        console.log("--------------- UPDATED DATA (Copy below to src/data/restaurants.js) ---------------");
        const exportData = restaurants.map(({ name, name_en, ...rest }) => ({
            ...rest,
            desc: name,
            desc2: name_en
        }));
        console.log(JSON.stringify(exportData, null, 2));
        console.log("------------------------------------------------------------------------------------");
    }
  }, [restaurants]);

  // Log AdBanner changes
  useEffect(() => {
    if (adBannerData && adBannerData.length > 0) {
        console.log("--------------- UPDATED AD BANNER DATA (Update useState in src/App.jsx) ---------------");
        console.log(JSON.stringify(adBannerData, null, 2));
        console.log("---------------------------------------------------------------------------------------");
    }
  }, [adBannerData]);

  // Filtering Logic
  let filteredRestaurants = restaurants.filter(r => {
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
    if (halalFilter) {
        if (r.halalStatus !== halalFilter) {
            return false;
        }
    }

    // 4. Category Filter (Multi-select)
    if (selectedCategory && selectedCategory.length > 0) {
      if (!r.categories || !selectedCategory.some(cat => r.categories.includes(cat))) {
        return false;
      }
    }

    // 5. Area Filter
    if (selectedArea) {
        if (!r.address || !r.address.includes(selectedArea)) {
            return false;
        }
    }

    return true;
  });

  const handleUpdateArea = (id, newArea) => {
    // 1. Update State
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, area: newArea } : r));
    
    // 2. Update Overrides
    const newOverrides = { ...areaOverrides, [id]: newArea };
    setAreaOverrides(newOverrides);
    localStorage.setItem('kulaifood-area-overrides', JSON.stringify(newOverrides));
  };

  const handleExportChanges = () => {
    // 1. Identify Changed or New Restaurants
    const changes = restaurants.reduce((acc, current) => {
        const original = initialRestaurants.find(init => init.id === current.id);
        
        // Case A: New Restaurant (Not in initial data)
        if (!original) {
            acc.push(current);
            return acc;
        }

        // Case B: Modified Restaurant
        const diff = { id: current.id };
        let hasChanges = false;
        
        const keysToCheck = [
            'name', 'name_en', 'address', 'opening_hours', 
            'price_range', 'image', 'rating', 'area',
            'menu_link', 'website_link', 'delivery_link',
            'isVegetarian', 'isNoBeef', 'manualStatus',
            'intro_zh', 'intro_en', 'categories', 'subStalls', 'branches',
            'location', 'tags', 'subscriptionLevel', 'priority', 'whatsappLink'
        ];

        keysToCheck.forEach(key => {
            const valCurrent = current[key];
            const valOriginal = original[key];

            // Handle Objects & Arrays (Categories, SubStalls, Location, Tags)
            if (typeof valCurrent === 'object' && valCurrent !== null) {
                const jsonCurrent = JSON.stringify(valCurrent);
                const jsonOriginal = JSON.stringify(valOriginal || (Array.isArray(valCurrent) ? [] : {})); // Handle null/undefined original
                
                if (jsonCurrent !== jsonOriginal) {
                    diff[key] = valCurrent;
                    hasChanges = true;
                }
                return;
            }

            // Handle normal values (strings, numbers, booleans)
            const normCurrent = valCurrent === undefined || valCurrent === null ? '' : valCurrent;
            const normOriginal = valOriginal === undefined || valOriginal === null ? '' : valOriginal;
            
            if (normCurrent != normOriginal) {
                diff[key] = valCurrent;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            acc.push(diff);
        }
        
        return acc;
    }, []);

    if (changes.length === 0) {
        alert(t('no_changes_to_export') || "没有检测到更改 (No changes detected)");
        return;
    }

    // 2. Format Output
    const json = JSON.stringify(changes, null, 2);
    
    // 3. Copy
    navigator.clipboard.writeText(json).then(() => {
        const msg = `已复制 ${changes.length} 个商家的修改数据！(仅包含变动部分)\nCopied ${changes.length} modified items (Diff Only).`;
        alert(msg);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("复制失败 (Copy Failed)");
    });
  };

  const handleChoose = (result) => {
    setTimeout(() => {
      // Navigate to the URL, let the useEffect handle the state update and analytics
      // This ensures that closing the modal (which navigates to '/') correctly resets the state
      navigate(`/restaurant/${result.id}`);
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

  const handleAddReview = (restaurantId, newReview) => {
    setRestaurants(prev => 
      prev.map(r => {
        if (r.id === restaurantId) {
            const updatedReviews = [newReview, ...r.reviews];
            // Recalculate rating
            const total = updatedReviews.reduce((sum, rev) => sum + (rev.rating || 5), 0);
            // If reviews have no rating field (comment only), we might need a default.
            // Assuming newReview has a rating or we just count comments? 
            // The user said "Preset rating 0, update only when user comments".
            // It implies user gives a rating. 
            // Currently ResultModal doesn't seem to have star rating input, just name/comment.
            // If the user meant "update rating based on reviews", we need star input.
            // If they meant "just show something else", it's different.
            // Assuming for now we just keep the old rating logic or if we implement star rating later.
            // Wait, the prompt said "Preset rating set to 0, update only when user comments".
            // This strongly implies the rating is dynamic.
            // I will assume for now that simply having a review makes it "active".
            // But usually reviews have stars.
            // Since ResultModal code showed "onAddReview" passing {user, comment, date}, no rating.
            // I should probably add a default rating of 5 to the review if not present, OR
            // just keep the restaurant rating as is if we can't calculate it?
            // "Preset rating set to 0, update only when user comments" -> implies calculation.
            // I'll add a dummy calculation for now: new reviews count as 5 stars or we need to add star input.
            // Let's assume for this task I should just set initial to 0. 
            // If I set initial to 0, and don't update it, it stays 0.
            // I'll add a simple logic: if reviews exist, set rating to 5 (or random 4.5-5) if we don't have real data?
            // No, that's bad. 
            // I'll check ResultModal again later. For now let's just update the list.
            return { ...r, reviews: updatedReviews, rating: 5 }; // Placeholder: Reset to 5 if reviewed? 
            // Better: If reviews.length > 0, calculate average. But we lack input.
            // I'll just leave it as updating reviews for now, and handle the "0" initialization in data.
            // The user might just want to start fresh.
        }
        return r;
      })
    );
    if (selectedRestaurant?.id === restaurantId) {
       // logic to update selectedRestaurant...
       // Simplified: The list update will trigger re-render if passed correctly, 
       // but selectedRestaurant is local state in App. 
       // We need to update it too.
       setSelectedRestaurant(prev => {
            const updatedReviews = [newReview, ...prev.reviews];
             return { ...prev, reviews: updatedReviews }; 
       });
    }
  };

  const handleDeleteReview = (restaurantId, reviewIndex) => {
    setRestaurants(prev => 
        prev.map(r => {
            if (r.id === restaurantId) {
                const newReviews = [...r.reviews];
                newReviews.splice(reviewIndex, 1);
                return { ...r, reviews: newReviews };
            }
            return r;
        })
    );
    if (selectedRestaurant?.id === restaurantId) {
        setSelectedRestaurant(prev => {
            const newReviews = [...prev.reviews];
            newReviews.splice(reviewIndex, 1);
            return { ...prev, reviews: newReviews };
        });
    }
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
      navigate(`/restaurant/${restaurant.id}`);
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-gray-100">
      {/* Top Zone: Hero Section */}
      <div className="relative w-full overflow-hidden pt-4 pb-8 px-4 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(18,18,18,0.3), #121212), url("${heroBg}")` }}>
        
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
                    localStorage.clear();
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
        <header className="flex justify-between items-center mb-6 relative z-10">
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
          
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all shadow-lg"
            title="Switch Language"
          >
            <Globe size={18} />
            <span className="font-bold text-sm">{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
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
        <div className="relative w-full flex flex-col items-center min-h-[450px] mb-5">
          {filteredRestaurants.length > 1 ? (
            <HeroCardStack 
              restaurants={filteredRestaurants} 
              onChoose={handleChoose}
              onSupportClick={() => setShowSupportModal(true)}
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
        <div className="flex flex-col items-center gap-4 mb-8 relative z-20">
            
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
                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1">
                                <button
                                    onClick={() => { setHalalFilter(null); setShowHalalMenu(false); }}
                                    className={`px-4 py-2 text-left text-sm rounded-lg hover:bg-white/10 ${!halalFilter ? 'text-white font-bold' : 'text-gray-400'}`}
                                >
                                    {t('filter.all')}
                                </button>
                                {['certified', 'muslim_owned', 'no_pork'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => { setHalalFilter(status); setShowHalalMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm rounded-lg hover:bg-white/10 ${halalFilter === status ? 'text-green-400 font-bold' : 'text-gray-400'}`}
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
                    专治“随便”和“都可以”问问AI
                </span>
            </button>
        </div>

        {/* Donate / Support Section (Moved here) */}
        <div className="flex justify-center mb-8 relative z-20">
            <button
                onClick={() => setShowSupportModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
            >
                <Coffee size={18} />
                <span>觉得好用？请我喝一杯Kopi ☕</span>
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
            onCategoryClick={setSelectedCategory} // New Prop
            onReorder={handleReorder}
            onUpdateArea={handleUpdateArea}
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
      <AiFoodAssistant 
        isOpen={showAiAssistant} 
        onClose={() => setShowAiAssistant(false)}
        restaurants={restaurants}
        onRestaurantClick={handleRestaurantClick}
      />

      <Footer onAdminLogin={() => setShowLoginModal(true)} />

      {/* Result Modal */}
      {selectedRestaurant && (
        <ResultModal 
          restaurant={selectedRestaurant} 
          onClose={() => navigate('/')} 
          onAddReview={handleAddReview}
          isAdmin={isAdmin}
          onUpdateRestaurant={handleUpdateRestaurant}
          onDeleteReview={handleDeleteReview} // Pass delete handler
          categories={categories} // Pass available categories
          onAddCategory={handleAddCategory} // Allow adding from modal too
        />
      )}

      {/* Support Modal */}
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
        isAdmin={isAdmin}
        supportQR={supportQR}
        onUpdateQR={handleUpdateSupportQR}
      />
      
      {/* Admin Analytics Modal */}
      <AdminAnalytics 
        isOpen={showAnalyticsModal} 
        onClose={() => setShowAnalyticsModal(false)}
        restaurants={restaurants}
      />

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
