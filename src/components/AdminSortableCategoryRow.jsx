import React from 'react';
import { X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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

const SortableCategoryChip = ({ cat, selectedCategory, onSelectCategory, onDeleteCategory, isEditMode, t }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'manipulation',
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
        onClick={() => {
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
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm(t('filter.confirm_delete_cat', { cat }))) {
              onDeleteCategory(cat);
            }
          }}
          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10 cursor-pointer"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

const AdminSortableCategoryRow = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onDeleteCategory,
  isEditMode,
  onReorderCategories,
  t,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.indexOf(active.id);
    const newIndex = categories.indexOf(over.id);
    onReorderCategories?.(arrayMove(categories, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categories} strategy={rectSortingStrategy}>
        {categories.map((cat) => (
          <SortableCategoryChip
            key={cat}
            cat={cat}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            onDeleteCategory={onDeleteCategory}
            isEditMode={isEditMode}
            t={t}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default AdminSortableCategoryRow;
