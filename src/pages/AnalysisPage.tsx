import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Filter,
  Info,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { AiResultCard } from '../components/AiModal';
import { useFinance } from '../context/FinanceContext';
import { AiAnalysisResult } from '../types/finance';
import { formatMoney, getMonthLabel } from '../utils/formatMoney';

interface AnalysisPageProps {
  onOpenAiModal: () => void;
  latestAiAnalysis: AiAnalysisResult | null;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  onOpenAiModal,
  latestAiAnalysis,
}) => {
  const {
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    kpi,
    liquidBalance,
    seaBankBalance,
    categoryExpenseData,
    paymentMethodData,
    insights,
    periodComparison,
    optimization,
    prediction,
    healthScore,
  } = useFinance();

  const topCat = categoryExpenseData[0];
  const topMethod = paymentMethodData[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Business Intelligence Overview
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kerangka analitik Descriptive, Diagnostic, Predictive, dan Prescriptive dari data aktual Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 min-h-[42px]">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              aria-label="Filter periode analisis"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none py-1.5"
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
            onClick={onOpenAiModal}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
          >
            <Bot className="h-4 w-4" />
            <span>Tanya AI</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars of Business Intelligence */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <BarChart3 className="h-4 w-4" />
            <h3 className="font-display text-sm font-bold">01. Descriptive Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ringkasan kondisi aktual pada periode {getMonthLabel(selectedPeriod)}.
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            Tercatat <strong className="font-mono-num">{kpi.transactionCount}</strong> transaksi dengan pemasukan{' '}
            <strong className="font-mono-num">{formatMoney(kpi.totalIncome)}</strong>, pengeluaran{' '}
            <strong className="font-mono-num">{formatMoney(kpi.totalExpense)}</strong>, sisa kas likuid{' '}
            <strong className="font-mono-num">{formatMoney(liquidBalance)}</strong>, dan tabungan SeaBank{' '}
            <strong className="font-mono-num">{formatMoney(seaBankBalance)}</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <Info className="h-4 w-4" />
            <h3 className="font-display text-sm font-bold">02. Diagnostic Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identifikasi pendorong utama pengeluaran, struktur kebutuhan/keinginan, dan metode bayar.
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {topCat
              ? `Pos pengeluaran terbesar adalah ${topCat.kategori} (${formatMoney(topCat.total)}). `
              : 'Belum ada pengeluaran tercatat. '}
            Proporsi Kebutuhan {kpi.needsPercentage}% vs Keinginan {kpi.wantsPercentage}%
            {kpi.reviewExpense > 0 ? ` · Perlu Ditinjau ${kpi.reviewPercentage}%` : ''}
            {topMethod ? `, didominasi metode ${topMethod.name}.` : '.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <TrendingUp className="h-4 w-4" />
            <h3 className="font-display text-sm font-bold">03. Predictive Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estimasi periode berikutnya dengan Moving Average 3 Bulan.
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {prediction.available
              ? `Proyeksi bulan berikutnya: Pemasukan ${formatMoney(prediction.predictedIncome)}, Pengeluaran ${formatMoney(prediction.predictedExpense)}, dan Saldo ${formatMoney(prediction.predictedBalance)}.`
              : `Prediksi belum tersedia (${prediction.monthsCount}/3 periode data historis). Dibutuhkan minimal 3 periode data historis.`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <SlidersHorizontal className="h-4 w-4" />
            <h3 className="font-display text-sm font-bold">04. Prescriptive Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rekomendasi batas belanja untuk mencapai target tabungan.
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {optimization.isOverLimit
              ? `Pengeluaran melewati batas rekomendasi sebesar ${formatMoney(optimization.overLimitAmount)}. Fokus hentikan belanja non-esensial.`
              : `Sisa batas belanja aman ${formatMoney(optimization.remainingSpendingLimit)} atau maksimal ${formatMoney(optimization.dailySpendingLimit)} per hari untuk ${optimization.remainingDays} hari tersisa.`}
          </p>
        </div>
      </section>

      {/* Period Over Period Comparison */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Perbandingan Antar Periode
        </h3>
        {periodComparison.hasPrevious ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perubahan Pengeluaran ({periodComparison.previousLabel} ke {periodComparison.currentLabel})
              </p>
              <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white mt-1">
                {periodComparison.expenseChangePct !== null
                  ? periodComparison.expenseChangePct > 0
                    ? `Naik ${periodComparison.expenseChangePct}%`
                    : periodComparison.expenseChangePct < 0
                      ? `Turun ${Math.abs(periodComparison.expenseChangePct)}%`
                      : 'Tetap 0%'
                  : 'Tidak dapat dibandingkan (periode sebelumnya 0)'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perubahan Pemasukan ({periodComparison.previousLabel} ke {periodComparison.currentLabel})
              </p>
              <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white mt-1">
                {periodComparison.incomeChangePct !== null
                  ? periodComparison.incomeChangePct > 0
                    ? `Naik ${periodComparison.incomeChangePct}%`
                    : periodComparison.incomeChangePct < 0
                      ? `Turun ${Math.abs(periodComparison.incomeChangePct)}%`
                      : 'Tetap 0%'
                  : 'Tidak dapat dibandingkan (periode sebelumnya 0)'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Periode pembanding sebelumnya belum memiliki data transaksi sehingga persentase perubahan tidak ditampilkan.
          </p>
        )}
      </section>

      {/* Adaptive Rule-Based Insights */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Insight Dinamis (Rule-Based Engine)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => {
            const Icon =
              ins.type === 'success'
                ? CheckCircle2
                : ins.type === 'warning' || ins.type === 'danger'
                  ? AlertTriangle
                  : Info;
            const iconClass =
              ins.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : ins.type === 'danger'
                  ? 'text-rose-600 dark:text-rose-400'
                  : ins.type === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-teal-700 dark:text-teal-400';

            return (
              <div
                key={ins.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3"
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconClass}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {ins.category}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {ins.title}
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ins.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Financial Health Score Breakdown */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Rincian Financial Health Score ({healthScore.score}/100 · {healthScore.label})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {healthScore.factors.map((f) => (
            <div key={f.label} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{f.detail}</p>
              </div>
              <span className="font-mono-num text-sm font-bold text-teal-700 dark:text-teal-400 shrink-0">
                {f.score} / {f.maxScore}
              </span>
            </div>
          ))}
        </div>
      </section>

      {latestAiAnalysis && <AiResultCard analysis={latestAiAnalysis} />}
    </div>
  );
};
