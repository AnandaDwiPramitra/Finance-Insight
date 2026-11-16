import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { TransactionFormModal } from '../components/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { formatDateShort, formatMoney } from '../utils/formatMoney';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactionsWithBalance, deleteTransaction } = useFinance();
  const { showToast, confirmAction } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const txId = Number(id);
  const tx = transactionsWithBalance.find((item) => item.id === txId);

  if (!tx) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Transaksi tidak ditemukan
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Data transaksi mungkin sudah dihapus atau bukan milik akun ini.
        </p>
        <Link
          to="/transactions"
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Transaksi</span>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Hapus transaksi?',
      message: `Hapus transaksi "${tx.keterangan}"? Saldo kronologis akan dihitung ulang.`,
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (ok) {
      deleteTransaction(tx.id);
      showToast({ type: 'success', title: 'Transaksi berhasil dihapus' });
      navigate('/transactions');
    }
  };

  const isIncome = tx.masuk > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Detail Transaksi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID #{tx.id} · {formatDateShort(tx.tanggal)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div className="pb-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tx.tipe}</p>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {tx.keterangan}
            </h3>
          </div>
          <div className="sm:text-right">
            <p
              className={`font-mono-num text-2xl font-bold ${
                isIncome
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {isIncome ? `+${formatMoney(tx.masuk)}` : `-${formatMoney(tx.keluar)}`}
            </p>
            <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saldo setelah transaksi: {formatMoney(tx.runningBalance)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Tanggal</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
              {formatDateShort(tx.tanggal)} ({tx.tanggal})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Kategori</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{tx.kategori}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Jenis Pengeluaran</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
              {tx.jenisPengeluaran}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Metode Pembayaran</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{tx.metode}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Akun</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{tx.akun}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Rincian Nominal</dt>
            <dd className="font-mono-num font-medium text-slate-900 dark:text-white mt-0.5">
              Masuk {formatMoney(tx.masuk)} · Keluar {formatMoney(tx.keluar)}
            </dd>
          </div>
          {tx.transferId && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">ID Transfer</dt>
              <dd className="font-mono-num font-medium text-teal-700 dark:text-teal-400 mt-0.5">
                {tx.transferId}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <TransactionFormModal
        isOpen={editOpen}
        initialData={tx}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
};
