// File: components/dashboard/history-table.tsx
'use client';

import { Trash2, Calendar, MoreHorizontal, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [menuOpen]);

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
      <div className="card overflow-visible">
        <h3 className="text-sm font-bold text-slate-800 p-4 pb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-mango-500" />
          ประวัติย้อนหลัง
        </h3>
        <ul className="divide-y divide-cream-200">
          {rows.map((r) => {
            const profit = r.total_income - r.total_expense;
            const positive = profit >= 0;
            const isOpen = menuOpen === r.entry_id;
            return (
              <li
                key={r.entry_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-cream-100 transition-colors"
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
                <div className="relative" ref={isOpen ? menuRef : null}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(isOpen ? null : r.entry_id)}
                    className="btn-icon text-slate-400 hover:bg-cream-200 hover:text-slate-700"
                    aria-label="เมนู"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white shadow-float border border-cream-200 py-1.5 z-20 animate-fade-in-up"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(null);
                          setSelected({ id: r.entry_id, date: r.entry_date });
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-cream-100 transition"
                      >
                        <Eye className="h-4 w-4 text-mango-500" />
                        ดูรายละเอียด
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(null);
                          if (confirm(`ลบข้อมูลของวันที่ ${r.entry_date}?`))
                            del.mutate(r.entry_id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </button>
                    </div>
                  )}
                </div>
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
