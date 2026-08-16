'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { Question } from '@/types';
import { SelectedBlankItem } from './Step4BlankSelector';
import { generateId } from '@/lib/utils';

interface Step5Props {
  formData: {
    subject: string;
    className: string;
  };
  selectedBlanks: SelectedBlankItem[];
  generatedQuestions: Question[];
  onQuestionsGenerated: (questions: Question[]) => void;
  onNext: () => void;
  onBack: () => void;
}

import { useAuth } from '@/context/AuthContext';

export default function Step5GenerateMcqs({
  formData,
  selectedBlanks,
  generatedQuestions,
  onQuestionsGenerated,
  onNext,
  onBack,
}: Step5Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateAllMcqs = async () => {
    setLoading(true);
    setErrorMsg(null);
    setProgressCount(0);

    const questionsList: Question[] = [];

    for (let i = 0; i < selectedBlanks.length; i++) {
      const item = selectedBlanks[i];
      setProgressCount(i + 1);

      try {
        const res = await fetch('/api/ai/generate-mcq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || 'teacher_demo_1',
          },
          body: JSON.stringify({
            sentence: item.originalSentence,
            blankWord: item.targetBlankWord,
            subject: formData.subject,
            className: formData.className,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to generate option for item ${i + 1}`);
        }

        questionsList.push({
          id: generateId('q'),
          originalSentence: item.originalSentence,
          sentenceWithBlank: data.questionText || item.sentenceWithBlank,
          targetBlankWord: item.targetBlankWord,
          correctAnswer: data.correctAnswer || item.targetBlankWord,
          options: data.options || [item.targetBlankWord, 'Option 2', 'Option 3', 'Option 4'],
          explanation: data.explanation || `The correct answer is ${item.targetBlankWord}.`,
          order: i + 1,
        });
      } catch (err: any) {
        console.warn(`Fallback triggered for item ${i + 1}:`, err);
        // Fallback local distractor assembly
        questionsList.push({
          id: generateId('q'),
          originalSentence: item.originalSentence,
          sentenceWithBlank: item.sentenceWithBlank,
          targetBlankWord: item.targetBlankWord,
          correctAnswer: item.targetBlankWord,
          options: [item.targetBlankWord, 'Joule', 'Watt', 'Pascal'],
          explanation: `${item.targetBlankWord} is the correct answer to complete this sentence.`,
          order: i + 1,
        });
      }
    }

    onQuestionsGenerated(questionsList);
    setLoading(false);
  };

  useEffect(() => {
    if (generatedQuestions.length === 0 && selectedBlanks.length > 0) {
      generateAllMcqs();
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Step 5 — AI MCQ Answer Generation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generating 3 plausible conceptual distractors for each question using Gemini AI.
          </p>
        </div>

        <button
          type="button"
          onClick={generateAllMcqs}
          disabled={loading}
          className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate All MCQs
        </button>
      </div>

      {/* Loading Progress Bar */}
      {loading && (
        <div className="py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 animate-spin">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Generating Distractors ({progressCount} of {selectedBlanks.length})...
          </h3>
          <div className="w-full bg-slate-100 rounded-full h-3 max-w-md mx-auto mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(progressCount / selectedBlanks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Generated Questions List Preview */}
      {!loading && generatedQuestions.length > 0 && (
        <div className="space-y-6">
          {generatedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  Question {idx + 1}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  Correct Answer: {q.correctAnswer}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 mb-3">{q.sentenceWithBlank}</h4>

              {/* Option Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl font-bold text-xs text-center border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-slate-400 mr-1">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                💡 <strong>Explanation:</strong> {q.explanation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold transition-colors"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={generatedQuestions.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          Review & Finalize Questions →
        </button>
      </div>
    </div>
  );
}
