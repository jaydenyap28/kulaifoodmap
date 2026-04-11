import React from 'react';
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

const SortableRestaurantCard = ({ restaurant, renderRestaurantCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: restaurant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      {renderRestaurantCard(restaurant, {
        dragHandleProps: { ...attributes, ...listeners },
      })}
    </div>
  );
};

const AdminSortableRestaurantGrid = ({ restaurants, renderRestaurantCard, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    const oldIndex = restaurants.findIndex((restaurant) => restaurant.id === active.id);
    const newIndex = restaurants.findIndex((restaurant) => restaurant.id === over.id);
    onReorder(arrayMove(restaurants, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={restaurants} strategy={rectSortingStrategy}>
        {restaurants.map((restaurant) => (
          <SortableRestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            renderRestaurantCard={renderRestaurantCard}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default AdminSortableRestaurantGrid;
