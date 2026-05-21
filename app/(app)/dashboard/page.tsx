// File: app/(app)/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import {
  buildPreset,
  DateFilter,
  type Range,
} from '@/components/dashboard/date-filter';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import {
  IncomeExpenseChart,
  ProfitTrendChart,
} from '@/components/dashboard/income-expense-chart';
import {
  ExpenseBreakdownPie,
  TopProductsPie,
} from '@/components/dashboard/pie-charts';
import { TopProductsList } from '@/components/dashboard/top-products-list';
import { HistoryTable } from '@/components/dashboard/history-table';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle } from 'lucide-react';

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const off = d.getTimezoneOffset() * 60000;
    out.push(new Date(d.getTime() - off).toISOString().slice(0, 10));
  }
  return out;
}

export default function DashboardPage() {
  const [range, setRange] = useState<Range>(() => buildPreset('7d'));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', range.from, range.to],
    queryFn: async () => {
      const supabase = createClient();
      const [summaryRes, topRes, breakdownRes] = await Promise.all([
        supabase
          .from('daily_summary')
          .select('entry_id,entry_date,total_income,total_expense,total_kg_sold')
          .gte('entry_date', range.from)
          .lte('entry_date', range.to)
          .order('entry_date'),
        supabase.rpc('top_products', {
          p_from: range.from,
          p_to: range.to,
          p_limit: 5,
        }),
        supabase.rpc('expense_breakdown', {
          p_from: range.from,
          p_to: range.to,
        }),
      ]);
      if (summaryRes.error) throw summaryRes.error;
      const rows = summaryRes.data ?? [];

      const totals = rows.reduce(
        (acc, r) => ({
          total_income: acc.total_income + Number(r.total_income),
          total_expense: acc.total_expense + Number(r.total_expense),
          total_kg_sold: acc.total_kg_sold + Number(r.total_kg_sold),
        }),
        { total_income: 0, total_expense: 0, total_kg_sold: 0 },
      );

      const byDate = new Map(rows.map((r) => [r.entry_date, r]));
      const series = eachDate(range.from, range.to).map((d) => {
        const r = byDate.get(d);
        const income = Number(r?.total_income ?? 0);
        const expense = Number(r?.total_expense ?? 0);
        return { date: d, income, expense, profit: income - expense };
      });

      return {
        summary: {
          ...totals,
          net_profit: totals.total_income - totals.total_expense,
        },
        series,
        history: rows.map((r) => ({
          entry_id: r.entry_id,
          entry_date: r.entry_date,
          total_income: Number(r.total_income),
          total_expense: Number(r.total_expense),
        })),
        top: (topRes.data ?? []).map((t: any) => ({
          product_name: t.product_name,
          total_amount: Number(t.total_amount),
          total_kg: Number(t.total_kg),
        })),
        breakdown: {
          purchase: Number(breakdownRes.data?.[0]?.purchase_total ?? 0),
          other: Number(breakdownRes.data?.[0]?.other_total ?? 0),
        },
      };
    },
  });

  const hasNoData =
    !isLoading &&
    data &&
    data.summary.total_income === 0 &&
    data.summary.total_expense === 0;

  const downloadCsv = () => {
    if (!data) return;
    const header = ['date', 'income', 'expense', 'profit'];
    const lines = [
      header.join(','),
      ...data.series.map((s) =>
        [s.date, s.income, s.expense, s.profit].join(','),
      ),
      '',
      'TOTAL',
      `รายรับ,${data.summary.total_income}`,
      `รายจ่าย,${data.summary.total_expense}`,
      `กำไรสุทธิ,${data.summary.net_profit}`,
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fruit-tracker_${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="สรุปผลประกอบการ" subtitle={range.label} emoji="📊" />

      <div className="px-5 pb-2 space-y-5">
        <DateFilter range={range} onChange={setRange} />

        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : hasNoData ? (
          <EmptyState />
        ) : data ? (
          <>
            <SummaryCards data={data.summary} />

            {/* Charts: stacked on mobile, 2-col on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <IncomeExpenseChart data={data.series} />
              <ProfitTrendChart data={data.series} />
            </div>

            {/* Pie charts: stacked on mobile, 2-col on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TopProductsPie data={data.top} />
              <ExpenseBreakdownPie
                purchase={data.breakdown.purchase}
                other={data.breakdown.other}
              />
            </div>

            <TopProductsList data={data.top} />
            <HistoryTable rows={data.history} />

            <button
              type="button"
              onClick={downloadCsv}
              className="btn-secondary w-full"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-28 rounded-3xl bg-mango-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-3xl bg-cream-200" />
        <div className="h-20 rounded-3xl bg-cream-200" />
      </div>
      <div className="h-60 rounded-3xl bg-cream-200" />
      <div className="h-48 rounded-3xl bg-cream-200" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card p-10 text-center animate-fade-in-up">
      <div className="flex justify-center mb-3">
        <AlertCircle className="h-12 w-12 text-rose-400" />
      </div>
      <h3 className="text-base font-bold text-slate-800">โหลดข้อมูลไม่สำเร็จ</h3>
      <p className="mt-1 text-sm text-slate-500">
        กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary mt-5 px-8"
      >
        ลองใหม่
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center animate-fade-in-up">
      <div className="text-6xl mb-3">🌱</div>
      <h3 className="text-base font-bold text-slate-800">
        ยังไม่มีข้อมูลในช่วงนี้
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        ลองเปลี่ยนช่วงเวลา หรือเริ่มบันทึกรายรับ/รายจ่ายวันแรกของคุณ
      </p>
    </div>
  );
}
