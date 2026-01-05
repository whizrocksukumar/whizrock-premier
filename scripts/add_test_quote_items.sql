-- Add test quote sections and line items for testing
-- Quote ID: ea542b67-2645-4606-8090-c145e6072f11 (QUO-2025-0024)

-- First, let's add a section
INSERT INTO quote_sections (
  id,
  quote_id,
  section_name,
  application_type,
  colour,
  sort_order
) VALUES (
  gen_random_uuid(),
  'ea542b67-2645-4606-8090-c145e6072f11',
  'Ceiling Insulation',
  'Ceiling',
  '#4CAF50',
  1
) ON CONFLICT DO NOTHING
RETURNING id;

-- Store the section ID for the next insert
-- You'll need to replace <SECTION_ID> below with the actual UUID returned above

-- Add some line items (replace <SECTION_ID> with the actual section ID from above)
-- Item 1: Pink Batts R3.6 Ceiling
INSERT INTO quote_line_items (
  id,
  quote_id,
  section_id,
  product_code,
  description,
  quantity,
  unit_price,
  line_total,
  is_labour,
  sort_order
) VALUES (
  gen_random_uuid(),
  'ea542b67-2645-4606-8090-c145e6072f11',
  '<SECTION_ID>',  -- Replace with actual section ID
  'PB-R36-C',
  'Pink Batts R3.6 Ceiling Insulation',
  100.00,
  15.50,
  1550.00,
  false,
  1
);

-- Item 2: Labour
INSERT INTO quote_line_items (
  id,
  quote_id,
  section_id,
  product_code,
  description,
  quantity,
  unit_price,
  line_total,
  is_labour,
  sort_order
) VALUES (
  gen_random_uuid(),
  'ea542b67-2645-4606-8090-c145e6072f11',
  '<SECTION_ID>',  -- Replace with actual section ID
  'LABOUR-CEILING',
  'Labour - Ceiling Installation',
  100.00,
  8.50,
  850.00,
  true,
  2
);

-- Update the quote totals
UPDATE quotes
SET
  total_sell = 2400.00,
  gst_amount = 360.00,
  total_amount = 2760.00
WHERE id = 'ea542b67-2645-4606-8090-c145e6072f11';
