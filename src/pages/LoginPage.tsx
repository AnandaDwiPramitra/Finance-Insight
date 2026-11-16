import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Gagal login.');
      return;
    }

    showToast({ type: 'success', title: 'Login berhasil' });
    navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    setError('');
    setSubmitting(true);
    const res = await loginDemo();
    setSubmitting(false);

    if (res.ok) {
      showToast({
        type: 'success',
        title: 'Masuk sebagai Demo User',
        description: 'Data demo Oktober 2026 siap digunakan.',
      });
      navigate('/dashboard');
    } else {
      setError(res.error || 'Gagal masuk ke akun demo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <CreditCard className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finance Insight
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Personal Financial Management & Business Intelligence
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Masuk ke Akun
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Data transaksi, akun, dan analisis terisolasi per pengguna secara lokal.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>{submitting ? 'Memproses...' : 'Login'}</span>
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 shrink-0">
              atau coba cepat
            </span>
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Masuk dengan Akun Demo (demo@financeinsight.local)
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
          <span>
            Autentikasi local-only menggunakan hashing SHA-256 browser untuk demo lokal (bukan pengganti autentikasi backend production).
          </span>
        </p>
      </div>
    </div>
  );
};
