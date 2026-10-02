export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  subjectId: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: OptionKey;
  explanation: string;
  difficulty?: 'Mudah' | 'Sedang' | 'Sulit';
}

export interface Subject {
  id: string;
  name: string;
  iconName: string; // Lucide icon identifier
  color: string; // Tailwind color theme identifier
  description: string;
  gradeLevel?: string;
  isCustom?: boolean;
  teacherName?: string; // Nama guru pengampu mata pelajaran
  targetQuestionCount?: number; // Jumlah butir soal yang diujikan/dikerjakan murid
  timerMode?: 'per_question' | 'total_quiz' | 'none';
  timerSecondsPerQuestion?: number;
  totalQuizMinutes?: number;
  passingGrade?: number;
  teacherNotes?: string; // Pesan / arahan guru untuk siswa
}

export interface QuizSettings {
  timerMode: 'per_question' | 'total_quiz' | 'none';
  timerSecondsPerQuestion: number; // e.g., 60 seconds
  totalQuizMinutes: number; // e.g., 15 minutes
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passingGrade: number; // default 75 (KKM)
  questionCount: number; // Jumlah soal yang dikerjakan murid
  teacherName?: string;
}

export interface StudentInfo {
  name: string;
  studentClass: string;
  nis: string;
}

export interface QuizAnswerRecord {
  questionId: string;
  selectedOption: OptionKey | null;
  isCorrect: boolean;
  isFlagged: boolean; // Ragu-ragu
  timeTakenSeconds: number;
}

export interface QuizResult {
  id: string;
  student: StudentInfo;
  subjectId: string;
  subjectName: string;
  teacherName?: string; // Nama guru pengampu saat kuis dikerjakan
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  score: number; // 0 - 100
  passed: boolean;
  passingGrade: number;
  timeSpentSeconds: number;
  timestamp: string; // ISO date string
  answers: Record<string, QuizAnswerRecord>;
  questions: Question[]; // Snapshot of questions answered
}

export type AppView = 'login' | 'quiz' | 'result' | 'bank_soal' | 'rekap_nilai' | 'review';
