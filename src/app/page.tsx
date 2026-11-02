'use client';

import React from 'react';
import { Sparkles, BookOpen, Rocket } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 2xl:w-[600px] 2xl:h-[600px] bg-indigo-200/50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 2xl:px-6 2xl:py-2.5 rounded-full text-xs sm:text-sm 2xl:text-base font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6 shadow-2xs">
          <Sparkles className="w-4 h-4 2xl:w-5 2xl:h-5 text-indigo-600 animate-pulse" />
          <span>AI-Powered Interactive FillQuestBee Exam Generator</span>
        </div>

        <h1 className="text-3xl sm:text-6xl 2xl:text-7xl 3xl:text-8xl font-black text-slate-900 tracking-tight max-w-4xl 2xl:max-w-6xl mx-auto leading-tight">
          Turn School Lessons into{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Interactive Drag & Drop Exams
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl 2xl:text-2xl 3xl:text-3xl text-slate-600 max-w-2xl 2xl:max-w-4xl mx-auto font-medium leading-relaxed">
          Teachers upload textbook pages or notes, Google Gemini AI extracts key concepts, and children learn through fun interactive fill-in-the-blank practice!
        </p>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 2xl:mb-16">
          <h2 className="text-2xl sm:text-4xl 2xl:text-5xl font-extrabold text-slate-900 tracking-tight">
            Designed for Teachers & School Children
          </h2>
          <p className="text-slate-500 text-sm sm:text-base 2xl:text-xl mt-2">
            Build high-quality educational practice exams in 6 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 2xl:gap-12">
          <div className="bg-white p-6 sm:p-8 2xl:p-12 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 2xl:w-16 2xl:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 2xl:w-8 2xl:h-8" />
            </div>
            <h3 className="text-xl 2xl:text-2xl font-bold text-slate-900 mb-2">1. Ingest Any Content</h3>
            <p className="text-sm sm:text-base 2xl:text-lg text-slate-500 leading-relaxed">
              Paste lesson text or upload textbook images (JPG, PNG) and PDF documents. Gemini AI reads multimodal materials.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 2xl:p-12 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 2xl:w-16 2xl:h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 2xl:w-8 2xl:h-8" />
            </div>
            <h3 className="text-xl 2xl:text-2xl font-bold text-slate-900 mb-2">2. Interactive Blank Selector</h3>
            <p className="text-sm sm:text-base 2xl:text-lg text-slate-500 leading-relaxed">
              Teachers click any target word or phrase in extracted sentences to create custom blanks before generating plausible distractors.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 2xl:p-12 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 2xl:w-16 2xl:h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 2xl:w-8 2xl:h-8" />
            </div>
            <h3 className="text-xl 2xl:text-2xl font-bold text-slate-900 mb-2">3. Gamified Drag & Drop</h3>
            <p className="text-sm sm:text-base 2xl:text-lg text-slate-500 leading-relaxed">
              Students drag answer cards into sentence drop zones with real-time confetti celebrations and positive feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
