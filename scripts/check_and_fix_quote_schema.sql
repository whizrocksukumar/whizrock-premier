-- Quick check and fix for quote schema alignment
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Check current schema
-- ========================================
SELECT 'Current quote_sections columns:' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_sections'
ORDER BY ordinal_position;

SELECT 'Current quote_line_items columns:' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_line_items'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: Add missing columns
-- ========================================

-- Fix quote_sections
ALTER TABLE quote_sections
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS app_type_id UUID REFERENCES app_types(id),
ADD COLUMN IF NOT EXISTS custom_name TEXT,
ADD COLUMN IF NOT EXISTS section_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Fix quote_line_items
ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES quote_sections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS marker TEXT,
ADD COLUMN IF NOT EXISTS area_sqm DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_labour BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS packs_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_sell DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5,2) DEFAULT 0;

-- Fix quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'Retail',
ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 60,
ADD COLUMN IF NOT EXISTS waste_percent DECIMAL(5,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS labour_rate DECIMAL(10,2) DEFAULT 3.00,
ADD COLUMN IF NOT EXISTS total_cost_ex_gst DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sell_ex_gst DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_inc_gst DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_profit_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS site_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id),
ADD COLUMN IF NOT EXISTS job_type TEXT;

-- ========================================
-- STEP 3: Add indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id ON quote_sections(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_sections_app_type_id ON quote_sections(app_type_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_section_id ON quote_line_items(section_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_product_id ON quote_line_items(product_id);

-- ========================================
-- STEP 4: Verify the fixes
-- ========================================
SELECT 'Updated quote_sections columns:' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_sections'
ORDER BY ordinal_position;

SELECT 'Updated quote_line_items columns:' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_line_items'
ORDER BY ordinal_position;

SELECT '✅ Schema alignment complete!' as status;
