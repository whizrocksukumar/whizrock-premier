# Assessment Wordings System - Setup Guide

## Overview
The Assessment Wordings System allows users to set Pass/Fail/Conditional/Pending results for each assessment area and add detailed findings and recommended actions.

## Files Created

### 1. Database Migration
**File:** `supabase/migrations/20251207_assessment_wordings.sql`
- Creates `assessment_wordings` table with result_type, wordings, and recommended_action
- Adds `result_type` column to `assessment_areas` table
- Creates indexes for performance
- Adds trigger for auto-updating `updated_at` timestamp

### 2. TypeScript Types
**File:** `src/types/assessmentWordings.ts`
- `ResultType` type: 'Pass' | 'Fail' | 'Conditional' | 'Pending'
- `AssessmentWordings` interface
- `AssessmentAreaWithResult` interface
- `RESULT_TYPE_CONFIG` with color schemes and icons for each result type

### 3. React Component
**File:** `src/app/components/WordingsSelector.tsx`
- Reusable component for selecting result type and adding wordings
- Expandable/collapsible interface
- Auto-saves to database
- Shows success/error states
- Styled badges with icons

### 4. Integration Files Updated
- `src/app/assessments/[id]/page.tsx` - Added assessment areas section with WordingsSelector
- `src/app/assessments/[id]/report/page.tsx` - Enhanced report to show result badges and wordings

## Setup Instructions

### Step 1: Run Database Migration
```powershell
# Navigate to project directory
cd c:\Users\leosu\whizrock-premier

# The migration needs to be run in Supabase
# Option 1: Through Supabase Dashboard
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Go to SQL Editor
# 4. Open the file: supabase/migrations/20251207_assessment_wordings.sql
# 5. Execute the SQL

# Option 2: Using Supabase CLI (if installed)
supabase db push
```

### Step 2: Verify Tables Created
Run this query in Supabase SQL Editor:
```sql
-- Check assessment_wordings table
SELECT * FROM information_schema.columns 
WHERE table_name = 'assessment_wordings';

-- Check result_type column in assessment_areas
SELECT * FROM information_schema.columns 
WHERE table_name = 'assessment_areas' 
AND column_name = 'result_type';
```

### Step 3: Test the Component
1. Navigate to an assessment detail page: `/assessments/[id]`
2. Scroll to "Assessment Areas & Results" section
3. For each area:
   - Click a result type button (Pass/Fail/Conditional/Pending)
   - The area will expand showing text editors
   - Enter findings in the "Findings / Wordings" field
   - Enter recommended actions in the "Recommended Action" field
   - Click "Save Wordings"
   - Success message should appear

### Step 4: View Results in Report
1. Navigate to assessment report: `/assessments/[id]/report`
2. In the "Assessment Details by Area" table, you should see:
   - Result badge (color-coded with icon) in the "Result" column
   - Wordings and recommended actions displayed below each area row

## Features

### WordingsSelector Component
- **Result Type Selection:** 4 clickable buttons with icons
  - Pass (✓) - Green
  - Fail (✗) - Red
  - Conditional (⚠) - Yellow
  - Pending (◌) - Gray
- **Expand/Collapse:** Click to show/hide wordings editors
- **Auto-Load:** Fetches existing wordings on mount
- **Real-time Save:** Updates database immediately
- **Loading States:** Shows spinner while loading/saving
- **Error Handling:** Displays error messages if save fails
- **Success Feedback:** Shows green success message after save

### Report Integration
- **Result Badges:** Color-coded badges with icons in results table
- **Expanded Wordings:** Wordings and recommended actions shown in colored row below each area
- **Print-Friendly:** Wordings included in PDF when printing report

## Database Schema

### assessment_wordings Table
```sql
id                   UUID PRIMARY KEY
assessment_id        UUID (FK to assessments)
area_id              UUID (FK to assessment_areas)
result_type          VARCHAR(50) - Pass/Fail/Conditional/Pending
wordings             TEXT
recommended_action   TEXT
created_at           TIMESTAMP
updated_at           TIMESTAMP (auto-updated)
```

### assessment_areas Table (Updated)
```sql
-- Added column:
result_type          VARCHAR(50) DEFAULT 'Pending'
```

## Usage Workflow

### For Assessment Inspectors
1. Complete physical assessment
2. Open assessment detail page
3. For each area:
   - Select result type based on findings
   - Document detailed findings in wordings field
   - Specify recommended actions
   - Save
4. Generate report to see comprehensive results

### For Office Staff
1. Review assessment report
2. See color-coded results at a glance
3. Read detailed findings and recommended actions
4. Use report for quoting and client communication

## Color Scheme
- **Pass:** Green (#10B981) - Area meets standards
- **Fail:** Red (#EF4444) - Area does not meet standards
- **Conditional:** Yellow (#F59E0B) - Area meets standards with conditions
- **Pending:** Gray (#9CA3AF) - Assessment not yet completed

## API Functions

### Database Queries
```typescript
// Get all wordings for assessment
const { data } = await supabase
  .from('assessment_wordings')
  .select('*')
  .eq('assessment_id', assessmentId)

// Get wordings for specific area
const { data } = await supabase
  .from('assessment_wordings')
  .select('*')
  .eq('area_id', areaId)
  .single()

// Create/Update wordings
const { error } = await supabase
  .from('assessment_wordings')
  .upsert({
    assessment_id,
    area_id,
    result_type,
    wordings,
    recommended_action
  })

// Update area result_type
const { error } = await supabase
  .from('assessment_areas')
  .update({ result_type })
  .eq('id', areaId)
```

## Testing Checklist

- [ ] Migration runs without errors
- [ ] assessment_wordings table created
- [ ] result_type column added to assessment_areas
- [ ] WordingsSelector component loads without errors
- [ ] Can select Pass result type
- [ ] Can select Fail result type
- [ ] Can select Conditional result type
- [ ] Can select Pending result type
- [ ] Wordings textarea accepts input
- [ ] Recommended action textarea accepts input
- [ ] Save button saves to database
- [ ] Success message displays after save
- [ ] Error message displays on failure
- [ ] Report shows result badges
- [ ] Report shows wordings text
- [ ] Report prints correctly with wordings

## Troubleshooting

### "Table assessment_wordings does not exist"
- Run the migration SQL in Supabase SQL Editor
- Check if migration file executed successfully

### "Column result_type does not exist"
- Ensure ALTER TABLE statement executed
- Verify with: `\d assessment_areas` in SQL Editor

### WordingsSelector not loading
- Check browser console for errors
- Verify Supabase client is properly configured
- Check network tab for failed API calls

### Save not working
- Check RLS policies on assessment_wordings table
- May need to disable RLS for testing: `ALTER TABLE assessment_wordings DISABLE ROW LEVEL SECURITY;`
- Check user has INSERT/UPDATE permissions

## Future Enhancements
- [ ] Add bulk result type setting (set all areas to Pass)
- [ ] Add result type templates (pre-filled wordings for common scenarios)
- [ ] Add result type statistics (X% Pass, Y% Fail, etc.)
- [ ] Add result type filtering in assessments list
- [ ] Add result type change history/audit log
- [ ] Add email notifications when all areas marked Pass/Fail
