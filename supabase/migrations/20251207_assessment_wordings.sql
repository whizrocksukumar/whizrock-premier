-- ============================================================================
-- ASSESSMENT WORDINGS SYSTEM
-- Create assessment_areas table and assessment_wordings table
-- NOTE: assessment_photos already exists from PHASE_1A migration
-- ============================================================================

-- STEP 1: Create assessment_areas table (NEW - does not exist yet)
CREATE TABLE IF NOT EXISTS assessment_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    area_name VARCHAR(100) NOT NULL,
    square_metres NUMERIC(10,2) NOT NULL DEFAULT 0,
    existing_insulation_type VARCHAR(100),
    recommended_r_value VARCHAR(50),
    removal_required BOOLEAN DEFAULT false,
    notes TEXT,
    result_type VARCHAR(50) DEFAULT 'Pending' CHECK (result_type IN ('Pass', 'Fail', 'Exempt', 'Pending')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for assessment_areas
CREATE INDEX IF NOT EXISTS idx_assessment_areas_assessment ON assessment_areas(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_areas_result_type ON assessment_areas(result_type);

-- STEP 2: Update assessment_photos table to add area_name column if not exists
-- (assessment_photos already exists from PHASE_1A, but may need area_name column)
ALTER TABLE assessment_photos 
ADD COLUMN IF NOT EXISTS area_name VARCHAR(100);

-- Create index on area_name for filtering photos by area
CREATE INDEX IF NOT EXISTS idx_assessment_photos_area ON assessment_photos(area_name);

-- STEP 3: Create assessment_wordings table (NEW)
CREATE TABLE IF NOT EXISTS assessment_wordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES assessment_areas(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL CHECK (result_type IN ('Pass', 'Fail', 'Exempt', 'Pending')),
    wordings TEXT,
    recommended_action TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for assessment_wordings
CREATE INDEX IF NOT EXISTS idx_assessment_wordings_assessment ON assessment_wordings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_wordings_area ON assessment_wordings(area_id);
CREATE INDEX IF NOT EXISTS idx_assessment_wordings_result_type ON assessment_wordings(result_type);

-- STEP 4: Add trigger to update updated_at timestamp for assessment_areas
CREATE OR REPLACE FUNCTION update_assessment_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assessment_areas_updated_at ON assessment_areas;
CREATE TRIGGER trigger_update_assessment_areas_updated_at
    BEFORE UPDATE ON assessment_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_areas_updated_at();

-- STEP 5: Add trigger to update updated_at timestamp for assessment_wordings
CREATE OR REPLACE FUNCTION update_assessment_wordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assessment_wordings_updated_at ON assessment_wordings;
CREATE TRIGGER trigger_update_assessment_wordings_updated_at
    BEFORE UPDATE ON assessment_wordings
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_wordings_updated_at();

-- STEP 6: Add comments for documentation
COMMENT ON TABLE assessment_areas IS 'Stores individual areas assessed within an assessment (e.g., Ceiling, Wall, Floor)';
COMMENT ON COLUMN assessment_areas.area_name IS 'Name of the area assessed (e.g., "Living Room Ceiling", "Bedroom Wall")';
COMMENT ON COLUMN assessment_areas.square_metres IS 'Total area in square metres';
COMMENT ON COLUMN assessment_areas.result_type IS 'Current result status: Pass, Fail, Conditional, or Pending';

COMMENT ON TABLE assessment_wordings IS 'Stores Pass/Fail/Exempt result wordings for assessment areas';
COMMENT ON COLUMN assessment_wordings.result_type IS 'Type of result: Pass, Fail, Exempt, or Pending';
COMMENT ON COLUMN assessment_wordings.wordings IS 'Detailed description/findings for the assessment result';
COMMENT ON COLUMN assessment_wordings.recommended_action IS 'Recommended actions based on the assessment result';

-- Verification query
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('assessment_wordings', 'assessment_areas')
AND column_name IN ('result_type', 'wordings', 'recommended_action')
ORDER BY table_name, ordinal_position;
