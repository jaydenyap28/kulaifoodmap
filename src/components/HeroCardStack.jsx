import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shuffle, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageWithFallback from './ImageWithFallback';
import { analytics } from '../utils/analytics';
import { trackEvent } from '../utils/trackEvent';
import { playSpinSound, playWinSound } from '../utils/audio';
import { canSpinToday, claimSpinReward, getCurrentSessionUser, incrementRestaurantHotScore } from '../services/spinService';
import { hasGuestSpinUsed, markGuestSpinUsed } from '../utils/guestSpin';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './toast/ToastProvider';

const FALLBACK_SPIN_STATUS = {
  can_spin: false,
  remaining_spins: 0,
  message: '暂时无法获取转盘状态',
};

const getGuestSpinStatus = () => (
  hasGuestSpinUsed()
    ? {
        can_spin: false,
        remaining_spins: 0,
        message: '试玩机会已用完，登录后就能继续正式转盘。',
      }
    : {
        can_spin: true,
        remaining_spins: 1,
        message: '游客可试玩 1 次',
      }
);

const pickWinningRestaurant = (restaurants) => {
  const weightedRestaurants = restaurants.map((restaurant) => ({
    ...restaurant,
    weight: analytics.getWeight(restaurant.id),
  }));

  const totalWeight = weightedRestaurants.reduce((sum, restaurant) => sum + restaurant.weight, 0);

  if (totalWeight <= 0) {
    return restaurants[Math.floor(Math.random() * restaurants.length)];
  }

  let random = Math.random() * totalWeight;
  for (let index = 0; index < weightedRestaurants.length; index += 1) {
    random -= weightedRestaurants[index].weight;
    if (random <= 0) {
      return restaurants[index];
    }
  }

  return restaurants[restaurants.length - 1];
};

const SlotReel = ({ restaurants, isShuffling, winner }) => {
  const { i18n } = useTranslation();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">
      {isShuffling ? (
        <motion.div
          className="flex flex-col"
          animate={{ y: [0, -4500] }}
          transition={{ repeat: Infinity, duration: 0.3, ease: 'linear' }}
          style={{ filter: 'blur(4px)' }}
        >
          {[...restaurants, ...restaurants, ...restaurants, ...restaurants].slice(0, 40).map((restaurant, index) => (
            <div key={`${restaurant.id}-${index}`} className="relative h-[350px] w-full shrink-0 p-4 opacity-50 md:h-[450px]">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gray-800">
                <img src={restaurant.image} className="h-full w-full object-cover opacity-50" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-center text-3xl font-bold text-white drop-shadow-md">
                    {i18n.language === 'en' && restaurant.name_en ? restaurant.name_en : restaurant.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      ) : winner ? (
        <motion.div
          initial={{ y: 50, scale: 0.9, filter: 'blur(2px)' }}
          animate={{ y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 0.8 }}
          className="h-full w-full"
        >
          <div className="relative h-full w-full">
            <ImageWithFallback
              src={winner.image}
              alt={winner.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-6">
              <h3 className="mb-2 text-3xl font-bold leading-tight text-white drop-shadow-lg">
                {i18n.language === 'en' && winner.name_en ? winner.name_en : winner.name}
              </h3>
              {winner.rating > 0 && (
                <div className="mb-2 flex items-center gap-1">
                  <Star size={16} className="fill-purple-400 text-purple-400" />
                  <span className="text-lg font-bold text-purple-200 drop-shadow-md">{winner.rating}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-500">
          Ready to Spin
        </div>
      )}
    </div>
  );
};

const HeroCardStack = ({ restaurants, onChoose, onRefreshRestaurants }) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [isShuffling, setIsShuffling] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isSettlingReward, setIsSettlingReward] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [spinStatus, setSpinStatus] = useState(getGuestSpinStatus());
  const soundIntervalRef = useRef(null);

  const isSpinning = isShuffling || isSettlingReward;

  const refreshSpinStatus = async (providedUser) => {
    try {
      const currentUser = providedUser === undefined ? await getCurrentSessionUser() : providedUser;
      setSessionUser(currentUser || null);

      if (!currentUser) {
        const guestStatus = getGuestSpinStatus();
        setSpinStatus(guestStatus);
        return guestStatus;
      }

      const nextStatus = await canSpinToday();
      const resolvedStatus = nextStatus || FALLBACK_SPIN_STATUS;
      setSpinStatus(resolvedStatus);
      return resolvedStatus;
    } catch (error) {
      console.error('Failed to refresh spin status', error);
      setSpinStatus(FALLBACK_SPIN_STATUS);
      return FALLBACK_SPIN_STATUS;
    }
  };

  const finishPreviewSpin = async (finalWinner) => {
    setIsSettlingReward(true);

    try {
      markGuestSpinUsed();
      window.dispatchEvent(new CustomEvent('spin-status-refresh'));
      await refreshSpinStatus(null);
      toast.info('试玩完成啦，登录后就能正式转盘、累计积分、助力喜欢的店。');
      onChoose(finalWinner);
    } finally {
      setIsSettlingReward(false);
    }
  };

  const finishRewardSpin = async (finalWinner) => {
    setIsSettlingReward(true);

    try {
      const rewardResult = await claimSpinReward(finalWinner.database_id ?? finalWinner.id);

      if (!rewardResult?.success) {
        toast.error(rewardResult?.message || '今天的转盘次数已经用完了。');
        await refreshSpinStatus(sessionUser);
        return;
      }

      await onRefreshRestaurants?.();
      window.dispatchEvent(new CustomEvent('profile-refresh'));
      window.dispatchEvent(new CustomEvent('spin-status-refresh'));
      await refreshSpinStatus(sessionUser);
      toast.success(`${rewardResult.message} 当前积分 ${rewardResult.total_points}，今日已转 ${rewardResult.daily_spin_count} 次。`);
      onChoose(finalWinner);
    } catch (error) {
      console.error('Failed to claim spin reward', error);
      toast.error(error.message || '转盘结算失败了，请稍后再试。');
      await refreshSpinStatus(sessionUser);
    } finally {
      setIsSettlingReward(false);
    }
  };

  const startSpinSequence = ({ previewMode }) => {
    setShowWinner(false);
    setWinner(null);
    setIsShuffling(true);
    trackEvent('random_pick_start', {
      candidate_count: restaurants.length,
      preview_mode: previewMode,
    });

    playSpinSound();
    soundIntervalRef.current = window.setInterval(() => {
      playSpinSound();
    }, 100);

    const stopTime = 2000 + Math.random() * 1000;

    window.setTimeout(() => {
      setIsShuffling(false);

      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }

      const finalWinner = pickWinningRestaurant(restaurants);
      setWinner(finalWinner);
      setShowWinner(true);
      playWinSound();

      if (finalWinner) {
        analytics.incrementPick(finalWinner.id);
        
        const resolvedId = finalWinner.database_id ?? finalWinner.id;
        incrementRestaurantHotScore(resolvedId).catch(err => console.error(err));

        trackEvent('random_pick_result', {
          restaurant_id: String(resolvedId),
          restaurant_name: finalWinner.name,
          preview_mode: previewMode,
        });
      }

      window.setTimeout(() => {
        if (!finalWinner) {
          return;
        }

        if (previewMode) {
          finishPreviewSpin(finalWinner);
          return;
        }

        finishRewardSpin(finalWinner);
      }, 1500);
    }, stopTime);
  };

  const handleStart = async () => {
    if (isSpinning || restaurants.length < 2) {
      return;
    }

    const currentUser = await getCurrentSessionUser();
    setSessionUser(currentUser || null);

    if (!currentUser) {
      if (hasGuestSpinUsed()) {
        await refreshSpinStatus(null);
        toast.info('先登录一下，就能继续正式转盘了。');
        return;
      }

      startSpinSequence({ previewMode: true });
      return;
    }

    try {
      const latestSpinStatus = await refreshSpinStatus(currentUser);

      if (!latestSpinStatus?.can_spin) {
        toast.info(latestSpinStatus?.message || '今天的转盘次数已经用完了。');
        await refreshSpinStatus(currentUser);
        return;
      }
    } catch (error) {
      console.error('Failed to check spin availability', error);
      toast.error(error.message || '暂时无法确认转盘次数，请稍后再试。');
      await refreshSpinStatus(currentUser);
      return;
    }

    startSpinSequence({ previewMode: false });
  };

  useEffect(() => {
    let active = true;

    const loadStatus = async (providedUser) => {
      const resolvedUser = providedUser === undefined ? await getCurrentSessionUser() : providedUser;
      if (!active) {
        return;
      }
      await refreshSpinStatus(resolvedUser);
    };

    loadStatus();

    const handleSpinStatusRefresh = () => {
      loadStatus();
    };

    window.addEventListener('spin-status-refresh', handleSpinStatusRefresh);

    const {
      data: { subscription },
    } = supabase
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          loadStatus(nextSession?.user || null);
        })
      : { data: { subscription: { unsubscribe() {} } } };

    return () => {
      active = false;
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
      subscription.unsubscribe();
      window.removeEventListener('spin-status-refresh', handleSpinStatusRefresh);
    };
  }, []);

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  const isNotEnough = restaurants.length < 2;

  const spinStatusLabel = sessionUser
    ? (
        spinStatus.remaining_spins >= 2
          ? '今日剩余 2 次'
          : spinStatus.remaining_spins === 1
            ? '今日剩余 1 次'
            : '今日已用完'
      )
    : hasGuestSpinUsed()
      ? '试玩已结束'
      : '游客可试玩 1 次';

  return (
    <div className="perspective-1000 relative flex h-[450px] w-full max-w-sm flex-col items-center justify-center md:h-[550px]">
      <div className="relative mb-8 h-[350px] w-full md:h-[450px]">
        <div
          className={`
            absolute inset-0 z-10 overflow-hidden rounded-[24px] border-4 border-gray-800 bg-[#1e1e1e] shadow-2xl transition-all duration-300
            ${showWinner ? 'z-20 scale-105 ring-4 ring-purple-500 shadow-purple-500/50' : ''}
          `}
        >
          {(isShuffling || showWinner) ? (
            <SlotReel restaurants={restaurants} isShuffling={isShuffling} winner={winner} />
          ) : (
            <div className="relative h-full w-full bg-gray-800">
              <ImageWithFallback
                src={restaurants[0].image}
                alt={restaurants[0].name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-6">
                <h3 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">
                  {i18n.language === 'en' && restaurants[0].name_en ? restaurants[0].name_en : restaurants[0].name}
                </h3>
                <div className="mt-2 inline-block rounded-full border border-gray-600 bg-gray-800/80 px-3 py-1 text-xs text-gray-300 backdrop-blur">
                  Ready to Pick?
                </div>
              </div>
            </div>
          )}

          {showWinner && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute right-4 top-4 z-50 rounded-full border-2 border-white/30 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
            >
              {t('hero.winner_badge') || 'Great Choice!'}
            </motion.div>
          )}
        </div>

        {!showWinner && !isShuffling && (
          <>
            <div className="absolute inset-0 -z-10 translate-y-2 rotate-3 scale-95 rounded-[24px] bg-gray-800 opacity-20"></div>
            <div className="absolute inset-0 -z-20 translate-y-4 -rotate-3 scale-90 rounded-[24px] bg-gray-600 opacity-20"></div>
          </>
        )}
      </div>

      <div className="relative z-30 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={handleStart}
            disabled={isSpinning || isNotEnough}
            className={`
              rounded-full border border-white/10 px-8 py-4 text-xl font-bold text-white shadow-xl transition-all transform
              ${isSpinning || isNotEnough
                ? 'scale-[0.98] cursor-not-allowed bg-gray-800 text-gray-500 opacity-80'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-purple-500/30 hover:scale-105 active:scale-95'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {isShuffling ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>转盘中...</span>
                </>
              ) : isSettlingReward ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>结算中...</span>
                </>
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

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">
            {spinStatusLabel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCardStack;
