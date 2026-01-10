-- ============================================================================
-- INVENTORY INWARD RECEIPTS & VENDOR MANAGEMENT
-- Migration: 20260107_inventory_inward_receipts.sql
-- Purpose: Add vendor management, GRN (Goods Received Notes), and job stock allocations
-- ============================================================================

-- ============================================================================
-- PART 0: PREREQUISITE FUNCTIONS
-- ============================================================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 1: VENDORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_code TEXT UNIQUE,
  vendor_name TEXT NOT NULL,

  -- Contact information
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'New Zealand',

  -- Payment terms
  payment_terms TEXT DEFAULT 'Net 30',
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_preferred BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID
);

-- Auto-generate vendor code trigger function
CREATE OR REPLACE FUNCTION set_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Always generate code on insert if not provided or empty
  IF NEW.vendor_code IS NULL OR TRIM(NEW.vendor_code) = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM vendors
    WHERE vendor_code ~ '^VEN-[0-9]+$';

    new_code := 'VEN-' || LPAD(next_number::TEXT, 3, '0');
    NEW.vendor_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate vendor code
DROP TRIGGER IF EXISTS set_vendor_code_trigger ON vendors;
CREATE TRIGGER set_vendor_code_trigger
BEFORE INSERT ON vendors
FOR EACH ROW
EXECUTE FUNCTION set_vendor_code();

-- Trigger to update updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for vendors
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_name ON vendors(vendor_name);
CREATE INDEX idx_vendors_active ON vendors(is_active) WHERE is_active = true;
CREATE INDEX idx_vendors_preferred ON vendors(is_preferred) WHERE is_preferred = true;

-- Add foreign key to team_members if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_vendors_created_by'
    ) THEN
      ALTER TABLE vendors
      ADD CONSTRAINT fk_vendors_created_by
      FOREIGN KEY (created_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_vendors_updated_by'
    ) THEN
      ALTER TABLE vendors
      ADD CONSTRAINT fk_vendors_updated_by
      FOREIGN KEY (updated_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PART 2: GOODS RECEIVED NOTES (GRN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goods_received_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_number TEXT UNIQUE,

  -- Vendor information
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_invoice_number TEXT,
  vendor_invoice_date DATE,

  -- Receipt details
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_time TIME,
  warehouse_location TEXT DEFAULT 'Main Warehouse',

  -- Reference
  purchase_order_number TEXT,
  reference_notes TEXT,

  -- Status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Received', 'Posted', 'Cancelled')),

  -- Totals
  total_items INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  total_inc_gst NUMERIC DEFAULT 0,

  -- Audit
  received_by UUID,
  posted_by UUID,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auto-generate GRN number trigger function
CREATE OR REPLACE FUNCTION set_grn_number()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_seq INTEGER;
  new_grn TEXT;
BEGIN
  -- Always generate GRN number on insert if not provided or empty
  IF NEW.grn_number IS NULL OR TRIM(NEW.grn_number) = '' THEN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number FROM 18) AS INTEGER)), 0) + 1
    INTO next_seq
    FROM goods_received_notes
    WHERE grn_number ~ ('^GRN-' || today_str || '-[0-9]+$');

    new_grn := 'GRN-' || today_str || '-' || LPAD(next_seq::TEXT, 3, '0');
    NEW.grn_number := new_grn;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate GRN number
DROP TRIGGER IF EXISTS set_grn_number_trigger ON goods_received_notes;
CREATE TRIGGER set_grn_number_trigger
BEFORE INSERT ON goods_received_notes
FOR EACH ROW
EXECUTE FUNCTION set_grn_number();

-- Trigger to update updated_at
CREATE TRIGGER update_grn_updated_at
BEFORE UPDATE ON goods_received_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for GRN
CREATE INDEX idx_grn_number ON goods_received_notes(grn_number);
CREATE INDEX idx_grn_vendor ON goods_received_notes(vendor_id);
CREATE INDEX idx_grn_date ON goods_received_notes(received_date DESC);
CREATE INDEX idx_grn_status ON goods_received_notes(status);

-- Add foreign keys to team_members if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_grn_received_by'
    ) THEN
      ALTER TABLE goods_received_notes
      ADD CONSTRAINT fk_grn_received_by
      FOREIGN KEY (received_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_grn_posted_by'
    ) THEN
      ALTER TABLE goods_received_notes
      ADD CONSTRAINT fk_grn_posted_by
      FOREIGN KEY (posted_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_grn_created_by'
    ) THEN
      ALTER TABLE goods_received_notes
      ADD CONSTRAINT fk_grn_created_by
      FOREIGN KEY (created_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PART 3: GRN LINE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS grn_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_id UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  quantity_ordered NUMERIC,
  quantity_received NUMERIC NOT NULL CHECK (quantity_received > 0),
  unit TEXT,

  -- Pricing
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,

  -- Quality check
  condition TEXT DEFAULT 'Good' CHECK (condition IN ('Good', 'Damaged', 'Defective')),
  notes TEXT,

  -- Tracking
  batch_number TEXT,
  expiry_date DATE,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for GRN line items
CREATE INDEX idx_grn_line_grn ON grn_line_items(grn_id);
CREATE INDEX idx_grn_line_product ON grn_line_items(product_id);
CREATE INDEX idx_grn_line_sort ON grn_line_items(grn_id, sort_order);

-- ============================================================================
-- PART 4: ENHANCE STOCK MOVEMENTS TABLE
-- ============================================================================

-- Add grn_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'grn_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN grn_id UUID;
  END IF;
END $$;

-- Add foreign key for grn_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_movements_grn'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT fk_stock_movements_grn
    FOREIGN KEY (grn_id) REFERENCES goods_received_notes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for grn_id
CREATE INDEX IF NOT EXISTS idx_stock_movements_grn ON stock_movements(grn_id);

-- Update movement types (drop old constraint if exists, add new one)
DO $$
BEGIN
  -- Drop old constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_movements_movement_type_check'
  ) THEN
    ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_movement_type_check;
  END IF;

  -- Add new constraint with updated movement types
  ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_movement_type_check
  CHECK (movement_type IN (
    'Receipt',              -- Inward from GRN
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
END $$;

-- ============================================================================
-- PART 5: JOB STOCK ALLOCATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_stock_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  quantity_quoted NUMERIC NOT NULL,
  quantity_allocated NUMERIC NOT NULL DEFAULT 0,
  quantity_used NUMERIC DEFAULT 0,
  quantity_returned NUMERIC DEFAULT 0,

  unit TEXT NOT NULL,

  -- Status tracking
  allocation_status TEXT DEFAULT 'Pending' CHECK (
    allocation_status IN ('Pending', 'Reserved', 'Issued', 'Completed')
  ),

  -- Timestamps
  reserved_at TIMESTAMP,
  issued_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for job stock allocations
CREATE INDEX idx_job_stock_job ON job_stock_allocations(job_id);
CREATE INDEX idx_job_stock_product ON job_stock_allocations(product_id);
CREATE INDEX idx_job_stock_status ON job_stock_allocations(allocation_status);

-- Unique constraint: one allocation per job-product combination
CREATE UNIQUE INDEX idx_job_stock_unique ON job_stock_allocations(job_id, product_id);

-- Add foreign key to jobs if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_job_stock_job'
    ) THEN
      ALTER TABLE job_stock_allocations
      ADD CONSTRAINT fk_job_stock_job
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Trigger to update updated_at
CREATE TRIGGER update_job_stock_updated_at
BEFORE UPDATE ON job_stock_allocations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: FUNCTIONS
-- ============================================================================

-- Function to post GRN and update stock
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
  v_vendor_name TEXT;
BEGIN
  -- Get GRN
  SELECT * INTO v_grn
  FROM goods_received_notes
  WHERE id = p_grn_id;

  -- Validate
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'GRN not found', 0;
    RETURN;
  END IF;

  IF v_grn.status = 'Posted' THEN
    RETURN QUERY SELECT false, 'GRN already posted', 0;
    RETURN;
  END IF;

  IF v_grn.status = 'Cancelled' THEN
    RETURN QUERY SELECT false, 'Cannot post cancelled GRN', 0;
    RETURN;
  END IF;

  -- Get vendor name
  SELECT vendor_name INTO v_vendor_name
  FROM vendors
  WHERE id = v_grn.vendor_id;

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
      'Received from vendor: ' || v_vendor_name,
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

  -- Update GRN totals and status
  UPDATE goods_received_notes
  SET
    status = 'Posted',
    posted_by = p_posted_by,
    posted_at = NOW(),
    total_items = (SELECT COUNT(*) FROM grn_line_items WHERE grn_id = p_grn_id),
    total_cost = (SELECT COALESCE(SUM(line_total), 0) FROM grn_line_items WHERE grn_id = p_grn_id),
    gst_amount = (SELECT COALESCE(SUM(line_total), 0) * 0.15 FROM grn_line_items WHERE grn_id = p_grn_id),
    total_inc_gst = (SELECT COALESCE(SUM(line_total), 0) * 1.15 FROM grn_line_items WHERE grn_id = p_grn_id),
    updated_at = NOW()
  WHERE id = p_grn_id;

  RETURN QUERY SELECT true, 'GRN posted successfully', v_movements_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve stock for a job
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
  v_warehouse TEXT := 'Main Warehouse';
BEGIN
  -- Get job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Job not found', 0, 0;
    RETURN;
  END IF;

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
      AND warehouse_location = v_warehouse;

    IF v_available IS NULL THEN
      v_available := 0;
    END IF;

    IF v_available >= v_allocation.quantity_quoted THEN
      -- Reserve stock
      UPDATE stock_levels
      SET quantity_reserved = quantity_reserved + v_allocation.quantity_quoted
      WHERE product_id = v_allocation.product_id
        AND warehouse_location = v_warehouse;

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

-- Function to complete job stock allocation
CREATE OR REPLACE FUNCTION complete_job_stock(
  p_job_id UUID,
  p_actual_quantities JSONB
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
  v_job_number TEXT;
  v_warehouse TEXT := 'Main Warehouse';
BEGIN
  -- Get job number
  SELECT job_number INTO v_job_number
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Job not found';
    RETURN;
  END IF;

  -- Process each product
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_actual_quantities)
  LOOP
    -- Get allocation
    SELECT * INTO v_allocation
    FROM job_stock_allocations
    WHERE job_id = p_job_id
      AND product_id = (v_item->>'product_id')::UUID;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

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
      v_job_number,
      'job',
      'Used in job completion'
    );

    -- Update stock levels
    UPDATE stock_levels
    SET
      quantity_on_hand = quantity_on_hand - v_qty_used,
      quantity_reserved = quantity_reserved - v_allocation.quantity_allocated
    WHERE product_id = v_allocation.product_id
      AND warehouse_location = v_warehouse;

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
        v_job_number,
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

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Inventory Inward Receipts Migration Complete';
  RAISE NOTICE '   - Vendors table created with auto-code generation';
  RAISE NOTICE '   - GRN (Goods Received Notes) tables created';
  RAISE NOTICE '   - Job stock allocations table created';
  RAISE NOTICE '   - Stock movements enhanced with new types';
  RAISE NOTICE '   - 3 functions created: post_grn, reserve_job_stock, complete_job_stock';
END $$;
