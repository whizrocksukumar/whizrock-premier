-- Add follow_up_date column to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Add comment
COMMENT ON COLUMN opportunities.follow_up_date IS 'Follow-up date for the opportunity';
