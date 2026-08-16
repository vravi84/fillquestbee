'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, RotateCcw, CheckCircle2, XCircle, Sparkles, Home } from 'lucide-react';
import { QuestionAnswerRecord } from '@/types';

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: QuestionAnswerRecord[];
  onTryAgain: () => void;
}

export default function ResultScreen({
  score,
  totalQuestions,
  percentage,
  answers,
  onTryAgain,
}: ResultScreenProps) {
  // Score-tailored messaging & star rating
  let stars = '⭐⭐⭐⭐⭐';
  let message = "Amazing! You're a superstar! 🌟";
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';

  if (percentage >= 90) {
    stars = '⭐⭐⭐⭐⭐';
    message = "Amazing! You're a superstar! 🌟";
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (percentage >= 70) {
    stars = '⭐⭐⭐⭐';
    message = 'Great job! Keep practicing! 🚀';
    badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
  } else if (percentage >= 50) {
    stars = '⭐⭐⭐';
    message = 'Good effort! You are getting there! 💪';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  } else {
    stars = '⭐⭐';
    message = "Keep going! You've got this! 💖";
    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-indigo-100 shadow-2xl max-w-xl w-full text-center relative overflow-hidden">
        {/* Trophy Header */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200 animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>

        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border mb-4 ${badgeColor}`}>
          {message}
        </span>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
          {score} / {totalQuestions}
        </h1>
        <p className="text-2xl font-black text-indigo-600 mb-2">{percentage}% Score</p>
        <div className="text-2xl mb-6">{stars}</div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={onTryAgain}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-base rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again 🔄</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>Finish</span>
          </Link>
        </div>

        {/* Question Review Table */}
        <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
            Question Review
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {answers.map((ans, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className="font-bold text-slate-400 shrink-0">Q{idx + 1}.</span>
                  <span className="text-slate-800 truncate">{ans.sentenceWithBlank}</span>
                </div>

                {ans.isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Try Again
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
