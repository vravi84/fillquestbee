'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Share2, Sparkles, LayoutDashboard } from 'lucide-react';
import { Exam } from '@/types';

interface Step7Props {
  publishedExam: Exam;
}

export default function Step7PublishExam({ publishedExam }: Step7Props) {
  const [copied, setCopied] = useState(false);

  const shareCode = publishedExam.shareCode || publishedExam.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/exam/${shareCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: publishedExam.title,
          text: `Take the interactive CDF Exam: ${publishedExam.title}`,
          url: shareUrl,
        });
      } catch (e) {
        console.log('Share dismissed:', e);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-md max-w-2xl mx-auto text-center">
      {/* Celebration Header */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 animate-bounce">
        <Sparkles className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        🎉 Exam Published Successfully!
      </h2>
      <p className="text-slate-600 text-base mt-2 max-w-md mx-auto">
        Your interactive CDF exam <strong className="text-indigo-600">"{publishedExam.title}"</strong> is live and ready for students.
      </p>

      {/* Share Box */}
      <div className="my-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Unique Exam Code & Student Link
        </div>

        <div className="text-2xl font-black text-indigo-700 tracking-wider mb-4 bg-white py-2.5 px-4 rounded-xl border border-indigo-100 inline-block shadow-2xs">
          {shareCode}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-sm outline-none"
          />

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleNativeShare}
          className="w-full sm:w-auto px-6 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Exam
        </button>

        <Link
          href={`/exam/${shareCode}`}
          target="_blank"
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open Exam as Student
        </Link>

        <Link
          href="/teacher/dashboard"
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
