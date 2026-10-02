import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StudentInfo,
  Subject,
  Question,
  QuizSettings,
  OptionKey,
  QuizAnswerRecord,
  QuizResult,
} from '../types';
import { SubjectIcon } from './SubjectIcon';
import { soundManager } from '../utils/sound';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Grid,
  X,
  Bookmark,
} from 'lucide-react';

interface QuizScreenProps {
  student: StudentInfo;
  subject: Subject;
  questions: Question[];
  settings: QuizSettings;
  onFinishQuiz: (result: QuizResult) => void;
  onCancelQuiz: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  student,
  subject,
  questions,
  settings,
  onFinishQuiz,
  onCancelQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerRecord>>({});
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // Time tracking
  const [startTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);

  // Countdown timer state
  const isPerQuestionTimer = settings.timerMode === 'per_question';
  const isTotalQuizTimer = settings.timerMode === 'total_quiz';

  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    settings.timerSecondsPerQuestion
  );
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(
    settings.totalQuizMinutes * 60
  );

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];

  // Helper to calculate total final score and generate QuizResult
  const buildResult = useCallback((): QuizResult => {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const ans = answers[q.id];
      if (!ans || ans.selectedOption === null) {
        unansweredCount++;
      } else if (ans.selectedOption === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const totalQ = questions.length;
    const finalScore = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const isPassed = finalScore >= settings.passingGrade;
    const totalTimeSpent = Math.max(1, Math.floor((Date.now() - startTime) / 1000));

    return {
      id: `result-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherName: subject.teacherName,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unanswered: unansweredCount,
      score: finalScore,
      passed: isPassed,
      passingGrade: settings.passingGrade,
      timeSpentSeconds: totalTimeSpent,
      timestamp: new Date().toISOString(),
      answers,
      questions,
    };
  }, [answers, questions, settings.passingGrade, student, subject.id, subject.name, subject.teacherName, startTime]);

  const handleFinalSubmit = useCallback(() => {
    soundManager.playFinishSuccess();
    const result = buildResult();
    onFinishQuiz(result);
  }, [buildResult, onFinishQuiz]);

  // Next question handler
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
      if (isPerQuestionTimer) {
        setQuestionTimeLeft(settings.timerSecondsPerQuestion);
      }
    } else {
      setShowSubmitModal(true);
    }
  }, [currentIndex, questions.length, isPerQuestionTimer, settings.timerSecondsPerQuestion]);

  // Previous question handler
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setQuestionStartTime(Date.now());
      if (isPerQuestionTimer) {
        setQuestionTimeLeft(settings.timerSecondsPerQuestion);
      }
    }
  };

  // Option selection
  const handleSelectOption = (optionKey: OptionKey) => {
    soundManager.playSelect();
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: optionKey,
        isCorrect: optionKey === currentQuestion.correctAnswer,
        isFlagged: prev[currentQuestion.id]?.isFlagged || false,
        timeTakenSeconds: (prev[currentQuestion.id]?.timeTakenSeconds || 0) + timeSpent,
      },
    }));
  };

  // Flag / Ragu-ragu toggle
  const handleToggleFlag = () => {
    soundManager.playSelect();
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id] || {
        questionId: currentQuestion.id,
        selectedOption: null,
        isCorrect: false,
        isFlagged: false,
        timeTakenSeconds: 0,
      };

      return {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          isFlagged: !existing.isFlagged,
        },
      };
    });
  };

  // Timer Tick Loop
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);

      // Per Question Timer
      if (isPerQuestionTimer) {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            // Time up for current question
            soundManager.playWrong();
            handleNext();
            return settings.timerSecondsPerQuestion;
          }
          if (prev <= 5) {
            soundManager.playTick();
          }
          return prev - 1;
        });
      }

      // Total Quiz Timer
      if (isTotalQuizTimer) {
        setQuizTimeLeft((prev) => {
          if (prev <= 1) {
            // Time up for whole quiz
            soundManager.playWrong();
            handleFinalSubmit();
            return 0;
          }
          if (prev <= 10) {
            soundManager.playTick();
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [
    isPerQuestionTimer,
    isTotalQuizTimer,
    handleNext,
    handleFinalSubmit,
    settings.timerSecondsPerQuestion,
  ]);

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showCancelModal) return;

      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') handleSelectOption('A');
      if (key === 'B' || key === '2') handleSelectOption('B');
      if (key === 'C' || key === '3') handleSelectOption('C');
      if (key === 'D' || key === '4') handleSelectOption('D');
      if (key === 'R') handleToggleFlag();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, showSubmitModal, showCancelModal, handleNext]);

  // Stats calculation for navigator
  const stats = useMemo(() => {
    let answered = 0;
    let flagged = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const a = answers[q.id];
      if (a?.isFlagged) flagged++;
      if (a?.selectedOption !== null && a?.selectedOption !== undefined) {
        answered++;
      } else {
        unanswered++;
      }
    });

    return { answered, flagged, unanswered };
  }, [answers, questions]);

  // Format time display (supports hours for 90 min and 120 min exams)
  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const timerPercentage = isPerQuestionTimer
    ? (questionTimeLeft / settings.timerSecondsPerQuestion) * 100
    : isTotalQuizTimer
    ? (quizTimeLeft / (settings.totalQuizMinutes * 60)) * 100
    : 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Bar / CBT Header */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-4 sm:p-5 border border-white/60 shadow-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Student & Subject Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-200/60 text-indigo-700 flex items-center justify-center font-bold backdrop-blur-xs shadow-xs">
              <SubjectIcon name={subject.iconName} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {student.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white/70 border border-white/80 font-bold text-slate-700 backdrop-blur-xs">
                  {student.studentClass}
                </span>
                {student.nis && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    NIS: {student.nis}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 flex-wrap">
                <span>{subject.name}</span>
                {subject.teacherName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-semibold">Guru: {subject.teacherName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            {settings.timerMode !== 'none' ? (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-bold backdrop-blur-xs transition-all ${
                  (isPerQuestionTimer && questionTimeLeft <= 10) ||
                  (isTotalQuizTimer && quizTimeLeft <= 60)
                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-800 animate-pulse'
                    : 'bg-amber-500/20 border-amber-400/50 text-amber-950'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-mono">
                  {isPerQuestionTimer
                    ? `${questionTimeLeft}s`
                    : formatSeconds(quizTimeLeft)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-600 hidden sm:inline">
                  {isPerQuestionTimer ? 'Per Soal' : 'Total'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 border border-white/80 text-slate-700 text-xs font-semibold backdrop-blur-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{formatSeconds(totalSecondsElapsed)}</span>
              </div>
            )}

            {/* Question Palette Toggle */}
            <button
              id="btn-open-palette"
              onClick={() => setShowPalette(!showPalette)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/80 hover:border-indigo-300 bg-white/70 text-slate-700 text-xs font-bold transition backdrop-blur-xs shadow-xs"
            >
              <Grid className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Daftar Soal</span>
              <span className="text-indigo-600 font-mono font-bold">
                {currentIndex + 1}/{questions.length}
              </span>
            </button>

            {/* Cancel Button */}
            <button
              id="btn-cancel-quiz"
              onClick={() => setShowCancelModal(true)}
              title="Keluar dari Kuis"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white/80 rounded-xl transition backdrop-blur-xs border border-transparent hover:border-rose-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Timer Bar */}
        {settings.timerMode !== 'none' && (
          <div className="w-full bg-white/60 h-1.5 rounded-full mt-4 overflow-hidden border border-white/40">
            <div
              className={`h-full transition-all duration-300 ${
                timerPercentage > 40
                  ? 'bg-indigo-600'
                  : timerPercentage > 15
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area (3 Cols on desktop) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-xl relative">
            {/* Question Header & Flag Badge */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/50">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-200">
                  Nomor {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  dari {questions.length} Soal
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all backdrop-blur-xs ${
                  currentAnswer?.isFlagged
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                    : 'text-slate-600 hover:bg-white/80 bg-white/50 border border-white/80'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{currentAnswer?.isFlagged ? 'Tanda Ragu-ragu' : 'Ragu-ragu (R)'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-slate-900 text-base sm:text-lg font-semibold leading-relaxed mb-6 whitespace-pre-line">
              {currentQuestion?.question}
            </div>

            {/* Options List A, B, C, D */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => {
                const optText = currentQuestion?.options[key];
                const isSelected = currentAnswer?.selectedOption === key;

                return (
                  <button
                    key={key}
                    id={`opt-btn-${key}`}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer backdrop-blur-xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600/10 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-600/20'
                        : 'border-white/60 bg-white/45 hover:border-indigo-300 hover:bg-white/80 shadow-xs'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-white border border-slate-200/80 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'
                      }`}
                    >
                      {key}
                    </div>
                    <div className="pt-1 text-sm sm:text-base font-medium text-slate-800 flex-1 leading-snug">
                      {optText}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyboard shortcut helper */}
            <div className="mt-5 text-[11px] text-slate-500 text-center sm:text-right">
              💡 Tekan <kbd className="px-1.5 py-0.5 bg-white/80 border border-white rounded-lg font-mono text-slate-800 shadow-2xs">A</kbd>, <kbd className="px-1.5 py-0.5 bg-white/80 border border-white rounded-lg font-mono text-slate-800 shadow-2xs">B</kbd>, <kbd className="px-1.5 py-0.5 bg-white/80 border border-white rounded-lg font-mono text-slate-800 shadow-2xs">C</kbd>, atau <kbd className="px-1.5 py-0.5 bg-white/80 border border-white rounded-lg font-mono text-slate-800 shadow-2xs">D</kbd> di keyboard untuk memilih cepat.
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              id="btn-prev-question"
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition backdrop-blur-xs ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-white/30 border-white/40 text-slate-400'
                  : 'bg-white/70 border-white/80 text-slate-700 hover:bg-white shadow-xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex === questions.length - 1 ? (
                <button
                  id="btn-submit-quiz"
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim & Selesai Kuis</span>
                </button>
              ) : (
                <button
                  id="btn-next-question"
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Question Palette (1 Col) */}
        <div
          className={`lg:block ${
            showPalette
              ? 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 lg:relative lg:inset-auto lg:p-0 lg:bg-transparent'
              : 'hidden'
          }`}
        >
          <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-5 border border-white/60 shadow-lg w-full max-w-md lg:max-w-none">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                Daftar Nomor Soal
              </h3>
              {showPalette && (
                <button
                  onClick={() => setShowPalette(false)}
                  className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] mb-4 p-2.5 bg-white/50 backdrop-blur-xs rounded-xl border border-white/60">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                <span>{stats.answered} Diisi</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs" />
                <span>{stats.flagged} Ragu</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-2xs" />
                <span>{stats.unanswered} Kosong</span>
              </div>
            </div>

            {/* Question Numbers Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                const isFlagged = ans?.isFlagged;

                let btnClass = 'bg-white/60 text-slate-700 border-white/80 hover:bg-white';
                if (isAnswered && !isFlagged) {
                  btnClass = 'bg-emerald-600 text-white border-emerald-500 shadow-xs';
                } else if (isFlagged) {
                  btnClass = 'bg-amber-400 text-slate-900 border-amber-300 font-bold shadow-xs';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-indigo-600 ring-offset-1 font-extrabold';
                }

                return (
                  <button
                    key={q.id}
                    id={`palette-btn-${idx + 1}`}
                    type="button"
                    onClick={() => {
                      soundManager.playSelect();
                      setCurrentIndex(idx);
                      setShowPalette(false);
                    }}
                    className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Finish Button in Sidebar */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="mt-5 w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 border border-indigo-200/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 backdrop-blur-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai & Kumpulkan Jawaban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-white/60">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Kumpulkan Lembar Ujian?</h3>
                <p className="text-xs text-indigo-700 font-semibold">Nilai akhir hasil ujian & pembahasan langsung ditampilkan</p>
              </div>
            </div>

            {/* Summary badges */}
            <div className="my-4 p-4 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Soal:</span>
                <span className="font-bold text-slate-900">{questions.length} Soal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sudah Dijawab:</span>
                <span className="font-bold text-emerald-600">{stats.answered} Soal</span>
              </div>
              {stats.flagged > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Masih Ragu-ragu:</span>
                  <span className="font-bold text-amber-600">{stats.flagged} Soal</span>
                </div>
              )}
              {stats.unanswered > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-rose-600 font-bold">Belum Dijawab:</span>
                  <span className="font-bold text-rose-600">{stats.unanswered} Soal</span>
                </div>
              )}
            </div>

            {stats.unanswered > 0 && (
              <div className="mb-4 text-xs text-amber-900 bg-amber-50/80 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200/80 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Masih ada <strong>{stats.unanswered} soal yang belum diisi</strong>. Soal kosong akan dihitung salah.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-white/80 rounded-xl text-sm font-bold border border-white/80 backdrop-blur-xs"
              >
                Periksa Lagi
              </button>
              <button
                id="btn-confirm-final-submit"
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer"
              >
                Ya, Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Cancel / Exit */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Batalkan Kuis?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Progress kuis saat ini tidak akan disimpan ke dalam rekap nilai jika Anda keluar sekarang.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 text-slate-700 hover:bg-white/80 rounded-xl text-xs font-bold border border-white/80"
              >
                Lanjutkan Kuis
              </button>
              <button
                type="button"
                onClick={onCancelQuiz}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
