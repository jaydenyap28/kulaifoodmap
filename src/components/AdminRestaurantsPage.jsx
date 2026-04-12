import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Save, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './toast/ToastProvider';
import { getAdminRestaurants, updateAdminRestaurant } from '../services/adminRestaurantService';

const EMPTY_EDITING_ROW = {
  is_featured: false,
  is_active: true,
  is_hidden: false,
  sort_priority: 0,
  badge_label: '',
  ad_label: '',
};

const AdminRestaurantsPage = ({ onRestaurantsSaved }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingIds, setSavingIds] = useState({});

  useEffect(() => {
    let active = true;

    const loadRestaurants = async () => {
      try {
        const data = await getAdminRestaurants();
        if (active) {
          setRestaurants(data);
        }
      } catch (error) {
        console.error('Failed to load admin restaurants', error);
        if (active) {
          toast.error(error.message || '商家后台数据读取失败，请稍后再试。');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRestaurants();
    return () => {
      active = false;
    };
  }, [toast]);

  const visibleRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return restaurants;
    }

    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.address, restaurant.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [restaurants, searchTerm]);

  const updateLocalRestaurant = (restaurantId, patch) => {
    setRestaurants((currentRestaurants) =>
      currentRestaurants.map((restaurant) => (
        restaurant.id === restaurantId ? { ...restaurant, ...patch } : restaurant
      ))
    );
  };

  const handleSave = async (restaurant) => {
    setSavingIds((current) => ({ ...current, [restaurant.id]: true }));

    try {
      const updatedRestaurant = await updateAdminRestaurant(restaurant.id, {
        is_featured: restaurant.is_featured,
        is_active: restaurant.is_active,
        is_hidden: restaurant.is_hidden,
        sort_priority: Number.isFinite(Number(restaurant.sort_priority)) ? Number(restaurant.sort_priority) : 0,
        badge_label: restaurant.badge_label?.trim() || null,
        ad_label: restaurant.ad_label?.trim() || null,
      });

      updateLocalRestaurant(restaurant.id, updatedRestaurant);
      onRestaurantsSaved?.();
      window.dispatchEvent(new CustomEvent('restaurants-refresh'));
      toast.success(`已保存 ${updatedRestaurant.name}。`);
    } catch (error) {
      console.error('Failed to save restaurant admin fields', error);
      toast.error(error.message || '商家设置保存失败，请稍后再试。');
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[restaurant.id];
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] px-4 py-8 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-20">
          <Loader2 size={22} className="mr-3 animate-spin text-white/70" />
          <span className="text-white/80">正在读取商家后台数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">Admin</p>
            <h1 className="mt-2 text-3xl font-black text-white">商家管理</h1>
            <p className="mt-2 text-sm text-white/60">这里先管推荐位、显示状态和卡片标签，不做复杂 CMS。</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索店名 / 地址 / 分类"
                className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-white/30"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              返回首页
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#181818] shadow-xl">
          <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(120px,1fr)_repeat(3,minmax(88px,0.8fr))_minmax(96px,0.8fr)_minmax(160px,1.2fr)_minmax(160px,1.2fr)_110px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            <span>商家</span>
            <span>热度</span>
            <span>推荐</span>
            <span>启用</span>
            <span>隐藏</span>
            <span>排序值</span>
            <span>Badge</span>
            <span>广告文案</span>
            <span>保存</span>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            {visibleRestaurants.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-white/55">没有找到匹配的商家。</div>
            ) : (
              visibleRestaurants.map((restaurant) => {
                const row = { ...EMPTY_EDITING_ROW, ...restaurant };
                const isSaving = Boolean(savingIds[restaurant.id]);

                return (
                  <div
                    key={restaurant.id}
                    className="grid grid-cols-[minmax(220px,2.2fr)_minmax(120px,1fr)_repeat(3,minmax(88px,0.8fr))_minmax(96px,0.8fr)_minmax(160px,1.2fr)_minmax(160px,1.2fr)_110px] gap-3 border-b border-white/5 px-4 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{row.name}</p>
                      <p className="mt-1 truncate text-xs text-white/45">{row.address || '未填写地址'}</p>
                    </div>

                    <div className="flex items-center text-white/75">{row.hot_score ?? 0}</div>

                    <label className="flex items-center justify-center">
                      <input type="checkbox" checked={Boolean(row.is_featured)} onChange={(event) => updateLocalRestaurant(row.id, { is_featured: event.target.checked })} className="h-4 w-4 rounded border-white/20 bg-transparent accent-white" />
                    </label>

                    <label className="flex items-center justify-center">
                      <input type="checkbox" checked={Boolean(row.is_active)} onChange={(event) => updateLocalRestaurant(row.id, { is_active: event.target.checked })} className="h-4 w-4 rounded border-white/20 bg-transparent accent-white" />
                    </label>

                    <label className="flex items-center justify-center">
                      <input type="checkbox" checked={Boolean(row.is_hidden)} onChange={(event) => updateLocalRestaurant(row.id, { is_hidden: event.target.checked })} className="h-4 w-4 rounded border-white/20 bg-transparent accent-white" />
                    </label>

                    <input type="number" value={row.sort_priority ?? 0} onChange={(event) => updateLocalRestaurant(row.id, { sort_priority: event.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30" />

                    <input type="text" value={row.badge_label || ''} onChange={(event) => updateLocalRestaurant(row.id, { badge_label: event.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30" placeholder="例如：本周推荐" />

                    <input type="text" value={row.ad_label || ''} onChange={(event) => updateLocalRestaurant(row.id, { ad_label: event.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30" placeholder="例如：合作推荐" />

                    <button type="button" onClick={() => handleSave(row)} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70">
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {isSaving ? '保存中' : '保存'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantsPage;
