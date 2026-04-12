import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, MapPin, Tag, Link as LinkIcon, Edit3, Globe, Bike, BookOpen, Send, User, Sprout, Leaf, UtensilsCrossed, Upload, Star } from 'lucide-react';
import { useToast } from './toast/ToastProvider';
import { compressImage } from '../utils/imageUtils';

export const AVAILABLE_AREAS = [
    'kulai', 'saleng', 'senai', 'indahpura', 'kelapa_sawit', 'sedenak', 'bukit_batu', 'ayamas'
];

const HALAL_OPTIONS = [
  { value: 'non_halal', label: 'Non-Halal (非清真/未标注)' },
  { value: 'certified', label: 'Halal Certified (官方认证)' },
  { value: 'muslim_owned', label: 'Muslim Owned (穆斯林经营)' },
  { value: 'no_pork', label: 'No Pork No Lard (不含猪肉/猪油)' }
];

const DEFAULT_EDIT_FORM = {
    name: '',
    name_en: '',
    address: '', 
    menu_link: '',
    website_link: '',
    delivery_link: '',
    affiliate_url: '',
    opening_hours: '',
    price_range: '',
    image: '',
    categories: [],
    isVegetarian: false,
    isNoBeef: false,
    halalStatus: 'non_halal',
    manualStatus: 'auto',
    subStalls: [],
    rating: 0,
    area: '',
    intro_zh: '',
    intro_en: '',
    tags: [],
    tagsInput: '',
    subscriptionLevel: 0,
    priority: 0,
    whatsappLink: "",
    location: { lat: '', lng: '' },
    dietaryOption: null
};

// Database columns vs Extra details fields
const DB_COLUMNS = [
  'id', 'source_restaurant_id', 'name', 'category', 'address', 'image_url',
  'hot_score', 'is_featured', 'is_active', 'is_hidden', 'sort_priority',
  'badge_label', 'ad_label', 'affiliate_url', 'updated_at'
];

const AdminRestaurantEditModal = ({ isOpen, onClose, restaurant, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({ ...DEFAULT_EDIT_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        name: restaurant.name || '',
        name_en: restaurant.name_en || '',
        address: restaurant.address || '',
        menu_link: restaurant.menu_link || '',
        website_link: restaurant.website_link || '',
        delivery_link: restaurant.delivery_link || '',
        affiliate_url: restaurant.affiliate_url || '',
        opening_hours: restaurant.opening_hours || '',
        price_range: restaurant.price_range || '',
        image: restaurant.image || restaurant.image_url || '',
        categories: restaurant.categories || [],
        isVegetarian: restaurant.isVegetarian || false,
        isNoBeef: restaurant.isNoBeef || false,
        halalStatus: restaurant.halalStatus || 'non_halal',
        manualStatus: restaurant.manualStatus || 'auto',
        subStalls: (restaurant.subStalls || []).map(s => {
            if (typeof s === 'string') return { name: s, image: '', tags: [], tagsInput: '' };
            return {
                ...s,
                tags: s.tags || [],
                tagsInput: (s.tags || []).join(', ')
            };
        }),
        rating: restaurant.rating !== undefined ? restaurant.rating : 0,
        area: restaurant.area || '',
        intro_zh: restaurant.intro_zh || '',
        intro_en: restaurant.intro_en || '',
        tags: restaurant.tags || [],
        tagsInput: (restaurant.tags || []).join(', '),
        subscriptionLevel: restaurant.subscriptionLevel || 0,
        priority: restaurant.priority || 0,
        whatsappLink: restaurant.whatsappLink || "",
        location: restaurant.location || { lat: '', lng: '' },
        dietaryOption: restaurant.dietaryOption || null
      });
    } else if (!restaurant && isOpen) {
        // Create mode
        setFormData({ ...DEFAULT_EDIT_FORM });
    }
  }, [restaurant, isOpen]);

  const handleToggleCategory = (cat) => {
    setFormData(prev => {
      const cats = prev.categories || [];
      if (cats.includes(cat)) return { ...prev, categories: cats.filter(c => c !== cat) };
      return { ...prev, categories: [...cats, cat] };
    });
  };

  const handleImageUpload = async (e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      
      if (index !== null && field === 'image') {
         const newStalls = [...formData.subStalls];
         newStalls[index] = { ...newStalls[index], image: compressed };
         setFormData(prev => ({ ...prev, subStalls: newStalls }));
      } else {
         setFormData(prev => ({ ...prev, [field]: compressed }));
      }
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("压缩图片失败");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('商家名称不能为空');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Clean form data
      const cleanedSubStalls = formData.subStalls.map(({ tagsInput, ...rest }) => rest);
      const cleanedForm = {
        ...formData,
        subStalls: cleanedSubStalls
      };
      delete cleanedForm.tagsInput;

      // 2. Separate into explicit DB columns and extra_details jsonb
      const payload = {
        name: cleanedForm.name,
        address: cleanedForm.address,
        category: cleanedForm.categories.join(' | '),
        image_url: cleanedForm.image,
        affiliate_url: cleanedForm.affiliate_url,
      };

      const extra_details = {};
      for (const key in cleanedForm) {
          if (!DB_COLUMNS.includes(key)) {
             extra_details[key] = cleanedForm[key];
          }
      }
      payload.extra_details = extra_details;

      if (!restaurant) {
          // Creating New
          await onSave(null, payload, true);
      } else {
          // Updating Existing
          await onSave(restaurant.id, payload, false);
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-[600px] flex flex-col h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 size={18} className="text-orange-400" />
            {restaurant ? '高级编辑商家资料 (Admin Edit)' : '创建新商家 (Create Restaurant)'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Base Fields */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-sm font-bold text-orange-400 border-b border-white/10 pb-2">【基础信息 Base Info】</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">店名 (中文名称)</label>
                        <input 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">English Name</label>
                        <input 
                            value={formData.name_en}
                            onChange={e => setFormData({...formData, name_en: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> 营业地址 (Address)</label>
                    <textarea 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none min-h-[60px]"
                    />
                </div>
                
                <div>
                    <label className="text-xs text-gray-400">地区 (Area)</label>
                    <select
                        value={formData.area || ''}
                        onChange={e => setFormData({...formData, area: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    >
                        <option value="">(未选择地区)</option>
                        {AVAILABLE_AREAS.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400">精准坐标 (Location GPS)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Lat (Latitude)"
                            value={formData.location?.lat || ''}
                            onChange={e => setFormData({...formData, location: { ...formData.location, lat: e.target.value }})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="Lng (Longitude)"
                            value={formData.location?.lng || ''}
                            onChange={e => setFormData({...formData, location: { ...formData.location, lng: e.target.value }})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1">🔗 图片链接 (Image URL)</label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 flex flex-col gap-1">
                          <input 
                            value={formData.image}
                            onChange={e => setFormData({...formData, image: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="https://..."
                          />
                          <label className="cursor-pointer flex items-center gap-1 bg-[#333] px-2 py-1 rounded text-xs text-gray-300 hover:bg-[#444] transition border border-gray-600 w-fit">
                             <Upload size={12} />
                             <span>本地上传 (压缩)</span>
                             <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden"
                                 onChange={(e) => handleImageUpload(e, 'image')}
                             />
                          </label>
                      </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400">分类多选 (Categories)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleToggleCategory(cat)}
                          className="px-2 py-0.5 rounded text-xs font-bold border bg-white text-black border-white"
                        >
                          {cat} ×
                        </button>
                      ))}
                      <div className="flex gap-1 ml-2">
                        <input 
                          type="text" 
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          placeholder="新分类..."
                          className="bg-[#1a1a1a] border border-gray-600 rounded px-2 py-0.5 text-xs text-white outline-none w-24"
                        />
                        <button
                          onClick={() => {
                              if (newCatName.trim()) {
                                  handleToggleCategory(newCatName.trim());
                                  setNewCatName('');
                              }
                          }}
                          className="px-2 py-0.5 rounded text-xs border border-gray-300 text-gray-300 hover:text-white"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                </div>
            </div>

            {/* Content Details */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-sm font-bold text-cyan-400 border-b border-white/10 pb-2">【详细内容 Detailed Content】</p>
                <div>
                    <label className="text-xs text-gray-400">中文简介 (Chinese Intro)</label>
                    <textarea 
                        value={formData.intro_zh}
                        onChange={e => setFormData({...formData, intro_zh: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none min-h-[60px]"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400">英文简介 (English Intro)</label>
                    <textarea 
                        value={formData.intro_en}
                        onChange={e => setFormData({...formData, intro_en: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none min-h-[60px]"
                    />
                </div>
                
                <div>
                    <label className="text-xs text-gray-400">营业时间 (Opening Hours Text)</label>
                    <textarea 
                        value={formData.opening_hours}
                        onChange={e => setFormData({...formData, opening_hours: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none min-h-[80px]"
                        placeholder="Monday: 10:00am - 10:00pm&#10;Tuesday: Closed"
                    />
                </div>
                
                <div>
                    <label className="text-xs text-gray-400">AI 搜索标签 (Search Tags，逗号分隔)</label>
                    <input 
                      value={formData.tagsInput}
                      onChange={e => {
                          const val = e.target.value;
                          setFormData({
                              ...formData, 
                              tagsInput: val,
                              tags: val.split(/[,，]/).map(t => t.trim()).filter(Boolean)
                          });
                      }}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                      placeholder="适合小孩, 平价, 冷气..."
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400">手工打分 (Rating / 5.0)</label>
                    <input 
                      type="number" step="0.1"
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    />
                </div>
            </div>
            
            {/* Special Checks */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-sm font-bold text-emerald-400 border-b border-white/10 pb-2">【饮食与宗教 Dietary & Religion】</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Halal 清真状态</label>
                    <select
                        value={formData.halalStatus || 'non_halal'}
                        onChange={(e) => setFormData({...formData, halalStatus: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    >
                        {HALAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">素食选项</label>
                    <select
                        value={formData.dietaryOption || ''}
                        onChange={(e) => setFormData({...formData, dietaryOption: e.target.value || null})}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    >
                        <option value="">None (无)</option>
                        <option value="vegetarian_friendly">Veg-Friendly (提供素食选项)</option>
                        <option value="vegetarian_only">Vegetarian Only (纯素食)</option>
                    </select>
                  </div>
                </div>
            </div>

            {/* External Links */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-sm font-bold text-amber-400 border-b border-white/10 pb-2 flex items-center gap-1"><LinkIcon size={14}/>【引流与跳转 External Links】</p>
                
                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1"><BookOpen size={10}/> 菜单 Menu Link</label>
                    <input 
                      value={formData.menu_link}
                      onChange={e => setFormData({...formData, menu_link: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1"><Globe size={10}/> 网站 Website Link</label>
                    <input 
                      value={formData.website_link}
                      onChange={e => setFormData({...formData, website_link: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1"><Send size={10}/> WhatsApp Link</label>
                    <input 
                      value={formData.whatsappLink}
                      onChange={e => setFormData({...formData, whatsappLink: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 flex items-center gap-1"><Bike size={10}/> 私人外卖点餐 Link</label>
                    <input 
                      value={formData.delivery_link}
                      onChange={e => setFormData({...formData, delivery_link: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-orange-400 font-bold flex items-center gap-1">💰 分销专区 ShopeeFood Affiliate URL</label>
                    <input 
                      value={formData.affiliate_url}
                      onChange={e => setFormData({...formData, affiliate_url: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-orange-500/50 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 outline-none"
                    />
                </div>
            </div>

            {/* VIP Ads */}
            <div className="space-y-4 bg-amber-900/20 p-4 rounded-xl border border-amber-900/50">
                <p className="text-sm font-bold text-amber-500 border-b border-amber-900/50 pb-2 flex items-center gap-1"><Star size={14}/>【商业化广告 VIP Ads】</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">会员级别 Subscription Level</label>
                        <select
                            value={formData.subscriptionLevel}
                            onChange={(e) => setFormData({...formData, subscriptionLevel: parseInt(e.target.value)})}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                        >
                            <option value={0}>0 - Free (免费)</option>
                            <option value={1}>1 - VIP Basic</option>
                            <option value={2}>2 - Mid Tier</option>
                            <option value={3}>3 - Top Tier</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">权重 Priority</label>
                        <input 
                          type="number"
                          value={formData.priority}
                          onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                          className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-black/40 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-orange-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                云端同步中...
              </>
            ) : (
              <>
                <Save size={16} /> 保存所有资料并生效
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantEditModal;
