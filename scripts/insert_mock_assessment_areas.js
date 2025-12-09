const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function insertMockAssessmentAreas() {
  const assessmentId = '9bc09bb8-c81e-4523-a2b8-0e2901975a8d'

  console.log('Inserting mock assessment areas...')

  const areas = [
    {
      assessment_id: assessmentId,
      area_name: 'Ceiling - Main House',
      square_metres: 85.5,
      existing_insulation_type: 'R2.0 Polyester',
      result_type: 'Pending',
      sort_order: 1
    },
    {
      assessment_id: assessmentId,
      area_name: 'Underfloor - Living Area',
      square_metres: 45.2,
      existing_insulation_type: 'None',
      result_type: 'Pending',
      sort_order: 2
    },
    {
      assessment_id: assessmentId,
      area_name: 'Garage Ceiling',
      square_metres: 22.0,
      existing_insulation_type: 'R1.5 Glasswool',
      result_type: 'Pending',
      sort_order: 3
    }
  ]

  const { data, error } = await supabase
    .from('assessment_areas')
    .insert(areas)
    .select()

  if (error) {
    console.error('Error inserting assessment areas:', error)
    return
  }

  console.log('✓ Successfully inserted', data.length, 'assessment areas')
  console.log('Areas:', data.map(a => a.area_name).join(', '))

  // Try to insert photos (table might not exist)
  console.log('\nAttempting to insert mock photos...')
  
  const photos = [
    {
      assessment_id: assessmentId,
      photo_type: 'Ceiling - Before',
      file_url: 'https://placehold.co/600x400/0066CC/white?text=Ceiling+Before',
      uploaded_at: new Date().toISOString()
    },
    {
      assessment_id: assessmentId,
      photo_type: 'Underfloor - Before',
      file_url: 'https://placehold.co/600x400/gray/white?text=Underfloor+Before',
      uploaded_at: new Date().toISOString()
    },
    {
      assessment_id: assessmentId,
      photo_type: 'Garage - Before',
      file_url: 'https://placehold.co/600x400/orange/white?text=Garage+Before',
      uploaded_at: new Date().toISOString()
    },
    {
      assessment_id: assessmentId,
      photo_type: 'Site Overview',
      file_url: 'https://placehold.co/600x400/green/white?text=Site+Overview',
      uploaded_at: new Date().toISOString()
    }
  ]

  const { data: photoData, error: photoError } = await supabase
    .from('assessment_photos')
    .insert(photos)
    .select()

  if (photoError) {
    console.error('✗ Photos table might not exist:', photoError.message)
    console.log('  (This is OK - photos section will just be hidden)')
  } else {
    console.log('✓ Successfully inserted', photoData.length, 'photos')
    console.log('Photos:', photoData.map(p => p.photo_type).join(', '))
  }

  console.log('\n✓ Done! Refresh the assessment detail page to see the areas.')
}

insertMockAssessmentAreas()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
