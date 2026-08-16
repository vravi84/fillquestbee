'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-tight">FillQuestBee Studio</span>
          <span className="text-xs text-slate-500">• AI Interactive Exams for School Children</span>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1">
          Designed with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for teachers and students
        </p>

        <div className="text-xs text-slate-500 flex flex-col sm:flex-row items-center gap-2">
          <a href="https://fillquestbee.com" className="hover:text-indigo-400 transition-colors font-medium">fillquestbee.com</a>
          <span className="hidden sm:inline">•</span>
          <span>Powered by Next.js & Google Gemini AI</span>
        </div>
      </div>
    </footer>
  );
}
