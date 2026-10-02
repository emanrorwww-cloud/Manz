import React, { useState, useEffect } from 'react';
import {
  StudentInfo,
  Subject,
  Question,
  QuizSettings,
  QuizResult,
} from '../types';
import { SubjectIcon } from './SubjectIcon';
import {
  Play,
  Clock,
  Shuffle,
  Award,
  Sparkles,
  User,
  School,
  CheckCircle2,
  Settings2,
  UserCheck,
  Sliders,
  Edit,
  X,
  ArrowRight,
  Hash,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useFirebase } from '../context/FirebaseContext';
import { Database } from 'lucide-react';
import { getLastStudentInfo, saveLastStudentInfo } from '../utils/storage';

interface LoginFormProps {
  subjects: Subject[];
  questions: Question[];
  onStartQuiz: (
    student: StudentInfo,
    selectedSubject: Subject,
    settings: QuizSettings
  ) => void;
  onOpenBankSoal: () => void;
  onOpenRekap: () => void;
  onUpdateSubject?: (s: Subject) => void;
  latestResult?: QuizResult | null;
  onViewLatestResult?: (result: QuizResult) => void;
}

const COMMON_CLASSES = [
  '7A', '7B', '8A', '8B', '9A', '9B',
  '10 MIPA 1', '10 IPS 1', '11 MIPA 1', '12 MIPA 1'
];

export const LoginForm: React.FC<LoginFormProps> = ({
  subjects,
  questions,
  onStartQuiz,
  onOpenBankSoal,
  onOpenRekap,
  onUpdateSubject,
  latestResult,
  onViewLatestResult,
}) => {
  const { isConnected, user } = useFirebase();

  // Load remembered student info (name & no absen)
  const savedStudent = getLastStudentInfo();

  // Student Form State - Only Name & No. Absensi are required!
  const [name, setName] = useState<string>(savedStudent.name || '');
  const [noAbsen, setNoAbsen] = useState<string>(savedStudent.noAbsen || '');
  const [studentClass, setStudentClass] = useState<string>(savedStudent.studentClass || '8A');
  const [showClassEditor, setShowClassEditor] = useState<boolean>(false);
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || 'matematika'
  );

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const subjectQuestions = questions.filter((q) => q.subjectId === activeSubject?.id);

  // Settings State - Standard Exam Duration is 90 Menit (or 120 Menit)
  const [timerMode, setTimerMode] = useState<'per_question' | 'total_quiz' | 'none'>('total_quiz');
  const [timerSecondsPerQuestion, setTimerSecondsPerQuestion] = useState<number>(60);
  const [totalQuizMinutes, setTotalQuizMinutes] = useState<number>(
    activeSubject?.totalQuizMinutes || 90
  );
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [questionCountMode, setQuestionCountMode] = useState<'teacher_preset' | 'all' | 'custom'>('teacher_preset');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(
    activeSubject?.targetQuestionCount || 40
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Quick Teacher Modal State
  const [showTeacherQuickModal, setShowTeacherQuickModal] = useState<boolean>(false);
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editTargetCount, setEditTargetCount] = useState<number>(40);
  const [editTotalQuizMinutes, setEditTotalQuizMinutes] = useState<number>(90);

  // Error validation
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep question count and exam minutes synced with active subject
  useEffect(() => {
    if (activeSubject) {
      if (activeSubject.targetQuestionCount) {
        setCustomQuestionCount(activeSubject.targetQuestionCount);
      }
      if (activeSubject.totalQuizMinutes) {
        setTotalQuizMinutes(activeSubject.totalQuizMinutes);
      }
      if (activeSubject.timerMode) {
        setTimerMode(activeSubject.timerMode);
      }
    }
  }, [activeSubject?.id, activeSubject?.targetQuestionCount, activeSubject?.totalQuizMinutes, activeSubject?.timerMode]);

  if (!activeSubject || subjects.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white/75 backdrop-blur-xl rounded-3xl border border-white/80 text-center shadow-xl">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">Menyiapkan portal evaluasi belajar...</p>
      </div>
    );
  }

  const handleOpenQuickTeacherModal = () => {
    if (!activeSubject) return;
    setEditTeacherName(activeSubject.teacherName || '');
    setEditTargetCount(activeSubject.targetQuestionCount || 40);
    setEditTotalQuizMinutes(activeSubject.totalQuizMinutes || 90);
    setShowTeacherQuickModal(true);
  };

  const handleSaveQuickTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !onUpdateSubject) return;
    const maxAllowed = Math.max(1, subjectQuestions.length);
    const validCount = Math.max(1, Math.min(editTargetCount, maxAllowed));
    const validMinutes = Math.max(5, Math.min(editTotalQuizMinutes, 180));
    const updated: Subject = {
      ...activeSubject,
      teacherName: editTeacherName.trim() || 'Guru Pengampu',
      targetQuestionCount: validCount,
      totalQuizMinutes: validMinutes,
      timerMode: 'total_quiz',
    };
    onUpdateSubject(updated);
    setCustomQuestionCount(validCount);
    setTotalQuizMinutes(validMinutes);
    setTimerMode('total_quiz');
    setQuestionCountMode('teacher_preset');
    soundManager.playSelect();
    setShowTeacherQuickModal(false);
  };

  // Student Login & Start Quiz Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Siswa terlebih dahulu.');
      return;
    }

    if (!noAbsen.trim()) {
      setErrorMessage('Silakan masukkan Nomor Absensi Siswa.');
      return;
    }

    if (subjectQuestions.length === 0) {
      setErrorMessage('Mata pelajaran ini belum memiliki butir soal. Silakan pilih mata pelajaran lain.');
      return;
    }

    setErrorMessage('');
    soundManager.playSelect();

    // Remember student for next sessions
    saveLastStudentInfo({
      name: name.trim(),
      noAbsen: noAbsen.trim(),
      studentClass: studentClass.trim() || '8A',
    });

    // Calculate effective question count
    let targetCount = subjectQuestions.length;
    if (questionCountMode === 'teacher_preset') {
      const preset = activeSubject?.targetQuestionCount || 40;
      targetCount = Math.min(preset, subjectQuestions.length);
    } else if (questionCountMode === 'custom') {
      targetCount = Math.max(1, Math.min(customQuestionCount, subjectQuestions.length));
    } else {
      targetCount = subjectQuestions.length;
    }

    const settings: QuizSettings = {
      timerMode,
      timerSecondsPerQuestion,
      totalQuizMinutes,
      shuffleQuestions,
      shuffleOptions: true,
      passingGrade: activeSubject?.passingGrade || 75,
      questionCount: targetCount,
      teacherName: activeSubject?.teacherName || 'Guru Pengampu',
    };

    onStartQuiz(
      {
        name: name.trim(),
        studentClass: studentClass.trim() || '8A',
        nis: `No. Absen: ${noAbsen.trim()}`,
      },
      activeSubject,
      settings
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Bar / Header Navigasi Guru */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              CBT Ujian Sekolah
            </span>
            <h2 className="text-sm font-extrabold text-slate-800">
              Aplikasi Evaluasi Belajar Siswa
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBankSoal}
            className="text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white/70 hover:bg-white px-3 py-2 rounded-xl border border-white/80 shadow-xs backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Kelola butir soal dan ketetapan guru"
          >
            <span>📚 Bank Soal ({questions.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenRekap}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Lihat rekapitulasi nilai ujian seluruh siswa"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Rekap Nilai Guru</span>
          </button>
        </div>
      </div>

      {/* Banner Nilai Akhir Hasil Ujian Terakhir (Jika Ada) */}
      {latestResult && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  Hasil Ujian Terakhir
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {latestResult.student.name} • Kelas {latestResult.student.studentClass}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-xs text-slate-300">Nilai Akhir:</span>
                <span className="text-3xl font-black text-amber-300">
                  {latestResult.score} <span className="text-sm font-normal text-slate-300">/ 100</span>
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    latestResult.passed
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/25 text-rose-300 border-rose-400/40'
                  }`}
                >
                  {latestResult.passed ? '✓ TUNTAS KKM' : '✕ BELUM TUNTAS'}
                </span>
                <span className="text-xs text-slate-400">
                  ({latestResult.correctAnswers} Benar dari {latestResult.totalQuestions} Soal)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Mata Pelajaran: <strong className="text-white">{latestResult.subjectName}</strong>
                {latestResult.teacherName && <span> • Guru: {latestResult.teacherName}</span>}
              </p>
            </div>
          </div>
          {onViewLatestResult && (
            <button
              type="button"
              onClick={() => onViewLatestResult(latestResult)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-500/30 transition flex items-center gap-2 cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Lihat Nilai Akhir & Pembahasan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Kartu Utama: Layar Depan Login Ujian Siswa */}
      <div className="backdrop-blur-xl bg-white/75 border border-white/80 rounded-3xl p-6 sm:p-9 shadow-xl relative overflow-hidden">
        {/* Dekorasi Aksen */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        
        {/* Header Kartu Login */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-200/60 text-indigo-700 mb-3 shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <span className="text-xs font-extrabold tracking-widest uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-0.5 rounded-full inline-block mb-1.5 shadow-2xs">
            Layar Masuk Ujian Siswa
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Portal Ujian Siswa
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database Cloud Firestore Terhubung</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Murid cukup memasukkan <strong>Nama Lengkap</strong> dan <strong>Nomor Absensi</strong> untuk mulai mengerjakan lembar ujian CBT.
          </p>
        </div>

        {/* Form Login Murid */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* Bagian Input: Nama & No. Absensi */}
          <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* 1. Nama Lengkap Siswa */}
              <div className="sm:col-span-8">
                <label
                  htmlFor="student-name"
                  className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Nama Lengkap Siswa
                  </span>
                  <span className="text-[11px] text-rose-600 font-bold">*Wajib Diisi</span>
                </label>
                <div className="relative">
                  <input
                    id="student-name"
                    type="text"
                    required
                    autoFocus
                    placeholder="Masukkan nama lengkap Anda..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-3.5 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs transition placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 2. Nomor Absensi */}
              <div className="sm:col-span-4">
                <label
                  htmlFor="student-no-absen"
                  className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    No. Absensi
                  </span>
                  <span className="text-[11px] text-rose-600 font-bold">*Wajib</span>
                </label>
                <input
                  id="student-no-absen"
                  type="text"
                  required
                  placeholder="Contoh: 14"
                  value={noAbsen}
                  onChange={(e) => setNoAbsen(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-base font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs transition placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Quick helper for No Absen */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Pilih Cepat Absen:</span>
                {[1, 2, 5, 10, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNoAbsen(String(num))}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer ${
                      noAbsen === String(num)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Opsi Kelas (Ringkas & Otomatis) */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Kelas:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {studentClass}
                </span>
                <button
                  type="button"
                  onClick={() => setShowClassEditor(!showClassEditor)}
                  className="text-indigo-600 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  {showClassEditor ? 'Tutup' : 'Ubah Kelas'}
                </button>
              </div>
            </div>

            {/* Editor Kelas jika siswa ingin mengubah */}
            {showClassEditor && (
              <div className="p-3 bg-white rounded-xl border border-indigo-200 text-xs animate-fadeIn space-y-2">
                <span className="font-bold text-slate-700 block">Pilih Kelas Siswa:</span>
                {isCustomClass ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Contoh: 9C / 10 IPA 1"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomClass(false)}
                      className="px-2.5 py-1 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CLASSES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setStudentClass(c);
                          setShowClassEditor(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          studentClass === c
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Kelas {c}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomClass(true);
                        setStudentClass('');
                      }}
                      className="px-2.5 py-1 rounded-lg font-bold border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                    >
                      + Ketik Kelas Lain
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bagian Pilih Mata Pelajaran Ujian */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Pilih Mata Pelajaran Ujian Hari Ini
                </h3>
                <p className="text-[11px] text-slate-500">Klik mata pelajaran yang akan diujikan</p>
              </div>
              {onUpdateSubject && (
                <button
                  type="button"
                  onClick={handleOpenQuickTeacherModal}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                  title="Atur guru pengampu, durasi menit ujian, dan jumlah soal"
                >
                  <Edit className="w-3 h-3" />
                  <span>Atur Mapel & Guru</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((sub) => {
                const isSelected = sub.id === activeSubject.id;
                const totalQ = questions.filter((q) => q.subjectId === sub.id).length;
                const targetQ = sub.targetQuestionCount || Math.min(40, totalQ);
                const examMinutes = sub.totalQuizMinutes || 90;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      soundManager.playSelect();
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <SubjectIcon name={sub.iconName} className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                            Dipilih ✓
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {sub.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {sub.teacherName ? `Guru: ${sub.teacherName}` : 'Guru Pengampu'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-700">
                        {targetQ} Butir Soal
                      </span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        ⏱️ {examMinutes} Menit
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kartu Ringkasan Tiket Masuk Siswa */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                Tiket Peserta Ujian
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                {name.trim() ? name.trim() : 'Nama Siswa'} • No. Absen: {noAbsen.trim() ? noAbsen.trim() : '-'} • Kelas {studentClass}
              </p>
              <p className="text-[11px] text-slate-600">
                Ujian: <strong className="text-indigo-900">{activeSubject.name}</strong> • Durasi: <strong>{totalQuizMinutes} Menit</strong> ({activeSubject.targetQuestionCount || 40} Soal)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{showAdvancedSettings ? 'Tutup Pengaturan' : 'Opsi Durasi & Timer'}</span>
              </button>
            </div>
          </div>

          {/* Opsi Lanjutan / Pengaturan Waktu Ujian (90 & 120 Menit) */}
          {showAdvancedSettings && (
            <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Pengaturan Durasi Ujian & Timer (Opsional Pengawas/Guru)
                </span>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {totalQuizMinutes} Menit Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pilihan Menit Ujian */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Durasi Pengerjaan Ujian:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTimerMode('total_quiz');
                        setTotalQuizMinutes(90);
                      }}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        timerMode === 'total_quiz' && totalQuizMinutes === 90
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div>90 Menit</div>
                      <span className="text-[10px] font-normal opacity-80">1.5 Jam (Standar)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerMode('total_quiz');
                        setTotalQuizMinutes(120);
                      }}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        timerMode === 'total_quiz' && totalQuizMinutes === 120
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div>120 Menit</div>
                      <span className="text-[10px] font-normal opacity-80">2 Jam Penuh</span>
                    </button>
                  </div>

                  <div className="flex gap-1.5 mt-2">
                    {[30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setTimerMode('total_quiz');
                          setTotalQuizMinutes(m);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          timerMode === 'total_quiz' && totalQuizMinutes === m
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m} Menit
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTimerMode('none')}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                        timerMode === 'none'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Tanpa Waktu
                    </button>
                  </div>
                </div>

                {/* Acak Soal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Urutan Soal:
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Acak Urutan Nomor Soal untuk Setiap Siswa</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifikasi Error jika nama atau no absen belum diisi */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-shake">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tombol Utama: Mulai Ujian */}
          <div className="pt-2">
            <button
              id="btn-start-quiz"
              type="submit"
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-300 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform" />
              <span>MASUK & MULAI UJIAN SEKARANG</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              ✨ Begitu menekan tombol, ruang ujian CBT dibuka dan penghitung waktu akan mulai berjalan otomatis.
            </p>
          </div>
        </form>
      </div>

      {/* Modal Guru: Ubah Ketetapan Mapel Ini */}
      {showTeacherQuickModal && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/95 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Guru: {activeSubject.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ubah guru pengampu, jumlah soal, dan menit ujian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherQuickModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickTeacher} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Guru Pengampu Mapel:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Ratna Dewi, S.Pd."
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Jumlah Soal yang Dikerjakan Siswa:</span>
                  <span className="text-slate-500 font-normal">
                    (Max: {subjectQuestions.length} Soal)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTargetCount((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, subjectQuestions.length)}
                    value={editTargetCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setEditTargetCount(Math.max(1, Math.min(val, Math.max(1, subjectQuestions.length))));
                      }
                    }}
                    className="flex-1 text-center font-bold text-base py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditTargetCount((prev) =>
                        Math.min(Math.max(1, subjectQuestions.length), prev + 1)
                      )
                    }
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[20, 25, 30, 35, 40, 45, 50].map((num) => {
                    if (num > subjectQuestions.length && subjectQuestions.length > 0) return null;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditTargetCount(num)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          editTargetCount === num
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {num} Soal
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setEditTargetCount(Math.max(1, subjectQuestions.length))}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      editTargetCount === subjectQuestions.length
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({subjectQuestions.length})
                  </button>
                </div>
              </div>

              {/* Durasi Ujian */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Durasi Waktu Ujian (Menit):</span>
                  <span className="text-indigo-600 font-bold">{editTotalQuizMinutes} Menit</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTotalQuizMinutes((prev) => Math.max(5, prev - 5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    step={5}
                    value={editTotalQuizMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setEditTotalQuizMinutes(Math.max(5, Math.min(180, val)));
                    }}
                    className="flex-1 text-center font-bold text-base py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setEditTotalQuizMinutes((prev) => Math.min(180, prev + 5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[
                    { m: 90, label: '90 Menit (1.5 Jam)' },
                    { m: 120, label: '120 Menit (2 Jam)' },
                    { m: 60, label: '60 Menit' },
                    { m: 45, label: '45 Menit' },
                  ].map((item) => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setEditTotalQuizMinutes(item.m)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                        editTotalQuizMinutes === item.m
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTeacherQuickModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
