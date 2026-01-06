-- Copy and paste this into Supabase SQL Editor to see full schema

-- QUOTES TABLE
SELECT
    'quotes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotes'
ORDER BY ordinal_position;

-- QUOTE_SECTIONS TABLE
SELECT
    'quote_sections' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quote_sections'
ORDER BY ordinal_position;

-- QUOTE_LINE_ITEMS TABLE
SELECT
    'quote_line_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quote_line_items'
ORDER BY ordinal_position;
