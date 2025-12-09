-- ============================================================================
-- JOBS SYSTEM - STOCK MANAGEMENT & JOB FUNCTIONS
-- Date: December 7, 2025
-- Purpose: Stock reservation, allocation, returns, and job management functions
-- Dependencies: 20251207_jobs_system_complete.sql
-- ============================================================================

-- ============================================================================
-- PART 1: STOCK MANAGEMENT FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: check_stock_availability
-- Purpose: Check if sufficient stock exists for a job
-- Returns: JSON array of products with insufficient stock
-- ============================================================================

CREATE OR REPLACE FUNCTION check_stock_availability(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_insufficient_stock JSON;
BEGIN
  -- Check each job line item against stock levels
  SELECT json_agg(
    json_build_object(
      'product_id', jli.product_id,
      'product_code', jli.product_code,
      'description', jli.description,
      'required_quantity', jli.quantity_quoted,
      'available_quantity', COALESCE(sl.quantity_available, 0),
      'shortfall', jli.quantity_quoted - COALESCE(sl.quantity_available, 0)
    )
  )
  INTO v_insufficient_stock
  FROM job_line_items jli
  LEFT JOIN stock_levels sl ON sl.product_id = jli.product_id
  WHERE jli.job_id = p_job_id
  AND jli.product_id IS NOT NULL
  AND (sl.quantity_available IS NULL OR sl.quantity_available < jli.quantity_quoted);

  -- Return array of insufficient items (or empty array if all OK)
  RETURN COALESCE(v_insufficient_stock, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: reserve_stock_for_job
-- Purpose: Reserve stock when job is scheduled
-- Called: When job status → 'Scheduled'
-- ============================================================================

CREATE OR REPLACE FUNCTION reserve_stock_for_job(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_line_item RECORD;
  v_stock_level RECORD;
  v_result JSON;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_success BOOLEAN := true;
BEGIN
  -- Loop through all job line items
  FOR v_line_item IN 
    SELECT * FROM job_line_items 
    WHERE job_id = p_job_id 
    AND product_id IS NOT NULL
  LOOP
    -- Get current stock level
    SELECT * INTO v_stock_level
    FROM stock_levels
    WHERE product_id = v_line_item.product_id
    FOR UPDATE; -- Lock row for update

    -- Check if stock level record exists
    IF NOT FOUND THEN
      -- Create stock level record if it doesn't exist
      INSERT INTO stock_levels (product_id, quantity_on_hand, quantity_reserved)
      VALUES (v_line_item.product_id, 0, 0)
      RETURNING * INTO v_stock_level;
      
      v_warnings := array_append(v_warnings, 
        format('Product %s: No stock record found. Created with 0 quantity. Cannot reserve %s units.',
          v_line_item.product_code, v_line_item.quantity_quoted));
      v_success := false;
      CONTINUE;
    END IF;

    -- Check if sufficient stock available
    IF v_stock_level.quantity_available < v_line_item.quantity_quoted THEN
      v_warnings := array_append(v_warnings,
        format('Product %s: Insufficient stock. Available: %s, Required: %s',
          v_line_item.product_code, 
          v_stock_level.quantity_available, 
          v_line_item.quantity_quoted));
      v_success := false;
      CONTINUE;
    END IF;

    -- Reserve the stock
    UPDATE stock_levels
    SET quantity_reserved = quantity_reserved + v_line_item.quantity_quoted,
        updated_at = NOW()
    WHERE product_id = v_line_item.product_id;

    -- Log stock movement
    INSERT INTO stock_movements (
      product_id,
      job_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      reference_number,
      notes
    ) VALUES (
      v_line_item.product_id,
      p_job_id,
      'RESERVED',
      v_line_item.quantity_quoted,
      v_stock_level.quantity_reserved,
      v_stock_level.quantity_reserved + v_line_item.quantity_quoted,
      (SELECT job_number FROM jobs WHERE id = p_job_id),
      format('Reserved for job %s', (SELECT job_number FROM jobs WHERE id = p_job_id))
    );
  END LOOP;

  -- Build result JSON
  v_result := json_build_object(
    'success', v_success,
    'job_id', p_job_id,
    'warnings', v_warnings,
    'message', CASE 
      WHEN v_success THEN 'Stock reserved successfully'
      ELSE 'Stock reservation completed with warnings'
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: confirm_stock_for_job
-- Purpose: Allocate reserved stock when job is completed
-- Called: When job status → 'Completed'
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_stock_for_job(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_line_item RECORD;
  v_stock_level RECORD;
  v_quantity_to_allocate NUMERIC;
  v_result JSON;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Loop through all job line items
  FOR v_line_item IN 
    SELECT * FROM job_line_items 
    WHERE job_id = p_job_id 
    AND product_id IS NOT NULL
  LOOP
    -- Use actual quantity if recorded, otherwise quoted quantity
    v_quantity_to_allocate := COALESCE(v_line_item.quantity_actual, v_line_item.quantity_quoted);

    -- Get current stock level
    SELECT * INTO v_stock_level
    FROM stock_levels
    WHERE product_id = v_line_item.product_id
    FOR UPDATE; -- Lock row for update

    IF NOT FOUND THEN
      v_warnings := array_append(v_warnings,
        format('Product %s: No stock record found', v_line_item.product_code));
      CONTINUE;
    END IF;

    -- Allocate stock: deduct from on_hand and reserved
    UPDATE stock_levels
    SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_quantity_to_allocate),
        quantity_reserved = GREATEST(0, quantity_reserved - v_line_item.quantity_quoted),
        updated_at = NOW()
    WHERE product_id = v_line_item.product_id;

    -- Log stock movement
    INSERT INTO stock_movements (
      product_id,
      job_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      reference_number,
      notes
    ) VALUES (
      v_line_item.product_id,
      p_job_id,
      'ALLOCATED',
      v_quantity_to_allocate,
      v_stock_level.quantity_on_hand,
      v_stock_level.quantity_on_hand - v_quantity_to_allocate,
      (SELECT job_number FROM jobs WHERE id = p_job_id),
      format('Allocated for completed job %s', (SELECT job_number FROM jobs WHERE id = p_job_id))
    );
  END LOOP;

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'job_id', p_job_id,
    'warnings', v_warnings,
    'message', 'Stock allocated successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: return_stock_from_cancelled_job
-- Purpose: Return reserved stock when job is cancelled
-- Called: When job status → 'Cancelled'
-- ============================================================================

CREATE OR REPLACE FUNCTION return_stock_from_cancelled_job(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_line_item RECORD;
  v_stock_level RECORD;
  v_result JSON;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Loop through all job line items
  FOR v_line_item IN 
    SELECT * FROM job_line_items 
    WHERE job_id = p_job_id 
    AND product_id IS NOT NULL
  LOOP
    -- Get current stock level
    SELECT * INTO v_stock_level
    FROM stock_levels
    WHERE product_id = v_line_item.product_id
    FOR UPDATE; -- Lock row for update

    IF NOT FOUND THEN
      v_warnings := array_append(v_warnings,
        format('Product %s: No stock record found', v_line_item.product_code));
      CONTINUE;
    END IF;

    -- Return the reserved stock
    UPDATE stock_levels
    SET quantity_reserved = GREATEST(0, quantity_reserved - v_line_item.quantity_quoted),
        updated_at = NOW()
    WHERE product_id = v_line_item.product_id;

    -- Log stock movement
    INSERT INTO stock_movements (
      product_id,
      job_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      reference_number,
      notes
    ) VALUES (
      v_line_item.product_id,
      p_job_id,
      'RETURNED',
      v_line_item.quantity_quoted,
      v_stock_level.quantity_reserved,
      v_stock_level.quantity_reserved - v_line_item.quantity_quoted,
      (SELECT job_number FROM jobs WHERE id = p_job_id),
      format('Returned from cancelled job %s', (SELECT job_number FROM jobs WHERE id = p_job_id))
    );
  END LOOP;

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'job_id', p_job_id,
    'warnings', v_warnings,
    'message', 'Stock returned to available inventory'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: manual_stock_adjustment
-- Purpose: Allow manual stock quantity adjustments
-- Usage: For stock corrections, physical counts, damaged goods
-- ============================================================================

CREATE OR REPLACE FUNCTION manual_stock_adjustment(
  p_product_id UUID,
  p_quantity_change NUMERIC,
  p_notes TEXT,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_stock_level RECORD;
  v_result JSON;
BEGIN
  -- Get or create stock level record
  INSERT INTO stock_levels (product_id, quantity_on_hand, quantity_reserved)
  VALUES (p_product_id, 0, 0)
  ON CONFLICT (product_id, warehouse_location) DO NOTHING;

  -- Get current stock level
  SELECT * INTO v_stock_level
  FROM stock_levels
  WHERE product_id = p_product_id
  FOR UPDATE;

  -- Apply adjustment
  UPDATE stock_levels
  SET quantity_on_hand = GREATEST(0, quantity_on_hand + p_quantity_change),
      updated_at = NOW()
  WHERE product_id = p_product_id;

  -- Log stock movement
  INSERT INTO stock_movements (
    product_id,
    job_id,
    movement_type,
    quantity,
    quantity_before,
    quantity_after,
    reference_number,
    notes,
    created_by
  ) VALUES (
    p_product_id,
    NULL,
    'ADJUSTMENT',
    p_quantity_change,
    v_stock_level.quantity_on_hand,
    v_stock_level.quantity_on_hand + p_quantity_change,
    'MANUAL-ADJ-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'),
    p_notes,
    p_created_by
  );

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'product_id', p_product_id,
    'adjustment', p_quantity_change,
    'new_quantity', v_stock_level.quantity_on_hand + p_quantity_change,
    'message', 'Stock adjusted successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: JOB MANAGEMENT FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: create_job_from_quote
-- Purpose: Create a job from an accepted quote
-- Called: When user clicks "Create Job" on quote detail page
-- ============================================================================

CREATE OR REPLACE FUNCTION create_job_from_quote(p_quote_id UUID)
RETURNS JSON AS $$
DECLARE
  v_quote RECORD;
  v_job_id UUID;
  v_job_number TEXT;
  v_line_item RECORD;
  v_result JSON;
BEGIN
  -- Get quote details
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found'
    );
  END IF;

  -- Check if job already exists for this quote
  IF EXISTS (SELECT 1 FROM jobs WHERE quote_id = p_quote_id) THEN
    SELECT id, job_number INTO v_job_id, v_job_number 
    FROM jobs WHERE quote_id = p_quote_id;
    
    RETURN json_build_object(
      'success', false,
      'error', 'Job already exists for this quote',
      'existing_job_id', v_job_id,
      'existing_job_number', v_job_number
    );
  END IF;

  -- Generate job number
  v_job_number := generate_job_number();

  -- Create job
  INSERT INTO jobs (
    job_number,
    quote_id,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    customer_company,
    site_address,
    city,
    postcode,
    status,
    quoted_amount,
    notes,
    assessment_id,
    created_at
  ) VALUES (
    v_job_number,
    p_quote_id,
    v_quote.customer_first_name,
    v_quote.customer_last_name,
    v_quote.customer_email,
    v_quote.customer_phone,
    v_quote.customer_company,
    v_quote.site_address,
    v_quote.city,
    v_quote.postcode,
    'Draft',
    v_quote.total_amount,
    v_quote.notes,
    v_quote.assessment_id,
    NOW()
  ) RETURNING id INTO v_job_id;

  -- Copy quote line items to job line items
  FOR v_line_item IN 
    SELECT * FROM quote_line_items WHERE quote_id = p_quote_id
  LOOP
    INSERT INTO job_line_items (
      job_id,
      product_id,
      product_code,
      description,
      quantity_quoted,
      unit,
      unit_cost,
      line_cost,
      sort_order
    ) VALUES (
      v_job_id,
      v_line_item.product_id,
      v_line_item.product_code,
      v_line_item.description,
      v_line_item.quantity,
      v_line_item.unit,
      v_line_item.unit_cost,
      v_line_item.line_total,
      v_line_item.sort_order
    );
  END LOOP;

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'job_id', v_job_id,
    'job_number', v_job_number,
    'message', format('Job %s created successfully from quote', v_job_number)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: calculate_job_costing
-- Purpose: Calculate job financials from line items and labour
-- Returns: JSON with quoted, actual, and margin calculations
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_job_costing(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_materials_quoted NUMERIC := 0;
  v_materials_actual NUMERIC := 0;
  v_labour_quoted NUMERIC := 0;
  v_labour_actual NUMERIC := 0;
  v_result JSON;
BEGIN
  -- Calculate material costs
  SELECT 
    COALESCE(SUM(line_cost), 0),
    COALESCE(SUM(COALESCE(quantity_actual, quantity_quoted) * unit_cost), 0)
  INTO v_materials_quoted, v_materials_actual
  FROM job_line_items
  WHERE job_id = p_job_id;

  -- Calculate labour costs
  SELECT 
    COALESCE(SUM(quoted_amount), 0),
    COALESCE(SUM(actual_amount), 0)
  INTO v_labour_quoted, v_labour_actual
  FROM job_labour_items
  WHERE job_id = p_job_id;

  -- Build result JSON
  v_result := json_build_object(
    'materials_quoted', v_materials_quoted,
    'materials_actual', v_materials_actual,
    'labour_quoted', v_labour_quoted,
    'labour_actual', v_labour_actual,
    'total_quoted', v_materials_quoted + v_labour_quoted,
    'total_actual', v_materials_actual + v_labour_actual,
    'variance', (v_materials_actual + v_labour_actual) - (v_materials_quoted + v_labour_quoted),
    'variance_percent', CASE 
      WHEN (v_materials_quoted + v_labour_quoted) > 0 
      THEN ROUND(((v_materials_actual + v_labour_actual) - (v_materials_quoted + v_labour_quoted)) / (v_materials_quoted + v_labour_quoted) * 100, 2)
      ELSE 0
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: update_job_status
-- Purpose: Update job status with validation and auto-trigger stock functions
-- Called: From UI when status is changed
-- ============================================================================

CREATE OR REPLACE FUNCTION update_job_status(
  p_job_id UUID,
  p_new_status TEXT,
  p_changed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_old_status TEXT;
  v_stock_result JSON;
  v_result JSON;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get current status
  SELECT status INTO v_old_status FROM jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Job not found'
    );
  END IF;

  -- Validate status transition
  IF v_old_status = p_new_status THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Job is already in %s status', p_new_status)
    );
  END IF;

  -- Update job status
  UPDATE jobs 
  SET status = p_new_status, 
      updated_at = NOW()
  WHERE id = p_job_id;

  -- Auto-trigger stock functions based on new status
  IF p_new_status = 'Scheduled' AND v_old_status != 'In Progress' THEN
    -- Reserve stock when job is scheduled
    v_stock_result := reserve_stock_for_job(p_job_id);
    IF (v_stock_result->>'success')::boolean = false THEN
      v_warnings := array_append(v_warnings, v_stock_result->>'message');
    END IF;
    
  ELSIF p_new_status = 'Completed' THEN
    -- Allocate stock when job is completed
    v_stock_result := confirm_stock_for_job(p_job_id);
    
  ELSIF p_new_status = 'Cancelled' THEN
    -- Return stock when job is cancelled
    v_stock_result := return_stock_from_cancelled_job(p_job_id);
  END IF;

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'job_id', p_job_id,
    'old_status', v_old_status,
    'new_status', p_new_status,
    'warnings', v_warnings,
    'stock_result', v_stock_result,
    'message', format('Job status updated from %s to %s', v_old_status, p_new_status)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: VERIFICATION QUERIES
-- ============================================================================

-- List all functions created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%stock%' OR routine_name LIKE '%job%')
ORDER BY routine_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Functions created:
-- 1. check_stock_availability(job_id) - Check if sufficient stock
-- 2. reserve_stock_for_job(job_id) - Reserve stock for scheduled job
-- 3. confirm_stock_for_job(job_id) - Allocate stock for completed job
-- 4. return_stock_from_cancelled_job(job_id) - Return stock from cancelled job
-- 5. manual_stock_adjustment(product_id, quantity, notes, user_id) - Manual stock edits
-- 6. create_job_from_quote(quote_id) - Create job from accepted quote
-- 7. calculate_job_costing(job_id) - Calculate job financials
-- 8. update_job_status(job_id, status, user_id, notes) - Update status with auto-stock triggers

-- Next steps:
-- 1. Build Jobs List page (src/app/jobs/page.tsx)
-- 2. Build Job Detail page (src/app/jobs/[id]/page.tsx)
-- 3. Build Completion Certificate page (src/app/jobs/[id]/certificate/page.tsx)
-- 4. Add "Create Job" button to quotes detail page
