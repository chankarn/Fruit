// File: components/forms/entry-form.tsx
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ProductCombobox } from './product-combobox';
import { createClient } from '@/lib/supabase/client';
import { formatBaht, formatThaiDate, todayISO } from '@/lib/format';
import { toSaveError } from '@/lib/errors';
import { entryPayloadSchema, type EntryPayload } from '@/lib/schemas/entry';

type Mode = 'sales' | 'expenses';

type ItemRow = {
  id: string;
  product_name: string;
  quantity_kg: string;
  price_per_kg: string;
};

type ExtraRow = {
  id: string;
  description: string;
  amount: string;
};

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyItem = (): ItemRow => ({
  id: uid(),
  product_name: '',
  quantity_kg: '',
  price_per_kg: '',
});

const emptyExtra = (): ExtraRow => ({
  id: uid(),
  description: '',
  amount: '',
});

const calcItemTotal = (r: ItemRow) => {
  const q = Number(r.quantity_kg);
  const p = Number(r.price_per_kg);
  if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
  return q * p;
};

const ui = {
  sales: {
    sectionTitle: 'รายการขาย',
    sectionEmoji: '🍊',
    extraTitle: 'รายจ่ายอื่นๆ',
    extraEmoji: '💸',
    extraExample: 'เช่น ค่าจ้างลูกน้อง, ค่าน้ำมัน',
    totalLabel: 'เงินสดสุทธิวันนี้',
    accentBg: 'bg-emerald-50',
    accentRing: 'ring-emerald-200',
  },
  expenses: {
    sectionTitle: 'ซื้อสินค้าเข้าร้าน',
    sectionEmoji: '📦',
    extraTitle: 'รายจ่ายอื่นๆ',
    extraEmoji: '💸',
    extraExample: 'เช่น ค่าเช่าแผง, ค่าน้ำแข็ง',
    totalLabel: 'รวมรายจ่ายวันนี้',
    accentBg: 'bg-rose-50',
    accentRing: 'ring-rose-200',
  },
} as const;

export function EntryForm({ mode }: { mode: Mode }) {
  const qc = useQueryClient();
  const cfg = ui[mode];
  const [entryDate, setEntryDate] = useState(todayISO());
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [extras, setExtras] = useState<ExtraRow[]>([emptyExtra()]);
  const [successDialog, setSuccessDialog] = useState<{
    date: string;
    total: number;
  } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['entry', entryDate],
    queryFn: async () => {
      const supabase = createClient();
      const { data: entry } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('entry_date', entryDate)
        .is('deleted_at', null)
        .maybeSingle();
      if (!entry) return null;
      const [sales, incomes, purchases, expenses] = await Promise.all([
        supabase
          .from('sale_items')
          .select('*')
          .eq('entry_id', entry.id)
          .order('sort_order'),
        supabase
          .from('extra_incomes')
          .select('*')
          .eq('entry_id', entry.id)
          .order('sort_order'),
        supabase
          .from('purchase_items')
          .select('*')
          .eq('entry_id', entry.id)
          .order('sort_order'),
        supabase
          .from('extra_expenses')
          .select('*')
          .eq('entry_id', entry.id)
          .order('sort_order'),
      ]);
      return {
        sales: sales.data ?? [],
        incomes: incomes.data ?? [],
        purchases: purchases.data ?? [],
        expenses: expenses.data ?? [],
      };
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (!existing) {
      setItems([emptyItem()]);
      setExtras([emptyExtra()]);
      return;
    }
    const targetItems = mode === 'sales' ? existing.sales : existing.purchases;
    // Both modes now read/write extras from `extra_expenses` —
    // "other expenses" is a single shared pool per day.
    const targetExtras = existing.expenses;

    setItems(
      targetItems.length
        ? targetItems.map((r) => ({
            id: r.id,
            product_name: r.product_name,
            quantity_kg: String(r.quantity_kg),
            price_per_kg: String(r.price_per_kg),
          }))
        : [emptyItem()],
    );
    setExtras(
      targetExtras.length
        ? targetExtras.map((r) => ({
            id: r.id,
            description: r.description,
            amount: String(r.amount),
          }))
        : [emptyExtra()],
    );
  }, [existing, isLoading, mode, entryDate]);

  const grandTotal = useMemo(() => {
    const itemsTotal = items.reduce((sum, r) => sum + calcItemTotal(r), 0);
    const extrasTotal = extras.reduce((sum, r) => {
      const n = Number(r.amount);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
    // Sales: net = income − expenses paid out today
    // Expenses: total = purchases + other costs
    return mode === 'sales'
      ? itemsTotal - extrasTotal
      : itemsTotal + extrasTotal;
  }, [items, extras, mode]);

  const totalColor =
    mode === 'expenses'
      ? 'text-expense'
      : grandTotal >= 0
        ? 'text-income'
        : 'text-expense';

  const save = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const itemRows = items
        .filter(
          (r) =>
            r.product_name.trim() &&
            r.quantity_kg !== '' &&
            r.price_per_kg !== '',
        )
        .map((r, i) => ({
          product_name: r.product_name.trim(),
          quantity_kg: Number(r.quantity_kg),
          price_per_kg: Number(r.price_per_kg),
          sort_order: i,
        }));
      const extraRows = extras
        .filter((r) => r.description.trim() && r.amount !== '')
        .map((r, i) => ({
          description: r.description.trim(),
          amount: Number(r.amount),
          sort_order: i,
        }));

      if (itemRows.length === 0 && extraRows.length === 0) {
        throw new Error('กรุณาเพิ่มอย่างน้อย 1 รายการ');
      }

      // Preserve "other-side" items so atomic upsert doesn't wipe them.
      // Both modes share `extra_expenses` (single pool), so current
      // `extraRows` is the source of truth for that table on save.
      const otherSideEntry = await supabase
        .from('daily_entries')
        .select('id')
        .eq('entry_date', entryDate)
        .is('deleted_at', null)
        .maybeSingle();
      let otherSideItems: any[] = [];
      if (otherSideEntry.data) {
        const otherItemsTable =
          mode === 'sales' ? 'purchase_items' : 'sale_items';
        const oi = await supabase
          .from(otherItemsTable)
          .select('product_name,quantity_kg,price_per_kg,sort_order')
          .eq('entry_id', otherSideEntry.data.id);
        otherSideItems = oi.data ?? [];
      }

      const payload: EntryPayload = {
        entry_date: entryDate,
        sales: mode === 'sales' ? itemRows : otherSideItems,
        incomes: [], // `extra_incomes` is no longer used by the UI
        purchases: mode === 'expenses' ? itemRows : otherSideItems,
        expenses: extraRows,
      };

      const parsed = entryPayloadSchema.parse(payload);
      const { error } = await supabase.rpc('upsert_daily_entry', {
        p_entry_date: parsed.entry_date,
        p_sales: parsed.sales as any,
        p_incomes: parsed.incomes as any,
        p_purchases: parsed.purchases as any,
        p_expenses: parsed.expenses as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccessDialog({ date: entryDate, total: grandTotal });
      qc.invalidateQueries({ queryKey: ['entry', entryDate] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      setErrorToast(toSaveError(err.message ?? ''));
    },
  });

  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 3000);
    return () => clearTimeout(t);
  }, [errorToast]);

  return (
    <>
      <div className="px-5 pb-2 space-y-5">
        {/* Date selector */}
        <div className="card p-4">
          <label className="label">📅 วันที่บันทึก</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="input"
          />
        </div>

        {/* Main items */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{cfg.sectionEmoji}</span>
              {cfg.sectionTitle}
            </h2>
            <span className="chip-idle">{items.length} รายการ</span>
          </div>

          {isLoading && <SkeletonRow />}

          {!isLoading &&
            items.map((row, idx) => {
              const total = calcItemTotal(row);
              const hasTotal = total > 0;
              return (
                <div
                  key={row.id}
                  className="card p-4 space-y-3 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between">
                    <span className="chip-idle">
                      <span className="text-mango-600">#</span>
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (items.length === 1) setItems([emptyItem()]);
                        else
                          setItems((rs) => rs.filter((r) => r.id !== row.id));
                      }}
                      className="btn-icon text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="label">ชื่อสินค้า</label>
                    <ProductCombobox
                      value={row.product_name}
                      onChange={(v) =>
                        setItems((rs) =>
                          rs.map((r) =>
                            r.id === row.id ? { ...r, product_name: v } : r,
                          ),
                        )
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="label">จำนวน (กก.)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={row.quantity_kg}
                        onChange={(e) =>
                          setItems((rs) =>
                            rs.map((r) =>
                              r.id === row.id
                                ? { ...r, quantity_kg: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="label">ราคา/กก.</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={row.price_per_kg}
                        onChange={(e) =>
                          setItems((rs) =>
                            rs.map((r) =>
                              r.id === row.id
                                ? { ...r, price_per_kg: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div
                    className={
                      'flex items-center justify-between rounded-2xl px-4 py-2.5 ring-1 transition-all ' +
                      (hasTotal
                        ? `${cfg.accentBg} ${cfg.accentRing}`
                        : 'bg-cream-100 ring-cream-200')
                    }
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      รวม
                    </span>
                    <span
                      className={
                        'text-base font-bold tabular-nums ' +
                        (hasTotal
                          ? mode === 'sales'
                            ? 'text-income'
                            : 'text-expense'
                          : 'text-slate-400')
                      }
                    >
                      {formatBaht(total)}
                    </span>
                  </div>
                </div>
              );
            })}

          <button
            type="button"
            onClick={() => setItems((rs) => [...rs, emptyItem()])}
            className="btn-secondary w-full border-dashed"
          >
            <Plus className="h-4 w-4" /> เพิ่มรายการ
          </button>
        </section>

        {/* Extra */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{cfg.extraEmoji}</span>
              {cfg.extraTitle}
            </h2>
            <span className="chip-idle">{extras.length} รายการ</span>
          </div>

          {extras.map((row, idx) => (
            <div
              key={row.id}
              className="card p-4 space-y-3 animate-fade-in-up"
            >
              <div className="flex items-center justify-between">
                <span className="chip-idle">
                  <span className="text-mango-600">#</span>
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (extras.length === 1) setExtras([emptyExtra()]);
                    else
                      setExtras((rs) => rs.filter((r) => r.id !== row.id));
                  }}
                  className="btn-icon text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="ลบรายการ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="label">รายละเอียด</label>
                <input
                  type="text"
                  maxLength={500}
                  value={row.description}
                  onChange={(e) =>
                    setExtras((rs) =>
                      rs.map((r) =>
                        r.id === row.id
                          ? { ...r, description: e.target.value }
                          : r,
                      ),
                    )
                  }
                  className="input"
                  placeholder={cfg.extraExample}
                />
              </div>

              <div>
                <label className="label">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={(e) =>
                    setExtras((rs) =>
                      rs.map((r) =>
                        r.id === row.id
                          ? { ...r, amount: e.target.value }
                          : r,
                      ),
                    )
                  }
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setExtras((rs) => [...rs, emptyExtra()])}
            className="btn-secondary w-full border-dashed"
          >
            <Plus className="h-4 w-4" /> เพิ่มรายการ
          </button>
        </section>
      </div>

      {/* Sticky total + save */}
      <div
        className="fixed inset-x-0 z-30 pointer-events-none px-4"
        style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      >
        <div className="pointer-events-auto mx-auto max-w-md card flex items-center gap-3 p-3 pl-5 backdrop-blur-md bg-white/95">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              {cfg.totalLabel}
            </div>
            <div className={'text-xl font-bold tabular-nums ' + totalColor}>
              {formatBaht(grandTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-primary px-4"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? 'กำลังบันทึก' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* ── Success dialog ── */}
      {successDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setSuccessDialog(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative card w-full max-w-xs p-7 text-center animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close */}
            <button
              type="button"
              onClick={() => setSuccessDialog(null)}
              className="btn-icon absolute right-4 top-4 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-800">
              บันทึกสำเร็จ!
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatThaiDate(successDialog.date)}
            </p>

            {/* total summary */}
            <div
              className={
                'mt-5 rounded-2xl px-4 py-3 ring-1 ' +
                (mode === 'expenses' || successDialog.total < 0
                  ? 'bg-rose-50 ring-rose-200'
                  : 'bg-emerald-50 ring-emerald-200')
              }
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {cfg.totalLabel}
              </div>
              <div
                className={
                  'mt-1 text-3xl font-bold tabular-nums ' +
                  (mode === 'expenses' || successDialog.total < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600')
                }
              >
                {formatBaht(successDialog.total)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessDialog(null)}
              className="btn-primary mt-5 w-full"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* ── Error toast ── */}
      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2.5 text-sm font-semibold shadow-float flex items-center gap-2 animate-slide-down bg-rose-500 text-white">
          <AlertCircle className="h-4 w-4" />
          {errorToast}
        </div>
      )}
    </>
  );
}

function SkeletonRow() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="h-4 w-20 bg-cream-200 rounded-full" />
      <div className="h-12 bg-cream-100 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-12 bg-cream-100 rounded-2xl" />
        <div className="h-12 bg-cream-100 rounded-2xl" />
      </div>
    </div>
  );
}
