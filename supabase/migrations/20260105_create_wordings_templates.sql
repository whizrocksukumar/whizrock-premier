-- ============================================================================
-- WORDINGS TEMPLATES TABLE
-- Pre-defined wording templates for assessments
-- ============================================================================

-- Create wordings_templates table
CREATE TABLE IF NOT EXISTS wordings_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wording_text TEXT NOT NULL,
    area_label TEXT,
    result_type VARCHAR(50) CHECK (result_type IN ('Pass', 'Fail', 'Exempt', 'Pending')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for wordings_templates
CREATE INDEX IF NOT EXISTS idx_wordings_templates_area_label ON wordings_templates(area_label);
CREATE INDEX IF NOT EXISTS idx_wordings_templates_result_type ON wordings_templates(result_type);
CREATE INDEX IF NOT EXISTS idx_wordings_templates_is_active ON wordings_templates(is_active);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_wordings_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wordings_templates_updated_at ON wordings_templates;
CREATE TRIGGER trigger_update_wordings_templates_updated_at
    BEFORE UPDATE ON wordings_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_wordings_templates_updated_at();

-- Insert sample wording templates
INSERT INTO wordings_templates (wording_text, area_label, result_type, is_active)
VALUES
    -- Ceiling wordings
    ('Ceiling insulation meets NZ Building Code requirements with R-value exceeding minimum standards.', 'ceiling', 'Pass', true),
    ('Ceiling space has adequate ventilation and no signs of moisture damage.', 'ceiling', 'Pass', true),
    ('Ceiling insulation is insufficient and does not meet current Building Code requirements.', 'ceiling', 'Fail', true),
    ('Ceiling has moisture damage and requires immediate attention before insulation can be installed.', 'ceiling', 'Fail', true),
    ('Ceiling insulation partially meets requirements but gaps exist in coverage.', 'ceiling', 'Exempt', true),
    ('Ceiling assessment pending completion of moisture testing.', 'ceiling', 'Pending', true),
    
    -- Wall wordings
    ('Wall insulation meets required R-value standards with proper installation.', 'wall', 'Pass', true),
    ('External walls have appropriate thermal barriers installed correctly.', 'wall', 'Pass', true),
    ('Wall cavities lack adequate insulation and fail to meet Building Code standards.', 'wall', 'Fail', true),
    ('Wall insulation has deteriorated and requires replacement to meet standards.', 'wall', 'Fail', true),
    ('Some wall sections meet requirements while others need additional insulation.', 'wall', 'Exempt', true),
    ('Wall assessment pending structural engineer review.', 'wall', 'Pending', true),
    
    -- Underfloor wordings
    ('Underfloor insulation properly installed with adequate ground moisture barrier.', 'underfloor', 'Pass', true),
    ('Subfloor space well-ventilated with insulation meeting R-value requirements.', 'underfloor', 'Pass', true),
    ('Underfloor insulation missing or inadequate, failing to meet minimum standards.', 'underfloor', 'Fail', true),
    ('Subfloor has moisture issues that must be resolved before insulation installation.', 'underfloor', 'Fail', true),
    ('Underfloor insulation partially compliant; some areas inaccessible for full installation.', 'underfloor', 'Exempt', true),
    ('Underfloor assessment pending crawl space accessibility improvements.', 'underfloor', 'Pending', true),
    
    -- Roof wordings
    ('Roof structure in good condition with adequate insulation and ventilation.', 'roof', 'Pass', true),
    ('Roof space properly insulated with correct R-value for climate zone.', 'roof', 'Pass', true),
    ('Roof insulation severely deteriorated or missing, requiring immediate replacement.', 'roof', 'Fail', true),
    ('Roof has structural issues that prevent proper insulation installation.', 'roof', 'Fail', true),
    ('Roof partially meets standards; some sections require additional work.', 'roof', 'Exempt', true),
    ('Roof assessment pending weather-related access issues.', 'roof', 'Pending', true),
    
    -- General wordings
    ('Area meets all current Building Code insulation requirements.', null, 'Pass', true),
    ('Insulation installation quality is excellent with no defects noted.', null, 'Pass', true),
    ('Area does not meet minimum Building Code requirements and requires remediation.', null, 'Fail', true),
    ('Significant defects found that require immediate corrective action.', null, 'Fail', true),
    ('Area partially complies with standards; minor improvements recommended.', null, 'Exempt', true),
    ('Assessment incomplete; awaiting additional information or access.', null, 'Pending', true)
ON CONFLICT DO NOTHING;

-- Grant permissions
ALTER TABLE wordings_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read wordings templates
CREATE POLICY "Allow authenticated users to read wordings templates"
ON wordings_templates FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow admin users to insert/update/delete
CREATE POLICY "Allow admin users to manage wordings templates"
ON wordings_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
