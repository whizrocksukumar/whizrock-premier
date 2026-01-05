-- Add completed_date column to assessments table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Add comment
COMMENT ON COLUMN assessments.completed_date IS 'Date when the assessment was completed';

-- Add index for completed_date to improve query performance
CREATE INDEX IF NOT EXISTS idx_assessments_completed_date ON assessments(completed_date);
