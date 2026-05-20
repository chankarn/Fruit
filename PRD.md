# 📄 PRD: Fruit Sales Tracker (ระบบบันทึกการขายผลไม้)

> Version 1.0 | วันที่: 2026-05-16 | สถานะ: Draft

---

## 1. Feature Overview & KPIs

### 1.1 วัตถุประสงค์ (Objective)
สร้าง **Web Application แบบ Mobile-First** สำหรับเจ้าของกิจการขายผลไม้รายย่อย ใช้บันทึกรายรับ-รายจ่ายประจำวันได้สะดวกบนมือถือ พร้อม Dashboard สรุปผลประกอบการ เพื่อให้รู้ "วันนี้ได้กำไรเท่าไหร่" และ "สินค้าตัวไหนขายดี" ได้ทันที

### 1.2 คุณค่าทางธุรกิจ (Value Proposition)
- ❌ เลิกจดในสมุด → ✅ บันทึกบนมือถือ คำนวณอัตโนมัติ
- ❌ ไม่รู้กำไร-ขาดทุน → ✅ เห็นตัวเลขสดทันที
- ❌ ไม่รู้สินค้าขายดี → ✅ Dashboard ชี้เป้า
- ❌ เปลี่ยนเครื่องข้อมูลหาย → ✅ เก็บบน Cloud (Supabase)

### 1.3 KPIs / Success Metrics
| Metric | Target |
|---|---|
| User สามารถบันทึกรายการ 1 รายการ | < 15 วินาที |
| หน้าจอโหลดสำเร็จบนมือถือ 4G | < 2 วินาที |
| Uptime ของ Supabase Free Tier | ≥ 99% |
| Active usage | บันทึกอย่างน้อย 1 ครั้ง/วันทำการ |

---

## 2. Target Platforms & User Roles

### 2.1 Platforms
- **Primary:** Responsive Web App (Mobile-first, optimize สำหรับหน้าจอ 360–430px)
- **Secondary:** ใช้บน Tablet / Desktop ได้
- **Browser Support:** Chrome, Safari (iOS), Samsung Internet เวอร์ชันล่าสุด 2 versions

### 2.2 User Roles (Actors)
| Role | สิทธิ์ |
|---|---|
| **Owner** (เจ้าของร้าน) | Login ด้วย PIN/Password, บันทึก/แก้ไข/ลบ ทุกรายการ, ดู Dashboard, Export ข้อมูล |

> **Note:** Phase 1 รองรับ 1 บัญชี (Single-tenant) ถ้าอนาคตอยากให้ลูกน้องช่วยบันทึก ค่อยขยาย Role เป็น Staff (บันทึกได้ ดู Dashboard ไม่ได้)

### 2.3 Authentication
- Login ด้วย **Email + Password** ผ่าน Supabase Auth (รองรับ Reset Password ผ่าน Email)
- Session คงอยู่ 30 วัน (Remember me)
- Auto-redirect ไป Login ถ้า Session หมดอายุ

---

## 3. User Stories & Functional Workflows

### 📱 Page 1: บันทึกรายรับวันนี้ (Daily Sales)

#### US-01: บันทึกรายการขาย
**As an** Owner, **I want to** บันทึกสินค้าที่ขายแต่ละรายการ **so that** ระบบคำนวณเงินรวมให้อัตโนมัติ

**Workflow:**
1. หน้าจอแสดง **วันที่ปัจจุบัน** (แก้ไขได้ ถ้าจะบันทึกย้อนหลัง)
2. Section "🍊 รายการขาย" แสดงแถวเริ่มต้น 1 แถว มี 4 ช่อง:
   - **ชื่อสินค้า** (Combobox: Dropdown + พิมพ์อิสระ — ดึงสินค้าที่เคยขายมาแสดง พร้อมเปิดให้พิมพ์ใหม่)
   - **จำนวน (กก.)** (Number input, decimal 2 ตำแหน่ง)
   - **ราคา/กก.** (Number input, decimal 2 ตำแหน่ง)
   - **รวม (บาท)** (Read-only, auto-calc = จำนวน × ราคา) แสดงทันทีเมื่อกรอกครบ
3. กดปุ่ม **[+ เพิ่มรายการ]** → เพิ่มแถวใหม่
4. กดปุ่ม **[🗑️]** ท้ายแถว → ลบแถวนั้น (ยืนยันก่อนลบ)
5. Section "💵 รายรับอื่นๆ" (ค่าจ้างรายวัน/รายรับพิเศษ) — เพิ่ม-ลบแถวเหมือนข้างบน แต่มีแค่ 2 ช่อง: **รายละเอียด + จำนวนเงิน**
6. ด้านล่างสุดแสดง **"💰 รวมรายรับวันนี้: XXX บาท"** (Sticky Footer — เลื่อนหน้าจอก็ยังเห็น)
7. กดปุ่ม **[💾 บันทึก]** → บันทึกขึ้น Supabase พร้อม Toast แจ้งผล

### 📱 Page 2: บันทึกรายจ่ายวันนี้ (Daily Expenses)

#### US-02: บันทึกรายการรายจ่าย
**Workflow:** เหมือน Page 1 แต่เปลี่ยน Context เป็นรายจ่าย
- Section "📦 ซื้อสินค้าเข้าร้าน" — 4 ช่อง: ชื่อสินค้า / จำนวน(กก.) / ราคา/กก. / รวม(auto)
- Section "💸 รายจ่ายอื่นๆ" — 2 ช่อง: รายละเอียด / จำนวนเงิน (เช่น ค่าน้ำมัน, ค่าเช่าแผง, ค่าน้ำแข็ง)
- ด้านล่างแสดง **"💸 รวมรายจ่ายวันนี้: XXX บาท"** (Sticky Footer)

### 📱 Page 3: Dashboard

#### US-03: ดูสรุปผลประกอบการ
**Layout (Top to Bottom):**

**🔝 Filter Bar (Sticky)**
- Dropdown เลือกช่วงเวลา: `วันนี้` | `7 วัน` | `30 วัน` | `เดือนนี้` | `กำหนดเอง (Date Range)`

**📊 Summary Cards (4 ใบ — 2 คอลัมน์บนมือถือ)**
| Card | สี | ค่า |
|---|---|---|
| 💰 รายรับรวม | เขียว | ฿XX,XXX |
| 💸 รายจ่ายรวม | แดง | ฿XX,XXX |
| 📈 กำไรสุทธิ | น้ำเงิน/แดง (ตามค่า +/-) | ฿XX,XXX |
| ⚖️ จำนวน กก. ขายได้ | ส้ม | XXX กก. |

**📈 Charts Section (Collapsible — เปิด/ปิดได้)**
1. **กราฟแท่ง:** ยอดขาย vs รายจ่าย รายวัน (ตามช่วงที่เลือก)
2. **กราฟเส้น:** กำไรสุทธิรายวัน
3. **กราฟวงกลม:** สัดส่วนสินค้าขายดี (Top 5 + "อื่นๆ") — แยก Tab ระหว่าง "ตามจำนวนเงิน" / "ตามจำนวน กก."
4. **กราฟวงกลม:** สัดส่วนรายจ่าย (ซื้อสินค้า vs รายจ่ายอื่นๆ)

**🏆 Top Lists**
- 🥇 Top 5 สินค้าขายดี (ยอดเงิน + กก.)
- 📅 วันที่ขายดีที่สุดในช่วงเวลานี้

**📜 ประวัติย้อนหลัง**
- ตารางสรุปรายวัน: วันที่ | รายรับ | รายจ่าย | กำไร | [👁️ ดูรายละเอียด] [✏️ แก้ไข] [🗑️ ลบ]

**📤 Export**
- ปุ่ม **[Export Excel/CSV]** → Download ข้อมูลตามช่วงเวลาที่เลือก

#### US-04: แก้ไข/ลบรายการย้อนหลัง
- กด `👁️` บนแถวประวัติ → เปิด Modal แสดงรายการทั้งหมดของวันนั้น
- กด `✏️` → ไปหน้าบันทึก พร้อม pre-fill ข้อมูล
- กด `🗑️` → Confirm Dialog → Soft delete (เก็บไว้ใน DB แต่ flag เป็น deleted)

---

## 4. Data Dictionary & UI Elements

### 4.1 Database Schema (Supabase / PostgreSQL)

#### Table: `profiles` (เชื่อมกับ Supabase Auth)
| Column | Type | Constraint | Note |
|---|---|---|---|
| id | uuid | PK, FK → auth.users | |
| display_name | text | | ชื่อแสดงผล |
| created_at | timestamptz | default now() | |

#### Table: `products` (Master list สำหรับ Dropdown)
| Column | Type | Constraint | Note |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → profiles.id | RLS partition key |
| name | text | NOT NULL | เช่น "ส้ม", "มะม่วง" |
| last_used_at | timestamptz | | สำหรับเรียง Dropdown |
| created_at | timestamptz | default now() | |

> **Auto-insert:** เมื่อ user พิมพ์ชื่อสินค้าใหม่ ระบบจะ insert เข้า table นี้อัตโนมัติ (Upsert)

#### Table: `daily_entries` (หัวรายการประจำวัน)
| Column | Type | Constraint | Note |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK → profiles.id | |
| entry_date | date | NOT NULL | UNIQUE(user_id, entry_date) |
| created_at | timestamptz | | |
| updated_at | timestamptz | | |
| deleted_at | timestamptz | nullable | Soft delete |

#### Table: `sale_items` (รายการขาย — Line items)
| Column | Type | Constraint | Note |
|---|---|---|---|
| id | uuid | PK | |
| entry_id | uuid | FK → daily_entries.id, ON DELETE CASCADE | |
| product_name | text | NOT NULL | เก็บ snapshot ชื่อตอนบันทึก |
| quantity_kg | numeric(10,2) | NOT NULL, >0 | |
| price_per_kg | numeric(10,2) | NOT NULL, >=0 | |
| total | numeric(12,2) | GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED | |
| sort_order | int | | |

#### Table: `extra_incomes` (รายรับอื่น)
| Column | Type | Note |
|---|---|---|
| id | uuid PK | |
| entry_id | uuid FK | |
| description | text NOT NULL | เช่น "ค่าจ้างขนของ" |
| amount | numeric(12,2) NOT NULL | |
| sort_order | int | |

#### Table: `purchase_items` (ซื้อสินค้าเข้าร้าน)
| Column | Type | Note |
|---|---|---|
| id | uuid PK | |
| entry_id | uuid FK | |
| product_name | text NOT NULL | |
| quantity_kg | numeric(10,2) NOT NULL | |
| price_per_kg | numeric(10,2) NOT NULL | |
| total | numeric(12,2) GENERATED | |
| sort_order | int | |

#### Table: `extra_expenses` (รายจ่ายอื่น)
| Column | Type | Note |
|---|---|---|
| id | uuid PK | |
| entry_id | uuid FK | |
| description | text NOT NULL | |
| amount | numeric(12,2) NOT NULL | |
| sort_order | int | |

### 4.2 Row Level Security (RLS) — สำคัญมากบน Supabase
ทุก Table ต้องเปิด RLS และมี Policy:
```sql
-- ตัวอย่าง
CREATE POLICY "Users can only access own data"
ON daily_entries FOR ALL
USING (auth.uid() = user_id);
```

### 4.3 UI Component Inventory
| Component | ใช้ที่ |
|---|---|
| Combobox (Dropdown + free text) | Page 1, 2 |
| Number Input (with decimal) | ทุกช่องราคา/จำนวน |
| Date Picker | Page 1, 2, 3 (filter) |
| Sticky Bottom Bar (Total + Save) | Page 1, 2 |
| Card (Summary) | Page 3 |
| Chart (Bar / Line / Pie) | Page 3 — แนะนำใช้ Recharts หรือ Chart.js |
| Toast / Snackbar | Feedback หลัง Save/Delete |
| Confirm Dialog | ก่อนลบ |
| Bottom Navigation (3 tabs) | ทั้งแอป |

---

## 5. Edge Cases & Exception Handling

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | กรอกราคา/จำนวนเป็น 0 หรือติดลบ | Validate: ต้อง > 0, แสดง error ใต้ช่อง |
| EC-02 | กรอกตัวอักษรในช่อง Number | บล็อกการพิมพ์ + แสดง keyboard ตัวเลขบนมือถือ (`inputmode="decimal"`) |
| EC-03 | กดบันทึกโดยไม่มีรายการเลย | Disable ปุ่ม Save หรือแจ้ง "กรุณาเพิ่มอย่างน้อย 1 รายการ" |
| EC-04 | บันทึกซ้ำวันเดียวกัน 2 ครั้ง | Upsert: ถ้ามีข้อมูลวันนั้นแล้ว ถามว่า "ทับ" หรือ "เพิ่มต่อ" |
| EC-05 | เน็ตหลุดระหว่างบันทึก | เก็บใน LocalStorage queue + Retry อัตโนมัติเมื่อเน็ตกลับ + Toast "บันทึกออฟไลน์ จะ sync เมื่อเน็ตกลับ" |
| EC-06 | Supabase Free Tier ใช้เกิน Quota | แสดงหน้า Error สวยๆ + แนะนำติดต่อแอดมิน |
| EC-07 | ลบแถวสุดท้าย (เหลือ 0 แถว) | คงไว้ 1 แถวว่างเสมอ ไม่ให้ลบทั้งหมด |
| EC-08 | Filter Dashboard ช่วงไม่มีข้อมูล | แสดง Empty State "ไม่มีข้อมูลในช่วงนี้" + แนะนำเปลี่ยนช่วง |
| EC-09 | กรอกตัวเลขทศนิยมเยอะเกิน | Round อัตโนมัติเป็น 2 ตำแหน่ง |
| EC-10 | กดย้อนกลับโดยยังไม่ save | Confirm "ออกโดยไม่บันทึก?" |
| EC-11 | Session หมดอายุระหว่างใช้งาน | Auto save draft → redirect Login → resume draft หลัง login |
| EC-12 | กราฟ render ช้าเพราะข้อมูลเยอะ | Pagination/Aggregate ที่ฝั่ง DB (group by date) |

---

## 6. Compliance & Non-Functional Requirements

### 6.1 Privacy & Security (PDPA)
- ข้อมูลขาย-รายจ่ายเป็นข้อมูลธุรกิจส่วนตัว → RLS บังคับใช้ทุก Table
- Password เก็บผ่าน Supabase Auth (bcrypt) — ไม่เก็บ plain text
- HTTPS only (Supabase + hosting รองรับโดย default)
- ไม่เก็บข้อมูลบุคคลที่สาม (เช่น ชื่อลูกค้า) → ปลอดภัยจาก PDPA scope

### 6.2 Performance
- First Contentful Paint < 1.5s บน 4G
- Time to Interactive < 3s
- Bundle size < 300KB (gzipped)

### 6.3 Accessibility & UX
- Tap target ≥ 44×44 px (Apple HIG)
- Contrast ratio ≥ 4.5:1
- รองรับ Dark mode (Optional, Phase 2)
- ภาษาไทยเป็น Default + รองรับเลขไทย/อารบิก
- รูปแบบเงิน: `฿1,234.56`

### 6.4 Offline Capability
- LocalStorage queue สำหรับกรณีเน็ตหลุด (US-EC-05)
- PWA (Progressive Web App) — Install บน Home screen ได้ (Phase 2 Optional)

### 6.5 Tech Stack (แนะนำ)
| Layer | เทคโนโลยี | เหตุผล |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript** | SEO, SSR, Mobile-optimized, ฟรี deploy บน Vercel |
| UI | **TailwindCSS + shadcn/ui** | Mobile-first, ฟรี, ใช้ง่าย |
| Charts | **Recharts** | Responsive, น้ำหนักเบา |
| Backend/DB | **Supabase (PostgreSQL + Auth + RLS)** | Free tier 500MB, ตามที่ user เลือก |
| Hosting | **Vercel (Free)** | Deploy ง่าย, CDN ทั่วโลก |
| State | **Zustand** หรือ **React Query** | จัดการ state + cache server data |

### 6.6 Supabase Setup Checklist (สำหรับ user ที่เพิ่งเริ่ม)
1. สมัคร supabase.com → สร้าง Project ใหม่ (Region: Singapore — ใกล้ไทยสุด)
2. เก็บ `SUPABASE_URL` + `SUPABASE_ANON_KEY` ใส่ `.env.local`
3. รัน SQL จาก section 4.1 บน **SQL Editor** ของ Supabase
4. เปิด **Authentication → Email Provider** + ปิด "Confirm email" (ตอน dev)
5. เปิด **RLS** ทุก table + เพิ่ม Policies ตาม 4.2
6. ติดตั้ง `@supabase/supabase-js` ใน Next.js project
7. ✅ พร้อมใช้

---

## 📌 Out of Scope (Phase 1)
- ❌ Multi-user / Multi-shop
- ❌ พิมพ์ใบเสร็จ
- ❌ Barcode scanner
- ❌ ระบบสต็อกสินค้า (Inventory)
- ❌ Notification / LINE Notify
- ❌ Dark mode
- ❌ ระบบลูกหนี้ (Credit)

## 📅 ขั้นตอนถัดไป (Recommended)
1. ✅ **Approve PRD นี้**
2. 🎨 ใช้ `/uxui` สร้าง Design System + Mockup
3. 🏗️ ใช้ `/sa` สร้าง Database Schema (SQL Migration) + API Contract
4. 💻 ใช้ `/dev` Generate Code
5. 🧪 ใช้ `/qa` สร้าง Test Cases
6. 🚀 ใช้ `/devops` Deploy ขึ้น Vercel + Supabase
