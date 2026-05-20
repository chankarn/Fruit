// File: components/dashboard/pie-charts.tsx
'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatBaht } from '@/lib/format';

const PALETTE = [
  '#f97316',
  '#10b981',
  '#0ea5e9',
  '#a855f7',
  '#ec4899',
  '#94a3b8',
];

const tooltipStyle = {
  background: 'white',
  border: '1px solid #fed7aa',
  borderRadius: 12,
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 12px 32px -8px rgba(17, 24, 39, 0.12)',
};

export function TopProductsPie({
  data,
}: {
  data: { product_name: string; total_amount: number }[];
}) {
  if (!data.length) return null;
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-3">
        🥇 สัดส่วนสินค้าขายดี
      </h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total_amount"
              nameKey="product_name"
              cx="50%"
              cy="45%"
              innerRadius={42}
              outerRadius={78}
              paddingAngle={3}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => formatBaht(v)}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ExpenseBreakdownPie({
  purchase,
  other,
}: {
  purchase: number;
  other: number;
}) {
  if (purchase + other === 0) return null;
  const data = [
    { name: 'ซื้อสินค้า', value: purchase },
    { name: 'รายจ่ายอื่นๆ', value: other },
  ];
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-3">
        🧾 สัดส่วนรายจ่าย
      </h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={42}
              outerRadius={78}
              paddingAngle={3}
              stroke="white"
              strokeWidth={2}
            >
              <Cell fill="#f43f5e" />
              <Cell fill="#f97316" />
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => formatBaht(v)}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
