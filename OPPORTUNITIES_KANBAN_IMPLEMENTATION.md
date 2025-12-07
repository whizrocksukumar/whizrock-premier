# Opportunities Kanban Page - Implementation Complete ✅

## 📋 What's Been Built

### 1. **Main Kanban Page** (`src/app/opportunities/page.tsx`)
- **5-column Kanban board**: NEW (blue), QUALIFIED (orange), QUOTED (purple), WON (green), LOST (gray)
- **Search bar**: 30% width, filters across all opportunity fields
- **Stage filter buttons**: All, New, Qualified, Quoted, Won, Lost
- **Drag-and-drop**: Move opportunities between stages with automatic database updates
- **Responsive columns**: Auto-adjusts to screen height

### 2. **Opportunity Cards**
Each card displays:
- ✅ OPP # (e.g., TEST-001)
- ✅ Customer name (Company name or contact name)
- ✅ Contact person (if company exists)
- ✅ Site address with MapPin icon
- ✅ Estimated value with DollarSign icon
- ✅ Sub-status badge
- ✅ Due date with Calendar icon
- ✅ Color-coded by stage
- ✅ Hover effects (shadow + border)
- ✅ Draggable between columns
- ✅ Click to open detail drawer

### 3. **Side Drawer Detail Panel**
Slides in from right (600px width) with:

**Header:**
- Opportunity number and customer name
- Stage badge (color-coded)
- Close button (X icon)
- 4 tabs: Overview | Tasks | Timeline | Attachments

**Overview Tab:**
- Customer details (name, email, phone, contact type, client type)
- Company info (if exists)
- Site address
- Financial info (estimated value, actual value)
- Sales rep assigned
- Due date
- Notes (if exists)

**Tasks Tab:**
- Lists all tasks for this opportunity
- Shows task type, status, priority, due date
- Shows assigned team member
- Color-coded status badges
- Empty state: "No tasks yet"

**Timeline Tab:**
- Placeholder: "Timeline feature coming soon..."

**Attachments Tab:**
- **NEW stage**: Read-only message ("available when moved to QUALIFIED")
- **QUALIFIED stage**: Full upload capability
  - [+ Add File] button (Upload icon)
  - Multi-file selector (PDF, JPG, PNG, DOC, DOCX)
  - File preview before upload with sizes
  - Upload button
  - Uploaded files list with:
    - File name, size, upload date
    - Download button (opens in new tab)
    - Delete button (soft delete, requires confirmation)
- Empty state: "No attachments yet"

**Footer Actions:**
- [Edit] button - Links to `/opportunities/{id}` detail page
- [Move to Stage] button - Stage selector (placeholder)
- [Delete] button - Delete opportunity (placeholder)

### 4. **File Attachments System**
- **Storage bucket**: `opportunity-attachments`
- **File structure**: `opportunities/{opportunity_id}/{timestamp}_{filename}`
- **Database table**: `opportunity_attachments`
- **Soft delete**: Files marked as deleted but not physically removed
- **Access control**: Authenticated users only
- **File size limit**: 10MB per file
- **Supported types**: PDF, JPG, PNG, DOC, DOCX

### 5. **Auto-Rules (Stage Changes)**
When opportunity is dragged to a new stage:
- ✅ Database updates: `stage` and `updated_at` fields
- ✅ Auto-creates tasks:
  - **QUALIFIED** → "Add Assessment Files & Create Recommendation" (Product Recommendation task, High priority, 7 days)
  - **QUOTED** → "Send Quote" (Quote Creation task, High priority, 7 days)
  - **WON** → "Schedule Job" (Other task, High priority, 7 days)
  - **LOST** → No task created (archived)

### 6. **Database Integration**
Queries:
- `opportunities` with LEFT JOIN `companies`, `team_members`
- `tasks` filtered by opportunity_id with assigned user
- `opportunity_attachments` filtered by opportunity_id and is_deleted=false

Updates:
- Drag-drop: UPDATE opportunities SET stage, updated_at
- Auto-tasks: INSERT INTO tasks
- File upload: INSERT INTO opportunity_attachments
- File delete: UPDATE opportunity_attachments SET is_deleted=true

## 🗄️ Database Migration

**File**: `supabase/migrations/20251207_opportunity_attachments_storage.sql`

Creates:
- Storage bucket: `opportunity-attachments` (private, 10MB limit)
- Storage policies: INSERT, SELECT, DELETE, UPDATE for authenticated users
- Table: `opportunity_attachments` with columns:
  - id, opportunity_id, file_name, file_path, file_url
  - file_size, file_type, file_category
  - uploaded_by_user_id, uploaded_at
  - is_deleted, deleted_at, deleted_by_user_id
  - created_at, updated_at
- Indexes on: opportunity_id, uploaded_by_user_id, file_category

**To apply:**
1. Open Supabase dashboard → SQL Editor
2. Copy and paste the migration SQL
3. Execute
4. Verify bucket in Storage section

## 🎨 Styling & UX

### Colors
- **Primary blue**: #0066CC (Salesforce blue)
- **NEW**: bg-blue-100, text-blue-800, border-blue-300
- **QUALIFIED**: bg-orange-100, text-orange-800, border-orange-300
- **QUOTED**: bg-purple-100, text-purple-800, border-purple-300
- **WON**: bg-green-100, text-green-800, border-green-300
- **LOST**: bg-gray-100, text-gray-800, border-gray-300

### Fonts
- Uses Inter font (from globals.css)
- Headers: font-semibold
- Body: font-medium or regular

### Layout
- Master template header (matches customers, quotes pages)
- Full-width Kanban board with 5 equal columns
- Card min-height: calc(100vh - 300px) for full viewport usage
- Drawer: Fixed 600px width, full height, right-aligned

### Interactions
- Drag-and-drop: Visual feedback (cursor changes)
- Hover states: Shadow + border on cards
- Loading states: Spinner with message
- Empty states: Friendly messages
- Confirmation dialogs: For destructive actions (delete file)

## 📊 Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| 5-column Kanban | ✅ Complete | NEW, QUALIFIED, QUOTED, WON, LOST |
| Search & Filters | ✅ Complete | 30% width search + stage buttons |
| Drag-and-drop | ✅ Complete | Auto-updates database |
| Opportunity cards | ✅ Complete | Color-coded with all required fields |
| Side drawer | ✅ Complete | 4 tabs with full details |
| File attachments | ✅ Complete | Upload, download, delete |
| Stage restrictions | ✅ Complete | Uploads only in QUALIFIED stage |
| Auto-task creation | ✅ Complete | Rules for each stage change |
| Master header | ✅ Complete | Matches existing pages |
| Responsive design | ✅ Complete | Adapts to screen size |
| Loading states | ✅ Complete | Spinner + messages |
| Error handling | ✅ Complete | Console logs + user alerts |

## 🚀 Next Steps

### 1. Run Migration
Execute `20251207_opportunity_attachments_storage.sql` in Supabase

### 2. Test Workflow
1. Navigate to `/opportunities`
2. Drag opportunity from NEW → QUALIFIED
3. Verify task auto-created
4. Click opportunity card
5. Click Attachments tab
6. Upload files (PDF, images)
7. Download files
8. Delete a file
9. Verify soft delete

### 3. Future Enhancements
- [ ] Implement "Move to Stage" dropdown in drawer footer
- [ ] Implement "Delete" button functionality (confirm + soft delete)
- [ ] Build Timeline tab with activity history
- [ ] Add file category selector during upload
- [ ] Show uploader name in attachments list
- [ ] Add file preview/thumbnail for images
- [ ] Export opportunities to CSV/Excel
- [ ] Bulk actions (select multiple opportunities)
- [ ] Email notifications when files uploaded
- [ ] Assessment link integration in drawer

## 🐛 Known Limitations

1. **Timeline tab**: Placeholder only (feature not implemented)
2. **Move to Stage button**: UI exists but no functionality
3. **Delete button**: UI exists but no functionality
4. **File uploader name**: Not displayed in attachments list
5. **Edit opportunity**: Links to detail page (not built yet for editing)

## ✅ Testing Checklist

- [ ] Load opportunities page
- [ ] Search for opportunities by number, name, company
- [ ] Filter by stage using buttons
- [ ] Drag opportunity between columns
- [ ] Verify stage updates in database
- [ ] Verify auto-task created
- [ ] Open drawer by clicking card
- [ ] Navigate between tabs (Overview, Tasks, Timeline, Attachments)
- [ ] Upload files (QUALIFIED stage only)
- [ ] Download uploaded files
- [ ] Delete uploaded files
- [ ] Verify soft delete in database
- [ ] Close drawer with X button or backdrop click
- [ ] Verify responsive design on different screen sizes

---

**Status**: ✅ COMPLETE - Ready for testing and migration deployment
