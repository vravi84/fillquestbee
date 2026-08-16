'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { saveExam } from '@/lib/firebase/services';
import { Exam, Question, ExtractedSentence } from '@/types';
import { generateId, generateShareCode } from '@/lib/utils';
import Step1BasicInfo from '@/components/teacher/Step1BasicInfo';
import Step2ContentIngestion from '@/components/teacher/Step2ContentIngestion';
import Step3ExtractSentences from '@/components/teacher/Step3ExtractSentences';
import Step4BlankSelector, { SelectedBlankItem } from '@/components/teacher/Step4BlankSelector';
import Step5GenerateMcqs from '@/components/teacher/Step5GenerateMcqs';
import Step6ReviewExam from '@/components/teacher/Step6ReviewExam';
import Step7PublishExam from '@/components/teacher/Step7PublishExam';
import DndQuestion from '@/components/student/DndQuestion';
import { Sparkles, Eye, CheckCircle2 } from 'lucide-react';

const STEPS = [
  '1. Basic Info',
  '2. Content Upload',
  '3. Sentence Extraction',
  '4. Select Blanks',
  '5. Generate MCQs',
  '6. Review Questions',
  '7. Publish',
];

export default function CreateExamWizardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/teacher/login');
      return;
    }
    if (user && user.role === 'teacher') {
      if (user.status === 'pending') {
        router.push('/teacher/pending');
      } else if (user.status === 'suspended') {
        router.push('/teacher/suspended');
      } else if (user.status === 'rejected') {
        router.push('/teacher/rejected');
      }
    }
  }, [user, authLoading, router]);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 Form Data
  const [formData, setFormData] = useState({
    title: 'Class 8 Physics - Force and Pressure',
    className: 'Class 8',
    subject: 'Physics',
    topic: 'Force and Pressure',
    questionCount: 10,
  });

  // Step 2 Content Data
  const [contentData, setContentData] = useState<{
    mode: 'text' | 'image' | 'pdf' | 'multi-image';
    text: string;
    imageBase64?: string;
    fileName?: string;
    mimeType?: string;
  }>({
    mode: 'text',
    text: `Force is a push or pull acting on an object. The SI unit of force is Newton. Pressure is defined as force applied per unit area. Friction always opposes relative motion between two surfaces. Atmospheric pressure decreases as altitude increases. Gravitational force is an attractive force between two masses. The instrument used to measure atmospheric pressure is a barometer. Electrostatic force is exerted by a charged body on another. The unit of pressure is Pascal which equals one Newton per square meter. Force can change the shape and speed of an object in motion.`,
  });

  // Step 3 Sentences Data
  const [extractedSentences, setExtractedSentences] = useState<ExtractedSentence[]>([]);

  // Step 4 Blank Items Data
  const [selectedBlanks, setSelectedBlanks] = useState<SelectedBlankItem[]>([]);

  // Step 5 & 6 Questions Data
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Step 7 Published Exam
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewAnswered, setPreviewAnswered] = useState(false);
  const [previewIsCorrect, setPreviewIsCorrect] = useState<boolean | null>(null);
  const [previewSubmittedAnswer, setPreviewSubmittedAnswer] = useState<string | null>(null);

  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentDataChange = (field: string, value: any) => {
    setContentData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePublish = async () => {
    const examId = generateId('exam');
    const shareCode = generateShareCode();

    const newExam: Exam = {
      id: examId,
      teacherId: user?.uid || 'teacher_demo_1',
      teacherName: user?.name || 'Prof. Sarah Jenkins',
      title: formData.title,
      className: formData.className,
      subject: formData.subject,
      topic: formData.topic,
      questionCount: generatedQuestions.length,
      status: 'published',
      shareCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: generatedQuestions,
    };

    try {
      await saveExam(newExam);
      setPublishedExam(newExam);
      setCurrentStep(7);
    } catch (err) {
      console.error('Failed to publish exam:', err);
      alert('Error publishing exam. Saved locally.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Wizard Step Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 px-1">
          <span>Step {currentStep} of 7</span>
          <span className="text-indigo-600 font-extrabold">{STEPS[currentStep - 1]}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((stepName, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`h-2 w-full rounded-full transition-all ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-600 ring-2 ring-indigo-200'
                      : 'bg-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Render Switch */}
      {currentStep === 1 && (
        <Step1BasicInfo
          formData={formData}
          onChange={handleFormDataChange}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <Step2ContentIngestion
          contentData={contentData}
          onChange={handleContentDataChange}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3ExtractSentences
          contentData={{ ...contentData, questionCount: formData.questionCount }}
          extractedSentences={extractedSentences}
          onSentencesExtracted={(s) => setExtractedSentences(s)}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <Step4BlankSelector
          extractedSentences={extractedSentences}
          selectedBlanks={selectedBlanks}
          onBlanksUpdated={(b) => setSelectedBlanks(b)}
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <Step5GenerateMcqs
          formData={{ subject: formData.subject, className: formData.className }}
          selectedBlanks={selectedBlanks}
          generatedQuestions={generatedQuestions}
          onQuestionsGenerated={(q) => setGeneratedQuestions(q)}
          onNext={() => setCurrentStep(6)}
          onBack={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 6 && (
        <Step6ReviewExam
          questions={generatedQuestions}
          onQuestionsUpdated={(q) => setGeneratedQuestions(q)}
          onNext={handlePublish}
          onBack={() => setCurrentStep(5)}
          onPreview={() => {
            setPreviewQuestionIndex(0);
            setPreviewAnswered(false);
            setShowPreviewModal(true);
          }}
        />
      )}

      {currentStep === 7 && publishedExam && (
        <Step7PublishExam publishedExam={publishedExam} />
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && generatedQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-100 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 font-extrabold text-xs rounded-full">
                  Student View Preview
                </span>
                <span className="font-bold text-slate-800 text-sm">{formData.title}</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close Preview ✕
              </button>
            </div>

            <DndQuestion
              question={generatedQuestions[previewQuestionIndex]}
              questionIndex={previewQuestionIndex}
              totalQuestions={generatedQuestions.length}
              isAnswered={previewAnswered}
              isCorrect={previewIsCorrect}
              submittedAnswer={previewSubmittedAnswer}
              onAnswerSubmit={(ans) => {
                setPreviewSubmittedAnswer(ans);
                setPreviewAnswered(true);
                setPreviewIsCorrect(ans === generatedQuestions[previewQuestionIndex].correctAnswer);
              }}
              onNextQuestion={() => {
                if (previewQuestionIndex < generatedQuestions.length - 1) {
                  setPreviewQuestionIndex((prev) => prev + 1);
                  setPreviewAnswered(false);
                  setPreviewIsCorrect(null);
                  setPreviewSubmittedAnswer(null);
                } else {
                  alert('End of preview exam questions!');
                  setShowPreviewModal(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
