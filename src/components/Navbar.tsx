import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpenCheck,
  FileSpreadsheet,
  Database,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  CheckCircle2,
  LogIn,
  LogOut,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { AppView } from '../types';
import { soundManager } from '../utils/sound';
import { useFirebase } from '../context/FirebaseContext';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  resultCount: number;
  questionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  resultCount,
  questionCount,
}) => {
  const [soundActive, setSoundActive] = useState<boolean>(soundManager.getSoundEnabled());
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const { user, isAdmin, isConnected, loginWithGoogle, logout } = useFirebase();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const toggleSound = () => {
    const newVal = soundManager.toggleSound();
    setSoundActive(newVal);
    if (newVal) soundManager.playSelect();
  };

  const handleLoginClick = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      soundManager.playSelect();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      soundManager.playSelect();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header id="main-header" className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              id="brand-logo"
              onClick={() => onNavigate('login')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-800 tracking-tight">Kuis Belajar</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-lg bg-indigo-600/10 text-indigo-700 border border-indigo-200/50 backdrop-blur-xs">
                    Sekolah v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">Aplikasi Kuis Interaktif, Nilai & Pembahasan</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                id="nav-btn-kuis"
                onClick={() => {
                  soundManager.playSelect();
                  onNavigate('login');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'login' || currentView === 'quiz' || currentView === 'result' || currentView === 'review'
                    ? 'bg-white/80 text-indigo-700 border border-white/90 shadow-xs backdrop-blur-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <BookOpenCheck className="w-4 h-4 text-indigo-600" />
                <span>Kuis Siswa</span>
              </button>

              <button
                id="nav-btn-bank-soal"
                onClick={() => {
                  soundManager.playSelect();
                  onNavigate('bank_soal');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'bank_soal'
                    ? 'bg-white/80 text-indigo-700 border border-white/90 shadow-xs backdrop-blur-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Bank Soal</span>
                <span className="sm:hidden">Soal</span>
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-bold">
                  {questionCount}
                </span>
              </button>

              <button
                id="nav-btn-rekap-nilai"
                onClick={() => {
                  soundManager.playSelect();
                  onNavigate('rekap_nilai');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'rekap_nilai'
                    ? 'bg-white/80 text-indigo-700 border border-white/90 shadow-xs backdrop-blur-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Rekap Nilai Guru</span>
                <span className="sm:hidden">Rekap</span>
                {resultCount > 0 && (
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {resultCount}
                  </span>
                )}
              </button>

              {/* Database Status Indicator */}
              <div
                title={
                  isConnected
                    ? 'Cloud Firestore Database: Terhubung & Aktif'
                    : 'Cloud Firestore Database: Menghubungkan...'
                }
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold backdrop-blur-xs transition ${
                  isConnected
                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80'
                    : 'bg-amber-50/80 text-amber-700 border-amber-200/80 animate-pulse'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-amber-500'
                  }`}
                />
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Database Online</span>
              </div>

              {/* User Account / Google Login */}
              {user ? (
                <div className="flex items-center gap-1.5 bg-white/70 border border-white/80 rounded-xl p-1 pr-2 shadow-2xs backdrop-blur-xs">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover border border-indigo-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {(user.displayName || user.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <span className="text-[9px] font-extrabold text-indigo-700 flex items-center gap-0.5">
                      {isAdmin ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5 text-indigo-600" />
                          Guru/Admin
                        </>
                      ) : (
                        'Pengguna'
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    title="Keluar Akun Google"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-login-google"
                  onClick={handleLoginClick}
                  disabled={isLoggingIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                  title="Masuk dengan akun Google untuk sinkronisasi nilai ke Cloud Firestore"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">
                    {isLoggingIn ? 'Memproses...' : 'Masuk Guru'}
                  </span>
                </button>
              )}

              <div className="h-5 w-px bg-slate-300/60 mx-1 hidden sm:block" />

              {/* Sound Toggle */}
              <button
                id="btn-toggle-sound"
                onClick={toggleSound}
                title={soundActive ? 'Matikan Suara Audio' : 'Aktifkan Suara Audio'}
                aria-label="Toggle Sound"
                className={`p-2 rounded-xl border text-sm transition-all backdrop-blur-xs ${
                  soundActive
                    ? 'border-white/60 bg-white/50 text-slate-700 hover:bg-white/80'
                    : 'border-rose-200 bg-rose-50/80 text-rose-600'
                }`}
              >
                {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Help & Workflow Guide */}
              <button
                id="btn-open-help"
                onClick={() => setShowHelp(true)}
                title="Petunjuk & Alur Kuis Belajar"
                aria-label="Petunjuk Aplikasi"
                className="p-2 rounded-xl border border-white/60 bg-white/50 backdrop-blur-xs text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-white/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Alur & Panduan Kuis Belajar</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-indigo-50/60 backdrop-blur-xs rounded-2xl border border-indigo-100/80">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Alur Kuis untuk Murid:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs sm:text-sm pl-1">
                  <li><strong>Identitas</strong>: Masukkan Nama, Kelas, dan NIS.</li>
                  <li><strong>Pilih Mapel</strong>: Matematika, IPA, Bahasa Indonesia, dll.</li>
                  <li><strong>Mulai Kuis</strong>: Soal PG 4 pilihan (A, B, C, D) dengan timer live.</li>
                  <li><strong>Selesai</strong>: Nilai langsung keluar otomatis lengkap dengan status KKM (Lulus/Remidi).</li>
                  <li><strong>Pembahasan</strong>: Pelajari kunci jawaban dan penjelasan langkah tiap nomor.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-emerald-50/60 backdrop-blur-xs rounded-2xl border border-emerald-100/80">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Fitur untuk Guru:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs sm:text-sm pl-1">
                  <li><strong>Bank Soal</strong>: Tambah soal manual atau import langsung dari Google Sheet / Excel.</li>
                  <li><strong>Rekap Nilai</strong>: Pantau seluruh nilai siswa, filter kelas/mapel, dan download Excel/CSV.</li>
                </ul>
              </div>

              <div className="text-xs text-slate-600 bg-white/60 backdrop-blur-xs p-3.5 rounded-2xl border border-white/60">
                <p>💡 <strong>Format Google Sheet/Excel untuk Bank Soal:</strong></p>
                <code className="block mt-1 p-2 bg-slate-100/80 rounded-xl text-slate-800 font-mono text-[11px] border border-slate-200/60">
                  Pertanyaan | A | B | C | D | Jawaban (A/B/C/D) | Pembahasan
                </code>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
