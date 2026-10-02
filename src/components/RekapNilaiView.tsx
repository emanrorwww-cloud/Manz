import React, { useState } from 'react';
import { QuizResult, Subject } from '../types';
import { exportResultsToCSV } from '../utils/storage';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Trash2,
  Eye,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Sparkles,
  School,
  X,
  Cloud,
  Database,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useFirebase } from '../context/FirebaseContext';

interface RekapNilaiViewProps {
  results: QuizResult[];
  subjects: Subject[];
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  onRetakeOrStartQuiz: () => void;
}

export const RekapNilaiView: React.FC<RekapNilaiViewProps> = ({
  results,
  subjects,
  onDeleteResult,
  onClearAll,
  onRetakeOrStartQuiz,
}) => {
  const { user, isConnected, cloudResults, syncLocalResultsToCloud, loginWithGoogle } = useFirebase();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingDetail, setViewingDetail] = useState<QuizResult | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncClick = async () => {
    if (!user) {
      try {
        await loginWithGoogle();
      } catch (e) {
        console.error(e);
        return;
      }
    }
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const syncedCount = await syncLocalResultsToCloud(results);
      setSyncMessage(`✓ Berhasil menyinkronkan ${syncedCount} lembar nilai siswa ke Cloud Firestore!`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (e) {
      setSyncMessage('✕ Gagal menyinkronkan data.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract unique classes
  const uniqueClasses = Array.from(new Set(results.map((r) => r.student.studentClass))).filter(Boolean);

  // Filtered list
  const filteredResults = results.filter((r) => {
    if (selectedSubjectFilter !== 'all' && r.subjectId !== selectedSubjectFilter) return false;
    if (selectedClassFilter !== 'all' && r.student.studentClass !== selectedClassFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.student.name.toLowerCase().includes(q);
      const matchNis = (r.student.nis || '').toLowerCase().includes(q);
      const matchSubject = r.subjectName.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchSubject) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = filteredResults.length;
  const avgScore = totalCount > 0
    ? Math.round(filteredResults.reduce((acc, r) => acc + r.score, 0) / totalCount)
    : 0;
  const maxScore = totalCount > 0
    ? Math.max(...filteredResults.map((r) => r.score))
    : 0;
  const passedCount = filteredResults.filter((r) => r.passed).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const handleExport = () => {
    soundManager.playSelect();
    exportResultsToCSV(filteredResults);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase mb-2 backdrop-blur-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Dashboard & Buku Nilai Guru
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Rekap Nilai Siswa 📊
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Pantau hasil pengerjaan kuis siswa secara real-time, evaluasi tingkat ketuntasan KKM, dan <strong>ekspor rekap ke format Excel / Google Sheets</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-sync-cloud"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition cursor-pointer"
            title="Sinkronkan data rekap nilai ke Google Cloud Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : user ? 'Sinkron ke Cloud' : 'Masuk & Sinkron Cloud'}</span>
          </button>

          <button
            id="btn-export-excel-csv"
            onClick={handleExport}
            disabled={results.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Rekap Excel (CSV)</span>
          </button>

          {results.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Yakin ingin mengosongkan semua riwayat rekap nilai siswa?')) {
                  onClearAll();
                }
              }}
              className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl transition cursor-pointer shadow-2xs"
              title="Hapus Semua Riwayat Rekap"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cloud Database Status Card */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl p-4 sm:p-5 border border-white/70 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">
                Penyimpanan Database Cloud (Firestore)
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {isConnected ? '● ONLINE' : '○ CONNECTING'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {user
                ? `Terhubung dengan akun Google: ${user.email}. Nilai ujian siswa tersimpan otomatis ke cloud.`
                : 'Masuk akun Google Guru untuk mengakses database nilai cloud secara live dan multi-perangkat.'}
            </p>
          </div>
        </div>

        {syncMessage && (
          <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 animate-fadeIn">
            {syncMessage}
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/65 p-5 rounded-3xl border border-white/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kuis</span>
            <p className="text-2xl font-extrabold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/65 p-5 rounded-3xl border border-white/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Nilai</span>
            <p className="text-2xl font-extrabold text-emerald-700">{avgScore} <span className="text-xs font-medium text-slate-400">/ 100</span></p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/65 p-5 rounded-3xl border border-white/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Tertinggi</span>
            <p className="text-2xl font-extrabold text-amber-700">{maxScore}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/65 p-5 rounded-3xl border border-white/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-700 flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuntas KKM</span>
            <p className="text-2xl font-extrabold text-blue-700">{passRate}% <span className="text-xs font-medium text-slate-400">({passedCount} siswa)</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="backdrop-blur-xl bg-white/65 p-4 rounded-3xl border border-white/60 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
            />
          </div>

          {/* Filter Mapel */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-slate-700 font-bold shadow-2xs"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Filter Kelas */}
          {uniqueClasses.length > 0 && (
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-2 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 text-slate-700 font-bold shadow-2xs"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong>{filteredResults.length}</strong> data hasil kuis
        </div>
      </div>

      {/* Results Table */}
      <div className="backdrop-blur-xl bg-white/65 rounded-3xl border border-white/60 overflow-hidden shadow-lg">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Catatan Nilai</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Siswa yang mengerjakan kuis akan otomatis tercatat di tabel rekap ini.
            </p>
            <button
              onClick={onRetakeOrStartQuiz}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition cursor-pointer"
            >
              Mulai Kuis Siswa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-slate-200/60 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas / NIS</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4 text-center">Benar / Soal</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir (0-100)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {filteredResults.map((r, i) => (
                  <tr
                    key={r.id}
                    className="hover:bg-white/60 transition-colors group text-slate-800"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">{i + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.student.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-bold">Kelas {r.student.studentClass}</span>
                      {r.student.nis && (
                        <div className="text-[11px] text-slate-400 font-medium">NIS: {r.student.nis}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-800 font-bold text-xs border border-indigo-200/60 backdrop-blur-xs">
                        {r.subjectName}
                      </span>
                      {r.teacherName && (
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Guru: {r.teacherName}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="text-emerald-700">{r.correctAnswers}</span> / {r.totalQuestions}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-base font-black px-2.5 py-0.5 rounded-xl backdrop-blur-xs ${
                          r.passed
                            ? 'text-emerald-800 bg-emerald-100/80 border border-emerald-200'
                            : 'text-rose-800 bg-rose-100/80 border border-rose-200'
                        }`}
                      >
                        {r.score}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs ${
                          r.passed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {r.passed ? 'Lulus' : 'Remidi'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          soundManager.playSelect();
                          setViewingDetail(r);
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-white/80 rounded-lg transition mr-1 cursor-pointer"
                        title="Lihat Rincian Jawaban Siswa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan nilai untuk ${r.student.name}?`)) {
                            onDeleteResult(r.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for Teacher */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="backdrop-blur-2xl bg-white/90 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Rincian Hasil Kuis Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingDetail.student.name} • Kelas {viewingDetail.student.studentClass} • {viewingDetail.subjectName}
                  {viewingDetail.teacherName && ` • Guru: ${viewingDetail.teacherName}`}
                </p>
              </div>
              <button
                onClick={() => setViewingDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score summary */}
            <div className="p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-white/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-slate-500 font-bold">Nilai Akhir:</span>
                <div className="text-2xl font-black text-indigo-600">
                  {viewingDetail.score} / 100
                </div>
              </div>
              <div className="text-right text-xs text-slate-600 font-medium">
                <div>Benar: <strong className="text-emerald-700 font-bold">{viewingDetail.correctAnswers}</strong> / {viewingDetail.totalQuestions}</div>
                <div>Durasi: {viewingDetail.timeSpentSeconds} detik</div>
                <div>Status: <strong className={viewingDetail.passed ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{viewingDetail.passed ? 'TUNTAS KKM' : 'REMIDIAL'}</strong></div>
              </div>
            </div>

            {/* Question by question list */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Jawaban:
              </h4>
              {viewingDetail.questions.map((q, idx) => {
                const ans = viewingDetail.answers[q.id];
                const isCorrect = ans?.selectedOption === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-2xl border text-xs backdrop-blur-xs ${
                      isCorrect
                        ? 'border-emerald-300/80 bg-emerald-50/60'
                        : 'border-rose-300/80 bg-rose-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">Soal #{idx + 1}</span>
                      <span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isCorrect ? '✓ Benar' : '✕ Salah'}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium mb-2">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        Pilihan Siswa: <strong className="text-slate-900">{ans?.selectedOption || '(Kosong)'}</strong>
                      </div>
                      <div>
                        Kunci Jawaban: <strong className="text-emerald-800">{q.correctAnswer}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setViewingDetail(null)}
                className="px-4 py-2 bg-white/80 hover:bg-white text-slate-700 rounded-xl text-xs font-bold border border-white/80 shadow-2xs cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
