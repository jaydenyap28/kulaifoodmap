import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, ExternalLink, Save, Clock, Info, UtensilsCrossed, Upload, BookOpen, Globe, Bike, Navigation, Leaf, Sprout, User, MessageCircle, Send, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/trackEvent';
import ImageWithFallback from './ImageWithFallback';
import BranchSelector from './BranchSelector';
import { checkOpenStatus } from '../utils/businessHours';
import { compressImage } from '../utils/imageUtils';
import { AVAILABLE_AREAS } from '../data/constants';
import { MAIN_VIDEO_LINK, EXPERIENCE_REEL_LINK } from '../data/mediaLinks';
import { appendUtm } from '../utils/linkUtils';

const ResultModal = ({ restaurant, onClose, isAdmin, onUpdateRestaurant, categories = [], onAddCategory }) => {
  const { t, i18n } = useTranslation();

  // State for Lightbox (Sub-stalls)
  const [selectedStallIndex, setSelectedStallIndex] = useState(null);

  // Facebook 导流链接（有商家贴文优先，没有则回流到主页/合集）
  const hasFbPost = Boolean(restaurant?.fb_post_link);
  const fbTargetLink = appendUtm(hasFbPost ? restaurant.fb_post_link : (EXPERIENCE_REEL_LINK || MAIN_VIDEO_LINK), {
    utm_source: 'kulaifoodmap',
    utm_medium: 'referral',
    utm_campaign: hasFbPost ? 'merchant_post' : 'merchant_fallback',
    utm_content: restaurant?.slug || String(restaurant?.id || '')
  });
  
  const HALAL_OPTIONS = [
    { value: 'non_halal', label: 'Non-Halal (非清真/未标注)' },
    { value: 'certified', label: 'Halal Certified (官方认证)' },
    { value: 'muslim_owned', label: 'Muslim Owned (穆斯林经营)' },
    { value: 'no_pork', label: 'No Pork No Lard (不含猪肉/猪油)' }
  ];

  const openStatus = React.useMemo(() => {
    try {
        if (!restaurant || !restaurant.opening_hours) return { isOpen: false, text: '' };
        return checkOpenStatus(restaurant.opening_hours);
    } catch (e) {
        return { isOpen: false, text: '' };
    }
  }, [restaurant]);

  const mapUrl = React.useMemo(() => {
    if (!restaurant) return '';
    if (restaurant.location?.lat && restaurant.location?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`;
    }
    // 优先使用店名+地址，避免只搜索路名导致导航不准
    // Prioritize Shop Name + Address to avoid inaccurate navigation by just searching road name
    const query = `${restaurant.name} ${restaurant.address || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }, [restaurant]);

  if (!restaurant) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-[#1e1e1e] rounded-[32px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-48 w-full">
             <img 
                src={restaurant.image} 
                alt={restaurant.name} 
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] to-transparent"></div>
             
             <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition backdrop-blur-md"
            >
              <X size={20} />
            </button>
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
                <h2 className="text-3xl font-bold text-white drop-shadow-md leading-tight mb-1">
                {i18n.language === 'en' && restaurant.name_en ? restaurant.name_en : restaurant.name}
                </h2>
                {restaurant.name_en && (
                    <p className="text-white/90 text-lg font-medium drop-shadow-md mb-2">
                        {i18n.language === 'en' ? restaurant.name : restaurant.name_en}
                    </p>
                )}
                <div className="flex items-center text-white/90 text-sm flex-wrap gap-y-1">
                    {/* Vegetarian Badge */}
                    {(restaurant.dietaryOption === 'vegetarian_only' || restaurant.isVegetarian) && (
                        <span className="bg-emerald-600 text-white border border-emerald-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <Leaf size={12} className="mr-1" /> 纯素食 / Pure Vegetarian
                        </span>
                    )}
                    {restaurant.dietaryOption === 'vegetarian_friendly' && (
                        <span className="bg-lime-600/90 text-white border border-lime-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <Sprout size={12} className="mr-1" /> 提供素食选项 / Vegetarian Options
                        </span>
                    )}

                    {/* Halal Status Badge */}
                    {restaurant.halalStatus === 'certified' && (
                        <span className="bg-emerald-600 text-white border border-emerald-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <span className="mr-1">✅</span> {t('filter.halal_options.certified')}
                        </span>
                    )}
                    {restaurant.halalStatus === 'muslim_owned' && (
                        <span className="bg-green-600/80 text-white border border-green-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <User size={12} className="mr-1" /> {t('filter.halal_options.muslim_owned')}
                        </span>
                    )}
                    {restaurant.halalStatus === 'no_pork' && (
                        <span className="bg-orange-600/80 text-white border border-orange-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <span className="mr-1">🍖</span> {t('filter.halal_options.no_pork')}
                        </span>
                    )}
                </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Links and Nav */}
            <div className="space-y-4">
               {restaurant.affiliate_url && (
                    <a 
                      href={restaurant.affiliate_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={() => trackEvent('affiliate_click', { type: 'shopeefood', restaurant_id: String(restaurant.id), restaurant_name: restaurant.name })} 
                      className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white font-black shadow-xl hover:scale-[1.02] transition-transform active:scale-95 mb-4"
                    >
                        <Bike size={24}/>
                        <span className="text-lg">🛵 叫外卖 (ShopeeFood)</span>
                    </a>
               )}
               
              {/* Info Display (Editing removed) */}
                  {(restaurant.intro_zh || restaurant.intro_en) && (
                    <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-700 mb-4">
                        <div className="flex items-start gap-3">
                            <Info size={18} className="text-blue-400 mt-1 shrink-0" />
                            <div className="space-y-2">
                                {restaurant.intro_zh && (
                                    <p className="text-gray-200 text-sm leading-relaxed">
                                        {restaurant.intro_zh}
                                    </p>
                                )}
                                {restaurant.intro_en && (
                                    <p className="text-gray-400 text-xs leading-relaxed italic border-t border-gray-600 pt-2 mt-2">
                                        {restaurant.intro_en}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="flex items-start text-gray-300">
                    <MapPin size={18} className="mt-1 mr-3 text-gray-400 shrink-0" />
                    <p className="leading-relaxed">{restaurant.address}</p>
                  </div>
                  <div className="flex items-start text-gray-300">
                    <Clock size={18} className="mt-1 mr-3 text-gray-400 shrink-0" />
                    <div className="leading-relaxed whitespace-pre-line">
                        {restaurant.opening_hours ? (
                            restaurant.opening_hours.includes('\n') ? (
                                <div className="text-sm space-y-1">
                                    {restaurant.opening_hours.split('\n').map((line, i) => {
                                        // Highlight today's hours
                                        const today = new Date().getDay();
                                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                        const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                        const isToday = line.includes(days[today]) || line.includes(daysShort[today]);
                                        
                                        return (
                                            <div key={i} className={`${isToday ? 'font-bold text-white' : ''}`}>
                                                {line}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                restaurant.opening_hours
                            )
                        ) : "营业时间未知"}
                    </div>
                  </div>
                  
                  {/* Google Maps Navigation Button (Primary) */}
                  <button
                    onClick={() => {
                        trackEvent('navigate_click', {
                            provider: 'google_maps',
                            restaurant_id: String(restaurant.id),
                            restaurant_name: restaurant.name,
                        });
                        window.open(mapUrl, '_blank');
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black shadow-lg hover:brightness-110 transition-all active:scale-95 group"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <Navigation size={20} className="fill-current group-hover:scale-110 transition-transform" />
                    {i18n.language === 'en' ? 'Navigate with Google Maps' : '使用谷歌地图导航'}
                  </button>

                  {/* Waze Navigation Button (Secondary) */}
                  <button
                    onClick={() => {
                        const lat = restaurant.location?.lat;
                        const lng = restaurant.location?.lng;
                        let url;
                        if (lat && lng) {
                            url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
                        } else {
                            // 同步 Google Maps 的逻辑，优先搜名字+地址
                            const qStr = `${restaurant.name} ${restaurant.address || ''}`.trim();
                            const query = encodeURIComponent(qStr);
                            url = `https://waze.com/ul?q=${query}&navigate=yes`;
                        }
                        trackEvent('navigate_click', {
                            provider: 'waze',
                            restaurant_id: String(restaurant.id),
                            restaurant_name: restaurant.name,
                        });
                        window.open(url, '_blank');
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black shadow-lg hover:brightness-110 transition-all active:scale-95 group"
                    style={{ backgroundColor: '#33CCFF' }}
                  >
                    <Navigation size={20} className="fill-current group-hover:scale-110 transition-transform" />
                    {i18n.language === 'en' ? 'Navigate with Waze' : '使用Waze导航'}
                  </button>

                  {/* Branches Display (For Chain Restaurants) */}
                  {restaurant.branches && restaurant.branches.length > 0 && (
                    <BranchSelector branches={restaurant.branches} />
                  )}

                  {/* Sub Stalls Display (For Kopitiams) - Lightbox Enhanced */}
                  {restaurant.subStalls && Array.isArray(restaurant.subStalls) && restaurant.subStalls.length > 0 && (
                    <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <UtensilsCrossed size={14} className="text-yellow-500" />
                            {t('modal.stalls', '咖啡店/美食阁档口 (Stalls)')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {restaurant.subStalls.map((stall, idx) => {
                                if (!stall) return null;
                                const stallName = typeof stall === 'object' ? stall.name : stall;
                                const stallImage = typeof stall === 'object' ? stall.image : null;

                                return (
                                <motion.div 
                                    key={idx} 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-[#1a1a1a] rounded-lg border border-gray-600 overflow-hidden flex flex-col group/stall cursor-pointer relative"
                                    onClick={() => stallImage && setSelectedStallIndex(idx)}
                                >
                                    <div className="h-24 w-full bg-gray-800 relative">
                                        {stallImage ? (
                                            <>
                                                <ImageWithFallback 
                                                    src={stallImage} 
                                                    alt={stallName}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/stall:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover/stall:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover/stall:opacity-100 text-white text-[10px] bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm transition-opacity flex items-center gap-1">
                                                        <Search size={10} /> 查看 (View)
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <UtensilsCrossed size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full pt-6 flex flex-col justify-end">
                                        <span className="text-white text-xs font-bold block truncate drop-shadow-md" title={stallName}>{stallName}</span>

                                    </div>
                                </motion.div>
                                );
                            })}
                        </div>
                    </div>
                  )}

              <div className="flex gap-2 mb-1">
                 {restaurant.menu_link && (
                    <a href={restaurant.menu_link} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('external_link_click', { type: 'menu', restaurant_id: String(restaurant.id), restaurant_name: restaurant.name })} className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <BookOpen size={18} className="mb-1 text-blue-400"/>
                        <span className="text-[10px] font-bold">{t('modal.menu', '菜单 (Menu)')}</span>
                    </a>
                 )}
                 {(() => {
                    const waUrl = restaurant.whatsappLink || (restaurant.phone && restaurant.phone.replace(/[^0-9]/g, '').startsWith('01') ? `https://wa.me/6${restaurant.phone.replace(/[^0-9]/g, '')}` : null);
                    if (!waUrl) return null;
                    return (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('external_link_click', { type: 'whatsapp', restaurant_id: String(restaurant.id), restaurant_name: restaurant.name })} className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                            <Send size={18} className="mb-1 text-green-400"/>
                            <span className="text-[10px] font-bold">WhatsApp</span>
                        </a>
                    );
                 })()}
                 {restaurant.website_link && (
                    <a href={restaurant.website_link} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('external_link_click', { type: 'website', restaurant_id: String(restaurant.id), restaurant_name: restaurant.name })} className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <Globe size={18} className="mb-1 text-purple-400"/>
                        <span className="text-[10px] font-bold">{t('modal.website', '网站 (Web)')}</span>
                    </a>
                 )}
                 {restaurant.delivery_link && (
                    <a href={restaurant.delivery_link} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('external_link_click', { type: 'delivery', restaurant_id: String(restaurant.id), restaurant_name: restaurant.name })} className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <Bike size={18} className="mb-1 text-green-400"/>
                        <span className="text-[10px] font-bold">{t('modal.delivery', '外卖 (Order)')}</span>
                    </a>
                 )}
              </div>


            </div>

            <hr className="border-gray-700" />

            {/* Facebook Traffic Strategy Button (Smart Fallback) */}
            <div className="mt-6">
                <div className="space-y-2">
                    <a 
                        href={fbTargetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('social_click', {
                          platform: 'facebook',
                          restaurant_id: String(restaurant.id),
                          restaurant_name: restaurant.name,
                          source: hasFbPost ? 'merchant_post' : 'fallback_page'
                        })}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${hasFbPost ? 'bg-[#1877F2] text-white hover:brightness-110' : 'bg-[#2d2d2d] text-gray-300 border border-gray-600 hover:bg-[#3d3d3d] hover:text-white'}`}
                    >
                        <MessageCircle size={20} className={hasFbPost ? 'fill-current' : ''} />
                        {hasFbPost ? '🔥 去 Facebook 看完整探店' : '👉 去 Facebook 看更多探店'}
                    </a>
                    <p className="text-center text-[10px] text-gray-500">
                        {hasFbPost ? '有这家店的专属贴文，欢迎留言互动。' : '这家暂时没有专属贴文，先带你去主页看更多内容。'}
                    </p>
                </div>
              </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox Viewer */}
      {selectedStallIndex !== null && restaurant.subStalls && (
        <LightboxViewer 
            stalls={restaurant.subStalls}
            initialIndex={selectedStallIndex}
            onClose={() => setSelectedStallIndex(null)}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

const LightboxViewer = ({ stalls, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const handleNext = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % stalls.length);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + stalls.length) % stalls.length);
    };

    const currentStall = stalls[currentIndex];
    const stallName = typeof currentStall === 'object' ? currentStall.name : currentStall;
    const stallImage = typeof currentStall === 'object' ? currentStall.image : null;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={onClose}
        >
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[160]"
            >
                <X size={32} />
            </button>

            {/* Navigation Arrows */}
            <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[160] hover:bg-white/10 rounded-full transition"
            >
                <ChevronLeft size={48} />
            </button>
            <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[160] hover:bg-white/10 rounded-full transition"
            >
                <ChevronRight size={48} />
            </button>

            {/* Image Container */}
            <div 
                className="flex flex-col items-center max-w-full max-h-screen p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    {stallImage ? (
                        <motion.img 
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            src={stallImage} 
                            alt={stallName} 
                            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
                        />
                    ) : (
                        <div className="w-[80vw] h-[60vh] flex items-center justify-center text-gray-500 bg-gray-900 rounded-lg">
                            <UtensilsCrossed size={64} />
                            <span className="ml-4">无图片 (No Image)</span>
                        </div>
                    )}
                </div>
                
                <motion.div 
                    key={`text-${currentIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                >
                    <h3 className="text-white text-2xl font-bold tracking-wide">{stallName}</h3>
                    
                    {/* Tags Display in Lightbox */}
                    {typeof currentStall === 'object' && currentStall.tags && currentStall.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mt-3 mb-2">
                            {currentStall.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-purple-600/20 text-purple-200 border border-purple-500/30 text-sm rounded-full backdrop-blur-md">
                                    ✨ {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <p className="text-gray-400 text-sm mt-1">
                        {currentIndex + 1} / {stalls.length}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ResultModal;
