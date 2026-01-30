import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

const BranchSelector = ({ branches }) => {
    if (!branches || branches.length === 0) return null;

    const handleNavigate = (url, e) => {
        e.stopPropagation();
        if (url) window.open(url, '_blank');
    };

    const getGoogleMapsUrl = (branch) => {
        if (branch.googleMapsUrl) return branch.googleMapsUrl;
        const query = `${branch.branchName || branch.name} ${branch.address || ''}`.trim();
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    };

    return (
        <div className="bg-[#2d2d2d] p-4 rounded-xl border border-gray-700 mb-4">
            <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-red-500" />
                分行选择 (Select Branch)
            </h3>
            <div className="space-y-3">
                {branches.map((branch, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-600 flex justify-between items-center group hover:border-gray-500 transition-colors">
                        <div className="flex-1 mr-2">
                            <h4 className="text-white text-xs font-bold mb-1">{branch.branchName || branch.name}</h4>
                            <p className="text-gray-400 text-[10px] line-clamp-2">{branch.address}</p>
                        </div>
                        <div className="flex gap-2">
                            {branch.wazeUrl && (
                                <button 
                                    onClick={(e) => handleNavigate(branch.wazeUrl, e)}
                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition border border-blue-500/30"
                                    title="Waze"
                                >
                                    <Navigation size={14} className="fill-current" />
                                </button>
                            )}
                            <button 
                                onClick={(e) => handleNavigate(getGoogleMapsUrl(branch), e)}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30"
                                title="Google Maps"
                            >
                                <MapPin size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BranchSelector;
