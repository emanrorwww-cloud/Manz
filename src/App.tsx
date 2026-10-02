/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AppView,
  Subject,
  Question,
  QuizSettings,
  StudentInfo,
  QuizResult,
} from './types';
import {
  getStoredQuestions,
  saveQuestions,
  resetQuestionsToDefault,
  getStoredSubjects,
  saveSubjects,
  getStoredResults,
  saveQuizResult,
  deleteQuizResult,
  clearAllResults,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { BankSoalView } from './components/BankSoalView';
import { RekapNilaiView } from './components/RekapNilaiView';
import { useFirebase } from './context/FirebaseContext';

export default function App() {
  const { user, saveResultToCloud, cloudResults } = useFirebase();
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [questions, setQuestions] = useState<Question[]>(() => getStoredQuestions());
  const [subjects, setSubjects] = useState<Subject[]>(() => getStoredSubjects());
  const [results, setResults] = useState<QuizResult[]>(() => getStoredResults());

  // Active quiz session state
  const [activeStudent, setActiveStudent] = useState<StudentInfo | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeSettings, setActiveSettings] = useState<QuizSettings | null>(null);

  // Latest completed result
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null);

  // Initial load
  useEffect(() => {
    setQuestions(getStoredQuestions());
    setSubjects(getStoredSubjects());
    setResults(getStoredResults());
  }, []);

  // Merge local and cloud results
  const displayedResults = useMemo(() => {
    const map = new Map<string, QuizResult>();
    results.forEach((r) => map.set(r.id, r));
    cloudResults.forEach((r) => map.set(r.id, r));
    const list = Array.from(map.values());
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [results, cloudResults]);

  // --- START QUIZ HANDLER ---
  const handleStartQuiz = (
    student: StudentInfo,
    selectedSubject: Subject,
    settings: QuizSettings
  ) => {
    let subQuestions = questions.filter((q) => q.subjectId === selectedSubject.id);

    // Shuffle if enabled
    if (settings.shuffleQuestions) {
      subQuestions = [...subQuestions].sort(() => Math.random() - 0.5);
    }

    // Limit question count
    if (settings.questionCount && settings.questionCount < subQuestions.length) {
      subQuestions = subQuestions.slice(0, settings.questionCount);
    }

    setActiveStudent(student);
    setActiveSubject(selectedSubject);
    setActiveQuestions(subQuestions);
    setActiveSettings(settings);
    setCurrentView('quiz');
  };

  // --- FINISH QUIZ HANDLER ---
  const handleFinishQuiz = (result: QuizResult) => {
    const resultWithTeacher: QuizResult = {
      ...result,
      teacherName: activeSubject?.teacherName || result.teacherName,
    };
    const updated = saveQuizResult(resultWithTeacher);
    setResults(updated);
    setLatestResult(resultWithTeacher);
    setCurrentView('result');

    // Cloud sync
    if (user) {
      saveResultToCloud(resultWithTeacher).catch((err) => {
        console.warn('Background cloud save:', err);
      });
    }
  };

  // --- QUESTION BANK HANDLERS ---
  const handleAddQuestion = (q: Question) => {
    const updated = [q, ...questions];
    setQuestions(updated);
    saveQuestions(updated);
  };

  const handleUpdateQuestion = (q: Question) => {
    const updated = questions.map((item) => (item.id === q.id ? q : item));
    setQuestions(updated);
    saveQuestions(updated);
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter((item) => item.id !== id);
    setQuestions(updated);
    saveQuestions(updated);
  };

  const handleImportQuestions = (imported: Question[]) => {
    const updated = [...imported, ...questions];
    setQuestions(updated);
    saveQuestions(updated);
  };

  const handleResetDefaults = () => {
    const defaults = resetQuestionsToDefault();
    setQuestions(defaults);
  };

  const handleAddSubject = (s: Subject) => {
    const updated = [...subjects, s];
    setSubjects(updated);
    saveSubjects(updated);
  };

  const handleUpdateSubject = (updatedSub: Subject) => {
    const updated = subjects.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubjects(updated);
    saveSubjects(updated);
  };

  // --- REKAP HANDLERS ---
  const handleDeleteResult = (id: string) => {
    const updated = deleteQuizResult(id);
    setResults(updated);
  };

  const handleClearAllResults = () => {
    clearAllResults();
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient Frosted Glass Glow Background Orbs */}
      <div className="fixed w-[550px] h-[550px] bg-blue-300/50 rounded-full blur-[130px] -top-24 -left-24 pointer-events-none z-0 animate-pulse duration-10000" />
      <div className="fixed w-[450px] h-[450px] bg-purple-300/50 rounded-full blur-[130px] -bottom-24 -right-24 pointer-events-none z-0" />
      <div className="fixed w-[380px] h-[380px] bg-indigo-300/30 rounded-full blur-[110px] top-1/3 right-1/4 pointer-events-none z-0" />
      <div className="fixed w-[300px] h-[300px] bg-emerald-200/30 rounded-full blur-[90px] bottom-1/4 left-1/4 pointer-events-none z-0" />

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        resultCount={displayedResults.length}
        questionCount={questions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {currentView === 'login' && (
          <LoginForm
            subjects={subjects}
            questions={questions}
            onStartQuiz={handleStartQuiz}
            onOpenBankSoal={() => setCurrentView('bank_soal')}
            onOpenRekap={() => setCurrentView('rekap_nilai')}
            onUpdateSubject={handleUpdateSubject}
            latestResult={latestResult || (displayedResults.length > 0 ? displayedResults[0] : null)}
            onViewLatestResult={(res) => {
              setLatestResult(res);
              setCurrentView('result');
            }}
          />
        )}

        {currentView === 'quiz' && activeStudent && activeSubject && activeSettings && (
          <QuizScreen
            student={activeStudent}
            subject={activeSubject}
            questions={activeQuestions}
            settings={activeSettings}
            onFinishQuiz={handleFinishQuiz}
            onCancelQuiz={() => setCurrentView('login')}
          />
        )}

        {currentView === 'result' && latestResult && (
          <ResultScreen
            result={latestResult}
            onRetakeQuiz={() => setCurrentView('login')}
            onGoToBankSoal={() => setCurrentView('bank_soal')}
            onGoToRekap={() => setCurrentView('rekap_nilai')}
          />
        )}

        {currentView === 'bank_soal' && (
          <BankSoalView
            subjects={subjects}
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onImportQuestions={handleImportQuestions}
            onResetDefaults={handleResetDefaults}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onStartQuizWithSubject={(sub) => {
              setCurrentView('login');
            }}
          />
        )}

        {currentView === 'rekap_nilai' && (
          <RekapNilaiView
            results={displayedResults}
            subjects={subjects}
            onDeleteResult={handleDeleteResult}
            onClearAll={handleClearAllResults}
            onRetakeOrStartQuiz={() => setCurrentView('login')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-white/40 bg-white/40 backdrop-blur-xl text-xs text-slate-500 text-center print:hidden relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Kuis Belajar Sekolah</span>
            <span>•</span>
            <span>Ujian CBT, Pembahasan & Rekap Nilai</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Pilihan Ganda A-B-C-D</span>
            <span>•</span>
            <span>Live Timer 60s</span>
            <span>•</span>
            <span>Import Google Sheets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
