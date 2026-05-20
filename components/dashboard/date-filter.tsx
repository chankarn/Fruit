// File: components/dashboard/date-filter.tsx
'use client';

import { todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';

export type Range = { from: string; to: string; label: string };

const subtract = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

export const buildPreset = (key: string): Range => {
  const today = todayISO();
  switch (key) {
    case 'today':
      return { from: today, to: today, label: 'วันนี้' };
    case '7d':
      return { from: subtract(6), to: today, label: '7 วันล่าสุด' };
    case '30d':
      return { from: subtract(29), to: today, label: '30 วันล่าสุด' };
    case 'month':
      return { from: startOfMonth(), to: today, label: 'เดือนนี้' };
    default:
      return { from: subtract(6), to: today, label: '7 วันล่าสุด' };
  }
};

export function DateFilter({
  range,
  onChange,
}: {
  range: Range;
  onChange: (r: Range) => void;
}) {
  const presets = [
    { key: 'today', label: 'วันนี้' },
    { key: '7d', label: '7 วัน' },
    { key: '30d', label: '30 วัน' },
    { key: 'month', label: 'เดือนนี้' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
        {presets.map((p) => {
          const r = buildPreset(p.key);
          const active = range.label === r.label;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onChange(r)}
              className={cn(
                'shrink-0 transition-all',
                active ? 'chip-active' : 'chip-idle',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="card p-3 grid grid-cols-2 gap-2">
        <div>
          <label className="label">ตั้งแต่</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) =>
              onChange({ ...range, from: e.target.value, label: 'กำหนดเอง' })
            }
            className="input"
          />
        </div>
        <div>
          <label className="label">ถึง</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) =>
              onChange({ ...range, to: e.target.value, label: 'กำหนดเอง' })
            }
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
