import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Banknote,
  Bot,
  CreditCard,
  Filter,
  ListOrdered,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import { AiResultCard } from '../components/AiModal';
import { DashboardCharts } from '../components/DashboardCharts';
import { ExportDataButton } from '../components/ExportDataButton';
import { ImportModal } from '../components/ImportModal';
import { KpiCard } from '../components/KpiCard';
import { TransactionFormModal } from '../components/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { AiAnalysisResult } from '../types/finance';
import { formatDateShort, formatMoney, getMonthLabel } from '../utils/formatMoney';

interface DashboardPageProps {
  onOpenAiModal: () => void;
  latestAiAnalysis: AiAnalysisResult | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAiModal,
  latestAiAnalysis,
}) => {
  const {
    transactions,
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    kpi,
    cashBalance,
    seaBankBalance,
    digitalBalance,
    liquidBalance,
    activeSavingsTarget,
    activeSavingsCollected,
    activeSavingsPercentage,
    filteredTransactions,
    filteredTransactionsWithBalance,
    insights,
    optimization,
    prediction,
    healthScore,
    validationReport,
    lastImportSummary,
    resetAllData,
  } = useFinance();
  const { showToast, confirmAction } = useToast();
  const navigate = useNavigate();

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const recentTransactions = [...filteredTransactionsWithBalance].reverse().slice(0, 6);

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
      {/* Toolbar: Brand Title, Period Filter & Primary Actions */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ringkasan Keuangan & Business Intelligence
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Periode aktif: {getMonthLabel(selectedPeriod)} · {kpi.transactionCount} transaksi tercatat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 min-h-[42px]">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              aria-label="Filter Periode"
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
            onClick={() => setTxModalOpen(true)}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>

          <ExportDataButton
            transactions={filteredTransactions}
            filePrefix={`finance-insight-${selectedPeriod}`}
          />

          <button
            type="button"
            onClick={handleResetAllData}
            disabled={transactions.length === 0}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 px-3.5 py-2 text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset Data</span>
          </button>
        </div>
      </section>

      {/* Latest Import Summary Strip */}
      {lastImportSummary && transactions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex flex-col gap-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-teal-700 dark:text-teal-400">
                Hasil Import Terakhir: {lastImportSummary.fileName}
              </span>
              {lastImportSummary.sheetName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Sheet: {lastImportSummary.sheetName}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {lastImportSummary.totalRowsRead} baris dibaca · {lastImportSummary.importedCount} diimport
                {lastImportSummary.failedCount > 0 ? ` · ${lastImportSummary.failedCount} gagal` : ''}
              </span>
            </div>
            <span className="font-mono-num text-slate-500 dark:text-slate-400">
              {formatDateShort(lastImportSummary.earliestDate)} –{' '}
              {formatDateShort(lastImportSummary.latestDate)}
            </span>
          </div>
          {lastImportSummary.perMonthCounts.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
              {lastImportSummary.perMonthCounts.map((m) => (
                <span key={m.periodKey}>
                  {m.periodLabel}:{' '}
                  <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                    {m.count} transaksi
                  </strong>
                </span>
              ))}
              {typeof lastImportSummary.cashBalance === 'number' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Uang Tunai:{' '}
                    <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                      {formatMoney(lastImportSummary.cashBalance)}
                    </strong>
                  </span>
                  <span>
                    Saldo ShopeePay:{' '}
                    <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                      {formatMoney(lastImportSummary.shopeePayBalance ?? 0)}
                    </strong>
                  </span>
                  <span>
                    Saldo SeaBank:{' '}
                    <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                      {formatMoney(lastImportSummary.seaBankBalance ?? 0)}
                    </strong>
                  </span>
                  <span>
                    Total Tabungan:{' '}
                    <strong className="font-mono-num text-emerald-700 dark:text-emerald-400">
                      {formatMoney(lastImportSummary.totalSavings ?? 0)}
                    </strong>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span
                className={
                  validationReport.allPassed
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-amber-700 dark:text-amber-400'
                }
              >
                Validasi: {validationReport.passedCount}/{validationReport.totalCount} lolos
              </span>
            </div>
          )}
        </section>
      )}

      {/* Empty State Banner if zero transactions */}
      {filteredTransactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Belum ada transaksi.
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Import file XLSX atau CSV atau tambahkan transaksi pertama untuk mulai melihat analisis keuangan.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Upload className="h-4 w-4" />
              <span>Import Data</span>
            </button>
            <button
              type="button"
              onClick={() => setTxModalOpen(true)}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        </div>
      )}

      {/* 8 KPI Grid: 2 cols on mobile, 4 cols on xl */}
      <section aria-label="Indikator Kinerja Keuangan" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Uang Masuk"
          value={formatMoney(kpi.totalIncome)}
          subtitle="Pendapatan nyata periode"
          icon={ArrowUp}
          tone="income"
        />
        <KpiCard
          title="Uang Keluar"
          value={formatMoney(kpi.totalExpense)}
          subtitle="Pengeluaran konsumsi periode"
          icon={ArrowDown}
          tone="expense"
        />
        <KpiCard
          title="Sisa Saldo"
          value={formatMoney(liquidBalance)}
          subtitle="Kas likuid aktif (Cash + ShopeePay)"
          icon={Wallet}
          tone={liquidBalance >= 0 ? 'accent' : 'expense'}
        />
        <KpiCard
          title="Jumlah Transaksi"
          value={`${kpi.transactionCount}`}
          subtitle={getMonthLabel(selectedPeriod)}
          icon={ListOrdered}
          tone="neutral"
        />
        <KpiCard
          title="Uang Tunai"
          value={formatMoney(cashBalance)}
          subtitle="Akun tunai aktif"
          icon={Wallet}
          tone="neutral"
        />
        <KpiCard
          title="Saldo Digital"
          value={formatMoney(digitalBalance)}
          subtitle="Dompet digital aktif (ShopeePay)"
          icon={CreditCard}
          tone="accent"
        />
        <KpiCard
          title="Total Tabungan"
          value={formatMoney(seaBankBalance)}
          subtitle="Akumulasi tabungan kumulatif (SeaBank)"
          icon={Banknote}
          tone="income"
        />
        <KpiCard
          title="Target Tabungan"
          value={formatMoney(activeSavingsTarget)}
          subtitle={`${activeSavingsPercentage}% tercapai`}
          icon={Target}
          tone={activeSavingsPercentage >= 100 ? 'income' : 'warning'}
        />
      </section>

      {/* Financial Health Score + Savings Goal Bar */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Financial Health Score
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dihitung dari saldo, pengendalian belanja, kebutuhan vs keinginan, dan target tabungan
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono-num text-2xl font-bold text-teal-700 dark:text-teal-400">
                {healthScore.score}/100
              </span>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {healthScore.label}
              </span>
            </div>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-700 transition-all duration-300"
              style={{ width: `${healthScore.score}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            {healthScore.factors.slice(0, 4).map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-400"
              >
                <span className="truncate">{f.label}</span>
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-200 shrink-0">
                  {f.score}/{f.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Target Tabungan ({getMonthLabel(selectedPeriod)})
              </h3>
              <p className="mt-0.5 font-mono-num text-sm text-slate-600 dark:text-slate-300">
                {formatMoney(activeSavingsCollected)} / {formatMoney(activeSavingsTarget)}
              </p>
            </div>
            <Link
              to="/savings"
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0"
            >
              Kelola Target
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Progress Pencapaian</span>
              <span className="font-mono-num text-teal-700 dark:text-teal-400">
                {activeSavingsPercentage}% tercapai
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${activeSavingsPercentage}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alokasi tabungan otomatis dihitung dari transaksi kategori{' '}
            <strong className="text-slate-700 dark:text-slate-200">tabungan</strong> pada periode terkait.
          </p>
        </div>
      </section>

      {/* All 6 Recharts Visualizations */}
      <DashboardCharts />

      {/* Adaptive Insights + Optimization + Prediction Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adaptive Insights */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Adaptive Financial Insights
              </h3>
              <Link
                to="/analysis"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Detail BI
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {insights.slice(0, 3).map((ins) => (
                <div key={ins.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {ins.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {ins.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optimization Summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Optimasi Keuangan
                </h3>
              </div>
              <Link
                to="/optimization"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </div>

            {optimization.isOverLimit ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Pengeluaran telah melewati batas rekomendasi sebesar{' '}
                  {formatMoney(optimization.overLimitAmount)}.
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Batas Pengeluaran Tersisa
                </p>
                <p className="font-mono-num text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">
                  {formatMoney(optimization.remainingSpendingLimit)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Batas harian disarankan:{' '}
                  <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                    {formatMoney(optimization.dailySpendingLimit)}
                  </strong>{' '}
                  ({optimization.remainingDays} hari tersisa)
                </p>
              </div>
            )}

            {optimization.recommendations[0] && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                {optimization.recommendations[0].detail}
              </p>
            )}
          </div>
        </div>

        {/* Prediction Summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Prediksi (MA 3 Bulan)
                </h3>
              </div>
              <Link
                to="/prediction"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Detail
              </Link>
            </div>

            {prediction.available ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prediksi Pemasukan</span>
                  <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatMoney(prediction.predictedIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prediksi Pengeluaran</span>
                  <span className="font-mono-num font-semibold text-rose-700 dark:text-rose-400">
                    {formatMoney(prediction.predictedExpense)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Proyeksi Saldo
                  </span>
                  <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                    {formatMoney(prediction.predictedBalance)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {prediction.note}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Prediksi belum tersedia.
                </p>
                <p>
                  Dibutuhkan minimal 3 periode data historis (saat ini: {prediction.monthsCount}{' '}
                  bulan).
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAiModal}
            className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl border border-teal-700/30 bg-teal-50/70 dark:bg-teal-950/40 px-3 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
          >
            <Bot className="h-4 w-4" />
            <span>Tanya AI: Prediksi & Optimasi</span>
          </button>
        </div>
      </section>

      {/* AI Result Card if user ran AI */}
      {latestAiAnalysis && <AiResultCard analysis={latestAiAnalysis} />}

      {/* Recent Transactions */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Transaksi Terbaru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik baris transaksi untuk melihat rincian dan saldo kronologis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            Belum ada transaksi pada periode terpilih.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const isIncome = tx.masuk > 0;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 -mx-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {tx.keterangan}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {formatDateShort(tx.tanggal)} · {tx.kategori} · {tx.metode} · {tx.akun}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono-num text-sm font-semibold ${
                        isIncome
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? `+${formatMoney(tx.masuk)}` : `-${formatMoney(tx.keluar)}`}
                    </p>
                    <p className="font-mono-num text-[11px] text-slate-400 dark:text-slate-500">
                      Saldo {formatMoney(tx.runningBalance)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <TransactionFormModal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} />
      <ImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
};
