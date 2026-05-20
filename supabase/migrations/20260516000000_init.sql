-- File: supabase/migrations/20260516000000_init.sql
-- Fruit Sales Tracker — initial schema

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE profiles (
    id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    );
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. PRODUCTS
-- ============================================
CREATE TABLE products (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name         text NOT NULL,
    last_used_at timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);
CREATE INDEX idx_products_user_recent ON products(user_id, last_used_at DESC);

-- ============================================
-- 3. DAILY_ENTRIES
-- ============================================
CREATE TABLE daily_entries (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE(user_id, entry_date)
);
CREATE INDEX idx_entries_user_date ON daily_entries(user_id, entry_date DESC)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_entries
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================
-- 4. SALE_ITEMS
-- ============================================
CREATE TABLE sale_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id     uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    quantity_kg  numeric(10,2) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg numeric(10,2) NOT NULL CHECK (price_per_kg >= 0),
    total        numeric(12,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
    sort_order   int NOT NULL DEFAULT 0
);
CREATE INDEX idx_sale_items_entry ON sale_items(entry_id);

-- ============================================
-- 5. EXTRA_INCOMES
-- ============================================
CREATE TABLE extra_incomes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id    uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount      numeric(12,2) NOT NULL CHECK (amount >= 0),
    sort_order  int NOT NULL DEFAULT 0
);
CREATE INDEX idx_extra_incomes_entry ON extra_incomes(entry_id);

-- ============================================
-- 6. PURCHASE_ITEMS
-- ============================================
CREATE TABLE purchase_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id     uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    quantity_kg  numeric(10,2) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg numeric(10,2) NOT NULL CHECK (price_per_kg >= 0),
    total        numeric(12,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
    sort_order   int NOT NULL DEFAULT 0
);
CREATE INDEX idx_purchase_items_entry ON purchase_items(entry_id);

-- ============================================
-- 7. EXTRA_EXPENSES
-- ============================================
CREATE TABLE extra_expenses (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id    uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount      numeric(12,2) NOT NULL CHECK (amount >= 0),
    sort_order  int NOT NULL DEFAULT 0
);
CREATE INDEX idx_extra_expenses_entry ON extra_expenses(entry_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_incomes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self ON profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY products_owner ON products
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY entries_owner ON daily_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY sale_items_owner ON sale_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM daily_entries e
        WHERE e.id = sale_items.entry_id AND e.user_id = auth.uid()
    ));

CREATE POLICY extra_incomes_owner ON extra_incomes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM daily_entries e
        WHERE e.id = extra_incomes.entry_id AND e.user_id = auth.uid()
    ));

CREATE POLICY purchase_items_owner ON purchase_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM daily_entries e
        WHERE e.id = purchase_items.entry_id AND e.user_id = auth.uid()
    ));

CREATE POLICY extra_expenses_owner ON extra_expenses
    FOR ALL USING (EXISTS (
        SELECT 1 FROM daily_entries e
        WHERE e.id = extra_expenses.entry_id AND e.user_id = auth.uid()
    ));

-- ============================================
-- Atomic upsert RPC (replace child rows in one transaction)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_daily_entry(
    p_entry_date    date,
    p_sales         jsonb,
    p_incomes       jsonb,
    p_purchases     jsonb,
    p_expenses      jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
    v_user_id  uuid := auth.uid();
    v_entry_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO daily_entries (user_id, entry_date)
    VALUES (v_user_id, p_entry_date)
    ON CONFLICT (user_id, entry_date)
    DO UPDATE SET deleted_at = NULL, updated_at = now()
    RETURNING id INTO v_entry_id;

    DELETE FROM sale_items     WHERE entry_id = v_entry_id;
    DELETE FROM extra_incomes  WHERE entry_id = v_entry_id;
    DELETE FROM purchase_items WHERE entry_id = v_entry_id;
    DELETE FROM extra_expenses WHERE entry_id = v_entry_id;

    IF jsonb_array_length(p_sales) > 0 THEN
        INSERT INTO sale_items (entry_id, product_name, quantity_kg, price_per_kg, sort_order)
        SELECT v_entry_id,
               (x->>'product_name')::text,
               (x->>'quantity_kg')::numeric,
               (x->>'price_per_kg')::numeric,
               COALESCE((x->>'sort_order')::int, 0)
        FROM jsonb_array_elements(p_sales) x;

        INSERT INTO products (user_id, name, last_used_at)
        SELECT v_user_id, (x->>'product_name')::text, now()
        FROM jsonb_array_elements(p_sales) x
        ON CONFLICT (user_id, name)
        DO UPDATE SET last_used_at = EXCLUDED.last_used_at;
    END IF;

    IF jsonb_array_length(p_incomes) > 0 THEN
        INSERT INTO extra_incomes (entry_id, description, amount, sort_order)
        SELECT v_entry_id,
               (x->>'description')::text,
               (x->>'amount')::numeric,
               COALESCE((x->>'sort_order')::int, 0)
        FROM jsonb_array_elements(p_incomes) x;
    END IF;

    IF jsonb_array_length(p_purchases) > 0 THEN
        INSERT INTO purchase_items (entry_id, product_name, quantity_kg, price_per_kg, sort_order)
        SELECT v_entry_id,
               (x->>'product_name')::text,
               (x->>'quantity_kg')::numeric,
               (x->>'price_per_kg')::numeric,
               COALESCE((x->>'sort_order')::int, 0)
        FROM jsonb_array_elements(p_purchases) x;

        INSERT INTO products (user_id, name, last_used_at)
        SELECT v_user_id, (x->>'product_name')::text, now()
        FROM jsonb_array_elements(p_purchases) x
        ON CONFLICT (user_id, name)
        DO UPDATE SET last_used_at = EXCLUDED.last_used_at;
    END IF;

    IF jsonb_array_length(p_expenses) > 0 THEN
        INSERT INTO extra_expenses (entry_id, description, amount, sort_order)
        SELECT v_entry_id,
               (x->>'description')::text,
               (x->>'amount')::numeric,
               COALESCE((x->>'sort_order')::int, 0)
        FROM jsonb_array_elements(p_expenses) x;
    END IF;

    RETURN v_entry_id;
END;
$$;

-- ============================================
-- Dashboard helpers
-- ============================================
CREATE OR REPLACE VIEW daily_summary
WITH (security_invoker = true) AS
SELECT
    e.id          AS entry_id,
    e.user_id,
    e.entry_date,
    COALESCE((SELECT SUM(total)  FROM sale_items     WHERE entry_id = e.id), 0)
      + COALESCE((SELECT SUM(amount) FROM extra_incomes WHERE entry_id = e.id), 0) AS total_income,
    COALESCE((SELECT SUM(total)  FROM purchase_items WHERE entry_id = e.id), 0)
      + COALESCE((SELECT SUM(amount) FROM extra_expenses WHERE entry_id = e.id), 0) AS total_expense,
    COALESCE((SELECT SUM(quantity_kg) FROM sale_items WHERE entry_id = e.id), 0) AS total_kg_sold
FROM daily_entries e
WHERE e.deleted_at IS NULL;

CREATE OR REPLACE FUNCTION top_products(
    p_from date,
    p_to   date,
    p_limit int DEFAULT 5
) RETURNS TABLE (product_name text, total_amount numeric, total_kg numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
    SELECT s.product_name,
           SUM(s.total)       AS total_amount,
           SUM(s.quantity_kg) AS total_kg
    FROM sale_items s
    JOIN daily_entries e ON e.id = s.entry_id
    WHERE e.user_id = auth.uid()
      AND e.deleted_at IS NULL
      AND e.entry_date BETWEEN p_from AND p_to
    GROUP BY s.product_name
    ORDER BY total_amount DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION expense_breakdown(
    p_from date,
    p_to   date
) RETURNS TABLE (purchase_total numeric, other_total numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
    SELECT
      COALESCE((SELECT SUM(pi.total) FROM purchase_items pi
                JOIN daily_entries e ON e.id = pi.entry_id
                WHERE e.user_id = auth.uid()
                  AND e.deleted_at IS NULL
                  AND e.entry_date BETWEEN p_from AND p_to), 0) AS purchase_total,
      COALESCE((SELECT SUM(ex.amount) FROM extra_expenses ex
                JOIN daily_entries e ON e.id = ex.entry_id
                WHERE e.user_id = auth.uid()
                  AND e.deleted_at IS NULL
                  AND e.entry_date BETWEEN p_from AND p_to), 0) AS other_total;
$$;
