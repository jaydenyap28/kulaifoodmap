import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Plus, Edit2, Trash2, Save, X, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from './toast/ToastProvider';
import { getSiteSettings, saveSiteSettings } from '../services/siteSettingsService';

const AdminAdsPage = () => {
  const toast = useToast();
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingAd, setEditingAd] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings
  const [settingsForm, setSettingsForm] = useState({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // default new ad blueprint
  const defaultAd = {
    ad_name: '',
    image_url: '',
    target_url: '',
    position: 'under_wheel',
    is_active: true
  };

  const fetchAdsAndSettings = async () => {
    setIsLoading(true);
    setIsSettingsLoading(true);
    try {
      const [settingsData, adsData] = await Promise.all([
        getSiteSettings(),
        supabase.from('global_ads').select('*').order('id', { ascending: false })
      ]);
      setSettingsForm(settingsData || {});
      setAds(adsData.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('获取数据失败');
    } finally {
      setIsLoading(false);
      setIsSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsAndSettings();
  }, [toast]);

  const handleSettingsChange = (field, value) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsConfigSaving(true);
    try {
      const updated = await saveSiteSettings(settingsForm);
      setSettingsForm(updated);
      toast.success('原生模块配置已保存');
      window.dispatchEvent(new CustomEvent('site-settings-refresh'));
    } catch (err) {
      console.error(err);
      toast.error('保存配置失败');
    } finally {
      setIsConfigSaving(false);
    }
  };

  const handleOpenEdit = (ad = null) => {
    setEditingAd(ad ? { ...ad } : { ...defaultAd });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
  };

  const handleSaveAd = async () => {
    if (!editingAd.ad_name || !editingAd.image_url || !editingAd.target_url) {
      toast.error('请填写完整的广告信息');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAd.id) {
        // Update existing
        const { error } = await supabase
          .from('global_ads')
          .update({
             ad_name: editingAd.ad_name,
             image_url: editingAd.image_url,
             target_url: editingAd.target_url,
             position: editingAd.position,
             is_active: editingAd.is_active
          })
          .eq('id', editingAd.id);
          
        if (error) throw error;
        toast.success('广告已更新');
      } else {
        // Insert new
        const { error } = await supabase
          .from('global_ads')
          .insert([{
             ad_name: editingAd.ad_name,
             image_url: editingAd.image_url,
             target_url: editingAd.target_url,
             position: editingAd.position,
             is_active: editingAd.is_active
          }]);
          
        if (error) throw error;
        toast.success('成功新增广告');
      }
      
      handleCloseModal();
      fetchAdsAndSettings(); // reload list
    } catch (err) {
      console.error('Failed to save ad:', err);
      toast.error('保存失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAd = async (id, adName) => {
    if (!window.confirm(`确定要删除广告 "${adName}" 吗？该操作不可恢复。`)) return;
    
    try {
      const { error } = await supabase
        .from('global_ads')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success('已删除');
      fetchAdsAndSettings();
    } catch (err) {
      console.error('Failed to delete ad:', err);
      toast.error('删除失败');
    }
  };

  const toggleAdActive = async (ad) => {
    try {
      const { error } = await supabase
        .from('global_ads')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);
        
      if (error) throw error;
      toast.success(ad.is_active ? '广告已停用' : '广告已启用');
      fetchAdsAndSettings();
    } catch (err) {
      console.error('Toggle failed:', err);
      toast.error('操作失败');
    }
  };

  if (isLoading && ads.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={30} className="animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 text-white max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            📢 广告横幅管理
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            在这里统一设置大转盘下方的全局广告。
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={fetchAdsAndSettings}
             className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2 text-sm font-semibold text-gray-300"
           >
             <RefreshCw size={16} /> 刷新
           </button>
           <button 
             onClick={() => handleOpenEdit()}
             className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-400/50 transition-colors flex items-center gap-2 text-sm font-semibold text-white shadow-lg"
           >
             <Plus size={16} /> 新建广告
           </button>
        </div>
      </div>

      <div className="grid gap-4">
        {ads.length === 0 ? (
           <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-4xl block mb-2">🪧</span>
              <p className="text-gray-400">目前还没有设置任何广告</p>
           </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className={`flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-white/10 ${ad.is_active ? 'bg-white/5' : 'bg-black/40 opacity-70'} transition-all`}>
               {/* 预览图 */}
               <div className="w-full md:w-64 aspect-[3/1] bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/5 relative group">
                  <img src={ad.image_url} alt={ad.ad_name} className="w-full h-full object-cover" />
                  {!ad.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                       <span className="bg-red-500/80 px-2 py-1 rounded text-[10px] font-bold text-white border border-red-400">已停用</span>
                    </div>
                  )}
                  {ad.position && (
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 border border-white/10 uppercase">
                       {ad.position}
                    </span>
                  )}
               </div>

               {/* 信息区域 */}
               <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-bold text-lg text-white mb-1 truncate">{ad.ad_name}</h3>
                  <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate flex items-center gap-1 mb-3">
                     <ExternalLink size={12} /> {ad.target_url}
                  </a>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                     <button
                       onClick={() => toggleAdActive(ad)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${ad.is_active ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'}`}
                     >
                        {ad.is_active ? '停用轮播' : '启用轮播'}
                     </button>
                     <button
                       onClick={() => handleOpenEdit(ad)}
                       className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 border border-white/10 transition-colors flex items-center gap-1"
                     >
                        <Edit2 size={12} /> 编辑
                     </button>
                     <button
                       onClick={() => handleDeleteAd(ad.id, ad.ad_name)}
                       className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors flex items-center gap-1 ml-auto"
                     >
                        <Trash2 size={12} /> 删除
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* 侧边弹出编辑/新增窗口 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}>
           <div className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl border border-gray-700 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-white">{editingAd.id ? '编辑广告' : '新建广告'}</h3>
                 <button onClick={handleCloseModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                    <X size={18} />
                 </button>
              </div>

              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">广告名称或备注 (Ad Name)</label>
                    <input 
                       value={editingAd.ad_name} 
                       onChange={e => setEditingAd({...editingAd, ad_name: e.target.value})}
                       className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                       placeholder="e.g. 首页_InvolveAsia推广"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">展示位置 (Position)</label>
                    <select 
                       value={editingAd.position} 
                       onChange={e => setEditingAd({...editingAd, position: e.target.value})}
                       className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                       <option value="above_wheel">above_wheel (大转盘上方)</option>
                       <option value="under_wheel">under_wheel (大转盘下方)</option>
                       <option value="sidebar">sidebar (侧边栏)</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">横幅图片链接 (Image URL)</label>
                    <input 
                       value={editingAd.image_url} 
                       onChange={e => setEditingAd({...editingAd, image_url: e.target.value})}
                       className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                       placeholder="https://..."
                    />
                    {editingAd.image_url && (
                        <div className="mt-2 text-[10px] text-gray-500">
                           预览图：
                           <div className="w-full h-20 bg-black mt-1 rounded-lg border border-gray-800 overflow-hidden relative">
                              <img src={editingAd.image_url} alt="预览失败" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += '<span class="text-red-400 absolute inset-0 flex items-center justify-center p-2 text-center leading-tight">图片连接无效或无法预览</span>' }} />
                           </div>
                        </div>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">跳转地址 (Target Link)</label>
                    <input 
                       value={editingAd.target_url} 
                       onChange={e => setEditingAd({...editingAd, target_url: e.target.value})}
                       className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                       placeholder="点击图片时跳去哪？(例如 Shopee/Involve Asia link)"
                    />
                 </div>

                 <div className="flex items-center gap-2 pt-2">
                    <input 
                       type="checkbox" 
                       id="ad-active-checkbox"
                       checked={editingAd.is_active}
                       onChange={e => setEditingAd({...editingAd, is_active: e.target.checked})}
                       className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
                    />
                    <label htmlFor="ad-active-checkbox" className="text-sm text-gray-300 font-medium select-none cursor-pointer">
                       上线激活此广告（轮播显示）
                    </label>
                 </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3 bg-[#181818]">
                 <button 
                   onClick={handleCloseModal}
                   className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSaveAd}
                   disabled={isSaving}
                   className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {isSaving ? '保存中...' : '保存更改'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 原生侧边栏组件配置 */}
      <div className="mt-16 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            🧩 原生侧边栏组件与模块配置
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            除图片广告外，您还可以在此管理侧边栏的专属原生组件（如群链接与赞助模块）。
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleSaveSettings}
             disabled={isConfigSaving || isSettingsLoading}
             className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-400/50 transition-all flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg disabled:opacity-50 min-w-[120px]"
           >
             {isConfigSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
             {isConfigSaving ? '配置保存中...' : '保存模块配置'}
           </button>
        </div>
      </div>

      {isSettingsLoading ? (
         <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-white/50" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 加入社群模块 */}
          <div className={`p-6 rounded-3xl border transition-all ${settingsForm.community_enabled ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-gray-800 bg-[#181818] opacity-70'}`}>
             <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">📱 加入社群组件</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                   <span className="text-xs font-semibold text-gray-400">{settingsForm.community_enabled ? '开启中' : '已停用'}</span>
                   <input 
                      type="checkbox" 
                      checked={settingsForm.community_enabled !== false}
                      onChange={e => handleSettingsChange('community_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                   />
                </label>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">标题 (Title)</label>
                  <input 
                     value={settingsForm.community_title || ''} 
                     onChange={e => handleSettingsChange('community_title', e.target.value)}
                     className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                     placeholder="例如: 加入古来吃货群!"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">宣传短语 (Description)</label>
                  <textarea 
                     value={settingsForm.community_desc || ''} 
                     onChange={e => handleSettingsChange('community_desc', e.target.value)}
                     className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                     placeholder="例如: 不定期搞活动..."
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">WhatsApp 邀请链接 (Target URL)</label>
                  <input 
                     value={settingsForm.whatsapp_link || ''} 
                     onChange={e => handleSettingsChange('whatsapp_link', e.target.value)}
                     className="w-full bg-[#121212] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                     placeholder="https://chat.whatsapp.com/..."
                  />
               </div>
             </div>
          </div>

          {/* 打赏站长模块 */}
          <div className={`p-6 rounded-3xl border transition-all ${settingsForm.support_enabled ? 'border-amber-500/30 bg-amber-900/10' : 'border-gray-800 bg-[#181818] opacity-70'}`}>
             <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">☕ 打赏站长组件</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                   <span className="text-xs font-semibold text-gray-400">{settingsForm.support_enabled ? '开启中' : '已停用'}</span>
                   <input 
                      type="checkbox" 
                      checked={settingsForm.support_enabled !== false}
                      onChange={e => handleSettingsChange('support_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                   />
                </label>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">标题 (Title)</label>
                  <input 
                     value={settingsForm.support_title || ''} 
                     onChange={e => handleSettingsChange('support_title', e.target.value)}
                     className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                     placeholder="例如: 请站长喝杯 Kopi"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">感谢短语 (Description)</label>
                  <textarea 
                     value={settingsForm.support_desc || ''} 
                     onChange={e => handleSettingsChange('support_desc', e.target.value)}
                     className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 min-h-[80px]"
                     placeholder="例如: 支持服务器续费..."
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">TNG 二维码图床链接 (Image URL)</label>
                  <input 
                     value={settingsForm.tng_qr_url || ''} 
                     onChange={e => handleSettingsChange('tng_qr_url', e.target.value)}
                     className="w-full bg-[#121212] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                     placeholder="https://i.ibb.co/..."
                  />
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdsPage;
