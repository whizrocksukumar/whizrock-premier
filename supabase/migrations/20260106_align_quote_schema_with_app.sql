-- Migration: Align quote schema with application requirements
-- Ensures quote_sections and quote_line_items match what the app expects

-- ========================================
-- 1. UPDATE QUOTE_SECTIONS TABLE
-- ========================================

-- Add columns expected by the new quote page if they don't exist
ALTER TABLE quote_sections
ADD COLUMN IF NOT EXISTS app_type_id UUID REFERENCES app_types(id),
ADD COLUMN IF NOT EXISTS custom_name TEXT,
ADD COLUMN IF NOT EXISTS section_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add quote_id if it doesn't exist (should already be there)
ALTER TABLE quote_sections
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id
ON quote_sections(quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_sections_app_type_id
ON quote_sections(app_type_id);

-- ========================================
-- 2. UPDATE QUOTE_LINE_ITEMS TABLE
-- ========================================

-- Add section_id column to support 3-tier structure
ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES quote_sections(id) ON DELETE CASCADE;

-- Add additional columns expected by the app
ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS marker TEXT,
ADD COLUMN IF NOT EXISTS area_sqm DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_labour BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_sell DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS packs_required INTEGER DEFAULT 0;

-- Rename existing columns to match app expectations (if they exist with different names)
DO $$
BEGIN
    -- Rename unit_cost to cost_price if it exists and cost_price doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'quote_line_items' AND column_name = 'unit_cost')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'quote_line_items' AND column_name = 'cost_price')
    THEN
        ALTER TABLE quote_line_items RENAME COLUMN unit_cost TO cost_price;
    END IF;

    -- Rename unit_price to sell_price if it exists and sell_price doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'quote_line_items' AND column_name = 'unit_price')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'quote_line_items' AND column_name = 'sell_price')
    THEN
        ALTER TABLE quote_line_items RENAME COLUMN unit_price TO sell_price;
    END IF;

    -- Rename product_code to marker if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'quote_line_items' AND column_name = 'product_code')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'quote_line_items' AND column_name = 'marker')
    THEN
        ALTER TABLE quote_line_items RENAME COLUMN product_code TO marker;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_line_items_section_id
ON quote_line_items(section_id);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id
ON quote_line_items(quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_product_id
ON quote_line_items(product_id);

-- ========================================
-- 3. UPDATE QUOTES TABLE
-- ========================================

-- Add any missing columns that the app expects
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
-- 4. VERIFICATION
-- ========================================

-- Display the updated schema
SELECT 'quote_sections columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_sections'
ORDER BY ordinal_position;

SELECT 'quote_line_items columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_line_items'
ORDER BY ordinal_position;

SELECT 'quotes additional columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes'
  AND column_name IN ('pricing_tier', 'markup_percent', 'waste_percent', 'labour_rate',
                      'total_cost_ex_gst', 'total_sell_ex_gst', 'total_inc_gst',
                      'gross_profit_percent', 'site_address', 'city', 'postcode', 'region_id', 'job_type')
ORDER BY ordinal_position;
