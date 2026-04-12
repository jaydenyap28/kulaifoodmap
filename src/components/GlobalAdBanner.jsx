import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalAdBanner = ({ position = 'under_wheel' }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('global_ads')
          .select('*')
          .eq('position', position)
          .eq('is_active', true)
          .order('id', { ascending: false });

        if (error) throw error;
        setAds(data || []);
      } catch (err) {
        console.error('Failed to fetch global ads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position]);

  // 自动轮播逻辑 (如果有多个广告)
  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [ads]);

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-4 mt-2">
      <AnimatePresence mode="wait">
        <motion.a
          key={currentAd.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          href={currentAd.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-[3/1] md:aspect-[4.5/1] bg-[#1e1e1e] rounded-[24px] overflow-hidden shadow-2xl border border-white/5 group transition-all duration-500 hover:border-white/20"
        >
          <img
            src={currentAd.image_url}
            alt={currentAd.ad_name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          
          {/* Overlay styling */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="absolute top-3 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white/70 uppercase tracking-widest shadow-sm">
            Ad <ExternalLink size={10} />
          </div>

          <div className="absolute bottom-4 left-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2">
             <span className="text-white font-bold text-sm drop-shadow-md">查看详情</span>
             <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black">
                <ChevronRight size={14} />
             </div>
          </div>

          {/* Carousel Indicators */}
          {ads.length > 1 && (
            <div className="absolute bottom-3 right-6 flex gap-1.5">
              {ads.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`}
                />
              ))}
            </div>
          )}
        </motion.a>
      </AnimatePresence>
    </div>
  );
};

export default GlobalAdBanner;
