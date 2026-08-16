export type UserRole = 'teacher' | 'student' | 'admin';
export type TeacherStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type AdminStatus = 'active' | 'suspended';

export interface TeacherUser {
  uid: string;
  name: string;
  email: string;
  role?: UserRole;
  status?: TeacherStatus | AdminStatus;
  createdAt: string;
  updatedAt?: string;
  examCount?: number;
  attemptCount?: number;
  aiUsageCount?: number;
}

export interface UserProfile extends TeacherUser {
  role: UserRole;
  status: TeacherStatus | AdminStatus;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: 'Teacher approved' | 'Teacher rejected' | 'Teacher suspended' | 'Teacher reactivated' | string;
  targetTeacherId: string;
  targetTeacherName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AiUsageLog {
  id: string;
  teacherId: string;
  teacherName?: string;
  operation: 'extract_content' | 'generate_mcq';
  examId?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'rejected';
  details?: string;
}

export interface Question {
  id: string;
  questionId?: string;
  originalSentence: string;
  sentence?: string;         // Alias for originalSentence
  sentenceWithBlank: string; // "The SI unit of force is ______."
  targetBlankWord: string;   // "Newton"
  blankText?: string;        // Alias for targetBlankWord
  questionText?: string;     // Alias for sentenceWithBlank
  correctAnswer: string;     // "Newton"
  options: string[];         // ["Newton", "Joule", "Watt", "Pascal"]
  explanation: string;       // "Newton is the SI unit of force."
  order: number;
}

export type ExamStatus = 'draft' | 'published';

export interface Exam {
  id: string;
  teacherId: string;
  teacherName?: string;
  title: string;
  className: string;         // e.g. "Class 8"
  subject: string;           // e.g. "Physics"
  topic: string;             // e.g. "Force and Pressure"
  questionCount: number;
  status: ExamStatus;
  shareCode: string;         // e.g. "CDF-8F4K92"
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  attemptCount?: number;
}

export interface QuestionAnswerRecord {
  questionId: string;
  sentenceWithBlank: string;
  correctAnswer: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  answers: QuestionAnswerRecord[];
}

export interface ExtractContentRequest {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  questionCount?: number;
}

export interface ExtractedSentence {
  id: string;
  sentence: string;
  suggestedBlanks?: string[];
}

export interface GenerateMcqRequest {
  sentence: string;
  blankWord: string;
  subject?: string;
  className?: string;
}

export interface McqOptionResult {
  questionText: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}
