'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { ExtractedSentence } from '@/types';

export interface SelectedBlankItem {
  sentenceId: string;
  originalSentence: string;
  targetBlankWord: string;
  sentenceWithBlank: string;
}

interface Step4Props {
  extractedSentences: ExtractedSentence[];
  selectedBlanks: SelectedBlankItem[];
  onBlanksUpdated: (blanks: SelectedBlankItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4BlankSelector({
  extractedSentences,
  selectedBlanks,
  onBlanksUpdated,
  onNext,
  onBack,
}: Step4Props) {
  // Store map of sentenceId -> selected word indices
  const [selectedWordMap, setSelectedWordMap] = useState<Record<string, number[]>>(() => {
    const initialMap: Record<string, number[]> = {};
    // Pre-select first obvious noun/keyword in each sentence if available
    extractedSentences.forEach((item) => {
      const words = item.sentence.replace(/[.,!?;:]/g, '').split(/\s+/);
      const existing = selectedBlanks.find((b) => b.sentenceId === item.id);

      if (existing && existing.targetBlankWord) {
        const targetWords = existing.targetBlankWord.split(/\s+/);
        const indices: number[] = [];
        words.forEach((w, idx) => {
          if (targetWords.includes(w)) indices.push(idx);
        });
        initialMap[item.id] = indices.length > 0 ? indices : [Math.min(words.length - 2, Math.floor(words.length / 2))];
      } else {
        // Default select last or key word
        const defaultIndex = Math.max(0, words.length - 2);
        initialMap[item.id] = [defaultIndex];
      }
    });
    return initialMap;
  });

  const toggleWordSelection = (sentenceId: string, wordIndex: number) => {
    setSelectedWordMap((prev) => {
      const current = prev[sentenceId] || [];
      let updated: number[];
      if (current.includes(wordIndex)) {
        const min = Math.min(...current);
        const max = Math.max(...current);
        if (wordIndex === min || wordIndex === max) {
          updated = current.filter((i) => i !== wordIndex);
        } else {
          // Deselecting a middle word trims the phrase from that word onward to keep selection contiguous
          updated = current.filter((i) => i < wordIndex);
        }
      } else if (current.length === 0) {
        updated = [wordIndex];
      } else {
        const min = Math.min(...current);
        const max = Math.max(...current);
        if (wordIndex === min - 1 || wordIndex === max + 1) {
          updated = [...current, wordIndex].sort((a, b) => a - b);
        } else {
          // Clicking a non-adjacent word starts a new selection at that word
          updated = [wordIndex];
        }
      }
      return { ...prev, [sentenceId]: updated };
    });
  };

  const getTargetBlankWord = (sentence: string, indices: number[]): { targetWord: string; sentenceWithBlank: string } => {
    const rawTokens = sentence.split(/(\s+)/); // Preserve spaces and tokens
    const wordsWithIndices: { text: string; cleanWord: string; isWord: boolean; wordIndex: number }[] = [];

    let wIdx = 0;
    rawTokens.forEach((tok) => {
      const isWord = tok.trim().length > 0;
      wordsWithIndices.push({
        text: tok,
        cleanWord: tok.replace(/[.,!?;:]/g, ''),
        isWord,
        wordIndex: isWord ? wIdx++ : -1,
      });
    });

    const targetCleanWords: string[] = [];
    const processedTokens = wordsWithIndices.map((item) => {
      if (item.isWord && indices.includes(item.wordIndex)) {
        targetCleanWords.push(item.cleanWord);
        // Replace token word with blank, keeping trailing punctuation
        const trailingPunctuation = item.text.match(/[.,!?;:]+$/)?.[0] || '';
        return `______${trailingPunctuation}`;
      }
      return item.text;
    });

    const targetWord = targetCleanWords.join(' ');
    // Collapse consecutive blanks (from multi-word selections) into a single ______ token
    const sentenceWithBlank = processedTokens
      .join('')
      .replace(/______(?:[.,!?;:]*\s+______)+/g, '______');

    return { targetWord, sentenceWithBlank };
  };

  const handleConfirmBlanks = () => {
    const compiled: SelectedBlankItem[] = extractedSentences.map((item) => {
      const indices = selectedWordMap[item.id] || [0];
      const { targetWord, sentenceWithBlank } = getTargetBlankWord(item.sentence, indices);

      return {
        sentenceId: item.id,
        originalSentence: item.sentence,
        targetBlankWord: targetWord || 'blank',
        sentenceWithBlank,
      };
    });

    onBlanksUpdated(compiled);
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          Step 4 — Select Where Blanks Should Appear
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Click on any word or phrase in each sentence below to select it as the target blank for the student exam.
        </p>
      </div>

      <div className="space-y-6">
        {extractedSentences.map((item, sIndex) => {
          const rawTokens = item.sentence.split(/\s+/);
          const selectedIndices = selectedWordMap[item.id] || [];
          const { targetWord, sentenceWithBlank } = getTargetBlankWord(item.sentence, selectedIndices);

          return (
            <div
              key={item.id}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  Question {sIndex + 1}
                </span>

                <span className="text-xs font-semibold text-slate-500">
                  Selected Blank:{' '}
                  <strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {targetWord || 'None (Click a word below)'}
                  </strong>
                </span>
              </div>

              {/* Interactive Word Selector */}
              <div className="flex flex-wrap gap-1.5 p-4 bg-white rounded-xl border border-slate-200 mb-3">
                {rawTokens.map((wordToken, wIndex) => {
                  const isSelected = selectedIndices.includes(wIndex);
                  return (
                    <button
                      key={wIndex}
                      type="button"
                      onClick={() => toggleWordSelection(item.id, wIndex)}
                      className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all transform active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {wordToken}
                    </button>
                  );
                })}
              </div>

              {/* Result Preview */}
              <div className="text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Preview:</strong> {sentenceWithBlank}
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
          onClick={handleConfirmBlanks}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          Generate MCQ Distractors with AI →
        </button>
      </div>
    </div>
  );
}
