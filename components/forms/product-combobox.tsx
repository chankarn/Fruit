// File: components/forms/product-combobox.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function ProductCombobox({
  value,
  onChange,
  placeholder = 'เลือก / พิมพ์ชื่อสินค้า',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .order('last_used_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((p) => p.name);
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const trimmed = value.trim();
  const filtered = trimmed
    ? products.filter((p) => p.toLowerCase().includes(trimmed.toLowerCase()))
    : products;
  const showAddNew =
    trimmed.length > 0 &&
    !products.some((p) => p.toLowerCase() === trimmed.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          maxLength={255}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="input pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon text-slate-400 hover:text-mango-600"
          aria-label="toggle"
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>

      {open && (filtered.length > 0 || showAddNew) && (
        <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white shadow-float ring-1 ring-cream-200 animate-slide-down p-1">
          {showAddNew && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(trimmed);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-mango-700 hover:bg-mango-50"
              >
                <Plus className="h-4 w-4" />
                เพิ่ม <span className="text-mango-900">"{trimmed}"</span>
              </button>
            </li>
          )}
          {filtered.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cn(
                  'w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-cream-100 transition-colors',
                  p === value && 'bg-mango-50 text-mango-700 font-semibold',
                )}
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
