import { db, isFirebaseConfigured } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Exam, ExamAttempt, Question } from '@/types';
import { DEMO_EXAMS, DEMO_ATTEMPTS } from '@/lib/demoData';

// Local storage key helpers for seamless demo/fallback operation
const STORAGE_KEY_EXAMS = 'cdf_app_exams_v1';
const STORAGE_KEY_ATTEMPTS = 'cdf_app_attempts_v1';

function getLocalExams(): Exam[] {
  if (typeof window === 'undefined') return DEMO_EXAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(DEMO_EXAMS));
      return DEMO_EXAMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading local exams:', err);
    return DEMO_EXAMS;
  }
}

function saveLocalExams(exams: Exam[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.error('Failed saving local exams:', err);
  }
}

function getLocalAttempts(): ExamAttempt[] {
  if (typeof window === 'undefined') return DEMO_ATTEMPTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(DEMO_ATTEMPTS));
      return DEMO_ATTEMPTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading local attempts:', err);
    return DEMO_ATTEMPTS;
  }
}

function saveLocalAttempts(attempts: ExamAttempt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));
  } catch (err) {
    console.error('Failed saving local attempts:', err);
  }
}

// ---------------- FIRESTORE EXAM SERVICES ----------------

export async function fetchTeacherExams(teacherId: string): Promise<Exam[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'exams'),
        where('teacherId', '==', teacherId)
      );
      const snapshot = await getDocs(q);
      const exams = snapshot.docs.map((docSnap) => docSnap.data() as Exam);
      exams.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // Also fetch attempt counts for each exam
      for (const exam of exams) {
        const attQuery = query(collection(db, 'attempts'), where('examId', '==', exam.id));
        const attSnap = await getDocs(attQuery);
        exam.attemptCount = attSnap.size;
      }
      return exams;
    } catch (err) {
      console.warn('Firestore fetch failed, using local storage:', err);
    }
  }

  const local = getLocalExams();
  const attempts = getLocalAttempts();
  const teacherExams = local.filter((e) => e.teacherId === teacherId || teacherId === 'teacher_demo_1');

  return teacherExams.map((e) => ({
    ...e,
    attemptCount: attempts.filter((a) => a.examId === e.id || a.examId === e.shareCode).length,
  }));
}

export async function fetchExamByIdOrCode(identifier: string): Promise<Exam | null> {
  if (isFirebaseConfigured && db) {
    // 1. Direct Doc ID check
    try {
      const docRef = doc(db, 'exams', identifier);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Exam;
      }
    } catch (err) {
      console.warn('Firestore direct doc ID lookup failed:', err);
    }

    // 2. Share Code check
    try {
      const q = query(collection(db, 'exams'), where('shareCode', '==', identifier));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return qSnap.docs[0].data() as Exam;
      }
    } catch (err) {
      console.warn('Firestore shareCode query failed:', err);
    }
  }

  const local = getLocalExams();
  const found = local.find((e) => e.id === identifier || e.shareCode === identifier);
  return found || null;
}

export async function saveExam(exam: Exam): Promise<void> {
  // Format questions with exact text fields required for Firestore (no images or raw uploaded files saved)
  const formattedQuestions: Question[] = (exam.questions || []).map((q, idx) => ({
    id: q.id || `q_${idx + 1}`,
    questionId: q.questionId || q.id || `q_${idx + 1}`,
    originalSentence: q.originalSentence || q.sentence || '',
    sentence: q.originalSentence || q.sentence || '',
    sentenceWithBlank: q.sentenceWithBlank || q.questionText || '',
    questionText: q.sentenceWithBlank || q.questionText || '',
    targetBlankWord: q.targetBlankWord || q.blankText || q.correctAnswer || '',
    blankText: q.targetBlankWord || q.blankText || q.correctAnswer || '',
    correctAnswer: q.correctAnswer || q.targetBlankWord || '',
    options: Array.isArray(q.options) ? q.options : [],
    explanation: q.explanation || '',
    order: q.order ?? idx + 1,
  }));

  // Sanitized payload containing ONLY light exam structure metadata & questions
  const payload: Exam = {
    id: exam.id,
    teacherId: exam.teacherId,
    teacherName: exam.teacherName || '',
    title: exam.title,
    className: exam.className,
    subject: exam.subject,
    topic: exam.topic,
    questionCount: formattedQuestions.length,
    status: exam.status || 'published',
    shareCode: exam.shareCode,
    createdAt: exam.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: formattedQuestions,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'exams', exam.id);
      await setDoc(docRef, {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn('Firestore save failed, saving locally:', err);
    }
  }

  const local = getLocalExams();
  const index = local.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    local[index] = payload;
  } else {
    local.unshift(payload);
  }
  saveLocalExams(local);
}

export async function deleteExam(examId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'exams', examId));
      return;
    } catch (err) {
      console.warn('Firestore delete failed, deleting locally:', err);
    }
  }

  const local = getLocalExams();
  const filtered = local.filter((e) => e.id !== examId);
  saveLocalExams(filtered);
}

// ---------------- FIRESTORE ATTEMPT SERVICES ----------------

export async function saveAttempt(attempt: ExamAttempt): Promise<void> {
  // Sanitized student attempt tracking payload (No images, lightweight stats & answer track)
  const payload: ExamAttempt = {
    id: attempt.id,
    examId: attempt.examId,
    studentName: attempt.studentName || 'Student',
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage,
    startedAt: attempt.startedAt || new Date().toISOString(),
    completedAt: attempt.completedAt || new Date().toISOString(),
    timeSpentSeconds: attempt.timeSpentSeconds || 0,
    answers: (attempt.answers || []).map((a) => ({
      questionId: a.questionId,
      sentenceWithBlank: a.sentenceWithBlank,
      correctAnswer: a.correctAnswer,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
    })),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'attempts', attempt.id);
      await setDoc(docRef, {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn('Firestore save attempt failed, saving locally:', err);
    }
  }

  const local = getLocalAttempts();
  local.unshift(payload);
  saveLocalAttempts(local);
}

export async function fetchExamAttempts(examId: string): Promise<ExamAttempt[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('examId', '==', examId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const attempts = snapshot.docs.map((docSnap) => docSnap.data() as ExamAttempt);
        attempts.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
        return attempts;
      }
    } catch (err) {
      console.warn('Firestore fetch attempts failed, fetching locally:', err);
    }
  }

  const local = getLocalAttempts();
  return local.filter((a) => a.examId === examId || a.examId === `FQB-${examId}` || a.examId === `CDF-${examId}` || examId.includes(a.examId));
}

export async function deleteAttempt(attemptId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'attempts', attemptId));
      return;
    } catch (err) {
      console.warn('Firestore delete attempt failed:', err);
    }
  }

  const local = getLocalAttempts();
  const filtered = local.filter((a) => a.id !== attemptId);
  saveLocalAttempts(filtered);
}
