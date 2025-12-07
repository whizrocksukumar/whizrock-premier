-- ============================================================================
-- OPPORTUNITIES & TASKS MANAGEMENT SYSTEM
-- Replaces "Enquiries" with proper sales pipeline (Opportunities + Tasks)
-- Includes VA Workspace integration for product recommendations
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE OPPORTUNITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique identifier
    opp_number VARCHAR(50) UNIQUE NOT NULL,
    -- Format: OPP-2025-001
    
    -- Customer relationships
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Contact information (duplicated for quick access)
    contact_first_name VARCHAR(100) NOT NULL,
    contact_last_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_type VARCHAR(50) DEFAULT 'Primary Contact',
    -- Values: Primary Contact, Decision Maker, Influencer, Other
    
    -- Client classification
    client_type VARCHAR(50) DEFAULT 'Homeowner',
    -- Values: Homeowner, Builder, Developer, Contractor, Business, Other
    
    -- Site details
    site_address TEXT,
    site_city VARCHAR(100),
    site_postcode VARCHAR(20),
    
    -- Pipeline stage (5-stage Kanban)
    stage VARCHAR(50) DEFAULT 'NEW' NOT NULL,
    -- Values: NEW, QUALIFIED, QUOTED, WON, LOST
    
    sub_status VARCHAR(100),
    -- Detailed workflow within each stage
    -- Examples: 
    --   NEW: "Awaiting Contact", "Contact Attempted", "Meeting Scheduled"
    --   QUALIFIED: "Needs Assessment", "Assessment Scheduled", "Assessment Complete"
    --   QUOTED: "Quote Draft", "Quote Sent", "Follow-up Required", "Negotiating"
    --   WON: "Contract Signed", "Job Scheduled", "In Progress", "Completed"
    --   LOST: "Price Too High", "Chose Competitor", "No Response", "Not Interested"
    
    -- VA Workspace Integration (CRITICAL ADDITION)
    product_recommendation_id UUID,
    -- Links to VA's product recommendation (FK added later)
    
    recommendation_status VARCHAR(50),
    -- Values: Not Started, In Progress, Submitted, Converted to Quote, Rejected
    -- Tracks the VA recommendation workflow stage
    
    -- Links to other entities
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    
    -- Financial estimates
    estimated_value NUMERIC(12,2),
    -- Estimated opportunity value
    
    actual_value NUMERIC(12,2),
    -- Actual won/lost value
    
    -- Assignment
    sales_rep_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,
    -- Target close date
    
    -- Additional data
    notes TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_opp_number ON opportunities(opp_number);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_sales_rep ON opportunities(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assessment ON opportunities(assessment_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_product_rec ON opportunities(product_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);

-- ============================================================================
-- PART 2: CREATE TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to opportunity
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
    
    -- Task details
    task_description TEXT NOT NULL,
    task_type VARCHAR(100),
    -- Examples: "Call Customer", "Schedule Assessment", "Create Recommendation", 
    --           "Send Quote", "Follow Up", "Site Visit", "Document Upload"
    
    -- Assignment
    created_by_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    
    -- Scheduling
    due_date DATE,
    due_time TIME,
    scheduled_date DATE,
    -- Can be different from due_date (e.g., task due Dec 15, scheduled for Dec 10)
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'Not Started',
    -- Values: Not Started, In Progress, Completed, Cancelled
    
    priority VARCHAR(20) DEFAULT 'Normal',
    -- Values: Low, Normal, High, Urgent
    
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    -- Progress tracking: 0-100%
    
    -- Completion
    completed_at TIMESTAMPTZ,
    
    -- Additional data
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_opportunity ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- ============================================================================
-- PART 3: CREATE TASK_ASSIGNMENTS TABLE (Optional - for multiple assignees)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to task
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    
    -- Assigned user
    user_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    
    -- Assignment metadata
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assignment_order INTEGER DEFAULT 1,
    -- For tasks requiring sequential work by multiple people
    
    -- Unique constraint: one user can't be assigned to same task twice
    UNIQUE(task_id, user_id)
);

-- Create indexes for task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

-- ============================================================================
-- PART 3.5: CREATE OPPORTUNITY_ATTACHMENTS TABLE
-- For storing files sent to VA with opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunity_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to opportunity
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
    
    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    -- URL to file in storage (Supabase Storage bucket)
    
    file_type VARCHAR(100),
    -- MIME type: image/jpeg, application/pdf, etc.
    
    file_size BIGINT,
    -- File size in bytes
    
    file_category VARCHAR(50),
    -- Values: Assessment Photo, Floor Plan, Quote, Other
    
    description TEXT,
    -- Optional description of the file
    
    -- Metadata
    uploaded_by_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for opportunity_attachments
CREATE INDEX IF NOT EXISTS idx_opp_attachments_opportunity ON opportunity_attachments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_attachments_uploaded_by ON opportunity_attachments(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_opp_attachments_uploaded_at ON opportunity_attachments(uploaded_at);

-- ============================================================================
-- PART 4: ALTER PRODUCT_RECOMMENDATIONS TABLE (if exists)
-- Add reverse link from recommendations back to opportunities
-- ============================================================================

-- Check if product_recommendations table exists, then add column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_recommendations'
    ) THEN
        -- Add opportunity_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'product_recommendations' 
            AND column_name = 'opportunity_id'
        ) THEN
            ALTER TABLE product_recommendations 
            ADD COLUMN opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;
            
            CREATE INDEX IF NOT EXISTS idx_product_recs_opportunity 
            ON product_recommendations(opportunity_id);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PART 5: ADD FOREIGN KEY CONSTRAINTS (bidirectional links)
-- ============================================================================

-- Add FK from opportunities to product_recommendations (if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_recommendations'
    ) THEN
        ALTER TABLE opportunities 
        ADD CONSTRAINT fk_opportunities_product_rec
        FOREIGN KEY (product_recommendation_id) 
        REFERENCES product_recommendations(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 6: CREATE AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for opportunities
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 7: INSERT SAMPLE OPPORTUNITIES
-- ============================================================================

-- Get team member IDs for assignment (adjust these UUIDs based on your data)
DO $$
DECLARE
    sales_rep_1 UUID;
    sales_rep_2 UUID;
    va_user UUID;
BEGIN
    -- Get first sales rep
    SELECT id INTO sales_rep_1 FROM team_members WHERE role = 'Sales Rep' LIMIT 1;
    -- Get second sales rep
    SELECT id INTO sales_rep_2 FROM team_members WHERE role = 'Sales Rep' OFFSET 1 LIMIT 1;
    -- Get VA user
    SELECT id INTO va_user FROM team_members WHERE role = 'VA' LIMIT 1;

    -- Opportunity 1: Lisa Anderson (NEW stage, VA recommendation in progress)
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'OPP-2025-001', 'Lisa', 'Anderson', 'lisa.anderson@email.com', '+64 21 555 1234',
        'Primary Contact', 'Homeowner', '45 Queen Street', 'Auckland', '1010',
        'NEW', 'Assessment Scheduled', 'In Progress', 12500.00,
        sales_rep_1, sales_rep_1, '2025-12-20',
        'Free assessment completed. VA creating product recommendation. Interested in ceiling and underfloor insulation.',
        '2025-12-05 09:30:00'
    );

    -- Opportunity 2: Michael Brown (QUALIFIED stage, ready for quote)
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'OPP-2025-002', 'Michael', 'Brown', 'michael.brown@buildco.nz', '+64 21 555 5678',
        'Decision Maker', 'Builder', '128 Construction Road', 'Wellington', '6011',
        'QUALIFIED', 'Quote Required', 'Submitted', 35000.00,
        sales_rep_2, sales_rep_2, '2025-12-15',
        'New build project. VA recommendation submitted. Ready to convert to formal quote with pricing.',
        '2025-11-28 14:15:00'
    );

    -- Opportunity 3: Patricia Clark (QUOTED stage, awaiting response)
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'OPP-2025-003', 'Patricia', 'Clark', 'patricia.clark@email.com', '+64 21 555 9012',
        'Primary Contact', 'Homeowner', '78 Heritage Lane', 'Christchurch', '8011',
        'QUOTED', 'Follow-up Required', 'Converted to Quote', 8750.00,
        sales_rep_1, sales_rep_1, '2025-12-10',
        'Quote sent 3 days ago. Follow-up call scheduled. Considering wall insulation package.',
        '2025-11-15 11:00:00'
    );

END $$;

-- ============================================================================
-- PART 8: INSERT SAMPLE TASKS (4 per opportunity)
-- ============================================================================

DO $$
DECLARE
    opp_1 UUID;
    opp_2 UUID;
    opp_3 UUID;
    sales_rep_1 UUID;
    sales_rep_2 UUID;
    va_user UUID;
BEGIN
    -- Get opportunity IDs
    SELECT id INTO opp_1 FROM opportunities WHERE opp_number = 'OPP-2025-001';
    SELECT id INTO opp_2 FROM opportunities WHERE opp_number = 'OPP-2025-002';
    SELECT id INTO opp_3 FROM opportunities WHERE opp_number = 'OPP-2025-003';
    
    -- Get team member IDs
    SELECT id INTO sales_rep_1 FROM team_members WHERE role = 'Sales Rep' LIMIT 1;
    SELECT id INTO sales_rep_2 FROM team_members WHERE role = 'Sales Rep' OFFSET 1 LIMIT 1;
    SELECT id INTO va_user FROM team_members WHERE role = 'VA' LIMIT 1;

    -- Tasks for OPP-2025-001 (Lisa Anderson)
    
    -- Task 1: Initial contact (Completed)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, completed_at, notes
    ) VALUES (
        opp_1, 'Initial phone consultation with Lisa to discuss insulation needs', 'Call Customer',
        sales_rep_1, sales_rep_1, '2025-12-05', '2025-12-05',
        'Completed', 'High', 100, '2025-12-05 10:15:00',
        'Customer very interested. Scheduled free assessment for Dec 8.'
    );

    -- Task 2: Schedule assessment (Completed)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, completed_at, notes
    ) VALUES (
        opp_1, 'Schedule and complete free home assessment', 'Schedule Assessment',
        sales_rep_1, sales_rep_1, '2025-12-08', '2025-12-08',
        'Completed', 'High', 100, '2025-12-08 14:30:00',
        'Assessment completed. Measurements taken. Photos uploaded to system.'
    );

    -- Task 3: VA Product Recommendation (In Progress - CRITICAL TASK)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, due_time, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_1, 'Create Product Recommendation in VA Workspace', 'Create Recommendation',
        sales_rep_1, va_user, '2025-12-12', '17:00:00', '2025-12-10',
        'In Progress', 'High', 50,
        'Based on assessment ASS-2025-001, create product recommendation with 3 sections: Ceiling Insulation, Underfloor Insulation, Wall Insulation. Customer prefers glasswool products.'
    );

    -- Task 4: Follow-up after recommendation (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_1, 'Review VA recommendation and follow up with customer', 'Follow Up',
        sales_rep_1, sales_rep_1, '2025-12-15', '2025-12-13',
        'Not Started', 'Normal', 0,
        'Once VA submits recommendation, review and call customer to discuss options and pricing.'
    );

    -- Tasks for OPP-2025-002 (Michael Brown)
    
    -- Task 1: Convert recommendation to quote (In Progress)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_2, 'Convert VA recommendation to formal quote with pricing', 'Create Quote',
        sales_rep_2, sales_rep_2, '2025-12-10', '2025-12-09',
        'In Progress', 'Urgent', 75,
        'VA recommendation REC-2025-045 approved. Adding contractor pricing tier and labour costs.'
    );

    -- Task 2: Review quote (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_2, 'Internal quote review and approval', 'Quote Review',
        sales_rep_2, sales_rep_2, '2025-12-11', '2025-12-10',
        'Not Started', 'High', 0,
        'Review margins, ensure all products in stock, verify labour hours estimate.'
    );

    -- Task 3: Send quote to customer (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_2, 'Email quote PDF to Michael Brown', 'Send Quote',
        sales_rep_2, sales_rep_2, '2025-12-12', '2025-12-11',
        'Not Started', 'High', 0,
        'Send via email with payment terms. Include product spec sheets for glasswool products.'
    );

    -- Task 4: Follow-up call (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, due_time, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_2, 'Follow-up call to discuss quote and answer questions', 'Call Customer',
        sales_rep_2, sales_rep_2, '2025-12-15', '10:00:00', '2025-12-15',
        'Not Started', 'Normal', 0,
        'Call 3 days after sending quote. Be prepared to discuss pricing and installation timeline.'
    );

    -- Tasks for OPP-2025-003 (Patricia Clark)
    
    -- Task 1: Follow-up call (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, due_time, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_3, 'Follow-up call - quote sent 3 days ago', 'Call Customer',
        sales_rep_1, sales_rep_1, '2025-12-09', '14:00:00', '2025-12-09',
        'Not Started', 'High', 0,
        'Quote QUO-2025-123 sent Dec 6. Call to see if any questions, address concerns about timeline.'
    );

    -- Task 2: Send additional information (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_3, 'Email additional product information and testimonials', 'Document Upload',
        sales_rep_1, sales_rep_1, '2025-12-10', '2025-12-09',
        'Not Started', 'Normal', 0,
        'Customer interested in R-value performance. Send technical spec sheets and case studies.'
    );

    -- Task 3: Price negotiation (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_3, 'Prepare revised quote if price negotiation needed', 'Quote Revision',
        sales_rep_1, sales_rep_1, '2025-12-12', '2025-12-11',
        'Not Started', 'Normal', 0,
        'If customer pushes back on price, prepared to offer 5% discount or remove optional items.'
    );

    -- Task 4: Close or reschedule (Not Started)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, scheduled_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_3, 'Attempt to close deal or set new follow-up date', 'Follow Up',
        sales_rep_1, sales_rep_1, '2025-12-13', '2025-12-13',
        'Not Started', 'High', 0,
        'Final push to close. If not ready, find out timeline and set reminder for follow-up.'
    );

END $$;

-- ============================================================================
-- PART 9: VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Count opportunities by stage
SELECT 
    stage,
    COUNT(*) as count,
    SUM(estimated_value) as total_value
FROM opportunities
WHERE is_active = true
GROUP BY stage
ORDER BY 
    CASE stage
        WHEN 'NEW' THEN 1
        WHEN 'QUALIFIED' THEN 2
        WHEN 'QUOTED' THEN 3
        WHEN 'WON' THEN 4
        WHEN 'LOST' THEN 5
    END;

-- Query 2: Tasks by assignee with status
SELECT 
    tm.first_name || ' ' || tm.last_name as assigned_to,
    t.status,
    COUNT(*) as task_count,
    ROUND(AVG(t.completion_percent), 0) as avg_completion
FROM tasks t
JOIN team_members tm ON t.assigned_to_user_id = tm.id
WHERE t.is_active = true
GROUP BY tm.first_name, tm.last_name, t.status
ORDER BY assigned_to, t.status;

-- Query 3: Complete opportunity view with tasks (Lisa Anderson example)
SELECT 
    o.opp_number,
    COALESCE(c.company_name, o.contact_first_name || ' ' || o.contact_last_name) as customer_name,
    CASE 
        WHEN c.company_name IS NOT NULL THEN o.contact_first_name || ' ' || o.contact_last_name
        ELSE NULL
    END as contact_person,
    o.stage,
    o.sub_status,
    o.recommendation_status,
    o.estimated_value,
    COUNT(t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
    SUM(CASE WHEN t.status = 'Not Started' THEN 1 ELSE 0 END) as pending_tasks
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
LEFT JOIN tasks t ON o.id = t.opportunity_id
WHERE o.opp_number = 'OPP-2025-001'
GROUP BY o.id, o.opp_number, c.company_name, o.contact_first_name, o.contact_last_name, 
         o.stage, o.sub_status, o.recommendation_status, o.estimated_value;

-- Query 4: Opportunities with their linked recommendations (VA Workspace integration)
SELECT 
    o.opp_number,
    COALESCE(c.company_name, o.contact_first_name || ' ' || o.contact_last_name) as customer_name,
    CASE 
        WHEN c.company_name IS NOT NULL THEN o.contact_first_name || ' ' || o.contact_last_name
        ELSE NULL
    END as contact_person,
    o.stage,
    o.recommendation_status,
    pr.recommendation_number,
    pr.status as rec_status
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
LEFT JOIN product_recommendations pr ON o.product_recommendation_id = pr.id
WHERE o.is_active = true
ORDER BY o.created_at DESC;

-- Query 5: VA tasks with linked opportunities
SELECT 
    t.task_description,
    tm.first_name || ' ' || tm.last_name as assigned_to,
    o.opp_number,
    COALESCE(c.company_name, o.contact_first_name || ' ' || o.contact_last_name) as customer_name,
    CASE 
        WHEN c.company_name IS NOT NULL THEN o.contact_first_name || ' ' || o.contact_last_name
        ELSE NULL
    END as contact_person,
    t.status,
    t.priority,
    t.completion_percent,
    t.due_date
FROM tasks t
JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN companies c ON o.company_id = c.id
JOIN team_members tm ON t.assigned_to_user_id = tm.id
WHERE tm.role = 'VA' AND t.is_active = true
ORDER BY t.due_date, t.priority DESC;

-- Query 6: Opportunities awaiting VA recommendations
SELECT 
    o.opp_number,
    COALESCE(c.company_name, o.contact_first_name || ' ' || o.contact_last_name) as customer_name,
    CASE 
        WHEN c.company_name IS NOT NULL THEN o.contact_first_name || ' ' || o.contact_last_name
        ELSE NULL
    END as contact_person,
    o.stage,
    o.recommendation_status,
    o.created_at,
    CASE 
        WHEN o.product_recommendation_id IS NULL THEN 'No recommendation linked'
        WHEN o.recommendation_status NOT IN ('Submitted', 'Converted to Quote') THEN 'Recommendation in progress'
        ELSE 'Recommendation complete'
    END as rec_workflow_status
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.is_active = true
    AND (o.product_recommendation_id IS NULL 
         OR o.recommendation_status NOT IN ('Submitted', 'Converted to Quote'))
ORDER BY o.created_at;

-- ============================================================================
-- EXPLANATION OF RELATIONSHIPS & USAGE
-- ============================================================================

/*
RELATIONSHIP DIAGRAM:

opportunities (sales pipeline)
    ├── tasks (multiple tasks per opportunity)
    ├── product_recommendations (1:1 bidirectional link via opportunity_id/product_recommendation_id)
    ├── assessments (links to free assessment if completed)
    ├── clients (customer master record)
    ├── companies (for B2B opportunities)
    └── team_members (sales_rep_id, created_by_user_id)

tasks
    ├── opportunities (parent opportunity)
    ├── team_members (assigned_to_user_id, created_by_user_id)
    └── task_assignments (optional, for multiple assignees)

WORKFLOW:

1. CREATE OPPORTUNITY:
   - Customer inquiry received (phone/web/GHL)
   - Create opportunity record (stage: NEW)
   - Assign to sales rep
   - Create initial tasks (call customer, schedule assessment)

2. SCHEDULE FREE ASSESSMENT:
   - Update opportunity stage to QUALIFIED
   - Create assessment record
   - Link assessment_id to opportunity
   - Assign installer to assessment
   - Create task for VA: "Create Product Recommendation"

3. VA CREATES RECOMMENDATION:
   - VA works in VA Workspace
   - Creates product_recommendation record
   - Links opportunity_id in product_recommendation
   - When submitted, update opportunity.recommendation_status = 'Submitted'
   - Update opportunity.product_recommendation_id
   - Mark VA task as completed

4. SALES REP CONVERTS TO QUOTE:
   - Sales rep reviews recommendation
   - Converts to quote with pricing
   - Update opportunity.recommendation_status = 'Converted to Quote'
   - Update opportunity stage to QUOTED
   - Create tasks: send quote, follow-up calls

5. CLOSE OPPORTUNITY:
   - Win: stage = WON, create job record
   - Lose: stage = LOST, document reason in sub_status

QUERYING EXAMPLES:

-- Get all opportunities for a sales rep
SELECT * FROM opportunities 
WHERE sales_rep_id = '<uuid>' 
ORDER BY created_at DESC;

-- Get all pending tasks for a user
SELECT * FROM tasks 
WHERE assigned_to_user_id = '<uuid>' 
AND status != 'Completed' 
ORDER BY due_date, priority DESC;

-- Get opportunity pipeline metrics
SELECT 
    stage,
    COUNT(*) as count,
    SUM(estimated_value) as pipeline_value
FROM opportunities 
WHERE is_active = true
GROUP BY stage;

-- Get overdue tasks
SELECT t.*, o.opp_number, o.contact_first_name, o.contact_last_name
FROM tasks t
JOIN opportunities o ON t.opportunity_id = o.id
WHERE t.due_date < CURRENT_DATE 
AND t.status != 'Completed'
ORDER BY t.due_date;

-- Get opportunities needing VA attention
SELECT o.*, t.task_description, t.due_date
FROM opportunities o
JOIN tasks t ON o.id = t.opportunity_id
WHERE t.task_type = 'Create Recommendation'
AND t.status != 'Completed'
ORDER BY t.due_date;

INDEXES EXPLAINED:

- opportunities.stage: Fast filtering by pipeline stage (Kanban view)
- opportunities.sales_rep_id: Fast lookup of opportunities by sales rep
- tasks.assigned_to_user_id: Fast lookup of tasks by assignee (task list)
- tasks.due_date: Fast filtering of overdue/upcoming tasks
- opportunities.product_recommendation_id: Fast join to VA recommendations

FUTURE ENHANCEMENTS:

1. Add opportunity_activities table for audit trail
2. Add email/SMS integration for task reminders
3. Add opportunity scoring/probability weighting
4. Add custom fields via JSONB column
5. Add opportunity_contacts for multiple contacts per opportunity
6. Add integration with calendar for scheduled tasks
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
