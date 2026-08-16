'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchAllTeachers, updateTeacherStatus } from '@/lib/firebase/admin';
import { TeacherUser, TeacherStatus } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminTeachersPage() {
  const { user: currentAdmin } = useAuth();
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Teacher Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherUser | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const list = await fetchAllTeachers();
      setTeachers(list);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleActionConfirm = async () => {
    if (!selectedTeacher || !modalAction) return;
    setIsProcessing(true);

    let targetStatus: 'approved' | 'rejected' | 'suspended' | 'pending' = 'approved';
    if (modalAction === 'approve' || modalAction === 'reactivate') targetStatus = 'approved';
    if (modalAction === 'reject') targetStatus = 'rejected';
    if (modalAction === 'suspend') targetStatus = 'suspended';

    try {
      await updateTeacherStatus(
        selectedTeacher.uid,
        targetStatus,
        currentAdmin?.uid || 'admin_demo_1',
        currentAdmin?.name || 'System Admin'
      );
      await loadTeachers();
      setSelectedTeacher(null);
      setModalAction(null);
    } catch (err) {
      console.error('Failed to update teacher status:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: TeacherStatus | string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-full">
            🟢 Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black rounded-full">
            🔴 Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-black rounded-full">
            ⚫ Suspended
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black rounded-full">
            🟡 Pending
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-500" />
              Teacher Approval & Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review new instructor registrations, grant CDF creation access, or suspend user profiles.
            </p>
          </div>

          <button
            onClick={loadTeachers}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-800 rounded-xl overflow-x-auto">
            {['all', 'pending', 'approved', 'suspended', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${
                  statusFilter === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teacher by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="py-4 px-6">Teacher</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Registration Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No teachers found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{t.name}</span>
                            <span className="text-[10px] text-slate-500">ID: {t.uid}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{t.email}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(t.status)}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/admin/teachers/${t.uid}`}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          View
                        </Link>

                        <button
                          onClick={() => {
                            setSelectedTeacher(t);
                            setModalAction(t.status === 'pending' ? 'approve' : 'approve');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                        >
                          Manage / Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action & Review Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-100 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Review Teacher Registration</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage permissions and approval state.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTeacher(null);
                  setModalAction(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teacher Details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-white">{selectedTeacher.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-bold text-white">{selectedTeacher.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration Date:</span>
                <span className="font-bold text-slate-300">
                  {new Date(selectedTeacher.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Current Status:</span>
                <div>{getStatusBadge(selectedTeacher.status)}</div>
              </div>
            </div>

            {/* Action Selection */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Action:</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModalAction('approve')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalAction === 'approve'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Approve Teacher
                </button>

                <button
                  onClick={() => setModalAction('reject')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalAction === 'reject'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Reject Registration
                </button>

                <button
                  onClick={() => setModalAction('suspend')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalAction === 'suspend'
                      ? 'bg-slate-900 text-slate-200 border-slate-600 ring-2 ring-slate-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Suspend Account
                </button>

                <button
                  onClick={() => setModalAction('reactivate')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalAction === 'reactivate'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  Reactivate Access
                </button>
              </div>
            </div>

            {/* Confirmation Box */}
            {modalAction && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Confirmation Required
                </div>
                <p className="text-xs text-indigo-200">
                  Are you sure you want to set status for <span className="font-bold text-white">{selectedTeacher.name}</span> to <span className="uppercase font-black text-amber-300">{modalAction}</span>?
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActionConfirm}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {isProcessing ? 'Updating Status...' : 'Confirm Action'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
