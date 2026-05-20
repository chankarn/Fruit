// File: __tests__/lib/format.test.ts
import { formatBaht, formatNumber, formatKg, formatThaiDate, todayISO } from '@/lib/format';

describe('formatBaht', () => {
  test('formats positive number with THB symbol', () => {
    const result = formatBaht(1000);
    expect(result).toContain('1,000.00');
  });

  test('formats zero as 0.00', () => {
    expect(formatBaht(0)).toContain('0.00');
  });

  test('formats negative number', () => {
    const result = formatBaht(-500);
    expect(result).toContain('500.00');
    expect(result).toContain('-');
  });

  test('handles null gracefully (treats as 0)', () => {
    expect(formatBaht(null)).toContain('0.00');
  });

  test('handles undefined gracefully (treats as 0)', () => {
    expect(formatBaht(undefined)).toContain('0.00');
  });

  test('rounds to 2 decimal places', () => {
    expect(formatBaht(10.555)).toContain('10.56');
  });

  test('formats large number with thousands separator', () => {
    const result = formatBaht(1234567.89);
    expect(result).toContain('1,234,567.89');
  });
});

describe('formatNumber', () => {
  test('formats with 2 decimal places', () => {
    expect(formatNumber(100)).toContain('100.00');
  });

  test('handles null and undefined as 0', () => {
    expect(formatNumber(null)).toContain('0.00');
    expect(formatNumber(undefined)).toContain('0.00');
  });
});

describe('formatKg', () => {
  test('appends กก. suffix', () => {
    const result = formatKg(10.5);
    expect(result).toContain('กก.');
    expect(result).toContain('10.50');
  });

  test('handles null as 0 กก.', () => {
    expect(formatKg(null)).toContain('0.00');
    expect(formatKg(null)).toContain('กก.');
  });
});

describe('todayISO', () => {
  test('returns YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns a valid date', () => {
    const result = todayISO();
    const parsed = new Date(result);
    expect(parsed.toString()).not.toBe('Invalid Date');
  });

  test('matches today in local timezone', () => {
    const result = todayISO();
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const expected = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
    expect(result).toBe(expected);
  });
});

describe('formatThaiDate', () => {
  test('returns a non-empty string', () => {
    expect(formatThaiDate('2026-05-17').length).toBeGreaterThan(0);
  });

  test('does not throw on valid ISO date', () => {
    expect(() => formatThaiDate('2026-01-01')).not.toThrow();
    expect(() => formatThaiDate('2026-12-31')).not.toThrow();
  });

  test('contains the day number', () => {
    const result = formatThaiDate('2026-05-17');
    expect(result).toContain('17');
  });
});
