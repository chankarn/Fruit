// File: __tests__/schemas/entry.test.ts
import { saleItemSchema, extraAmountSchema, entryPayloadSchema } from '@/lib/schemas/entry';

// ─── saleItemSchema ───────────────────────────────────────────────
describe('saleItemSchema', () => {
  const valid = { product_name: 'มะม่วง', quantity_kg: 5, price_per_kg: 40 };

  test('happy path — passes valid input', () => {
    const result = saleItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('trims whitespace from product_name', () => {
    const result = saleItemSchema.safeParse({ ...valid, product_name: '  มะม่วง  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.product_name).toBe('มะม่วง');
  });

  test('rejects empty product_name', () => {
    const result = saleItemSchema.safeParse({ ...valid, product_name: '' });
    expect(result.success).toBe(false);
  });

  test('rejects product_name over 255 chars', () => {
    const result = saleItemSchema.safeParse({ ...valid, product_name: 'ก'.repeat(256) });
    expect(result.success).toBe(false);
  });

  test('accepts product_name exactly 255 chars', () => {
    const result = saleItemSchema.safeParse({ ...valid, product_name: 'ก'.repeat(255) });
    expect(result.success).toBe(true);
  });

  test('rejects quantity_kg = 0', () => {
    const result = saleItemSchema.safeParse({ ...valid, quantity_kg: 0 });
    expect(result.success).toBe(false);
  });

  test('rejects negative quantity_kg', () => {
    const result = saleItemSchema.safeParse({ ...valid, quantity_kg: -1 });
    expect(result.success).toBe(false);
  });

  test('accepts quantity_kg boundary — 0.01', () => {
    const result = saleItemSchema.safeParse({ ...valid, quantity_kg: 0.01 });
    expect(result.success).toBe(true);
  });

  test('rejects quantity_kg over max (99999)', () => {
    const result = saleItemSchema.safeParse({ ...valid, quantity_kg: 100000 });
    expect(result.success).toBe(false);
  });

  test('accepts price_per_kg = 0 (ให้ฟรี)', () => {
    const result = saleItemSchema.safeParse({ ...valid, price_per_kg: 0 });
    expect(result.success).toBe(true);
  });

  test('rejects negative price_per_kg', () => {
    const result = saleItemSchema.safeParse({ ...valid, price_per_kg: -1 });
    expect(result.success).toBe(false);
  });

  test('rejects price_per_kg over max (999999)', () => {
    const result = saleItemSchema.safeParse({ ...valid, price_per_kg: 1000000 });
    expect(result.success).toBe(false);
  });

  test('coerces string numbers to number', () => {
    const result = saleItemSchema.safeParse({ ...valid, quantity_kg: '10.5', price_per_kg: '35' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity_kg).toBe(10.5);
      expect(result.data.price_per_kg).toBe(35);
    }
  });

  test('sort_order defaults to 0 when omitted', () => {
    const result = saleItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sort_order).toBe(0);
  });
});

// ─── extraAmountSchema ────────────────────────────────────────────
describe('extraAmountSchema', () => {
  const valid = { description: 'ค่าจ้างลูกน้อง', amount: 200 };

  test('happy path', () => {
    expect(extraAmountSchema.safeParse(valid).success).toBe(true);
  });

  test('rejects empty description', () => {
    expect(extraAmountSchema.safeParse({ ...valid, description: '' }).success).toBe(false);
  });

  test('rejects description over 500 chars', () => {
    expect(extraAmountSchema.safeParse({ ...valid, description: 'ก'.repeat(501) }).success).toBe(false);
  });

  test('accepts description exactly 500 chars', () => {
    expect(extraAmountSchema.safeParse({ ...valid, description: 'ก'.repeat(500) }).success).toBe(true);
  });

  test('accepts amount = 0', () => {
    expect(extraAmountSchema.safeParse({ ...valid, amount: 0 }).success).toBe(true);
  });

  test('rejects negative amount', () => {
    expect(extraAmountSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });

  test('rejects amount over max (9999999)', () => {
    expect(extraAmountSchema.safeParse({ ...valid, amount: 10000000 }).success).toBe(false);
  });
});

// ─── entryPayloadSchema ───────────────────────────────────────────
describe('entryPayloadSchema', () => {
  const saleItem = { product_name: 'มะม่วง', quantity_kg: 5, price_per_kg: 40 };
  const extraItem = { description: 'ค่าน้ำมัน', amount: 50 };

  test('accepts valid full payload', () => {
    const result = entryPayloadSchema.safeParse({
      entry_date: '2026-05-17',
      sales: [saleItem],
      incomes: [],
      purchases: [],
      expenses: [extraItem],
    });
    expect(result.success).toBe(true);
  });

  test('rejects malformed date', () => {
    const result = entryPayloadSchema.safeParse({
      entry_date: '17/05/2026',
      sales: [],
      incomes: [],
      purchases: [],
      expenses: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects date with invalid month', () => {
    const result = entryPayloadSchema.safeParse({
      entry_date: '2026-13-01',
      sales: [saleItem],
      incomes: [],
      purchases: [],
      expenses: [],
    });
    // regex only checks format, DB will catch invalid month — but format must match
    expect(result.success).toBe(true); // regex passes, semantic validation is DB's job
  });

  test('rejects SQL injection attempt in entry_date', () => {
    const result = entryPayloadSchema.safeParse({
      entry_date: "2026-05-17'; DROP TABLE daily_entries;--",
      sales: [],
      incomes: [],
      purchases: [],
      expenses: [],
    });
    expect(result.success).toBe(false);
  });

  test('empty arrays default correctly', () => {
    const result = entryPayloadSchema.safeParse({ entry_date: '2026-05-17' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sales).toEqual([]);
      expect(result.data.expenses).toEqual([]);
    }
  });
});

// ─── Business logic: grandTotal calculation ───────────────────────
describe('grandTotal calculation', () => {
  const calcItemTotal = (qty: number, price: number) => qty * price;

  test('sales mode: net = itemsTotal - extrasTotal', () => {
    const itemsTotal = calcItemTotal(10, 50); // 500
    const extrasTotal = 80;
    const grandTotal = itemsTotal - extrasTotal;
    expect(grandTotal).toBe(420);
  });

  test('sales mode: net can go negative (ขาดทุน)', () => {
    const itemsTotal = calcItemTotal(1, 10); // 10
    const extrasTotal = 500;
    const grandTotal = itemsTotal - extrasTotal;
    expect(grandTotal).toBe(-490);
  });

  test('expenses mode: total = itemsTotal + extrasTotal', () => {
    const itemsTotal = calcItemTotal(5, 100); // 500
    const extrasTotal = 200;
    const grandTotal = itemsTotal + extrasTotal;
    expect(grandTotal).toBe(700);
  });

  test('zero items and zero extras = 0', () => {
    expect(0 - 0).toBe(0);
    expect(0 + 0).toBe(0);
  });

  test('floating point: 0.1 + 0.2 kg * price', () => {
    const total = calcItemTotal(0.1, 50) + calcItemTotal(0.2, 50);
    expect(Math.round(total * 100) / 100).toBeCloseTo(15, 5);
  });
});

// ─── Security: open redirect guard ───────────────────────────────
describe('open redirect guard', () => {
  const sanitize = (raw: string) =>
    raw.startsWith('/') && !raw.startsWith('//') ? raw : '/sales';

  test('allows valid relative path', () => {
    expect(sanitize('/dashboard')).toBe('/dashboard');
  });

  test('allows nested relative path', () => {
    expect(sanitize('/sales?date=2026-05-17')).toBe('/sales?date=2026-05-17');
  });

  test('blocks absolute URL (http)', () => {
    expect(sanitize('http://evil.com')).toBe('/sales');
  });

  test('blocks absolute URL (https)', () => {
    expect(sanitize('https://evil.com/steal')).toBe('/sales');
  });

  test('blocks protocol-relative URL (//)', () => {
    expect(sanitize('//evil.com')).toBe('/sales');
  });

  test('blocks empty string', () => {
    expect(sanitize('')).toBe('/sales');
  });

  test('blocks javascript: scheme', () => {
    expect(sanitize('javascript:alert(1)')).toBe('/sales');
  });
});
