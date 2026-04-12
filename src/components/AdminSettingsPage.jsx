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
