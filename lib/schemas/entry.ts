// File: lib/schemas/entry.ts
import { z } from 'zod';

export const saleItemSchema = z.object({
  product_name: z.string().trim().min(1, 'กรุณากรอกชื่อสินค้า').max(255, 'ชื่อสินค้าต้องไม่เกิน 255 ตัวอักษร'),
  quantity_kg: z.coerce.number().positive('จำนวนต้องมากกว่า 0').max(99999, 'จำนวนเกินขีดจำกัด'),
  price_per_kg: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ').max(999999, 'ราคาเกินขีดจำกัด'),
  sort_order: z.number().int().default(0),
});

export const extraAmountSchema = z.object({
  description: z.string().trim().min(1, 'กรุณากรอกรายละเอียด').max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร'),
  amount: z.coerce.number().min(0, 'จำนวนเงินต้องไม่ติดลบ').max(9999999, 'จำนวนเกินขีดจำกัด'),
  sort_order: z.number().int().default(0),
});

export const entryPayloadSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง'),
  sales: z.array(saleItemSchema).default([]),
  incomes: z.array(extraAmountSchema).default([]),
  purchases: z.array(saleItemSchema).default([]),
  expenses: z.array(extraAmountSchema).default([]),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type ExtraAmountInput = z.infer<typeof extraAmountSchema>;
export type EntryPayload = z.infer<typeof entryPayloadSchema>;
