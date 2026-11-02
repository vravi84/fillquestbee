'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchPlatformStats, fetchAdminActivityLogs, fetchAllTeachers } from '@/lib/firebase/admin';
import { AdminActivityLog, TeacherUser } from '@/types';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    pendingTeachers: 0,
    approvedTeachers: 0,
    suspendedTeachers: 0,
    rejectedTeachers: 0,
    totalAiRequests: 0,
  });
  const [totalExams, setTotalExams] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AdminActivityLog[]>([]);
  const [pendingList, setPendingList] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await fetchPlatformStats();
      setStats(s);
      setTotalExams(s.totalExams ?? 0);

      if (Array.isArray(s.recentLogs)) {
        setRecentLogs(s.recentLogs.slice(0, 5));
      } else {
        const logs = await fetchAdminActivityLogs();
        setRecentLogs(logs.slice(0, 5));
      }

      if (Array.isArray(s.pendingList)) {
        setPendingList(s.pendingList);
      } else {
        const teachers = await fetchAllTeachers();
        setPendingList(teachers.filter((t) => t.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-indigo-500" />
              Platform Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of teacher approvals, exam activity, and AI generation services.
            </p>
          </div>

          <Link
            href="/admin/teachers"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            Review Pending Approvals ({stats.pendingTeachers})
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Teachers</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.totalTeachers}</p>
            <p className="text-[11px] text-slate-500 font-medium">Registered instructor accounts</p>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Pending Approval</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-400">{stats.pendingTeachers}</p>
            <p className="text-[11px] text-amber-200/70 font-medium">Awaiting admin review</p>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Approved Teachers</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400">{stats.approvedTeachers}</p>
            <p className="text-[11px] text-emerald-200/70 font-medium">Active CDF creators</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Suspended / Rejected</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-400">
              {stats.suspendedTeachers + stats.rejectedTeachers}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Restricted accounts</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Published Exams</span>
              <p className="text-2xl font-black text-white">{totalExams}</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">AI Generation Requests</span>
              <p className="text-2xl font-black text-white">{stats.totalAiRequests}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Pending Teacher Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Teacher Approvals
            </h2>
            <Link href="/admin/teachers" className="text-xs font-bold text-indigo-400 hover:underline">
              View All Teachers →
            </Link>
          </div>

          {pendingList.length === 0 ? (
            <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300">All Teacher Requests Handled!</p>
              <p className="text-[11px] text-slate-500 mt-1">There are no pending teacher registrations awaiting approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
              {pendingList.map((t) => (
                <div key={t.uid} className="p-4 bg-slate-950/40 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white">{t.name}</h3>
                    <p className="text-[11px] text-slate-400">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-full border border-amber-500/20">
                      🟡 Pending
                    </span>
                    <Link
                      href="/admin/teachers"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-white">Recent Admin Activity</h2>
            <Link href="/admin/activity" className="text-xs font-bold text-indigo-400 hover:underline">
              Full Activity Log →
            </Link>
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent admin actions logged.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400">for</span>
                    <span className="font-semibold text-indigo-300">{log.targetTeacherName || log.targetTeacherId}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
