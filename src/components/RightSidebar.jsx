import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSiteSettings } from '../services/siteSettingsService';
import { MessageCircle, X, Coffee, ExternalLink, ChevronRight, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RightSidebar = ({ restaurants = [], onRestaurantClick, onSupportClick }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCommunity, setShowCommunity] = useState(true);

  // Derive hot rank Top 5
  const topRestaurants = [...restaurants]
    .filter(r => (r.hot_score || 0) > 0)
    .sort((a, b) => (b.hot_score || 0) - (a.hot_score || 0))
    .slice(0, 5);

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

  const getValidUrl = (url) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    // assume https if no protocol
    return `https://${trimmed}`;
  };

  const isCommunityEnabled = settings?.community_enabled !== false;
  const isSupportEnabled = settings?.support_enabled !== false;

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
            href={getValidUrl(currentAd.target_url)}
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

      {/* 排行榜的热推模块 */}
      {topRestaurants.length > 0 && (
        <div className="relative overflow-hidden rounded-[20px] bg-[#1a1a1a] p-5 shadow-lg border border-orange-500/10">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
             <Trophy size={18} className="text-orange-400" />
             <h4 className="text-base font-bold text-white">热推排行榜</h4>
          </div>
          
          <div className="flex flex-col gap-3">
             {topRestaurants.map((restaurant, index) => {
               // Design colors for top 3
               let rankStyles = "bg-white/5 text-gray-400 border-white/5";
               let rankBadge = "bg-[#2d2d2d] text-gray-400";
               
               if (index === 0) {
                 rankStyles = "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20";
                 rankBadge = "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950 shadow-md shadow-amber-500/20";
               } else if (index === 1) {
                 rankStyles = "bg-gradient-to-r from-slate-400/10 to-slate-300/5 border-slate-400/20";
                 rankBadge = "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-md";
               } else if (index === 2) {
                 rankStyles = "bg-gradient-to-r from-orange-800/20 to-orange-800/5 border-orange-800/30";
                 rankBadge = "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md";
               }

               return (
                 <div 
                   key={restaurant.id || Math.random()}
                   onClick={() => onRestaurantClick?.(restaurant)}
                   className={`group cursor-pointer flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${rankStyles}`}
                 >
                   <div className={`flex w-6 h-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${rankBadge}`}>
                      {index + 1}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {restaurant.name}
                      </h5>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                         <span className="truncate">{restaurant.category || restaurant.area}</span>
                         <span className="flex items-center gap-0.5 text-orange-400/80 font-mono">
                           <Flame size={10} /> {restaurant.hot_score || 0}
                         </span>
                      </div>
                   </div>

                   <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      <img src={restaurant.image || restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}
      {/* 加入社群模块 */}
      {showCommunity && isCommunityEnabled && (
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
              <h4 className="text-[15px] font-bold text-white mb-1 drop-shadow-sm">{settings?.community_title || '加入古来吃货群!'}</h4>
              <p className="text-xs text-emerald-100/90 leading-tight mb-3">{settings?.community_desc || '不定期搞活动送福利，还能一起拼桌约饭。'}</p>
              <a 
                href={getValidUrl(settings?.whatsapp_link)}
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
      {isSupportEnabled && (
        <div className="relative overflow-hidden rounded-[20px] bg-[#1e1e1e] p-5 shadow-lg border border-white/5 group hover:border-amber-500/30 transition-colors">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 blur-xl group-hover:scale-125 transition-transform duration-700" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg">
              <Coffee size={20} className="drop-shadow-sm" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white mb-1">{settings?.support_title || '请站长喝杯 Kopi ☕'}</h4>
              <p className="text-[11px] text-gray-400 leading-tight mb-3">{settings?.support_desc || '网站好用？随心赞助一杯咖啡，支持服务器续费！'}</p>
              <button 
                onClick={onSupportClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-amber-500 border border-amber-500/30 transition-all hover:bg-amber-500/20 hover:text-white group-hover:bg-amber-500 group-hover:text-amber-950 group-hover:border-amber-500 shadow-sm"
              >
                打赏支持
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
