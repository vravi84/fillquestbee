'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Save,
  Eye,
} from 'lucide-react';
import { Question } from '@/types';
import { generateId } from '@/lib/utils';

interface Step6Props {
  questions: Question[];
  onQuestionsUpdated: (questions: Question[]) => void;
  onNext: () => void;
  onBack: () => void;
  onPreview: () => void;
}

export default function Step6ReviewExam({
  questions,
  onQuestionsUpdated,
  onNext,
  onBack,
  onPreview,
}: Step6Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);

  const handleStartEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm({ ...q, options: [...q.options] });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const updated = questions.map((q) => (q.id === editForm.id ? editForm : q));
    onQuestionsUpdated(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (questions.length <= 1) {
      alert('An exam must have at least 1 question.');
      return;
    }
    const updated = questions.filter((q) => q.id !== id);
    onQuestionsUpdated(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const list = [...questions];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign order
    list.forEach((q, idx) => (q.order = idx + 1));
    onQuestionsUpdated(list);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: generateId('q'),
      originalSentence: 'A force can change the direction of a moving object.',
      sentenceWithBlank: 'A force can change the ______ of a moving object.',
      targetBlankWord: 'direction',
      correctAnswer: 'direction',
      options: ['direction', 'speed', 'shape', 'mass'],
      explanation: 'Force alters velocity vectors including movement direction.',
      order: questions.length + 1,
    };
    onQuestionsUpdated([...questions, newQ]);
    handleStartEdit(newQ);
  };

  const handleOptionChange = (optIdx: number, value: string) => {
    if (!editForm) return;
    const opts = [...editForm.options];
    const oldVal = opts[optIdx];
    opts[optIdx] = value;

    // If changing the option that was correct answer, update correct answer too
    let newCorrect = editForm.correctAnswer;
    if (oldVal === editForm.correctAnswer) {
      newCorrect = value;
    }

    setEditForm({ ...editForm, options: opts, correctAnswer: newCorrect });
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            Step 6 — Teacher Question Review Stage
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and edit questions, blank words, answer choices, explanations, and question order before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="text-xs font-bold px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview Exam
          </button>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-xs font-bold px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const isEditing = editingId === q.id;

          return (
            <div
              key={q.id}
              className={`p-6 rounded-2xl border transition-all ${
                isEditing
                  ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-100'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                  Question {idx + 1} of {questions.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-white"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === questions.length - 1}
                    title="Move Down"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-white"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => handleStartEdit(q)}
                        title="Edit Question"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        title="Delete Question"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editing Form vs Display */}
              {isEditing && editForm ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Question Sentence (with ______ blank)
                    </label>
                    <input
                      type="text"
                      value={editForm.sentenceWithBlank}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sentenceWithBlank: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 text-sm font-semibold text-slate-800 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correct Blank Word / Answer
                    </label>
                    <input
                      type="text"
                      value={editForm.correctAnswer}
                      onChange={(e) =>
                        setEditForm({ ...editForm, correctAnswer: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 text-sm font-semibold text-slate-800 outline-none bg-white"
                    />
                  </div>

                  {/* 4 Options editor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      MCQ Options (Select radio for Correct Answer)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editForm.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200"
                        >
                          <input
                            type="radio"
                            name={`correct_${editForm.id}`}
                            checked={editForm.correctAnswer === opt}
                            onChange={() =>
                              setEditForm({ ...editForm, correctAnswer: opt })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-400">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                            className="flex-1 text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Explanation
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.explanation}
                      onChange={(e) =>
                        setEditForm({ ...editForm, explanation: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 text-xs font-medium text-slate-800 outline-none bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-base font-bold text-slate-900 mb-3">{q.sentenceWithBlank}</h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = opt === q.correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl font-bold text-xs text-center border ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreview}
            className="px-5 py-2.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl font-bold transition-colors"
          >
            Preview Exam
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Publish CDF Exam 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
