'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Check, Edit2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { ExtractedSentence } from '@/types';

interface Step3Props {
  contentData: {
    text: string;
    imageBase64?: string;
    mimeType?: string;
    questionCount: number;
  };
  extractedSentences: ExtractedSentence[];
  onSentencesExtracted: (sentences: ExtractedSentence[]) => void;
  onNext: () => void;
  onBack: () => void;
}

import { useAuth } from '@/context/AuthContext';

export default function Step3ExtractSentences({
  contentData,
  extractedSentences,
  onSentencesExtracted,
  onNext,
  onBack,
}: Step3Props) {
  const { user, getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('🔍 Reading your lesson...');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSentences = async () => {
    if (!user) {
      setErrorMsg('Please log in again to continue.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLoadingStage('🔍 Reading your lesson...');

    const stageTimer1 = setTimeout(() => setLoadingStage('🧠 Finding important concepts...'), 1200);
    const stageTimer2 = setTimeout(() => setLoadingStage('✨ Creating your questions...'), 2400);

    try {
      let token = '';
      try {
        token = (await getIdToken()) || '';
      } catch (tokenErr) {
        console.warn('Failed to retrieve ID token:', tokenErr);
        throw new Error('Your login session has expired. Please sign in again.');
      }

      if (!token) {
        throw new Error('Your login session has expired. Please sign in again.');
      }

      const res = await fetch('/api/ai/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: contentData.text,
          imageBase64: contentData.imageBase64,
          mimeType: contentData.mimeType,
          questionCount: contentData.questionCount || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your login session is invalid or expired. Please sign in again.');
        }
        throw new Error(data.error || 'Failed to extract sentences.');
      }

      if (data.sentences && data.sentences.length > 0) {
        onSentencesExtracted(data.sentences);
      } else {
        throw new Error('No suitable sentences were extracted. Please provide clearer content.');
      }
    } catch (err: any) {
      console.error('Error extracting sentences:', err);
      setErrorMsg(err.message || 'Error occurred while extracting sentences.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (extractedSentences.length === 0) {
      fetchSentences();
    }
  }, []);

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    const updated = extractedSentences.map((s) => (s.id === id ? { ...s, sentence: editText } : s));
    onSentencesExtracted(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = extractedSentences.filter((s) => s.id !== id);
    onSentencesExtracted(updated);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Step 3 — AI Sentence Extraction
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review the factual statements extracted from your lesson content.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSentences}
          disabled={loading}
          className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-extract Sentences
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 animate-pulse">{loadingStage}</h3>
          <p className="text-xs text-slate-400 mt-1">Analyzing educational concepts and factual statements...</p>
        </div>
      )}

      {/* Error View */}
      {errorMsg && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchSentences}
            className="text-xs font-bold px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Sentences List */}
      {!loading && extractedSentences.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Extracted Sentences ({extractedSentences.length})</span>
            <span>Target Question Count: {contentData.questionCount}</span>
          </div>

          <div className="space-y-3">
            {extractedSentences.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-50 hover:bg-indigo-50/40 p-4 rounded-xl border border-slate-200 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>

                  {editingId === item.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-300 text-sm font-medium text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                      {item.sentence}
                    </p>
                  )}
                </div>

                {editingId !== item.id && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditText(item.sentence);
                      }}
                      title="Edit Sentence"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete Sentence"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
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
          disabled={extractedSentences.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          Select Blanks for Each Sentence →
        </button>
      </div>
    </div>
  );
}
