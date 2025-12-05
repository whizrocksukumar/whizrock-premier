# Quick Start - Assessment Testing

## 🎯 Goal
Test all 4 assessment pages with realistic data to validate Phase 1A implementation.

---

## 📋 Step-by-Step Testing Process

### Step 1: Insert Test Data (5 minutes)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click "SQL Editor" in left menu

2. **Run the test data script**
   - Open file: `scripts/insert_test_assessments.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

3. **Verify insertion**
   - You should see: "Success. No rows returned"
   - Scroll down and run the verification queries at bottom
   - Should see: 5 Scheduled, 5 Completed, 2 Cancelled

---

### Step 2: Test Assessment List Page (3 minutes)

**URL**: `http://localhost:3000/assessments`

✅ **Checklist**:
- [ ] All 12 assessments display in table
- [ ] Filter dropdown works (Scheduled/Completed/Cancelled)
- [ ] Sorting works (click column headers)
- [ ] Search box filters results
- [ ] "New Assessment" button shows
- [ ] Reference numbers display correctly (ASS-2025-0001, etc.)
- [ ] Status badges show correct colors
- [ ] Installer names display
- [ ] Dates formatted correctly

**What to Look For**:
- No TypeScript errors in console
- No missing data (empty cells)
- Mobile responsive (try resizing browser)
- Table pagination works if >10 records

---

### Step 3: Test Assessment Detail Page (2 minutes)

**Action**: Click on "ASS-2025-0001" (John Smith)

✅ **Checklist**:
- [ ] Customer details display (name, email, phone)
- [ ] Site address shows correctly
- [ ] Scheduled date/time displays
- [ ] Assigned installer shows "James Thompson"
- [ ] Status badge shows "Scheduled"
- [ ] Notes display full text
- [ ] "Complete Assessment" button appears
- [ ] "Back to Assessments" link works

**Test Different Statuses**:
- View a Completed assessment (ASS-2025-0006) - Should NOT show "Complete Assessment" button
- View a Cancelled assessment (ASS-2025-0011) - Should show "Cancelled" status

---

### Step 4: Test Complete Assessment Flow (5 minutes)

**Action**: From ASS-2025-0001 detail page, click "Complete Assessment"

**URL**: `http://localhost:3000/assessments/[id]/complete`

✅ **Checklist**:
- [ ] Customer info pre-filled (read-only)
- [ ] Site access notes textarea works
- [ ] Existing insulation field works
- [ ] Area (sqm) number input works
- [ ] Ground condition notes textarea works
- [ ] PhotoUploader component loads (if implemented)
- [ ] Form validation works (try submitting empty)
- [ ] Submit button works

**Test Completion**:
1. Fill in all fields:
   - Site access: "Good access via main door. 1.2m crawl space height."
   - Existing insulation: "None - clean roof space"
   - Area: "120"
   - Ground condition: "Dry, no moisture issues"

2. Click "Complete Assessment"

3. Verify:
   - [ ] Redirects to detail page
   - [ ] Status changed to "Completed"
   - [ ] Completed timestamp shows
   - [ ] Notes updated with completion info

4. Go back to list view:
   - [ ] Assessment shows as "Completed"
   - [ ] Can filter to see only Completed assessments

---

### Step 5: Test Create New Assessment (5 minutes)

**URL**: `http://localhost:3000/assessments/new`

✅ **Checklist**:
- [ ] ClientDetailsForm component loads
- [ ] All input fields present
- [ ] Installer dropdown populated (James, Mike, Sarah)
- [ ] Date/time pickers work
- [ ] Form validation works (required fields)

**Test Creation**:
1. Fill in form:
   - Customer Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "021-555-9999"
   - Site Address: "99 Test Street, Auckland"
   - City: "Auckland"
   - Postcode: "1010"
   - Scheduled Date: (pick tomorrow's date)
   - Scheduled Time: "10:00"
   - Installer: Select "James Thompson"
   - Notes: "Test assessment for Phase 1A validation"

2. Click "Create Assessment"

3. Verify:
   - [ ] Redirects to list or detail page
   - [ ] New assessment appears with auto-generated reference (ASS-2025-0013)
   - [ ] All details saved correctly
   - [ ] Status is "Scheduled"

---

## 🐛 Common Issues & Solutions

### Issue: "Team member not found" error
**Solution**: Run helper query first to verify installers exist:
```sql
SELECT id, first_name, last_name, role 
FROM team_members 
WHERE role = 'Installer';
```

### Issue: DataTable shows "No data"
**Solution**: Check browser console for errors. Verify Supabase connection in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Issue: Reference numbers not generating
**Solution**: Check `generateReferenceNumber()` function in `/assessments/new/page.tsx`

### Issue: "Complete Assessment" button doesn't work
**Solution**: 
1. Check that assessment status is "Scheduled" (only Scheduled can be completed)
2. Check browser console for form validation errors
3. Verify site_access, area fields are filled in

---

## 📊 Expected Test Results

After completing all tests, you should have:

| Status | Count | Notes |
|--------|-------|-------|
| Scheduled | 4 | (5 original - 1 completed in testing) |
| Completed | 6 | (5 original + 1 completed in testing) |
| Cancelled | 2 | (unchanged) |
| **TOTAL** | **13** | (12 original + 1 new created) |

---

## ✅ Phase 1A Success Criteria

- [x] Assessment list displays correctly
- [x] Filtering and sorting work
- [x] Can view individual assessment details
- [x] Can complete scheduled assessments
- [x] Status updates persist to database
- [x] Can create new assessments
- [x] Reference numbers auto-generate
- [x] Mobile responsive
- [x] No TypeScript errors
- [x] No console errors

---

## 🚀 Next Steps After Testing

Once all tests pass:

### Phase 1B: Quote Creation
- Create quotes page similar to assessments
- Link quotes to completed assessments
- Implement quote line items
- Quote approval workflow

### Phase 2: Job Management
- Convert accepted quotes to jobs
- Job scheduling and crew assignment
- Job completion workflow
- Link to invoicing

### Phase 3: VA Workspace
- Product recommendation engine
- Assessment photo gallery
- Quote generation automation
- Customer communication templates

---

## 📝 Testing Feedback Template

```
Date: _____________
Tester: ___________

Assessment List Page:
✅ PASS / ❌ FAIL - Notes: ____________________

Assessment Detail Page:
✅ PASS / ❌ FAIL - Notes: ____________________

Complete Assessment:
✅ PASS / ❌ FAIL - Notes: ____________________

Create Assessment:
✅ PASS / ❌ FAIL - Notes: ____________________

Issues Found:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

Suggestions:
1. ___________________________________________
2. ___________________________________________
```

---

## 🎓 Pro Tips

1. **Use Browser DevTools**: Keep console open to catch errors early
2. **Test Mobile First**: Use device emulation in Chrome DevTools
3. **Test Edge Cases**: Try empty fields, very long text, special characters
4. **Check Performance**: Large notes field should not slow page load
5. **Verify Database**: After each action, check Supabase directly to confirm data
6. **Test User Flow**: Simulate real VA workflow (list → detail → complete → quote)

Happy Testing! 🎉
