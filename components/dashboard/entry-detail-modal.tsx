// File: components/dashboard/entry-detail-modal.tsx
'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBaht, formatKg, formatThaiDate } from '@/lib/format';

type Props = {
  entryId: string;
  entryDate: string;
  onClose: () => void;
};

type Item = {
  id: string;
  product_name: string;
  quantity_kg: number;
  price_per_kg: number;
  total: number;
};

type Extra = {
  id: string;
  description: string;
  amount: number;
};

type EntryDetail = {
  sale_items: Item[];
  purchase_items: Item[];
  extra_incomes: Extra[];
  extra_expenses: Extra[];
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
      const [salesRes, purchasesRes, incomesRes, expensesRes] =
        await Promise.all([
          supabase
            .from('sale_items')
            .select('id,product_name,quantity_kg,price_per_kg,total')
            .eq('entry_id', entryId)
            .order('sort_order'),
          supabase
            .from('purchase_items')
            .select('id,product_name,quantity_kg,price_per_kg,total')
            .eq('entry_id', entryId)
            .order('sort_order'),
          supabase
            .from('extra_incomes')
            .select('id,description,amount')
            .eq('entry_id', entryId)
            .order('sort_order'),
          supabase
            .from('extra_expenses')
            .select('id,description,amount')
            .eq('entry_id', entryId)
            .order('sort_order'),
        ]);
      if (salesRes.error) throw salesRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (incomesRes.error) throw incomesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      return {
        sale_items: (salesRes.data ?? []) as Item[],
        purchase_items: (purchasesRes.data ?? []) as Item[],
        extra_incomes: (incomesRes.data ?? []) as Extra[],
        extra_expenses: (expensesRes.data ?? []) as Extra[],
      };
    },
  });

  const salesTotal =
    data?.sale_items.reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const purchaseTotal =
    data?.purchase_items.reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const incomeTotal =
    data?.extra_incomes.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const expenseTotal =
    data?.extra_expenses.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  const totalIncome = salesTotal + incomeTotal;
  const totalExpense = purchaseTotal + expenseTotal;
  const profit = totalIncome - totalExpense;
  const positive = profit >= 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center bg-slate-900/70 backdrop-blur-sm md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full h-full md:h-auto md:max-w-lg md:max-h-[92vh] overflow-hidden bg-white md:rounded-3xl shadow-2xl animate-fade-in-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200 shrink-0 bg-gradient-to-br from-mango-50 to-cream-50">
          <div>
            <div className="text-xs text-slate-500">รายละเอียดประจำวัน</div>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">
              {formatThaiDate(entryDate)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon text-slate-400 hover:bg-white"
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
              {data.sale_items.length > 0 && (
                <Section
                  icon={<ShoppingBag className="h-4 w-4 text-emerald-500" />}
                  title="รายการขาย"
                  total={salesTotal}
                  totalColor="text-emerald-600"
                >
                  <ItemList items={data.sale_items} />
                </Section>
              )}

              {data.extra_incomes.length > 0 && (
                <Section
                  icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                  title="รายรับเพิ่มเติม"
                  total={incomeTotal}
                  totalColor="text-emerald-600"
                >
                  <ExtraList items={data.extra_incomes} tone="income" />
                </Section>
              )}

              {data.purchase_items.length > 0 && (
                <Section
                  icon={<ShoppingCart className="h-4 w-4 text-rose-400" />}
                  title="รายการซื้อ"
                  total={purchaseTotal}
                  totalColor="text-rose-600"
                >
                  <ItemList items={data.purchase_items} />
                </Section>
              )}

              {data.extra_expenses.length > 0 && (
                <Section
                  icon={<Receipt className="h-4 w-4 text-rose-400" />}
                  title="รายจ่ายเพิ่มเติม"
                  total={expenseTotal}
                  totalColor="text-rose-600"
                >
                  <ExtraList items={data.extra_expenses} tone="expense" />
                </Section>
              )}

              {data.sale_items.length === 0 &&
                data.purchase_items.length === 0 &&
                data.extra_incomes.length === 0 &&
                data.extra_expenses.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-10">
                    ไม่มีรายการในวันนี้
                  </p>
                )}
            </>
          ) : null}
        </div>

        {/* Footer total */}
        {data && (
          <div className="p-5 border-t border-cream-200 bg-cream-50 shrink-0 space-y-1.5">
            <Row label="รวมรายรับ" value={totalIncome} color="text-emerald-600" />
            <Row label="รวมรายจ่าย" value={totalExpense} color="text-rose-600" />
            <div className="pt-2 mt-2 border-t border-cream-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {positive ? 'กำไรสุทธิ' : 'ขาดทุน'}
              </span>
              <span
                className={
                  'text-2xl font-extrabold tabular-nums ' +
                  (positive ? 'text-sky-600' : 'text-orange-600')
                }
              >
                {formatBaht(profit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  total,
  totalColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  total: number;
  totalColor: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        </div>
        <span className={'text-sm font-bold tabular-nums ' + totalColor}>
          {formatBaht(total)}
        </span>
      </div>
      {children}
    </section>
  );
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-2xl bg-cream-50 p-3 border border-cream-200"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {item.product_name}
            </span>
            <span className="text-sm font-bold tabular-nums text-slate-800 shrink-0">
              {formatBaht(item.total)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatKg(item.quantity_kg)} × {formatBaht(item.price_per_kg)}/กก.
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExtraList({
  items,
  tone,
}: {
  items: Extra[];
  tone: 'income' | 'expense';
}) {
  const bg = tone === 'income' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-rose-50/60 border-rose-100';
  const text = tone === 'income' ? 'text-emerald-700' : 'text-rose-700';
  return (
    <ul className="space-y-2">
      {items.map((ex) => (
        <li
          key={ex.id}
          className={`rounded-2xl p-3 border flex items-center justify-between gap-2 ${bg}`}
        >
          <span className="text-sm text-slate-700 truncate">
            {ex.description}
          </span>
          <span className={`text-sm font-bold tabular-nums shrink-0 ${text}`}>
            {formatBaht(ex.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>
        {formatBaht(value)}
      </span>
    </div>
  );
}
