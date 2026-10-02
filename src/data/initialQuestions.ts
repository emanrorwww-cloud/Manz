import { Question, Subject } from '../types';
import { MATEMATIKA_QUESTIONS } from './questions/matematika';
import { IPA_QUESTIONS } from './questions/ipa';
import { BAHASA_INDONESIA_QUESTIONS } from './questions/bahasaIndonesia';
import { BAHASA_INGGRIS_QUESTIONS } from './questions/bahasaInggris';
import { PENGETAHUAN_UMUM_QUESTIONS } from './questions/pengetahuanUmum';

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    iconName: 'Calculator',
    color: 'blue',
    description: 'Aritmetika, Aljabar, Geometri, dan Logika Hitungan',
    gradeLevel: 'SMP / MTs & SMA',
    teacherName: 'Ibu Ratna Dewi, S.Pd.',
    targetQuestionCount: 40, // 35 - 50 soal ujian sekolah
    timerMode: 'total_quiz',
    timerSecondsPerQuestion: 60,
    totalQuizMinutes: 90,
    passingGrade: 75,
    teacherNotes: 'Kerjakan 35-50 butir soal hitungan dengan cermat dan teliti.',
  },
  {
    id: 'ipa',
    name: 'Ilmu Pengetahuan Alam (IPA)',
    iconName: 'Atom',
    color: 'emerald',
    description: 'Biologi, Fisika dasar, dan Fenomena Alam Semesta',
    gradeLevel: 'SMP / MTs & SMA',
    teacherName: 'Pak Hendra Kusuma, M.Pd.',
    targetQuestionCount: 40, // 35 - 50 soal ujian sekolah
    timerMode: 'total_quiz',
    timerSecondsPerQuestion: 60,
    totalQuizMinutes: 90,
    passingGrade: 75,
    teacherNotes: 'Pahami konsep sains dan fenomena alam sebelum memilih jawaban.',
  },
  {
    id: 'bahasa_indonesia',
    name: 'Bahasa Indonesia',
    iconName: 'BookOpen',
    color: 'amber',
    description: 'Tata Bahasa, Pemahaman Teks, EYD, dan Sastra',
    gradeLevel: 'Semua Jenjang',
    teacherName: 'Ibu Siti Aminah, S.Pd.',
    targetQuestionCount: 40, // 35 - 50 soal ujian sekolah
    timerMode: 'total_quiz',
    timerSecondsPerQuestion: 60,
    totalQuizMinutes: 90,
    passingGrade: 75,
    teacherNotes: 'Baca teks bacaan dan kutipan soal secara seksama.',
  },
  {
    id: 'bahasa_inggris',
    name: 'Bahasa Inggris',
    iconName: 'Languages',
    color: 'purple',
    description: 'Grammar, Vocabulary, Reading & Everyday Expressions',
    gradeLevel: 'Semua Jenjang',
    teacherName: 'Mr. Kevin Pratama, B.Ed.',
    targetQuestionCount: 40, // 35 - 50 soal ujian sekolah
    timerMode: 'total_quiz',
    timerSecondsPerQuestion: 60,
    totalQuizMinutes: 90,
    passingGrade: 75,
    teacherNotes: 'Pay close attention to tense, grammar rules, and context.',
  },
  {
    id: 'pengetahuan_umum',
    name: 'Pengetahuan Umum & Sejarah',
    iconName: 'Globe2',
    color: 'rose',
    description: 'Sejarah Kemerdekaan, Geografi, dan Kebangsaan',
    gradeLevel: 'Umum & Sekolah',
    teacherName: 'Pak Dedi Mulyadi, S.Pd.',
    targetQuestionCount: 40, // 35 - 50 soal ujian sekolah
    timerMode: 'total_quiz',
    timerSecondsPerQuestion: 60,
    totalQuizMinutes: 90,
    passingGrade: 75,
    teacherNotes: 'Kuatkan literasi sejarah bangsa dan wawasan nusantara.',
  },
];

export const DEFAULT_QUESTIONS: Question[] = [
  ...MATEMATIKA_QUESTIONS,
  ...IPA_QUESTIONS,
  ...BAHASA_INDONESIA_QUESTIONS,
  ...BAHASA_INGGRIS_QUESTIONS,
  ...PENGETAHUAN_UMUM_QUESTIONS,
];
