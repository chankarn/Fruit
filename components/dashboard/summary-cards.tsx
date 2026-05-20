// File: components/dashboard/summary-cards.tsx
'use client';

import { TrendingUp, TrendingDown, Scale, Coins } from 'lucide-react';
import { formatBaht, formatNumber } from '@/lib/format';

type Summary = {
  total_income: number;
  total_expense: number;
  net_profit: number;
  total_kg_sold: number;
};

export function SummaryCards({ data }: { data: Summary }) {
  const positive = data.net_profit >= 0;

  return (
    <div className="space-y-3">
      {/* ───── HERO: Net Profit ───── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-mango p-5 text-white shadow-soft animate-fade-in-up">
        {/* Decorative blur circle */}
        <div
          aria-hidden
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
              <Coins className="h-3 w-3" />
              กำไรสุทธิ
            </div>
            <div
              className={
                'inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur'
              }
            >
              {positive ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  กำไร
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5" />
                  ขาดทุน
                </>
              )}
            </div>
          </div>
          <div className="mt-3 text-4xl font-bold tabular-nums leading-none">
            {formatBaht(data.net_profit)}
          </div>
          <div className="mt-2 text-xs text-white/80">
            จาก {formatBaht(data.total_income)} − {formatBaht(data.total_expense)}
          </div>
        </div>
      </div>

      {/* ───── Income / Expense / Qty (2-col mobile, 3-col desktop) ───── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="รายรับรวม"
          value={formatBaht(data.total_income)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="รายจ่ายรวม"
          value={formatBaht(data.total_expense)}
          icon={<TrendingDown className="h-5 w-5" />}
          accent="rose"
        />
        <div className="col-span-2 md:col-span-1 card flex items-center gap-4 p-4 animate-fade-in-up">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Scale className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              จำนวนที่ขายได้
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 tabular-nums">
                {formatNumber(data.total_kg_sold)}
              </span>
              <span className="text-sm font-medium text-slate-500">กก.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose';
}) {
  const accents = {
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-700',
    },
    rose: {
      iconBg: 'bg-rose-100 text-rose-700',
      value: 'text-rose-700',
    },
  } as const;
  const a = accents[accent];

  return (
    <div className="card p-4 animate-fade-in-up">
      <div
        className={
          'flex h-10 w-10 items-center justify-center rounded-2xl ' + a.iconBg
        }
      >
        {icon}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={
          'mt-0.5 text-xl font-bold tabular-nums leading-tight ' + a.value
        }
      >
        {value}
      </div>
    </div>
  );
}
