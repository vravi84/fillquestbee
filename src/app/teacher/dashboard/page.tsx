'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchTeacherExams, deleteExam, fetchExamAttempts } from '@/lib/firebase/services';
import { Exam, ExamAttempt } from '@/types';
import DashboardCards from '@/components/teacher/DashboardCards';
import ExamTable from '@/components/teacher/ExamTable';
import { PlusCircle, BookOpen, RefreshCw, Sparkles, LayoutDashboard } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const examList = await fetchTeacherExams(user.uid);
      setExams(examList);

      // Collect all attempts across teacher's exams
      let allAttempts: ExamAttempt[] = [];
      for (const e of examList) {
        const atts = await fetchExamAttempts(e.id);
        allAttempts = [...allAttempts, ...atts];
      }
      setAttempts(allAttempts);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/teacher/login');
      return;
    }
    if (user) {
      if (user.role === 'teacher') {
        if (user.status === 'pending') {
          router.push('/teacher/pending');
          return;
        }
        if (user.status === 'suspended') {
          router.push('/teacher/suspended');
          return;
        }
        if (user.status === 'rejected') {
          router.push('/teacher/rejected');
          return;
        }
      }
      loadDashboardData();
    }
  }, [user, authLoading]);

  const handleDeleteExam = async (id: string) => {
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  if (authLoading || (loadingData && !exams.length)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 animate-spin text-indigo-600">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-600">Loading Teacher Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Teacher Studio
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Teacher'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
            Create interactive drag & drop CDF exams from educational content using Google Gemini AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/teacher/exams/create"
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-950/30 hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Create New CDF Exam</span>
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <DashboardCards exams={exams} attempts={attempts} />

      {/* Main Exam List Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            My CDF Exams ({exams.length})
          </h2>

          <button
            onClick={loadDashboardData}
            title="Refresh List"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <ExamTable exams={exams} onDelete={handleDeleteExam} />
      </div>
    </div>
  );
}
