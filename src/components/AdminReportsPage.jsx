import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, TrendingUp, Search, Eye, MousePointer, Activity } from 'lucide-react';
import { useToast } from './toast/ToastProvider';
import { analyticsService } from '../services/analyticsService';

const AdminReportsPage = () => {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('today');

    useEffect(() => {
        fetchReports();
    }, [dateFilter]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const data = await analyticsService.getReports(dateFilter);
            setReports(data || []);
        } catch (err) {
            console.error(err);
            toast.error('拉取报表失败，请检查数据库。');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate aggregations
    const aggregatedData = reports.reduce((acc, log) => {
        const id = log.restaurant_id;
        if (!acc[id]) {
            acc[id] = {
                id,
                name: log.restaurant_name,
                category: log.category,
                views: 0,
                clicks: 0,
                memberInteractions: 0,
                guestInteractions: 0
            };
        }
        
        if (log.activity_type === 'restaurant_view') acc[id].views++;
        else if (log.activity_type === 'delivery_link_click') acc[id].clicks++;

        if (log.is_member) acc[id].memberInteractions++;
        else acc[id].guestInteractions++;

        return acc;
    }, {});

    const sortedData = Object.values(aggregatedData).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks));
    
    const filteredData = sortedData.filter(d => 
        (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (d.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalViews = reports.filter(r => r.activity_type === 'restaurant_view').length;
    const totalClicks = reports.filter(r => r.activity_type === 'delivery_link_click').length;

    return (
        <div className="px-4 py-8 text-white max-w-6xl mx-auto w-full">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <Activity size={24} className="text-blue-400" /> 用户访问报表分析
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                            全面追踪商家点击与外卖引流数据
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select 
                            value={dateFilter} 
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-bold outline-none cursor-pointer focus:border-blue-500"
                        >
                            <option value="today">今日</option>
                            <option value="last_7_days">过去 7 天</option>
                            <option value="this_month">本月</option>
                            <option value="all">所有时间段</option>
                        </select>
                        <button onClick={fetchReports} disabled={isLoading} className="flex items-center gap-2 bg-blue-600/90 text-white px-4 py-2 text-sm font-bold rounded-lg hover:bg-blue-500 transition shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                            更新数据
                        </button>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-white/10 flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-400">总点击量 (Views)</span>
                        <div className="text-3xl font-black text-emerald-400">{totalViews}</div>
                     </div>
                     <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-white/10 flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-400">外卖链接引流 (Clicks)</span>
                        <div className="text-3xl font-black text-blue-400">{totalClicks}</div>
                     </div>
                     <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-white/10 flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-400">会员互动 (Members)</span>
                        <div className="text-3xl font-black text-orange-400">
                            {reports.filter(r => r.is_member).length}
                        </div>
                     </div>
                     <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-white/10 flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-400">游客互动 (Guests)</span>
                        <div className="text-3xl font-black text-cyan-400">
                             {reports.filter(r => !r.is_member).length}
                        </div>
                     </div>
                </div>

                <div className="bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/10 bg-black/20 relative">
                        <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="搜索商家名称 / 分类..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full lg:max-w-md bg-black/40 border border-white/10 rounded-full px-4 py-2 pl-10 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                                    <th className="px-6 py-4 font-bold">商家名称</th>
                                    <th className="px-6 py-4 font-bold">分类</th>
                                    <th className="px-6 py-4 font-bold text-center">展现次数<br/><span className="text-[10px] text-gray-500 font-normal">Views</span></th>
                                    <th className="px-6 py-4 font-bold text-center">外卖引流<br/><span className="text-[10px] text-gray-500 font-normal">Delivery Clicks</span></th>
                                    <th className="px-6 py-4 font-bold text-center">会员/游客<br/><span className="text-[10px] text-gray-500 font-normal">M / G</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            暂无匹配的活动数据
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(d => (
                                        <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate" title={d.name}>
                                                {d.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                <span className="bg-white/10 px-2 py-1 rounded text-xs">{d.category || '未分类'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                                                    <Eye size={14} /> {d.views}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-x border-white/5 bg-blue-500/5">
                                                 <span className="flex items-center justify-center gap-1.5 font-bold text-blue-400">
                                                    <MousePointer size={14} /> {d.clicks}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2 text-xs font-mono">
                                                    <span className="text-orange-400" title="会员互动">{d.memberInteractions}</span>
                                                    <span className="text-gray-500">/</span>
                                                    <span className="text-cyan-400" title="游客互动">{d.guestInteractions}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportsPage;
