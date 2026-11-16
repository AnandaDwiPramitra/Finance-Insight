import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TrendDataPoint } from '../utils/calculations';
import { computeNiceAxisScale, formatMoney } from '../utils/formatMoney';
import { ChartCard } from './ChartCard';

const PAYMENT_COLORS = ['#0F766E', '#0284C7', '#D97706', '#6366F1', '#64748B', '#059669'];
const NEEDS_WANTS_COLORS = ['#0F766E', '#D97706', '#64748B'];

function formatPercentId(pct: number): string {
  return `${pct.toFixed(1).replace('.', ',')}%`;
}

interface TimelineRangeSliderProps {
  data: TrendDataPoint[];
  startIndex: number;
  endIndex: number;
  onChangeRange: (nextStart: number, nextEnd: number) => void;
  onReset: () => void;
}

const TimelineRangeSlider: React.FC<TimelineRangeSliderProps> = ({
  data,
  startIndex,
  endIndex,
  onChangeRange,
  onReset,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragModeRef = useRef<{
    type: 'left' | 'right' | 'window';
    anchorIdx: number;
    origStart: number;
    origEnd: number;
  } | null>(null);

  const maxIdx = Math.max(0, data.length - 1);
  const safeStart = Math.max(0, Math.min(startIndex, maxIdx));
  const safeEnd = Math.max(safeStart, Math.min(endIndex, maxIdx));

  const clientXToIndex = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || maxIdx <= 0) return 0;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * maxIdx);
    },
    [maxIdx]
  );

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: 'left' | 'right' | 'window'
  ) => {
    if (data.length <= 2) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragModeRef.current = {
      type,
      anchorIdx: clientXToIndex(e.clientX),
      origStart: safeStart,
      origEnd: safeEnd,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    if (!mode || data.length <= 2) return;
    const currentIdx = clientXToIndex(e.clientX);
    const minSpan = Math.min(2, data.length);

    if (mode.type === 'left') {
      const clampedStart = Math.max(0, Math.min(currentIdx, mode.origEnd - (minSpan - 1)));
      onChangeRange(clampedStart, mode.origEnd);
    } else if (mode.type === 'right') {
      const clampedEnd = Math.min(maxIdx, Math.max(currentIdx, mode.origStart + (minSpan - 1)));
      onChangeRange(mode.origStart, clampedEnd);
    } else {
      const delta = currentIdx - mode.anchorIdx;
      const span = mode.origEnd - mode.origStart;
      let nextStart = mode.origStart + delta;
      if (nextStart < 0) nextStart = 0;
      if (nextStart + span > maxIdx) nextStart = Math.max(0, maxIdx - span);
      onChangeRange(nextStart, nextStart + span);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragModeRef.current) {
      dragModeRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const miniPaths = useMemo(() => {
    if (data.length < 2) return { cashPath: '', shopeePath: '' };
    const values = data.flatMap((d) => [d.uangTunai, d.shopeePay]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const w = 100;
    const h = 24;

    const toPath = (getter: (d: TrendDataPoint) => number) =>
      data
        .map((d, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - 2 - ((getter(d) - minVal) / range) * (h - 4);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');

    return {
      cashPath: toPath((d) => d.uangTunai),
      shopeePath: toPath((d) => d.shopeePay),
    };
  }, [data]);

  if (data.length <= 1) return null;

  const leftPct = maxIdx > 0 ? (safeStart / maxIdx) * 100 : 0;
  const rightPct = maxIdx > 0 ? (safeEnd / maxIdx) * 100 : 100;
  const widthPct = Math.max(2, rightPct - leftPct);

  return (
    <div className="mt-2 select-none">
      <div
        ref={trackRef}
        onDoubleClick={onReset}
        title="Seret pegangan kiri/kanan untuk zoom tanggal, atau klik ganda untuk Reset Zoom"
        className="relative h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 overflow-hidden"
      >
        <svg
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none opacity-65"
        >
          {miniPaths.cashPath && (
            <path d={miniPaths.cashPath} fill="none" stroke="#0F766E" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          )}
          {miniPaths.shopeePath && (
            <path d={miniPaths.shopeePath} fill="none" stroke="#0284C7" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <div
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'window')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute top-0 bottom-0 bg-teal-600/15 dark:bg-teal-400/20 border-x-2 border-teal-700 dark:border-teal-400 cursor-grab active:cursor-grabbing"
        >
          <div
            role="slider"
            aria-label="Batas awal rentang tanggal"
            aria-valuemin={0}
            aria-valuemax={maxIdx}
            aria-valuenow={safeStart}
            onPointerDown={(e) => handlePointerDown(e, 'left')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -left-2 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
          >
            <span className="h-4 w-1.5 rounded-sm bg-teal-700 dark:bg-teal-400" />
          </div>
          <div
            role="slider"
            aria-label="Batas akhir rentang tanggal"
            aria-valuemin={0}
            aria-valuemax={maxIdx}
            aria-valuenow={safeEnd}
            onPointerDown={(e) => handlePointerDown(e, 'right')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -right-2 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
          >
            <span className="h-4 w-1.5 rounded-sm bg-teal-700 dark:bg-teal-400" />
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
        <span>{data[0]?.label}</span>
        <span>
          Aktif: {data[safeStart]?.label} – {data[safeEnd]?.label}
        </span>
        <span>{data[maxIdx]?.label}</span>
      </div>
    </div>
  );
};

interface BarLabelRenderProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
}

const renderHorizontalCategoryBarLabel = (props: BarLabelRenderProps) => {
  const x = Number(props.x) || 0;
  const y = Number(props.y) || 0;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const value = Number(props.value) || 0;
  if (value <= 0) return null;

  const text = formatMoney(value);
  const fitsInside = width >= 84;
  const textX = fitsInside ? x + width - 8 : x + width + 6;
  const textY = y + height / 2;

  return (
    <text
      x={textX}
      y={textY}
      textAnchor={fitsInside ? 'end' : 'start'}
      dominantBaseline="central"
      className={
        fitsInside
          ? 'fill-white font-mono text-[10px] font-bold pointer-events-none'
          : 'fill-slate-800 dark:fill-slate-200 font-mono text-[10px] font-semibold pointer-events-none'
      }
    >
      {text}
    </text>
  );
};

const renderVerticalAccountBarLabel = (props: BarLabelRenderProps) => {
  const x = Number(props.x) || 0;
  const y = Number(props.y) || 0;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const value = Number(props.value) || 0;

  const text = formatMoney(value);
  const fitsInside = height >= 26 && width >= 48;
  const centerX = x + width / 2;
  const textY = fitsInside ? y + height / 2 : Math.max(12, y - 8);

  return (
    <text
      x={centerX}
      y={textY}
      textAnchor="middle"
      dominantBaseline="central"
      className={
        fitsInside
          ? 'fill-white font-mono text-[10px] font-bold pointer-events-none'
          : 'fill-slate-800 dark:fill-slate-200 font-mono text-[10px] font-bold pointer-events-none'
      }
    >
      {text}
    </text>
  );
};

interface PieSliceLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const renderPaymentPieLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieSliceLabelProps) => {
  const pctVal = percent * 100;
  if (pctVal < 2) return null;

  const RADIAN = Math.PI / 180;
  // Tampilkan di dalam slice jika cukup besar (>= 12%), atau tepat di luar ring jika lebih tipis
  if (pctVal >= 12) {
    const r = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white font-mono text-[10px] font-bold pointer-events-none"
      >
        {formatPercentId(pctVal)}
      </text>
    );
  }

  const r = outerRadius + 14;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x >= cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-slate-700 dark:fill-slate-200 font-mono text-[10px] font-semibold pointer-events-none"
    >
      {formatPercentId(pctVal)}
    </text>
  );
};

export const DashboardCharts: React.FC = () => {
  const {
    trendData,
    moneyActivityData,
    categoryExpenseData,
    paymentMethodData,
    needsVsWantsData,
    cashBalance,
    seaBankBalance,
    digitalBalance,
    liquidBalance,
    totalAccountBalance,
    filteredTransactions,
  } = useFinance();

  const hasTx = filteredTransactions.length > 0;
  const maxTrendIdx = Math.max(0, trendData.length - 1);

  const [zoomRange, setZoomRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: maxTrendIdx,
  });
  const [dragLeftLabel, setDragLeftLabel] = useState<string | null>(null);
  const [dragRightLabel, setDragRightLabel] = useState<string | null>(null);
  const trendContainerRef = useRef<HTMLDivElement | null>(null);

  const clampRange = useCallback(
    (rawStart: number, rawEnd: number): { startIndex: number; endIndex: number } => {
      if (trendData.length === 0) return { startIndex: 0, endIndex: 0 };
      const last = trendData.length - 1;
      if (last === 0) return { startIndex: 0, endIndex: 0 };

      let s = Number.isFinite(rawStart) ? Math.round(rawStart) : 0;
      let e = Number.isFinite(rawEnd) ? Math.round(rawEnd) : last;
      s = Math.max(0, Math.min(s, last));
      e = Math.max(0, Math.min(e, last));
      if (s > e) [s, e] = [e, s];

      const minSpan = Math.min(2, trendData.length);
      if (e - s + 1 < minSpan) {
        if (s + minSpan - 1 <= last) {
          e = s + minSpan - 1;
        } else {
          e = last;
          s = Math.max(0, last - minSpan + 1);
        }
      }
      return { startIndex: s, endIndex: e };
    },
    [trendData.length]
  );

  const trendSignature = useMemo(() => {
    if (trendData.length === 0) return 'empty';
    return `${trendData.length}|${trendData[0].tanggal}|${trendData[trendData.length - 1].tanggal}`;
  }, [trendData]);

  useEffect(() => {
    setZoomRange({
      startIndex: 0,
      endIndex: Math.max(0, trendData.length - 1),
    });
    setDragLeftLabel(null);
    setDragRightLabel(null);
  }, [trendSignature, trendData.length]);

  const { startIndex: safeStart, endIndex: safeEnd } = useMemo(
    () => clampRange(zoomRange.startIndex, zoomRange.endIndex),
    [clampRange, zoomRange.startIndex, zoomRange.endIndex]
  );

  const minWindowCount = Math.min(2, trendData.length);
  const visibleCount = trendData.length > 0 ? safeEnd - safeStart + 1 : 0;
  const isZoomed = trendData.length > 2 && (safeStart > 0 || safeEnd < maxTrendIdx);
  const canZoomIn = trendData.length > 2 && visibleCount > minWindowCount;
  const canZoomOut = isZoomed;

  const zoomByFactor = useCallback(
    (direction: 'in' | 'out', anchorRatio = 0.5) => {
      if (trendData.length <= 2) return;

      setZoomRange((prev) => {
        const current = clampRange(prev.startIndex, prev.endIndex);
        const currentSpan = current.endIndex - current.startIndex + 1;

        if (direction === 'in') {
          if (currentSpan <= minWindowCount) return current;
          const nextSpan = Math.max(minWindowCount, Math.floor(currentSpan * 0.7));
          const reduction = Math.max(1, currentSpan - nextSpan);
          const leftCut = Math.round(reduction * anchorRatio);
          const rightCut = reduction - leftCut;
          return clampRange(current.startIndex + leftCut, current.endIndex - rightCut);
        }

        if (current.startIndex === 0 && current.endIndex === maxTrendIdx) return current;
        const nextSpan = Math.min(
          trendData.length,
          Math.max(currentSpan + 2, Math.ceil(currentSpan / 0.7))
        );
        const expansion = nextSpan - currentSpan;
        const leftAdd = Math.round(expansion * anchorRatio);
        const rightAdd = expansion - leftAdd;
        let nextStart = Math.max(0, current.startIndex - leftAdd);
        let nextEnd = Math.min(maxTrendIdx, current.endIndex + rightAdd);

        const actualSpan = nextEnd - nextStart + 1;
        if (actualSpan < nextSpan) {
          const deficit = nextSpan - actualSpan;
          if (nextStart === 0) {
            nextEnd = Math.min(maxTrendIdx, nextEnd + deficit);
          } else if (nextEnd === maxTrendIdx) {
            nextStart = Math.max(0, nextStart - deficit);
          }
        }
        return clampRange(nextStart, nextEnd);
      });
    },
    [trendData.length, maxTrendIdx, minWindowCount, clampRange]
  );

  const handleResetZoom = useCallback(() => {
    setZoomRange({ startIndex: 0, endIndex: Math.max(0, trendData.length - 1) });
    setDragLeftLabel(null);
    setDragRightLabel(null);
  }, [trendData.length]);

  useEffect(() => {
    const el = trendContainerRef.current;
    if (!el || trendData.length <= 2) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const rawRatio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;
      const clampedRatio = Math.max(0.1, Math.min(0.9, rawRatio));
      zoomByFactor(e.deltaY < 0 ? 'in' : 'out', clampedRatio);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [trendData.length, zoomByFactor]);

  const visibleTrendData = useMemo(
    () => (trendData.length > 0 ? trendData.slice(safeStart, safeEnd + 1) : []),
    [trendData, safeStart, safeEnd]
  );

  const commitDragZoom = useCallback(() => {
    if (!dragLeftLabel || !dragRightLabel) {
      setDragLeftLabel(null);
      setDragRightLabel(null);
      return;
    }

    const localIdxA = visibleTrendData.findIndex((d) => d.label === dragLeftLabel);
    const localIdxB = visibleTrendData.findIndex((d) => d.label === dragRightLabel);

    setDragLeftLabel(null);
    setDragRightLabel(null);

    if (localIdxA === -1 || localIdxB === -1 || localIdxA === localIdxB) return;
    const globalStart = safeStart + Math.min(localIdxA, localIdxB);
    const globalEnd = safeStart + Math.max(localIdxA, localIdxB);
    if (globalEnd - globalStart + 1 >= 2) {
      setZoomRange(clampRange(globalStart, globalEnd));
    }
  }, [dragLeftLabel, dragRightLabel, visibleTrendData, safeStart, clampRange]);

  const xAxisInterval = useMemo(() => {
    const len = visibleTrendData.length;
    if (len <= 10) return 0;
    if (len <= 20) return 1;
    return Math.max(1, Math.ceil(len / 8) - 1);
  }, [visibleTrendData.length]);

  const paymentMethodWithPct = useMemo(() => {
    const total = paymentMethodData.reduce((sum, item) => sum + item.value, 0);
    return paymentMethodData.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
    }));
  }, [paymentMethodData]);

  const cashDigitalChartData = [
    { name: 'Uang Tunai', saldo: cashBalance },
    { name: 'Saldo Digital', saldo: digitalBalance },
    { name: 'Sisa Kas Likuid', saldo: liquidBalance },
    { name: 'Tabungan (SeaBank)', saldo: seaBankBalance },
    { name: 'Total Aset', saldo: totalAccountBalance },
  ];

  const trendScale = computeNiceAxisScale(
    visibleTrendData.flatMap((d) => [d.pemasukan, d.pengeluaran, d.uangTunai, d.shopeePay])
  );
  const activityScale = computeNiceAxisScale(moneyActivityData.map((d) => d.nominal));
  const categoryScale = computeNiceAxisScale(categoryExpenseData.map((d) => d.total));
  const accountScale = computeNiceAxisScale(cashDigitalChartData.map((d) => d.saldo));

  const activeRangeLabel =
    visibleTrendData.length > 0
      ? `${visibleTrendData[0].label} s/d ${visibleTrendData[visibleTrendData.length - 1].label}`
      : '';

  const dragX1 = useMemo(() => {
    if (!dragLeftLabel || !dragRightLabel) return undefined;
    const i1 = visibleTrendData.findIndex((d) => d.label === dragLeftLabel);
    const i2 = visibleTrendData.findIndex((d) => d.label === dragRightLabel);
    if (i1 === -1 || i2 === -1) return undefined;
    return i1 <= i2 ? dragLeftLabel : dragRightLabel;
  }, [dragLeftLabel, dragRightLabel, visibleTrendData]);

  const dragX2 = useMemo(() => {
    if (!dragLeftLabel || !dragRightLabel) return undefined;
    const i1 = visibleTrendData.findIndex((d) => d.label === dragLeftLabel);
    const i2 = visibleTrendData.findIndex((d) => d.label === dragRightLabel);
    if (i1 === -1 || i2 === -1) return undefined;
    return i1 <= i2 ? dragRightLabel : dragLeftLabel;
  }, [dragLeftLabel, dragRightLabel, visibleTrendData]);

  return (
    <div className="space-y-6">
      {/* Row 1: AreaChart Tren Keuangan + Vertical BarChart Aktivitas Uang */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartCard
            title="Tren Keuangan"
            subtitle={
              isZoomed && activeRangeLabel
                ? `Rentang fokus: ${activeRangeLabel} (${visibleCount} dari ${trendData.length} hari)`
                : 'Pemasukan, pengeluaran, Uang Tunai, dan ShopeePay kumulatif (carry-over antar bulan)'
            }
            isEmpty={!hasTx}
            action={
              hasTx && trendData.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => zoomByFactor('in', 0.5)}
                    disabled={!canZoomIn}
                    aria-label="Zoom In grafik Tren Keuangan"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>Zoom In (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomByFactor('out', 0.5)}
                    disabled={!canZoomOut}
                    aria-label="Zoom Out grafik Tren Keuangan"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                    <span>Zoom Out (-)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    disabled={!isZoomed}
                    aria-label="Reset Zoom grafik Tren Keuangan"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Zoom</span>
                  </button>
                </div>
              ) : undefined
            }
          >
            <div ref={trendContainerRef} className="h-72 w-full select-none cursor-crosshair">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={visibleTrendData}
                  margin={{ top: 10, right: 12, left: 6, bottom: 4 }}
                  onMouseDown={(state) => {
                    if (state?.activeLabel !== undefined && state?.activeLabel !== null) {
                      const label = String(state.activeLabel);
                      setDragLeftLabel(label);
                      setDragRightLabel(label);
                    }
                  }}
                  onMouseMove={(state) => {
                    if (dragLeftLabel && state?.activeLabel !== undefined && state?.activeLabel !== null) {
                      setDragRightLabel(String(state.activeLabel));
                    }
                  }}
                  onMouseUp={() => {
                    if (dragLeftLabel) commitDragZoom();
                  }}
                  onMouseLeave={() => {
                    if (dragLeftLabel) commitDragZoom();
                  }}
                >
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradShopee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                  <XAxis
                    dataKey="label"
                    interval={xAxisInterval}
                    minTickGap={24}
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                  />
                  <YAxis
                    domain={trendScale.domain}
                    ticks={trendScale.ticks}
                    tickFormatter={(v) => formatMoney(v)}
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                    width={92}
                  />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [formatMoney(Number(val)), String(name)]}
                    labelFormatter={(label) => `Tanggal ${label}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(148,163,184,0.25)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="pemasukan"
                    name="Pemasukan"
                    stroke="#16A34A"
                    strokeWidth={2}
                    fill="url(#gradIncome)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="pengeluaran"
                    name="Pengeluaran"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fill="url(#gradExpense)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="uangTunai"
                    name="Uang Tunai"
                    stroke="#0F766E"
                    strokeWidth={2.2}
                    fill="url(#gradCash)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="shopeePay"
                    name="ShopeePay"
                    stroke="#0284C7"
                    strokeWidth={2.2}
                    fill="url(#gradShopee)"
                    isAnimationActive={false}
                  />
                  {dragX1 && dragX2 && dragX1 !== dragX2 && (
                    <ReferenceArea
                      x1={dragX1}
                      x2={dragX2}
                      strokeOpacity={0.35}
                      fill="#0F766E"
                      fillOpacity={0.16}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {trendData.length > 1 && (
              <>
                <TimelineRangeSlider
                  data={trendData}
                  startIndex={safeStart}
                  endIndex={safeEnd}
                  onChangeRange={(s, e) => setZoomRange(clampRange(s, e))}
                  onReset={handleResetZoom}
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Gunakan tombol kontrol di atas, scroll mouse, seret area grafik, atau geser slider rentang tanggal di bawah grafik untuk memperbesar detail.
                </p>
              </>
            )}
          </ChartCard>
        </div>

        <ChartCard
          title="Aktivitas Uang"
          subtitle="Arus kas Masuk & Keluar periode terpilih vs Sisa Kas Likuid"
          isEmpty={!hasTx}
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moneyActivityData} margin={{ top: 10, right: 12, left: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                <YAxis
                  domain={activityScale.domain}
                  ticks={activityScale.ticks}
                  tickFormatter={(v) => formatMoney(v)}
                  tick={{ fontSize: 11 }}
                  stroke="#64748B"
                  width={92}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatMoney(Number(val)), 'Nominal']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="nominal" radius={[8, 8, 0, 0]}>
                  {moneyActivityData.map((entry, idx) => {
                    const color =
                      entry.name === 'Masuk'
                        ? '#16A34A'
                        : entry.name === 'Keluar'
                          ? '#DC2626'
                          : '#0F766E';
                    return <Cell key={idx} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Pengeluaran per Kategori (Horizontal Bar) + Metode Pembayaran (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Pengeluaran per Kategori"
          subtitle="Diurutkan dari pengeluaran terbesar ke terkecil"
          isEmpty={categoryExpenseData.length === 0}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryExpenseData}
                layout="vertical"
                margin={{ top: 4, right: 86, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  type="number"
                  domain={categoryScale.domain}
                  ticks={categoryScale.ticks}
                  tickFormatter={(v) => formatMoney(v)}
                  tick={{ fontSize: 10 }}
                  stroke="#64748B"
                />
                <YAxis
                  type="category"
                  dataKey="kategori"
                  width={126}
                  tick={{ fontSize: 11 }}
                  stroke="#64748B"
                />
                <Tooltip
                  formatter={(val: unknown) => [formatMoney(Number(val)), 'Pengeluaran']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="#0F766E" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="total" content={renderHorizontalCategoryBarLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Proporsi Metode Pembayaran"
          subtitle="Distribusi volume transaksi berdasarkan metode pembayaran"
          isEmpty={paymentMethodWithPct.length === 0}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodWithPct}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderPaymentPieLabel}
                >
                  {paymentMethodWithPct.map((_, index) => (
                    <Cell key={index} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown, name: unknown, item: { payload?: { percentage?: number } }) => [
                    `${formatMoney(Number(val))} (${formatPercentId(item?.payload?.percentage ?? 0)})`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => {
                    const match = paymentMethodWithPct.find((item) => item.name === String(value));
                    return match ? `${value} (${formatPercentId(match.percentage)})` : String(value);
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {paymentMethodWithPct.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {paymentMethodWithPct.map((row, idx) => (
                <div key={row.name} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                    />
                    <span className="truncate">
                      {row.name} ({formatPercentId(row.percentage)})
                    </span>
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-white shrink-0">
                    {formatMoney(row.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Kebutuhan vs Keinginan (Donut) + Uang Tunai vs Digital & Tabungan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Kebutuhan vs Keinginan"
          subtitle="Proporsi alokasi pengeluaran kebutuhan dan keinginan"
          isEmpty={needsVsWantsData.length === 0}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={needsVsWantsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={4}
                >
                  {needsVsWantsData.map((_, idx) => (
                    <Cell key={idx} fill={NEEDS_WANTS_COLORS[idx % NEEDS_WANTS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown, name: unknown, item: { payload?: { percentage?: number } }) => [
                    `${formatMoney(Number(val))} (${item?.payload?.percentage ?? 0}%)`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {needsVsWantsData.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {needsVsWantsData.map((row) => (
                <div key={row.name} className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {row.name} ({row.percentage}%)
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                    {formatMoney(row.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Uang Tunai vs Digital & Tabungan"
          subtitle="Komposisi kas likuid (Uang Tunai, ShopeePay) terpisah dari tabungan SeaBank"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashDigitalChartData} margin={{ top: 24, right: 10, left: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748B" />
                <YAxis
                  domain={accountScale.domain}
                  ticks={accountScale.ticks}
                  tickFormatter={(v) => formatMoney(v)}
                  tick={{ fontSize: 11 }}
                  stroke="#64748B"
                  width={92}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatMoney(Number(val)), 'Saldo']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="saldo" fill="#0F766E" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="saldo" content={renderVerticalAccountBarLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Uang Tunai</span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(cashBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Saldo Digital</span>
              <span className="font-mono-num font-semibold text-teal-700 dark:text-teal-400">
                {formatMoney(digitalBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Sisa Saldo</span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(liquidBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Tabungan</span>
              <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                {formatMoney(seaBankBalance)}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

