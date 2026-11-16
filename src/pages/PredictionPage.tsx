import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, CheckCircle2, Info, ShieldAlert, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  computeNiceAxisScale,
  formatDateShort,
  formatMoney,
} from '../utils/formatMoney';

export const PredictionPage: React.FC = () => {
  const { prediction, optimization, kpi } = useFinance();

  const confidenceBadgeClass =
    prediction.confidenceLevel === 'Tinggi'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
      : prediction.confidenceLevel === 'Sedang'
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';

  const historyAxis = computeNiceAxisScale(
    prediction.history.flatMap((m) => [m.income, m.expense])
  );

  const safeRecommendations = optimization.recommendations;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Prediksi Keuangan & Rekomendasi (MA 3 Bulan)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Data Aktual, Prediksi Moving Average, dan Rekomendasi Hemat dipisahkan secara transparan.
          </p>
        </div>

        <span
          className={`inline-flex items-center self-start rounded-xl border px-3 py-1.5 text-xs font-semibold ${confidenceBadgeClass}`}
        >
          Keyakinan Prediksi: {prediction.confidenceLevel}
        </span>
      </div>

      {/* SECTION 1: DATA AKTUAL */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              1. Data Aktual Historis ({prediction.monthsCount} Periode · {prediction.fullMonthsCount} Bulan Penuh)
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Fakta transaksi nyata (non-transfer)
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
            <span className="text-slate-500 dark:text-slate-400 block">Uang Tunai Aktual</span>
            <span className="font-mono-num text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatMoney(prediction.currentAccounts.cash)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
            <span className="text-slate-500 dark:text-slate-400 block">Saldo ShopeePay Aktual</span>
            <span className="font-mono-num text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatMoney(prediction.currentAccounts.shopeePay)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
            <span className="text-slate-500 dark:text-slate-400 block">Saldo SeaBank Aktual</span>
            <span className="font-mono-num text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatMoney(prediction.currentAccounts.seaBank)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
            <span className="text-slate-500 dark:text-slate-400 block">Total Saldo Gabungan</span>
            <span className="font-mono-num text-base font-bold text-teal-700 dark:text-teal-400 mt-0.5 block">
              {formatMoney(prediction.currentAccounts.total)}
            </span>
          </div>
        </div>

        {prediction.history.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Belum ada data historis transaksi.
          </p>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prediction.history} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis
                    domain={historyAxis.domain}
                    ticks={historyAxis.ticks}
                    tickFormatter={(v) => formatMoney(Number(v))}
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                    width={92}
                  />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [formatMoney(Number(val)), String(name)]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(148,163,184,0.25)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#16A34A" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#DC2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Periode</th>
                    <th className="py-2.5 px-3 font-semibold">Cakupan Data</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Pemasukan</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Pengeluaran</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Saldo</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Setoran Tabungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {prediction.history.map((m) => (
                    <tr key={m.periodKey}>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {m.periodLabel}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {m.isPartial ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Parsial s.d. {formatDateShort(m.latestDate)} ({m.daysRecorded}/{m.daysInMonth} hr)
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Bulan Penuh
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-emerald-700 dark:text-emerald-400">
                        {formatMoney(m.income)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-rose-700 dark:text-rose-400">
                        {formatMoney(m.expense)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right font-semibold text-slate-900 dark:text-white">
                        {formatMoney(m.balance)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-teal-700 dark:text-teal-400">
                        {formatMoney(m.savings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* SECTION 2: PREDIKSI */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            2. Prediksi Bulan Berikutnya (Moving Average 3 Bulan)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {prediction.note}
          </span>
        </div>

        {!prediction.available ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Prediksi belum tersedia.
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {prediction.confidenceReason}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tambahkan atau import transaksi dari minimal 3 periode bulanan untuk menghitung Moving Average 3 Bulan tanpa angka buatan.
              </p>
            </div>
          </div>
        ) : (
          <>
            {prediction.isLimited && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Keyakinan {prediction.confidenceLevel} ({prediction.fullMonthsCount}/3 Bulan Penuh)
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">{prediction.confidenceReason}</p>
                </div>
              </div>
            )}

            {prediction.negativeBalanceReason && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Peringatan Proyeksi Saldo Negatif</p>
                  <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
                    {prediction.negativeBalanceReason}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Prediksi Pemasukan</p>
                <p className="font-mono-num text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatMoney(prediction.predictedIncome)}
                </p>
                <p className="mt-1.5 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  Rentang: {formatMoney(prediction.incomeRange.min)} – {formatMoney(prediction.incomeRange.max)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Prediksi Pengeluaran</p>
                <p className="font-mono-num text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                  {formatMoney(prediction.predictedExpense)}
                </p>
                <p className="mt-1.5 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  Rentang: {formatMoney(prediction.expenseRange.min)} – {formatMoney(prediction.expenseRange.max)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Prediksi Saldo Bulanan</p>
                <p
                  className={`font-mono-num text-xl font-bold mt-1 ${
                    prediction.predictedBalance >= 0
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {formatMoney(prediction.predictedBalance)}
                </p>
                <p className="mt-1.5 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  Rentang: {formatMoney(prediction.balanceRange.min)} – {formatMoney(prediction.balanceRange.max)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Estimasi Tabungan (Bulan Penuh)</p>
                <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatMoney(prediction.estimatedSavings)}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Dari realisasi tabungan bulan penuh
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Asumsi & Dasar Perhitungan Prediksi
                </h4>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {prediction.assumptions.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      {/* SECTION 3: REKOMENDASI */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              3. Rekomendasi Pengelolaan (Mode Berhemat)
            </h3>
          </div>
          {kpi.wantsExpense === 0 && (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Tanpa alokasi Keinginan — fokus kebutuhan & tabungan
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {safeRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {rec.title}
                </p>
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 shrink-0">
                  Prioritas {rec.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {rec.detail}
              </p>
              {rec.potentialSaving > 0 && (
                <p className="font-mono-num text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Potensi penghematan: {formatMoney(rec.potentialSaving)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
