-- ============================================================
-- Add Chinese (_zh) language columns + auto-translate support
-- Run on VPS:
--   sudo -u postgres psql -p 5440 -d smtrade_db -f \
--     /var/www/sm-trade-international/database/migrations/2026-04-add-zh-columns.sql
-- ============================================================

-- ── Categories ──────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_zh        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_zh TEXT          DEFAULT '';

-- ── Products ────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_zh              TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_zh       TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_description_zh TEXT          DEFAULT '';

-- ── Product Variants ────────────────────────────────────────
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS variant_label_zh TEXT NOT NULL DEFAULT '';

-- ── Gallery ─────────────────────────────────────────────────
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS title_zh TEXT NOT NULL DEFAULT '';

-- ── About page ──────────────────────────────────────────────
ALTER TABLE public.about_page
  ADD COLUMN IF NOT EXISTS content_zh TEXT NOT NULL DEFAULT '';

-- ── SEO meta ────────────────────────────────────────────────
ALTER TABLE public.seo_meta
  ADD COLUMN IF NOT EXISTS meta_title_zh       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description_zh TEXT NOT NULL DEFAULT '';

-- ── Hero slides (title/subtitle are flat, no _en/_bn — keep as-is) ──
-- We'll store translated overrides in a JSON column for flexibility:
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
-- shape: { "bn": {"title": "...", "subtitle": "...", "cta_text": "..."},
--         "zh": {"title": "...", "subtitle": "...", "cta_text": "..."} }

-- ── Translation status tracking (optional, for bulk-translate UI) ──
CREATE TABLE IF NOT EXISTS public.translation_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending|running|done|error
  total_rows   INTEGER NOT NULL DEFAULT 0,
  done_rows    INTEGER NOT NULL DEFAULT 0,
  error_msg    TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);

-- Done.
SELECT '✅ Chinese columns added successfully' AS result;
