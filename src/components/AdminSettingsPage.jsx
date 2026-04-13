import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './toast/ToastProvider';
import { DEFAULT_SITE_SETTINGS, getSiteSettings, saveSiteSettings } from '../services/siteSettingsService';

const AdminSettingsPage = ({ onSettingsSaved }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();
        if (active) {
          setForm(data);
        }
      } catch (error) {
        console.error('Failed to load site settings', error);
        if (active) {
          toast.error(error.message || '获取设置失败，请稍后再试。');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const savedSettings = await saveSiteSettings(form);
      setForm(savedSettings);
      onSettingsSaved?.(savedSettings);
      window.dispatchEvent(new CustomEvent('site-settings-refresh'));
      toast.success('首页设置已保存');
    } catch (error) {
      console.error('Failed to save site settings', error);
      toast.error(error.message || '保存设置失败，请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#121212] px-4 py-8 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-20">
          <Loader2 size={22} className="mr-3 animate-spin text-white/70" />
          <span className="text-white/80">正在读取首页设置...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] bg-[#121212] px-4 py-8 text-white max-w-5xl mx-auto w-full">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-black text-white">首页设置后台</h1>
            <p className="mt-2 text-sm text-white/60">可在这里配置首页的宣传图片与网站标语</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-xl w-full">
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">Hero 宣传图 URL (建议 16:9 横图)</span>
              <input
                type="text"
                value={form.hero_bg_url || ''}
                onChange={(event) => handleChange('hero_bg_url', event.target.value)}
                className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                placeholder="https://网站图片链接.jpg"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">主标题 (Hero Title)</span>
              <input
                type="text"
                value={form.hero_title || ''}
                onChange={(event) => handleChange('hero_title', event.target.value)}
                className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                placeholder="古来美食地图"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">副标题 (Hero Subtitle)</span>
              <input
                type="text"
                value={form.hero_subtitle || ''}
                onChange={(event) => handleChange('hero_subtitle', event.target.value)}
                className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                placeholder="Kulai Food Map"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-white/80">展示首页 Hero 转盘版块</p>
                <p className="mt-1 text-xs text-white/50">若关闭，首页顶部将直接显示所有商家列表</p>
              </div>

              <input 
                type="checkbox"
                checked={form.hero_enabled !== false}
                onChange={(e) => handleChange('hero_enabled', e.target.checked)}
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
              />
            </label>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* 加入社群模块 */}
              <div className={`p-6 rounded-3xl border transition-all ${form.community_enabled !== false ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-gray-800 bg-[#181818] opacity-70'}`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">📱 加入社群组件</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-gray-400">{form.community_enabled !== false ? '开启中' : '已停用'}</span>
                      <input 
                          type="checkbox" 
                          checked={form.community_enabled !== false}
                          onChange={e => handleChange('community_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                </div>
                
                <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">标题 (Title)</label>
                      <input 
                        value={form.community_title || ''} 
                        onChange={e => handleChange('community_title', e.target.value)}
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="例如: 加入古来吃货群!"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">宣传短语 (Description)</label>
                      <textarea 
                        value={form.community_desc || ''} 
                        onChange={e => handleChange('community_desc', e.target.value)}
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                        placeholder="例如: 不定期搞活动..."
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">WhatsApp 邀请链接 (Target URL)</label>
                      <input 
                        value={form.whatsapp_link || ''} 
                        onChange={e => handleChange('whatsapp_link', e.target.value)}
                        className="w-full bg-[#121212] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="https://chat.whatsapp.com/..."
                      />
                  </div>
                </div>
              </div>

              {/* 打赏站长模块 */}
              <div className={`p-6 rounded-3xl border transition-all ${form.support_enabled !== false ? 'border-amber-500/30 bg-amber-900/10' : 'border-gray-800 bg-[#181818] opacity-70'}`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">☕ 打赏站长组件</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-gray-400">{form.support_enabled !== false ? '开启中' : '已停用'}</span>
                      <input 
                          type="checkbox" 
                          checked={form.support_enabled !== false}
                          onChange={e => handleChange('support_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>
                </div>
                
                <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">标题 (Title)</label>
                      <input 
                        value={form.support_title || ''} 
                        onChange={e => handleChange('support_title', e.target.value)}
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="例如: 请站长喝杯 Kopi"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">感谢短语 (Description)</label>
                      <textarea 
                        value={form.support_desc || ''} 
                        onChange={e => handleChange('support_desc', e.target.value)}
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 min-h-[80px]"
                        placeholder="例如: 支持服务器续费..."
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">TNG 二维码图床链接 (Image URL)</label>
                      <input 
                        value={form.tng_qr_url || ''} 
                        onChange={e => handleChange('tng_qr_url', e.target.value)}
                        className="w-full bg-[#121212] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="https://i.ibb.co/..."
                      />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
