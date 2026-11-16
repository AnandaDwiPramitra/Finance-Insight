import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { ExportDataButton } from '../components/ExportDataButton';
import { ImportModal } from '../components/ImportModal';
import { TransactionFormModal } from '../components/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { Transaction } from '../types/finance';
import { resolveTransactionPeriodKey } from '../utils/calculations';
import { formatDateShort, formatMoney } from '../utils/formatMoney';

const PAGE_SIZE = 10;

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    transactionsWithBalance,
    availablePeriods,
    categories,
    accounts,
    deleteTransaction,
    resetAllData,
  } = useFinance();
  const { showToast, confirmAction } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [jenisFilter, setJenisFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const methodOptions = useMemo(() => {
    const set = new Set(transactionsWithBalance.map((t) => t.metode.toLowerCase()));
    return Array.from(set).sort();
  }, [transactionsWithBalance]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = transactionsWithBalance.filter((t) => {
      if (monthFilter !== 'all' && resolveTransactionPeriodKey(t) !== monthFilter) return false;
      if (categoryFilter !== 'all' && t.kategori.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (
        jenisFilter !== 'all' &&
        String(t.jenisPengeluaran || '').toLowerCase() !== jenisFilter.toLowerCase()
      ) {
        return false;
      }
      if (methodFilter !== 'all' && t.metode.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }
      if (accountFilter !== 'all' && t.akun.toLowerCase() !== accountFilter.toLowerCase()) {
        return false;
      }
      if (q) {
        const hay = `${t.keterangan} ${t.kategori} ${t.metode} ${t.akun} ${t.tanggal}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return sortOrder === 'desc' ? [...list].reverse() : list;
  }, [
    transactionsWithBalance,
    search,
    monthFilter,
    categoryFilter,
    jenisFilter,
    methodFilter,
    accountFilter,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (tx: Transaction) => {
    const ok = await confirmAction({
      title: 'Hapus transaksi?',
      message: `Transaksi "${tx.keterangan}" pada ${formatDateShort(tx.tanggal)} akan dihapus permanen dan saldo akan dihitung ulang.`,
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (ok) {
      deleteTransaction(tx.id);
      showToast({ type: 'success', title: 'Transaksi berhasil dihapus' });
    }
  };

  const handleResetAllData = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Semua Transaksi
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola, cari, filter, import, dan export seluruh catatan pemasukan & pengeluaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTx(null);
              setModalOpen(true);
            }}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>
          <ExportDataButton
            transactions={filtered}
            filePrefix="finance-insight-transaksi"
          />
          <button
            type="button"
            onClick={handleResetAllData}
            disabled={transactions.length === 0}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 px-3.5 py-2 text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari keterangan, kategori, metode, akun..."
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Urut Tanggal: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            aria-label="Filter bulan"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm"
          >
            {availablePeriods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter kategori"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter jenis pengeluaran"
            value={jenisFilter}
            onChange={(e) => {
              setJenisFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm"
          >
            <option value="all">Semua Jenis</option>
            <option value="Kebutuhan">Kebutuhan</option>
            <option value="Keinginan">Keinginan</option>
            <option value="Pemasukan">Pemasukan</option>
            <option value="Transfer">Transfer</option>
            <option value="Tabungan">Tabungan</option>
            <option value="Perlu Ditinjau">Perlu Ditinjau</option>
          </select>

          <select
            aria-label="Filter metode"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm"
          >
            <option value="all">Semua Metode</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter akun"
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm col-span-2 sm:col-span-1"
          >
            <option value="all">Semua Akun</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container with horizontal scroll on mobile */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tidak ada transaksi yang sesuai filter.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ubah kata kunci pencarian atau tambahkan transaksi baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[820px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Keterangan</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Jenis</th>
                  <th className="py-3 px-4 font-semibold">Metode</th>
                  <th className="py-3 px-4 font-semibold">Akun</th>
                  <th className="py-3 px-4 font-semibold text-right">Pemasukan</th>
                  <th className="py-3 px-4 font-semibold text-right">Pengeluaran</th>
                  <th className="py-3 px-4 font-semibold text-right">Saldo</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-num whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatDateShort(tx.tanggal)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <button
                        type="button"
                        onClick={() => navigate(`/transactions/${tx.id}`)}
                        className="text-left hover:text-teal-700 dark:hover:text-teal-400 hover:underline"
                      >
                        {tx.keterangan}
                      </button>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {tx.kategori}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {tx.jenisPengeluaran}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {tx.metode}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {tx.akun}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                      {tx.masuk > 0 ? formatMoney(tx.masuk) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-right whitespace-nowrap text-rose-700 dark:text-rose-400">
                      {tx.keluar > 0 ? formatMoney(tx.keluar) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-right whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                      {formatMoney(tx.runningBalance)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/transactions/${tx.id}`)}
                          aria-label="Lihat detail"
                          title="Detail"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTx(tx);
                            setModalOpen(true);
                          }}
                          aria-label="Edit transaksi"
                          title="Edit"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          aria-label="Hapus transaksi"
                          title="Hapus"
                          className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Halaman {safePage} dari {totalPages} · Total {filtered.length} transaksi
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1 font-medium disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1 font-medium disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionFormModal
        isOpen={modalOpen}
        initialData={editingTx}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
      />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};
