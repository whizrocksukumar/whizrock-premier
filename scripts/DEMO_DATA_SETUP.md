# 🚀 DEMO DATA SETUP - EXECUTION GUIDE

## Quick Start (3 Steps)

Your Premier demo dashboard needs real data. Follow these steps to populate the complete CRM pipeline:

### ✅ Step 1: Assessments (Already Complete!)
- **File**: `scripts/insert_test_assessments.sql`
- **Status**: ✅ Already executed (12 assessments in database)
- **Result**: 5 Scheduled, 5 Completed, 2 Cancelled

### ⬅️ Step 2: Quotes (Run Next)
**File**: `scripts/insert_test_quotes.sql`

1. Open Supabase Dashboard → SQL Editor
2. Paste entire contents of `insert_test_quotes.sql`
3. Click "Run" button
4. **Expected Result**:
   - ✅ 10 quotes created
   - ✅ 2 Draft ($3,852)
   - ✅ 2 Sent ($10,660)
   - ✅ 4 Accepted/Won ($68,655)
   - ✅ 2 Rejected/Lost ($17,595)

### ⬅️ Step 3: Jobs (Run Last)
**File**: `scripts/insert_test_jobs.sql`

1. Open Supabase Dashboard → SQL Editor
2. Paste entire contents of `insert_test_jobs.sql`
3. Click "Run" button
4. **Expected Result**:
   - ✅ 6 jobs created
   - ✅ 3 Completed ($47,840 revenue)
   - ✅ 1 In Progress ($17,940 quoted)
   - ✅ 2 Scheduled ($18,050 quoted)

---

## 📊 What Your Dashboard Will Show

After running both SQL files:

### Top Metrics (KPI Cards)
- **Total Revenue**: $47,840 (from 3 completed jobs)
- **Pipeline Value**: $68,655 (from 4 accepted quotes)
- **Active Jobs**: 3 (1 in progress + 2 scheduled)
- **Conversion Rate**: 40% (4 won quotes / 10 total)

### Assessment Pipeline
- **Scheduled**: 5 assessments
- **Completed**: 5 assessments
- **Total**: 12 assessments (2 cancelled)

### Quote Pipeline
- **Draft**: 2 quotes ($3,852)
- **Sent**: 2 quotes ($10,660)
- **Accepted**: 4 quotes ($68,655)

### Recent Activity
- **Last 5 Assessments**: Clickable links to assessment pages
- **Last 5 Quotes**: With customer names and amounts

### Upcoming Jobs
- **Dec 3**: Michelle Davis - 3 townhouses ($17,940) - IN PROGRESS
- **Dec 15**: David Brown - Residential ($11,200) - SCHEDULED
- **Dec 18**: Emma Taylor - Small job ($6,850) - SCHEDULED

### Sales Summary Bar Chart
- Total Quotes: 10
- Won Quotes: 4 (40%)
- Total Revenue: $47,840

---

## 🔍 Verification Queries

After running the SQL files, verify data in Supabase SQL Editor:

```sql
-- Check quotes
SELECT status, COUNT(*), SUM(total_amount) 
FROM quotes 
GROUP BY status;

-- Check jobs
SELECT status, COUNT(*), SUM(quoted_amount), SUM(actual_cost)
FROM jobs
GROUP BY status;

-- Full pipeline overview
SELECT 
  'Assessments' as stage, COUNT(*) as count, NULL as value
FROM assessments
UNION ALL
SELECT 
  'Quotes', COUNT(*), SUM(total_amount)
FROM quotes
UNION ALL
SELECT 
  'Jobs', COUNT(*), SUM(actual_cost)
FROM jobs;
```

---

## 🎯 Demo Checklist

Before showing Premier business owner:

- [ ] ✅ Run `insert_test_quotes.sql`
- [ ] ✅ Run `insert_test_jobs.sql`
- [ ] Refresh dashboard (F5 or reload page)
- [ ] Verify all metrics populated (no zeros)
- [ ] Click through assessment links in "Recent Activity"
- [ ] Test mobile responsive view (resize browser)
- [ ] Check upcoming jobs calendar cards appear
- [ ] Verify pipeline bar charts show percentages

---

## 🎬 Demo Script

Use `scripts/DASHBOARD_DEMO_READY.md` for talking points:

1. **Opening**: "This is your real-time business dashboard..."
2. **Top Metrics**: Point out revenue, pipeline, conversion rate
3. **Pipelines**: Show progression from assessment → quote → job
4. **Recent Activity**: "These are your last 5 assessments, clickable..."
5. **Upcoming Jobs**: "Your crew schedule for the next 2 weeks..."
6. **Sales Summary**: "40% conversion rate - 4 out of 10 quotes won"

---

## 🛠️ Troubleshooting

### If quotes insert fails:
- **Error**: "duplicate key value violates unique constraint"
- **Fix**: Quotes already exist! Check with: `SELECT COUNT(*) FROM quotes;`
- **Solution**: Delete existing quotes first: `DELETE FROM quotes;`

### If jobs insert fails:
- **Error**: "violates foreign key constraint"
- **Fix**: Quotes must exist first! Run `insert_test_quotes.sql` before jobs
- **Solution**: Run SQL files in order (assessments → quotes → jobs)

### If dashboard shows zeros:
- **Fix**: Hard refresh dashboard (Ctrl+F5)
- **Check**: Verify data in Supabase: `SELECT COUNT(*) FROM quotes; SELECT COUNT(*) FROM jobs;`
- **Solution**: Re-run SQL files if counts are zero

---

## 📁 File Locations

All SQL files in: `c:\Users\leosu\whizrock-premier\scripts\`

- ✅ `insert_test_assessments.sql` (Already executed)
- ⬅️ `insert_test_quotes.sql` (Run next)
- ⬅️ `insert_test_jobs.sql` (Run last)
- 📖 `DASHBOARD_DEMO_READY.md` (Demo script)
- 📖 `TESTING_QUICKSTART.md` (Testing guide)

---

## 🎉 Success Criteria

Your demo is ready when you see:

✅ Dashboard loads without "No data" messages  
✅ Total Revenue shows $47,840  
✅ Pipeline Value shows $68,655  
✅ Active Jobs shows 3  
✅ Conversion Rate shows 40%  
✅ Recent Activity lists 5 assessments and 5 quotes  
✅ Upcoming Jobs shows 3 job cards with dates  
✅ Bar charts show visual progression  
✅ All metrics animate and load smoothly  

**You're demo-ready for Premier!** 🚀
