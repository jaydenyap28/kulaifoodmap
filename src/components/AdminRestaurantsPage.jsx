import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search, Store, Edit, ArrowDown, ArrowUp } from 'lucide-react';
import { useToast } from './toast/ToastProvider';
import { getAdminRestaurants, updateAdminRestaurant, createAdminRestaurant } from '../services/adminRestaurantService';
import AdminRestaurantEditModal from './AdminRestaurantEditModal';
import { AVAILABLE_AREAS } from '../data/constants';

const EMPTY_EDITING_ROW = {
  is_featured: false,
  is_active: true,
  is_hidden: false,
  sort_priority: 0,
  badge_label: '',
  ad_label: '',
};

const DB_COLUMNS = [
  'id', 'source_restaurant_id', 'name', 'category', 'address', 'image_url',
  'hot_score', 'is_featured', 'is_active', 'is_hidden', 'sort_priority',
  'badge_label', 'ad_label', 'affiliate_url', 'updated_at'
];

const AdminRestaurantsPage = ({ onRestaurantsSaved }) => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingIds, setSavingIds] = useState({});
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Customization & Sort State
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

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
  }, []);

  const visibleRestaurants = useMemo(() => {
    let filtered = restaurants;
    
    // Filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((r) =>
        [r.name, r.name_en, r.address, r.category, r.area]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
      );
    }

    // Sort
    const sortableItems = [...filtered];
    if (sortKey) {
      sortableItems.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
        // Handle nulls and cases
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return sortableItems;
  }, [restaurants, searchTerm, sortKey, sortDir]);

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
        await fetchRestaurantsList();
        toast.success('新商家创建成功！');
      } else {
        const updatedObj = await updateAdminRestaurant(id, updatedFields);
        updateLocalRestaurant(id, updatedObj);
        await fetchRestaurantsList(); 
        toast.success('商家详细资料已更新！');
      }
      onRestaurantsSaved?.();
    } catch (error) {
      console.error('Failed to save core restaurant fields', error);
      toast.error(error.message || '保存失败！');
      throw error;
    }
  };

  const handleSave = async (restaurant) => {
    setSavingIds((current) => ({ ...current, [restaurant.id]: true }));

    try {
      const payload = {
        is_featured: restaurant.is_featured,
        is_active: restaurant.is_active,
        is_hidden: restaurant.is_hidden,
        sort_priority: Number.isFinite(Number(restaurant.sort_priority)) ? Number(restaurant.sort_priority) : 0,
        badge_label: restaurant.badge_label?.trim() || null,
        ad_label: restaurant.ad_label?.trim() || null,
        category: restaurant.category,
        name: restaurant.name,
      };

      const extra_details = {};
      for (const key in restaurant) {
          if (!DB_COLUMNS.includes(key) && key !== 'name_en' && key !== 'area' && key !== 'delivery_link') {
              extra_details[key] = restaurant[key];
          }
      }
      
      extra_details.name_en = restaurant.name_en;
      extra_details.area = restaurant.area;
      extra_details.delivery_link = restaurant.delivery_link;

      payload.extra_details = extra_details;

      const updatedRestaurant = await updateAdminRestaurant(restaurant.id, payload);

      updateLocalRestaurant(restaurant.id, updatedRestaurant);
      onRestaurantsSaved?.();
      toast.success(`更新成功: ${updatedRestaurant.name}`);
    } catch (error) {
      console.error('Failed to save restaurant', error);
      toast.error(error.message || '保存失败，请检查填写内容。');
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
    <div className="px-4 py-8 text-white max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col gap-5 bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Store size={22} className="text-cyan-400" /> 商家推广与数据管理
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  卡片式快捷修改。修改完成后，记得点击该商家卡片右侧的 <span className="text-green-400 font-bold">保存</span> 按钮。
                </p>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={fetchRestaurantsList} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none transition hover:bg-white/10 text-white font-bold">
                   刷新数据
                 </button>
                 <button onClick={handleOpenCreateModal} className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-orange-500">
                   + 添加新商家
                 </button>
              </div>
          </div>

          <div className="h-px w-full bg-white/10"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative w-full lg:max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索商家 / 地区 / 分类..."
                    className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-500 shadow-inner"
                  />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto bg-black/40 border border-white/10 rounded-full px-4 py-2">
                  <span className="text-sm font-bold text-gray-400 shrink-0">排序条件:</span>
                  <select 
                      value={sortKey} 
                      onChange={(e) => setSortKey(e.target.value)}
                      className="bg-transparent text-sm text-white outline-none cursor-pointer border-r border-white/10 pr-2 mr-1"
                  >
                      <option value="id" className="bg-gray-800">最新收录 (ID)</option>
                      <option value="name" className="bg-gray-800">中文名称</option>
                      <option value="category" className="bg-gray-800">分类</option>
                      <option value="area" className="bg-gray-800">地区</option>
                      <option value="hot_score" className="bg-gray-800">热度值</option>
                      <option value="sort_priority" className="bg-gray-800">置顶顺位</option>
                  </select>
                  <button 
                      onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} 
                      className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition font-bold outline-none"
                  >
                      {sortDir === 'desc' ? <><ArrowDown size={14}/> 降序</> : <><ArrowUp size={14}/> 升序</>}
                  </button>
              </div>
          </div>
        </div>

        {/* List Body */}
        <div className="flex flex-col gap-4">
            {visibleRestaurants.length === 0 ? (
              <div className="px-6 py-20 text-center text-sm text-gray-500 bg-[#1e1e1e] rounded-2xl border border-white/10">
                <span className="text-4xl block mb-3 text-cyan-900/50">🛒</span>
                未找到匹配的商家数据。
              </div>
            ) : (
              visibleRestaurants.map((restaurant) => {
                const row = { ...EMPTY_EDITING_ROW, ...restaurant };
                const isSaving = Boolean(savingIds[restaurant.id]);

                return (
                  <div
                    key={restaurant.id}
                    className="flex flex-col xl:flex-row xl:items-start gap-4 p-5 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-lg hover:border-cyan-500/30 transition-all duration-300"
                  >
                     {/* 1. Image & Quick Stats */}
                     <div className="flex items-center gap-4 shrink-0 w-full xl:w-48">
                        <div className="relative h-[84px] w-[84px] shrink-0 rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner">
                           <img src={row.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover opacity-90" alt="" />
                        </div>
                        <div className="flex flex-col gap-2 p-1">
                            <span className="flex items-center gap-1.5 text-xs text-orange-400 font-bold bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded-md w-fit">
                                🔥热度: {row.hot_score ?? 0}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold bg-cyan-400/10 border border-cyan-400/20 pl-2 pr-1 py-1 rounded-md w-fit">
                                 顺位:<input type="number" value={row.sort_priority ?? 0} onChange={e => updateLocalRestaurant(row.id, { sort_priority: e.target.value })} className="w-10 bg-transparent outline-none text-center h-4 font-mono text-cyan-100" />
                            </div>
                        </div>
                     </div>

                     {/* 2. Core Infos: Name & EN Name */}
                     <div className="flex flex-col gap-3 shrink-0 w-full xl:w-60">
                        <div className="flex flex-col">
                           <label className="text-[11px] text-gray-500 font-bold uppercase mb-1 flex justify-between items-center">
                              商户中文名 <span className="text-orange-500">*</span>
                           </label>
                           <input type="text" value={row.name || ''} onChange={e => updateLocalRestaurant(row.id, { name: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-base font-bold text-white focus:border-cyan-500/50 focus:bg-black/60 outline-none transition-colors" placeholder="输入中文店名" />
                        </div>
                        <div className="flex flex-col">
                           <label className="text-[11px] text-gray-500 font-bold uppercase mb-1">
                               English Name (选填)
                           </label>
                           <input type="text" value={row.name_en || ''} onChange={e => updateLocalRestaurant(row.id, { name_en: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-cyan-500/50 focus:bg-black/60 outline-none transition-colors" placeholder="e.g. Kulai Cafe" />
                        </div>
                     </div>

                     {/* 3. Taxonomies: Category & Area */}
                     <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
                        <div className="flex flex-col sm:flex-row gap-3">
                           <div className="flex flex-col flex-1">
                               <label className="text-[11px] text-gray-500 font-bold uppercase mb-1">主分类</label>
                               <input type="text" value={row.category || ''} onChange={e => updateLocalRestaurant(row.id, { category: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:bg-black/60 outline-none transition-colors" placeholder="如: 中餐, 火锅" />
                           </div>
                           <div className="flex flex-col flex-1">
                               <label className="text-[11px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">地区分区 <span className="text-orange-500">📍</span></label>
                               <select value={row.area || ''} onChange={e => updateLocalRestaurant(row.id, { area: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm text-amber-200 focus:border-cyan-500/50 focus:bg-black/60 outline-none h-[38px] cursor-pointer">
                                   <option value="" className="bg-gray-800 text-gray-400">未分类 (不显示于该区)</option>
                                   {AVAILABLE_AREAS.map(a => <option key={a} value={a} className="bg-gray-800">{a}</option>)}
                               </select>
                           </div>
                        </div>
                        <div className="flex flex-col">
                           <label className="text-[11px] text-gray-500 font-bold uppercase mb-1">外卖 / 详情引流链接 (Shopee / FB 等)</label>
                           <input type="text" value={row.delivery_link || ''} onChange={e => updateLocalRestaurant(row.id, { delivery_link: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-blue-300 focus:border-cyan-500/50 focus:bg-black/60 outline-none transition-colors font-mono" placeholder="https://" />
                        </div>
                     </div>

                     {/* 4. Actions & Toggles */}
                     <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between gap-5 shrink-0 xl:w-36 h-full xl:py-1">
                          <div className="flex xl:flex-col gap-4 items-center xl:items-end w-full">
                              <label className="flex items-center gap-2.5 cursor-pointer user-select-none group">
                                  <div className="relative">
                                      <input type="checkbox" checked={Boolean(row.is_featured)} onChange={e => updateLocalRestaurant(row.id, { is_featured: e.target.checked })} className="sr-only" />
                                      <div className={`block w-10 h-6 pl-1 pt-1 rounded-full border border-black transition-colors ${row.is_featured ? 'bg-orange-500' : 'bg-gray-700'}`}>
                                           <div className={`w-4 h-4 rounded-full bg-white transition-transform ${row.is_featured ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                      </div>
                                  </div>
                                  <span className={`text-sm tracking-wide ${row.is_featured ? 'text-orange-400 font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>重磅置顶</span>
                              </label>

                              <label className="flex items-center gap-2.5 cursor-pointer user-select-none group">
                                  <div className="relative">
                                      <input type="checkbox" checked={Boolean(row.is_active)} onChange={e => updateLocalRestaurant(row.id, { is_active: e.target.checked })} className="sr-only" />
                                      <div className={`block w-10 h-6 pl-1 pt-1 rounded-full border border-black transition-colors ${row.is_active ? 'bg-green-500' : 'bg-gray-700'}`}>
                                           <div className={`w-4 h-4 rounded-full bg-white transition-transform ${row.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                      </div>
                                  </div>
                                  <span className={`text-sm tracking-wide ${row.is_active ? 'text-green-400 font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>对外呈现</span>
                              </label>
                          </div>

                          <div className="flex xl:flex-col gap-2 w-full mt-auto">
                              <button onClick={() => handleOpenEditModal(row)} className="flex items-center justify-center gap-1.5 w-full bg-[#2a2a2a] text-gray-300 px-3 py-2 rounded-lg text-sm font-bold border border-white/10 hover:bg-white/10 transition">
                                <Edit size={14} />详细表单
                              </button>
                              <button onClick={() => handleSave(row)} disabled={isSaving} className="flex items-center justify-center gap-1.5 w-full bg-cyan-600/90 text-white px-3 py-2 rounded-lg text-sm font-bold border border-cyan-500/50 hover:bg-cyan-500 transition shadow-[0_0_15px_rgba(34,211,238,0.15)] disabled:opacity-50">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}保存修改
                              </button>
                          </div>
                     </div>
                  </div>
                );
              })
            )}
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
