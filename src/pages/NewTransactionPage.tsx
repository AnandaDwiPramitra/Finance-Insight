import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TransactionForm } from '../components/TransactionForm';

export const NewTransactionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/transactions"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Tambah Transaksi Baru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catat pemasukan atau pengeluaran baru ke buku kas pribadi
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <TransactionForm
          onSuccess={() => navigate('/transactions')}
          onCancel={() => navigate('/transactions')}
        />
      </div>
    </div>
  );
};
