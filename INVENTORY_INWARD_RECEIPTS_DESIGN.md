# Premier Insulation - Inventory Inward Receipts & Vendor Management Design

**Date:** January 7, 2026
**Purpose:** Complete stock management with inward receipts, vendor tracking, and job-based stock allocation
**Status:** Design Document - Ready for Implementation

---

## 📋 Executive Summary

This document extends the existing inventory system to include:

1. **Vendor Management** - Track suppliers and their contact information
2. **Inward Receipts (GRN)** - Formal goods receiving process with vendor details
3. **Enhanced Stock Reservation** - Allocate stock to jobs at scheduling time
4. **Automatic Stock Allocation** - When job scheduled, reserve stock; on completion, mark as used
5. **Quote Stock Display** - Show available vs reserved stock during quote creation

---

## 🏗️ Database Schema Changes

### 1. New Table: `vendors`

Stores supplier/vendor information for purchases and tracking.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_code TEXT UNIQUE NOT NULL,  -- VEN-001, VEN-002
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'New Zealand',

  -- Payment terms
  payment_terms TEXT DEFAULT 'Net 30',  -- Net 30, Net 60, COD, etc.
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_preferred BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,
  internal_notes TEXT,  -- Not visible to vendor

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES team_members(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES team_members(id)
);

-- Auto-generate vendor code
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM vendors
  WHERE vendor_code LIKE 'VEN-%';

  new_code := 'VEN-' || LPAD(next_number::TEXT, 3, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate vendor code
CREATE TRIGGER set_vendor_code_trigger
BEFORE INSERT ON vendors
FOR EACH ROW
WHEN (NEW.vendor_code IS NULL)
EXECUTE FUNCTION generate_vendor_code();

-- Indexes
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_name ON vendors(vendor_name);
CREATE INDEX idx_vendors_active ON vendors(is_active) WHERE is_active = true;
```

---

### 2. New Table: `goods_received_notes` (GRN)

Records incoming stock from vendors.

```sql
CREATE TABLE goods_received_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_number TEXT UNIQUE NOT NULL,  -- GRN-YYYYMMDD-XXX

  -- Vendor information
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_invoice_number TEXT,  -- Vendor's invoice/delivery note number
  vendor_invoice_date DATE,

  -- Receipt details
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_time TIME,
  warehouse_location TEXT DEFAULT 'Main Warehouse',

  -- Reference
  purchase_order_number TEXT,  -- Future: link to PO table
  reference_notes TEXT,  -- e.g., "Restock for busy season"

  -- Status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Received', 'Posted', 'Cancelled')),
  -- Draft: Being entered
  -- Received: Goods received, pending posting
  -- Posted: Stock levels updated (final)
  -- Cancelled: Voided

  -- Totals
  total_items INTEGER DEFAULT 0,  -- Count of line items
  total_cost NUMERIC DEFAULT 0,  -- Total ex GST
  gst_amount NUMERIC DEFAULT 0,
  total_inc_gst NUMERIC DEFAULT 0,

  -- Audit
  received_by UUID REFERENCES team_members(id),  -- Who received the goods
  posted_by UUID REFERENCES team_members(id),  -- Who posted to stock
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES team_members(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auto-generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  next_seq INTEGER;
  new_grn TEXT;
BEGIN
  today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number FROM 18) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM goods_received_notes
  WHERE grn_number LIKE 'GRN-' || today_str || '-%';

  new_grn := 'GRN-' || today_str || '-' || LPAD(next_seq::TEXT, 3, '0');
  RETURN new_grn;
END;
$$ LANGUAGE plpgsql;

-- Trigger for GRN number
CREATE TRIGGER set_grn_number_trigger
BEFORE INSERT ON goods_received_notes
FOR EACH ROW
WHEN (NEW.grn_number IS NULL)
EXECUTE FUNCTION generate_grn_number();

-- Indexes
CREATE INDEX idx_grn_number ON goods_received_notes(grn_number);
CREATE INDEX idx_grn_vendor ON goods_received_notes(vendor_id);
CREATE INDEX idx_grn_date ON goods_received_notes(received_date DESC);
CREATE INDEX idx_grn_status ON goods_received_notes(status);
```

---

### 3. New Table: `grn_line_items`

Individual products received in each GRN.

```sql
CREATE TABLE grn_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_id UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  quantity_ordered NUMERIC,  -- What was ordered (if known)
  quantity_received NUMERIC NOT NULL CHECK (quantity_received > 0),
  unit TEXT,  -- m2, pack, box, kg, etc.

  -- Pricing
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,

  -- Quality check
  condition TEXT DEFAULT 'Good' CHECK (condition IN ('Good', 'Damaged', 'Defective')),
  notes TEXT,  -- e.g., "2 damaged packs noted"

  -- Tracking
  batch_number TEXT,  -- For traceability
  expiry_date DATE,  -- If applicable

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grn_line_grn ON grn_line_items(grn_id);
CREATE INDEX idx_grn_line_product ON grn_line_items(product_id);
```

---

### 4. Enhanced `stock_movements` Table

Update existing movement types to include inward receipts.

```sql
-- Current movement_type values:
-- 'INWARD', 'RESERVED', 'ALLOCATED', 'RETURNED', 'ADJUSTMENT', 'STOCK_TAKE'

-- Add new movement types (via migration):
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_movement_type_check
CHECK (movement_type IN (
  'Receipt',              -- Inward from GRN (was 'INWARD')
  'Issue',                -- Outward to job
  'Reserved',             -- Allocated to scheduled job
  'Released',             -- Reservation cancelled/released
  'Adjustment Increase',  -- Manual stock count up
  'Adjustment Decrease',  -- Manual stock count down
  'Transfer Out',         -- Move to another warehouse
  'Transfer In',          -- Receive from another warehouse
  'Return',               -- Return from job
  'Damaged',              -- Write-off damaged goods
  'Expired'               -- Write-off expired goods
));

-- Add GRN reference
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS grn_id UUID REFERENCES goods_received_notes(id);

-- Index for GRN reference
CREATE INDEX IF NOT EXISTS idx_stock_movements_grn ON stock_movements(grn_id);
```

---

### 5. New Table: `job_stock_allocations`

Track which stock is allocated to which jobs, including reservation and usage status.

```sql
CREATE TABLE job_stock_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  quantity_quoted NUMERIC NOT NULL,  -- From quote line items
  quantity_allocated NUMERIC NOT NULL DEFAULT 0,  -- Reserved for this job
  quantity_used NUMERIC DEFAULT 0,  -- Actually used (after job completion)
  quantity_returned NUMERIC DEFAULT 0,  -- Returned to stock

  unit TEXT NOT NULL,

  -- Status tracking
  allocation_status TEXT DEFAULT 'Pending' CHECK (
    allocation_status IN ('Pending', 'Reserved', 'Issued', 'Completed')
  ),
  -- Pending: Job created, stock not yet reserved
  -- Reserved: Stock allocated when job scheduled
  -- Issued: Job started, materials issued
  -- Completed: Job done, actual usage recorded

  -- Timestamps
  reserved_at TIMESTAMP,
  issued_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_job_stock_job ON job_stock_allocations(job_id);
CREATE INDEX idx_job_stock_product ON job_stock_allocations(product_id);
CREATE INDEX idx_job_stock_status ON job_stock_allocations(allocation_status);

-- Unique constraint: one allocation per job-product combination
CREATE UNIQUE INDEX idx_job_stock_unique ON job_stock_allocations(job_id, product_id);
```

---

## 🔄 Stock Flow Workflow

### A. Inward Receipt Process (GRN)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GOODS ARRIVE FROM VENDOR                                     │
│    Staff navigates to: /inventory/receive                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CREATE NEW GRN                                               │
│    - Select vendor (fuzzy search dropdown)                      │
│    - Enter vendor invoice number                                │
│    - Enter invoice date                                         │
│    - Enter received date/time                                   │
│    - Select warehouse location                                  │
│    - Add reference/PO number (optional)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ADD LINE ITEMS                                               │
│    For each product received:                                   │
│    - Search product (fuzzy search with SKU + description)       │
│    - Enter quantity received                                    │
│    - Enter unit cost (ex GST)                                   │
│    - Select condition (Good/Damaged/Defective)                  │
│    - Add batch number (optional)                                │
│    - Add expiry date (optional)                                 │
│    - Add notes (optional)                                       │
│                                                                  │
│    System calculates:                                           │
│    - Line total = quantity × unit_cost                          │
│    - Total ex GST (sum of all line totals)                      │
│    - GST amount (15%)                                           │
│    - Total inc GST                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SAVE AS DRAFT (Optional)                                     │
│    - GRN saved with status = 'Draft'                            │
│    - Stock not yet updated                                      │
│    - Can edit/add items later                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. POST GRN (Final)                                             │
│    When ready to update stock:                                  │
│    - Click "Post GRN" button                                    │
│    - System creates stock_movements records:                    │
│      * movement_type = 'Receipt'                                │
│      * quantity = quantity_received                             │
│      * reference_number = GRN number                            │
│      * grn_id = this GRN                                        │
│      * notes = "Received from [Vendor Name]"                    │
│    - Updates stock_levels:                                      │
│      * quantity_on_hand += quantity_received                    │
│    - Updates product.unit_cost (latest cost)                    │
│    - GRN status → 'Posted'                                      │
│    - Sets posted_at timestamp                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. STOCK LEVELS UPDATED                                         │
│    - Available stock increases                                  │
│    - Low stock alerts cleared (if above reorder level)          │
│    - Stock history shows inward movement                        │
│    - Ready for allocation to jobs                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### B. Job Stock Allocation Process

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. QUOTE CREATED                                                │
│    - Products added as line items                               │
│    - System shows stock availability:                           │
│      * Available = quantity_on_hand - quantity_reserved         │
│      * Reserved = stock allocated to other jobs                 │
│      * Status indicator:                                        │
│        ✓ In Stock (green) - enough available                   │
│        ⚠ Low Stock (orange) - below reorder level              │
│        ✗ Out of Stock (red) - insufficient available           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. QUOTE ACCEPTED → JOB CREATED                                 │
│    - job_stock_allocations records created                      │
│    - allocation_status = 'Pending'                              │
│    - quantity_quoted copied from quote_line_items               │
│    - No stock reserved yet                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. JOB SCHEDULED (Date Set)                                     │
│    When job.scheduled_date is set:                              │
│    - Trigger allocates stock automatically                      │
│    - For each job_stock_allocation:                             │
│      * Check if enough available stock                          │
│      * If YES:                                                  │
│        - Create stock_movement (type='Reserved')                │
│        - Update stock_levels.quantity_reserved += quantity      │
│        - Update allocation_status = 'Reserved'                  │
│        - Set reserved_at timestamp                              │
│      * If NO:                                                   │
│        - Alert user: "Insufficient stock for [Product]"         │
│        - Job can still be scheduled (manual procurement)        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. JOB STARTED (Optional)                                       │
│    When job.status = 'In Progress':                             │
│    - allocation_status = 'Issued'                               │
│    - issued_at timestamp set                                    │
│    - Stock remains reserved (not yet deducted from on_hand)     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. JOB COMPLETED                                                │
│    When job.status = 'Completed':                               │
│    - User enters actual quantities used (if different)          │
│    - For each allocation:                                       │
│      * quantity_used = actual quantity                          │
│      * Create stock_movement (type='Issue')                     │
│      * Update stock_levels:                                     │
│        - quantity_on_hand -= quantity_used                      │
│        - quantity_reserved -= quantity_allocated                │
│      * allocation_status = 'Completed'                          │
│      * completed_at timestamp set                               │
│                                                                  │
│    - If quantity_used < quantity_allocated:                     │
│      * excess = quantity_allocated - quantity_used              │
│      * Create stock_movement (type='Return')                    │
│      * quantity_returned = excess                               │
│      * Returns to available stock                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Frontend Pages to Build

### 1. Vendors List Page
**Path:** `/src/app/inventory/vendors/page.tsx`

**Features:**
- Search vendors by name, code, contact
- Filter: Active/Inactive, Preferred
- Display columns:
  * Vendor Code
  * Vendor Name
  * Contact Person
  * Phone/Email
  * Payment Terms
  * Current Balance
  * Status (Active/Inactive badge)
  * Preferred (⭐ icon)
- Actions: Add Vendor, Edit, View Details
- Click row → vendor detail page

---

### 2. New/Edit Vendor Page
**Path:** `/src/app/inventory/vendors/new` or `/vendors/[id]/edit`

**Form Sections:**

**Basic Information:**
- Vendor Name (required)
- Contact Person
- Email
- Phone
- Mobile

**Address:**
- Address Line 1
- Address Line 2
- City
- Postcode
- Country (default: New Zealand)

**Payment Terms:**
- Payment Terms (dropdown: Net 30, Net 60, COD, Prepaid)
- Credit Limit
- Current Balance (read-only)

**Settings:**
- Active checkbox
- Preferred Vendor checkbox

**Notes:**
- Public Notes (visible to vendor)
- Internal Notes (internal use only)

**Actions:**
- Save Vendor
- Cancel

---

### 3. Vendor Detail Page
**Path:** `/src/app/inventory/vendors/[id]/page.tsx`

**Layout:** 2-column

**Left Column:**
- Vendor Information Card
- Contact Details Card
- Address Card
- Payment Terms Card
- Notes Card

**Right Column:**
- Quick Stats:
  * Total GRNs
  * Total Purchases (value)
  * Last Purchase Date
- Recent GRNs (last 10)
  * GRN Number (clickable)
  * Date
  * Total Amount
  * Status
- Outstanding Balances (if applicable)

**Actions:**
- Edit Vendor
- New GRN (quick link)

---

### 4. Goods Receipt (GRN) List Page
**Path:** `/src/app/inventory/receive/page.tsx`

**Summary Cards:**
- Total GRNs This Month
- Total Value Received (month)
- Pending GRNs (Draft status)

**Filters:**
- Search: GRN number, vendor name, invoice number
- Status: All, Draft, Received, Posted, Cancelled
- Date range: From/To
- Vendor: Dropdown (all vendors)

**Table Columns:**
- GRN Number
- Date Received
- Vendor Name
- Invoice Number
- Total Items
- Total Amount (inc GST)
- Status (badge)
- Received By (team member)
- Actions: View, Edit (if Draft), Post (if Draft/Received)

**Actions:**
- New GRN (blue button, top-right)
- Export CSV

---

### 5. New GRN Form
**Path:** `/src/app/inventory/receive/new`

**Layout:** Single column, step-by-step

**Step 1: GRN Header**
- Vendor (fuzzy search dropdown) *required
  * Search by code or name
  * Shows: Code, Name, Contact
- Vendor Invoice Number
- Vendor Invoice Date
- Received Date (default today)
- Received Time (optional)
- Warehouse Location (dropdown: Main Warehouse, Secondary, etc.)
- Purchase Order Number (optional)
- Reference Notes (optional)

**Step 2: Add Products**
- Product Search (fuzzy search) *required
  * Search by SKU or description
  * Shows: SKU, Description, Current Stock, Unit Cost
- Quantity Received *required
- Unit (from product, editable)
- Unit Cost *required (default: product.unit_cost)
- Condition (dropdown: Good, Damaged, Defective) default: Good
- Batch Number (optional)
- Expiry Date (optional)
- Notes (optional)

**Product List Table:**
- SKU
- Description
- Qty Received
- Unit
- Unit Cost
- Line Total
- Condition
- Actions: Edit, Remove

**Summary:**
- Total Items: X
- Total ex GST: $X,XXX.XX
- GST (15%): $XXX.XX
- **Total inc GST: $X,XXX.XX**

**Actions:**
- Save as Draft (gray button)
- Post GRN (blue button) - updates stock immediately
- Cancel

**Validation:**
- Vendor required
- At least one product required
- Quantity > 0
- Unit cost >= 0

---

### 6. GRN Detail/View Page
**Path:** `/src/app/inventory/receive/[id]/page.tsx`

**Header:**
- GRN Number (large, bold)
- Status Badge (Draft/Received/Posted/Cancelled)
- Received Date

**GRN Details Card:**
- Vendor: Name (clickable link)
- Vendor Invoice: Number + Date
- Received By: Team member name
- Warehouse: Location
- PO Number: (if applicable)
- Reference: Notes

**Line Items Table:**
- Product Code
- Description
- Qty Received
- Unit
- Unit Cost
- Line Total
- Condition
- Batch/Expiry
- Notes

**Summary Card:**
- Total Items: X
- Total ex GST: $X,XXX.XX
- GST: $XXX.XX
- Total inc GST: $X,XXX.XX

**Actions:**
- Edit (if Draft)
- Post GRN (if Draft/Received) - shows confirmation modal
- Cancel GRN (if Draft) - shows confirmation
- Print/Export PDF
- Back to List

**Posted GRN:**
- Shows Posted At timestamp
- Posted By: Team member
- Stock Movements link (view related movements)

---

### 7. Enhanced Quote Product Selection
**Path:** `/src/app/quotes/new` (existing page - enhance)

**Product Selection Enhancement:**

When selecting products in quote:

**Current Display:**
```
Product: PIL-006 - Glasswool R2.4
Price: $119.20 per pack
```

**Enhanced Display:**
```
Product: PIL-006 - Glasswool R2.4
Price: $119.20 per pack
Stock: 45 available (8 reserved) ✓ In Stock
```

**Stock Status Indicators:**
- ✓ **In Stock** (green) - Available quantity > quantity needed
- ⚠ **Low Stock** (orange) - Available < reorder_level
- ✗ **Out of Stock** (red) - Available = 0
- ⏳ **Reserved** (blue) - Allocated to other jobs

**Tooltip on hover:**
```
On Hand: 53 packs
Reserved: 8 packs (JOB-2026-001, JOB-2026-003)
Available: 45 packs
Reorder Level: 10 packs
```

---

### 8. Job Stock Allocation Management
**Path:** `/src/app/jobs/[id]/stock` (new tab in job detail)

**Purpose:** View and manage stock allocated to this job

**Allocation Status Card:**
- Overall Status: Pending/Reserved/Issued/Completed
- Total Products: X
- Total Value: $X,XXX.XX
- Reserved At: Date/time
- Issued At: Date/time
- Completed At: Date/time

**Allocated Products Table:**
- Product Code
- Description
- Qty Quoted
- Qty Allocated
- Qty Used (editable if job completed)
- Qty Returned
- Unit
- Status (badge)
- Actions: View Stock Movements

**Reserve Stock Button:**
- Visible if status = 'Pending' and job is scheduled
- Manually trigger stock reservation
- Validates stock availability
- Shows errors if insufficient stock

**Complete Allocation:**
- Visible when job status = 'Completed'
- Form to enter actual quantities used
- Calculates excess/shortage
- Posts final stock movements

---

## 📊 Database Functions

### 1. Post GRN Function

```sql
CREATE OR REPLACE FUNCTION post_grn(
  p_grn_id UUID,
  p_posted_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  movements_created INTEGER
) AS $$
DECLARE
  v_grn goods_received_notes;
  v_line grn_line_items;
  v_movements_count INTEGER := 0;
BEGIN
  -- Get GRN
  SELECT * INTO v_grn
  FROM goods_received_notes
  WHERE id = p_grn_id;

  -- Validate
  IF v_grn.status = 'Posted' THEN
    RETURN QUERY SELECT false, 'GRN already posted', 0;
    RETURN;
  END IF;

  IF v_grn.status = 'Cancelled' THEN
    RETURN QUERY SELECT false, 'Cannot post cancelled GRN', 0;
    RETURN;
  END IF;

  -- Process each line item
  FOR v_line IN
    SELECT * FROM grn_line_items
    WHERE grn_id = p_grn_id
  LOOP
    -- Create stock movement
    INSERT INTO stock_movements (
      product_id,
      grn_id,
      movement_type,
      quantity,
      warehouse_location,
      reference_number,
      reference_type,
      notes,
      created_by
    ) VALUES (
      v_line.product_id,
      p_grn_id,
      'Receipt',
      v_line.quantity_received,
      v_grn.warehouse_location,
      v_grn.grn_number,
      'grn',
      'Received from vendor: ' || (SELECT vendor_name FROM vendors WHERE id = v_grn.vendor_id),
      p_posted_by
    );

    -- Update stock levels
    UPDATE stock_levels
    SET
      quantity_on_hand = quantity_on_hand + v_line.quantity_received,
      last_stock_take_date = v_grn.received_date,
      updated_at = NOW()
    WHERE product_id = v_line.product_id
      AND warehouse_location = v_grn.warehouse_location;

    -- If no stock level exists, create one
    IF NOT FOUND THEN
      INSERT INTO stock_levels (
        product_id,
        warehouse_location,
        quantity_on_hand,
        last_stock_take_date
      ) VALUES (
        v_line.product_id,
        v_grn.warehouse_location,
        v_line.quantity_received,
        v_grn.received_date
      );
    END IF;

    -- Update product unit cost (latest cost)
    UPDATE products
    SET unit_cost = v_line.unit_cost
    WHERE id = v_line.product_id;

    v_movements_count := v_movements_count + 1;
  END LOOP;

  -- Update GRN status
  UPDATE goods_received_notes
  SET
    status = 'Posted',
    posted_by = p_posted_by,
    posted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_grn_id;

  RETURN QUERY SELECT true, 'GRN posted successfully', v_movements_count;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Reserve Job Stock Function

```sql
CREATE OR REPLACE FUNCTION reserve_job_stock(
  p_job_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  products_reserved INTEGER,
  products_failed INTEGER
) AS $$
DECLARE
  v_allocation job_stock_allocations;
  v_available NUMERIC;
  v_reserved_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_job jobs;
BEGIN
  -- Get job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;

  IF v_job.scheduled_date IS NULL THEN
    RETURN QUERY SELECT false, 'Job must be scheduled before reserving stock', 0, 0;
    RETURN;
  END IF;

  -- Process each allocation
  FOR v_allocation IN
    SELECT * FROM job_stock_allocations
    WHERE job_id = p_job_id
      AND allocation_status = 'Pending'
  LOOP
    -- Check available stock
    SELECT quantity_available INTO v_available
    FROM stock_levels
    WHERE product_id = v_allocation.product_id
      AND warehouse_location = 'Main Warehouse';  -- TODO: Make dynamic

    IF v_available >= v_allocation.quantity_quoted THEN
      -- Reserve stock
      UPDATE stock_levels
      SET quantity_reserved = quantity_reserved + v_allocation.quantity_quoted
      WHERE product_id = v_allocation.product_id
        AND warehouse_location = 'Main Warehouse';

      -- Create movement
      INSERT INTO stock_movements (
        product_id,
        job_id,
        movement_type,
        quantity,
        reference_number,
        reference_type,
        notes
      ) VALUES (
        v_allocation.product_id,
        p_job_id,
        'Reserved',
        v_allocation.quantity_quoted,
        v_job.job_number,
        'job',
        'Reserved for job scheduled on ' || v_job.scheduled_date::TEXT
      );

      -- Update allocation
      UPDATE job_stock_allocations
      SET
        quantity_allocated = v_allocation.quantity_quoted,
        allocation_status = 'Reserved',
        reserved_at = NOW(),
        updated_at = NOW()
      WHERE id = v_allocation.id;

      v_reserved_count := v_reserved_count + 1;
    ELSE
      -- Insufficient stock
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;

  IF v_failed_count = 0 THEN
    RETURN QUERY SELECT true, 'All stock reserved successfully', v_reserved_count, 0;
  ELSE
    RETURN QUERY SELECT false,
      v_reserved_count || ' reserved, ' || v_failed_count || ' failed due to insufficient stock',
      v_reserved_count, v_failed_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Complete Job Stock Function

```sql
CREATE OR REPLACE FUNCTION complete_job_stock(
  p_job_id UUID,
  p_actual_quantities JSONB  -- [{product_id: uuid, quantity_used: number}, ...]
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item JSONB;
  v_allocation job_stock_allocations;
  v_qty_used NUMERIC;
  v_excess NUMERIC;
BEGIN
  -- Process each product
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_actual_quantities)
  LOOP
    -- Get allocation
    SELECT * INTO v_allocation
    FROM job_stock_allocations
    WHERE job_id = p_job_id
      AND product_id = (v_item->>'product_id')::UUID;

    v_qty_used := (v_item->>'quantity_used')::NUMERIC;

    -- Issue stock (actual used)
    INSERT INTO stock_movements (
      product_id,
      job_id,
      movement_type,
      quantity,
      reference_number,
      reference_type,
      notes
    ) VALUES (
      v_allocation.product_id,
      p_job_id,
      'Issue',
      v_qty_used,
      (SELECT job_number FROM jobs WHERE id = p_job_id),
      'job',
      'Used in job completion'
    );

    -- Update stock levels
    UPDATE stock_levels
    SET
      quantity_on_hand = quantity_on_hand - v_qty_used,
      quantity_reserved = quantity_reserved - v_allocation.quantity_allocated
    WHERE product_id = v_allocation.product_id;

    -- Handle excess (return to stock)
    IF v_qty_used < v_allocation.quantity_allocated THEN
      v_excess := v_allocation.quantity_allocated - v_qty_used;

      INSERT INTO stock_movements (
        product_id,
        job_id,
        movement_type,
        quantity,
        reference_number,
        reference_type,
        notes
      ) VALUES (
        v_allocation.product_id,
        p_job_id,
        'Return',
        v_excess,
        (SELECT job_number FROM jobs WHERE id = p_job_id),
        'job',
        'Unused materials returned'
      );
    END IF;

    -- Update allocation
    UPDATE job_stock_allocations
    SET
      quantity_used = v_qty_used,
      quantity_returned = GREATEST(0, v_allocation.quantity_allocated - v_qty_used),
      allocation_status = 'Completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_allocation.id;
  END LOOP;

  RETURN QUERY SELECT true, 'Job stock completed successfully';
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 UI/UX Specifications

### Color Scheme

**Inward Receipts (GRN):**
- Primary: Green (#16A34A) - represents incoming stock
- Header icon: PackagePlus (green)

**Stock Status Colors:**
- In Stock: Green (#16A34A)
- Low Stock: Orange (#F97316)
- Out of Stock: Red (#DC2626)
- Reserved: Blue (#3B82F6)

**Vendor Management:**
- Primary: Purple (#9333EA)
- Header icon: Building2 (purple)

### Component Patterns

**Fuzzy Search Dropdowns:**
```typescript
- Type to search (debounced 300ms)
- Shows top 10 results
- Displays multiple fields (code + name)
- Keyboard navigation (↑/↓)
- Enter to select
- Highlights matching text
```

**Stock Availability Badge:**
```typescript
<span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium">
  {icon} {text}
</span>

// Green: bg-green-100 text-green-800
// Orange: bg-orange-100 text-orange-800
// Red: bg-red-100 text-red-800
// Blue: bg-blue-100 text-blue-800
```

---

## 📋 Implementation Checklist

### Phase 1: Database Setup
- [ ] Create vendors table with auto-code generation
- [ ] Create goods_received_notes table with auto-GRN generation
- [ ] Create grn_line_items table
- [ ] Enhance stock_movements table with new types
- [ ] Create job_stock_allocations table
- [ ] Create post_grn() function
- [ ] Create reserve_job_stock() function
- [ ] Create complete_job_stock() function
- [ ] Create indexes for performance
- [ ] Test all functions with sample data

### Phase 2: Vendor Management UI
- [ ] Vendors list page (/inventory/vendors)
- [ ] New vendor form (/inventory/vendors/new)
- [ ] Edit vendor form (/inventory/vendors/[id]/edit)
- [ ] Vendor detail page (/inventory/vendors/[id])
- [ ] Fuzzy search component for vendor selection

### Phase 3: GRN/Inward Receipts UI
- [ ] GRN list page (/inventory/receive)
- [ ] New GRN form (/inventory/receive/new)
- [ ] GRN detail/view page (/inventory/receive/[id])
- [ ] Product fuzzy search component
- [ ] Post GRN functionality with confirmation
- [ ] Draft save/resume functionality
- [ ] Print GRN report

### Phase 4: Stock Allocation Integration
- [ ] Enhance quote product selection with stock display
- [ ] Create job_stock_allocations on job creation
- [ ] Auto-reserve stock when job scheduled (trigger)
- [ ] Job stock allocation tab (/jobs/[id]/stock)
- [ ] Manual reserve button for pending jobs
- [ ] Complete stock allocation form (job completion)
- [ ] Stock movements linked to jobs

### Phase 5: Reporting & Analytics
- [ ] Vendor purchase history report
- [ ] Stock receipt trends (by month)
- [ ] Stock allocation efficiency (quoted vs used)
- [ ] Low stock alert dashboard
- [ ] Vendor performance metrics

---

## 🚀 Success Metrics

After implementation, measure:

1. **Stock Accuracy**
   - Target: 98% match between system and physical stock
   - Measured via stock takes

2. **Reservation Efficiency**
   - Target: <5% jobs with insufficient stock at scheduling
   - Measured by failed reservations

3. **GRN Processing Time**
   - Target: <5 minutes to receive and post goods
   - Measured from arrival to posted status

4. **Stock Visibility**
   - Users can see real-time available stock in quotes
   - No manual stock checks needed

5. **Cost Tracking**
   - 100% of inward receipts have vendor and cost data
   - Accurate job costing based on actual materials used

---

**End of Design Document**
