-- ============================================================================
-- VA WORKSPACE - PRODUCT RECOMMENDATIONS SYSTEM
-- Tables for Virtual Assistants to create product recommendations
-- NO pricing visible - products only
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE PRODUCT_RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique identifier
    recommendation_number VARCHAR(50) UNIQUE NOT NULL,
    -- Format: REC-2025-001
    
    version INTEGER DEFAULT 1,
    -- For revisions: 01, 02, 03, etc.
    
    -- Links to other entities
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    -- Links back to the opportunity (bidirectional with opportunities table)
    
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    -- Customer this recommendation is for
    
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    -- Company if B2B customer
    
    -- Creator
    created_by_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    -- VA who created this recommendation
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    -- When VA submitted for review
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'Draft',
    -- Values: Draft, Submitted, Converted to Quote, Rejected, Archived
    
    -- Summary data (calculated/cached)
    section_count INTEGER DEFAULT 0,
    -- Number of sections in this recommendation
    
    total_area_sqm NUMERIC(10,2),
    -- Total area across all sections
    
    total_packs_required INTEGER,
    -- Total packs needed across all products
    
    -- Additional data
    notes TEXT,
    -- VA notes about the recommendation
    
    rejection_reason TEXT,
    -- If rejected, why?
    
    is_active BOOLEAN DEFAULT true,
    -- Soft delete flag
    
    -- Metadata
    CONSTRAINT valid_status CHECK (status IN ('Draft', 'Submitted', 'Converted to Quote', 'Rejected', 'Archived'))
);

-- Create indexes for product_recommendations
CREATE INDEX IF NOT EXISTS idx_product_recs_rec_number ON product_recommendations(recommendation_number);
CREATE INDEX IF NOT EXISTS idx_product_recs_opportunity ON product_recommendations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_product_recs_client ON product_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_product_recs_company ON product_recommendations(company_id);
CREATE INDEX IF NOT EXISTS idx_product_recs_created_by ON product_recommendations(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_product_recs_status ON product_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_product_recs_created_at ON product_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_product_recs_submitted_at ON product_recommendations(submitted_at);

-- ============================================================================
-- PART 2: CREATE RECOMMENDATION_SECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to parent recommendation
    recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE NOT NULL,
    
    -- Section identification
    app_type_id UUID REFERENCES app_types(id) ON DELETE SET NULL,
    -- Application type (Ceiling, Wall, Underfloor, etc.) with associated color
    
    custom_section_name VARCHAR(100),
    -- If not using app_type, custom name like "Garage Ceiling"
    
    -- Ordering
    section_order INTEGER DEFAULT 1,
    -- Display order in the recommendation
    
    -- Additional data
    notes TEXT,
    -- VA notes about this section
    
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for recommendation_sections
CREATE INDEX IF NOT EXISTS idx_recommendation_sections_rec_id ON recommendation_sections(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_sections_app_type ON recommendation_sections(app_type_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_sections_order ON recommendation_sections(section_order);

-- ============================================================================
-- PART 3: CREATE RECOMMENDATION_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to parent section
    recommendation_section_id UUID REFERENCES recommendation_sections(id) ON DELETE CASCADE NOT NULL,
    
    -- Product
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    -- Prevent deleting products that are referenced
    
    -- Quantities
    area_sqm NUMERIC(10,2) NOT NULL,
    -- Area this product will cover
    
    waste_percent NUMERIC(5,2) DEFAULT 10.00,
    -- Waste percentage (from products table or manual entry)
    
    packs_required INTEGER NOT NULL,
    -- Calculated: CEIL((area_sqm * (1 + waste_percent/100)) / product.bale_size_sqm)
    
    -- Ordering
    sort_order INTEGER DEFAULT 1,
    -- Display order within the section
    
    -- Additional data
    notes TEXT,
    -- VA notes about this line item
    
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT valid_area CHECK (area_sqm > 0),
    CONSTRAINT valid_waste CHECK (waste_percent >= 0 AND waste_percent <= 100),
    CONSTRAINT valid_packs CHECK (packs_required > 0)
);

-- Create indexes for recommendation_items
CREATE INDEX IF NOT EXISTS idx_recommendation_items_section_id ON recommendation_items(recommendation_section_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_product_id ON recommendation_items(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_sort_order ON recommendation_items(sort_order);

-- ============================================================================
-- PART 4: CREATE AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================

-- Trigger for product_recommendations (reuse existing function)
DROP TRIGGER IF EXISTS update_product_recs_updated_at ON product_recommendations;
CREATE TRIGGER update_product_recs_updated_at
    BEFORE UPDATE ON product_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: ADD BIDIRECTIONAL FOREIGN KEY TO OPPORTUNITIES
-- (This was already done in opportunities migration, but verify here)
-- ============================================================================

DO $$ 
BEGIN
    -- Add FK from opportunities to product_recommendations if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_opportunities_product_rec'
    ) THEN
        ALTER TABLE opportunities 
        ADD CONSTRAINT fk_opportunities_product_rec
        FOREIGN KEY (product_recommendation_id) 
        REFERENCES product_recommendations(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 6: INSERT SAMPLE DATA - PRODUCT RECOMMENDATIONS
-- ============================================================================

DO $$
DECLARE
    va_user_id UUID;
    client_1 UUID;
    client_2 UUID;
    client_3 UUID;
    opp_1 UUID;
    opp_2 UUID;
    rec_1 UUID;
    rec_2 UUID;
    rec_3 UUID;
BEGIN
    -- Get VA user
    SELECT id INTO va_user_id FROM team_members WHERE role = 'VA' LIMIT 1;
    
    -- Get or create sample clients
    SELECT id INTO client_1 FROM clients WHERE email = 'lisa.anderson@email.com' LIMIT 1;
    SELECT id INTO client_2 FROM clients WHERE email = 'michael.brown@buildco.nz' LIMIT 1;
    SELECT id INTO client_3 FROM clients WHERE email = 'patricia.clark@email.com' LIMIT 1;
    
    -- Get opportunities
    SELECT id INTO opp_1 FROM opportunities WHERE opp_number = 'OPP-2025-001';
    SELECT id INTO opp_2 FROM opportunities WHERE opp_number = 'OPP-2025-002';
    
    -- Recommendation 1: Lisa Anderson (Submitted, linked to OPP-2025-001)
    INSERT INTO product_recommendations (
        id, recommendation_number, version, opportunity_id, client_id, created_by_user_id,
        status, section_count, total_area_sqm, total_packs_required, notes,
        created_at, submitted_at
    ) VALUES (
        gen_random_uuid(), 'REC-2025-001', 1, opp_1, client_1, va_user_id,
        'Submitted', 3, 125.50, 28, 'Customer wants glasswool products. Ceiling insulation is priority. Underfloor mentioned as future project.',
        '2025-12-08 15:00:00', '2025-12-09 16:30:00'
    ) RETURNING id INTO rec_1;
    
    -- Recommendation 2: Michael Brown (Draft, not yet submitted)
    INSERT INTO product_recommendations (
        id, recommendation_number, version, opportunity_id, client_id, created_by_user_id,
        status, section_count, total_area_sqm, total_packs_required, notes,
        created_at
    ) VALUES (
        gen_random_uuid(), 'REC-2025-002', 1, opp_2, client_2, va_user_id,
        'Draft', 2, 245.00, 52, 'New build - full insulation package. Still awaiting final measurements for garage.',
        '2025-12-06 10:00:00'
    ) RETURNING id INTO rec_2;
    
    -- Recommendation 3: Patricia Clark (Converted to Quote)
    INSERT INTO product_recommendations (
        id, recommendation_number, version, opportunity_id, client_id, created_by_user_id,
        status, section_count, total_area_sqm, total_packs_required, notes,
        created_at, submitted_at
    ) VALUES (
        gen_random_uuid(), 'REC-2025-003', 1, NULL, client_3, va_user_id,
        'Converted to Quote', 2, 89.75, 19, 'Wall insulation package. Customer approved and quote QUO-2025-123 generated.',
        '2025-11-20 14:00:00', '2025-11-22 11:00:00'
    ) RETURNING id INTO rec_3;

END $$;

-- ============================================================================
-- PART 7: INSERT SAMPLE DATA - RECOMMENDATION SECTIONS
-- ============================================================================

DO $$
DECLARE
    rec_1 UUID;
    rec_2 UUID;
    rec_3 UUID;
    app_type_ceiling UUID;
    app_type_wall UUID;
    app_type_underfloor UUID;
    section_1_1 UUID;
    section_1_2 UUID;
    section_1_3 UUID;
    section_2_1 UUID;
    section_2_2 UUID;
    section_3_1 UUID;
    section_3_2 UUID;
BEGIN
    -- Get recommendation IDs
    SELECT id INTO rec_1 FROM product_recommendations WHERE recommendation_number = 'REC-2025-001';
    SELECT id INTO rec_2 FROM product_recommendations WHERE recommendation_number = 'REC-2025-002';
    SELECT id INTO rec_3 FROM product_recommendations WHERE recommendation_number = 'REC-2025-003';
    
    -- Get app_type IDs (if app_types table exists)
    SELECT id INTO app_type_ceiling FROM app_types WHERE name ILIKE '%ceiling%' LIMIT 1;
    SELECT id INTO app_type_wall FROM app_types WHERE name ILIKE '%wall%' LIMIT 1;
    SELECT id INTO app_type_underfloor FROM app_types WHERE name ILIKE '%underfloor%' OR name ILIKE '%floor%' LIMIT 1;
    
    -- Sections for REC-2025-001 (Lisa Anderson - Submitted)
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_1, app_type_ceiling, 'Main House Ceiling', 1, 
        'Existing batts in poor condition. Remove and replace with R3.6 glasswool.'
    ) RETURNING id INTO section_1_1;
    
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_1, app_type_wall, 'Interior Walls', 2,
        'Acoustic insulation for bedroom walls. Customer noise reduction priority.'
    ) RETURNING id INTO section_1_2;
    
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_1, app_type_underfloor, 'Underfloor', 3,
        'Optional - customer considering for winter. Quote both with and without.'
    ) RETURNING id INTO section_1_3;
    
    -- Sections for REC-2025-002 (Michael Brown - Draft)
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_2, app_type_ceiling, 'Full House Ceiling', 1,
        'New build. R3.6 minimum required by building code. Using glasswool batts.'
    ) RETURNING id INTO section_2_1;
    
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_2, app_type_wall, 'External Walls', 2,
        'R2.8 wall insulation. Polyester segments for cavity walls.'
    ) RETURNING id INTO section_2_2;
    
    -- Sections for REC-2025-003 (Patricia Clark - Converted)
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_3, app_type_wall, 'Living Room Walls', 1,
        'Retrofit insulation. Customer wants warmer living spaces.'
    ) RETURNING id INTO section_3_1;
    
    INSERT INTO recommendation_sections (id, recommendation_id, app_type_id, custom_section_name, section_order, notes)
    VALUES (
        gen_random_uuid(), rec_3, app_type_wall, 'Bedroom Walls', 2,
        'Same product as living room for consistency.'
    ) RETURNING id INTO section_3_2;

END $$;

-- ============================================================================
-- PART 8: INSERT SAMPLE DATA - RECOMMENDATION ITEMS (PRODUCTS)
-- ============================================================================

DO $$
DECLARE
    section_1_1 UUID; -- REC-001 Ceiling
    section_1_2 UUID; -- REC-001 Walls
    section_1_3 UUID; -- REC-001 Underfloor
    section_2_1 UUID; -- REC-002 Ceiling
    section_2_2 UUID; -- REC-002 Walls
    section_3_1 UUID; -- REC-003 Living Room
    section_3_2 UUID; -- REC-003 Bedroom
    
    product_glasswool_ceiling UUID;
    product_glasswool_wall UUID;
    product_polyester_wall UUID;
    product_underfloor UUID;
BEGIN
    -- Get section IDs by querying recommendations and section order
    SELECT rs.id INTO section_1_1 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-001' AND rs.section_order = 1;
    
    SELECT rs.id INTO section_1_2 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-001' AND rs.section_order = 2;
    
    SELECT rs.id INTO section_1_3 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-001' AND rs.section_order = 3;
    
    SELECT rs.id INTO section_2_1 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-002' AND rs.section_order = 1;
    
    SELECT rs.id INTO section_2_2 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-002' AND rs.section_order = 2;
    
    SELECT rs.id INTO section_3_1 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-003' AND rs.section_order = 1;
    
    SELECT rs.id INTO section_3_2 
    FROM recommendation_sections rs
    JOIN product_recommendations pr ON rs.recommendation_id = pr.id
    WHERE pr.recommendation_number = 'REC-2025-003' AND rs.section_order = 2;
    
    -- Get some product IDs (adjust SKU/names based on your products table)
    SELECT id INTO product_glasswool_ceiling FROM products WHERE sku ILIKE '%glasswool%' AND sku ILIKE '%r3.6%' LIMIT 1;
    SELECT id INTO product_glasswool_wall FROM products WHERE sku ILIKE '%glasswool%' AND sku ILIKE '%r2.%' LIMIT 1;
    SELECT id INTO product_polyester_wall FROM products WHERE sku ILIKE '%polyester%' AND sku ILIKE '%r2.%' LIMIT 1;
    SELECT id INTO product_underfloor FROM products WHERE sku ILIKE '%underfloor%' OR sku ILIKE '%floor%' LIMIT 1;
    
    -- If no products found, use first available products as fallback
    IF product_glasswool_ceiling IS NULL THEN
        SELECT id INTO product_glasswool_ceiling FROM products LIMIT 1;
    END IF;
    
    IF product_glasswool_wall IS NULL THEN
        SELECT id INTO product_glasswool_wall FROM products OFFSET 1 LIMIT 1;
    END IF;
    
    IF product_polyester_wall IS NULL THEN
        SELECT id INTO product_polyester_wall FROM products OFFSET 2 LIMIT 1;
    END IF;
    
    IF product_underfloor IS NULL THEN
        SELECT id INTO product_underfloor FROM products OFFSET 3 LIMIT 1;
    END IF;
    
    -- Items for REC-2025-001 Section 1 (Ceiling)
    IF section_1_1 IS NOT NULL AND product_glasswool_ceiling IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_1_1, product_glasswool_ceiling, 68.50, 10.00, 15, 1, 'Main living areas and bedrooms');
    END IF;
    
    -- Items for REC-2025-001 Section 2 (Walls)
    IF section_1_2 IS NOT NULL AND product_glasswool_wall IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_1_2, product_glasswool_wall, 32.00, 10.00, 8, 1, '3 bedroom walls - acoustic insulation');
    END IF;
    
    -- Items for REC-2025-001 Section 3 (Underfloor)
    IF section_1_3 IS NOT NULL AND product_underfloor IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_1_3, product_underfloor, 25.00, 15.00, 5, 1, 'Optional - quote separately');
    END IF;
    
    -- Items for REC-2025-002 Section 1 (Ceiling)
    IF section_2_1 IS NOT NULL AND product_glasswool_ceiling IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_2_1, product_glasswool_ceiling, 156.00, 10.00, 35, 1, 'Entire house ceiling - R3.6 building code compliant');
    END IF;
    
    -- Items for REC-2025-002 Section 2 (Walls)
    IF section_2_2 IS NOT NULL AND product_polyester_wall IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_2_2, product_polyester_wall, 89.00, 10.00, 17, 1, 'All external walls - R2.8 polyester segments');
    END IF;
    
    -- Items for REC-2025-003 Section 1 (Living Room)
    IF section_3_1 IS NOT NULL AND product_glasswool_wall IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_3_1, product_glasswool_wall, 48.50, 10.00, 11, 1, 'Living room retrofit');
    END IF;
    
    -- Items for REC-2025-003 Section 2 (Bedroom)
    IF section_3_2 IS NOT NULL AND product_glasswool_wall IS NOT NULL THEN
        INSERT INTO recommendation_items (recommendation_section_id, product_id, area_sqm, waste_percent, packs_required, sort_order, notes)
        VALUES (section_3_2, product_glasswool_wall, 41.25, 10.00, 8, 1, 'Master bedroom walls');
    END IF;

END $$;

-- ============================================================================
-- PART 9: UPDATE OPPORTUNITY LINKS
-- ============================================================================

-- Link OPP-2025-001 to REC-2025-001 (bidirectional)
DO $$
DECLARE
    opp_id UUID;
    rec_id UUID;
BEGIN
    SELECT id INTO opp_id FROM opportunities WHERE opp_number = 'OPP-2025-001';
    SELECT id INTO rec_id FROM product_recommendations WHERE recommendation_number = 'REC-2025-001';
    
    IF opp_id IS NOT NULL AND rec_id IS NOT NULL THEN
        -- Update opportunity to link to recommendation
        UPDATE opportunities 
        SET product_recommendation_id = rec_id,
            recommendation_status = 'Submitted'
        WHERE id = opp_id;
    END IF;
END $$;

-- ============================================================================
-- PART 10: VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Count recommendations by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(section_count) as total_sections,
    SUM(total_packs_required) as total_packs
FROM product_recommendations
WHERE is_active = true
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'Draft' THEN 1
        WHEN 'Submitted' THEN 2
        WHEN 'Converted to Quote' THEN 3
        WHEN 'Rejected' THEN 4
        WHEN 'Archived' THEN 5
    END;

-- Query 2: Recommendations by VA (created_by_user_id)
SELECT 
    tm.first_name || ' ' || tm.last_name as va_name,
    pr.status,
    COUNT(*) as rec_count,
    SUM(pr.total_area_sqm) as total_area,
    SUM(pr.total_packs_required) as total_packs
FROM product_recommendations pr
JOIN team_members tm ON pr.created_by_user_id = tm.id
WHERE pr.is_active = true
GROUP BY tm.first_name, tm.last_name, pr.status
ORDER BY va_name, pr.status;

-- Query 3: Recommendations linked to opportunities
SELECT 
    pr.recommendation_number,
    pr.status as rec_status,
    o.opp_number,
    o.stage as opp_stage,
    o.contact_first_name || ' ' || o.contact_last_name as customer_name,
    pr.section_count,
    pr.total_area_sqm,
    pr.total_packs_required,
    pr.created_at,
    pr.submitted_at
FROM product_recommendations pr
LEFT JOIN opportunities o ON pr.opportunity_id = o.id
WHERE pr.is_active = true
ORDER BY pr.created_at DESC;

-- Query 4: Complete recommendation with all sections and products (REC-2025-001)
SELECT 
    pr.recommendation_number,
    pr.version,
    pr.status,
    c.first_name || ' ' || c.last_name as customer_name,
    rs.custom_section_name as section_name,
    rs.section_order,
    p.sku as product_sku,
    p.name as product_name,
    ri.area_sqm,
    ri.waste_percent,
    ri.packs_required,
    ri.notes as item_notes
FROM product_recommendations pr
JOIN clients c ON pr.client_id = c.id
LEFT JOIN recommendation_sections rs ON pr.id = rs.recommendation_id
LEFT JOIN recommendation_items ri ON rs.id = ri.recommendation_section_id
LEFT JOIN products p ON ri.product_id = p.id
WHERE pr.recommendation_number = 'REC-2025-001'
ORDER BY rs.section_order, ri.sort_order;

-- Query 5: VA Workspace dashboard metrics
SELECT 
    COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
    COUNT(*) FILTER (WHERE status = 'Submitted') as submitted_count,
    COUNT(*) FILTER (WHERE status = 'Converted to Quote') as converted_count,
    COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
    SUM(total_packs_required) as total_packs_all,
    ROUND(AVG(total_area_sqm), 2) as avg_area_per_rec
FROM product_recommendations
WHERE is_active = true;

-- Query 6: Recommendations awaiting sales rep action
SELECT 
    pr.recommendation_number,
    c.first_name || ' ' || c.last_name as customer_name,
    c.email as customer_email,
    pr.section_count,
    pr.total_packs_required,
    pr.submitted_at,
    EXTRACT(DAY FROM NOW() - pr.submitted_at) as days_pending,
    pr.notes
FROM product_recommendations pr
JOIN clients c ON pr.client_id = c.id
WHERE pr.status = 'Submitted'
    AND pr.is_active = true
ORDER BY pr.submitted_at;

-- ============================================================================
-- EXPLANATION OF RELATIONSHIPS & USAGE
-- ============================================================================

/*
RELATIONSHIP DIAGRAM:

product_recommendations
    ├── recommendation_sections (1:many)
    │   └── recommendation_items (1:many)
    │       └── products (many:1)
    ├── opportunities (1:1 bidirectional)
    ├── clients (many:1)
    ├── companies (many:1, optional)
    └── team_members (created_by_user_id)

WORKFLOW:

1. VA CREATES NEW RECOMMENDATION:
   - Navigate to VA Workspace
   - Click "Create Recommendation"
   - Select client or opportunity
   - Add sections (Ceiling, Walls, etc.)
   - For each section, add products with area
   - System calculates packs_required
   - Save as Draft

2. VA WORKS ON DRAFT:
   - Can add/remove sections
   - Can add/remove products
   - Can adjust areas and waste percentages
   - System recalculates totals
   - Status remains "Draft"

3. VA SUBMITS RECOMMENDATION:
   - Review all sections and products
   - Click "Submit for Review"
   - Status changes to "Submitted"
   - submitted_at timestamp recorded
   - If linked to opportunity:
     * Update opportunity.recommendation_status = 'Submitted'
     * Create task for sales rep to review

4. SALES REP REVIEWS:
   - See submitted recommendation in queue
   - Review products and quantities
   - Either:
     a) Convert to quote (adds pricing) → status = 'Converted to Quote'
     b) Reject and ask VA to revise → status = 'Rejected', add rejection_reason
     c) Archive if no longer needed → status = 'Archived'

5. CONVERT TO QUOTE:
   - Sales rep clicks "Convert to Quote"
   - Creates new quote record
   - Copies all sections and items
   - Adds pricing (cost, sell, markup)
   - Links quote.recommendation_id to this recommendation
   - Updates recommendation.status = 'Converted to Quote'
   - If linked to opportunity:
     * Update opportunity.recommendation_status = 'Converted to Quote'
     * Update opportunity.stage = 'QUOTED'

QUERYING EXAMPLES:

-- Get all VA's recommendations
SELECT * FROM product_recommendations 
WHERE created_by_user_id = '<uuid>' 
ORDER BY created_at DESC;

-- Get recommendation with full details
SELECT 
    pr.*,
    json_agg(
        json_build_object(
            'section', rs.custom_section_name,
            'items', (
                SELECT json_agg(
                    json_build_object(
                        'product', p.name,
                        'area', ri.area_sqm,
                        'packs', ri.packs_required
                    )
                )
                FROM recommendation_items ri
                JOIN products p ON ri.product_id = p.id
                WHERE ri.recommendation_section_id = rs.id
            )
        )
    ) as sections
FROM product_recommendations pr
LEFT JOIN recommendation_sections rs ON pr.id = rs.recommendation_id
WHERE pr.id = '<uuid>'
GROUP BY pr.id;

-- Get pending recommendations for sales rep review
SELECT pr.*, c.first_name, c.last_name, c.email
FROM product_recommendations pr
JOIN clients c ON pr.client_id = c.id
WHERE pr.status = 'Submitted'
ORDER BY pr.submitted_at;

-- Calculate total packs for a recommendation
SELECT 
    pr.recommendation_number,
    SUM(ri.packs_required) as total_packs,
    COUNT(DISTINCT rs.id) as section_count,
    COUNT(ri.id) as item_count
FROM product_recommendations pr
JOIN recommendation_sections rs ON pr.id = rs.recommendation_id
JOIN recommendation_items ri ON rs.id = ri.recommendation_section_id
WHERE pr.id = '<uuid>'
GROUP BY pr.recommendation_number;

INDEXES EXPLAINED:

- product_recommendations.status: Fast filtering by workflow stage
- product_recommendations.created_by_user_id: Fast lookup of VA's work
- product_recommendations.opportunity_id: Fast join to opportunities
- recommendation_sections.recommendation_id: Fast lookup of sections
- recommendation_items.recommendation_section_id: Fast lookup of items
- recommendation_items.product_id: Fast join to product catalog

VALIDATION RULES:

1. area_sqm must be > 0
2. waste_percent must be between 0 and 100
3. packs_required must be > 0
4. status must be one of: Draft, Submitted, Converted to Quote, Rejected, Archived
5. Cannot delete products referenced in recommendations (RESTRICT constraint)

FUTURE ENHANCEMENTS:

1. Add recommendation_revisions table for version history
2. Add recommendation_comments for VA-Sales collaboration
3. Add auto-calculation triggers for total_area_sqm and total_packs_required
4. Add stock availability checks before submission
5. Add PDF generation for recommendations (VA-friendly format, no pricing)
6. Add email notifications when submitted/converted/rejected
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
