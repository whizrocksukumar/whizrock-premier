# Opportunities & Tasks Workflow - Implementation Status

## Overview
Complete CRM pipeline system from inquiry to quote, with VA Workspace integration for product recommendations.

---

## ✅ COMPLETED Components

### 1. Database Schema
**File:** `supabase/migrations/20251207_opportunities_tasks_system.sql`

- ✅ `opportunities` table (27 fields, 9 indexes)
- ✅ `tasks` table (17 fields, 7 indexes)
- ✅ `task_assignments` table (optional multi-assignee support)
- ✅ `opportunity_attachments` table (file storage support)
- ✅ Bidirectional links with `product_recommendations`
- ✅ Auto-update triggers for `updated_at`
- ✅ Sample data with 3 opportunities, 12 tasks

**Test Data:** `supabase/migrations/20251207_test_data_opportunities.sql`
- 6 test opportunities covering all pipeline stages
- 10+ test tasks with various statuses
- Realistic scenarios for development and testing

---

### 2. API Routes

#### **Send to VA** 
**File:** `src/app/api/send-to-va/route.ts` ✅ COMPLETE

**Functionality:**
- Sends HTML email to VA with opportunity details
- Updates `opportunities.recommendation_status` = 'Sent to VA'
- Creates task for VA user (type: 'Create Recommendation', priority: High, due: today)
- Task notes include full opportunity context

**Email Template:**
- Orange header with "🎯 New Product Recommendation Request"
- Opportunity details grid
- Attachments list
- "ACTION REQUIRED" badge
- CTA button to VA workspace

#### **VA Submit Recommendation**
**File:** `src/app/api/va-submit-recommendation/route.ts` ✅ COMPLETE

**Functionality:**
- Updates `opportunities.recommendation_status` = 'Submitted'
- Links `opportunity.product_recommendation_id`
- Creates task for sales rep: "Review VA recommendation and convert to quote"
- Sends email to sales rep

**Email Template:**
- Green header with "✅ Product Recommendation Submitted"
- Recommendation summary (sections, area, packs)
- "ACTION REQUIRED TODAY" badge
- CTA to opportunity detail page

---

### 3. Frontend Pages

#### **VA Workspace Dashboard**
**File:** `src/app/va-workspace/page.tsx` ✅ COMPLETE

**Features:**
- Two stat cards: New Tasks (Not Started), In Progress
- Task list filtered to VA user (excludes Completed)
- Customer name display (company primary, contact fallback)
- Contact person shown when company exists
- Progress bars for tasks with completion %
- Overdue indicators (red highlighting)
- "Start" buttons linking to recommendation creation
- Recent recommendations section (last 5)

**Current State:**
- Authentication temporarily disabled for development
- Uses first VA user from database or creates demo user
- Fully functional with test data

#### **Opportunity Detail Page**
**File:** `src/app/opportunities/[id]/page.tsx` ✅ COMPLETE

**Layout:**
- Two-column responsive design (lg:grid-cols-3)
- Server-side rendered with Supabase queries

**Left Column:**
- Customer Information card (company + contact person logic)
- VA Recommendation section (conditional based on status)
  * If linked: Stats grid, "View Recommendation", "Convert to Quote" buttons
  * If not: Blue info box with "Send to VA" button
- Tasks section with progress tracking
- Notes section

**Right Sidebar:**
- Status card (stage, sub-status, recommendation status with color coding)
- Financial card (estimated value, actual value)
- Dates card (created, target close)
- Attachments card (file list, upload button)
- Sales rep card (name, email)

---

## ⚠️ PENDING Components

### 1. Convert to Quote Page
**File:** `src/app/quotes/convert-from-recommendation/[id]/page.tsx` ❌ NOT STARTED

**Requirements:**
- Pre-populate ALL customer details from opportunity
- Import ALL products and sections from recommendation
- Allow pricing tier selection (Homeowner/Builder/Contractor)
- Product modifications and quantity adjustments
- On submit:
  * Create quote record with all sections and line items
  * Update `opportunity.recommendation_status` = 'Converted to Quote'
  * Update `opportunity.stage` = 'QUOTED'
  * Create task: "Send quote to customer" (due today)
  * Send email to customer with quote PDF

**Priority:** 🔥 CRITICAL - Completes the workflow chain

---

### 2. Opportunities Kanban Board
**File:** `src/app/opportunities/page.tsx` ❌ NOT STARTED

**Requirements:**
- 5 columns: NEW, QUALIFIED, QUOTED, WON, LOST
- Drag-and-drop cards using @dnd-kit or react-beautiful-dnd
- Card content:
  * Customer name (company primary, contact fallback)
  * Contact person (if company exists)
  * Opp number, estimated value
  * Sub-status badge
  * Task progress (2/4)
  * VA recommendation status indicator
  * Days in stage

**Filters:**
- Sales Rep dropdown
- Date Range picker
- Client Type multi-select
- Search by customer/opp number

**Stats Bar:**
- Total pipeline value
- Opportunities by stage count
- Win rate %
- Avg days to close

**Priority:** 🔥 HIGH - Main navigation page

---

### 3. File Upload Component
**Location:** Opportunity Detail Page attachments section

**Requirements:**
- File upload dropzone
- Upload to Supabase Storage bucket ('opportunity-attachments')
- Insert records in `opportunity_attachments` table
- File categories: Assessment Photo, Floor Plan, Quote Document, Other
- Show file list with download links
- Image preview for photos

**Priority:** 🟡 MEDIUM

---

### 4. VA Recommendation Creation Page
**File:** `src/app/va-workspace/new/page.tsx` (may already exist)

**Enhancement Needed:**
- Accept URL param `?opportunityId=X`
- Pre-populate customer details from opportunity
- Link `opportunity_id` when creating recommendation

**Priority:** 🟡 MEDIUM

---

## 🔄 Complete Workflow Chain

### Current Flow (Partially Complete)

1. **Sales rep sends opportunity to VA** ✅
   - Via `/api/send-to-va`
   - Email sent, status updated, VA task created

2. **VA creates recommendation** ⚠️ (existing page, needs enhancement)
   - In `/va-workspace/new`
   - Links opportunity_id
   - No pricing visible

3. **VA submits recommendation** ✅
   - Via `/api/va-submit-recommendation`
   - Status updated, sales rep task created, email sent

4. **Sales rep converts to quote** ❌ MISSING
   - **NEEDS:** Convert to Quote page
   - Import recommendation data
   - Add pricing
   - Create quote
   - Update opportunity stage

5. **Send quote to customer** ⚠️ (depends on #4)
   - Email with PDF attachment
   - Update sub-status to "Quote Sent"

---

## 📊 Customer Name Display Logic

**Applied throughout all components:**

### SQL Queries:
```sql
COALESCE(companies.company_name, 
         opportunities.contact_first_name || ' ' || opportunities.contact_last_name) 
as customer_name,

CASE 
    WHEN companies.company_name IS NOT NULL 
    THEN opportunities.contact_first_name || ' ' || opportunities.contact_last_name
    ELSE NULL
END as contact_person
```

### React Components:
```typescript
const customerName = opportunity.companies?.company_name || 
  `${opportunity.contact_first_name} ${opportunity.contact_last_name}`;
  
const contactPerson = opportunity.companies?.company_name 
  ? `${opportunity.contact_first_name} ${opportunity.contact_last_name}` 
  : null;
```

---

## 🧪 Testing with Test Data

### Step 1: Run Migrations
```sql
-- In Supabase SQL Editor:
-- 1. Run main schema migration
\i supabase/migrations/20251207_opportunities_tasks_system.sql

-- 2. Run test data script
\i supabase/migrations/20251207_test_data_opportunities.sql
```

### Step 2: Access Pages
- **VA Workspace:** http://localhost:3001/va-workspace
- **Opportunity Detail:** http://localhost:3001/opportunities/{id}
- **Dashboard:** http://localhost:3001/dashboard

### Step 3: Test Workflow
1. View TEST-003 opportunity (Sophie Williams) - VA task In Progress
2. Complete recommendation in VA Workspace
3. Submit recommendation (triggers email + sales rep task)
4. View TEST-004 opportunity (David Chen) - VA submitted, ready for quote
5. **[PENDING]** Convert to quote (page not built yet)

---

## 📋 Next Steps (Priority Order)

1. **🔥 Build Convert to Quote Page**
   - Most critical missing piece
   - Completes end-to-end workflow
   - Import recommendation, add pricing, create quote

2. **🔥 Build Opportunities Kanban Board**
   - Main opportunities navigation page
   - Drag-drop between pipeline stages
   - Filters and search

3. **🟡 Enhance VA Recommendation Creation**
   - Accept opportunityId param
   - Pre-populate from opportunity data

4. **🟡 Add File Upload to Opportunities**
   - Upload assessment photos, documents
   - Store in Supabase Storage

5. **🟢 Implement Authentication**
   - Replace temporary auth bypass
   - Proper user session management
   - Role-based access control

---

## 🎯 Success Criteria

### ✅ Phase 1 Complete When:
- [x] Database schema deployed
- [x] Test data created
- [x] VA Workspace functional
- [x] Send to VA API working
- [x] VA Submit API working
- [x] Opportunity detail page complete

### ⏳ Phase 2 Complete When:
- [ ] Convert to Quote page functional
- [ ] Opportunities Kanban board working
- [ ] Full workflow testable end-to-end
- [ ] File uploads working

### 🎉 MVP Complete When:
- [ ] Complete workflow from inquiry to quote
- [ ] All email notifications sending
- [ ] All task automation working
- [ ] Authentication implemented
- [ ] Production ready

---

## 📞 Support

Questions or issues? Check:
- Database schema comments in migration file
- API route documentation in code
- Email template designs in route files
- Test data scenarios in test data script
