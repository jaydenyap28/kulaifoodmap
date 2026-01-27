
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Eye, MousePointer, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { analytics } from '../utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const AdminAnalytics = ({ isOpen, onClose, restaurants }) => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState({ views: {}, picks: {} });
    const [weights, setWeights] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            refreshData();
        }
    }, [isOpen]);

    const refreshData = () => {
        setStats(analytics.getStats());
        setWeights(analytics.getWeights());
    };

    const handleWeightChange = (id, delta) => {
        const currentW = weights[id] !== undefined ? weights[id] : 1;
        const newW = Math.max(0, currentW + delta);
        analytics.setWeight(id, newW);
        setWeights(prev => ({ ...prev, [id]: newW }));
    };

    if (!isOpen) return null;

    // Combine data
    // Map existing restaurants to include stats
    const data = restaurants.map(r => ({
        ...r,
        views: stats.views[r.id] || 0,
        picks: stats.picks[r.id] || 0,
        weight: weights[r.id] !== undefined ? weights[r.id] : 1
    })).sort((a, b) => (b.picks + b.views) - (a.picks + a.views)); // Sort by activity

    const filteredData = data.filter(r => {
        const term = searchTerm.toLowerCase();
        const name = r.desc || r.name || '';
        const name2 = r.desc2 || r.name_en || '';
        const address = r.address || '';

        return (
            name.toLowerCase().includes(term) || 
            name2.toLowerCase().includes(term) ||
            address.toLowerCase().includes(term) ||
            (r.categories && r.categories.some(c => (c || '').toLowerCase().includes(term))) ||
            (r.branches && r.branches.some(b => (b.name || '').toLowerCase().includes(term))) ||
            (r.subStalls && r.subStalls.some(s => {
                const sName = typeof s === 'object' ? s.name : s;
                return (sName || '').toLowerCase().includes(term);
            }))
        );
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#1e1e1e] w-full max-w-4xl max-h-[85vh] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col z-[71]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#252525]">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="text-blue-400" />
                                {t('analytics.title')}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('analytics.weight_hint')}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-b border-gray-800 flex gap-4">
                        <input 
                            type="text" 
                            placeholder={t('analytics.search_placeholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="flex-1 bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        />
                        <button onClick={refreshData} className="p-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700">
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredData.map(item => (
                            <div key={item.id} className="bg-[#252525] p-3 rounded-xl flex items-center justify-between border border-gray-800 hover:border-gray-600 transition">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                        <ImageWithFallback src={item.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-bold text-sm truncate">
                                            {i18n.language === 'en' && (item.desc2 || item.name_en) ? (item.desc2 || item.name_en) : (item.desc || item.name)}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">
                                            {i18n.language === 'en' ? (item.desc || item.name) : (item.desc2 || item.name_en)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1 text-gray-400" title={t('analytics.views_tooltip')}>
                                            <Eye size={14} className="text-blue-400" />
                                            <span>{item.views}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400" title={t('analytics.picks_tooltip')}>
                                            <MousePointer size={14} className="text-green-400" />
                                            <span>{item.picks}</span>
                                        </div>
                                    </div>

                                    {/* Weight Control */}
                                    <div className="flex items-center gap-2 bg-[#121212] px-2 py-1 rounded-lg border border-gray-700">
                                        <span className="text-xs text-gray-500 font-bold uppercase mr-1">{t('analytics.weight_label')}</span>
                                        <button 
                                            onClick={() => handleWeightChange(item.id, -1)}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 disabled:opacity-30"
                                            disabled={item.weight <= 0}
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <span className={`w-6 text-center font-mono font-bold ${item.weight > 1 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {item.weight}
                                        </span>
                                        <button 
                                            onClick={() => handleWeightChange(item.id, 1)}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-green-400"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Simple Image Component since we can't import the one from parent easily without relative path
const ImageWithFallback = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    return (
        <img 
            src={error || !src ? 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=200' : src} 
            alt={alt} 
            className={className}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};

export default AdminAnalytics;
