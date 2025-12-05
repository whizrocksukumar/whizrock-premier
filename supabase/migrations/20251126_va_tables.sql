-- Create recommendation_calculation_lines table
CREATE TABLE IF NOT EXISTS recommendation_calculation_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES recommendation_sections(id) ON DELETE CASCADE,
    
    -- For Openings
    marked_location TEXT,
    width_m NUMERIC,
    
    -- For Insulation
    length_m NUMERIC,
    raked_m NUMERIC,
    openings_area_sqm NUMERIC,
    level TEXT,
    
    -- Shared
    height_m NUMERIC,
    area_sqm NUMERIC,
    sort_order INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_recommendation_calc_lines_section_id ON recommendation_calculation_lines(section_id);
