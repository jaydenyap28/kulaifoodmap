export const getRestaurantRankMeta = (hotScore = 0) => {
  const safeScore = Number.isFinite(hotScore) ? hotScore : 0;

  if (safeScore <= 1000) {
    return {
      name: '青铜食铺',
      textClass: 'text-amber-200',
      bgClass: 'bg-amber-900/40',
      borderClass: 'border-amber-700/60',
    };
  }

  if (safeScore <= 3000) {
    return {
      name: '白银小吃',
      textClass: 'text-slate-100',
      bgClass: 'bg-slate-700/40',
      borderClass: 'border-slate-500/60',
    };
  }

  if (safeScore <= 8000) {
    return {
      name: '黄金招牌店',
      textClass: 'text-yellow-100',
      bgClass: 'bg-yellow-800/35',
      borderClass: 'border-yellow-500/60',
    };
  }

  if (safeScore <= 15000) {
    return {
      name: '铂金人气名店',
      textClass: 'text-cyan-100',
      bgClass: 'bg-cyan-800/30',
      borderClass: 'border-cyan-400/60',
    };
  }

  if (safeScore <= 25000) {
    return {
      name: '钻石神级好味道',
      textClass: 'text-sky-100',
      bgClass: 'bg-sky-800/35',
      borderClass: 'border-sky-300/60',
    };
  }

  if (safeScore <= 50000) {
    return {
      name: '星耀必吃榜单',
      textClass: 'text-fuchsia-100',
      bgClass: 'bg-fuchsia-800/35',
      borderClass: 'border-fuchsia-400/60',
    };
  }

  return {
    name: '古来食神王者',
    textClass: 'text-rose-100',
    bgClass: 'bg-rose-800/40',
    borderClass: 'border-rose-400/70',
  };
};

export const getRestaurantRank = (hotScore = 0) => getRestaurantRankMeta(hotScore).name;
