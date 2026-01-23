import React, { useState, useEffect } from 'react';
import { MapPin, Edit2, Trash2, ArrowUp, Search, Plus, Leaf, Ban, Star, GripVertical } from 'lucide-react';
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
import ImageWithFallback from './ImageWithFallback';
import { checkOpenStatus } from '../utils/businessHours';

const SortableRestaurantCard = ({ restaurant, ...props }) => {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full touch-none">
      <RestaurantCard restaurant={restaurant} {...props} />
    </div>
  );
};

const RestaurantList = ({ restaurants, allRestaurants, isAdmin, onUpdateRestaurant, onDeleteRestaurant, onRestaurantClick, onAddRestaurant, onCategoryClick, onReorder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filter logic
  const filteredRestaurants = restaurants.filter(restaurant => {
    const term = searchTerm.toLowerCase();
    return (
        restaurant.name?.toLowerCase().includes(term) ||
        restaurant.name_en?.toLowerCase().includes(term) ||
        (restaurant.categories && restaurant.categories.some(c => c.toLowerCase().includes(term)))
    );
  });

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
      const oldIndex = restaurants.findIndex((r) => r.id === active.id);
      const newIndex = restaurants.findIndex((r) => r.id === over.id);
      
      const newOrder = arrayMove(restaurants, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  // Enable drag and drop only when Admin and showing full list (no search, no category filter)
  // We check if the current displayed list length matches the full list length as a proxy
  // or explicitly check if filters are active.
  const isReorderable = isAdmin && allRestaurants && restaurants.length === allRestaurants.length && !searchTerm;
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportData = () => {
      const exportData = restaurants.map(({ name, name_en, ...rest }) => ({
          ...rest,
          desc: name,
          desc2: name_en
      }));
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
          alert('数据已复制到剪贴板！请打开 src/data/restaurants.js 并粘贴覆盖原内容。\n(Data copied! Please paste into src/data/restaurants.js)');
      }).catch(err => {
          console.error('Failed to copy: ', err);
          alert('复制失败，请查看控制台 (Failed to copy)');
      });
  };

  return (
    <div className="w-full px-4 pb-20 relative">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-sm py-6 mb-8 border-b border-gray-800 -mx-4 px-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-1.5 bg-white rounded-full"></div>
             <h3 className="text-white font-bold text-2xl">
                全商家列表 <span className="text-base text-gray-500 font-normal">({filteredRestaurants.length})</span>
             </h3>
             {isAdmin && (
                <div className="flex gap-2">
                    <button 
                      onClick={onAddRestaurant}
                      className="ml-3 flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-sm rounded-full hover:bg-gray-200 transition-colors shadow-sm font-medium"
                    >
                      <Plus size={16} /> 添加商家
                    </button>
                </div>
             )}
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="搜索商家 / 菜品..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e1e] border border-gray-700 rounded-full text-base text-gray-200 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder-gray-600"
            />
          </div>
        </div>
      </div>
      
      {/* Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {isReorderable ? (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredRestaurants} 
              strategy={rectSortingStrategy}
            >
              {filteredRestaurants.map(restaurant => (
                <SortableRestaurantCard 
                  key={restaurant.id}
                  restaurant={restaurant} 
                  isAdmin={isAdmin} 
                  onUpdate={onUpdateRestaurant} 
                  onDelete={onDeleteRestaurant}
                  onClick={() => onRestaurantClick(restaurant)}
                  onCategoryClick={onCategoryClick}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          filteredRestaurants.map(restaurant => (
            <RestaurantCard 
              key={restaurant.id}
              restaurant={restaurant} 
              isAdmin={isAdmin} 
              onUpdate={onUpdateRestaurant} 
              onDelete={onDeleteRestaurant}
              onClick={() => onRestaurantClick(restaurant)}
              onCategoryClick={onCategoryClick}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {filteredRestaurants.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>没有找到相关商家...</p>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-4 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-all transform hover:scale-110 active:scale-95"
          aria-label="Back to Top"
        >
          <ArrowUp size={28} />
        </button>
      )}
    </div>
  );
};

const RestaurantCard = ({ restaurant, isAdmin, onUpdate, onDelete, onClick, onCategoryClick }) => {
  const openStatus = restaurant.manualStatus && restaurant.manualStatus !== 'auto'
    ? { 
        isOpen: restaurant.manualStatus === 'open', 
        text: restaurant.manualStatus === 'open' ? '营业中 (Open)' : '已休息 (Closed)' 
      }
    : checkOpenStatus(restaurant.opening_hours);

  return (
    <div 
      onClick={onClick}
      className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 relative group h-full flex flex-col border border-gray-800 select-none cursor-pointer"
    >
      {/* Compact Image Header: Aspect Ratio 4/3 */}
      <div className="aspect-[4/3] w-full relative bg-gray-800 overflow-hidden shadow-inner">
        <ImageWithFallback 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent opacity-90"></div>
        
        {/* Admin Controls - Floating Top Right */}
        {isAdmin && (
            <div 
              className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()} // Prevent card click
            >
                <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(); // Open Modal
                    }}
                    className="bg-black/50 p-2 rounded-full text-gray-300 hover:text-white shadow-sm backdrop-blur-sm"
                    title="编辑 (Open Details to Edit)"
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('确定删除这个商家吗？(Confirm delete?)')) {
                        onDelete(restaurant.id);
                      }
                    }}
                    className="bg-black/50 p-2 rounded-full text-red-400 hover:text-red-600 shadow-sm backdrop-blur-sm"
                    title="删除"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )}

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 text-white">
            <div className="flex justify-between items-end mb-1.5">
                <div className="flex-1 mr-2">
                    <h3 className="font-bold text-xl leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {restaurant.name}
                    </h3>
                    {restaurant.name_en && (
                        <p className="text-xs text-gray-300 font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-tight mt-1">
                            {restaurant.name_en}
                        </p>
                    )}
                </div>
                {/* Rating Badge */}
                <div className="flex items-center bg-white text-black px-2 py-0.5 rounded text-xs font-bold shadow-sm shrink-0 mb-1">
                    ★ {restaurant.rating}
                </div>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
                {/* Categories */}
                {restaurant.categories && restaurant.categories.map(cat => (
                    <span 
                        key={cat}
                        onClick={(e) => {
                            e.stopPropagation();
                            if(onCategoryClick) onCategoryClick(cat);
                        }}
                        className="px-2 py-0.5 bg-white/10 hover:bg-white hover:text-black text-gray-200 text-[10px] rounded backdrop-blur-md cursor-pointer transition-colors border border-white/10"
                    >
                        {cat}
                    </span>
                ))}
                
                {/* Features */}
                {restaurant.isVegetarian && (
                     <span className="px-2 py-0.5 bg-emerald-500/80 text-white text-[10px] rounded flex items-center gap-1" title="素食友好">
                        <Leaf size={10} /> 素食
                     </span>
                )}
                {restaurant.isNoBeef && (
                     <span className="px-2 py-0.5 bg-gray-700 text-white text-[10px] rounded flex items-center gap-1" title="不含牛肉">
                        <Ban size={10} /> 无牛
                     </span>
                )}
            </div>

            {/* Status & Price Row */}
            <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                <span className={`px-2 py-0.5 rounded-md ${
                    openStatus.isOpen 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                    {openStatus.isOpen ? '营业中' : '已打烊'}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">{restaurant.price_range}</span>
            </div>

            {/* Sub Stalls Preview */}
            {restaurant.subStalls && restaurant.subStalls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {restaurant.subStalls.slice(0, 3).map((stall, idx) => (
                        <span key={idx} className="text-[10px] text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                           • {stall.name || stall}
                        </span>
                    ))}
                    {restaurant.subStalls.length > 3 && (
                        <span className="text-[10px] text-gray-500 self-center">...等</span>
                    )}
                </div>
            )}
            
            {/* Address - Very subtle */}
            <div className="mt-2 flex items-start text-[10px] text-gray-400">
                <MapPin size={10} className="mt-0.5 mr-1.5 shrink-0 opacity-70" />
                <span className="line-clamp-1 leading-normal">{restaurant.address}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantList;
