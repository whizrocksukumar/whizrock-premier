-- Migration: Add section_id to quote_line_items for 3-tier structure
-- This allows: quotes → quote_sections → quote_line_items

-- 1. Add section_id column (nullable for now to allow existing data)
ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES quote_sections(id) ON DELETE CASCADE;

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_quote_line_items_section_id
ON quote_line_items(section_id);

-- 3. Keep quote_id for backward compatibility (some items might not have sections)
-- This allows both structures:
--   - Direct: quote → line_items (quote_id)
--   - Hierarchical: quote → section → line_items (section_id)

-- 4. Verify the change
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_line_items'
  AND column_name IN ('quote_id', 'section_id')
ORDER BY ordinal_position;
