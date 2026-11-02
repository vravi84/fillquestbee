'use client';

import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Sparkles, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Question } from '@/types';
import confetti from 'canvas-confetti';

interface DndQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSubmit: (selectedAnswer: string) => void;
  isAnswered: boolean;
  isCorrect: boolean | null;
  submittedAnswer: string | null;
  onNextQuestion: () => void;
}

// Draggable Option Card Component
function DraggableOptionCard({
  id,
  text,
  isDisabled,
  isSelectedTap,
  onTapSelect,
}: {
  id: string;
  text: string;
  isDisabled: boolean;
  isSelectedTap: boolean;
  onTapSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isDisabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onTapSelect}
      className={`p-4 sm:p-5 2xl:p-7 3xl:p-9 rounded-2xl 2xl:rounded-3xl font-black text-sm sm:text-base 2xl:text-2xl 3xl:text-3xl text-center cursor-grab active:cursor-grabbing border-2 transition-all transform select-none touch-target-lg ${
        isDragging
          ? 'bg-indigo-600 text-white border-indigo-400 shadow-2xl scale-105 opacity-90'
          : isSelectedTap
          ? 'bg-purple-600 text-white border-purple-400 shadow-lg ring-4 ring-purple-200'
          : isDisabled
          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
          : 'bg-white hover:bg-indigo-50 text-slate-800 border-indigo-200 hover:border-indigo-400 shadow-md hover:shadow-lg active:scale-95'
      }`}
    >
      {text}
    </div>
  );
}

// Droppable Blank Zone Component
function DroppableBlankZone({
  isDropped,
  droppedAnswer,
  isCorrect,
  onTapPlace,
}: {
  isDropped: boolean;
  droppedAnswer: string | null;
  isCorrect: boolean | null;
  onTapPlace: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'blank-drop-zone',
  });

  return (
    <span
      ref={setNodeRef}
      onClick={onTapPlace}
      className={`inline-flex items-center justify-center min-w-[130px] sm:min-w-[180px] 2xl:min-w-[240px] 3xl:min-w-[300px] px-3.5 sm:px-5 2xl:px-8 py-1.5 sm:py-2.5 2xl:py-4 mx-1 sm:mx-2 rounded-2xl 2xl:rounded-3xl font-black text-base sm:text-xl 2xl:text-3xl 3xl:text-4xl border-2 border-dashed transition-all cursor-pointer ${
        isCorrect === true
          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg scale-105 animate-bounce'
          : isCorrect === false
          ? 'bg-rose-500 text-white border-rose-400 shadow-md animate-shake'
          : isOver
          ? 'bg-indigo-500 text-white border-indigo-400 shadow-xl scale-110 ring-4 ring-indigo-200'
          : isDropped
          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
          : 'bg-indigo-50 text-indigo-700 border-indigo-400 hover:bg-indigo-100 shadow-inner'
      }`}
    >
      {isDropped ? (
        <span>{droppedAnswer}</span>
      ) : isOver ? (
        <span className="animate-pulse">Drop Here! ✨</span>
      ) : (
        <span className="text-xs sm:text-base 2xl:text-2xl font-bold text-indigo-500 flex items-center gap-1">
          [ Drop Answer Here ]
        </span>
      )}
    </span>
  );
}

export default function DndQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswerSubmit,
  isAnswered,
  isCorrect,
  submittedAnswer,
  onNextQuestion,
}: DndQuestionProps) {
  const [selectedTapOption, setSelectedTapOption] = useState<string | null>(null);

  // Configure touch and mouse sensors for dnd-kit
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && over.id === 'blank-drop-zone') {
      const selectedText = active.id as string;
      handleOptionDrop(selectedText);
    }
  };

  const handleOptionDrop = (optionText: string) => {
    setSelectedTapOption(null);
    if (optionText === question.correctAnswer) {
      // Trigger Confetti explosion for positive reinforcement
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        console.log('Confetti trigger', e);
      }
    }
    onAnswerSubmit(optionText);
  };

  const handleTapOptionSelect = (optionText: string) => {
    if (isCorrect === true) return;
    if (selectedTapOption === optionText) {
      setSelectedTapOption(null);
    } else {
      setSelectedTapOption(optionText);
    }
  };

  const handleTapBlankPlace = () => {
    if (selectedTapOption && isCorrect !== true) {
      handleOptionDrop(selectedTapOption);
    }
  };

  // Render sentence with blank component inserted
  const renderSentence = () => {
    const normalizedSentence = question.sentenceWithBlank.replace(/______(?:[.,!?;:]*\s+______)+/g, '______');
    const parts = normalizedSentence.split('______');
    const afterBlank = parts.slice(1).join(' ______ ');
    return (
      <div className="text-lg sm:text-2xl 2xl:text-3xl 3xl:text-4xl font-extrabold text-slate-800 leading-relaxed text-center py-6 sm:py-8 2xl:py-12 px-4 sm:px-8 2xl:px-12 bg-indigo-50/40 rounded-3xl border border-indigo-100 mb-6 sm:mb-8 2xl:mb-12 shadow-xs flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <span>{parts[0]}</span>
        <DroppableBlankZone
          isDropped={isAnswered}
          droppedAnswer={submittedAnswer}
          isCorrect={isCorrect}
          onTapPlace={handleTapBlankPlace}
        />
        <span>{afterBlank}</span>
      </div>
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-3xl p-5 sm:p-10 2xl:p-14 3xl:p-16 border-2 border-indigo-100 shadow-xl max-w-3xl lg:max-w-4xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto">
        {/* Progress Bar Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm 2xl:text-base font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-3.5 py-1.5 rounded-full">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 2xl:h-3.5 rounded-full transition-all ${
                  i === questionIndex
                    ? 'w-8 sm:w-10 2xl:w-12 bg-indigo-600'
                    : i < questionIndex
                    ? 'w-3 sm:w-4 2xl:w-5 bg-emerald-500'
                    : 'w-3 sm:w-4 2xl:w-5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Sentence with Blank */}
        {renderSentence()}

        {/* Feedback Message overlay */}
        {isAnswered && (
          <div
            className={`p-5 2xl:p-8 rounded-2xl 2xl:rounded-3xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in ${
              isCorrect
                ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-2 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 2xl:w-16 2xl:h-16 rounded-2xl flex items-center justify-center text-2xl 2xl:text-4xl font-black shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isCorrect ? '🎉' : '😊'}
              </div>
              <div>
                <h4 className="font-extrabold text-base sm:text-lg 2xl:text-2xl">
                  {isCorrect ? 'Awesome! Correct Answer! ⭐' : 'Almost! Try again 😊'}
                </h4>
                <p className="text-xs sm:text-sm 2xl:text-lg font-medium opacity-90 mt-0.5">
                  {question.explanation}
                </p>
              </div>
            </div>

            {isCorrect ? (
              <button
                onClick={onNextQuestion}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 2xl:py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base 2xl:text-xl rounded-xl 2xl:rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 transform active:scale-95"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4 2xl:w-6 2xl:h-6" />
              </button>
            ) : (
              <p className="text-xs sm:text-sm 2xl:text-base font-bold text-rose-700 bg-white px-3.5 py-2 rounded-xl border border-rose-200 shrink-0 text-center">
                Drag or tap another option!
              </p>
            )}
          </div>
        )}

        {/* Answer Option Bank */}
        <div>
          <div className="text-xs sm:text-sm 2xl:text-base font-extrabold text-slate-400 uppercase tracking-wider text-center mb-4">
            {selectedTapOption
              ? 'Tap the blank box above to place your answer!'
              : 'Drag answer or tap to select:'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 2xl:gap-6">
            {question.options.map((optionText) => (
              <DraggableOptionCard
                key={optionText}
                id={optionText}
                text={optionText}
                isDisabled={isCorrect === true}
                isSelectedTap={selectedTapOption === optionText}
                onTapSelect={() => handleTapOptionSelect(optionText)}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
