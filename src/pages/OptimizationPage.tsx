import React, { useState } from 'react';
import { Filter, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../utils/formatMoney';
import { computeOptimization } from '../utils/optimization';

export const OptimizationPage: React.FC = () => {
  const {
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    filteredTransactions,
    activeSavingsTarget,
  } = useFinance();

  const [customTarget, setCustomTarget] = useState<string>('');
  const effectiveTarget =
    customTarget.trim() !== ''
      ? Math.max(0, Math.round(Number(customTarget) || 0))
      : activeSavingsTarget || 300000;

  const opt = computeOptimization({
    transactions: filteredTransactions,
    selectedPeriod,
    savingsTarget: effectiveTarget,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Optimasi Keuangan
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Simulasi dan batas pengeluaran preskriptif untuk memastikan target tabungan tercapai
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 min-h-[42px] self-start sm:self-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            aria-label="Filter periode optimasi"
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
      </div>

      {/* Warning Banner if Over Limit */}
      {opt.isOverLimit && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-5 flex items-start gap-3 text-rose-800 dark:text-rose-300"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Pengeluaran telah melewati batas rekomendasi.</p>
            <p className="mt-1 text-xs sm:text-sm">
              Total pengeluaran aktual ({formatMoney(opt.actualExpense)}) melebihi batas pengeluaran maksimal ({formatMoney(opt.availableForSpending)}) sebesar {formatMoney(opt.overLimitAmount)}.
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pemasukan Periode</p>
          <p className="font-mono-num text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {formatMoney(opt.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Target Tabungan</p>
          <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(opt.savingsTarget)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Batas Pengeluaran Maksimal</p>
          <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(opt.availableForSpending)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Batas Pengeluaran Tersisa</p>
          <p
            className={`font-mono-num text-xl font-bold mt-1 ${
              opt.isOverLimit
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-teal-700 dark:text-teal-400'
            }`}
          >
            {formatMoney(Math.max(0, opt.remainingSpendingLimit))}
          </p>
        </div>
      </div>

      {/* Interactive Simulation + Daily Limit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Simulasi Target Tabungan
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ubah nominal target tabungan untuk melihat batas belanja harian yang dibutuhkan pada periode {opt.periodLabel}.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Simulasi Target Tabungan (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={customTarget !== '' ? customTarget : String(effectiveTarget)}
              onChange={(e) => setCustomTarget(e.target.value)}
              className="font-mono-num w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Pengeluaran Aktual</span>
              <span className="font-mono-num font-semibold text-rose-700 dark:text-rose-400">
                {formatMoney(opt.actualExpense)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Rata-rata Harian Aktual</span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(opt.averageDailyExpense)}/hari
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Batas Harian ({opt.remainingDays} hari tersisa)
              </span>
              <span className="font-mono-num font-bold text-teal-700 dark:text-teal-400">
                {formatMoney(opt.dailySpendingLimit)}/hari
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Rekomendasi Optimasi Adaptif
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {opt.recommendations.map((rec, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        rec.priority === 'Tinggi'
                          ? 'text-rose-700 dark:text-rose-400'
                          : rec.priority === 'Sedang'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-teal-700 dark:text-teal-400'
                      }`}
                    >
                      Prioritas {rec.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rec.detail}
                  </p>
                </div>
                {rec.potentialSaving > 0 && (
                  <div className="shrink-0 sm:text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Potensi Hemat
                    </span>
                    <span className="font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(rec.potentialSaving)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
