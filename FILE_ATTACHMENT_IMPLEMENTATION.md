# File Attachment Feature - Implementation Guide

## ✅ What's Been Added

### 1. UI Components
- **Attach Files Button** - Located after General Notes section with Upload icon
- **File List Display** - Shows all attached files with name and size
- **Remove File Button** - Individual delete button for each file (X icon)
- **Upload Status** - Visual feedback during file selection

### 2. Supported File Types
- PDF documents (.pdf)
- Images (.jpg, .jpeg, .png)
- Word documents (.doc, .docx)
- Max file size: 10MB per file

### 3. File Upload Flow
```
1. VA clicks "Attach Files" button
2. Selects one or multiple files from file picker
3. Files added to UI immediately with preview
4. Files stored in memory until recommendation is saved
5. On save/submit, files uploaded to Supabase Storage
6. File metadata saved to recommendation_attachments table
```

## 🔧 Setup Required

### Run the Storage Bucket Migration

You need to run this migration in your Supabase dashboard to create the storage bucket:

**File:** `supabase/migrations/20251207_create_recommendation_attachments_bucket.sql`

**What it creates:**
- Storage bucket: `recommendation-attachments` (private, 10MB limit)
- Storage policies: INSERT, SELECT, DELETE, UPDATE for authenticated users
- Table: `recommendation_attachments` to track file metadata
- Indexes for efficient queries

**To apply the migration:**

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL
5. Verify bucket creation in Storage section

Alternatively, if you have Supabase CLI:
```bash
supabase db push
```

## 📝 Code Changes Made

### Files Modified:

**src/app/va-workspace/new/page.tsx**
- Added `Upload` and `FileText` icons from lucide-react
- Added state: `attachedFiles`, `uploadedFileUrls`, `uploadingFile`
- Added handlers: `handleFileSelect`, `removeFile`, `uploadFilesToStorage`
- Added UI section: "Attachments" after General Notes

**supabase/migrations/20251207_create_recommendation_attachments_bucket.sql** (NEW)
- Complete storage bucket setup with policies
- Attachments table schema
- Indexes and comments

## 🔄 Next Steps to Complete Integration

### 1. Update Save/Submit Functions

The `saveDraft` and `submitForReview` functions currently show alerts. When implementing the actual save logic, you'll need to:

```typescript
const saveDraft = async () => {
    try {
        // 1. Create the product_recommendation record
        const { data: recommendation, error: recError } = await supabase
            .from('product_recommendations')
            .insert({
                // ... recommendation fields
            })
            .select()
            .single();

        if (recError) throw recError;

        // 2. Upload files if any attached
        if (attachedFiles.length > 0) {
            await uploadFilesToStorage(recommendation.id);
        }

        // 3. Navigate or show success message
        router.push('/va-workspace');
    } catch (err) {
        console.error('Error saving:', err);
        alert('Error saving recommendation');
    }
};
```

### 2. Enhance uploadFilesToStorage Function

Currently it returns URLs. Enhance it to also save metadata to the database:

```typescript
const uploadFilesToStorage = async (recommendationId: string) => {
    for (const file of attachedFiles) {
        const fileName = `${recommendationId}/${Date.now()}_${file.name}`;
        
        // Upload to storage
        const { data, error } = await supabase.storage
            .from('recommendation-attachments')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('recommendation-attachments')
            .getPublicUrl(fileName);

        // Save metadata to database
        await supabase
            .from('recommendation_attachments')
            .insert({
                recommendation_id: recommendationId,
                file_name: file.name,
                file_path: fileName,
                file_url: urlData.publicUrl,
                file_size: file.size,
                file_type: file.type,
                uploaded_by: (await supabase.auth.getUser()).data.user?.id
            });
    }
};
```

### 3. Display Attachments in View Mode

When viewing existing recommendations, fetch and display attachments:

```typescript
// Fetch attachments
const { data: attachments } = await supabase
    .from('recommendation_attachments')
    .select('*')
    .eq('recommendation_id', recommendationId);

// Display with download links
{attachments?.map(att => (
    <a href={att.file_url} target="_blank" rel="noopener noreferrer">
        {att.file_name}
    </a>
))}
```

## 🎯 Feature Benefits

- **VA Workflow Enhancement** - VAs can attach photos, floor plans, assessment reports
- **Complete Documentation** - All relevant files stored with recommendations
- **Easy Access** - Files accessible from recommendation view
- **Audit Trail** - Track who uploaded what and when
- **Professional Output** - Recommendations can include comprehensive documentation

## ✅ Testing Checklist

After running the migration:

- [ ] Create new recommendation
- [ ] Click "Attach Files" button
- [ ] Select multiple files (PDF, images)
- [ ] Verify files appear in list with correct names/sizes
- [ ] Remove one file using X button
- [ ] Verify file removed from list
- [ ] Test with large file (should be under 10MB)
- [ ] Test with unsupported file type (should be rejected by file picker)

## 📊 Database Schema

### recommendation_attachments Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recommendation_id | UUID | FK to product_recommendations |
| file_name | TEXT | Original filename |
| file_path | TEXT | Path in storage bucket |
| file_url | TEXT | Full public URL |
| file_size | BIGINT | Size in bytes |
| file_type | TEXT | MIME type |
| uploaded_by | UUID | FK to auth.users |
| created_at | TIMESTAMP | Upload timestamp |
| updated_at | TIMESTAMP | Last modified |

## 🔒 Security

- **Private Bucket** - Files not publicly accessible without authentication
- **Authenticated Only** - Must be logged in to upload/view/delete
- **Size Limits** - 10MB per file prevents abuse
- **Type Restrictions** - Only approved file types allowed
- **Audit Trail** - Track who uploaded each file

---

**Status:** UI Complete ✅ | Storage Migration Ready ✅ | Integration Pending ⏳
