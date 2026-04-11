import React from 'react';
import { getRestaurantRankMeta } from '../utils/restaurantRank';

const RestaurantRankBadge = ({ hotScore = 0, className = '' }) => {
  const rankMeta = getRestaurantRankMeta(hotScore);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none ${rankMeta.bgClass} ${rankMeta.textClass} ${rankMeta.borderClass} ${className}`.trim()}
    >
      {rankMeta.name}
    </span>
  );
};

export default RestaurantRankBadge;
