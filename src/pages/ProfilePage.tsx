import React, { useState } from 'react';
import { Bot, RotateCcw, Save, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';

interface ProfilePageProps {
  onOpenAiModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAiModal }) => {
  const { user, updateProfile } = useAuth();
  const { resetAllData, resetDemoData } = useFinance();
  const { showToast, confirmAction } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      name,
      email,
      newPassword: newPassword.trim() ? newPassword : undefined,
    });
    setSaving(false);

    if (!res.ok) {
      showToast({ type: 'error', title: 'Gagal memperbarui profil', description: res.error });
      return;
    }
    setNewPassword('');
    showToast({ type: 'success', title: 'Profil berhasil diperbarui' });
  };

  const handleResetAll = async () => {
    const ok = await confirmAction({
      title: 'Reset semua data?',
      message:
        'Semua transaksi hasil import CSV/XLSX dan data transaksi yang tersimpan di aplikasi akan dihapus. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Reset Data',
      cancelLabel: 'Batal',
      destructive: true,
    });
    if (ok) {
      resetAllData();
      showToast({ type: 'success', title: 'Semua data berhasil dihapus.' });
    }
  };

  const handleResetDemo = async () => {
    const ok = await confirmAction({
      title: 'Reset demo data?',
      message:
        'Transaksi, akun, dan target tabungan milik pengguna aktif akan dikembalikan ke data awal (INITIAL_TRANSACTIONS). Akun pengguna tidak akan dihapus.',
      confirmLabel: 'Reset Demo',
      destructive: true,
    });
    if (ok) {
      resetDemoData();
      showToast({ type: 'info', title: 'Data demo dikembalikan ke kondisi awal' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Profil Pengguna
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Kelola identitas akun lokal, pengaturan AI, dan data transaksi
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900 dark:text-white">
              {user?.name}
            </p>
            <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
              User ID: {user?.id} (read-only)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Nama
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Password Baru (kosongkan jika tidak ingin mengubah)
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>

      {/* Utilities: AI API Key & Reset Data */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Pengaturan Aplikasi & Manajemen Data
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Integrasi Gemini AI
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola API key lokal atau jalankan analisis AI dengan mode fallback.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAiModal}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <Bot className="h-4 w-4" />
            <span>Kelola Gemini AI</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Reset Data (Hapus Semua Transaksi)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hapus seluruh transaksi hasil import CSV/XLSX & transaksi manual. Akun, profil, dan target tabungan tetap aman.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset Data</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Muat Ulang Data Demo
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kembalikan contoh data demo Oktober 2026 tanpa menghapus akun Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-teal-700 dark:text-teal-400" />
        <span>
          Semua data disimpan secara lokal di browser (local-first architecture) melalui service layer terpisah sehingga siap dihubungkan ke REST API/backend di masa depan. Autentikasi lokal hanya untuk penggunaan demo/lokal.
        </span>
      </p>
    </div>
  );
};
