import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Activity, Clock, Flame, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_activity_logs');
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
      setError('无法获取日志。如果你还没在 Supabase 运行 admin_activity_report.sql 脚本，请先运行它。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col font-sans">
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#1e1e1e]/95 p-4 md:px-6 shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="rounded-full bg-gray-800 p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-orange-500" />
              加分活动记录报表 (Activity Logs)
            </h1>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl">
          {error && (
            <div className="mb-6 flex items-start gap-4 rounded-xl border border-red-500/30 bg-red-900/20 p-5 text-red-200 shadow-lg">
              <AlertCircle className="shrink-0 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">加载失败</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-[#1e1e1e] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#2a2a2a] text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">记录时间</th>
                    <th className="px-6 py-4 font-semibold">商家名称</th>
                    <th className="px-6 py-4 font-semibold">加分事件</th>
                    <th className="px-6 py-4 font-semibold text-right">热度加分 (+Hot Score)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        正在读取巨额数据中...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        {error ? '接口不存在，请运行 SQL。' : '目前还没有任何商家加分记录。'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr key={index} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-2 text-gray-400">
                              <Clock size={14} />
                              {new Date(log.created_at).toLocaleString()}
                           </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                          {log.restaurant_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            log.log_type.includes('Spin') 
                              ? 'bg-purple-900/40 text-purple-400 ring-1 ring-purple-500/40' 
                              : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/40'
                          }`}>
                            {log.log_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1.5 font-bold text-orange-400">
                              <Flame size={16} />
                              +{log.added_hot_score} 分
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            仅显示最近的 500 条加分记录。该报表供管理员专门用来追踪商家的热度作弊或活动情况。
          </div>
        </div>
      </main>
    </div>
  );
}
