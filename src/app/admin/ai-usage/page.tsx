'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchAiUsageLogs } from '@/lib/firebase/admin';
import { AiUsageLog } from '@/types';
import { Sparkles, RefreshCw, Search } from 'lucide-react';

export default function AdminAiUsagePage() {
  const [logs, setLogs] = useState<AiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAiUsageLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load AI usage logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.teacherId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOp = operationFilter === 'all' || log.operation === operationFilter;
    return matchesSearch && matchesOp;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-amber-400" />
              Gemini AI Service Usage
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor AI content extraction and MCQ generation operations across all teacher accounts.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-800 rounded-xl overflow-x-auto">
            {['all', 'extract_content', 'generate_mcq'].map((tab) => (
              <button
                key={tab}
                onClick={() => setOperationFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  operationFilter === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Operations' : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by teacher name or details..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* AI Usage Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Teacher</th>
                  <th className="py-4 px-6">Operation</th>
                  <th className="py-4 px-6">Exam Reference</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Execution Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No AI usage logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        {log.teacherName || log.teacherId}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-purple-300 font-bold px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-[11px]">
                          {log.operation}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {log.examId || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase border ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
