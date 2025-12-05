# Assessment System Testing Plan
**Phase 1A - User Testing Mock Data Strategy**

## Current Database State
✅ **Products**: 15+ real insulation products (PIL-001 to PIL-015)
✅ **Installers**: 3 real team members (James Thompson, Mike Chen, Sarah Williams)
❌ **Customers**: No clients in database yet
❌ **Enquiries**: No enquiries in database yet
❌ **Assessments**: No assessments in database yet

---

## Pages to Test

### 1. Assessment List Page (`/assessments`)
**File**: `src/app/assessments/page.tsx`
**Features to Test**:
- Display all assessments in DataTable
- Filter by status (Scheduled, Completed, Cancelled)
- Sort by date, customer name, reference number
- Search functionality
- Click to view details
- "New Assessment" button navigation

**Required Test Data**: 
- 5-7 Scheduled assessments (upcoming dates)
- 4-5 Completed assessments (past dates with completed_at)
- 2-3 Cancelled assessments
- Mix of different cities (Auckland, Wellington, Christchurch, Tauranga)

---

### 2. Create Assessment Page (`/assessments/new`)
**File**: `src/app/assessments/new/page.tsx`
**Features to Test**:
- ClientDetailsForm (customer name, email, phone, address)
- Site address input
- City and postcode
- Scheduled date/time picker
- Installer dropdown selection
- Notes field
- Reference number auto-generation (ASS-YYYY-NNNN)
- Form validation
- Submit creates new assessment

**Required Test Data**: 
- No mock data needed - this creates NEW records
- Should test with fresh customer data

---

### 3. Assessment Detail Page (`/assessments/[id]`)
**File**: `src/app/assessments/[id]/page.tsx`
**Features to Test**:
- Display customer information
- Display assessment details
- Show assigned installer name
- Show status badge (color-coded)
- Link to enquiry (if linked)
- "Complete Assessment" button for Scheduled assessments
- Read-only view

**Required Test Data**: 
- Need assessments with various statuses to test status badges
- Need at least one linked to an enquiry (if implementing enquiry link)

---

### 4. Complete Assessment Page (`/assessments/[id]/complete`)
**File**: `src/app/assessments/[id]/complete/page.tsx`
**Features to Test**:
- Pre-populated customer info (read-only)
- Site access notes textarea
- Existing insulation dropdown/textarea
- Area measurements input (sqm)
- Ground condition notes
- PhotoUploader component
- Submit updates status to "Completed"
- Mobile-optimized 44×44px touch targets

**Required Test Data**: 
- Need Scheduled assessments to complete
- Test completing assessment and verify status change
- Test that completed assessments show completed_at timestamp

---

## Mock Data Creation Strategy

### Phase 1: Essential Mock Data (START HERE)
**File**: `scripts/insert_test_assessments.sql`

Create **12 test assessments** using:
- Real installer IDs (James, Mike, Sarah)
- Real product references in notes
- Fictional but realistic customer data
- Various cities in NZ

**Breakdown**:
- 5 Scheduled (future dates: Dec 10-16, 2025)
- 5 Completed (past dates: Nov 20-Dec 1, 2025)
- 2 Cancelled (old dates: Nov 15-18, 2025)

### Phase 2: Extended Testing (After basic flow works)
**Future files** (create after Phase 1 works):
- `insert_test_enquiries.sql` - Create enquiries to link to assessments
- `insert_test_quotes.sql` - Create quotes based on completed assessments
- `insert_test_jobs.sql` - Create jobs based on accepted quotes

---

## Testing Workflow

### Test Case 1: View Assessment List
1. Navigate to `/assessments`
2. Verify 12 assessments display
3. Test filtering by status
4. Test sorting columns
5. Test search by customer name

### Test Case 2: View Assessment Details
1. Click on a Scheduled assessment
2. Verify all details display correctly
3. Verify "Complete Assessment" button shows
4. Click "Complete Assessment"

### Test Case 3: Complete Assessment
1. On completion page, verify pre-filled customer info
2. Fill in site access notes
3. Fill in existing insulation details
4. Enter area measurement (e.g., 120 sqm)
5. Add ground condition notes
6. Upload photos (if implementing)
7. Submit form
8. Verify redirect to detail page
9. Verify status changed to "Completed"
10. Verify completed_at timestamp set

### Test Case 4: Create New Assessment
1. Navigate to `/assessments/new`
2. Fill in customer details
3. Enter site address
4. Select scheduled date/time
5. Select installer
6. Add notes
7. Submit form
8. Verify new assessment created with auto-generated reference number

### Test Case 5: Cancelled Assessment
1. View cancelled assessment details
2. Verify status badge shows "Cancelled"
3. Verify no "Complete Assessment" button

---

## Database Schema Validation

### Assessments Table Columns (Confirmed)
```
id, reference_number, customer_name, customer_email, customer_phone,
site_address, city, postcode, scheduled_date, scheduled_time,
assigned_installer_id, status, notes, completed_at, created_at, updated_at
```

### Note on Completion Fields
The completion page (`complete/page.tsx`) uses these fields in `siteData` state:
- `site_access`
- `existing_insulation`
- `area`
- `ground_condition`

**⚠️ IMPORTANT**: These fields may NOT exist in the Phase 1A database schema yet. 
Check if we need to add them or if they're stored in `notes` field for now.

---

## Success Criteria

### Minimum Viable Testing (Phase 1A)
✅ Assessment list displays correctly with filtering/sorting
✅ Can view individual assessment details
✅ Can create new assessment with form validation
✅ Can complete a scheduled assessment
✅ Status changes work (Scheduled → Completed)
✅ Timestamps update correctly
✅ Mobile-responsive on all pages

### Future Enhancements (Post Phase 1A)
- Link assessments to enquiries
- Create quotes from completed assessments
- Convert quotes to jobs
- Full photo upload functionality
- Assessment reporting/analytics
