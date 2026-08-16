'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchExamByIdOrCode, fetchExamAttempts, deleteAttempt } from '@/lib/firebase/services';
import { Exam, ExamAttempt } from '@/types';
import ResultsView from '@/components/teacher/ResultsView';
import { RefreshCw } from 'lucide-react';

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadExamAndAttempts = async () => {
    setLoading(true);
    try {
      const foundExam = await fetchExamByIdOrCode(id);
      if (foundExam) {
        setExam(foundExam);
        const atts = await fetchExamAttempts(foundExam.id);
        setAttempts(atts);
      }
    } catch (err) {
      console.error('Failed loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/teacher/login');
      return;
    }
    if (user && id) {
      loadExamAndAttempts();
    }
  }, [id, user, authLoading]);

  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      await deleteAttempt(attemptId);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } catch (err) {
      console.error('Failed to delete attempt:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 animate-spin text-indigo-600">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-600">Loading Student Exam Results...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Exam Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The requested exam results could not be located.
        </p>
        <button
          onClick={() => router.push('/teacher/dashboard')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <ResultsView
      exam={exam}
      attempts={attempts}
      onDeleteAttempt={handleDeleteAttempt}
    />
  );
}
