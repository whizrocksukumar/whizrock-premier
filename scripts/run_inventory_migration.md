# Run Inventory Inward Receipts Migration

## Steps to Execute:

### 1. Open Supabase SQL Editor
Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

### 2. Copy and Paste Migration File
Open file: `supabase/migrations/20260107_inventory_inward_receipts.sql`

Copy entire contents and paste into the SQL Editor.

### 3. Run the Migration
Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)

### 4. Verify Success
You should see these success messages:
```
✅ Inventory Inward Receipts Migration Complete
   - Vendors table created with auto-code generation
   - GRN (Goods Received Notes) tables created
   - Job stock allocations table created
   - Stock movements enhanced with new types
   - 3 functions created: post_grn, reserve_job_stock, complete_job_stock
```

### 5. Verify Tables Created

Run this query to check all tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'vendors',
    'goods_received_notes',
    'grn_line_items',
    'job_stock_allocations'
  )
ORDER BY table_name;
```

Expected output:
- goods_received_notes
- grn_line_items
- job_stock_allocations
- vendors

### 6. Test Vendor Code Generation

```sql
-- Insert a test vendor (code will auto-generate)
INSERT INTO vendors (vendor_name, contact_person, email, phone, is_active)
VALUES ('Test Supplier Ltd', 'John Smith', 'john@testsupplier.co.nz', '09-123-4567', true)
RETURNING vendor_code, vendor_name;
```

Expected result: `VEN-001 | Test Supplier Ltd`

### 7. Test GRN Number Generation

```sql
-- Insert a test GRN
INSERT INTO goods_received_notes (
  vendor_id,
  received_date,
  status
)
SELECT id, CURRENT_DATE, 'Draft'
FROM vendors
WHERE vendor_code = 'VEN-001'
RETURNING grn_number;
```

Expected result: `GRN-20260107-001` (with today's date)

### 8. Check Functions Exist

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('post_grn', 'reserve_job_stock', 'complete_job_stock')
ORDER BY routine_name;
```

Expected output:
- complete_job_stock
- post_grn
- reserve_job_stock

## Troubleshooting:

### Error: "function update_updated_at_column() does not exist"

This function should exist from previous migrations. If not, add it:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation 'products' does not exist"

The products table should exist from previous migrations. Verify:

```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'products';
```

### Error: "relation 'jobs' does not exist"

The jobs table should exist. The migration handles this gracefully with conditional foreign keys.

## Next Steps:

After successful migration:
1. ✅ Build Vendor Management UI
2. ✅ Build GRN/Inward Receipts UI
3. ✅ Enhance Quote page with stock display
4. ✅ Create Job Stock Allocation UI

All ready to proceed!
