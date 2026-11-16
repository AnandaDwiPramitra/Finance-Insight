import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import {
  buildImportSummary,
  ParsedImportResult,
  parseImportFile,
} from '../services/importService';
import { ImportSummary } from '../types/finance';
import { formatDateShort, formatMoney } from '../utils/formatMoney';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, bulkImportTransactions } = useFinance();
  const { showToast } = useToast();

  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedImportResult | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [completedSummary, setCompletedSummary] = useState<ImportSummary | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFileName('');
    setParseError('');
    setParsedResult(null);
    setReplaceExisting(true);
    setCompletedSummary(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError('');
    setCompletedSummary(null);
    setFileName(file.name);

    const result = await parseImportFile(file, transactions);
    setParsing(false);

    if (result.error) {
      setParseError(result.error);
      setParsedResult(null);
      showToast({ type: 'error', title: 'Import gagal', description: result.error });
    } else {
      setParsedResult(result);
    }

    // Reset input value agar user bisa memilih ulang file yang sama jika diperlukan
    e.target.value = '';
  };

  const previewRows = parsedResult?.rows || [];
  const validCandidates = previewRows.filter((r) => r.status !== 'Invalid');
  const existingDuplicateRows = validCandidates.filter((r) => r.isDuplicate);
  const readyRows =
    transactions.length > 0 && !replaceExisting
      ? validCandidates.filter((r) => !r.isDuplicate)
      : validCandidates;
  const skippedDuplicateCount =
    transactions.length > 0 && !replaceExisting ? existingDuplicateRows.length : 0;
  const invalidCount = previewRows.filter((r) => r.status === 'Invalid').length;

  const liveSummary =
    parsedResult && readyRows.length > 0
      ? buildImportSummary({
          parsed: parsedResult,
          importedRows: readyRows,
          skippedDuplicateCount,
        })
      : null;

  const handleConfirmImport = () => {
    if (!parsedResult || readyRows.length === 0) {
      showToast({
        type: 'warning',
        title: 'Tidak ada baris baru yang valid untuk diimport',
        description:
          skippedDuplicateCount > 0
            ? `${skippedDuplicateCount} baris duplikat dilewati otomatis.`
            : undefined,
      });
      return;
    }

    const summary = buildImportSummary({
      parsed: parsedResult,
      importedRows: readyRows,
      skippedDuplicateCount,
    });

    const importedCount = bulkImportTransactions(
      readyRows.map((r) => ({
        tanggal: r.tanggal,
        tipe: r.tipe,
        kategori: r.kategori,
        metode: r.metode,
        akun: r.akun,
        masuk: r.masuk,
        keluar: r.keluar,
        keterangan: r.keterangan,
        jenisPengeluaran: r.jenisPengeluaran,
        bulan: r.bulan,
        importedSaldo: r.importedSaldo,
        transferId: r.transferId,
      })),
      {
        replaceExisting: transactions.length > 0 ? replaceExisting : true,
        summary,
      }
    );

    setCompletedSummary(summary);
    showToast({
      type: 'success',
      title: 'Import berhasil',
      description: `${importedCount} transaksi dari ${parsedResult.fileName} berhasil diimport.${
        skippedDuplicateCount > 0 ? ` (${skippedDuplicateCount} duplikat dilewati)` : ''
      }`,
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-5xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Import Data
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup import modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {completedSummary ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <h3 className="font-display text-base font-bold">
                    Import Data Selesai
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">File / Format</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {completedSummary.fileName} ({completedSummary.fileType})
                    </span>
                  </div>
                  {completedSummary.sheetName && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Sheet Digunakan</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {completedSummary.sheetName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Baris Excel Dibaca</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {completedSummary.totalRowsRead} baris
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Transaksi Diimport</span>
                    <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                      {completedSummary.importedCount} transaksi
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Baris Gagal</span>
                    <span className="font-mono-num font-semibold text-rose-700 dark:text-rose-400">
                      {completedSummary.failedCount} baris
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Rentang Tanggal</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {formatDateShort(completedSummary.earliestDate)} –{' '}
                      {formatDateShort(completedSummary.latestDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Uang Tunai</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {formatMoney(completedSummary.cashBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Saldo ShopeePay</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {formatMoney(completedSummary.shopeePayBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Saldo SeaBank</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {formatMoney(completedSummary.seaBankBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Total Tabungan</span>
                    <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(completedSummary.totalSavings)}
                    </span>
                  </div>
                  {completedSummary.skippedDuplicateCount > 0 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Duplikat Dilewati</span>
                      <span className="font-mono-num font-semibold text-amber-700 dark:text-amber-400">
                        {completedSummary.skippedDuplicateCount} baris
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Jumlah Transaksi per Bulan
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-200">
                    {completedSummary.perMonthCounts.map((m) => (
                      <span key={m.periodKey}>
                        {m.periodLabel}: <strong className="font-mono-num">{m.count}</strong> transaksi
                      </span>
                    ))}
                  </div>
                </div>

                {completedSummary.validation && (
                  <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Validasi Konsistensi Data ({completedSummary.validation.passedCount}/
                      {completedSummary.validation.totalCount} lolos)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {completedSummary.validation.checks.map((chk) => (
                        <div key={chk.id} className="flex items-start gap-1.5">
                          <span
                            className={`font-bold shrink-0 ${
                              chk.passed
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {chk.passed ? '✓' : '!'}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            <strong>{chk.label}:</strong> {chk.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {completedSummary.failedReasons.length > 0 && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                    <span className="font-semibold block mb-1">Alasan Baris Gagal:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {completedSummary.failedReasons.map((f, idx) => (
                        <li key={idx}>
                          Baris {f.rowNumber}: {f.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-6 text-center cursor-pointer hover:border-teal-600 transition-colors">
                <Upload className="h-7 w-7 text-teal-700 dark:text-teal-400 mb-2" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {fileName
                    ? `File dipilih: ${fileName}`
                    : 'Pilih file .xlsx, .xls, atau .csv'}
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Untuk XLSX/XLS, sheet &quot;Data Keuangan&quot; dibaca otomatis beserta kolom Metode Pembayaran dan Akun secara terpisah tanpa memotong baris atau periode tanggal.
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>

              {parsing && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-600 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                  <span>Membaca seluruh sheet dan memvalidasi data transaksi...</span>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedResult && previewRows.length > 0 && (
                <div className="space-y-4">
                  {/* Validation & Month Breakdown Summary */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-300">
                        {parsedResult.sheetName && (
                          <>
                            <span className="font-semibold text-teal-700 dark:text-teal-400">
                              Sheet: {parsedResult.sheetName}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-semibold">
                          {parsedResult.totalRowsRead} baris dibaca
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {readyRows.length} siap diimport
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-700 dark:text-rose-400 font-medium">
                          {invalidCount} gagal
                        </span>
                      </div>

                      {liveSummary && (
                        <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                          {formatDateShort(liveSummary.earliestDate)} –{' '}
                          {formatDateShort(liveSummary.latestDate)}
                        </span>
                      )}
                    </div>

                    {liveSummary && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {liveSummary.perMonthCounts.map((m) => (
                          <span key={m.periodKey}>
                            {m.periodLabel}: <strong className="font-mono-num">{m.count}</strong>
                          </span>
                        ))}
                        <span aria-hidden="true">·</span>
                        <span>
                          Uang Tunai:{' '}
                          <strong className="font-mono-num text-slate-900 dark:text-white">
                            {formatMoney(liveSummary.cashBalance)}
                          </strong>
                        </span>
                        <span>
                          Saldo ShopeePay:{' '}
                          <strong className="font-mono-num text-slate-900 dark:text-white">
                            {formatMoney(liveSummary.shopeePayBalance)}
                          </strong>
                        </span>
                        <span>
                          Saldo SeaBank:{' '}
                          <strong className="font-mono-num text-slate-900 dark:text-white">
                            {formatMoney(liveSummary.seaBankBalance)}
                          </strong>
                        </span>
                        <span>
                          Total Tabungan:{' '}
                          <strong className="font-mono-num text-emerald-700 dark:text-emerald-400">
                            {formatMoney(liveSummary.totalSavings)}
                          </strong>
                        </span>
                      </div>
                    )}

                    {transactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                          <input
                            type="radio"
                            name="importMode"
                            checked={replaceExisting}
                            onChange={() => setReplaceExisting(true)}
                            className="text-teal-700 focus:ring-teal-600"
                          />
                          <span>Ganti data saat ini dengan hasil import</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="importMode"
                            checked={!replaceExisting}
                            onChange={() => setReplaceExisting(false)}
                            className="text-teal-700 focus:ring-teal-600"
                          />
                          <span>Gabungkan dengan transaksi yang ada (duplikat dilewati otomatis)</span>
                        </label>
                      </div>
                    )}

                    {existingDuplicateRows.length > 0 && (
                      <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                        Terdeteksi <strong>{existingDuplicateRows.length}</strong> transaksi yang sama dengan data tersimpan.{' '}
                        {!replaceExisting
                          ? 'Baris duplikat dilewati otomatis saat mode Gabungkan.'
                          : 'Pada mode Ganti Data, seluruh data lama diganti bersih oleh file ini.'}
                      </div>
                    )}

                    {liveSummary?.validation && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Pra-Validasi ({liveSummary.validation.passedCount}/{liveSummary.validation.totalCount} pemeriksaan lolos)
                        </span>
                        {!liveSummary.validation.allPassed && (
                          <ul className="list-disc pl-4 space-y-0.5 text-amber-700 dark:text-amber-400">
                            {liveSummary.validation.checks
                              .filter((c) => !c.passed)
                              .map((c) => (
                                <li key={c.id}>
                                  {c.label}: {c.detail}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {parsedResult.failedRows.length > 0 && (
                      <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                        <span className="font-semibold block mb-1">
                          {parsedResult.failedRows.length} baris gagal dibaca:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                          {parsedResult.failedRows.map((f, idx) => (
                            <li key={idx}>
                              Baris {f.rowNumber}: {f.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[340px]">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">Baris</th>
                          <th className="py-2.5 px-3 font-medium">Tanggal</th>
                          <th className="py-2.5 px-3 font-medium">Bulan</th>
                          <th className="py-2.5 px-3 font-medium">Keterangan</th>
                          <th className="py-2.5 px-3 font-medium">Kategori</th>
                          <th className="py-2.5 px-3 font-medium">Jenis</th>
                          <th className="py-2.5 px-3 font-medium">Metode</th>
                          <th className="py-2.5 px-3 font-medium">Akun</th>
                          <th className="py-2.5 px-3 font-medium text-right">Pemasukan</th>
                          <th className="py-2.5 px-3 font-medium text-right">Pengeluaran</th>
                          <th className="py-2.5 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewRows.map((row) => {
                          const statusColor =
                            row.status === 'Valid'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : row.status === 'Warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-rose-700 dark:text-rose-400';

                          return (
                            <tr
                              key={row.rowNumber}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2 px-3 font-mono-num text-slate-500">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-mono-num whitespace-nowrap">
                                {row.tanggal}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {row.bulan || '-'}
                              </td>
                              <td className="py-2 px-3 max-w-[180px] truncate">
                                {row.keterangan}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">{row.kategori}</td>
                              <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {row.jenisPengeluaran}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">{row.metode}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                                {row.akun}
                              </td>
                              <td className="py-2 px-3 font-mono-num text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                                {formatMoney(row.masuk)}
                              </td>
                              <td className="py-2 px-3 font-mono-num text-right whitespace-nowrap text-rose-700 dark:text-rose-400">
                                {formatMoney(row.keluar)}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className={`font-semibold ${statusColor}`}>
                                  {row.status}
                                </span>
                                {row.issues.length > 0 && (
                                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                    {row.issues.join(' · ')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          {completedSummary ? (
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[42px] rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Selesai & Lihat Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={readyRows.length === 0 || parsing}
                onClick={handleConfirmImport}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Konfirmasi Import ({readyRows.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
