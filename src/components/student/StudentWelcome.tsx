'use client';

import React, { useState } from 'react';
import { Rocket, Sparkles, BookOpen, GraduationCap, HelpCircle } from 'lucide-react';
import { Exam } from '@/types';

interface StudentWelcomeProps {
  exam: Exam;
  onStart: (studentName: string) => void;
}

export default function StudentWelcome({ exam, onStart }: StudentWelcomeProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name to start the challenge!');
      return;
    }
    onStart(name.trim());
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-12 2xl:p-16 border-2 border-indigo-100 shadow-xl max-w-lg 2xl:max-w-2xl 3xl:max-w-3xl w-full text-center relative overflow-hidden">
        {/* Playful background decorative shapes */}
        <div className="absolute -top-12 -right-12 w-32 h-32 2xl:w-48 2xl:h-48 bg-purple-100 rounded-full blur-xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 2xl:w-48 2xl:h-48 bg-indigo-100 rounded-full blur-xl opacity-60 pointer-events-none" />

        {/* Icon Header */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 2xl:w-28 2xl:h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 transform hover:scale-105 transition-transform">
          <Rocket className="w-8 h-8 sm:w-10 sm:h-10 2xl:w-14 2xl:h-14 animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs 2xl:text-sm font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
          <Sparkles className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
          Interactive Drag & Drop Exam
        </span>

        <h1 className="text-2xl sm:text-4xl 2xl:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
          {exam.title}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm 2xl:text-base font-bold text-slate-500 mb-8">
          <span className="px-3 py-1 bg-slate-100 rounded-lg">{exam.className}</span>
          <span className="hidden sm:inline">•</span>
          <span className="px-3 py-1 bg-slate-100 rounded-lg">{exam.subject}</span>
          <span className="hidden sm:inline">•</span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg">
            {exam.questions.length} Questions
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 2xl:space-y-8">
          <div className="text-left">
            <label className="block text-xs 2xl:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Enter Your Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full px-5 py-4 2xl:py-6 rounded-2xl border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-bold text-base sm:text-lg 2xl:text-2xl text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 text-center"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 2xl:py-6 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-lg 2xl:text-2xl rounded-2xl shadow-lg shadow-indigo-300 hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Start Challenge</span>
            <Rocket className="w-5 h-5 2xl:w-7 2xl:h-7" />
          </button>
        </form>

        <p className="text-xs 2xl:text-sm text-slate-400 mt-6">
          Drag the correct answers into the blank drop zones. Have fun! 🚀
        </p>
      </div>
    </div>
  );
}
