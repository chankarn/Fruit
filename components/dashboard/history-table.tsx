// File: components/dashboard/history-table.tsx
'use client';

import { Trash2, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatBaht, formatThaiDate } from '@/lib/format';
import { EntryDetailModal } from './entry-detail-modal';

type Row = {
  entry_id: string;
  entry_date: string;
  total_income: number;
  total_expense: number;
};

export function HistoryTable({ rows }: { rows: Row[] }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<{ id: string; date: string } | null>(
    null,
  );
  const del = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('daily_entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (!rows.length) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-sm text-slate-500">ไม่มีประวัติในช่วงนี้</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <h3 className="text-sm font-bold text-slate-800 p-4 pb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-mango-500" />
          ประวัติย้อนหลัง
          <span className="text-xs font-normal text-slate-400 ml-1">
            (แตะเพื่อดูรายละเอียด)
          </span>
        </h3>
        <ul className="divide-y divide-cream-200">
          {rows.map((r) => {
            const profit = r.total_income - r.total_expense;
            const positive = profit >= 0;
            return (
              <li
                key={r.entry_id}
                className="flex items-center gap-2 px-2 py-1 hover:bg-cream-100 transition-colors"
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelected({ id: r.entry_id, date: r.entry_date })
                  }
                  className="flex-1 min-w-0 flex items-center gap-3 px-2 py-2 rounded-2xl text-left hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-mango-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      {formatThaiDate(r.entry_date)}
                    </div>
                    <div className="mt-0.5 text-xs flex gap-2">
                      <span className="text-emerald-600 font-medium">
                        +{formatBaht(r.total_income)}
                      </span>
                      <span className="text-rose-600 font-medium">
                        −{formatBaht(r.total_expense)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={
                      'text-sm font-bold tabular-nums px-2.5 py-1 rounded-full ' +
                      (positive
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-orange-50 text-orange-700')
                    }
                  >
                    {formatBaht(profit)}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`ลบข้อมูลของวันที่ ${r.entry_date}?`))
                      del.mutate(r.entry_id);
                  }}
                  className="btn-icon text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="ลบ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <EntryDetailModal
          entryId={selected.id}
          entryDate={selected.date}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
