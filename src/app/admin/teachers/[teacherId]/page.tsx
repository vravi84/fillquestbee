'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchTeacherById, updateTeacherStatus } from '@/lib/firebase/admin';
import { fetchTeacherExams, fetchExamAttempts } from '@/lib/firebase/services';
import { TeacherUser, Exam, ExamAttempt } from '@/types';
import {
  Users,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentAdmin } = useAuth();
  const teacherId = params?.teacherId as string;

  const [teacher, setTeacher] = useState<TeacherUser | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadTeacherDetails = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const t = await fetchTeacherById(teacherId);
      setTeacher(t);

      const examList = await fetchTeacherExams(teacherId);
      setExams(examList);

      let attList: ExamAttempt[] = [];
      for (const e of examList) {
        const atts = await fetchExamAttempts(e.id);
        attList = [...attList, ...atts];
      }
      setAttempts(attList);
    } catch (err) {
      console.error('Failed to load teacher details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherDetails();
  }, [teacherId]);

  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'suspended') => {
    if (!teacher) return;
    setIsUpdating(true);
    try {
      await updateTeacherStatus(
        teacher.uid,
        newStatus,
        currentAdmin?.uid || 'admin_demo_1',
        currentAdmin?.name || 'System Admin'
      );
      await loadTeacherDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !teacher) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-slate-400">Loading teacher details...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Back Link & Header */}
        <div className="space-y-3 border-b border-slate-800 pb-5">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Teachers List
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-xl border border-indigo-500/30">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{teacher.name}</h1>
                <p className="text-xs text-slate-400">{teacher.email}</p>
              </div>
            </div>

            {/* Quick Status Control Buttons */}
            <div className="flex items-center gap-2">
              {teacher.status !== 'approved' && (
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Teacher
                </button>
              )}

              {teacher.status !== 'suspended' && (
                <button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Suspend Account
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400">Total Exams Created</span>
            <p className="text-3xl font-black text-white">{exams.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400">Student Attempts</span>
            <p className="text-3xl font-black text-indigo-400">{attempts.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400">Account Status</span>
            <div className="pt-1">
              <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-black rounded-full capitalize">
                {teacher.status || 'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Exam Portfolio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Exams Created by {teacher.name}
          </h2>

          {exams.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">This teacher has not published any CDF exams yet.</p>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
              {exams.map((exam) => (
                <div key={exam.id} className="p-4 bg-slate-950/40 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white">{exam.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      {exam.className} • {exam.subject} • {exam.questions.length} Questions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-400">{exam.attemptCount || 0} Attempts</span>
                    <p className="text-[10px] text-slate-500">Code: {exam.shareCode}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
