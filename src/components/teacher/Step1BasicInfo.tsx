'use client';

import React from 'react';
import { BookOpen, GraduationCap, Layers, Hash } from 'lucide-react';

interface Step1Props {
  formData: {
    title: string;
    className: string;
    subject: string;
    topic: string;
    questionCount: number;
  };
  onChange: (field: string, value: any) => void;
  onNext: () => void;
}

const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Science',
  'Social Studies',
  'English',
  'Computer Science',
  'General Knowledge',
];

const QUESTION_COUNTS = [10, 11, 12, 13, 14, 15];

export default function Step1BasicInfo({ formData, onChange, onNext }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter an exam title.');
      return;
    }
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Step 1 — Basic Exam Information
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Set up the subject, target class level, and total questions for your fill-in-the-blank exam.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Title */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Exam Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="e.g. Class 8 Physics - Force and Pressure"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              Class Level
            </label>
            <select
              value={formData.className}
              onChange={(e) => onChange('className', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all bg-white"
            >
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={(e) => onChange('subject', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all bg-white"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Topic / Chapter Name
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => onChange('topic', e.target.value)}
              placeholder="e.g. Force, Pressure & Friction"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all"
            />
          </div>

          {/* Question Count (10-15) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-500" />
              Number of Questions (10–15)
            </label>
            <select
              value={formData.questionCount}
              onChange={(e) => onChange('questionCount', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all bg-white"
            >
              {QUESTION_COUNTS.map((num) => (
                <option key={num} value={num}>
                  {num} Questions
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Default is 10 questions (max 15).</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Continue to Content Upload →
          </button>
        </div>
      </form>
    </div>
  );
}
