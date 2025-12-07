-- Create storage bucket for recommendation attachments
-- This allows VAs to attach photos, floor plans, assessment reports, etc. to product recommendations

-- Create the bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recommendation-attachments',
    'recommendation-attachments',
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

-- Storage policies for recommendation attachments

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recommendation-attachments');

-- Policy: Authenticated users can view files
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'recommendation-attachments');

-- Policy: Authenticated users can delete files
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'recommendation-attachments');

-- Policy: Authenticated users can update files (for replacing/renaming)
CREATE POLICY "Authenticated users can update attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'recommendation-attachments');

-- Create attachments table to track files linked to recommendations
CREATE TABLE IF NOT EXISTS recommendation_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES product_recommendations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_url TEXT NOT NULL, -- Public URL for accessing the file
    file_size BIGINT, -- Size in bytes
    file_type TEXT, -- MIME type
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_recommendation_attachments_recommendation_id 
ON recommendation_attachments(recommendation_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_attachments_uploaded_by 
ON recommendation_attachments(uploaded_by);

-- Comments
COMMENT ON TABLE recommendation_attachments IS 'Stores file attachment metadata for product recommendations';
COMMENT ON COLUMN recommendation_attachments.file_path IS 'Path to file in storage bucket (e.g., {recommendation_id}/{timestamp}_{filename})';
COMMENT ON COLUMN recommendation_attachments.file_url IS 'Full public URL for accessing the file';

-- Verification query
SELECT 
    b.id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types
FROM storage.buckets b
WHERE b.id = 'recommendation-attachments';
