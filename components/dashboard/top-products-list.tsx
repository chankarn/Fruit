// File: components/dashboard/top-products-list.tsx
'use client';

import { formatBaht, formatKg } from '@/lib/format';

export function TopProductsList({
  data,
}: {
  data: { product_name: string; total_amount: number; total_kg: number }[];
}) {
  if (!data.length) return null;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-2">
        🏆 สินค้าขายดี Top 5
      </h3>
      <ul className="divide-y divide-cream-200">
        {data.map((p, i) => (
          <li key={p.product_name} className="flex items-center gap-3 py-3">
            <span className="text-2xl w-8 text-center">
              {medals[i] ?? (
                <span className="text-sm text-slate-400 font-bold">
                  {i + 1}
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-slate-800">
                {p.product_name}
              </div>
              <div className="text-xs text-slate-500">{formatKg(p.total_kg)}</div>
            </div>
            <div className="text-sm font-bold text-emerald-600 tabular-nums">
              {formatBaht(p.total_amount)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
