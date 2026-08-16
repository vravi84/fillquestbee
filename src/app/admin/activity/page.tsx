'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchAdminActivityLogs, fetchAiUsageLogs } from '@/lib/firebase/admin';
import { AdminActivityLog, AiUsageLog } from '@/types';
import { Activity, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';

export default function AdminActivityPage() {
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>([]);
  const [aiLogs, setAiLogs] = useState<AiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'ai'>('admin');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const aLogs = await fetchAdminActivityLogs();
      setAdminLogs(aLogs);

      const ai = await fetchAiUsageLogs();
      setAiLogs(ai);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-indigo-500" />
              Activity & Audit Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit trail of administrator actions and AI generation requests.
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Action Audit Log ({adminLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Usage Log ({aiLogs.length})
          </button>
        </div>

        {/* Admin Action Audit Logs Table */}
        {activeTab === 'admin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Action</th>
                    <th className="py-4 px-6">Target Teacher</th>
                    <th className="py-4 px-6">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {adminLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No admin activity logged yet.
                      </td>
                    </tr>
                  ) : (
                    adminLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-white">
                          {log.targetTeacherName || log.targetTeacherId}
                        </td>
                        <td className="py-4 px-6 text-slate-300 font-medium">{log.adminName || log.adminId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Usage Logs Table */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Teacher</th>
                    <th className="py-4 px-6">Operation</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {aiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No AI usage logged yet.
                      </td>
                    </tr>
                  ) : (
                    aiLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{log.teacherName || log.teacherId}</td>
                        <td className="py-4 px-6 font-mono text-purple-300 font-bold">{log.operation}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black text-[10px] uppercase">
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
        )}
      </div>
    </AdminLayout>
  );
}
