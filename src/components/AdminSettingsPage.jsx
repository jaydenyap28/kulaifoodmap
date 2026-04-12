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
          toast.error(error.message || '首页设置读取失败，请稍后再试。');
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
      toast.success('首页设置已保存。');
    } catch (error) {
      console.error('Failed to save site settings', error);
      toast.error(error.message || '首页设置保存失败，请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] px-4 py-8 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-20">
          <Loader2 size={22} className="mr-3 animate-spin text-white/70" />
          <span className="text-white/80">正在读取首页设置...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">Admin</p>
            <h1 className="mt-2 text-3xl font-black text-white">首页设置</h1>
            <p className="mt-2 text-sm text-white/60">先把首页最核心的 Hero 文案和背景图交给后台管理。</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            返回首页
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-xl">
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">Hero 背景图 URL</span>
              <input
                type="text"
                value={form.hero_bg_url || ''}
                onChange={(event) => handleChange('hero_bg_url', event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                placeholder="https://example.com/hero.jpg"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">Hero 主标题</span>
              <input
                type="text"
                value={form.hero_title || ''}
                onChange={(event) => handleChange('hero_title', event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                placeholder="古来美食地图"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">Hero 副标题</span>
              <input
                type="text"
                value={form.hero_subtitle || ''}
                onChange={(event) => handleChange('hero_subtitle', event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                placeholder="Kulai Food Map"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white/80">启用首页 Hero</p>
                <p className="mt-1 text-xs text-white/50">关闭后，首页仍保留头部和筛选，但不展示 Hero 背景与抽卡区。</p>
              </div>

              <button
                type="button"
                onClick={() => handleChange('hero_enabled', !form.hero_enabled)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${form.hero_enabled ? 'bg-emerald-500' : 'bg-white/15'}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white transition ${form.hero_enabled ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? '保存中...' : '保存首页设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
