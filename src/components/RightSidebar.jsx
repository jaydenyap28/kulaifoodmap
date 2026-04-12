import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSiteSettings } from '../services/siteSettingsService';
import { MessageCircle, X, Coffee, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RightSidebar = ({ onSupportClick }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCommunity, setShowCommunity] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const [settingsData, adsResponse] = await Promise.all([
          getSiteSettings().catch(() => null),
          supabase.from('global_ads').select('*').eq('position', 'sidebar').eq('is_active', true).order('id', { ascending: false })
        ]);
        
        if (settingsData) setSettings(settingsData);
        if (adsResponse.data) setAds(adsResponse.data);
        if (adsResponse.error) throw adsResponse.error;
      } catch (err) {
        console.error('Failed to fetch sidebar ads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [ads]);

  const currentAd = ads[currentIndex];

  return (
    <aside className="flex w-full flex-col gap-5">
      {/* 侧边栏广告模块 */}
      {!loading && ads.length > 0 && currentAd && (
        <AnimatePresence mode="wait">
          <motion.a
            key={currentAd.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            href={currentAd.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block w-full aspect-square overflow-hidden rounded-[20px] bg-[#1e1e1e] shadow-xl border border-white/10 transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-white/5"
          >
            <img
              src={currentAd.image_url}
              alt={currentAd.ad_name || 'Sidebar Ad'}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-3 right-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/80 shadow backdrop-blur-md border border-white/10">
              Ad <ExternalLink size={10} />
            </div>
            <div className="absolute bottom-4 left-4 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="flex items-center gap-2 text-sm font-bold text-white drop-shadow-md">
                查看详情
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                  <ChevronRight size={12} />
                </span>
              </span>
            </div>
            {ads.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-1.5">
                {ads.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-4' : 'bg-white/30 w-1.5'}`} />
                ))}
              </div>
            )}
          </motion.a>
        </AnimatePresence>
      )}

      {/* 加入社群模块 */}
      {showCommunity && (
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-600 to-green-800 p-5 shadow-lg border border-emerald-500/30">
          <button 
            onClick={() => setShowCommunity(false)}
            className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-inner">
              <MessageCircle size={22} className="fill-current" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white mb-1 drop-shadow-sm">加入古来吃货群!</h4>
              <p className="text-xs text-emerald-100/90 leading-tight mb-3">不定期搞活动送福利，还能一起拼桌约饭。</p>
              <a 
                href={settings?.whatsapp_link || "#"}
                onClick={(e) => {
                    if (!settings?.whatsapp_link) {
                      e.preventDefault();
                      alert('站长还未配置加群链接哦！');
                    }
                }}
                target={settings?.whatsapp_link ? "_blank" : undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-emerald-800 transition-transform hover:scale-105 shadow-sm active:scale-95"
              >
                马上加入 👉
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 支持站长模块 */}
      <div className="relative overflow-hidden rounded-[20px] bg-[#1e1e1e] p-5 shadow-lg border border-white/5 group hover:border-amber-500/30 transition-colors">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 blur-xl group-hover:scale-125 transition-transform duration-700" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg">
            <Coffee size={20} className="drop-shadow-sm" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white mb-1">请站长喝杯 Kopi ☕</h4>
            <p className="text-[11px] text-gray-400 leading-tight mb-3">网站好用？随心赞助一杯咖啡，支持服务器续费！</p>
            <button 
              onClick={onSupportClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-amber-500 border border-amber-500/30 transition-all hover:bg-amber-500/20 hover:text-white group-hover:bg-amber-500 group-hover:text-amber-950 group-hover:border-amber-500 shadow-sm"
            >
              打赏支持
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
