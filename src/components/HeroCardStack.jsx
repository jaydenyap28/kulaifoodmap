import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Star, Coffee } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const HeroCardStack = ({ restaurants, onChoose, onSupportClick }) => {
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showWinner, setShowWinner] = useState(false);

  // Shuffle Logic
  useEffect(() => {
    let interval;
    if (isShuffling) {
      interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % restaurants.length);
      }, 80); // Fast shuffle

      // Stop after 2-3 seconds
      const stopTime = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setIsShuffling(false);
        clearInterval(interval);
        const winnerIndex = Math.floor(Math.random() * restaurants.length);
        setActiveIndex(winnerIndex);
        setShowWinner(true);
        onChoose(restaurants[winnerIndex]);
      }, stopTime);
    }
    return () => clearInterval(interval);
  }, [isShuffling, restaurants, onChoose]);

  const isNotEnough = restaurants.length < 2;

  const handleStart = () => {
    if (isShuffling || isNotEnough) return;
    setShowWinner(false);
    setIsShuffling(true);
  };

  // Card Variants
  const cardVariants = {
    initial: { scale: 0.9, y: 20, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    hover: { y: -5 }
  };

  const currentRestaurant = restaurants[activeIndex];

  // Reset index if out of bounds (Safety Check)
  useEffect(() => {
    if (restaurants && restaurants.length > 0 && activeIndex >= restaurants.length) {
      setActiveIndex(0);
    }
  }, [restaurants, activeIndex]);

  // Safety check: If index is out of bounds or restaurant is undefined
  if (!currentRestaurant) return null;

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="relative w-full max-w-sm h-[550px] flex flex-col items-center justify-center perspective-1000">
      {/* Card Area */}
      <div className="relative w-full h-[450px] mb-8">
        <AnimatePresence mode='wait'>
          <motion.div
            key={isShuffling ? activeIndex : 'winner'}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className={`
              absolute inset-0 rounded-[24px] overflow-hidden shadow-2xl bg-[#1e1e1e] border-4 border-gray-800
              ${showWinner ? 'ring-4 ring-gray-400 scale-105 z-20' : 'z-10'}
            `}
          >
            {/* Image */}
            <div className="h-full w-full relative bg-gray-800">
              <ImageWithFallback 
                src={currentRestaurant.image} 
                alt={currentRestaurant.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold leading-tight drop-shadow-lg">
                  {currentRestaurant.name}
                </h3>
                {/* Rating */}
                {currentRestaurant.rating && (
                    <div className="flex items-center gap-1 mt-1 mb-1">
                        <Star size={14} className="fill-purple-400 text-purple-400" />
                        <span className="text-purple-200 font-bold text-sm drop-shadow-md">{currentRestaurant.rating}</span>
                    </div>
                )}

                {/* Sub Stalls */}
                {currentRestaurant.subStalls && Array.isArray(currentRestaurant.subStalls) && currentRestaurant.subStalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {currentRestaurant.subStalls.slice(0, 3).map((stall, idx) => {
                            if (!stall) return null;
                            const displayName = typeof stall === 'object' ? stall.name : stall;
                            if (!displayName) return null;
                            
                            return (
                                <span key={idx} className="text-[10px] bg-purple-900/60 backdrop-blur-md text-purple-100 px-2 py-0.5 rounded-full border border-purple-500/30">
                                    {displayName}
                                </span>
                            );
                        })}
                    </div>
                )}
              </div>
            </div>
            
            {/* Winner Badge */}
            {showWinner && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20"
              >
                今日之选!
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Decorative Stack Behind */}
        {!showWinner && !isShuffling && (
          <>
            <div className="absolute inset-0 bg-gray-800 rounded-[24px] rotate-3 opacity-20 scale-95 translate-y-2 -z-10"></div>
            <div className="absolute inset-0 bg-gray-600 rounded-[24px] -rotate-3 opacity-20 scale-90 translate-y-4 -z-20"></div>
          </>
        )}
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center gap-4 relative z-30">
        <button
          onClick={handleStart}
          disabled={isShuffling || isNotEnough}
          className={`
            px-8 py-4 rounded-full text-xl font-bold text-white shadow-xl transition-all transform border border-white/10
            ${isShuffling || isNotEnough
              ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 shadow-purple-500/30'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {isShuffling ? (
              <span>洗牌中...</span>
            ) : isNotEnough ? (
              <span className="text-sm">商家不足以转动 (Need 2+)</span>
            ) : (
              <>
                <Shuffle size={24} />
                <span>今天吃什么？</span>
              </>
            )}
          </div>
        </button>

        {/* Secondary Support Button */}
        <button
           onClick={onSupportClick}
           className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-all text-xs font-medium border border-white/5"
        >
            <div className="bg-[#FFDD00] p-1 rounded-full text-[#3E2723]">
                <Coffee size={12} fill="currentColor" />
            </div>
            <span>觉得好用？请我喝杯 Kopi ☕️</span>
        </button>
      </div>
    </div>
  );
};

export default HeroCardStack;
