# 🍊 Fruit Tracker

เว็บ Mobile-first สำหรับบันทึกรายรับ-รายจ่ายร้านผลไม้ พร้อม Dashboard สรุปผลประกอบการ

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Supabase (Auth + Postgres + RLS) · React Query · Recharts

---

## 🚀 Local Setup (Step-by-step)

### 1. ติดตั้ง prerequisites

```bash
# Node.js 18+
node -v

# Docker Desktop (จำเป็น — Supabase CLI ใช้ Docker)
# https://www.docker.com/products/docker-desktop

# Supabase CLI
brew install supabase/tap/supabase
```

### 2. ติดตั้ง dependencies

```bash
cd Fruit
npm install
```

### 3. Copy env file

```bash
cp .env.example .env.local
```

> `.env.example` มี keys ของ Supabase local default ใส่ไว้ให้แล้ว ไม่ต้องแก้

### 4. Start Supabase (Docker stack)

```bash
npm run db:start
```

รอประมาณ 30 วินาที จะพ่น output แบบนี้:

```
API URL:     http://127.0.0.1:54321
Studio URL:  http://127.0.0.1:54323     ← UI ดู DB
DB URL:      postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Migration จะ apply อัตโนมัติจาก `supabase/migrations/`

> **ถ้าอยาก reset DB:** `npm run db:reset`

### 5. Start Next.js

```bash
npm run dev
```

เปิด <http://localhost:3000> — ระบบจะ redirect ไป `/login` ให้สมัครสมาชิกใหม่ แล้วใช้งานได้ทันที

---

## 📂 Project Structure

```
Fruit/
├── app/
│   ├── (auth)/           # login, register
│   ├── (app)/            # sales, expenses, dashboard (อยู่หลัง auth gate)
│   ├── layout.tsx        # root layout + providers
│   └── globals.css
├── components/
│   ├── forms/            # ProductCombobox, EntryForm (shared)
│   ├── layout/           # BottomNav, PageHeader
│   └── dashboard/        # SummaryCards, charts, history
├── lib/
│   ├── supabase/         # browser, server, middleware clients
│   ├── schemas/          # Zod validation
│   ├── types/database.ts # Supabase generated types
│   ├── format.ts         # Baht/Kg/Date formatters
│   └── utils.ts
├── supabase/
│   ├── config.toml       # local Supabase config
│   └── migrations/       # SQL migrations (7 tables + RLS + RPC + views)
├── middleware.ts         # auth gate
└── ...
```

---

## 🔑 Key Concepts

### Authentication & Authorization

- **Supabase Auth** จัดการ login/signup ด้วย email+password
- **RLS (Row Level Security)** ป้องกันข้อมูลแต่ละ user — แม้ frontend bypass ก็เข้าข้อมูลคนอื่นไม่ได้
- **Middleware** redirect ไป `/login` ถ้ายังไม่ได้ login

### Atomic Save

ใช้ Postgres function `upsert_daily_entry()` — แทนที่ child rows ของวันนั้นใหม่ทั้งชุดใน 1 transaction กัน race condition

### Combobox สินค้า

- ดึง 50 รายการล่าสุดของ user (cache 5 นาที)
- กดเลือก/พิมพ์ใหม่ → `upsert` ใส่ `products` table + อัปเดต `last_used_at`

### Dashboard

- ทุกตัวเลข aggregate ที่ Postgres (`daily_summary` view + `top_products()` + `expense_breakdown()` RPC)
- กราฟ: Recharts รับ data จาก React Query
- Export CSV: generate ฝั่ง client ด้วย Blob (รองรับ UTF-8 BOM สำหรับ Excel ภาษาไทย)

---

## 🛠️ NPM Scripts

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check (no emit) |
| `npm run db:start` | Start Supabase local stack (Docker) |
| `npm run db:stop` | Stop Supabase |
| `npm run db:reset` | Reset DB + re-apply migrations |
| `npm run db:push` | Push migrations to remote Supabase |
| `npm run db:types` | Regenerate `lib/types/database.ts` from local DB |

---

## ☁️ Production Deployment

### Supabase Cloud

1. สมัคร <https://supabase.com> → สร้าง project (Region: Singapore)
2. ใน SQL Editor ของ project paste เนื้อหาจาก `supabase/migrations/20260516000000_init.sql`
3. ที่ **Authentication → Providers → Email** → ปิด "Confirm email" (หรือเปิดถ้าต้องการความปลอดภัยขึ้น)
4. ที่ **Project Settings → API** copy `URL` และ `anon key`

### Vercel

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel
vercel
```

ตั้ง env vars บน Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Push ขึ้น GitHub → connect repo บน Vercel → auto deploy

---

## 🧪 Quick Smoke Test

1. เปิด <http://127.0.0.1:54323> (Supabase Studio) → ดูตาราง `daily_entries`, `sale_items` ฯลฯ ว่าสร้างครบ
2. เปิด <http://localhost:3000> → สมัครสมาชิก
3. **หน้ารายรับ:** ใส่ ส้ม 10 กก. × 40 บาท → กดบันทึก
4. **Studio:** ดู `sale_items` มี row ใหม่ + `products` มี "ส้ม"
5. **หน้ารายจ่าย:** ใส่ ส้ม 10 กก. × 30 บาท → บันทึก
6. **Dashboard:** เห็น รายรับ ฿400, รายจ่าย ฿300, กำไร ฿100, Top 1 = ส้ม
7. กลับมาหน้ารายรับ → ข้อมูลที่บันทึกไว้ load กลับมาให้แก้ได้

---

## 📋 Known Limitations (Phase 2)

- ❌ Offline queue (เน็ตหลุดยังกรอกต่อได้) — design ไว้แต่ยังไม่ implement
- ❌ PWA install บน home screen
- ❌ Dark mode
- ❌ Export Excel (.xlsx) — มีแค่ CSV
- ❌ Multi-user / multi-shop
- ❌ ลบ/แก้ row เดียวย้อนหลัง — ตอนนี้ลบทั้งวันแทน

---

## 🆘 Troubleshooting

**`supabase start` ค้าง / error:** เปิด Docker Desktop ให้รันก่อน

**`Type error: Cannot find module '@/...':** รัน `npm install` แล้วลอง `npm run type-check`

**Login แล้ว redirect วน:** ลบ cookies ของ localhost ใน browser แล้วลองใหม่

**ไม่เห็นข้อมูลใน dashboard:** ใน Supabase Studio (54323) → SQL Editor รัน `SELECT * FROM daily_entries;` ดูว่ามี row ไหม + RLS ติด user ที่ถูกต้องไหม
