import React, { useState } from 'react';
import { Subject, Question, OptionKey } from '../types';
import { SubjectIcon } from './SubjectIcon';
import { parseSpreadsheetData } from '../utils/storage';
import {
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RotateCcw,
  Download,
  Layers,
  GraduationCap,
  Sliders,
  Settings,
  UserCheck,
  Clock,
  Award,
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useFirebase } from '../context/FirebaseContext';
import { Cloud, Database, RefreshCw } from 'lucide-react';

interface BankSoalViewProps {
  subjects: Subject[];
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (imported: Question[]) => void;
  onResetDefaults: () => void;
  onAddSubject: (s: Subject) => void;
  onUpdateSubject: (s: Subject) => void;
  onStartQuizWithSubject: (sub: Subject) => void;
}

export const BankSoalView: React.FC<BankSoalViewProps> = ({
  subjects,
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onResetDefaults,
  onAddSubject,
  onUpdateSubject,
  onStartQuizWithSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || 'matematika'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { user, isAdmin, syncInitialDataToCloud } = useFirebase();
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  const handleSyncBankSoalToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncMsg(null);
    try {
      await syncInitialDataToCloud(subjects, questions);
      setCloudSyncMsg('✓ Bank soal dan mata pelajaran berhasil disinkronkan ke Cloud Firestore!');
      setTimeout(() => setCloudSyncMsg(null), 4000);
    } catch (e) {
      setCloudSyncMsg('✕ Gagal sinkronisasi.');
    } finally {
      setIsCloudSyncing(false);
    }
  };
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State for Teacher Settings
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [targetQuestionCountInput, setTargetQuestionCountInput] = useState<number>(40);
  const [timerModeInput, setTimerModeInput] = useState<'per_question' | 'total_quiz' | 'none'>('total_quiz');
  const [timerSecondsInput, setTimerSecondsInput] = useState<number>(60);
  const [totalQuizMinutesInput, setTotalQuizMinutesInput] = useState<number>(90);
  const [passingGradeInput, setPassingGradeInput] = useState<number>(75);
  const [teacherNotesInput, setTeacherNotesInput] = useState<string>('');

  // Form State for Single Question
  const [qText, setQText] = useState<string>('');
  const [optA, setOptA] = useState<string>('');
  const [optB, setOptB] = useState<string>('');
  const [optC, setOptC] = useState<string>('');
  const [optD, setOptD] = useState<string>('');
  const [correctKey, setCorrectKey] = useState<OptionKey>('A');
  const [explanation, setExplanation] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');

  // Form State for Import from Google Sheet
  const [rawImportText, setRawImportText] = useState<string>('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [parsedPreview, setParsedPreview] = useState<Question[]>([]);

  // Form State for New Subject
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubDesc, setNewSubDesc] = useState<string>('');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const subjectTotalQuestions = questions.filter((q) => q.subjectId === activeSubject?.id).length;

  if (!activeSubject || subjects.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white/75 backdrop-blur-xl rounded-3xl border border-white/80 text-center shadow-xl">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">Menyiapkan bank soal sekolah...</p>
      </div>
    );
  }

  const handleOpenTeacherModal = () => {
    if (!activeSubject) return;
    setTeacherNameInput(activeSubject.teacherName || '');
    setTargetQuestionCountInput(
      activeSubject.targetQuestionCount || Math.min(40, Math.max(1, subjectTotalQuestions))
    );
    setTimerModeInput(activeSubject.timerMode || 'total_quiz');
    setTimerSecondsInput(activeSubject.timerSecondsPerQuestion || 60);
    setTotalQuizMinutesInput(activeSubject.totalQuizMinutes || 90);
    setPassingGradeInput(activeSubject.passingGrade || 75);
    setTeacherNotesInput(activeSubject.teacherNotes || '');
    setShowTeacherModal(true);
  };

  const handleSaveTeacherSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) return;
    const maxAllowed = Math.max(1, subjectTotalQuestions);
    const validCount = Math.max(1, Math.min(targetQuestionCountInput, maxAllowed));
    const validMinutes = Math.max(5, Math.min(totalQuizMinutesInput, 180));

    const updated: Subject = {
      ...activeSubject,
      teacherName: teacherNameInput.trim() || 'Guru Pengampu',
      targetQuestionCount: validCount,
      timerMode: timerModeInput,
      timerSecondsPerQuestion: timerSecondsInput,
      totalQuizMinutes: validMinutes,
      passingGrade: passingGradeInput,
      teacherNotes: teacherNotesInput.trim(),
    };
    onUpdateSubject(updated);
    soundManager.playSelect();
    setShowTeacherModal(false);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchSub = q.subjectId === selectedSubjectId;
    if (!matchSub) return false;
    if (!searchQuery.trim()) return true;
    const qLower = q.question.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      qLower.includes(query) ||
      q.explanation.toLowerCase().includes(query) ||
      [q.options.A, q.options.B, q.options.C, q.options.D].some((opt) =>
        opt.toLowerCase().includes(query)
      )
    );
  });

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectKey('A');
    setExplanation('');
    setDifficulty('Sedang');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.question);
    setOptA(q.options.A);
    setOptB(q.options.B);
    setOptC(q.options.C);
    setOptD(q.options.D);
    setCorrectKey(q.correctAnswer);
    setExplanation(q.explanation);
    setDifficulty(q.difficulty || 'Sedang');
    setShowAddModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Mohon lengkapi teks soal dan semua 4 pilihan jawaban.');
      return;
    }

    if (editingQuestion) {
      onUpdateQuestion({
        ...editingQuestion,
        subjectId: selectedSubjectId,
        question: qText.trim(),
        options: { A: optA.trim(), B: optB.trim(), C: optC.trim(), D: optD.trim() },
        correctAnswer: correctKey,
        explanation: explanation.trim() || `Jawaban yang benar adalah ${correctKey}.`,
        difficulty,
      });
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: selectedSubjectId,
        question: qText.trim(),
        options: { A: optA.trim(), B: optB.trim(), C: optC.trim(), D: optD.trim() },
        correctAnswer: correctKey,
        explanation: explanation.trim() || `Jawaban yang benar adalah ${correctKey}.`,
        difficulty,
      };
      onAddQuestion(newQ);
    }

    soundManager.playSelect();
    setShowAddModal(false);
  };

  // Google Sheet paste parse preview
  const handleParseImport = (text: string) => {
    setRawImportText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      setImportErrors([]);
      return;
    }
    const result = parseSpreadsheetData(text, selectedSubjectId);
    setParsedPreview(result.questions);
    setImportErrors(result.errors);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) {
      alert('Tidak ada soal valid yang terdeteksi dari teks spreadsheet.');
      return;
    }
    onImportQuestions(parsedPreview);
    soundManager.playFinishSuccess();
    setShowImportModal(false);
    setRawImportText('');
    setParsedPreview([]);
    setImportErrors([]);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const id = newSubName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newSubject: Subject = {
      id,
      name: newSubName.trim(),
      iconName: 'Sparkles',
      color: 'indigo',
      description: newSubDesc.trim() || 'Mata pelajaran kustom',
      isCustom: true,
    };

    onAddSubject(newSubject);
    setSelectedSubjectId(id);
    setShowAddSubjectModal(false);
    setNewSubName('');
    setNewSubDesc('');
    soundManager.playSelect();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-300/60 text-emerald-800 text-xs font-bold uppercase mb-2 backdrop-blur-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Manajemen Bank Soal & Kurikulum
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bank Soal Sekolah 📚
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Kelola bank soal untuk tiap mata pelajaran. Anda dapat menambah soal baru secara manual atau langsung <strong>copy-paste tabel dari Google Sheet / Excel</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user && isAdmin && (
            <button
              id="btn-sync-bank-soal-cloud"
              onClick={handleSyncBankSoalToCloud}
              disabled={isCloudSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer"
              title="Unggah dan simpan seluruh bank soal ke database cloud Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Simpan ke Cloud'}</span>
            </button>
          )}

          <button
            id="btn-import-sheet"
            onClick={() => {
              setShowImportModal(true);
              setRawImportText('');
              setParsedPreview([]);
              setImportErrors([]);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import dari Google Sheet / Excel</span>
          </button>

          <button
            id="btn-add-manual-question"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal</span>
          </button>
        </div>
      </div>

      {cloudSyncMsg && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{cloudSyncMsg}</span>
          <button onClick={() => setCloudSyncMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subject Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {subjects.map((sub) => {
            const count = questions.filter((q) => q.subjectId === sub.id).length;
            const isSelected = sub.id === selectedSubjectId;

            return (
              <button
                key={sub.id}
                id={`tab-subject-${sub.id}`}
                onClick={() => {
                  soundManager.playSelect();
                  setSelectedSubjectId(sub.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all backdrop-blur-xs ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 border border-indigo-500'
                    : 'bg-white/60 text-slate-700 hover:bg-white/90 border border-white/80 shadow-xs'
                }`}
              >
                <SubjectIcon name={sub.iconName} className="w-4 h-4" />
                <span>{sub.name}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100/90 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50/80 border border-dashed border-indigo-300 rounded-2xl backdrop-blur-xs bg-white/40 transition cursor-pointer"
          >
            + Mapel Baru
          </button>
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
            />
          </div>

          <button
            onClick={() => {
              if (confirm('Kembalikan bank soal ke soal bawaan sistem?')) {
                onResetDefaults();
              }
            }}
            title="Reset ke Soal Bawaan"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl hover:bg-white/90 shadow-2xs transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Subject Description & Teacher Setting Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-white/80 via-white/70 to-indigo-50/80 rounded-3xl p-5 sm:p-6 border border-white/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 shrink-0">
            <SubjectIcon name={activeSubject?.iconName || 'BookOpen'} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-extrabold text-slate-900">{activeSubject?.name}</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-indigo-600" />
                {activeSubject?.teacherName || 'Guru Belum Diatur'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-600" />
                Target Ujian: {activeSubject?.targetQuestionCount || 5} Soal (dari {subjectTotalQuestions} di Bank)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{activeSubject?.description}</p>
            {activeSubject?.teacherNotes && (
              <p className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 rounded-lg mt-2 inline-block">
                💬 <strong>Pesan Guru:</strong> "{activeSubject.teacherNotes}"
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            id="btn-edit-teacher-settings"
            onClick={handleOpenTeacherModal}
            className="px-4 py-2.5 bg-white/80 hover:bg-white text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Ubah nama guru dan jumlah soal yang dikerjakan murid untuk mapel ini"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Atur Guru & Jumlah Soal</span>
          </button>

          <button
            onClick={() => onStartQuizWithSubject(activeSubject)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-200 hover:shadow-lg cursor-pointer"
          >
            <span>Mulai Kuis Mapel Ini</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-12 text-center border border-white/60 shadow-lg">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Soal</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Mata pelajaran ini belum memiliki soal. Klik "Tambah Soal" atau "Import dari Google Sheet" di atas.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 border border-white/60 shadow-md hover:border-indigo-300/80 transition-all space-y-4"
            >
              {/* Question Item Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-white/80 text-slate-800 shadow-2xs">
                    Kunci: Pilihan {q.correctAnswer}
                  </span>
                  {q.difficulty && (
                    <span className="text-[11px] font-bold text-slate-600 bg-white/60 px-2 py-0.5 rounded-md border border-white/80">
                      {q.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(q)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition"
                    title="Edit Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Hapus butir soal ini?')) {
                        onDeleteQuestion(q.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {q.question}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => {
                  const isCorrect = key === q.correctAnswer;
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-2xl border flex items-start gap-2 backdrop-blur-xs ${
                        isCorrect
                          ? 'border-emerald-400 bg-emerald-50/80 font-bold text-emerald-950 shadow-xs'
                          : 'border-white/80 bg-white/50 text-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-white shadow-2xs text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {key}
                      </span>
                      <span className="flex-1">{q.options[key]}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note */}
              {q.explanation && (
                <div className="text-xs text-slate-700 bg-indigo-50/60 backdrop-blur-xs p-3 rounded-2xl border border-indigo-100">
                  <strong className="text-indigo-800 font-bold">Pembahasan:</strong>{' '}
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah / Edit Soal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/90 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/80 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80 font-bold text-slate-800"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Pertanyaan / Soal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan soal pilihan ganda di sini..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">A</span>
                    Pilihan A <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">B</span>
                    Pilihan B <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">C</span>
                    Pilihan C <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">D</span>
                    Pilihan D <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                  />
                </div>
              </div>

              {/* Kunci Jawaban & Tingkat Kesulitan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kunci Jawaban yang Benar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value as OptionKey)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500 bg-emerald-50 font-bold text-emerald-900"
                  >
                    <option value="A">Pilihan A</option>
                    <option value="B">Pilihan B</option>
                    <option value="C">Pilihan C</option>
                    <option value="D">Pilihan D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Kesulitan:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penjelasan / Pembahasan Soal:
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan cara pengerjaan atau alasan kenapa kunci jawaban tersebut benar..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white/80"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import dari Google Sheet / Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/90 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-white/80 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Import dari Google Sheet / Excel
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-emerald-500/15 backdrop-blur-xs rounded-2xl border border-emerald-300/50 text-emerald-950 leading-relaxed">
                <p className="font-bold mb-1">📋 Format Kolom Spreadsheet:</p>
                <p className="text-xs text-slate-600 mb-2">
                  Blok dan copy tabel spreadsheet Anda, lalu paste langsung ke kotak di bawah ini. Urutan kolom:
                </p>
                <div className="bg-white/80 p-2 rounded-xl font-mono text-[11px] text-slate-800 border border-emerald-300/80 overflow-x-auto whitespace-nowrap shadow-2xs">
                  Pertanyaan | Pilihan A | Pilihan B | Pilihan C | Pilihan D | Kunci Jawaban (A/B/C/D) | Pembahasan
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Import ke Mata Pelajaran:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    if (rawImportText) handleParseImport(rawImportText);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80 font-bold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Data dari Spreadsheet di Sini:
                </label>
                <textarea
                  rows={6}
                  placeholder={`Contoh:\nBerapa 5 + 3?\t6\t7\t8\t9\tC\t5+3=8\nIbu kota Indonesia?\tJakarta\tIKN\tBandung\tSurabaya\tB\tIKN di Kaltim`}
                  value={rawImportText}
                  onChange={(e) => handleParseImport(e.target.value)}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-white/80 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Parse Feedback */}
              {parsedPreview.length > 0 && (
                <div className="p-3 bg-indigo-50/80 backdrop-blur-xs rounded-xl border border-indigo-200 text-indigo-900 text-xs">
                  ✨ Terdeteksi <strong>{parsedPreview.length} butir soal valid</strong> yang siap diimpor.
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50/80 backdrop-blur-xs rounded-xl border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Peringatan Baris:
                  </div>
                  {importErrors.slice(0, 3).map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-white/80 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-import"
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition cursor-pointer"
                >
                  Impor {parsedPreview.length} Soal Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Mapel */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/90 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/80">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Buat Mata Pelajaran Baru
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Mata Pelajaran:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sejarah Indonesia / Sosiologi"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Materi:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bab 1 Perjuangan Kemerdekaan"
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white/80"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-white/80 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Tambah Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Guru & Jumlah Soal Ujian */}
      {showTeacherModal && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/95 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-white/80 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pengaturan Guru & Soal Ujian
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mata Pelajaran: <strong className="text-indigo-600">{activeSubject.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherSettings} className="space-y-4 text-xs sm:text-sm">
              {/* Nama Guru Pengampu */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Nama Guru Pengampu Mapel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Ratna Dewi, S.Pd."
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nama guru ini akan tertera pada kuis murid, sertifikat nilai, dan rekap nilai guru.
                </p>
              </div>

              {/* Jumlah Soal yang Dikerjakan Siswa */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Jumlah Soal yang Dikerjakan Siswa (Target Ujian) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                    Tersedia {subjectTotalQuestions} Soal di Bank
                  </span>
                </label>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setTargetQuestionCountInput((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, subjectTotalQuestions)}
                    value={targetQuestionCountInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setTargetQuestionCountInput(Math.max(1, Math.min(val, Math.max(1, subjectTotalQuestions))));
                      }
                    }}
                    className="flex-1 text-center font-bold text-lg py-2 rounded-xl border border-slate-300 bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTargetQuestionCountInput((prev) =>
                        Math.min(Math.max(1, subjectTotalQuestions), prev + 1)
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[11px] font-bold text-slate-600 mr-1">Pilih Cepat:</span>
                  {[20, 25, 30, 35, 40, 45, 50].map((num) => {
                    if (num > subjectTotalQuestions && subjectTotalQuestions > 0) return null;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTargetQuestionCountInput(num)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          targetQuestionCountInput === num
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {num} Soal
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setTargetQuestionCountInput(Math.max(1, subjectTotalQuestions))}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      targetQuestionCountInput === subjectTotalQuestions
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({subjectTotalQuestions})
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  💡 Siswa yang memilih <strong>{activeSubject.name}</strong> akan diberikan <strong>{targetQuestionCountInput} butir soal</strong> untuk dikerjakan. Jika di bank terdapat {subjectTotalQuestions} soal, soal akan diambil secara acak sebanyak {targetQuestionCountInput} soal.
                </p>
              </div>

              {/* Mode Timer & Waktu Ujian */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Durasi Pengerjaan Ujian (Menit):
                  </label>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    {totalQuizMinutesInput} Menit
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTotalQuizMinutesInput((prev) => Math.max(5, prev - 5))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    step={5}
                    value={totalQuizMinutesInput}
                    onChange={(e) => setTotalQuizMinutesInput(Math.max(5, Math.min(180, parseInt(e.target.value, 10) || 90)))}
                    className="flex-1 text-center font-bold text-base py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setTotalQuizMinutesInput((prev) => Math.min(180, prev + 5))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { m: 90, label: '90 Menit (1.5 Jam)' },
                    { m: 120, label: '120 Menit (2 Jam)' },
                    { m: 60, label: '60 Menit' },
                    { m: 45, label: '45 Menit' },
                  ].map((item) => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setTotalQuizMinutesInput(item.m)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                        totalQuizMinutesInput === item.m
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Timer & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Waktu per Soal (Detik):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={timerSecondsInput}
                    onChange={(e) => setTimerSecondsInput(parseInt(e.target.value, 10) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Jika memakai timer per nomor (Standar: 60 dtk)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    Standar KKM Kelulusan:
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={passingGradeInput}
                    onChange={(e) => setPassingGradeInput(parseInt(e.target.value, 10) || 75)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Skala 0 - 100 (Default: 75)</span>
                </div>
              </div>

              {/* Catatan / Pesan Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan / Petunjuk Guru untuk Siswa (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Baca soal cerita dengan seksama, siapkan kertas coret-coretan."
                  value={teacherNotesInput}
                  onChange={(e) => setTeacherNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-teacher-settings"
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Simpan Pengaturan Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
