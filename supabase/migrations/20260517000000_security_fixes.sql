-- Security fix: explicit user_id filter on daily_summary view
-- Prevents data leakage if RLS on underlying tables is ever misconfigured.
CREATE OR REPLACE VIEW daily_summary
WITH (security_invoker = true) AS
SELECT
    e.id          AS entry_id,
    e.user_id,
    e.entry_date,
    COALESCE((SELECT SUM(total)       FROM sale_items      WHERE entry_id = e.id), 0)
      + COALESCE((SELECT SUM(amount)  FROM extra_incomes   WHERE entry_id = e.id), 0) AS total_income,
    COALESCE((SELECT SUM(total)       FROM purchase_items  WHERE entry_id = e.id), 0)
      + COALESCE((SELECT SUM(amount)  FROM extra_expenses  WHERE entry_id = e.id), 0) AS total_expense,
    COALESCE((SELECT SUM(quantity_kg) FROM sale_items      WHERE entry_id = e.id), 0) AS total_kg_sold
FROM daily_entries e
WHERE e.deleted_at IS NULL
  AND e.user_id = auth.uid();
