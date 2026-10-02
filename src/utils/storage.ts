import { Question, Subject, QuizResult, OptionKey } from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_SUBJECTS } from '../data/initialQuestions';

const STORAGE_KEYS = {
  QUESTIONS: 'kuis_belajar_questions_v2',
  SUBJECTS: 'kuis_belajar_subjects_v2',
  RESULTS: 'kuis_belajar_results_v1',
  LAST_STUDENT: 'kuis_belajar_last_student_v1',
  SOUND_ENABLED: 'kuis_belajar_sound_v1',
};

// --- QUESTION BANK STORAGE ---
export function getStoredQuestions(): Question[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load questions from storage', e);
  }
  // Initialize with complete 250 questions
  saveQuestions(DEFAULT_QUESTIONS);
  return DEFAULT_QUESTIONS;
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed to save questions', e);
  }
}

export function resetQuestionsToDefault(): Question[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
    saveQuestions(DEFAULT_QUESTIONS);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_QUESTIONS;
}

// --- SUBJECTS STORAGE ---
export function getStoredSubjects(): Subject[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with DEFAULT_SUBJECTS so existing stored subjects get teacherName & targetQuestionCount
        return parsed.map((subj: Subject) => {
          const defaultMatch = DEFAULT_SUBJECTS.find((d) => d.id === subj.id);
          const rawTarget = subj.targetQuestionCount;
          // If previous target was 5 (from early prototype), upgrade to 40 (standard 35-50 range)
          const target = (rawTarget && rawTarget > 5) ? rawTarget : (defaultMatch?.targetQuestionCount || 40);

          return {
            ...defaultMatch,
            ...subj,
            teacherName: subj.teacherName || defaultMatch?.teacherName || 'Guru Pengampu',
            targetQuestionCount: target,
            timerMode: subj.timerMode || defaultMatch?.timerMode || 'total_quiz',
            timerSecondsPerQuestion: subj.timerSecondsPerQuestion || defaultMatch?.timerSecondsPerQuestion || 60,
            totalQuizMinutes: subj.totalQuizMinutes || defaultMatch?.totalQuizMinutes || 90,
            passingGrade: subj.passingGrade || defaultMatch?.passingGrade || 75,
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to load subjects', e);
  }
  saveSubjects(DEFAULT_SUBJECTS);
  return DEFAULT_SUBJECTS;
}

export function saveSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('Failed to save subjects', e);
  }
}

// --- REKAP HASIL SISWA STORAGE ---
export function getStoredResults(): QuizResult[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load results', e);
  }
  return [];
}

export function saveQuizResult(result: QuizResult): QuizResult[] {
  const current = getStoredResults();
  const updated = [result, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz result', e);
  }
  return updated;
}

export function deleteQuizResult(resultId: string): QuizResult[] {
  const current = getStoredResults();
  const updated = current.filter((r) => r.id !== resultId);
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete quiz result', e);
  }
  return updated;
}

export function clearAllResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
  } catch (e) {
    console.error(e);
  }
}

// --- LAST STUDENT STORAGE ---
export interface LastStudentData {
  name: string;
  noAbsen: string;
  studentClass: string;
}

export function getLastStudentInfo(): LastStudentData {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_STUDENT);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return { name: '', noAbsen: '', studentClass: '8A' };
}

export function saveLastStudentInfo(data: LastStudentData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_STUDENT, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

// --- PARSE IMPORT DARI GOOGLE SHEET / EXCEL / TAB / PIPE / CSV ---
export interface ParseImportResult {
  questions: Question[];
  errors: string[];
}

export function parseSpreadsheetData(rawText: string, subjectId: string): ParseImportResult {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const questions: Question[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    // Skip potential header rows
    const lowerLine = line.toLowerCase();
    if (
      (lowerLine.includes('pertanyaan') || lowerLine.includes('soal')) &&
      (lowerLine.includes('jawaban') || lowerLine.includes('kunci') || lowerLine.includes('pilihan a'))
    ) {
      return; // skip header
    }

    let cols: string[] = [];

    // Check delimiter: Tab, Pipe |, Semicolon ;, or Comma ,
    if (line.includes('\t')) {
      cols = line.split('\t').map((c) => c.trim());
    } else if (line.includes('|')) {
      cols = line.split('|').map((c) => c.trim());
      // remove leading/trailing empty caused by | col1 | col2 |
      if (cols.length > 0 && cols[0] === '') cols.shift();
      if (cols.length > 0 && cols[cols.length - 1] === '') cols.pop();
    } else if (line.includes(';')) {
      cols = line.split(';').map((c) => c.trim());
    } else {
      // Basic comma separated (if simple)
      cols = line.split(',').map((c) => c.trim());
    }

    if (cols.length < 6) {
      errors.push(`Baris ${index + 1}: Kolom kurang (minimal 6 kolom: Pertanyaan, A, B, C, D, Jawaban).`);
      return;
    }

    const questionText = cols[0];
    const optA = cols[1];
    const optB = cols[2];
    const optC = cols[3];
    const optD = cols[4];
    let rawAns = cols[5]?.toUpperCase().trim();
    const explanation = cols[6] || `Jawaban yang benar adalah pilihan ${rawAns}`;

    // Normalize answer (could be "A", "Opsi A", "Pilihan A", or full text)
    let validAns: OptionKey = 'A';
    if (rawAns.startsWith('A') || rawAns === optA.toUpperCase()) {
      validAns = 'A';
    } else if (rawAns.startsWith('B') || rawAns === optB.toUpperCase()) {
      validAns = 'B';
    } else if (rawAns.startsWith('C') || rawAns === optC.toUpperCase()) {
      validAns = 'C';
    } else if (rawAns.startsWith('D') || rawAns === optD.toUpperCase()) {
      validAns = 'D';
    } else {
      // Try 1, 2, 3, 4
      if (rawAns === '1') validAns = 'A';
      else if (rawAns === '2') validAns = 'B';
      else if (rawAns === '3') validAns = 'C';
      else if (rawAns === '4') validAns = 'D';
      else {
        errors.push(`Baris ${index + 1}: Kunci jawaban "${cols[5]}" tidak valid (gunakan A, B, C, atau D).`);
        return;
      }
    }

    if (!questionText || !optA || !optB || !optC || !optD) {
      errors.push(`Baris ${index + 1}: Teks soal atau pilihan ada yang kosong.`);
      return;
    }

    questions.push({
      id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subjectId,
      question: questionText,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD,
      },
      correctAnswer: validAns,
      explanation: explanation,
      difficulty: 'Sedang',
    });
  });

  return { questions, errors };
}

// --- EXPORT REKAP TO CSV ---
export function exportResultsToCSV(results: QuizResult[]): void {
  if (results.length === 0) {
    alert('Belum ada data rekap nilai untuk diekspor.');
    return;
  }

  const headers = [
    'No',
    'Tanggal & Waktu',
    'Nama Siswa',
    'Kelas',
    'NIS',
    'Mata Pelajaran',
    'Guru Pengampu',
    'Jumlah Soal Dikerjakan',
    'Benar',
    'Salah',
    'Kosong',
    'Nilai Skor (0-100)',
    'KKM',
    'Status Kelulusan',
    'Durasi (Detik)',
  ];

  const rows = results.map((r, i) => [
    i + 1,
    `"${new Date(r.timestamp).toLocaleString('id-ID')}"`,
    `"${r.student.name.replace(/"/g, '""')}"`,
    `"${r.student.studentClass.replace(/"/g, '""')}"`,
    `"${r.student.nis || '-'}"`,
    `"${r.subjectName.replace(/"/g, '""')}"`,
    `"${(r.teacherName || '-').replace(/"/g, '""')}"`,
    r.totalQuestions,
    r.correctAnswers,
    r.wrongAnswers,
    r.unanswered,
    r.score,
    r.passingGrade,
    r.passed ? 'LULUS' : 'REMIDIAL',
    r.timeSpentSeconds,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Nilai_Kuis_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
