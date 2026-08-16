'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  ExternalLink,
  Copy,
  Check,
  BarChart3,
  Trash2,
  Share2,
  FileQuestion,
  Eye,
} from 'lucide-react';
import { Exam } from '@/types';

interface ExamTableProps {
  exams: Exam[];
  onDelete: (id: string) => void;
}

export default function ExamTable({ exams, onDelete }: ExamTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const handleCopyLink = (exam: Exam) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/exam/${exam.shareCode || exam.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(exam.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No FillQuestBee Exams Created Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Create your first interactive drag-and-drop fill-in-the-blank exam for your students in minutes using AI.
        </p>
        <Link
          href="/teacher/exams/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
        >
          + Create New FillQuestBee Exam
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Exam Title</th>
              <th className="py-3.5 px-4">Class & Subject</th>
              <th className="py-3.5 px-4 text-center">Questions</th>
              <th className="py-3.5 px-4 text-center">Attempts</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {exams.map((exam) => {
              const isPublished = exam.status === 'published';
              const shareCode = exam.shareCode || exam.id;

              return (
                <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Title & Topic */}
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {exam.title}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Topic: {exam.topic || 'General'}</div>
                  </td>

                  {/* Class & Subject */}
                  <td className="py-4 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                      <span>{exam.className}</span>
                      <span>•</span>
                      <span>{exam.subject}</span>
                    </div>
                  </td>

                  {/* Questions */}
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    {exam.questions?.length || exam.questionCount || 0}
                  </td>

                  {/* Attempts */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {exam.attemptCount || 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right space-x-1">
                    {/* Copy Link */}
                    <button
                      onClick={() => handleCopyLink(exam)}
                      title="Copy Student Share Link"
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center"
                    >
                      {copiedId === exam.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Open Student Exam View */}
                    <Link
                      href={`/exam/${shareCode}`}
                      target="_blank"
                      title="Open Exam as Student"
                      className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* View Results */}
                    <Link
                      href={`/teacher/exams/${exam.id}/results`}
                      title="View Student Results"
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>

                    {/* Delete Exam */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete exam "${exam.title}"?`)) {
                          onDelete(exam.id);
                        }
                      }}
                      title="Delete Exam"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
