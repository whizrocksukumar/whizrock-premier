-- Insert mock assessment areas for existing assessment
-- Assessment ID: 9bc09bb8-c81e-4523-a2b8-0e2901975a8d (David Taylor assessment)

-- Insert assessment areas
INSERT INTO assessment_areas (
  id,
  assessment_id,
  area_name,
  square_metres,
  existing_insulation_type,
  result_type,
  sort_order,
  created_at
) VALUES
(
  gen_random_uuid(),
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Ceiling - Main House',
  85.5,
  'R2.0 Polyester',
  'Pending',
  1,
  NOW()
),
(
  gen_random_uuid(),
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Underfloor - Living Area',
  45.2,
  'None',
  'Pending',
  2,
  NOW()
),
(
  gen_random_uuid(),
  '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
  'Garage Ceiling',
  22.0,
  'R1.5 Glasswool',
  'Pending',
  3,
  NOW()
);

-- Note: assessment_photos table might not exist yet
-- If it exists, run these inserts:
-- INSERT INTO assessment_photos (
--   id,
--   assessment_id,
--   photo_type,
--   file_url,
--   uploaded_at
-- ) VALUES
-- (
--   gen_random_uuid(),
--   '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
--   'Ceiling - Before',
--   'https://placehold.co/600x400/blue/white?text=Ceiling+Before',
--   NOW()
-- ),
-- (
--   gen_random_uuid(),
--   '9bc09bb8-c81e-4523-a2b8-0e2901975a8d',
--   'Underfloor - Before',
--   'https://placehold.co/600x400/gray/white?text=Underfloor+Before',
--   NOW()
-- );
