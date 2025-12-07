-- Create storage bucket for opportunity attachments
-- This allows users to attach assessment PDFs, photos, documents to opportunities (especially in QUALIFIED stage)

-- Create the bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'opportunity-attachments',
    'opportunity-attachments',
    false, -- Private bucket (requires authentication)
    10485760, -- 10MB file size limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for opportunity attachments

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload opportunity attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'opportunity-attachments');

-- Policy: Authenticated users can view files
CREATE POLICY "Authenticated users can view opportunity attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'opportunity-attachments');

-- Policy: Authenticated users can delete files
CREATE POLICY "Authenticated users can delete opportunity attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'opportunity-attachments');

-- Policy: Authenticated users can update files
CREATE POLICY "Authenticated users can update opportunity attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'opportunity-attachments');

-- Create attachments table to track files linked to opportunities
CREATE TABLE IF NOT EXISTS opportunity_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_url TEXT NOT NULL, -- Public URL for accessing the file
    file_size BIGINT, -- Size in bytes
    file_type TEXT, -- MIME type
    file_category TEXT DEFAULT 'Other', -- 'Assessment PDF', 'Photo', 'Document', 'Other'
    uploaded_by_user_id UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false, -- Soft delete flag
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_opportunity_attachments_opportunity_id 
ON opportunity_attachments(opportunity_id) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_opportunity_attachments_uploaded_by 
ON opportunity_attachments(uploaded_by_user_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_attachments_file_category
ON opportunity_attachments(file_category) WHERE is_deleted = false;

-- Comments
COMMENT ON TABLE opportunity_attachments IS 'Stores file attachment metadata for opportunities (assessment PDFs, photos, documents)';
COMMENT ON COLUMN opportunity_attachments.file_path IS 'Path to file in storage bucket (e.g., opportunities/{opportunity_id}/{timestamp}_{filename})';
COMMENT ON COLUMN opportunity_attachments.file_url IS 'Full public URL for accessing the file';
COMMENT ON COLUMN opportunity_attachments.file_category IS 'Category of file: Assessment PDF, Photo, Document, Other';
COMMENT ON COLUMN opportunity_attachments.is_deleted IS 'Soft delete flag - files are not physically deleted immediately';

-- Verification query
SELECT 
    b.id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types
FROM storage.buckets b
WHERE b.id = 'opportunity-attachments';

-- Test query to check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunity_attachments'
ORDER BY ordinal_position;
