import React, { useState } from 'react';
import {
  CreditCard,
  Edit2,
  Filter,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { Account, AccountType } from '../types/finance';
import {
  isSavingsTransaction,
  resolveTransactionPeriodKey,
} from '../utils/calculations';
import { formatDateShort, formatMoney, getMonthLabel } from '../utils/formatMoney';

export const AccountsPage: React.FC = () => {
  const {
    accountsWithBalance,
    cashBalance,
    seaBankBalance,
    digitalBalance,
    liquidBalance,
    totalAccountBalance,
    transactionsWithBalance,
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useFinance();
  const { showToast, confirmAction } = useToast();

  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Bank');
  const [initialBalanceStr, setInitialBalanceStr] = useState('0');
  const [note, setNote] = useState('');

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setType('Bank');
    setInitialBalanceStr('0');
    setNote('');
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditing(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalanceStr(String(acc.initialBalance));
    setNote(acc.note || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = name.trim();
    const initialBalance = Math.round(Number(initialBalanceStr) || 0);

    if (!cleanedName) {
      showToast({ type: 'error', title: 'Nama akun wajib diisi' });
      return;
    }

    if (editing) {
      updateAccount({
        ...editing,
        name: cleanedName,
        type,
        initialBalance,
        note: note.trim(),
      });
      showToast({ type: 'success', title: 'Akun berhasil diperbarui' });
    } else {
      if (accountsWithBalance.some((a) => a.name.toLowerCase() === cleanedName.toLowerCase())) {
        showToast({ type: 'error', title: 'Nama akun sudah ada' });
        return;
      }
      addAccount({
        name: cleanedName,
        type,
        initialBalance,
        note: note.trim(),
      });
      showToast({ type: 'success', title: 'Akun baru ditambahkan' });
    }
    setModalOpen(false);
  };

  const handleDelete = async (acc: Account) => {
    const ok = await confirmAction({
      title: 'Hapus akun?',
      message: `Akun "${acc.name}" akan dihapus dari daftar akun. Catatan transaksi historis tetap tersimpan.`,
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (ok) {
      deleteAccount(acc.id);
      if (selectedAccountName === acc.name) setSelectedAccountName(null);
      showToast({ type: 'success', title: 'Akun berhasil dihapus' });
    }
  };

  const accountTransactions = selectedAccountName
    ? [...transactionsWithBalance]
        .filter((t) => {
          if (selectedPeriod !== 'all') {
            const pk = resolveTransactionPeriodKey(t);
            if (pk && pk > selectedPeriod) return false;
          }
          const sel = selectedAccountName.toLowerCase();
          const txAcc = (t.akun || '').toLowerCase();
          if (txAcc === sel) return true;
          if (sel === 'cash' && isSavingsTransaction(t) && !t.transferId && txAcc === 'seabank' && t.keluar > 0) {
            const hasCashRowSameDay = transactionsWithBalance.some(
              (other) =>
                other.id !== t.id &&
                other.tanggal === t.tanggal &&
                other.akun.toLowerCase() === 'cash' &&
                isSavingsTransaction(other)
            );
            return !hasCashRowSameDay;
          }
          if (sel === 'seabank' && isSavingsTransaction(t) && !t.transferId && txAcc === 'cash' && t.keluar > 0) {
            const hasSeaBankRowSameDay = transactionsWithBalance.some(
              (other) =>
                other.id !== t.id &&
                other.tanggal === t.tanggal &&
                other.akun.toLowerCase().replace(/\s+/g, '') === 'seabank' &&
                isSavingsTransaction(other)
            );
            return !hasSeaBankRowSameDay;
          }
          return false;
        })
        .reverse()
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Akun Keuangan
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Saldo kumulatif carry-over ({getMonthLabel(selectedPeriod)}): Saldo Awal + Pemasukan Akun - Pengeluaran Akun
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 min-h-[42px]">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              aria-label="Filter Periode Akun"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none py-1.5"
            >
              {availablePeriods.map((p) => (
                <option key={p.value} value={p.value} className="bg-white dark:bg-slate-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Summary Strip: Cash, Saldo Digital, Sisa Kas Likuid, Tabungan SeaBank, Total Semua Akun */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Uang Tunai</span>
          <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(cashBalance)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Saldo Digital (ShopeePay)</span>
          <p className="font-mono-num text-lg font-bold text-teal-700 dark:text-teal-400 mt-1">
            {formatMoney(digitalBalance)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Sisa Saldo (Kas Likuid)</span>
          <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(liquidBalance)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Tabungan (SeaBank)</span>
          <p className="font-mono-num text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {formatMoney(seaBankBalance)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Semua Akun</span>
          <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(totalAccountBalance)}
          </p>
        </div>
      </div>

      {/* Account Cards */}
      {accountsWithBalance.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Belum ada akun terdaftar.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Import Data Excel/CSV atau tambahkan akun baru untuk melihat saldo Cash, ShopeePay, dan SeaBank.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsWithBalance.map((acc) => {
          const Icon =
            acc.type === 'Cash' ? Wallet : acc.type === 'Bank' ? CreditCard : Smartphone;
          const isSelected = selectedAccountName === acc.name;

          return (
            <div
              key={acc.id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 transition-colors ${
                isSelected
                  ? 'border-teal-600 ring-1 ring-teal-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {acc.type} · {acc.transactionCount} transaksi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(acc)}
                    aria-label={`Edit akun ${acc.name}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(acc)}
                    aria-label={`Hapus akun ${acc.name}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Saat Ini</p>
                <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatMoney(acc.currentBalance)}
                </p>
                <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                  Awal {formatMoney(acc.initialBalance)} · Masuk {formatMoney(acc.totalIn)} · Keluar{' '}
                  {formatMoney(acc.totalOut)}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAccountName(isSelected ? null : acc.name)
                }
                className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isSelected ? 'Tutup Riwayat Akun' : 'Lihat Transaksi Akun'}
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Selected Account Transactions */}
      {selectedAccountName && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Transaksi Akun: {selectedAccountName}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedAccountName(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Tutup
            </button>
          </div>

          {accountTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Belum ada transaksi yang tercatat pada akun {selectedAccountName}.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accountTransactions.map((tx) => {
                const isSeaBankOutFromCash =
                  selectedAccountName?.toLowerCase() === 'cash' &&
                  isSavingsTransaction(tx) &&
                  tx.akun.toLowerCase() === 'seabank';
                const isSeaBankIn =
                  selectedAccountName?.toLowerCase() === 'seabank' &&
                  isSavingsTransaction(tx) &&
                  (tx.masuk > 0 || !tx.transferId);
                const amount = isSeaBankIn
                  ? tx.keluar > 0
                    ? tx.keluar
                    : tx.masuk
                  : isSeaBankOutFromCash
                    ? tx.keluar > 0
                      ? tx.keluar
                      : tx.masuk
                    : tx.masuk > 0
                      ? tx.masuk
                      : tx.keluar;
                const isPositive = isSeaBankIn || (!isSeaBankOutFromCash && tx.masuk > 0);

                return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {tx.keterangan}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateShort(tx.tanggal)} · {tx.kategori} · {tx.metode}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num text-sm font-semibold shrink-0 ${
                      isPositive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isPositive ? `+${formatMoney(amount)}` : `-${formatMoney(amount)}`}
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Account Form Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editing ? 'Edit Akun' : 'Tambah Akun Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Nama Akun
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Cash, BCA, Mandiri, DANA, OVO"
                  required
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Jenis Akun
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="E-Wallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={initialBalanceStr}
                  onChange={(e) => setInitialBalanceStr(e.target.value)}
                  className="font-mono-num w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Keterangan singkat akun"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
