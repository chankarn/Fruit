// File: components/dashboard/income-expense-chart.tsx
'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBaht } from '@/lib/format';

type Point = { date: string; income: number; expense: number; profit: number };

const tooltipStyle = {
  background: 'white',
  border: '1px solid #fed7aa',
  borderRadius: 12,
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 12px 32px -8px rgba(17, 24, 39, 0.12)',
};

export function IncomeExpenseChart({ data }: { data: Point[] }) {
  if (!data.length) return null;
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-3">
        📊 รายรับ vs รายจ่าย
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#fef3c7"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              fontSize={10}
              stroke="#94a3b8"
            />
            <YAxis
              fontSize={10}
              tickFormatter={(v) => `${v / 1000}k`}
              stroke="#94a3b8"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => formatBaht(v)}
              labelFormatter={(l) => `วันที่ ${l}`}
              cursor={{ fill: 'rgba(254, 215, 170, 0.2)' }}
            />
            <Bar
              dataKey="income"
              name="รายรับ"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="รายจ่าย"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProfitTrendChart({ data }: { data: Point[] }) {
  if (!data.length) return null;
  const hasLoss = data.some((d) => d.profit < 0);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">📈 กำไรรายวัน</h3>
        {hasLoss && (
          <span className="text-[10px] font-semibold rounded-full bg-rose-50 text-rose-500 px-2 py-0.5 ring-1 ring-rose-200">
            🔴 มีวันขาดทุน
          </span>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#fef3c7"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              fontSize={10}
              stroke="#94a3b8"
            />
            <YAxis
              fontSize={10}
              tickFormatter={(v) => `${v / 1000}k`}
              stroke="#94a3b8"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                formatBaht(v),
                v >= 0 ? 'กำไร' : 'ขาดทุน',
              ]}
              labelFormatter={(l) => `วันที่ ${l}`}
              cursor={{ fill: 'rgba(254, 215, 170, 0.2)' }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
            <Bar dataKey="profit" name="กำไร" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.profit >= 0 ? '#0ea5e9' : '#f43f5e'}
                  opacity={entry.profit === 0 ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
