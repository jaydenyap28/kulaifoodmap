import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Edit2, Trash2, ArrowUp, Search, Plus, Leaf, Sprout, Ban, Star, GripVertical, Flame, Medal, MessageCircle, Mic, MicOff, Loader2 } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import ImageWithFallback from './ImageWithFallback';
import { checkOpenStatus } from '../utils/businessHours';

import { AVAILABLE_AREAS } from '../data/constants';

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

const RestaurantList = ({ restaurants, allRestaurants, isAdmin, onUpdateRestaurant, onDeleteRestaurant, onRestaurantClick, onAddRestaurant, onCategoryClick, onReorder, onUpdateArea }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [seed] = useState(Date.now());
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    if (isListening) {
      if (window.speechRecognitionInstance) {
        window.speechRecognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    window.speechRecognitionInstance = recognition;
    
    recognition.lang = i18n.language === 'en' ? 'en-US' : 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setSearchTerm('');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setSearchTerm(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Filter and Sort Logic
  const filteredRestaurants = useMemo(() => {
    const filtered = restaurants.filter(restaurant => {
      const term = searchTerm.toLowerCase();
      return (
          (restaurant.name || '').toLowerCase().includes(term) ||
          (restaurant.name_en || '').toLowerCase().includes(term) ||
          (restaurant.address || '').toLowerCase().includes(term) || // Search Address
          (restaurant.area || '').toLowerCase().includes(term) || // Search Area explicitly
          (restaurant.dietaryOption && (term.includes('素') || term.includes('veg'))) || // Search Dietary Option
          (restaurant.categories && restaurant.categories.some(c => (c || '').toLowerCase().includes(term))) ||
          (restaurant.branches && restaurant.branches.some(b => (b.name || '').toLowerCase().includes(term))) || // Search Branches
          (restaurant.subStalls && restaurant.subStalls.some(s => { // Search SubStalls
             const sName = typeof s === 'object' ? s.name : s;
             return (sName || '').toLowerCase().includes(term);
          }))
      );
    });

    return filtered.sort((a, b) => a.id - b.id);
  }, [restaurants, searchTerm, isAdmin, seed]);

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


  return (
    <div className="w-full px-4 pb-20 relative">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-sm py-6 mb-8 border-b border-gray-800 -mx-4 px-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-1.5 bg-white rounded-full"></div>
             <h3 className="text-white font-bold text-2xl">
                {t('list.title')} <span className="text-base text-gray-500 font-normal">({filteredRestaurants.length})</span>
             </h3>
             {isAdmin && (
                <div className="flex gap-2">
                    <button 
                      onClick={onAddRestaurant}
                      className="ml-3 flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-sm rounded-full hover:bg-gray-200 transition-colors shadow-sm font-medium"
                    >
                      <Plus size={16} /> {t('list.add_restaurant')}
                    </button>
                </div>
             )}
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder={isListening ? (i18n.language === 'en' ? 'Listening...' : '正在听...') : t('list.search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-12 py-3 bg-[#1e1e1e] border ${isListening ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700'} rounded-full text-base text-gray-200 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder-gray-600`}
            />
            <button
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                title={isListening ? "Stop Listening" : "Voice Search"}
            >
                <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
            </button>
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
                  onUpdateArea={onUpdateArea}
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
              onUpdateArea={onUpdateArea}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {filteredRestaurants.length === 0 && (
        <div className="text-center py-20 bg-[#1e1e1e] rounded-3xl border border-[#333]">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('list.no_results')}</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
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

const RestaurantCard = ({ restaurant, isAdmin, onUpdate, onDelete, onClick, onCategoryClick, onUpdateArea }) => {
  const { t, i18n } = useTranslation();
  const openStatus = restaurant.manualStatus && restaurant.manualStatus !== 'auto'
    ? { 
        isOpen: restaurant.manualStatus === 'open', 
        text: restaurant.manualStatus === 'open' ? '营业中 (Open)' : '已休息 (Closed)' 
      }
    : checkOpenStatus(restaurant.opening_hours);
  
  const isVIP = (restaurant.subscriptionLevel || 0) > 0;
  const borderClass = isVIP ? 'border-amber-500/50 shadow-amber-900/10' : 'border-gray-800';

  return (
    <div 
      onClick={onClick}
      className={`bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 relative group h-full flex flex-col border select-none cursor-pointer ${borderClass} ${isVIP ? 'hover:-translate-y-1' : ''}`}
    >
      {/* Image Header: Aspect Ratio 16/9 for better mobile view */}
      <div className="aspect-video w-full relative bg-gray-800 overflow-hidden shadow-inner shrink-0">
        <ImageWithFallback 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60"></div>
        
        {/* VIP Badge */}
        {isVIP && (
             <div className="absolute top-0 right-0 z-20 flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm">
                {restaurant.subscriptionLevel >= 3 ? <Flame size={12} className="fill-white" /> : <Medal size={12} className="fill-white" />}
                <span>{restaurant.subscriptionLevel >= 3 ? 'FEATURED' : '精选'}</span>
             </div>
        )}

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
                    title={t('list.edit')}
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(t('list.confirm_delete'))) {
                        onDelete(restaurant.id);
                      }
                    }}
                    className="bg-black/50 p-2 rounded-full text-red-400 hover:text-red-600 shadow-sm backdrop-blur-sm"
                    title={t('list.delete')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )}

        {/* Status Badge (Over Image) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm backdrop-blur-md ${
                openStatus.isOpen 
                ? 'bg-emerald-600/90 text-white' 
                : 'bg-red-600/90 text-white'
            }`}>
                {openStatus.isOpen ? t('list.status_open') : t('list.status_closed')}
            </span>
        </div>
      </div>

      {/* Content Section - Separate from Image for Mobile Clarity */}
      <div className="p-4 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-1">
                <div className="flex-1 mr-2">
                    <h3 className="font-bold text-lg leading-tight text-white line-clamp-2">
                        {i18n.language === 'en' && restaurant.name_en ? restaurant.name_en : restaurant.name}
                    </h3>
                </div>
                {/* Rating Badge */}
                <div className="flex items-center bg-[#2d2d2d] border border-gray-700 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-bold shadow-sm shrink-0">
                    <Star size={10} className="fill-yellow-400 mr-1" /> {restaurant.rating}
                </div>
            </div>

            {/* English Name / Desc2 */}
            {restaurant.name_en && (
                <p className="text-xs text-gray-400 font-medium leading-tight mb-3 line-clamp-1">
                    {restaurant.name_en}
                </p>
            )}

            {/* Tags Row */}
            {(restaurant.categories?.length > 0 || restaurant.isVegetarian || (restaurant.halalStatus && restaurant.halalStatus !== 'non_halal')) && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {/* Categories */}
                    {restaurant.categories && restaurant.categories.slice(0, 3).map(cat => (
                        <span 
                            key={cat}
                            onClick={(e) => {
                                e.stopPropagation();
                                if(onCategoryClick) onCategoryClick(cat);
                            }}
                            className="px-1.5 py-0.5 bg-[#2d2d2d] hover:bg-gray-700 text-gray-300 text-[10px] rounded border border-gray-700 cursor-pointer transition-colors leading-none"
                        >
                            {cat}
                        </span>
                    ))}
                    
                    {/* Dietary Options */}
                    {(restaurant.dietaryOption === 'vegetarian_only' || restaurant.isVegetarian) ? (
                        <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800 text-[10px] rounded flex items-center gap-1 leading-none">
                            <Leaf size={10} /> 纯素食
                        </span>
                    ) : restaurant.dietaryOption === 'vegetarian_friendly' ? (
                        <span className="px-1.5 py-0.5 bg-lime-900/50 text-lime-400 border border-lime-800 text-[10px] rounded flex items-center gap-1 leading-none">
                            <Sprout size={10} /> 提供素食选项
                        </span>
                    ) : null}

                    {/* Halal Status */}
                    {restaurant.halalStatus === 'certified' && (
                        <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800 text-[10px] rounded flex items-center gap-1 leading-none">
                            ✅ {t('filter.halal_options.certified')}
                        </span>
                    )}
                    {restaurant.halalStatus === 'muslim_owned' && (
                        <span className="px-1.5 py-0.5 bg-green-900/50 text-green-400 border border-green-800 text-[10px] rounded flex items-center gap-1 leading-none">
                            ☪️ {t('filter.halal_options.muslim_owned')}
                        </span>
                    )}
                    {restaurant.halalStatus === 'no_pork' && (
                        <span className="px-1.5 py-0.5 bg-orange-900/50 text-orange-400 border border-orange-800 text-[10px] rounded flex items-center gap-1 leading-none">
                            🍖 {t('filter.halal_options.no_pork')}
                        </span>
                    )}
                </div>
            )}

            {/* Admin Area Selector */}
            {isAdmin && onUpdateArea && (
                <div className="mb-2" onClick={e => e.stopPropagation()}>
                    <select
                        value={restaurant.area || ''}
                        onChange={(e) => onUpdateArea(restaurant.id, e.target.value)}
                        className="w-full bg-[#333] text-white text-xs p-1 rounded border border-gray-600 focus:outline-none focus:border-white"
                    >
                        <option value="">Select Area...</option>
                        {AVAILABLE_AREAS.map(area => (
                            <option key={area} value={area}>{t(`areas.${area}`, area)}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Divider */}
            <div className="mt-auto pt-2 border-t border-gray-800/50 flex flex-col gap-2">
                {/* Sub Stalls Preview */}
                {restaurant.subStalls && Array.isArray(restaurant.subStalls) && restaurant.subStalls.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {restaurant.subStalls.slice(0, 2).map((stall, idx) => {
                            if (!stall) return null;
                            const displayName = typeof stall === 'object' ? stall.name : stall;
                            if (!displayName) return null;
                            return (
                                <span key={idx} className="text-[10px] text-gray-400 bg-[#252525] px-1.5 py-0.5 rounded border border-gray-800 leading-none">
                                • {displayName}
                                </span>
                            );
                        })}
                        {restaurant.subStalls.length > 2 && (
                            <span className="text-[10px] text-gray-500 self-center">+{restaurant.subStalls.length - 2}</span>
                        )}
                    </div>
                )}

                {/* Branches Preview */}
                {restaurant.branches && Array.isArray(restaurant.branches) && restaurant.branches.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                        {restaurant.branches.slice(0, 2).map((branch, idx) => (
                            <div key={idx} className="flex items-start gap-1 text-[10px] text-gray-400">
                                <MapPin size={10} className="mt-0.5 shrink-0" />
                                <span className="line-clamp-1">{branch.name}</span>
                            </div>
                        ))}
                         {restaurant.branches.length > 2 && (
                            <span className="text-[10px] text-gray-500 ml-3.5">+{restaurant.branches.length - 2} more branches</span>
                        )}
                    </div>
                )}
                
                {/* Address */}
                <div className="flex items-start text-xs text-gray-400">
                    <MapPin size={12} className="mt-0.5 mr-1.5 shrink-0 opacity-70" />
                    <span className="line-clamp-2 leading-tight">{restaurant.address}</span>
                </div>

                {/* WhatsApp Button for VIP */}
                {isVIP && restaurant.whatsappLink && (
                    <a 
                        href={restaurant.whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-600/30 hover:border-green-600 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
                    >
                        <MessageCircle size={14} /> {t('contact_merchant', '联系商家')}
                    </a>
                )}
            </div>
      </div>
    </div>
  );
};

export default RestaurantList;
