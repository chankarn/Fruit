// File: components/dashboard/entry-detail-modal.tsx
'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ShoppingBag, Receipt, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBaht, formatKg, formatThaiDate } from '@/lib/format';

type Props = {
  entryId: string;
  entryDate: string;
  onClose: () => void;
};

type SaleItem = {
  id: string;
  product_name: string;
  quantity_kg: number;
  price_per_kg: number;
  amount: number;
};

type ExtraExpense = {
  id: string;
  description: string;
  amount: number;
};

type EntryDetail = {
  mode: 'sales' | 'expense';
  notes: string | null;
  sale_items: SaleItem[];
  extra_expenses: ExtraExpense[];
};

export function EntryDetailModal({ entryId, entryDate, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { data, isLoading, isError } = useQuery<EntryDetail>({
    queryKey: ['entry-detail', entryId],
    queryFn: async () => {
      const supabase = createClient();
      const [entryRes, itemsRes, extrasRes] = await Promise.all([
        supabase
          .from('daily_entries')
          .select('mode,notes')
          .eq('id', entryId)
          .single(),
        supabase
          .from('sale_items')
          .select('id,product_name,quantity_kg,price_per_kg,amount')
          .eq('entry_id', entryId)
          .order('created_at'),
        supabase
          .from('extra_expenses')
          .select('id,description,amount')
          .eq('entry_id', entryId)
          .order('created_at'),
      ]);
      if (entryRes.error) throw entryRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (extrasRes.error) throw extrasRes.error;
      return {
        mode: entryRes.data.mode,
        notes: entryRes.data.notes,
        sale_items: (itemsRes.data ?? []) as SaleItem[],
        extra_expenses: (extrasRes.data ?? []) as ExtraExpense[],
      };
    },
  });

  const itemsTotal =
    data?.sale_items.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const extrasTotal =
    data?.extra_expenses.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const grandTotal =
    data?.mode === 'sales' ? itemsTotal - extrasTotal : itemsTotal + extrasTotal;

  const isSales = data?.mode === 'sales';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-fade-in-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200 shrink-0">
          <div>
            <div className="text-xs text-slate-500">
              {isSales ? '📈 รายรับ' : '📉 รายจ่าย'}
            </div>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">
              {formatThaiDate(entryDate)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon text-slate-400 hover:bg-cream-100"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 text-mango-500 animate-spin" />
            </div>
          ) : isError ? (
            <p className="text-center text-sm text-rose-600 py-10">
              โหลดข้อมูลไม่สำเร็จ
            </p>
          ) : data ? (
            <>
              {/* Sale items / Purchase items */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-4 w-4 text-mango-500" />
                  <h3 className="text-sm font-bold text-slate-700">
                    {isSales ? 'รายการขาย' : 'รายการซื้อ'}
                  </h3>
                </div>
                {data.sale_items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">ไม่มีรายการ</p>
                ) : (
                  <ul className="space-y-2">
                    {data.sale_items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl bg-cream-50 p-3 border border-cream-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {item.product_name}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-800 shrink-0">
                            {formatBaht(item.amount)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 tabular-nums">
                          {formatKg(item.quantity_kg)} ×{' '}
                          {formatBaht(item.price_per_kg)}/กก.
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>รวมรายการ</span>
                  <span className="font-semibold tabular-nums">
                    {formatBaht(itemsTotal)}
                  </span>
                </div>
              </section>

              {/* Extras */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-slate-700">
                    {isSales ? 'รายจ่ายเพิ่มเติม' : 'ค่าใช้จ่ายอื่น'}
                  </h3>
                </div>
                {data.extra_expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">ไม่มีรายการ</p>
                ) : (
                  <ul className="space-y-2">
                    {data.extra_expenses.map((ex) => (
                      <li
                        key={ex.id}
                        className="rounded-2xl bg-rose-50/60 p-3 border border-rose-100 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-slate-700 truncate">
                          {ex.description}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-rose-700 shrink-0">
                          {formatBaht(ex.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>รวมเพิ่มเติม</span>
                  <span className="font-semibold tabular-nums">
                    {formatBaht(extrasTotal)}
                  </span>
                </div>
              </section>

              {/* Notes */}
              {data.notes && (
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">
                    บันทึก
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap rounded-2xl bg-cream-50 p-3 border border-cream-200">
                    {data.notes}
                  </p>
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* Footer total */}
        {data && (
          <div className="p-5 border-t border-cream-200 bg-gradient-to-br from-mango-50 to-cream-50 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                {isSales ? 'รายได้สุทธิ' : 'รายจ่ายรวม'}
              </span>
              <span className="text-2xl font-extrabold tabular-nums text-mango-600">
                {formatBaht(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
