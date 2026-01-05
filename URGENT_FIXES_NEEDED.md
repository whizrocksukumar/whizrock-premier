# URGENT FIXES NEEDED - Quote System

**Date:** January 6, 2026
**Priority:** HIGH - Must fix before testing new quote creation

---

## 🚨 Critical Issue Discovered

The new quote page is trying to insert into a 3-tier structure (`quotes` → `quote_sections` → `quote_items`), but the actual database has a different schema.

### Current Database Reality:
- ✅ `quotes` - EXISTS with many columns
- ✅ `quote_sections` - EXISTS but EMPTY (no data)
- ✅ `quote_line_items` - EXISTS with data (NOT `quote_items`)
- ❌ `quote_items` - DOES NOT EXIST

### What the App Expects:
- `quotes` with new columns: `pricing_tier`, `markup_percent`, `waste_percent`, `labour_rate`, etc.
- `quote_sections` with columns: `quote_id`, `app_type_id`, `custom_name`, `section_color`, `sort_order`
- `quote_line_items` (or rename to `quote_items`) with: `section_id`, `product_id`, `marker`, `area_sqm`, `is_labour`, `cost_price`, `sell_price`, `line_cost`, `line_sell`, `margin_percent`, `packs_required`

---

## ✅ Step 1: Fix Database Schema (PRIORITY 1)

### Run This SQL in Supabase SQL Editor:

**File:** `scripts/check_and_fix_quote_schema.sql`

```sql
-- Copy the entire content from scripts/check_and_fix_quote_schema.sql
-- and run it in Supabase SQL Editor
```

**What it does:**
1. ✅ Adds missing columns to `quote_sections`
2. ✅ Adds missing columns to `quote_line_items` (including `section_id`)
3. ✅ Adds missing columns to `quotes` table
4. ✅ Creates necessary indexes for performance
5. ✅ Verifies the schema is correct

**Expected Result:**
- `quote_sections` will have: `quote_id`, `app_type_id`, `custom_name`, `section_color`, `sort_order`
- `quote_line_items` will have: `section_id`, `product_id`, `marker`, `area_sqm`, `is_labour`, `packs_required`, `cost_price`, `sell_price`, `line_cost`, `line_sell`, `margin_percent`
- `quotes` will have: `pricing_tier`, `markup_percent`, `waste_percent`, `labour_rate`, `total_cost_ex_gst`, `total_sell_ex_gst`, `total_inc_gst`, `gross_profit_percent`, `site_address`, `city`, `postcode`, `region_id`, `job_type`

---

## ✅ Step 2: Fix New Quote Page (PRIORITY 2)

The new quote page at `src/app/quotes/new/page.tsx` tries to insert into `quote_items` table which doesn't exist.

### Changes Needed:

**Line 534:** Change table name
```typescript
// BEFORE:
const { error: itemsError } = await supabase
  .from('quote_items')  // ❌ WRONG - table doesn't exist
  .insert(itemsToInsert);

// AFTER:
const { error: itemsError } = await supabase
  .from('quote_line_items')  // ✅ CORRECT - actual table name
  .insert(itemsToInsert);
```

**Verify all column names match** what's expected in the insert statement (lines 516-530):
- `section_id` (links to quote_sections)
- `product_id`
- `marker`
- `description`
- `area_sqm`
- `is_labour`
- `cost_price`
- `sell_price`
- `line_cost`
- `line_sell`
- `margin_percent`
- `packs_required`
- `sort_order`

---

## ✅ Step 3: Fix Quote Detail Page (PRIORITY 3)

The detail page at `src/app/quotes/[id]/page.tsx` also needs to use the correct table name.

### Changes Needed:

**Line 181:** Already corrected to `quote_items` but should be `quote_line_items`
```typescript
// CURRENT (WRONG):
const { data: quoteItemsData, error: itemsError } = await supabase
  .from('quote_items')  // ❌ WRONG
  .select('*')

// SHOULD BE:
const { data: quoteItemsData, error: itemsError } = await supabase
  .from('quote_line_items')  // ✅ CORRECT
  .select('*')
```

---

## ✅ Step 4: Fix Client Selector in New Quote Page (PRIORITY 2)

**Problem:** The Client Selector shows "Create New Client" button which opens a drawer with "Create New Site" form, causing duplicate site creation.

**Solution:** Use the new simplified component in contexts where site creation happens.

### For New Quote Page:

Replace the import and usage:

```typescript
// BEFORE:
import ClientSelector from '@/components/ClientSelector'

// AFTER:
import ClientSelectorSimple from '@/components/ClientSelectorSimple'

// Then use:
<ClientSelectorSimple
  onClientSelected={handleClientSelect}
  onClear={handleClearClient}
  placeholder="Search for client..."
  label="Select Client"
/>
```

**New Component:** `src/components/ClientSelectorSimple.tsx`
- ✅ No "Create New Client" button
- ✅ No drawer with site creation
- ✅ Same search functionality
- ✅ Prevents duplicate site creation

---

## 📋 Step 5: Testing Checklist

After applying all fixes above:

### Test New Quote Creation:
1. ☐ Navigate to `/quotes/new`
2. ☐ Select a client using the simplified selector
3. ☐ Add at least one section with application type
4. ☐ Add at least one product line item
5. ☐ Set pricing tier (Retail/Trade/VIP)
6. ☐ Click "Save Quote"
7. ☐ Verify quote saves successfully
8. ☐ Check Supabase:
   - ☐ New record in `quotes` table
   - ☐ New record(s) in `quote_sections` table
   - ☐ New record(s) in `quote_line_items` table with `section_id` populated

### Test Quote Detail Page:
1. ☐ Navigate to a saved quote `/quotes/{id}`
2. ☐ Verify sections display with colors
3. ☐ Verify line items show under each section
4. ☐ Verify pricing calculations (cost, sell, GP%)
5. ☐ Verify totals are correct
6. ☐ Verify sales rep displays (if assigned)

### Test Client Selector:
1. ☐ New quote page shows simplified selector (no "Create New" button)
2. ☐ Can search and select existing clients
3. ☐ No duplicate site creation when saving quote
4. ☐ Other pages (opportunities, assessments) still show full selector with "Create New" button

---

## 🔍 Verification Queries

### Run these in Supabase SQL Editor to verify:

```sql
-- Check quote_sections has required columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'quote_sections'
  AND column_name IN ('quote_id', 'app_type_id', 'custom_name', 'section_color', 'sort_order')
ORDER BY column_name;
-- Should return 5 rows

-- Check quote_line_items has section_id
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'quote_line_items'
  AND column_name IN ('section_id', 'product_id', 'marker', 'area_sqm', 'is_labour',
                      'cost_price', 'sell_price', 'line_cost', 'line_sell',
                      'margin_percent', 'packs_required')
ORDER BY column_name;
-- Should return 11 rows

-- Check quotes has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'quotes'
  AND column_name IN ('pricing_tier', 'markup_percent', 'waste_percent', 'labour_rate',
                      'total_cost_ex_gst', 'total_sell_ex_gst', 'total_inc_gst',
                      'gross_profit_percent', 'site_address', 'city', 'postcode',
                      'region_id', 'job_type')
ORDER BY column_name;
-- Should return 13 rows
```

---

## 📝 Files Created/Modified

### New Files:
- ✅ `supabase/migrations/20260106_add_section_id_to_quote_line_items.sql`
- ✅ `supabase/migrations/20260106_align_quote_schema_with_app.sql`
- ✅ `scripts/check_and_fix_quote_schema.sql` (Use this one!)
- ✅ `src/components/ClientSelectorSimple.tsx`
- ✅ `URGENT_FIXES_NEEDED.md` (this file)

### Files to Modify:
- ⚠️ `src/app/quotes/new/page.tsx` - Line 534: Change `quote_items` → `quote_line_items`
- ⚠️ `src/app/quotes/[id]/page.tsx` - Line 181: Change `quote_items` → `quote_line_items`

### Files to Update (Lower Priority):
- `src/app/quotes/page.tsx` - May need schema updates
- `src/app/quotes/[id]/edit/page.tsx` - If it exists

---

## ⚠️ Important Notes

1. **BACKUP DATABASE FIRST** before running schema changes
2. The schema changes are ADDITIVE (only adds columns, doesn't delete)
3. Existing data in `quote_line_items` will remain intact
4. After schema update, existing quotes won't have sections (that's OK)
5. New quotes will use the 3-tier structure (quotes → sections → line_items)

---

## 🎯 Priority Order

1. **FIRST:** Run the SQL schema fix (`scripts/check_and_fix_quote_schema.sql`)
2. **SECOND:** Fix new quote page table name (`quote_items` → `quote_line_items`)
3. **SECOND:** Fix client selector (use `ClientSelectorSimple` in new quote page)
4. **THIRD:** Fix quote detail page table name
5. **FOURTH:** Test everything thoroughly

---

## 🆘 If Something Goes Wrong

### Revert Schema Changes:
```sql
-- Remove added columns from quote_line_items
ALTER TABLE quote_line_items
DROP COLUMN IF EXISTS section_id,
DROP COLUMN IF EXISTS marker,
DROP COLUMN IF EXISTS area_sqm,
DROP COLUMN IF EXISTS is_labour,
DROP COLUMN IF EXISTS packs_required,
DROP COLUMN IF EXISTS cost_price,
DROP COLUMN IF EXISTS sell_price,
DROP COLUMN IF EXISTS line_cost,
DROP COLUMN IF EXISTS line_sell,
DROP COLUMN IF EXISTS margin_percent;

-- Remove added columns from quote_sections
ALTER TABLE quote_sections
DROP COLUMN IF EXISTS app_type_id,
DROP COLUMN IF EXISTS custom_name,
DROP COLUMN IF EXISTS section_color,
DROP COLUMN IF EXISTS sort_order;
```

### Check Error Logs:
- Browser console (F12)
- Network tab for Supabase errors
- Supabase logs dashboard

---

**Last Updated:** January 6, 2026, 12:30 AM
**Status:** Ready for implementation
