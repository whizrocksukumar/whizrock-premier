# PREMIER INSULATION MVP DELIVERY CHECKLIST
## Complete Guide for Independent Execution
**Date:** January 7, 2026

---

## TIMEOUT SOLUTION

**Why timeouts happen:** Opus generates detailed code which takes time. 

**Solutions:**
1. **Use Sonnet 4** for routine tasks (faster, still capable)
2. **Use Opus 4** only for complex logic/architecture decisions
3. **Break tasks into smaller chunks** - ask for one file at a time
4. **Use this checklist** - copy/paste code from here directly

---

## FILES READY TO DEPLOY

These files are complete and ready. Just copy to your project:

| File | Location in Project | Status |
|------|---------------------|--------|
| `create-assessment-page.tsx` | `/src/app/assessments/create/page.tsx` | ✅ Ready |
| `create-job-page.tsx` | `/src/app/jobs/create/page.tsx` | ✅ Ready |

---

## MVP DELIVERY CHECKLIST

### PHASE 1: COPY COMPLETED FILES (15 mins)

- [ ] **1.1** Copy `create-assessment-page.tsx` to `/src/app/assessments/create/page.tsx`
- [ ] **1.2** Copy `create-job-page.tsx` to `/src/app/jobs/create/page.tsx`
- [ ] **1.3** Verify imports work (check supabase path is correct for your project)

**Import paths to verify:**
```typescript
// If your supabase is at /src/lib/supabase.ts, use:
import { supabase } from '../../lib/supabase';

// If your supabase is at /lib/supabase.ts, use:
import { supabase } from '@/lib/supabase';
```

---

### PHASE 2: DATABASE TABLES CHECK (30 mins)

Run these in Supabase SQL Editor to ensure tables exist:

```sql
-- Check if assessments table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments';

-- Check if assessment_areas table exists  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessment_areas';

-- Check if jobs table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs';

-- Check if job_installers table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_installers';

-- Check if job_line_items table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_line_items';
```

**If tables missing, create them:**

```sql
-- ASSESSMENTS TABLE (if missing)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  sales_rep_id UUID,
  installer_id UUID,
  opportunity_reference TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  property_type TEXT,
  year_built INTEGER,
  estimated_size_sqm DECIMAL(10,2),
  site_access_difficulty TEXT,
  crawl_space_height_cm DECIMAL(10,2),
  existing_insulation_type TEXT,
  removal_required BOOLEAN DEFAULT false,
  hazards_present TEXT,
  overall_result TEXT DEFAULT 'Pending',
  general_notes TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ASSESSMENT_AREAS TABLE (if missing)
CREATE TABLE IF NOT EXISTS assessment_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  app_type_id UUID REFERENCES app_types(id),
  area_sqm DECIMAL(10,2) DEFAULT 0,
  wording_id UUID,
  wording_text TEXT,
  result_type TEXT DEFAULT 'Pending',
  notes TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOBS TABLE (if missing)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_duration_hours DECIMAL(5,2),
  priority TEXT DEFAULT 'Normal',
  special_instructions TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'Scheduled',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- JOB_INSTALLERS TABLE (if missing)
CREATE TABLE IF NOT EXISTS job_installers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  installer_id UUID REFERENCES team_members(id),
  is_lead BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOB_LINE_ITEMS TABLE (if missing)
CREATE TABLE IF NOT EXISTS job_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quoted_quantity DECIMAL(10,2),
  actual_quantity DECIMAL(10,2),
  unit TEXT,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ASSESSMENT_WORDINGS TABLE (if missing)
CREATE TABLE IF NOT EXISTS assessment_wordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wording_text TEXT NOT NULL,
  area_type TEXT,
  result_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample wordings
INSERT INTO assessment_wordings (wording_text, area_type, is_active) VALUES
('Ceiling insulation meets NZ Building Code requirements (R3.3 minimum)', 'Ceiling', true),
('Ceiling insulation below minimum standard - requires upgrade', 'Ceiling', true),
('No existing ceiling insulation present', 'Ceiling', true),
('Underfloor insulation meets requirements (R1.3 minimum)', 'Underfloor', true),
('Underfloor area not accessible - exempt', 'Underfloor', true),
('Wall insulation present and in good condition', 'Walls', true),
('External walls require insulation', 'Walls', true),
('Property built after 2008 - complies with H1 requirements', 'General', true),
('Rental property - must comply by July 2019 deadline', 'General', true);
```

---

### PHASE 3: SIDEBAR NAVIGATION UPDATE (10 mins)

Update your `Sidebar.tsx` to include Assessments and Jobs:

```typescript
// Add to your navItems array in Sidebar.tsx
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/assessments', label: 'Assessments', icon: ClipboardCheck }, // ADD
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase }, // ADD
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Import icons at top:
import { ClipboardCheck, Briefcase } from 'lucide-react';
```

---

### PHASE 4: LIST PAGES (If not already built)

#### 4.1 Assessments List Page
Location: `/src/app/assessments/page.tsx`

Quick implementation - follow your existing Quotes list pattern:
- Table columns: Assessment #, Client, Site, Date, Installer, Status, Actions
- Status filter buttons: All, Scheduled, In Progress, Completed
- Search bar (30% width)
- "Create Assessment" button

#### 4.2 Jobs List Page  
Location: `/src/app/jobs/page.tsx`

Quick implementation - follow your existing Quotes list pattern:
- Table columns: Job #, Quote #, Client, Site, Date, Crew, Status, Actions
- Status filter buttons: All, Scheduled, In Progress, Completed
- Search bar (30% width)
- "Create Job" button

---

### PHASE 5: VERIFY EXISTING COMPONENTS (15 mins)

Check these components exist in your project:

- [ ] **ClientSelectorWithSites.tsx** - Used by Assessment page
  - If missing, the Assessment page won't work
  - You can simplify to a basic client dropdown temporarily

- [ ] **team_members table** - Stores installers
  - Check: `SELECT * FROM team_members WHERE role = 'Installer';`
  - If empty, add sample installers

- [ ] **app_types table** - Stores application types (Ceiling, Walls, etc.)
  - Check: `SELECT * FROM app_types WHERE is_active = true;`

---

### PHASE 6: QUICK FIXES IF CLIENTSELECTORWITHSITES MISSING

If `ClientSelectorWithSites` component doesn't exist, replace the import and usage in Assessment page with this simple version:

```typescript
// Replace ClientSelectorWithSites with basic dropdowns:

// Add these state variables at top:
const [clients, setClients] = useState([]);
const [sites, setSites] = useState([]);

// Add this to loadReferenceData():
const { data: clientsData } = await supabase
  .from('clients')
  .select('id, first_name, last_name, email, phone')
  .order('first_name');
if (clientsData) setClients(clientsData);

// Replace the ClientSelectorWithSites section with:
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Client <span className="text-red-500">*</span>
    </label>
    <select
      value={selectedClient?.id || ''}
      onChange={(e) => {
        const client = clients.find(c => c.id === e.target.value);
        setSelectedClient(client || null);
        // Load sites for this client
        if (client) {
          supabase.from('sites').select('*').eq('client_id', client.id)
            .then(({ data }) => setSites(data || []));
        }
      }}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    >
      <option value="">Select client...</option>
      {clients.map(c => (
        <option key={c.id} value={c.id}>
          {c.first_name} {c.last_name}
        </option>
      ))}
    </select>
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Site <span className="text-red-500">*</span>
    </label>
    <select
      value={selectedSite?.id || ''}
      onChange={(e) => {
        const site = sites.find(s => s.id === e.target.value);
        setSelectedSite(site || null);
      }}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    >
      <option value="">Select site...</option>
      {sites.map(s => (
        <option key={s.id} value={s.id}>
          {s.address_line_1}, {s.suburb}
        </option>
      ))}
    </select>
  </div>
</div>
```

---

### PHASE 7: RLS POLICIES (10 mins)

Disable RLS temporarily for development (re-enable in production):

```sql
-- Disable RLS for development
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_installers DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_wordings DISABLE ROW LEVEL SECURITY;
```

---

### PHASE 8: TEST WORKFLOW (20 mins)

Test each page works:

1. [ ] Go to `/assessments/create` - form loads without errors
2. [ ] Select a client and site
3. [ ] Fill in assessment details
4. [ ] Add an assessment area
5. [ ] Submit - should create record and redirect

6. [ ] Go to `/jobs/create` - form loads without errors
7. [ ] Select an accepted quote
8. [ ] Set schedule date and assign installers
9. [ ] Submit - should create job and redirect

---

## WHAT'S ALREADY IN YOUR DOCUMENTATION

From your `COMPREHENSIVE_PHASE1_DOCUMENTATION050126.md`, these are **ready to use**:

### Email Templates SQL (Copy from Section 1.1)
- Run the SQL to create `email_templates` table
- Inserts 6 email templates

### Terms & Conditions SQL (Copy from Section 1.2)  
- Run the SQL to create `quote_terms` table
- Inserts default T&Cs

### PDF Templates (Copy from Part 2)
- `QuoteTemplateA.tsx` - Detailed line-item quote
- `QuoteTemplateB.tsx` - Summary quote
- `InvoicePDFTemplate.tsx` - Invoice
- `AssessmentReportTemplate.tsx` - Assessment report

### Template Helper Functions (Copy from Part 3)
- `src/lib/templates.ts` - Email template functions

---

## RECOMMENDED AI USAGE

| Task Type | Use This Model | Why |
|-----------|----------------|-----|
| Copy/paste code from docs | No AI needed | Just copy |
| Simple modifications | **Sonnet 4** | Fast, capable |
| Bug fixes | **Sonnet 4** | Quick responses |
| New complex features | **Opus 4** | Best reasoning |
| Architecture decisions | **Opus 4** | Deep analysis |
| SQL queries | **Sonnet 4** | Fast enough |
| CSS/styling | **Sonnet 4** | Simple tasks |

---

## QUICK REFERENCE: FILE STRUCTURE

```
src/
├── app/
│   ├── assessments/
│   │   ├── page.tsx          # List page (build or copy pattern)
│   │   └── create/
│   │       └── page.tsx      # ✅ PROVIDED
│   ├── jobs/
│   │   ├── page.tsx          # List page (build or copy pattern)
│   │   └── create/
│   │       └── page.tsx      # ✅ PROVIDED
│   ├── quotes/
│   │   ├── page.tsx          # List (exists)
│   │   └── add-new-quote/
│   │       └── page.tsx      # Create (exists)
│   └── clients/
│       ├── page.tsx          # List (exists)
│       └── [id]/
│           └── page.tsx      # Detail (exists)
├── components/
│   ├── Sidebar.tsx           # Update with new links
│   └── ClientSelectorWithSites.tsx  # If exists, use it
└── lib/
    ├── supabase.ts           # Exists
    └── templates.ts          # Add from docs
```

---

## EMERGENCY FIXES

### If page shows blank/white screen:
1. Check browser console (F12) for errors
2. Usually import path issue - check supabase import
3. Check if tables exist in database

### If "Cannot read property of undefined":
1. Add null checks: `client?.first_name`
2. Add loading state: `if (isLoading) return <div>Loading...</div>`
3. Check data is being returned from Supabase queries

### If form doesn't submit:
1. Check required fields have values
2. Check Supabase table has all columns
3. Check RLS is disabled for testing

---

## MVP COMPLETE WHEN:

- [ ] Can create a new Assessment
- [ ] Can create a new Job from Quote
- [ ] Can view list of Assessments
- [ ] Can view list of Jobs
- [ ] Quotes page works (already done)
- [ ] Clients page works (already done)

**Everything else (PDF generation, emails, inventory) is Phase 2.**

---

## CONTACT/SUPPORT

If stuck, ask Claude (Sonnet 4) with specific error messages:
- Copy the exact error
- Mention which file
- Describe what you expected vs what happened

Example: "In `/app/assessments/create/page.tsx`, getting error `Cannot find module '../../lib/supabase'`. My supabase file is at `/lib/supabase.ts`."

---

**END OF MVP CHECKLIST**
