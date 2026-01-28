import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, ExternalLink, Send, Save, Clock, Info, UtensilsCrossed, Upload, BookOpen, Globe, Bike, Navigation, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ImageWithFallback from './ImageWithFallback';
import { checkOpenStatus } from '../utils/businessHours';
import { compressImage } from '../utils/imageUtils';
import { AVAILABLE_AREAS } from '../data/constants';

const ResultModal = ({ restaurant, onClose, onAddReview, isAdmin, onUpdateRestaurant, onDeleteReview, categories = [], onAddCategory }) => {
  const { t, i18n } = useTranslation();
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: restaurant.name,
    name_en: restaurant.name_en || '',
    address: restaurant.address, 
    menu_link: restaurant.menu_link || '',
    website_link: restaurant.website_link || '',
    delivery_link: restaurant.delivery_link || '',
    opening_hours: restaurant.opening_hours,
    price_range: restaurant.price_range || '',
    image: restaurant.image || '',
    categories: restaurant.categories || [],
    isVegetarian: restaurant.isVegetarian || false,
    isNoBeef: restaurant.isNoBeef || false,
    halalStatus: restaurant.halalStatus || 'non_halal',
    manualStatus: restaurant.manualStatus || 'auto', // 'auto', 'open', 'closed'
    subStalls: restaurant.subStalls || [],
    rating: restaurant.rating !== undefined ? restaurant.rating : 0,
    area: restaurant.area || '',
    intro_zh: restaurant.intro_zh || '',
    intro_en: restaurant.intro_en || '',
    tags: restaurant.tags || [],
    subscriptionLevel: restaurant.subscriptionLevel || 0,
    priority: restaurant.priority || 0,
    whatsappLink: restaurant.whatsappLink || "",
    location: restaurant.location || { lat: '', lng: '' },
    dietaryOption: restaurant.dietaryOption || null
  });

  // Smart Schedule State
  const [useSmartSchedule, setUseSmartSchedule] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState({
    startTime: '10:00',
    endTime: '22:00',
    closedDays: []
  });

  // State for zoomed image
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // State for Halal Dropdown
  const [showHalalDropdown, setShowHalalDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const halalButtonRef = useRef(null);

  const HALAL_OPTIONS = [
    { value: 'non_halal', label: 'Non-Halal (非清真/未标注)' },
    { value: 'certified', label: 'Halal Certified (官方认证)' },
    { value: 'muslim_owned', label: 'Muslim Owned (穆斯林经营)' },
    { value: 'no_pork', label: 'No Pork No Lard (不含猪肉/猪油)' }
  ];

  // Update form when restaurant changes
  React.useEffect(() => {
    if (!restaurant) return;
    
    setEditForm({ 
        name: restaurant.name || '',
        name_en: restaurant.name_en || '',
        address: restaurant.address || '', 
        menu_link: restaurant.menu_link || '',
        website_link: restaurant.website_link || '',
        delivery_link: restaurant.delivery_link || '',
        opening_hours: restaurant.opening_hours || '',
        price_range: restaurant.price_range || '',
        image: restaurant.image || '',
        categories: restaurant.categories || [],
        isVegetarian: restaurant.isVegetarian || false,
        isNoBeef: restaurant.isNoBeef || false,
        halalStatus: restaurant.halalStatus || 'non_halal',
        manualStatus: restaurant.manualStatus || 'auto',
        subStalls: restaurant.subStalls || [],
        branches: restaurant.branches || [],
        rating: restaurant.rating !== undefined ? restaurant.rating : 0,
        area: restaurant.area || '',
        intro_zh: restaurant.intro_zh || '',
        intro_en: restaurant.intro_en || '',
        tags: restaurant.tags || [],
        subscriptionLevel: restaurant.subscriptionLevel || 0,
        priority: restaurant.priority || 0,
        whatsappLink: restaurant.whatsappLink || "",
        location: restaurant.location || { lat: '', lng: '' },
        dietaryOption: restaurant.dietaryOption || null
    });
  }, [restaurant]);

  const handleToggleCategory = (cat) => {
    setEditForm(prev => {
      const cats = prev.categories || [];
      if (cats.includes(cat)) {
        return { ...prev, categories: cats.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...cats, cat] };
      }
    });
  };

  const formatTime12 = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}${m === '00' ? '' : ':' + m}${ampm}`;
  };

  // Initialize from existing text
  React.useEffect(() => {
    if (isEditing && restaurant?.opening_hours) {
        try {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const closed = [];
        const lines = restaurant.opening_hours.split('\n');
        
        let foundTime = false;
        let start = '10:00';
        let end = '22:00';

        // Simple parsing for closed days and time
        lines.forEach(line => {
             const lower = line.toLowerCase();
             // Detect closed days
             days.forEach((day, idx) => {
                 if ((line.includes(day) || line.includes(shortDays[idx])) && (lower.includes('closed') || lower.includes('休息'))) {
                     if (!closed.includes(day)) closed.push(day);
                 }
             });

            // Try to extract time from the first open day
            if (!foundTime && !lower.includes('closed') && !lower.includes('休息')) {
                // Try to split by common separators
                const parts = lower.split(/-|–| to /); // Support hyphen, en-dash, 'to'
                if (parts.length >= 2) {
                    // Helper to parse "10:00am" -> "10:00" (24h)
                    const parseTo24 = (t) => {
                        t = t.trim();
                        // Extract time digits
                        const timeMatch = t.match(/(\d{1,2})(:(\d{2}))?\s*([ap]m)?/);
                        if (!timeMatch) return null;
                        
                        let h = parseInt(timeMatch[1]);
                        let m = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
                        let ampm = timeMatch[4];
                        
                        if (ampm) {
                            if (ampm === 'pm' && h < 12) h += 12;
                            if (ampm === 'am' && h === 12) h = 0;
                        } else {
                            // Guessing logic if no AM/PM? 
                            // Usually inputs have AM/PM. If not, assume 24h?
                            // Let's just strict check for AM/PM if possible, or fallback.
                            // If user typed "10", is it 10am or 10pm? Usually 10am. "22" is 10pm.
                        }

                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    };

                    const s = parseTo24(parts[0]);
                    // For end time, take the last part if multiple splits (e.g. 10am - 2pm - break)
                    // But usually just 2 parts.
                    const e = parseTo24(parts[parts.length - 1]);

                    if (s && e) {
                        start = s;
                        end = e;
                        foundTime = true;
                    }
                }
            }
        });
        
        setScheduleSettings(prev => ({ 
            ...prev, 
            closedDays: closed,
            startTime: start,
            endTime: end
        }));
    } catch (e) {
        console.warn("Failed to parse opening hours", e);
    }
    }
  }, [isEditing, restaurant?.opening_hours]);

  // Generate string
  React.useEffect(() => {
    if (useSmartSchedule && isEditing) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const timeStr = `${formatTime12(scheduleSettings.startTime)} - ${formatTime12(scheduleSettings.endTime)}`;
      
      const lines = days.map(day => {
        if (scheduleSettings.closedDays.includes(day)) return `${day}: Closed`;
        return `${day}: ${timeStr}`;
      });
      setEditForm(prev => ({ ...prev, opening_hours: lines.join('\n') }));
    }
  }, [useSmartSchedule, scheduleSettings, isEditing]);

  const openStatus = React.useMemo(() => {
    try {
        if (!restaurant || !restaurant.opening_hours) return { isOpen: false, text: '' };
        return checkOpenStatus(restaurant.opening_hours);
    } catch (e) {
        return { isOpen: false, text: '' };
    }
  }, [restaurant]);

  if (!restaurant) return null;

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (reviewerName.trim() && reviewComment.trim()) {
      onAddReview(restaurant.id, {
        user: reviewerName,
        comment: reviewComment,
        date: new Date().toISOString().split('T')[0]
      });
      setReviewerName('');
      setReviewComment('');
    }
  };

  const handleSaveEdit = () => {
    onUpdateRestaurant(restaurant.id, editForm);
    setIsEditing(false);
  };

  const handleImageUpload = async (e, targetField, stallIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Warn user
        if (!window.confirm("使用本地上传会将图片转换为 Base64 文本，这会导致数据文件变得非常大 (可能几百KB或MB)。\n\n建议: 仅上传小图片或使用网络链接。\n\n是否继续?")) {
            e.target.value = ''; // Reset input
            return;
        }

        const base64 = await compressImage(file);
        
        if (stallIndex !== null) {
            // Update subStall
            const newStalls = [...editForm.subStalls];
            newStalls[stallIndex] = { ...newStalls[stallIndex], image: base64 };
            setEditForm({...editForm, subStalls: newStalls});
        } else {
            // Update main image
            setEditForm(prev => ({ ...prev, [targetField]: base64 }));
        }
    } catch (err) {
        console.error("Image processing failed", err);
        alert("图片处理失败");
    }
  };

  const mapUrl = (restaurant.location?.lat && restaurant.location?.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' 古来')}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-[#1e1e1e] rounded-[32px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700"
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
                            <Leaf size={12} className="mr-1" /> 素食 / Vegetarian
                        </span>
                    )}
                    {restaurant.dietaryOption === 'vegetarian_friendly' && (
                        <span className="bg-lime-600/90 text-white border border-lime-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <Leaf size={12} className="mr-1" /> 提供素食选项 / Veg-Friendly
                        </span>
                    )}

                    {/* Halal Status Badge */}
                    {restaurant.halalStatus === 'certified' && (
                        <span className="bg-emerald-600 text-white border border-emerald-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <span className="mr-1">✅</span> Halal Certified
                        </span>
                    )}
                    {restaurant.halalStatus === 'muslim_owned' && (
                        <span className="bg-green-600/80 text-white border border-green-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <span className="mr-1">☪️</span> Muslim Owned
                        </span>
                    )}
                    {restaurant.halalStatus === 'no_pork' && (
                        <span className="bg-orange-600/80 text-white border border-orange-500 px-2 py-0.5 rounded text-xs font-bold mr-2 backdrop-blur-md flex items-center shadow-sm">
                            <span className="mr-1">🍖</span> No Pork No Lard
                        </span>
                    )}
                    <span className="bg-white/10 border border-white/20 px-2 py-0.5 rounded text-white font-bold text-xs mr-2 backdrop-blur-md">
                        {restaurant.price_range}
                    </span>
                    <Star fill="white" stroke="none" size={14} className="mr-1" />
                    <span className="font-bold">{restaurant.rating}</span>
                </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="space-y-4">
              {isAdmin && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-[#2d2d2d] text-gray-300 rounded-lg text-sm font-bold hover:bg-[#333] transition relative overflow-hidden"
                >
                  <span className="absolute top-0 right-0 bg-white text-black text-[9px] px-1.5 py-0.5 rounded-bl-lg font-bold">NEW UI</span>
                  🔧 编辑商家信息 (Edit Info)
                </button>
              )}

              {isAdmin && isEditing ? (
                <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-600 space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">店名 (中文)</label>
                    <input 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">English Name</label>
                    <input 
                      value={editForm.name_en}
                      onChange={e => setEditForm({...editForm, name_en: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                      placeholder="Enter English Name"
                    />
                  </div>

                  {/* Introduction Fields */}
                  <div>
                    <label className="text-xs text-gray-400">简介 (Chinese Intro)</label>
                    <textarea 
                      value={editForm.intro_zh}
                      onChange={e => setEditForm({...editForm, intro_zh: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none min-h-[60px]"
                      placeholder="输入中文简介..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Introduction (English)</label>
                    <textarea 
                      value={editForm.intro_en}
                      onChange={e => setEditForm({...editForm, intro_en: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none min-h-[60px]"
                      placeholder="Enter English Introduction..."
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">图片链接 (Image URL)</label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 flex flex-col gap-1">
                          <input 
                            value={editForm.image}
                            onChange={e => setEditForm({...editForm, image: e.target.value})}
                            className="w-full border-b border-gray-200 py-1 text-sm focus:border-white outline-none"
                            placeholder="https://..."
                          />
                          <div className="flex items-center gap-2">
                             <label className="cursor-pointer flex items-center gap-1 bg-[#333] px-2 py-1 rounded text-[10px] text-gray-300 hover:bg-[#444] transition border border-gray-600">
                                <Upload size={10} />
                                <span>本地上传 (Upload Local)</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'image')}
                                />
                             </label>
                             <span className="text-[9px] text-gray-500">会自动压缩 (Auto compress)</span>
                          </div>
                      </div>

                      <a 
                          href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(restaurant.name + ' food')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200 whitespace-nowrap text-xs flex items-center"
                          title="在 Google 图片搜索"
                      >
                          🔍 搜图
                      </a>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                       提示: Google Maps 里的图片很难复制。建议点击“搜图”，在搜索结果中右键选择 "复制图片地址"。
                    </p>
                    {(editForm.image?.includes('google.com/maps') || editForm.image?.includes('google.com/search') || editForm.image?.includes('google.com/imgres') || editForm.image?.includes('maps.app.goo.gl') || editForm.image?.includes('goo.gl')) && (
                      <p className="text-[10px] text-red-500 mt-1">
                        ⚠️ 链接无效。请右键图片选择 "复制图片地址" (Copy Image Address)。不要使用分享链接。
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">地址</label>
                    <input 
                      value={editForm.address}
                      onChange={e => setEditForm({...editForm, address: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">地区 (Area)</label>
                    <select
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm({...editForm, area: e.target.value})}
                        className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                    >
                        <option value="">Select Area...</option>
                        {AVAILABLE_AREAS.map(area => (
                            <option key={area} value={area}>{t(`areas.${area}`, area)}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">坐标 (Location Coordinates)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Latitude (e.g. 1.661234)"
                            value={editForm.location?.lat || ''}
                            onChange={e => setEditForm({...editForm, location: { ...editForm.location, lat: e.target.value }})}
                            className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="Longitude (e.g. 103.598765)"
                            value={editForm.location?.lng || ''}
                            onChange={e => setEditForm({...editForm, location: { ...editForm.location, lng: e.target.value }})}
                            className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                       提示: 在 Google Maps 上右键点击地点即可复制坐标。用于精准导航和隐世路边摊定位。
                    </p>
                  </div>

                  {/* Commercial / VIP Settings */}
                  <div className="bg-amber-900/10 p-3 rounded-lg border border-amber-900/30 space-y-3">
                      <p className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1">
                          <Star size={12} fill="currentColor" /> 商业化设置 (VIP Settings)
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400">等级 (Subscription Level)</label>
                            <select
                                value={editForm.subscriptionLevel}
                                onChange={(e) => setEditForm({...editForm, subscriptionLevel: parseInt(e.target.value)})}
                                className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-amber-500 outline-none"
                            >
                                <option value={0}>0 - Free (免费)</option>
                                <option value={1}>1 - VIP Basic (入门)</option>
                                <option value={2}>2 - Mid Tier (中级)</option>
                                <option value={3}>3 - Top Tier (高级/Featured)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">优先级 (Priority)</label>
                            <input 
                              type="number"
                              value={editForm.priority}
                              onChange={e => setEditForm({...editForm, priority: parseInt(e.target.value) || 0})}
                              className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-amber-500 outline-none"
                            />
                          </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1">
                            <Send size={10} /> WhatsApp 链接 (Contact Link)
                        </label>
                        <input 
                          value={editForm.whatsappLink}
                          onChange={e => setEditForm({...editForm, whatsappLink: e.target.value})}
                          className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-amber-500 outline-none"
                          placeholder="https://wa.me/601xxxxxx"
                        />
                      </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">价格范围 (Price Range)</label>
                    <input 
                      value={editForm.price_range}
                      onChange={e => setEditForm({...editForm, price_range: e.target.value})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                      placeholder="e.g. RM 10-20"
                    />
                  </div>
                  <div className="space-y-3 pt-2 border-t border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase">🔗 外部链接 (External Links)</p>
                    
                    <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1"><BookOpen size={10}/> 菜单链接 (Menu Link)</label>
                        <input 
                          value={editForm.menu_link}
                          onChange={e => setEditForm({...editForm, menu_link: e.target.value})}
                          className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                          placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1"><Globe size={10}/> 网站链接 (Website Link)</label>
                        <input 
                          value={editForm.website_link}
                          onChange={e => setEditForm({...editForm, website_link: e.target.value})}
                          className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                          placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1"><Bike size={10}/> 外卖链接 (Delivery Link)</label>
                        <input 
                          value={editForm.delivery_link}
                          onChange={e => setEditForm({...editForm, delivery_link: e.target.value})}
                          className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                          placeholder="https://..."
                        />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">评分 (Rating)</label>
                    <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={editForm.rating}
                          onChange={e => setEditForm({...editForm, rating: parseFloat(e.target.value)})}
                          className="w-20 bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                        />
                        <span className="text-xs text-gray-400">/ 5.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Halal Status (清真状态)</label>
                    <div className="relative">
                        <button
                            ref={halalButtonRef}
                            onClick={() => {
                                if (!showHalalDropdown && halalButtonRef.current) {
                                    const rect = halalButtonRef.current.getBoundingClientRect();
                                    setDropdownPos({ 
                                        top: rect.top, 
                                        left: rect.right + 10 
                                    });
                                }
                                setShowHalalDropdown(!showHalalDropdown);
                            }}
                            className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none mt-1 text-left flex justify-between items-center"
                        >
                            <span>
                                {HALAL_OPTIONS.find(o => o.value === (editForm.halalStatus || 'non_halal'))?.label}
                            </span>
                            <span className="text-gray-500 text-xs transform transition-transform duration-200" style={{ transform: showHalalDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </button>

                        {showHalalDropdown && createPortal(
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setShowHalalDropdown(false)}></div>
                                <div 
                                    className="fixed z-[60] bg-[#2d2d2d] border border-gray-600 rounded-lg shadow-2xl w-64 overflow-hidden"
                                    style={{ 
                                        top: dropdownPos.top, 
                                        left: dropdownPos.left 
                                    }}
                                >
                                    {HALAL_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setEditForm({...editForm, halalStatus: option.value});
                                                setShowHalalDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-[#444] border-b border-gray-700 last:border-0 transition-colors ${
                                                editForm.halalStatus === option.value ? 'text-white font-bold bg-[#333]' : 'text-gray-300'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                  </div>

                  {/* Dietary Option Selector */}
                  <div>
                    <label className="text-xs text-gray-400">Dietary Option (素食选项)</label>
                    <select
                        value={editForm.dietaryOption || ''}
                        onChange={(e) => setEditForm({...editForm, dietaryOption: e.target.value || null})}
                        className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none mt-1"
                    >
                        <option value="">None (无)</option>
                        <option value="vegetarian_friendly">Veg-Friendly (提供素食选项)</option>
                        <option value="vegetarian_only">Vegetarian Only (纯素食)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">分类 (Categories)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleToggleCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                            editForm.categories?.includes(cat)
                              ? 'bg-white text-black border-white'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                            const newCat = prompt("请输入新分类名称 (Enter new category name):");
                            if (newCat && newCat.trim()) {
                                onAddCategory(newCat.trim());
                                // Auto-select the new category
                                handleToggleCategory(newCat.trim());
                            }
                        }}
                        className="px-2 py-1 rounded-full text-xs font-bold border border-dashed border-gray-300 text-gray-400 hover:text-white hover:border-white"
                      >
                        + Add New
                      </button>
                    </div>
                  </div>

                  {/* Tags Editor (Hidden magic) */}
                  <div>
                    <label className="text-xs text-gray-400">AI 标签 (Tags - Comma separated)</label>
                    <input 
                      value={editForm.tags ? editForm.tags.join(', ') : ''}
                      onChange={e => setEditForm({...editForm, tags: e.target.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)})}
                      className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none"
                      placeholder="例如: 适合小孩, 平价, 冷气 (e.g. Kids Friendly, Cheap)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {editForm.tags && editForm.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-900/30 text-purple-300 border border-purple-800/50 text-xs rounded-lg flex items-center gap-1">
                                ✨ {tag}
                            </span>
                        ))}
                    </div>
                  </div>

                  {/* Sub Stalls Editor */}
                  <div>
                    <label className="text-xs text-gray-400">咖啡店档口 (Stalls)</label>
                    <div className="space-y-3 mb-3">
                        {editForm.subStalls && editForm.subStalls.map((stall, idx) => (
                            <div key={idx} className="bg-[#333] p-2 rounded border border-gray-600 flex gap-2 items-start">
                                {/* Thumbnail */}
                                <div className="w-12 h-12 bg-black/50 rounded overflow-hidden shrink-0">
                                    {stall.image ? (
                                        <img src={stall.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <UtensilsCrossed size={12} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                    <input 
                                        value={stall.name}
                                        onChange={(e) => {
                                            const newStalls = [...editForm.subStalls];
                                            newStalls[idx] = { ...newStalls[idx], name: e.target.value };
                                            setEditForm({...editForm, subStalls: newStalls});
                                        }}
                                        className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                                        placeholder="档口名称 (Name)"
                                    />
                                    <div className="flex gap-1">
                                        <input 
                                            value={stall.image}
                                            onChange={(e) => {
                                                const newStalls = [...editForm.subStalls];
                                                newStalls[idx] = { ...newStalls[idx], image: e.target.value };
                                                setEditForm({...editForm, subStalls: newStalls});
                                            }}
                                            className="flex-1 bg-[#1a1a1a] border-b border-gray-600 py-1 text-[10px] text-gray-300 focus:border-white outline-none"
                                            placeholder="图片链接 (Image URL)"
                                        />
                                        <a 
                                            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(stall.name + ' food')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] text-white hover:bg-gray-600 whitespace-nowrap flex items-center"
                                        >
                                            🔍
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <label className="cursor-pointer flex items-center gap-1 bg-[#444] px-1.5 py-0.5 rounded text-[9px] text-gray-300 hover:bg-[#555] transition border border-gray-600">
                                            <Upload size={8} />
                                            <span>本地上传</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden"
                                                onChange={(e) => handleImageUpload(e, 'image', idx)}
                                            />
                                         </label>
                                         <span className="text-[8px] text-gray-500">会自动压缩</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        const newStalls = [...editForm.subStalls];
                                        newStalls.splice(idx, 1);
                                        setEditForm({...editForm, subStalls: newStalls});
                                    }}
                                    className="text-gray-500 hover:text-red-400 p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {/* Add New Stall */}
                    <button
                        onClick={() => {
                            setEditForm(prev => ({
                                ...prev,
                                subStalls: [...(prev.subStalls || []), { name: '新档口', image: '' }]
                            }));
                        }}
                        className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-xs rounded hover:border-white hover:text-white transition"
                    >
                        + 添加档口 (Add Stall)
                    </button>
                  </div>

                  {/* Branches Editor */}
                  <div>
                    <label className="text-xs text-gray-400">分店 (Branches)</label>
                    <div className="space-y-3 mb-3">
                        {editForm.branches && editForm.branches.map((branch, idx) => (
                            <div key={idx} className="bg-[#333] p-2 rounded border border-gray-600 flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                    <input 
                                        value={branch.name}
                                        onChange={(e) => {
                                            const newBranches = [...(editForm.branches || [])];
                                            newBranches[idx] = { ...newBranches[idx], name: e.target.value };
                                            setEditForm({...editForm, branches: newBranches});
                                        }}
                                        className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                                        placeholder="分店名称 (Branch Name)"
                                    />
                                    <input 
                                        value={branch.address}
                                        onChange={(e) => {
                                            const newBranches = [...(editForm.branches || [])];
                                            newBranches[idx] = { ...newBranches[idx], address: e.target.value };
                                            setEditForm({...editForm, branches: newBranches});
                                        }}
                                        className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-xs text-white focus:border-white outline-none"
                                        placeholder="分店地址 (Branch Address)"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        const newBranches = [...(editForm.branches || [])];
                                        newBranches.splice(idx, 1);
                                        setEditForm({...editForm, branches: newBranches});
                                    }}
                                    className="text-gray-500 hover:text-red-400 p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setEditForm(prev => ({
                                ...prev,
                                branches: [...(prev.branches || []), { name: '新分店', address: '' }]
                            }));
                        }}
                        className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-xs rounded hover:border-white hover:text-white transition"
                    >
                        + 添加分店 (Add Branch)
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">营业状态 (Business Status)</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setEditForm({...editForm, manualStatus: 'auto'})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-1 ${
                          editForm.manualStatus === 'auto'
                            ? 'bg-blue-900/30 text-blue-400 border-blue-700 ring-1 ring-blue-700'
                            : 'bg-[#1a1a1a] text-gray-500 border-gray-700 hover:bg-[#333]'
                        }`}
                      >
                        🕒 自动 (Time-based)
                      </button>
                      <button
                        onClick={() => setEditForm({...editForm, manualStatus: 'open'})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-1 ${
                          editForm.manualStatus === 'open'
                            ? 'bg-green-900/30 text-green-400 border-green-700 ring-1 ring-green-700'
                            : 'bg-[#1a1a1a] text-gray-500 border-gray-700 hover:bg-[#333]'
                        }`}
                      >
                        🟢 营业中 (Open)
                      </button>
                      <button
                        onClick={() => setEditForm({...editForm, manualStatus: 'closed'})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-1 ${
                          editForm.manualStatus === 'closed'
                            ? 'bg-red-900/30 text-red-400 border-red-700 ring-1 ring-red-700'
                            : 'bg-[#1a1a1a] text-gray-500 border-gray-700 hover:bg-[#333]'
                        }`}
                      >
                        🔴 已休息 (Closed)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400">营业时间 (Opening Hours)</label>
                        <button 
                            onClick={() => setUseSmartSchedule(!useSmartSchedule)}
                            className="text-[10px] text-gray-400 underline hover:text-white"
                        >
                            {useSmartSchedule ? '切换为手动输入 (Switch to Manual)' : '使用智能排班 (Use Smart Mode)'}
                        </button>
                    </div>

                    {useSmartSchedule ? (
                        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 space-y-4">
                            {/* Time Picker */}
                            <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block mb-1">开始时间 (Start)</label>
                                    <input 
                                        type="time" 
                                        value={scheduleSettings.startTime}
                                        onChange={(e) => setScheduleSettings({...scheduleSettings, startTime: e.target.value})}
                                        className="w-full p-1.5 text-sm bg-[#333] border border-gray-600 rounded text-white focus:border-white outline-none"
                                    />
                                </div>
                                <span className="text-gray-500 mt-4">-</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block mb-1">结束时间 (End)</label>
                                    <input 
                                        type="time" 
                                        value={scheduleSettings.endTime}
                                        onChange={(e) => setScheduleSettings({...scheduleSettings, endTime: e.target.value})}
                                        className="w-full p-1.5 text-sm bg-[#333] border border-gray-600 rounded text-white focus:border-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Closed Days Picker */}
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-2">点击选择休息日 (Select Closed Days)</label>
                                <div className="grid grid-cols-7 gap-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayShort, idx) => {
                                        const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                        const dayFull = fullDays[idx];
                                        const isClosed = scheduleSettings.closedDays.includes(dayFull);
                                        
                                        return (
                                            <button
                                                key={dayShort}
                                                onClick={() => {
                                                    const newClosed = isClosed 
                                                        ? scheduleSettings.closedDays.filter(d => d !== dayFull)
                                                        : [...scheduleSettings.closedDays, dayFull];
                                                    setScheduleSettings({...scheduleSettings, closedDays: newClosed});
                                                }}
                                                className={`
                                                    py-2 rounded text-[10px] font-bold transition-all
                                                    ${isClosed 
                                                        ? 'bg-red-900/30 text-red-400 border border-red-700 shadow-inner' 
                                                        : 'bg-[#333] text-gray-300 border border-gray-600 hover:bg-[#444]'}
                                                `}
                                            >
                                                {dayShort}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">
                                    {scheduleSettings.closedDays.length > 0 
                                        ? `已选休息日: ${scheduleSettings.closedDays.join(', ')}` 
                                        : '全年无休 (Open Daily)'}
                                </p>
                            </div>
                            
                            {/* Preview (Optional, but helpful) */}
                            <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-[10px] text-gray-400 mb-1">预览 (Preview):</p>
                                <div className="text-[10px] text-gray-400 bg-[#121212] p-2 rounded border border-gray-700 h-20 overflow-y-auto whitespace-pre-wrap">
                                    {editForm.opening_hours}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <textarea 
                            value={editForm.opening_hours}
                            onChange={e => setEditForm({...editForm, opening_hours: e.target.value})}
                            className="w-full bg-[#1a1a1a] border-b border-gray-600 py-1 text-sm text-white focus:border-white outline-none resize-y min-h-[100px]"
                            placeholder="例如: 
Monday: 10am-10pm
Tuesday: Closed
..."
                        />
                    )}
                  </div>
                  <button
                    onClick={handleSaveEdit}
                    className="w-full flex items-center justify-center py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    <Save size={18} className="mr-2"/> 保存修改 (Save)
                  </button>
                </div>
              ) : (
                <>
                  {/* Introduction Display */}
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
                    onClick={() => window.open(mapUrl, '_blank')}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black shadow-lg hover:brightness-110 transition-all active:scale-95 group"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <Navigation size={20} className="fill-current group-hover:scale-110 transition-transform" />
                    使用Google Maps导航 (Navigate)
                  </button>

                  {/* Branches Display (For Chain Restaurants) */}
                  {restaurant.branches && restaurant.branches.length > 0 && (
                    <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MapPin size={14} className="text-red-500" />
                            {t('modal.branches', '分行列表 (Branches)')}
                        </p>
                        <div className="space-y-2">
                            {restaurant.branches.map((branch, idx) => (
                                <div key={idx} className="bg-[#1a1a1a] rounded-lg border border-gray-600 p-3 flex flex-col">
                                    <span className="text-gray-200 text-sm font-bold block mb-1">{branch.name}</span>
                                    {branch.address && (
                                        <div className="flex items-start text-xs text-gray-500">
                                            <MapPin size={12} className="mt-0.5 mr-1 shrink-0 opacity-70" />
                                            <span>{branch.address}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* Sub Stalls Display (For Kopitiams) */}
                  {restaurant.subStalls && Array.isArray(restaurant.subStalls) && restaurant.subStalls.length > 0 && (
                    <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <UtensilsCrossed size={14} className="text-yellow-500" />
                            {t('modal.stalls', '咖啡店档口 (Stalls)')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {restaurant.subStalls.map((stall, idx) => {
                                if (!stall) return null;
                                const stallName = typeof stall === 'object' ? stall.name : stall;
                                const stallImage = typeof stall === 'object' ? stall.image : null;

                                return (
                                <div 
                                    key={idx} 
                                    className="bg-[#1a1a1a] rounded-lg border border-gray-600 overflow-hidden flex flex-col group/stall"
                                    onDoubleClick={() => stallImage && setZoomedImage(stallImage)}
                                    title={stallImage ? "双击放大查看菜单 (Double click to zoom)" : ""}
                                >
                                    <div className="h-24 w-full bg-gray-800 relative cursor-pointer">
                                        {stallImage ? (
                                            <>
                                                <ImageWithFallback 
                                                    src={stallImage} 
                                                    alt={stallName}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/stall:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover/stall:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover/stall:opacity-100 text-white text-[10px] bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm transition-opacity">
                                                        双击放大 (Double Click)
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <UtensilsCrossed size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <span className="text-gray-200 text-sm font-bold block truncate" title={stallName}>{stallName}</span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 mb-1">
                 {restaurant.menu_link && (
                    <a href={restaurant.menu_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <BookOpen size={18} className="mb-1 text-blue-400"/>
                        <span className="text-[10px] font-bold">{t('modal.menu', '菜单 (Menu)')}</span>
                    </a>
                 )}
                 {restaurant.website_link && (
                    <a href={restaurant.website_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <Globe size={18} className="mb-1 text-purple-400"/>
                        <span className="text-[10px] font-bold">{t('modal.website', '网站 (Web)')}</span>
                    </a>
                 )}
                 {restaurant.delivery_link && (
                    <a href={restaurant.delivery_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-white transition border border-gray-700">
                        <Bike size={18} className="mb-1 text-green-400"/>
                        <span className="text-[10px] font-bold">{t('modal.delivery', '外卖 (Order)')}</span>
                    </a>
                 )}
              </div>

              <div className="flex gap-2 w-full">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-3 bg-white hover:bg-gray-200 text-black rounded-xl font-bold transition shadow-lg shadow-white/10"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    {t('modal.navigate', 'Google Maps')}
                  </a>
                  {restaurant.location?.lat && restaurant.location?.lng && (
                     <a
                        href={`https://waze.com/ul?ll=${restaurant.location.lat},${restaurant.location.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center py-3 bg-[#33ccff] hover:bg-[#33ccff]/90 text-black rounded-xl font-bold transition shadow-lg shadow-blue-400/10"
                     >
                        <Navigation size={18} className="mr-2 fill-current" />
                        Waze
                     </a>
                  )}
              </div>
            </div>

            <hr className="border-gray-700" />

            {/* Reviews */}
            <div>
              <h3 className="font-bold text-white mb-4 text-lg">食客评价 (Reviews)</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-6 pr-1 custom-scrollbar">
                {restaurant.reviews && restaurant.reviews.length > 0 ? (
                  restaurant.reviews.map((review, idx) => (
                    <div key={idx} className="bg-[#2d2d2d] p-3 rounded-xl shadow-sm border border-gray-700 relative group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white text-sm">{review.user}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">{review.date}</span>
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("确定删除这条评论吗？(Delete Review?)")) {
                                            onDeleteReview(restaurant.id, idx);
                                        }
                                    }}
                                    className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="删除评论"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 bg-white/5 rounded-xl border border-dashed border-gray-700">
                      <p className="text-gray-500 italic text-sm">暂无评价，快来抢沙发！</p>
                  </div>
                )}
              </div>

              {/* Add Review */}
              <form onSubmit={handleSubmitReview} className="bg-[#2d2d2d] p-4 rounded-xl shadow-sm border border-gray-700">
                <p className="text-sm font-bold text-white mb-3">写条评论...</p>
                <input
                  type="text"
                  placeholder="您的昵称 (Name)"
                  className="w-full bg-[#1a1a1a] border-b border-gray-600 py-2 mb-3 text-sm text-white focus:border-white outline-none"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                />
                <textarea
                  placeholder="味道如何？(Comment)"
                  className="w-full bg-[#1a1a1a] border-b border-gray-600 py-2 mb-3 text-sm text-white focus:border-white outline-none resize-none"
                  rows="2"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition flex items-center justify-center"
                >
                  <Send size={14} className="mr-2" />
                  提交评价 (Submit)
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Zoomed Image Overlay */}
      {zoomedImage && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setZoomedImage(null)}
        >
            <div className="relative max-w-full max-h-full flex flex-col items-center">
                <img 
                    src={zoomedImage} 
                    alt="Zoomed Stall" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-gray-700"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                />
                <p className="text-white/70 text-sm mt-4 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                    点击任意处关闭 (Click anywhere to close)
                </p>
                <button 
                    onClick={() => setZoomedImage(null)}
                    className="absolute top-[-40px] right-0 md:top-4 md:right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition backdrop-blur-md"
                >
                    <X size={24} />
                </button>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
