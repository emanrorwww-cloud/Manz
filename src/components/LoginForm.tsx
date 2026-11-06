import React, { useState, useEffect } from 'react';
import {
  StudentInfo,
  Subject,
  Question,
  QuizSettings,
  QuizResult,
  PortalRole,
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
  GraduationCap,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ShieldCheck,
  Cloud,
  Check,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Sparkle,
  ClipboardList,
  Users,
  Shield,
  Database,
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useFirebase } from '../context/FirebaseContext';
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

export const GRADE_OPTIONS = [
  { label: 'Kelas X', value: 'X', level: 'SMA/SMK' },
  { label: 'Kelas XI', value: 'XI', level: 'SMA/SMK' },
  { label: 'Kelas XII', value: 'XII', level: 'SMA/SMK' },
  { label: 'Kelas 9', value: '9', level: 'SMP' },
  { label: 'Kelas 8', value: '8', level: 'SMP' },
  { label: 'Kelas 7', value: '7', level: 'SMP' },
];

export const MAJOR_OPTIONS = [
  { id: 'MIPA', label: 'MIPA / IPA' },
  { id: 'IPS', label: 'IPS' },
  { id: 'Bahasa', label: 'Bahasa' },
  { id: 'RPL', label: 'RPL (Software)' },
  { id: 'TKJ', label: 'TKJ (Jaringan)' },
  { id: 'AKL', label: 'Akuntansi (AKL)' },
  { id: 'DKV', label: 'DKV / Multimedia' },
  { id: 'OTKP', label: 'Perkantoran (OTKP)' },
];

export const ROMBEL_OPTIONS = ['1', '2', '3', '4', 'A', 'B'];

const COMMON_CLASSES = [
  'X MIPA 1', 'X MIPA 2', 'X IPS 1', 'X RPL 1', 'X TKJ 1',
  'XI MIPA 1', 'XI IPS 1', 'XI RPL 1', 'XI TKJ 1',
  'XII MIPA 1', 'XII IPS 1', 'XII RPL 1', 'XII TKJ 1',
  '7A', '7B', '8A', '8B', '9A', '9B'
];

const AVATAR_LIST = ['🧑‍🎓', '👩‍🎓', '🎓', '🌟', '🎒', '💡', '🦁', '🚀'];

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
  const {
    user,
    studentProfile,
    isAdmin,
    isStudent,
    isTeacher,
    loginStudent,
    loginTeacher,
    updateStudentProfile,
    logout,
  } = useFirebase();

  // Portal foreground login state (matching user screenshot)
  const [isLoggedInToPortal, setIsLoggedInToPortal] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<PortalRole>('siswa');
  const [nisnInput, setNisnInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Load remembered student info (name & no absen)
  const savedStudent = getLastStudentInfo();

  // Student Form State - Default to High School Class X MIPA 1
  const [name, setName] = useState<string>(savedStudent.name || '');
  const [noAbsen, setNoAbsen] = useState<string>(savedStudent.noAbsen || '');
  const [studentClass, setStudentClass] = useState<string>(savedStudent.studentClass || 'X MIPA 1');
  const [showClassEditor, setShowClassEditor] = useState<boolean>(false);
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🧑‍🎓');

  // Grade & Major Builder State (X, XI, XII & Jurusan Mandiri)
  const [selectedGrade, setSelectedGrade] = useState<string>('X');
  const [selectedMajor, setSelectedMajor] = useState<string>('MIPA');
  const [customMajor, setCustomMajor] = useState<string>('');
  const [selectedRombel, setSelectedRombel] = useState<string>('1');
  const [isCustomMajorActive, setIsCustomMajorActive] = useState<boolean>(false);

  // Helper to dynamically compose studentClass from Grade, Major, and Rombel
  const updateBuiltClass = (
    grade: string,
    major: string,
    rombel: string,
    isCustom: boolean,
    customText: string
  ) => {
    let result = '';
    const activeMajor = isCustom ? customText.trim() : major;
    if (grade) {
      result = grade;
      if (activeMajor) {
        result += ` ${activeMajor}`;
      }
      if (rombel) {
        result += ` ${rombel}`;
      }
    } else if (activeMajor) {
      result = activeMajor;
      if (rombel) result += ` ${rombel}`;
    }
    if (result.trim()) {
      setStudentClass(result.trim());
    }
  };

  // Auto-sync form when student profile is loaded from Firestore
  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.name) setName(studentProfile.name);
      if (studentProfile.noAbsen) setNoAbsen(studentProfile.noAbsen);
      if (studentProfile.studentClass) setStudentClass(studentProfile.studentClass);
      if (studentProfile.avatar) setSelectedAvatar(studentProfile.avatar);
    } else if (user && !isAdmin && user.displayName && !name) {
      setName(user.displayName);
    }
  }, [studentProfile, user, isAdmin]);

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

  // Handlers for Portal Login
  const handlePortalLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    if (selectedRole === 'siswa') {
      const trimmedName = name.trim();
      const trimmedClass = studentClass.trim();
      if (!trimmedName) {
        setAuthError('Silakan masukkan Nama Lengkap Anda.');
        return;
      }
      if (!trimmedClass) {
        setAuthError('Silakan masukkan atau pilih Kelas Anda.');
        return;
      }
      const resolvedAbsen = noAbsen.trim() || '1';
      setName(trimmedName);
      setStudentClass(trimmedClass);
      setNoAbsen(resolvedAbsen);
      saveLastStudentInfo({
        name: trimmedName,
        noAbsen: resolvedAbsen,
        studentClass: trimmedClass,
      });
      soundManager.playCorrect();
      setIsLoggedInToPortal(true);
    } else if (selectedRole === 'guru') {
      soundManager.playCorrect();
      onOpenBankSoal();
    }
  };

  const handleAdminLogin = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      if (!user) {
        await loginTeacher();
      }
      soundManager.playCorrect();
      onOpenRekap();
    } catch {
      soundManager.playCorrect();
      onOpenRekap();
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGooglePortalLogin = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      if (selectedRole === 'siswa') {
        const res = await loginStudent({
          name: name.trim() || undefined,
          studentClass: studentClass.trim() || undefined,
          noAbsen: noAbsen.trim() || undefined,
        });
        setName(res.profile.name);
        if (res.profile.studentClass) setStudentClass(res.profile.studentClass);
        if (res.profile.noAbsen) setNoAbsen(res.profile.noAbsen);
        soundManager.playCorrect();
        setIsLoggedInToPortal(true);
      } else {
        await loginTeacher();
        soundManager.playCorrect();
        onOpenBankSoal();
      }
    } catch {
      setAuthError('Gagal autentikasi Google. Silakan coba lagi.');
    } finally {
      setIsLoadingAuth(false);
    }
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

    // If logged in as student, update student profile in Firestore
    if (user && isStudent) {
      updateStudentProfile({
        name: name.trim(),
        noAbsen: noAbsen.trim(),
        studentClass: studentClass.trim() || '8A',
        avatar: selectedAvatar,
      });
    }

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
        email: user?.email || undefined,
        avatar: selectedAvatar,
      },
      activeSubject,
      settings
    );
  };

  if (!isLoggedInToPortal) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in duration-300">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Pilih hak akses portal Anda di bawah ini:
            </p>
          </div>

          {/* 2-Column Grid of Role Cards: Siswa & Guru */}
          <div className="grid grid-cols-2 gap-3.5 mb-6">
            {/* 1. Siswa / Murid */}
            <div
              onClick={() => {
                setSelectedRole('siswa');
                soundManager.playSelect();
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer select-none ${
                selectedRole === 'siswa'
                  ? 'border-2 border-[#1E6BFF] bg-blue-50/20 ring-2 ring-blue-500/15 shadow-sm'
                  : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                  selectedRole === 'siswa'
                    ? 'bg-[#1E6BFF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Siswa /<br />Murid
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                Masuk dengan nama & kelas untuk ujian dan evaluasi belajar.
              </p>
            </div>

            {/* 2. Guru Pengajar */}
            <div
              onClick={() => {
                setSelectedRole('guru');
                soundManager.playSelect();
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer select-none ${
                selectedRole === 'guru'
                  ? 'border-2 border-[#1E6BFF] bg-blue-50/20 ring-2 ring-blue-500/15 shadow-sm'
                  : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                  selectedRole === 'guru'
                    ? 'bg-[#1E6BFF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Guru<br />Pengajar
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                Bank soal, buat materi ujian, & kelola presensi siswa.
              </p>
            </div>
          </div>

          {/* Error notification */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handlePortalLogin} className="space-y-4">
            {selectedRole === 'siswa' ? (
              <>
                {/* Field 1: Nama Lengkap Siswa */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                    NAMA LENGKAP SISWA
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan Nama Lengkap Anda"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition"
                    />
                  </div>
                </div>

                {/* Field 2: Kelas & Jurusan (Bisa Pilih Mandiri) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      KELAS & JURUSAN
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Pilihan Mandiri
                    </span>
                  </div>

                  {/* Input Kelas Terpadu */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <School className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      placeholder="Contoh: X MIPA 1 / XI RPL 2 / XII IPS"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition"
                    />
                  </div>

                  {/* Card Pilihan Cepat: Tingkat X, XI, XII & Jurusan Mandiri */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-left text-xs">
                    {/* 1. Tingkat Kelas: X, XI, XII (SMA/SMK) & SMP */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>1. Tingkat Kelas</span>
                        <span className="text-[10px] text-blue-600 font-semibold">Tingkat X, XI, XII</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {GRADE_OPTIONS.map((g) => {
                          const isHighSchool = g.value.startsWith('X');
                          const isActive = selectedGrade === g.value;
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => {
                                setSelectedGrade(g.value);
                                updateBuiltClass(g.value, selectedMajor, selectedRombel, isCustomMajorActive, customMajor);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? 'bg-[#1E6BFF] text-white shadow-xs'
                                  : isHighSchool
                                  ? 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-50'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{g.label}</span>
                              {isHighSchool && (
                                <span className={`text-[9px] px-1 rounded font-semibold ${isActive ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                  SMA
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Jurusan (Bisa Pilih Mandiri) */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>2. Jurusan (Pilih Mandiri)</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Bebas Pilih</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {MAJOR_OPTIONS.map((m) => {
                          const isActive = !isCustomMajorActive && selectedMajor === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setIsCustomMajorActive(false);
                                setSelectedMajor(m.id);
                                updateBuiltClass(selectedGrade, m.id, selectedRombel, false, customMajor);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                isActive
                                  ? 'bg-[#1E6BFF] text-white shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium'
                              }`}
                            >
                              {m.label}
                            </button>
                          );
                        })}

                        {/* Tombol Tulis Jurusan Mandiri */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isCustomMajorActive;
                            setIsCustomMajorActive(nextState);
                            if (nextState && customMajor.trim()) {
                              updateBuiltClass(selectedGrade, selectedMajor, selectedRombel, true, customMajor);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            isCustomMajorActive
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-bold'
                          }`}
                        >
                          <Edit className="w-3 h-3" />
                          <span>+ Tulis Mandiri</span>
                        </button>
                      </div>

                      {/* Input Khusus jika memilih Tulis Mandiri */}
                      {isCustomMajorActive && (
                        <div className="mt-2 p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 space-y-1.5 animate-in fade-in duration-200">
                          <label className="text-[10px] font-bold text-amber-900 block">
                            Ketik Nama Jurusan Mandiri Anda:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={customMajor}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomMajor(val);
                                updateBuiltClass(selectedGrade, selectedMajor, selectedRombel, true, val);
                              }}
                              placeholder="Contoh: Tata Boga, Farmasi, Teknik Mesin, Desain Grafis"
                              className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-300 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            {customMajor && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateBuiltClass(selectedGrade, selectedMajor, selectedRombel, true, customMajor);
                                }}
                                className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Terapkan
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-amber-700">
                            Jurusan apa pun dari sekolah Anda dapat dimasukkan secara mandiri.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. Nomor / Rombel Kelas */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>3. Nomor Kelas / Rombel</span>
                        <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ROMBEL_OPTIONS.map((r) => {
                          const isActive = selectedRombel === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const nextR = isActive ? '' : r;
                                setSelectedRombel(nextR);
                                updateBuiltClass(selectedGrade, selectedMajor, nextR, isCustomMajorActive, customMajor);
                              }}
                              className={`text-xs w-7 h-7 rounded-lg font-bold transition cursor-pointer flex items-center justify-center ${
                                isActive
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                        {selectedRombel && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRombel('');
                              updateBuiltClass(selectedGrade, selectedMajor, '', isCustomMajorActive, customMajor);
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-700 underline ml-1 cursor-pointer"
                          >
                            Hapus Rombel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field 3: Nomor Absen (Opsional) */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                    NOMOR ABSEN <span className="text-slate-400 font-normal text-[10px]">(OPSIONAL)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={noAbsen}
                      onChange={(e) => setNoAbsen(e.target.value)}
                      placeholder="Contoh: 14"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guru Inputs */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                    NAMA / EMAIL GURU
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={nisnInput}
                      onChange={(e) => setNisnInput(e.target.value)}
                      placeholder="Masukkan Nama atau Email Guru"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Password (Opsional)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button: Masuk Portal */}
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1E6BFF] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoadingAuth ? 'Memproses...' : 'Masuk Portal'}</span>
            </button>

            {/* Quick Google Sign In */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGooglePortalLogin}
                disabled={isLoadingAuth}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Masuk Cepat dengan Akun Google (Cloud DB)</span>
              </button>
            </div>

            {/* Footer with Login Administrator */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 text-xs">Halaman khusus pengelola:</span>
              <button
                type="button"
                onClick={handleAdminLogin}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200/80 flex items-center gap-2 cursor-pointer transition"
              >
                <Shield className="w-4 h-4 text-slate-600" />
                <span>Login Administrator</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Bar / Header Navigasi Ujian */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-white/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.playSelect();
              setIsLoggedInToPortal(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Kembali ke layar pilihan hak akses portal"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Ganti Peran / Keluar</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Siswa: <strong className="text-blue-700">{name || savedStudent.name || 'Siswa CBT'}</strong> ({studentClass})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBankSoal}
            className="text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Kelola butir soal dan ketetapan guru"
          >
            <span>📚 Bank Soal ({questions.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenRekap}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Lihat rekapitulasi nilai ujian seluruh siswa"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
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

      {/* Kartu Utama Persiapan Ujian Siswa */}
      <div className="backdrop-blur-xl bg-white/90 border border-white/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Siswa: Nama Lengkap, No Absen, Kelas */}
          <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 border border-slate-200/90 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Identitas Siswa Peserta Ujian
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Masukkan nama dan nomor absensi sebelum memulai lembar kuis
                  </p>
                </div>
              </div>
              {user && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  ✓ Database Cloud Aktif
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
              {/* 1. Nama Lengkap Siswa */}
              <div className="sm:col-span-8">
                <label
                  htmlFor="student-name"
                  className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Nama Lengkap Siswa
                  </span>
                  {name.trim().length >= 2 ? (
                    <span className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Nama Terisi ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-600 font-extrabold">*Wajib Diisi untuk Masuk</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="student-name"
                    type="text"
                    required
                    autoFocus
                    placeholder="Ketik nama lengkap Anda (contoh: Siti Nurhaliza)..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs transition placeholder:font-normal placeholder:text-slate-400"
                  />
                  {name.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Hapus Nama"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick chip for remembered name */}
                {savedStudent.name && savedStudent.name !== name && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">Nama Terakhir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setName(savedStudent.name);
                        if (savedStudent.noAbsen) setNoAbsen(savedStudent.noAbsen);
                        if (savedStudent.studentClass) setStudentClass(savedStudent.studentClass);
                        soundManager.playSelect();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer text-[11px] transition"
                    >
                      <span>💡 Gunakan "{savedStudent.name}"</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Nomor Absensi */}
              <div className="sm:col-span-4">
                <label
                  htmlFor="student-no-absen"
                  className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    No. Absensi
                  </span>
                  <span className="text-[11px] text-rose-600 font-extrabold">*Wajib</span>
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-600">Pilih Cepat Absen:</span>
                {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setNoAbsen(String(num));
                      soundManager.playSelect();
                    }}
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
              className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group ${
                name.trim().length >= 2
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-indigo-400/40 hover:shadow-2xl scale-[1.01] active:scale-[0.99]'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300'
              }`}
            >
              {name.trim().length >= 2 ? (
                <>
                  <Unlock className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                  <span>
                    MASUK KE APLIKASI SEBAGAI "{name.trim().toUpperCase()}"
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform" />
                  <span>MASUK & MULAI UJIAN SEKARANG</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              ✨ Begitu menekan tombol masuk, sesi CBT Anda dimulai dan lembar soal dibuka dengan durasi {totalQuizMinutes} menit.
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
