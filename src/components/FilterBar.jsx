import React, { useRef, useState } from 'react';
import { Settings, Plus, X, Edit2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FilterBar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  onAddCategory,
  onDeleteCategory,
  isAdmin,
  showOpenOnly,
  onToggleShowOpenOnly
}) => {
  const { t } = useTranslation();
  const scrollContainer = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 mb-4 relative z-20">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" ref={scrollContainer}>
        
        {/* Admin Tools - Moved to Front for Visibility */}
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0 border-r pr-2 border-gray-700 mr-2">
            <button
              onClick={() => {
                const newCat = prompt(t('filter.enter_new_cat'));
                if (newCat && newCat.trim()) {
                  onAddCategory(newCat.trim());
                }
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#1e1e1e] text-white border border-dashed border-gray-600 hover:border-white transition-colors text-sm font-medium"
              title={t('filter.add_category')}
            >
              <Plus size={14} /> {t('filter.add_category')}
            </button>
             <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-full border transition-colors ${
                isEditMode 
                  ? 'bg-red-900/50 text-red-500 border-red-800' 
                  : 'bg-[#1e1e1e] text-gray-500 border-gray-700 hover:text-gray-300'
              }`}
              title={isEditMode ? t('filter.done_edit') : t('filter.manage_category')}
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}

        {/* Reset / All */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-5 py-2 rounded-full text-base font-medium transition-all ${
            selectedCategory === null
              ? 'bg-white text-black border-white'
              : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#2d2d2d] border-[#333]'
          } shadow-sm border`}
        >
          {t('filter.all')}
        </button>

        {/* Show Open Only */}
        <button
          onClick={onToggleShowOpenOnly}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            showOpenOnly
              ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50 ring-1 ring-emerald-500/50'
              : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2d2d2d] border-[#333]'
          } border`}
        >
          <Clock size={14} className={showOpenOnly ? "fill-current" : ""} />
          {t('filter.open_now')}
        </button>

        <div className="w-px h-6 bg-gray-700 mx-2 shrink-0"></div>

        {/* Categories */}
        {categories.map(cat => (
          <div key={cat} className="relative shrink-0">
            <button
              onClick={() => onSelectCategory(cat === selectedCategory ? null : cat)}
              className={`px-5 py-2 rounded-full text-base font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-black border-white'
                  : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#2d2d2d] border-[#333]'
              } shadow-sm border`}
            >
              {t(`categories.${cat}`, cat)}
            </button>
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(t('filter.confirm_delete_cat', { cat }))) {
                    onDeleteCategory(cat);
                  }
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

      </div>
    </div>
  );
};

export default FilterBar;
