# JOBS SYSTEM - PRE-BUILD ANALYSIS & IMPLEMENTATION PLAN

**Date:** December 7, 2025  
**Status:** ✅ SCHEMA VERIFIED - READY TO BUILD

---

## 📋 USER REQUIREMENTS SUMMARY

### Core Requirements
1. **3 Pages to Build:**
   - Jobs List (table view with filters, search, pagination)
   - Job Detail (comprehensive job management)
   - Completion Certificate (PDF-ready)

2. **Stock Management:**
   - ✅ Basic system (receive inward, move out on assignment)
   - ✅ Manual edit capability
   - ✅ Return stock if job cancelled
   - ⚠️ NO stock tables exist yet - need to create

3. **Multiple Crew Assignment:**
   - ✅ Confirmed: Multiple crew members can be assigned per job
   - Jobs table has: `crew_lead_id` (UUID) + `crew_members` (JSONB array)

4. **Create Job from Quote:**
   - ✅ Required: "Create Job" button on Accepted quotes
   - Copy quote_line_items → job_line_items
   - Link quote_id to job

5. **Calendar Integration:**
   - Must query: `scheduled_date`, `status`, `crew_lead_id`, `customer_name`
   - Color coding by status
   - Filter by crew lead

6. **Installer Calendars (FUTURE):**
   - Individual calendars for installers
   - Show: Contact details, company name, site address, products, quantities
   - Hide: All pricing information
   - **Note:** Build after Jobs + Calendar complete

7. **Opportunities Kanban Update (FUTURE):**
   - Add status after WON: "Job Scheduled"
   - Link opportunities → jobs
   - **Note:** Build after Jobs system complete

---

## 🔍 EXISTING DATABASE SCHEMA - FINDINGS

### ✅ EXISTING TABLES

#### 1. **jobs** table (EXISTS)
**Location:** `supabase/migrations/20251205_phase1b_quotes_jobs.sql`

**Structure:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  job_number TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  
  -- Customer
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_company TEXT,
  
  -- Location
  site_address TEXT NOT NULL,
  city TEXT,
  postcode TEXT,
  
  -- Status & Scheduling
  status TEXT DEFAULT 'Scheduled',
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  
  -- Financials
  quoted_amount NUMERIC,
  actual_cost NUMERIC,
  
  -- Crew (SUPPORTS MULTIPLE)
  crew_lead_id UUID REFERENCES team_members(id),
  crew_members JSONB,  -- Array of team_member IDs
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Photos (JSONB arrays)
  before_photos JSONB,
  after_photos JSONB,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:** job_number, quote_id, status, crew_lead_id, scheduled_date, completion_date

**Status Values:** Currently defaults to 'Scheduled' (need to verify valid values)

---

#### 2. **job_line_items** table (EXISTS)
**Location:** `supabase/migrations/20251205_phase1b_quotes_jobs.sql`

**Structure:**
```sql
CREATE TABLE job_line_items (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT,
  description TEXT NOT NULL,
  
  -- Quantities
  quantity_quoted NUMERIC,
  quantity_actual NUMERIC,
  unit TEXT DEFAULT 'sqm',
  
  -- Costing
  unit_cost NUMERIC,
  line_cost NUMERIC,
  
  -- Installation tracking
  installed_by UUID REFERENCES team_members(id),
  installation_date DATE,
  
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP
);
```

**Indexes:** job_id, product_id, installed_by

---

#### 3. **products** table (EXISTS - REFERENCED)
Confirmed from code references:
- Fields: `id`, `sku`, `product_description`, `category`, `r_value`, `bale_size_sqm`, `cost_price`, `retail_price`, `pack_price`, `waste_percentage`, `is_active`, `is_labour`
- Used in quotes and VA workspace

---

#### 4. **team_members** table (EXISTS)
- Fields: `id`, `first_name`, `last_name`, `email`, `phone`, `role`, `status`
- Roles include: 'Sales Rep', 'Installer', 'VA'
- Referenced as crew_lead_id and installed_by

---

#### 5. **quotes** table (EXISTS)
**Location:** `supabase/migrations/20251205_phase1b_quotes_jobs.sql`
- Has quote_number, customer fields, assessment_id, status
- Status values: 'Draft', 'Sent', 'Accepted', 'Won', 'Rejected', 'Lost', 'Cancelled'

---

#### 6. **quote_line_items** table (EXISTS)
**Location:** `supabase/migrations/20251205_phase1b_quotes_jobs.sql`
- Fields: quote_id, product_id, description, quantity, unit, unit_cost, unit_price, line_total
- Will be copied to job_line_items when creating job from quote

---

### ❌ MISSING TABLES (NEED TO CREATE)

#### 1. **stock_levels** (CRITICAL - DOES NOT EXIST)
User clarified: "Stock at this stage is basic. Receive inward and when job is assigned move out."

**Proposed Structure:**
```sql
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_location TEXT DEFAULT 'Main Warehouse',
  quantity_on_hand NUMERIC DEFAULT 0,
  quantity_reserved NUMERIC DEFAULT 0,
  quantity_available AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_level NUMERIC DEFAULT 0,
  last_stock_take_date DATE,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 2. **stock_movements** (CRITICAL - DOES NOT EXIST)
Track all stock transactions (inward, outward, returns).

**Proposed Structure:**
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  job_id UUID REFERENCES jobs(id),
  movement_type TEXT, -- 'INWARD', 'RESERVED', 'ALLOCATED', 'RETURNED', 'ADJUSTMENT'
  quantity NUMERIC NOT NULL,
  quantity_before NUMERIC,
  quantity_after NUMERIC,
  reference_number TEXT, -- PO number, GRN number, etc.
  notes TEXT,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 3. **job_labour_items** (RECOMMENDED)
Track labour charges separately from materials.

**Proposed Structure:**
```sql
CREATE TABLE job_labour_items (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  area_sqm NUMERIC,
  quoted_rate NUMERIC, -- per sqm
  quoted_hours NUMERIC,
  quoted_amount NUMERIC,
  actual_hours NUMERIC,
  actual_rate NUMERIC,
  actual_amount NUMERIC,
  performed_by UUID REFERENCES team_members(id),
  labour_date DATE,
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 4. **job_photos** (RECOMMENDED)
Store job photos with metadata (currently using JSONB in jobs table).

**Proposed Structure:**
```sql
CREATE TABLE job_photos (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  photo_type TEXT, -- 'BEFORE', 'DURING', 'AFTER', 'ISSUE'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  caption TEXT,
  taken_at TIMESTAMP,
  uploaded_by UUID REFERENCES team_members(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP
);
```

**Storage Bucket:** `job-photos` (10MB limit, JPEG/PNG/PDF)

---

#### 5. **job_comments** (RECOMMENDED)
Track all job-related communication and notes.

**Proposed Structure:**
```sql
CREATE TABLE job_comments (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'NOTE', -- 'NOTE', 'ISSUE', 'RESOLUTION', 'CUSTOMER_FEEDBACK'
  is_internal BOOLEAN DEFAULT true, -- false if visible to customer
  commented_by UUID REFERENCES team_members(id),
  commented_at TIMESTAMP DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP
);
```

---

#### 6. **job_status_history** (RECOMMENDED)
Auto-log all status changes for audit trail.

**Proposed Structure:**
```sql
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES team_members(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);
```

**Trigger:** Auto-populate on jobs.status UPDATE

---

#### 7. **job_completion_certificates** (RECOMMENDED)
Store certificate metadata and file references.

**Proposed Structure:**
```sql
CREATE TABLE job_completion_certificates (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_url TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES team_members(id),
  customer_signature_url TEXT,
  customer_signed_at TIMESTAMP,
  installer_signature_url TEXT,
  installer_signed_at TIMESTAMP,
  emailed_to_customer BOOLEAN DEFAULT false,
  emailed_at TIMESTAMP,
  notes TEXT
);
```

---

## 🔧 DATABASE FUNCTIONS NEEDED

### Stock Management Functions (CRITICAL)

User clarified: "Check edge functions if we have created anything. I do not think we have built pages."

**Search Result:** NO stock edge functions exist. API routes exist only for:
- `send-quote-email`
- `send-to-va`
- `va-submit-recommendation`

**Functions to Create:**

#### 1. `reserve_stock_for_job(p_job_id UUID)`
- Called when job status → 'Scheduled'
- Reads job_line_items for quantities
- Updates stock_levels.quantity_reserved
- Creates stock_movements records (type='RESERVED')
- Returns: Success/failure + warning if insufficient stock

#### 2. `confirm_stock_for_job(p_job_id UUID)`
- Called when job status → 'Completed'
- Converts RESERVED → ALLOCATED
- Deducts from stock_levels.quantity_on_hand
- Updates stock_movements (type='ALLOCATED')

#### 3. `return_stock_from_cancelled_job(p_job_id UUID)`
- Called when job status → 'Cancelled'
- Reverses stock reservations
- Updates stock_levels (subtract from quantity_reserved)
- Creates stock_movements (type='RETURNED')

#### 4. `check_stock_availability(p_job_id UUID)`
- Check if sufficient stock for job
- Returns: Array of products with insufficient stock
- Used before scheduling job

#### 5. `manual_stock_adjustment(p_product_id UUID, p_quantity NUMERIC, p_notes TEXT)`
- User requirement: "Provision for manual edits in case needed"
- Allows direct quantity adjustments
- Creates stock_movements (type='ADJUSTMENT')
- Logs user and reason

---

### Job Management Functions

#### 6. `generate_job_number()`
Already exists! Format: JOB-2025-0001

#### 7. `create_job_from_quote(p_quote_id UUID)`
- User requirement: "Absolutely yes" to job from quote button
- Copy quote_line_items → job_line_items
- Copy customer details from quote
- Set status='Draft' initially
- Return job_id

#### 8. `calculate_job_costing(p_job_id UUID)`
- Calculate from job_line_items + job_labour_items
- Return: quoted_amount, actual_cost, margin

---

### Helper Functions

#### 9. `update_job_status(p_job_id UUID, p_new_status TEXT)`
- Validates status transition
- Updates jobs.status
- Auto-triggers stock functions based on status
- Logs to job_status_history

#### 10. `send_job_assignment_email(p_job_id UUID)`
- Email crew lead with job details
- Include: Customer, address, products, schedule

#### 11. `send_job_completion_email(p_job_id UUID)`
- Email customer with completion certificate
- Include: Job summary, photos, certificate PDF

---

## 📊 JOB STATUS WORKFLOW

### Valid Status Transitions

```
Draft → Scheduled → In Progress → Completed
  ↓         ↓            ↓
Cancelled  Cancelled  Cancelled
```

### Status-Triggered Actions

| Status | Action | Stock Function | Email |
|--------|--------|----------------|-------|
| Draft | Created from quote | None | None |
| Scheduled | Ready to go | `reserve_stock_for_job()` | `send_job_assignment_email()` |
| In Progress | Crew started work | None | None |
| Completed | Work finished | `confirm_stock_for_job()` | `send_job_completion_email()` |
| Cancelled | Job cancelled | `return_stock_from_cancelled_job()` | None |

---

## 🎨 CALENDAR INTEGRATION REQUIREMENTS

### Calendar Must Query These Fields

```typescript
// Calendar will fetch jobs like this:
const { data: calendarEvents } = await supabase
  .from('jobs')
  .select(`
    id,
    job_number,
    scheduled_date,
    status,
    crew_lead_id,
    customer_first_name,
    customer_last_name,
    customer_company,
    site_address,
    team_members:crew_lead_id (first_name, last_name)
  `)
  .not('scheduled_date', 'is', null)
```

### Event Display Format

**Event Title:** `JOB-2025-0001`  
**Tooltip/Details:**
- Customer: John Smith (ABC Company)
- Address: 123 Main St, Auckland
- Crew Lead: Mike Chen
- Status badge with color

### Status Color Coding

| Status | Color | Calendar Display |
|--------|-------|------------------|
| Draft | Gray | Not shown (no date) |
| Scheduled | Blue | Blue dot |
| In Progress | Orange | Orange dot |
| Completed | Green | Green dot |
| Cancelled | Red | Red dot (strikethrough) |

### Filter by Crew Lead

```typescript
// Filter calendar by crew lead
const filteredEvents = calendarEvents.filter(e => 
  e.crew_lead_id === selectedCrewLeadId
)
```

---

## 🔐 INSTALLER CALENDAR - FUTURE REQUIREMENTS

**User Requirement:** "The installers only see contact details, company name, site address, products, qty needed. No pricing should be visible to them."

### Fields Visible to Installers

**✅ SHOW:**
- Customer name (first + last)
- Company name
- Site address (full)
- Products list (from job_line_items)
- Quantities needed
- Scheduled date/time
- Job status
- Notes (non-sensitive)

**❌ HIDE:**
- quoted_amount
- actual_cost
- unit_cost
- line_cost
- All pricing fields
- Margin calculations
- Financial totals

### Implementation Approach (Future)

1. Create installer-specific view:
```sql
CREATE VIEW installer_job_view AS
SELECT 
  j.id, j.job_number, j.scheduled_date, j.status,
  j.customer_first_name, j.customer_last_name, j.customer_company,
  j.site_address, j.city, j.postcode, j.notes,
  jli.description, jli.quantity_quoted, jli.unit
FROM jobs j
LEFT JOIN job_line_items jli ON jli.job_id = j.id
-- NO pricing fields
```

2. Row Level Security (RLS):
```sql
CREATE POLICY installer_read_own_jobs ON jobs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM team_members 
      WHERE role = 'Installer' 
      AND (id = crew_lead_id OR id = ANY(crew_members))
    )
  );
```

3. Create `/app/installer-calendar/page.tsx` (after Jobs system complete)

---

## 📂 OPPORTUNITIES KANBAN UPDATE - FUTURE

**User Requirement:** "After we complete the job and calendar scheduling function, we need to come back to the opportunities Kanban to add another status after won or add to it jobs scheduled."

### Proposed Approach

**Option 1:** Add sub-status to WON stage
```typescript
// Update opportunities.sub_status when job scheduled
sub_status: 'Job Scheduled'  // Add after 'Contract Signed'
```

**Option 2:** Add new stage (not recommended - disrupts 5-column layout)

**Option 3:** Add link field (RECOMMENDED)
```sql
ALTER TABLE opportunities 
ADD COLUMN job_id UUID REFERENCES jobs(id);
```

Then show "View Job" button in WON opportunities that have job_id.

---

## 🏗️ BUILD ORDER & MIGRATIONS

### Phase 1: Database Foundation (DO FIRST)

**Migration File:** `20251207_jobs_system_complete.sql`

1. ✅ Verify jobs table (already exists)
2. ✅ Verify job_line_items table (already exists)
3. ❌ Create stock_levels table
4. ❌ Create stock_movements table
5. ❌ Create job_labour_items table
6. ❌ Create job_photos table + storage bucket
7. ❌ Create job_comments table
8. ❌ Create job_status_history table + trigger
9. ❌ Create job_completion_certificates table
10. ❌ Add indexes to all new tables

---

### Phase 2: Database Functions

**Migration File:** `20251207_jobs_stock_functions.sql`

1. ❌ `reserve_stock_for_job()`
2. ❌ `confirm_stock_for_job()`
3. ❌ `return_stock_from_cancelled_job()`
4. ❌ `check_stock_availability()`
5. ❌ `manual_stock_adjustment()`
6. ❌ `create_job_from_quote()`
7. ❌ `calculate_job_costing()`
8. ❌ `update_job_status()` with stock function calls

---

### Phase 3: Build Pages

1. ❌ `src/app/jobs/page.tsx` (Jobs List)
2. ❌ `src/app/jobs/[id]/page.tsx` (Job Detail)
3. ❌ `src/app/jobs/[id]/certificate/page.tsx` (Certificate)
4. ❌ Add "Create Job" button to `/quotes/[id]/page.tsx`

---

### Phase 4: Integration (AFTER PAGES BUILT)

1. ❌ Test Calendar integration (verify query fields)
2. ❌ Test Stock integration (status changes trigger functions)
3. ❌ Update Opportunities Kanban (add job link)
4. ❌ Build Installer Calendar (separate phase)

---

## ✅ READY TO BUILD CHECKLIST

- [x] Database schema verified (jobs + job_line_items exist)
- [x] Missing tables identified (7 tables)
- [x] Stock functions identified (5 functions needed)
- [x] User clarifications received:
  - [x] Stock is basic (inward/outward/manual edits/returns)
  - [x] Multiple crew assignment confirmed
  - [x] Create job from quote confirmed
  - [x] Installer calendar requirements clarified
  - [x] Opportunities Kanban update confirmed for later
- [x] No edge functions exist (need to create all)
- [x] Calendar integration requirements documented
- [x] Build order defined (Foundation → Functions → Pages → Integration)

---

## 🚀 NEXT STEPS

1. **Create comprehensive migration:**
   - All 7 missing tables
   - Storage bucket for job photos
   - Indexes and constraints

2. **Create stock management functions:**
   - 5 critical stock functions
   - 3 job management functions
   - 3 helper functions

3. **Build 3 pages:**
   - Jobs List with "Create from Quote" button
   - Job Detail with full management
   - Completion Certificate

4. **Test integrations:**
   - Calendar queries correct fields
   - Stock functions trigger on status changes
   - Quote → Job workflow works

5. **Future phases:**
   - Installer calendars
   - Opportunities Kanban job link

---

## 📝 QUESTIONS & ANSWERS

### Q1: Multiple crew assignment?
**A:** ✅ YES - `crew_lead_id` + `crew_members` JSONB array

### Q2: Stock management approach?
**A:** ✅ Basic system - No tables exist, will create stock_levels + stock_movements

### Q3: Create job from quote?
**A:** ✅ Absolutely yes - Add button to quotes page

### Q4: Stock calculation functions?
**A:** ✅ User mentioned "quoting process has some edge functions which calculates the stock" - but NO stock functions found. Will create new functions.

### Q5: Labour tracking?
**A:** ✅ Separate table for labour items (job_labour_items)

---

**STATUS:** 🟢 READY TO PROCEED WITH BUILD

