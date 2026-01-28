import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Star, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageWithFallback from './ImageWithFallback';
import { analytics } from '../utils/analytics';
import { playSpinSound, playWinSound } from '../utils/audio';

const SlotReel = ({ restaurants, isShuffling, winner, onAnimationComplete }) => {
  const { i18n } = useTranslation();
  const reelRef = useRef(null);
  
  // Create a virtual reel: 20 random items + winner at end
  const [reelItems, setReelItems] = useState([]);
  
  useEffect(() => {
    if (isShuffling) {
      // Generate a sequence for the spin
      const sequence = [];
      for (let i = 0; i < 30; i++) {
        sequence.push(restaurants[Math.floor(Math.random() * restaurants.length)]);
      }
      setReelItems(sequence);
    } else if (winner) {
        // When stopping, ensure the winner is the last item appended + some buffer before
        // But to make it smooth, we rely on the parent logic.
        // Actually, for a true slot effect, we need a continuous strip.
        // Let's simplify:
        // While shuffling, we animate a long list.
        // When stopping, we snap to the winner.
    }
  }, [isShuffling, restaurants, winner]);

  // Framer Motion controls
  // We use a high negative Y value to scroll up
  
  return (
    <div className="w-full h-full bg-[#1e1e1e] relative overflow-hidden">
        {isShuffling ? (
             <motion.div
                className="flex flex-col"
                animate={{ y: [0, -4500] }} // Scroll through ~10 cards
                transition={{ 
                    repeat: Infinity, 
                    duration: 0.3, // Very fast: 10 cards in 0.3s
                    ease: "linear" 
                }}
                style={{ filter: "blur(4px)" }} // Blur effect
             >
                {/* Render a repeated pattern of restaurants */}
                {[...restaurants, ...restaurants, ...restaurants, ...restaurants].slice(0, 40).map((r, idx) => (
                    <div key={idx} className="h-[350px] md:h-[450px] w-full shrink-0 relative p-4 opacity-50">
                        {/* Simplified Card for Speed */}
                         <div className="w-full h-full bg-gray-800 rounded-2xl overflow-hidden relative">
                            <img src={r.image} className="w-full h-full object-cover opacity-50" alt="" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h3 className="text-3xl font-bold text-white text-center drop-shadow-md">
                                    {i18n.language === 'en' && r.name_en ? r.name_en : r.name}
                                </h3>
                            </div>
                         </div>
                    </div>
                ))}
             </motion.div>
        ) : winner ? (
             <motion.div
                initial={{ y: 50, scale: 0.9, filter: "blur(2px)" }}
                animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ 
                    type: "spring", 
                    damping: 12, 
                    stiffness: 200,
                    mass: 0.8 
                }}
                className="w-full h-full"
                onAnimationComplete={onAnimationComplete}
             >
                {/* Final Winner Card */}
                <div className="w-full h-full relative">
                     <ImageWithFallback 
                        src={winner.image} 
                        alt={winner.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
                        <h3 className="text-white text-3xl font-bold leading-tight drop-shadow-lg mb-2">
                          {i18n.language === 'en' && winner.name_en ? winner.name_en : winner.name}
                        </h3>
                         {/* Rating */}
                        {winner.rating > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                                <Star size={16} className="fill-purple-400 text-purple-400" />
                                <span className="text-purple-200 font-bold text-lg drop-shadow-md">{winner.rating}</span>
                            </div>
                        )}
                      </div>
                </div>
             </motion.div>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                Ready to Spin
            </div>
        )}
    </div>
  );
};

const HeroCardStack = ({ restaurants, onChoose, onSupportClick }) => {
  const { t, i18n } = useTranslation();
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState(null);

  // Sound Loop Ref
  const soundIntervalRef = useRef(null);

  // Shuffle Logic
  const handleStart = () => {
    if (isShuffling || restaurants.length < 2) return;
    
    setShowWinner(false);
    setWinner(null);
    setIsShuffling(true);
    
    // Play sound loop
    playSpinSound(); // Play once immediately
    soundIntervalRef.current = setInterval(() => {
        playSpinSound();
    }, 100); // Repeat every 100ms for machine gun effect

    // Determine winner ahead of time or just wait
    // We wait 2-3 seconds then stop
    const stopTime = 2000 + Math.random() * 1000;
    
    setTimeout(() => {
        // Stop shuffling
        setIsShuffling(false);
        clearInterval(soundIntervalRef.current);
        
        // Select Winner
        const weightedRestaurants = restaurants.map(r => ({
            ...r,
            weight: analytics.getWeight(r.id)
        }));
        const totalWeight = weightedRestaurants.reduce((sum, r) => sum + r.weight, 0);
        let winnerIndex = 0;
        if (totalWeight > 0) {
            let random = Math.random() * totalWeight;
            for (let i = 0; i < weightedRestaurants.length; i++) {
                random -= weightedRestaurants[i].weight;
                if (random <= 0) {
                    winnerIndex = i;
                    break;
                }
            }
        } else {
            winnerIndex = Math.floor(Math.random() * restaurants.length);
        }
        
        const finalWinner = restaurants[winnerIndex];
        setWinner(finalWinner);
        setShowWinner(true);
        playWinSound(); // Play success sound
        
        // Analytics
        if (finalWinner) {
            analytics.incrementPick(finalWinner.id);
        }
        
        // Delay opening modal slightly to let bounce animation finish
        setTimeout(() => {
             onChoose(finalWinner);
        }, 1500); // Wait for user to see the result card bounce
        
    }, stopTime);
  };

  const isNotEnough = restaurants.length < 2;

  // Cleanup
  useEffect(() => {
      return () => {
          if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
      };
  }, []);

  // Use the SlotReel component when shuffling or showing winner
  // Otherwise show the static "Ready" card (first restaurant or random)

  const displayCard = !isShuffling && !showWinner ? restaurants[0] : null;

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="relative w-full max-w-sm h-[450px] md:h-[550px] flex flex-col items-center justify-center perspective-1000">
      {/* Card Area */}
      <div className="relative w-full h-[350px] md:h-[450px] mb-8">
        
        <div className={`
              absolute inset-0 rounded-[24px] overflow-hidden shadow-2xl bg-[#1e1e1e] border-4 border-gray-800
              ${showWinner ? 'ring-4 ring-purple-500 scale-105 z-20 shadow-purple-500/50' : 'z-10'}
              transition-all duration-300
            `}>
            
            {(isShuffling || showWinner) ? (
                <SlotReel 
                    restaurants={restaurants} 
                    isShuffling={isShuffling} 
                    winner={winner}
                />
            ) : (
                // Static Initial View
                <div className="h-full w-full relative bg-gray-800">
                  <ImageWithFallback 
                    src={restaurants[0].image} 
                    alt={restaurants[0].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white text-2xl font-bold leading-tight drop-shadow-lg">
                      {i18n.language === 'en' && restaurants[0].name_en ? restaurants[0].name_en : restaurants[0].name}
                    </h3>
                    <div className="mt-2 inline-block px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-xs text-gray-300 border border-gray-600">
                        Ready to Pick?
                    </div>
                  </div>
                </div>
            )}

            {/* Winner Badge Overlay */}
            {showWinner && (
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white/30 z-50"
              >
                🎉 {t('hero.winner_badge') || "Great Choice!"}
              </motion.div>
            )}
        </div>

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
              ? 'bg-gray-800 cursor-not-allowed text-gray-500 scale-95' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 shadow-purple-500/30'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {isShuffling ? (
              <span className="animate-pulse">🎰 Rolling...</span>
            ) : isNotEnough ? (
              <span className="text-sm">{t('hero.not_enough')}</span>
            ) : (
              <>
                <Shuffle size={24} />
                <span>{t('hero.what_to_eat')}</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default HeroCardStack;
