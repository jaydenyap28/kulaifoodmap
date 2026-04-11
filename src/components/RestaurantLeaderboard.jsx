import React, { useEffect, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { getTopRestaurants } from '../services/restaurantService';
import RestaurantRankBadge from './RestaurantRankBadge';

const LeaderboardItem = ({ restaurant, index }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-3 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
      {index + 1}
    </div>

    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
      {restaurant.image_url ? (
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-500">
          No Image
        </div>
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="truncate text-sm font-bold text-white">{restaurant.name}</h4>
        <RestaurantRankBadge hotScore={restaurant.hot_score} />
      </div>
      <p className="mt-1 truncate text-xs text-gray-400">
        {restaurant.category || '未分类'}
      </p>
      <p className="mt-1 truncate text-xs text-gray-500">
        {restaurant.address || '暂无地址'}
      </p>
    </div>

    <div className="shrink-0 text-right">
      <div className="flex items-center gap-1 text-orange-300">
        <Flame size={14} />
        <span className="text-sm font-bold">{restaurant.hot_score ?? 0}</span>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">热度值</p>
    </div>
  </div>
);

const RestaurantLeaderboard = ({ limit = 20 }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTopRestaurants(limit);
        if (active) {
          setRestaurants(data);
        }
      } catch (loadError) {
        console.error('Failed to load restaurant leaderboard', loadError);
        if (active) {
          setError(loadError);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [limit]);

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 mb-10">
      <div className="rounded-[28px] border border-white/10 bg-[#141414] p-5 md:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300 border border-orange-400/20">
            <Trophy size={22} />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white">Top 20 商家热度榜</h3>
            <p className="text-sm text-gray-400">根据转盘热度值实时排序</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
            排行榜加载失败，请稍后再试。
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-gray-400">
            暂无排行榜数据
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant, index) => (
              <LeaderboardItem
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantLeaderboard;
