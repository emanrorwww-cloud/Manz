import React, { useState, useEffect } from 'react';
import { QuizResult, OptionKey } from '../types';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Share2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface ResultScreenProps {
  result: QuizResult;
  onRetakeQuiz: () => void;
  onGoToBankSoal: () => void;
  onGoToRekap: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetakeQuiz,
  onGoToBankSoal,
  onGoToRekap,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Trigger confetti if passed
  useEffect(() => {
    if (result.passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.passed]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `*KARTU NILAI AKHIR HASIL UJIAN*
Nama Siswa: ${result.student.name}
Kelas: ${result.student.studentClass} ${result.student.nis ? `(NIS: ${result.student.nis})` : ''}
Mata Pelajaran: ${result.subjectName}
Guru Pengampu: ${result.teacherName || '-'}
Jumlah Soal: ${result.totalQuestions} Soal
Benar: ${result.correctAnswers} | Salah: ${result.wrongAnswers} | Kosong: ${result.unanswered}
*NILAI AKHIR: ${result.score} / 100*
Status: ${result.passed ? 'LULUS / TUNTAS' : 'BELUM TUNTAS (REMIDI)'} (KKM: ${result.passingGrade})
Predikat: ${pred.grade}
Waktu: ${formatSeconds(result.timeSpentSeconds)}`;
    navigator.clipboard.writeText(summaryText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredQuestions = result.questions.filter((q) => {
    const ans = result.answers[q.id];
    const isCorrect = ans?.selectedOption === q.correctAnswer;
    if (filterMode === 'correct') return isCorrect;
    if (filterMode === 'wrong') return !isCorrect;
    return true;
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} Detik`;
    return `${m} Menit ${s} Detik`;
  };

  // Grade predicate
  const getPredicate = (score: number) => {
    if (score >= 90) return { grade: 'A (Sangat Baik)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 80) return { grade: 'B (Baik)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 70) return { grade: 'C (Cukup)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'D (Perlu Bimbingan)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const pred = getPredicate(result.score);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:p-0">
      {/* Printable Certificate / Result Card Header */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-xl relative overflow-hidden print:border-none print:shadow-none">
        <div className="text-center max-w-lg mx-auto">
          {/* Badge Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-200/60 text-indigo-700 mb-3 shadow-lg shadow-indigo-200/50 backdrop-blur-xs">
            <Award className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 rounded-full inline-block mb-2 shadow-2xs">
            🏆 KARTU NILAI AKHIR HASIL UJIAN
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {result.student.name}
          </h1>
          <div className="text-sm text-slate-600 mb-6 flex items-center justify-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">Kelas {result.student.studentClass}</span>
            {result.student.nis && <span>• NIS: {result.student.nis}</span>}
            <span>• Mapel: <strong className="text-slate-900">{result.subjectName}</strong></span>
            {result.teacherName && (
              <span className="text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full text-xs">
                Guru: {result.teacherName}
              </span>
            )}
            <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full text-xs">
              {result.totalQuestions} Soal Dikerjakan
            </span>
          </div>

          {/* Large Score Display - NILAI AKHIR */}
          <div className="backdrop-blur-md bg-white/60 rounded-3xl p-6 sm:p-7 border-2 border-indigo-100 mb-6 flex flex-col items-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              NILAI AKHIR HASIL UJIAN
            </span>
            <div className="flex items-baseline justify-center gap-1 font-extrabold tracking-tight my-1">
              <span className={`text-6xl sm:text-7xl font-black ${result.passed ? 'text-indigo-600' : 'text-rose-600'}`}>
                {result.score}
              </span>
              <span className="text-2xl text-slate-400 font-bold">/ 100</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-xs shadow-2xs ${pred.color}`}>
                Predikat: {pred.grade}
              </span>
              <span
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-xs shadow-2xs ${
                  result.passed
                    ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100/90 text-rose-900 border-rose-300'
                }`}
              >
                {result.passed ? '✓ LULUS / TUNTAS KKM' : '✕ BELUM TUNTAS (REMIDIAL)'}
              </span>
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                KKM: {result.passingGrade}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-white/70 p-3 rounded-2xl border border-slate-200/60 max-w-md">
              Siswa memperoleh Nilai Akhir <strong>{result.score}</strong> ({result.correctAnswers} Benar dari {result.totalQuestions} butir soal) pada mata pelajaran <strong>{result.subjectName}</strong> yang diampu oleh <strong>{result.teacherName || 'Guru Pengampu'}</strong>.
            </p>
          </div>

          {/* Stat Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-emerald-500/15 backdrop-blur-xs rounded-2xl border border-emerald-300/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 font-bold uppercase">Benar</span>
                <p className="text-base font-extrabold text-emerald-950">
                  {result.correctAnswers} <span className="text-xs font-medium">Soal</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-500/15 backdrop-blur-xs rounded-2xl border border-rose-300/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-rose-800 font-bold uppercase">Salah</span>
                <p className="text-base font-extrabold text-rose-950">
                  {result.wrongAnswers} <span className="text-xs font-medium">Soal</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/50 backdrop-blur-xs rounded-2xl border border-white/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-600 font-bold uppercase">Kosong</span>
                <p className="text-base font-extrabold text-slate-900">
                  {result.unanswered} <span className="text-xs font-medium">Soal</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/15 backdrop-blur-xs rounded-2xl border border-indigo-300/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-indigo-800 font-bold uppercase">Waktu</span>
                <p className="text-xs sm:text-sm font-extrabold text-indigo-950 truncate">
                  {formatSeconds(result.timeSpentSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            id="btn-retake-quiz"
            onClick={onRetakeQuiz}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Kuis Lagi / Pilih Mapel Lain</span>
          </button>

          <button
            id="btn-print-result"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-700 border border-white/80 rounded-xl text-sm font-bold shadow-xs backdrop-blur-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            id="btn-copy-summary"
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 border border-emerald-300/60 rounded-xl text-sm font-bold backdrop-blur-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-700" />
            <span>{copiedLink ? '✓ Ringkasan Disalin!' : 'Salin Nilai (WA)'}</span>
          </button>

          <button
            id="btn-view-rekap-after-quiz"
            onClick={onGoToRekap}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300/60 rounded-xl text-sm font-bold backdrop-blur-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span>Lihat Rekap Nilai Guru</span>
          </button>
        </div>
      </div>

      {/* Detailed Explanation / Pembahasan Section */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Kunci Jawaban & Pembahasan Lengkap
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pelajari kesalahan dan pembahasan detail pada setiap butir soal
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1.5 p-1 bg-white/60 rounded-2xl border border-white/80 self-start sm:self-auto text-xs font-bold backdrop-blur-xs print:hidden">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({result.questions.length})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterMode === 'wrong'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Salah ({result.wrongAnswers + result.unanswered})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterMode === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Benar ({result.correctAnswers})
            </button>
          </div>
        </div>

        {/* List of Questions with Explanation */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm font-medium">
              Tidak ada soal pada filter ini.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const originalIndex = result.questions.findIndex((orig) => orig.id === q.id);
              const ans = result.answers[q.id];
              const userOpt = ans?.selectedOption;
              const isCorrect = userOpt === q.correctAnswer;
              const isUnanswered = !userOpt;

              return (
                <div
                  key={q.id}
                  id={`review-question-${originalIndex + 1}`}
                  className={`p-5 rounded-2xl border-2 transition-all backdrop-blur-xs ${
                    isCorrect
                      ? 'border-emerald-300/80 bg-emerald-50/40'
                      : isUnanswered
                      ? 'border-slate-300 bg-white/40'
                      : 'border-rose-300/80 bg-rose-50/40'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-white shadow-2xs">
                        Nomor {originalIndex + 1}
                      </span>
                      {q.difficulty && (
                        <span className="text-[11px] font-bold text-slate-600 bg-white/80 border border-white/80 px-2 py-0.5 rounded-md">
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <div>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Jawaban Benar (+{Math.round(100 / result.totalQuestions)})
                        </span>
                      ) : isUnanswered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full border border-slate-300">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Tidak Dijawab (0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Jawaban Salah (0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed mb-4 whitespace-pre-line">
                    {q.question}
                  </p>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => {
                      const isKunci = key === q.correctAnswer;
                      const isUserPilih = key === userOpt;

                      let optClass = 'border-white/80 bg-white/60 text-slate-700';
                      let badge = null;

                      if (isKunci) {
                        optClass = 'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold ring-1 ring-emerald-500';
                        badge = (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                            Kunci Jawaban
                          </span>
                        );
                      } else if (isUserPilih && !isKunci) {
                        optClass = 'border-rose-400 bg-rose-50/90 text-rose-950 font-bold ring-1 ring-rose-400';
                        badge = (
                          <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded">
                            Pilihanmu (Salah)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm backdrop-blur-xs ${optClass}`}
                        >
                          <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {key}
                          </span>
                          <div className="flex-1 leading-tight">
                            <div>{q.options[key]}</div>
                            {badge && <div className="mt-1">{badge}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pembahasan Box */}
                  <div className="p-3.5 bg-indigo-50/70 backdrop-blur-xs rounded-2xl border border-indigo-100 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Pembahasan:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">
                      {q.explanation || 'Pembahasan belum tersedia untuk soal ini.'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
