// File: lib/format.ts
const thbFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatBaht = (v: number | null | undefined) =>
  thbFormatter.format(Number(v ?? 0));

export const formatNumber = (v: number | null | undefined) =>
  numFormatter.format(Number(v ?? 0));

export const formatKg = (v: number | null | undefined) =>
  `${formatNumber(v)} กก.`;

export const todayISO = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
};

export const formatThaiDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
};
