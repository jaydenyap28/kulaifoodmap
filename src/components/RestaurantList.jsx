import React, { lazy, Suspense, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import {
  MapPin,
  Edit2,
  Trash2,
  ArrowUp,
  Search,
  Plus,
  Leaf,
  Sprout,
  Star,
  GripVertical,
  Flame,
  Medal,
  User,
  Flame as FlameIcon,
  HeartHandshake,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/trackEvent';
import ImageWithFallback from './ImageWithFallback';
import { checkOpenStatus } from '../utils/businessHours';
import RestaurantRankBadge from './RestaurantRankBadge';
import { AVAILABLE_AREAS } from '../data/constants';
import { getCurrentSessionUser } from '../services/spinService';
import { supportRestaurant } from '../services/supportService';
import { useToast } from './toast/ToastProvider';

const AdminSortableRestaurantGrid = lazy(() => import('./AdminSortableRestaurantGrid'));

const SORT_OPTIONS = [
  { id: 'hot', label: '热门推荐' },
  { id: 'random', label: '随机看看' },
];

const shuffleRestaurants = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }
  return nextItems;
};

const sortRestaurantsByMode = (items, mode) => {
  if (mode === 'recommended') {
    return [...items].sort((a, b) => a.id - b.id);
  }

  if (mode === 'random') {
    return shuffleRestaurants(items);
  }

  return [...items].sort((a, b) => (b.hot_score || 0) - (a.hot_score || 0) || a.id - b.id);
};

const RestaurantList = ({
  restaurants,
  allRestaurants,
  isAdmin,
  onUpdateRestaurant,
  onDeleteRestaurant,
  onRestaurantClick,
  onAddRestaurant,
  onCategoryClick,
  onReorder,
  onUpdateArea,
  onRefreshRestaurants,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortMode, setSortMode] = useState('hot');
  const [supportingRestaurantId, setSupportingRestaurantId] = useState(null);
  const [supportCooldownMap, setSupportCooldownMap] = useState({});
  const cooldownTimersRef = useRef({});
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (deferredSearchTerm) {
        trackEvent('search', {
          search_term: deferredSearchTerm,
          search_length: deferredSearchTerm.length,
        });
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [deferredSearchTerm]);

  const filteredRestaurants = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();

    const filtered = restaurants.filter((restaurant) => (
      (restaurant.name || '').toLowerCase().includes(term) ||
      (restaurant.name_en || '').toLowerCase().includes(term) ||
      (restaurant.address || '').toLowerCase().includes(term) ||
      (restaurant.area || '').toLowerCase().includes(term) ||
      (restaurant.dietaryOption && (term.includes('veg') || term.includes('vegetarian'))) ||
      (restaurant.categories && restaurant.categories.some((category) => (category || '').toLowerCase().includes(term))) ||
      (restaurant.branches && restaurant.branches.some((branch) => (branch.name || '').toLowerCase().includes(term))) ||
      (restaurant.subStalls && restaurant.subStalls.some((stall) => {
        const stallName = typeof stall === 'object' ? stall.name : stall;
        return (stallName || '').toLowerCase().includes(term);
      }))
    ));

    return sortRestaurantsByMode(filtered, sortMode);
  }, [restaurants, deferredSearchTerm, sortMode]);

  const isReorderable =
    isAdmin &&
    sortMode === 'recommended' &&
    allRestaurants &&
    restaurants.length === allRestaurants.length &&
    !deferredSearchTerm;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => () => {
    Object.values(cooldownTimersRef.current).forEach((timerId) => {
      window.clearTimeout(timerId);
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestaurantClick = (restaurant) => {
    trackEvent('restaurant_click', {
      restaurant_id: String(restaurant.id),
      restaurant_name: restaurant.name,
      source: 'list',
    });
    onRestaurantClick(restaurant);
  };

  const applySupportCooldown = (restaurantId, delay = 1800) => {
    setSupportCooldownMap((currentMap) => ({ ...currentMap, [restaurantId]: true }));

    if (cooldownTimersRef.current[restaurantId]) {
      window.clearTimeout(cooldownTimersRef.current[restaurantId]);
    }

    cooldownTimersRef.current[restaurantId] = window.setTimeout(() => {
      setSupportCooldownMap((currentMap) => {
        const nextMap = { ...currentMap };
        delete nextMap[restaurantId];
        return nextMap;
      });
      delete cooldownTimersRef.current[restaurantId];
    }, delay);
  };

  const handleSupportRestaurant = async (restaurant) => {
    if (supportingRestaurantId || supportCooldownMap[restaurant.id]) {
      return;
    }

    const currentUser = await getCurrentSessionUser();
    if (!currentUser) {
      toast.info('先登录一下，就能为喜欢的店助力了。');
      return;
    }

    setSupportingRestaurantId(restaurant.id);

    try {
      const result = await supportRestaurant(restaurant.id);

      if (!result?.success) {
        toast.error(result?.message || '这次助力没有成功，请稍后再试。');
        return;
      }

      await onRefreshRestaurants?.();
      window.dispatchEvent(new CustomEvent('profile-refresh'));
      applySupportCooldown(restaurant.id);
      toast.success(result.message || '助力成功，已扣除 10 积分，商家热度 +10。');
    } catch (error) {
      console.error('Failed to support restaurant', error);
      toast.error(error.message || '这次助力没有成功，请稍后再试。');
    } finally {
      setSupportingRestaurantId(null);
    }
  };

  const renderRestaurantCard = (restaurant, extraProps = {}) => (
    <RestaurantCard
      key={restaurant.id}
      restaurant={restaurant}
      isAdmin={isAdmin}
      onUpdate={onUpdateRestaurant}
      onDelete={onDeleteRestaurant}
      onClick={() => handleRestaurantClick(restaurant)}
      onCategoryClick={onCategoryClick}
      onUpdateArea={onUpdateArea}
      onSupport={handleSupportRestaurant}
      isSupporting={supportingRestaurantId === restaurant.id}
      isSupportCoolingDown={Boolean(supportCooldownMap[restaurant.id])}
      {...extraProps}
    />
  );

  return (
    <div className="relative w-full px-4 pb-20">
      <div className="sticky top-0 z-40 -mx-4 mb-8 border-b border-gray-800 bg-[#121212]/95 px-4 py-6 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-white"></div>
                <h3 className="text-2xl font-bold text-white">
                  {t('list.title')} <span className="text-base font-normal text-gray-500">({filteredRestaurants.length})</span>
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortMode(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                      sortMode === option.id
                        ? 'border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
                        : 'border-[#333] bg-[#1e1e1e] text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={onAddRestaurant}
                    className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-200"
                  >
                    <Plus size={16} /> {t('list.add_restaurant')}
                  </button>
                </div>
              )}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 transform text-gray-500" size={18} />
              <input
                type="text"
                placeholder={t('list.search_placeholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-full border border-gray-700 bg-[#1e1e1e] py-3 pl-11 pr-12 text-base text-gray-200 placeholder-gray-600 transition-all focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {isReorderable ? (
          <Suspense fallback={filteredRestaurants.map((restaurant) => renderRestaurantCard(restaurant))}>
            <AdminSortableRestaurantGrid
              restaurants={filteredRestaurants}
              renderRestaurantCard={renderRestaurantCard}
              onReorder={onReorder}
            />
          </Suspense>
        ) : (
          filteredRestaurants.map((restaurant) => renderRestaurantCard(restaurant))
        )}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="rounded-3xl border border-[#333] bg-[#1e1e1e] py-20 text-center">
          <div className="mb-4 text-6xl">🍽️</div>
          <h3 className="mb-2 text-xl font-bold text-white">{t('list.no_results')}</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 rounded-full bg-white p-4 text-black shadow-lg transition-all hover:scale-110 hover:bg-gray-200 active:scale-95"
          aria-label="Back to Top"
        >
          <ArrowUp size={28} />
        </button>
      )}
    </div>
  );
};

const RestaurantCard = ({
  restaurant,
  isAdmin,
  onDelete,
  onClick,
  onCategoryClick,
  onUpdateArea,
  onSupport,
  isSupporting,
  isSupportCoolingDown,
  dragHandleProps,
}) => {
  const { t, i18n } = useTranslation();
  const openStatus = restaurant.manualStatus && restaurant.manualStatus !== 'auto'
    ? {
        isOpen: restaurant.manualStatus === 'open',
        text: restaurant.manualStatus === 'open' ? '营业中 (Open)' : '已休息 (Closed)',
      }
    : checkOpenStatus(restaurant.opening_hours);

  const isVIP = (restaurant.subscriptionLevel || 0) > 0;
  const borderClass = isVIP ? 'border-amber-500/50 shadow-amber-900/10' : 'border-gray-800';
  const isSupportDisabled = isSupporting || isSupportCoolingDown;

  return (
    <div
      onClick={onClick}
      className={`group relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-2xl border bg-[#1e1e1e] shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 ${borderClass} ${isVIP ? 'hover:-translate-y-1' : ''}`}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-gray-800 shadow-inner">
        {isAdmin && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute left-2 top-2 z-20 cursor-grab rounded-full bg-black/50 p-2 text-white backdrop-blur-sm touch-none active:cursor-grabbing"
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical size={16} />
          </div>
        )}

        <ImageWithFallback
          src={restaurant.image}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60"></div>

        {isVIP && (
          <div className="absolute right-0 top-0 z-20 flex items-center gap-1 rounded-bl-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
            {restaurant.subscriptionLevel >= 3 ? <Flame size={12} className="fill-white" /> : <Medal size={12} className="fill-white" />}
            <span>{restaurant.subscriptionLevel >= 3 ? 'FEATURED' : '精选'}</span>
          </div>
        )}

        {isAdmin && (
          <div
            className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                onClick();
              }}
              className="rounded-full bg-black/50 p-2 text-gray-300 shadow-sm backdrop-blur-sm hover:text-white"
              title={t('list.edit')}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                if (window.confirm(t('list.confirm_delete'))) {
                  onDelete(restaurant.id);
                }
              }}
              className="rounded-full bg-black/50 p-2 text-red-400 shadow-sm backdrop-blur-sm hover:text-red-600"
              title={t('list.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${
              openStatus.isOpen ? 'bg-emerald-600/90' : 'bg-red-600/90'
            }`}
          >
            {openStatus.isOpen ? t('list.status_open') : t('list.status_closed')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between">
          <div className="mr-2 flex-1">
            <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white">
              {i18n.language === 'en' && restaurant.name_en ? restaurant.name_en : restaurant.name}
            </h3>
          </div>

          {isAdmin && (
            <div className="shrink-0 rounded border border-gray-700 bg-[#2d2d2d] px-1.5 py-0.5 text-xs font-bold text-yellow-400 shadow-sm">
              <span className="flex items-center">
                <Star size={10} className="mr-1 fill-yellow-400" /> {restaurant.rating}
              </span>
            </div>
          )}
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <RestaurantRankBadge hotScore={restaurant.hot_score || 0} />
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold leading-none text-orange-200">
            <FlameIcon size={10} className="text-orange-300" />
            🔥 {restaurant.hot_score || 0}
          </span>
        </div>

        {restaurant.name_en && (
          <p className="mb-3 line-clamp-1 text-xs font-medium leading-tight text-gray-400">
            {restaurant.name_en}
          </p>
        )}

        {(restaurant.categories?.length > 0 || restaurant.isVegetarian || (restaurant.halalStatus && restaurant.halalStatus !== 'non_halal')) && (
          <div className="mb-2 flex flex-wrap gap-1">
            {restaurant.categories && restaurant.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                onClick={(event) => {
                  event.stopPropagation();
                  if (onCategoryClick) {
                    onCategoryClick(category);
                  }
                }}
                className="cursor-pointer rounded border border-gray-700 bg-[#2d2d2d] px-1.5 py-0.5 text-[10px] leading-none text-gray-300 transition-colors hover:bg-gray-700"
              >
                {category}
              </span>
            ))}

            {(restaurant.dietaryOption === 'vegetarian_only' || restaurant.isVegetarian) ? (
              <span className="flex items-center gap-1 rounded border border-emerald-800 bg-emerald-900/50 px-1.5 py-0.5 text-[10px] leading-none text-emerald-400">
                <Leaf size={10} /> 素食
              </span>
            ) : restaurant.dietaryOption === 'vegetarian_friendly' ? (
              <span className="flex items-center gap-1 rounded border border-lime-800 bg-lime-900/50 px-1.5 py-0.5 text-[10px] leading-none text-lime-400">
                <Sprout size={10} /> 提供素食选项
              </span>
            ) : null}

            {restaurant.halalStatus === 'certified' && (
              <span className="flex items-center gap-1 rounded border border-emerald-800 bg-emerald-900/50 px-1.5 py-0.5 text-[10px] leading-none text-emerald-400">
                {t('filter.halal_options.certified')}
              </span>
            )}
            {restaurant.halalStatus === 'muslim_owned' && (
              <span className="flex items-center gap-1 rounded border border-green-800 bg-green-900/50 px-1.5 py-0.5 text-[10px] leading-none text-green-400">
                <User size={10} /> {t('filter.halal_options.muslim_owned')}
              </span>
            )}
            {restaurant.halalStatus === 'no_pork' && (
              <span className="flex items-center gap-1 rounded border border-orange-800 bg-orange-900/50 px-1.5 py-0.5 text-[10px] leading-none text-orange-400">
                {t('filter.halal_options.no_pork')}
              </span>
            )}
          </div>
        )}

        {isAdmin && onUpdateArea && (
          <div className="mb-2" onClick={(event) => event.stopPropagation()}>
            <select
              value={restaurant.area || ''}
              onChange={(event) => onUpdateArea(restaurant.id, event.target.value)}
              className="w-full rounded border border-gray-600 bg-[#333] p-1 text-xs text-white focus:border-white focus:outline-none"
            >
              <option value="">Select Area...</option>
              {AVAILABLE_AREAS.map((area) => (
                <option key={area} value={area}>{t(`areas.${area}`, area)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-gray-800/50 pt-2">
          {restaurant.subStalls && Array.isArray(restaurant.subStalls) && restaurant.subStalls.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {restaurant.subStalls.slice(0, 2).map((stall, index) => {
                if (!stall) {
                  return null;
                }

                const displayName = typeof stall === 'object' ? stall.name : stall;
                if (!displayName) {
                  return null;
                }

                return (
                  <span key={index} className="rounded border border-gray-800 bg-[#252525] px-1.5 py-0.5 text-[10px] leading-none text-gray-400">
                    {displayName}
                  </span>
                );
              })}
              {restaurant.subStalls.length > 2 && (
                <span className="self-center text-[10px] text-gray-500">+{restaurant.subStalls.length - 2}</span>
              )}
            </div>
          )}

          {restaurant.branches && Array.isArray(restaurant.branches) && restaurant.branches.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              {restaurant.branches.slice(0, 2).map((branch, index) => (
                <div key={index} className="flex items-start gap-1 text-[10px] text-gray-400">
                  <MapPin size={10} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{branch.name}</span>
                </div>
              ))}
              {restaurant.branches.length > 2 && (
                <span className="ml-3.5 text-[10px] text-gray-500">+{restaurant.branches.length - 2} more branches</span>
              )}
            </div>
          )}

          <div className="flex items-start text-xs text-gray-400">
            <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0 opacity-70" />
            <span className="line-clamp-2 leading-tight">{restaurant.address}</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[11px] font-bold text-white">
                <HeartHandshake size={12} className="text-rose-300" />
                为它助力
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {isSupportCoolingDown ? '刚刚助力成功' : '扣 10 积分'}
              </p>
            </div>

            <button
              type="button"
              disabled={isSupportDisabled}
              onClick={(event) => {
                event.stopPropagation();
                onSupport?.(restaurant);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSupporting ? <Loader2 size={12} className="animate-spin" /> : null}
              <span>
                {isSupporting ? '助力中...' : isSupportCoolingDown ? '稍等一下' : '为它助力'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantList;
