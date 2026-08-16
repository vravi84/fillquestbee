'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  Clock,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Exam, ExamAttempt } from '@/types';
import { formatDate, formatTime, downloadCsv } from '@/lib/utils';

interface ResultsViewProps {
  exam: Exam;
  attempts: ExamAttempt[];
  onDeleteAttempt: (attemptId: string) => void;
}

export default function ResultsView({
  exam,
  attempts,
  onDeleteAttempt,
}: ResultsViewProps) {
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);

  const totalAttempts = attempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts)
      : 0;

  const handleExportCsv = () => {
    const headers = ['Student Name', 'Score', 'Total Questions', 'Percentage', 'Time Spent', 'Date Completed'];
    const rows = attempts.map((a) => [
      a.studentName,
      a.score,
      a.totalQuestions,
      `${a.percentage}%`,
      formatTime(a.timeSpentSeconds),
      formatDate(a.completedAt),
    ]);

    downloadCsv(`${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_Results.csv`, headers, rows);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/teacher/dashboard"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Results & Student Analytics
          </h1>
          <p className="text-sm font-semibold text-indigo-600 mt-1">{exam.title}</p>
        </div>

        {attempts.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Results as CSV
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Student Attempts</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalAttempts}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Class Score</div>
          <div className="text-3xl font-black text-indigo-600 mt-2">{avgScore}%</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Questions</div>
          <div className="text-3xl font-black text-purple-600 mt-2">{exam.questions.length}</div>
        </div>
      </div>

      {/* Attempt Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-800 text-base">
          Student Submissions ({attempts.length})
        </div>

        {attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No student attempts recorded for this exam yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Student Name</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-center">Time Spent</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{att.studentName}</td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {att.score} / {att.totalQuestions}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-slate-500">
                      {formatTime(att.timeSpentSeconds)}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                      {formatDate(att.completedAt)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => setSelectedAttempt(att)}
                        title="View Question Responses"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete attempt for ${att.studentName}?`)) {
                            onDeleteAttempt(att.id);
                          }
                        }}
                        title="Delete Attempt"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attempt Modal Detail */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Submission Detail: {selectedAttempt.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Score: {selectedAttempt.score}/{selectedAttempt.totalQuestions} ({selectedAttempt.percentage}%)
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedAttempt.answers.map((ans, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 mb-1">
                    Q{idx + 1}. {ans.sentenceWithBlank}
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      Selected: <strong>{ans.selectedAnswer}</strong>
                    </span>
                    {ans.isCorrect ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect (Correct: {ans.correctAnswer})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
