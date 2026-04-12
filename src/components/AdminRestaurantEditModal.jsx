import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, MapPin, Tag, Link as LinkIcon, Edit3 } from 'lucide-react';
import { useToast } from './toast/ToastProvider';

const AdminRestaurantEditModal = ({ isOpen, onClose, restaurant, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    image_url: '',
    affiliate_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        name: restaurant.name || '',
        category: restaurant.category || '',
        address: restaurant.address || '',
        image_url: restaurant.image_url || '',
        affiliate_url: restaurant.affiliate_url || '',
      });
    }
  }, [restaurant, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('商家名称不能为空');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(restaurant.id, formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 size={18} className="text-orange-400" />
            编辑商家资料
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 名称 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <Tag size={14} className="text-gray-500" /> 商家名称
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="输入商家名称"
            />
          </div>

          {/* 分类 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <Tag size={14} className="text-gray-500" /> 分类标签 (用 | 分隔)
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="例如: 华人餐 | 面食 | 晚餐"
            />
          </div>

          {/* 地址 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-500" /> 地址
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-500 resize-none"
              placeholder="输入完整地址"
            />
          </div>

          {/* 图片 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-gray-500" /> 图片链接
            </label>
            <input
              type="text"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="https://..."
            />
          </div>

          {/* 推广分销链接 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-orange-300 flex items-center gap-1.5">
              <LinkIcon size={14} className="text-orange-500" /> 联盟返利/分销链接 (Affiliate URL)
            </label>
            <input
              type="text"
              name="affiliate_url"
              value={formData.affiliate_url}
              onChange={handleChange}
              className="w-full rounded-xl border border-orange-500/30 bg-[#121212] px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="输入带有返利追踪代码的推广购买链接"
            />
            <p className="text-[11px] text-gray-500">
              如果填写此链接，用户点击商家卡片上的购买/更多信息等按钮时，将会跳转到这个分销链接。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-black/40 px-6 py-4">
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
                保存中...
              </>
            ) : (
              <>
                <Save size={16} /> 保存修改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantEditModal;
