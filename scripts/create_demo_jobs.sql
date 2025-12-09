-- ============================================================================
-- CREATE DEMO JOBS FROM EXISTING QUOTES
-- Purpose: Convert 3 existing quotes to jobs for demo purposes
-- ============================================================================

-- Get 3 quotes to convert (preferably Accepted status, or any status if none accepted)
DO $$
DECLARE
  v_quote_record RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Loop through first 3 quotes that don't already have jobs
  FOR v_quote_record IN 
    SELECT q.* 
    FROM quotes q
    WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE quote_id = q.id)
    ORDER BY q.created_at DESC
    LIMIT 3
  LOOP
    -- Call the create_job_from_quote function
    PERFORM create_job_from_quote(v_quote_record.id);
    v_count := v_count + 1;
    
    RAISE NOTICE 'Created job from quote: %', v_quote_record.quote_number;
  END LOOP;
  
  RAISE NOTICE 'Total jobs created: %', v_count;
END $$;

-- Update some jobs with different statuses and dates for variety
UPDATE jobs 
SET 
  status = 'Scheduled',
  scheduled_date = CURRENT_DATE + INTERVAL '3 days',
  crew_lead_id = (SELECT id FROM team_members WHERE role = 'Installer' AND status = 'Active' LIMIT 1)
WHERE id IN (SELECT id FROM jobs ORDER BY created_at DESC LIMIT 1);

UPDATE jobs 
SET 
  status = 'In Progress',
  scheduled_date = CURRENT_DATE,
  start_date = CURRENT_DATE,
  crew_lead_id = (SELECT id FROM team_members WHERE role = 'Installer' AND status = 'Active' OFFSET 1 LIMIT 1)
WHERE id IN (SELECT id FROM jobs ORDER BY created_at DESC LIMIT 1 OFFSET 1);

UPDATE jobs 
SET 
  status = 'Draft',
  scheduled_date = NULL
WHERE id IN (SELECT id FROM jobs ORDER BY created_at DESC LIMIT 1 OFFSET 2);

-- Show created jobs
SELECT 
  j.job_number,
  j.status,
  j.scheduled_date,
  j.customer_first_name || ' ' || j.customer_last_name as customer,
  j.site_address,
  q.quote_number
FROM jobs j
JOIN quotes q ON q.id = j.quote_id
ORDER BY j.created_at DESC
LIMIT 3;
