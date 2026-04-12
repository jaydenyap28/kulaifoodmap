import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search, Store, Edit } from 'lucide-react';
import { useToast } from './toast/ToastProvider';
import { getAdminRestaurants, updateAdminRestaurant, createAdminRestaurant } from '../services/adminRestaurantService';
import AdminRestaurantEditModal from './AdminRestaurantEditModal';

const EMPTY_EDITING_ROW = {
  is_featured: false,
  is_active: true,
  is_hidden: false,
  sort_priority: 0,
  badge_label: '',
  ad_label: '',
};

const AdminRestaurantsPage = ({ onRestaurantsSaved }) => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingIds, setSavingIds] = useState({});
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRestaurantsList = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to load admin restaurants', error);
      toast.error(error.message || '获取商家列表失败，请确认您已运行 SQL 更新!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantsList();
  }, [toast]);

  const visibleRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return restaurants;
    }

    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.name_en, restaurant.address, restaurant.category]
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

  const handleOpenCreateModal = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (id, updatedFields, isCreating) => {
    try {
      if (isCreating) {
        await createAdminRestaurant(updatedFields);
        await fetchRestaurantsList(); // Refresh full list
        toast.success('新商家创建成功！');
      } else {
        const updatedObj = await updateAdminRestaurant(id, updatedFields);
        updateLocalRestaurant(id, updatedObj);
        toast.success('商家核心资料已更新！');
      }
      onRestaurantsSaved?.();
      window.dispatchEvent(new CustomEvent('restaurants-refresh'));
    } catch (error) {
      console.error('Failed to save core restaurant fields', error);
      toast.error(error.message || '保存失败！');
      throw error;
    }
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
      toast.success(`成功更新: ${updatedRestaurant.name}`);
    } catch (error) {
      console.error('Failed to save restaurant admin fields', error);
      toast.error(error.message || '保存失败！请确保您的账号权限正常，且数据库配置正确。');
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
      <div className="min-h-[50vh] flex items-center justify-center bg-[#121212] px-4 py-8 text-white">
        <div className="mx-auto flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-20 px-10">
          <Loader2 size={30} className="mb-3 animate-spin text-orange-500" />
          <span className="text-white/80 font-bold">正在拉取全套商家数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 text-white max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Store size={22} className="text-cyan-400" /> 商家推广排版
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              您可以拖动设置列表顺序，或给特定商家增加引流和重点推荐标记功能。
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button
               onClick={handleOpenCreateModal}
               className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-500"
             >
               + 添加入驻商家
             </button>
             <button
               onClick={fetchRestaurantsList}
               className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition hover:bg-white/10"
             >
               重新刷新
             </button>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索商家名字/地址..."
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-xl">
          <div className="grid grid-cols-[1fr_50px_60px_60px_60px_80px_100px_120px_140px] gap-2 border-b border-gray-700 bg-black/40 px-4 py-3 text-xs font-bold text-gray-400">
            <span>商家名称 (Name)</span>
            <span className="text-center">热度</span>
            <span className="text-center text-orange-400" title="在首页顶部加冕">精选</span>
            <span className="text-center text-green-400" title="对外展示开启">营业</span>
            <span className="text-center text-red-500" title="在前端不可见">隐藏</span>
            <span className="text-center" title="数字越低排越前面">排序(0最前)</span>
            <span>特殊小牌匾</span>
            <span>广告推流文字</span>
            <span className="text-right">操作</span>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {visibleRestaurants.length === 0 ? (
              <div className="px-6 py-20 text-center text-sm text-gray-500 bg-[#121212]">
                <span className="text-4xl block mb-2">🍽️</span>
                您的数据库目前没有获取到任何商家。<br/>若一直如此，可能是 RLS 权限，或者没有运行之前的 SQL 升级导致接口报错为空。 
              </div>
            ) : (
              visibleRestaurants.map((restaurant) => {
                const row = { ...EMPTY_EDITING_ROW, ...restaurant };
                const isSaving = Boolean(savingIds[restaurant.id]);

                return (
                  <div
                    key={restaurant.id}
                    className="grid grid-cols-[1fr_50px_60px_60px_60px_80px_100px_120px_140px] items-center gap-2 border-b border-gray-800 hover:bg-white/5 transition-colors px-4 py-3 text-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold text-white">{row.name}</p>
                      {row.name_en && (
                        <p className="truncate text-xs text-gray-400">{row.name_en}</p>
                      )}
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">{row.category || '暂无分类'}</p>
                    </div>

                    <div className="flex justify-center text-orange-300 font-mono text-xs">{row.hot_score ?? 0}</div>

                    <label className="flex items-center justify-center cursor-pointer">
                      <input type="checkbox" checked={Boolean(row.is_featured)} onChange={(event) => updateLocalRestaurant(row.id, { is_featured: event.target.checked })} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500" />
                    </label>

                    <label className="flex items-center justify-center cursor-pointer">
                      <input type="checkbox" checked={Boolean(row.is_active)} onChange={(event) => updateLocalRestaurant(row.id, { is_active: event.target.checked })} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500" />
                    </label>

                    <label className="flex items-center justify-center cursor-pointer">
                      <input type="checkbox" checked={Boolean(row.is_hidden)} onChange={(event) => updateLocalRestaurant(row.id, { is_hidden: event.target.checked })} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500" />
                    </label>

                    <input type="number" value={row.sort_priority ?? 0} onChange={(event) => updateLocalRestaurant(row.id, { sort_priority: event.target.value })} className="w-full text-center rounded bg-[#121212] border border-gray-700 px-1 py-1.5 text-xs text-white outline-none focus:border-white/50" />

                    <input type="text" value={row.badge_label || ''} onChange={(event) => updateLocalRestaurant(row.id, { badge_label: event.target.value })} className="w-full rounded bg-[#121212] border border-gray-700 px-2 py-1.5 text-xs text-white outline-none focus:border-white/50" placeholder="e.g. VIP" />

                    <input type="text" value={row.ad_label || ''} onChange={(event) => updateLocalRestaurant(row.id, { ad_label: event.target.value })} className="w-full rounded bg-[#121212] border border-gray-700 px-2 py-1.5 text-xs text-white outline-none focus:border-white/50" placeholder="促销中" />

                    <div className="flex justify-end gap-1.5">
                       <button type="button" onClick={() => handleOpenEditModal(row)} className="flex h-8 px-2.5 items-center justify-center gap-1 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-xs font-bold text-blue-400 transition" title="高级编辑">
                         <Edit size={12} />编辑
                       </button>
                       <button type="button" onClick={() => handleSave(row)} disabled={isSaving} className="flex h-8 px-2.5 items-center justify-center gap-1 rounded bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-gray-600 text-xs font-bold text-gray-200 transition disabled:opacity-50">
                         {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                         保存
                       </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <AdminRestaurantEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurant={editingRestaurant}
        onSave={handleSaveModal}
      />
    </div>
  );
};

export default AdminRestaurantsPage;
