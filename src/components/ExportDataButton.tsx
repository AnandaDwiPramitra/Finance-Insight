import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { exportTransactionsToCsv, exportTransactionsToExcel } from '../services/importService';
import { Transaction } from '../types/finance';

interface ExportDataButtonProps {
  transactions: Transaction[];
  filePrefix?: string;
}

export const ExportDataButton: React.FC<ExportDataButtonProps> = ({
  transactions,
  filePrefix = 'finance-insight',
}) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExportXlsx = () => {
    setOpen(false);
    exportTransactionsToExcel(transactions, `${filePrefix}.xlsx`);
    showToast({
      type: 'success',
      title: 'Export XLSX berhasil',
      description: `${transactions.length} transaksi diekspor ke format Excel (.xlsx).`,
    });
  };

  const handleExportCsv = () => {
    setOpen(false);
    exportTransactionsToCsv(transactions, `${filePrefix}.csv`);
    showToast({
      type: 'success',
      title: 'Export CSV berhasil',
      description: `${transactions.length} transaksi diekspor ke format CSV.`,
    });
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" />
        <span>Export Data</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleExportXlsx}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Export XLSX</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleExportCsv}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      )}
    </div>
  );
};
