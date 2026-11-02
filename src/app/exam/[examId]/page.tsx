'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchExamByIdOrCode, saveAttempt } from '@/lib/firebase/services';
import { Exam, Question, ExamAttempt, QuestionAnswerRecord } from '@/types';
import StudentWelcome from '@/components/student/StudentWelcome';
import DndQuestion from '@/components/student/DndQuestion';
import ResultScreen from '@/components/student/ResultScreen';
import { generateId, shuffleArray } from '@/lib/utils';
import { RefreshCw, Sparkles } from 'lucide-react';

export default function StudentExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Exam flow states: 'welcome' | 'playing' | 'result'
  const [flowState, setFlowState] = useState<'welcome' | 'playing' | 'result'>('welcome');
  const [studentName, setStudentName] = useState('');

  // Active question states
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<QuestionAnswerRecord[]>([]);

  // Current question response state
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);

  // Timing tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTimeSpentSeconds, setFinalTimeSpentSeconds] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalPercentage, setFinalPercentage] = useState<number>(0);

  const loadExam = async () => {
    setLoading(true);
    try {
      const foundExam = await fetchExamByIdOrCode(examId);
      if (foundExam) {
        setExam(foundExam);
        // Prepare shuffled questions and shuffled options for students
        const shuffled = prepareShuffledQuestions(foundExam.questions);
        setActiveQuestions(shuffled);
      }
    } catch (err) {
      console.error('Failed loading exam for student:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const prepareShuffledQuestions = (questions: Question[]): Question[] => {
    return questions.map((q) => ({
      ...q,
      options: shuffleArray([...q.options]),
    }));
  };

  const handleStartExam = (name: string) => {
    setStudentName(name);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setUserAnswers([]);
    setIsAnswered(false);
    setIsCorrect(null);
    setSubmittedAnswer(null);
    setFlowState('playing');
  };

  const handleAnswerSubmit = (selectedOption: string) => {
    const currentQ = activeQuestions[currentIndex];
    const correct = selectedOption === currentQ.correctAnswer;

    setSubmittedAnswer(selectedOption);
    setIsAnswered(true);
    setIsCorrect(correct);

    // Record only the first attempt for each question so retries for learning do not overwrite the score
    setUserAnswers((prev) => {
      if (prev.some((a) => a.questionId === currentQ.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          questionId: currentQ.id,
          sentenceWithBlank: currentQ.sentenceWithBlank,
          correctAnswer: currentQ.correctAnswer,
          selectedAnswer: selectedOption,
          isCorrect: correct,
        },
      ];
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswered(false);
      setIsCorrect(null);
      setSubmittedAnswer(null);
    } else {
      // Exam complete! Calculate score
      finishExam();
    }
  };

  const finishExam = async () => {
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    setFinalTimeSpentSeconds(timeSpentSeconds);

    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const totalCount = activeQuestions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    setFinalScore(correctCount);
    setFinalPercentage(percentage);

    if (exam) {
      const attemptRecord: ExamAttempt = {
        id: generateId('att'),
        examId: exam.id,
        studentName: studentName || 'Student',
        score: correctCount,
        totalQuestions: totalCount,
        percentage,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        timeSpentSeconds,
        answers: userAnswers,
      };

      try {
        await saveAttempt(attemptRecord);
      } catch (e) {
        console.warn('Could not save student attempt:', e);
      }
    }

    setFlowState('result');
  };

  const handleTryAgain = () => {
    if (exam) {
      const reshuffled = shuffleArray(
        exam.questions.map((q) => ({ ...q, options: shuffleArray([...q.options]) }))
      );
      setActiveQuestions(reshuffled);
    }
    setStartTime(Date.now());
    setCurrentIndex(0);
    setUserAnswers([]);
    setIsAnswered(false);
    setIsCorrect(null);
    setSubmittedAnswer(null);
    setFlowState('playing');
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 animate-spin text-indigo-600">
          <RefreshCw className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-slate-700">Loading Exam Challenge...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black text-slate-800">Exam Link Invalid</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          This exam link does not exist or has been removed by the teacher.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      {flowState === 'welcome' && (
        <StudentWelcome exam={exam} onStart={handleStartExam} />
      )}

      {flowState === 'playing' && activeQuestions.length > 0 && (
        <DndQuestion
          question={activeQuestions[currentIndex]}
          questionIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          onAnswerSubmit={handleAnswerSubmit}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
          submittedAnswer={submittedAnswer}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {flowState === 'result' && (
        <ResultScreen
          score={finalScore}
          totalQuestions={activeQuestions.length}
          percentage={finalPercentage}
          answers={userAnswers}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}
