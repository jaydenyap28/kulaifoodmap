
const STATS_KEY = 'kulaifood_stats';
const WEIGHTS_KEY = 'kulaifood_weights';

const getStorage = (key, defaultVal) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const setStorage = (key, val) => {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        console.error("Storage error", e);
    }
};

export const analytics = {
    // Stats
    getStats: () => getStorage(STATS_KEY, { views: {}, picks: {} }),
    
    incrementView: (id) => {
        const stats = analytics.getStats();
        stats.views[id] = (stats.views[id] || 0) + 1;
        setStorage(STATS_KEY, stats);
    },

    incrementPick: (id) => {
        const stats = analytics.getStats();
        stats.picks[id] = (stats.picks[id] || 0) + 1;
        setStorage(STATS_KEY, stats);
    },

    // Weights
    getWeights: () => getStorage(WEIGHTS_KEY, {}),
    
    getWeight: (id) => {
        const weights = analytics.getWeights();
        return weights[id] !== undefined ? weights[id] : 1; // Default weight is 1
    },

    setWeight: (id, weight) => {
        const weights = analytics.getWeights();
        weights[id] = Math.max(0, weight); // Ensure non-negative
        setStorage(WEIGHTS_KEY, weights);
    },

    resetStats: () => {
        localStorage.removeItem(STATS_KEY);
    }
};
