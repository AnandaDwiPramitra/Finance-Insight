import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'income' | 'expense' | 'accent' | 'warning';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
}) => {
  const iconTone =
    tone === 'income'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
      : tone === 'expense'
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
        : tone === 'accent'
          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400'
          : tone === 'warning'
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const valueTone =
    tone === 'income'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'expense'
        ? 'text-rose-700 dark:text-rose-400'
        : 'text-slate-900 dark:text-white';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="min-w-0">
        <p className={`font-mono-num text-lg sm:text-xl font-bold tracking-tight truncate ${valueTone}`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
