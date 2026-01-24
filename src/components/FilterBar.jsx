import React, { useState } from 'react';
import { Plus, X, Edit2, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableCategoryChip = ({ cat, selectedCategory, onSelectCategory, onDeleteCategory, isEditMode, t, isAdmin }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isAdmin ? 'grab' : 'pointer',
    touchAction: 'none' 
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="relative shrink-0"
    >
      <button
        onClick={(e) => {
            if (isDragging) return;
            onSelectCategory(cat);
        }}
        className={`px-5 py-2 rounded-full text-base font-medium transition-all ${
          selectedCategory.includes(cat)
            ? 'bg-white text-black border-white'
            : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#2d2d2d] border-[#333]'
        } shadow-sm border select-none`}
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
          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10 cursor-pointer"
          onPointerDown={(e) => e.stopPropagation()} 
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

const FilterBar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  selectedArea,
  onSelectArea,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  isAdmin
}) => {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);

  // Common Areas from Data Analysis
  const AVAILABLE_AREAS = [
    'Indahpura',
    'Bandar Putra',
    'Kulai 21 Miles',
    'Saleng',
    'Kelapa Sawit'
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, 
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = categories.indexOf(active.id);
      const newIndex = categories.indexOf(over.id);
      if (onReorderCategories) {
          onReorderCategories(arrayMove(categories, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 mb-4 relative z-20 flex flex-col gap-3">
      
      {/* Container - Split into Left (All) and Right (Categories) for alignment */}
      <div className="flex flex-col gap-3">
        
        {/* Area Filter Row (New) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-[#333] text-sm text-gray-400 shrink-0">
                <MapPin size={14} className="text-orange-400" />
                <span className="font-bold">{t('filter.area_label')}</span>
            </div>
            
            <button
                onClick={() => onSelectArea(null)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    !selectedArea
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white border-[#333]'
                } border shadow-sm`}
            >
                {t('filter.all_areas')}
            </button>

            {AVAILABLE_AREAS.map(area => (
                <button
                    key={area}
                    onClick={() => onSelectArea(area === selectedArea ? null : area)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        selectedArea === area
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-[#1e1e1e] text-gray-400 hover:text-white border-[#333]'
                    } border shadow-sm`}
                >
                    {t(`areas.${area}`, area)}
                </button>
            ))}
        </div>

        <div className="flex flex-row items-start gap-2 pb-2">
        
        {/* Left: Admin Tools + All Button */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <div className="flex items-center gap-1 border-r pr-2 border-gray-700">
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
                <Plus size={14} />
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
              selectedCategory.length === 0
                ? 'bg-white text-black border-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#2d2d2d] border-[#333]'
            } shadow-sm border`}
          >
            {t('filter.all')}
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1 shrink-0"></div>
        </div>

        {/* Right: Sortable Categories (Wrapping) */}
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
          >
              <SortableContext 
                  items={categories} 
                  strategy={rectSortingStrategy}
              >
                  {categories.map(cat => (
                     <SortableCategoryChip 
                          key={cat}
                          cat={cat}
                          selectedCategory={selectedCategory}
                          onSelectCategory={onSelectCategory}
                          onDeleteCategory={onDeleteCategory}
                          isEditMode={isEditMode}
                          t={t}
                          isAdmin={isAdmin}
                     />
                  ))}
              </SortableContext>
          </DndContext>
        </div>

      </div>
    </div>
    </div>
  );
};

export default FilterBar;
