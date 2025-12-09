/**
 * MOCK DATA FOR ASSESSMENT AREAS
 * 
 * Run this in your Supabase SQL Editor to add mock assessment areas
 * for the existing assessment: 9bc09bb8-c81e-4523-a2b8-0e2901975a8d
 */

-- Insert assessment areas for David Taylor's assessment
INSERT INTO assessment_areas (
  assessment_id,
  area_name,
  square_metres,
  existing_insulation_type,
  result_type
) VALUES
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Ceiling - Main House',
  85.5,
  'R2.0 Polyester',
  'Pending'
),
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Underfloor - Living Area',
  45.2,
  'None',
  'Pending'
),
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Garage Ceiling',
  22.0,
  'R1.5 Glasswool',
  'Pending'
);

-- Check if assessment_photos table exists, if so insert photos
-- (Skip this if table doesn't exist - photos section will just be hidden)
-- Commented out - table column structure unknown, update when confirmed
/*
INSERT INTO assessment_photos (
  assessment_id,
  photo_type,
  file_url
) VALUES
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Ceiling - Before',
  'https://placehold.co/600x400/0066CC/white?text=Ceiling+Before'
),
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Underfloor - Before',
  'https://placehold.co/600x400/gray/white?text=Underfloor+Before'
),
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Garage - Before',
  'https://placehold.co/600x400/orange/white?text=Garage+Before'
),
(
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Site Overview',
  'https://placehold.co/600x400/green/white?text=Site+Overview'
);
*/

-- Verify the data was inserted
SELECT 
  a.area_name,
  a.square_metres,
  a.existing_insulation_type,
  a.result_type
FROM assessment_areas a
WHERE a.assessment_id = '9bc09bb8-c81e-4523-a2b8-0e2901975a8d'
ORDER BY a.created_at;
