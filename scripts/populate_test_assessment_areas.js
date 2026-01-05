require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateTestAssessmentAreas() {
  try {
    console.log('🔍 Fetching existing assessments...');

    // Get all assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id, reference_number, status')
      .order('created_at', { ascending: false })
      .limit(5);

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
      return;
    }

    if (!assessments || assessments.length === 0) {
      console.log('❌ No assessments found. Please create some assessments first.');
      return;
    }

    console.log(`✅ Found ${assessments.length} assessments`);

    // Sample assessment areas data
    const areaTemplates = [
      {
        area_name: 'Ceiling',
        area_type: 'Ceiling',
        existing_insulation_type: 'R2.5 Glass Wool Batts',
        result_type: 'Pass',
        description: 'Existing insulation meets minimum R2.9 requirement',
        square_metres: 120
      },
      {
        area_name: 'Underfloor',
        area_type: 'Underfloor',
        existing_insulation_type: 'R1.5 Polyester',
        result_type: 'Pass',
        description: 'Existing insulation meets minimum R1.3 requirement',
        square_metres: 115
      },
      {
        area_name: 'External Walls',
        area_type: 'Walls',
        existing_insulation_type: 'None - Pre-2000 build',
        result_type: 'Pass',
        description: 'Property built before 2000 - walls exempt under RTA regulations',
        square_metres: 85
      },
      {
        area_name: 'Ground Moisture Barrier',
        area_type: 'Subfloor',
        existing_insulation_type: 'Plastic sheeting',
        result_type: 'Pass',
        description: 'Ground moisture barrier present and meets requirements',
        square_metres: 0
      }
    ];

    console.log('📝 Populating assessment areas for each assessment...');

    let totalInserted = 0;

    for (const assessment of assessments) {
      console.log(`\n  Processing: ${assessment.reference_number}`);

      // Check if this assessment already has areas
      const { data: existingAreas, error: checkError } = await supabase
        .from('assessment_areas')
        .select('id')
        .eq('assessment_id', assessment.id);

      if (checkError) {
        console.error(`    ❌ Error checking areas:`, checkError);
        continue;
      }

      if (existingAreas && existingAreas.length > 0) {
        console.log(`    ⏭️  Already has ${existingAreas.length} areas, skipping...`);
        continue;
      }

      // Insert areas for this assessment
      const areasToInsert = areaTemplates.map((template, index) => ({
        assessment_id: assessment.id,
        area_name: template.area_name,
        existing_insulation_type: template.existing_insulation_type,
        result_type: template.result_type,
        notes: template.description,
        square_metres: template.square_metres,
        sort_order: index + 1,
        recommended_r_value: template.area_type === 'Ceiling' ? 2.9 : template.area_type === 'Underfloor' ? 1.3 : null,
        removal_required: false
      }));

      const { data: insertedAreas, error: insertError } = await supabase
        .from('assessment_areas')
        .insert(areasToInsert)
        .select();

      if (insertError) {
        console.error(`    ❌ Error inserting areas:`, insertError);
        continue;
      }

      console.log(`    ✅ Inserted ${insertedAreas.length} areas`);
      totalInserted += insertedAreas.length;

      // Update assessment status to Completed if it's not already
      if (assessment.status === 'Scheduled') {
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            status: 'Completed',
            completed_date: new Date().toISOString().split('T')[0],
            completed_at: new Date().toISOString()
          })
          .eq('id', assessment.id);

        if (!updateError) {
          console.log(`    ✅ Updated status to Completed`);
        }
      }
    }

    console.log(`\n✨ Successfully populated ${totalInserted} assessment areas across ${assessments.length} assessments!`);
    console.log('\n🔗 You can now view the assessment details to see the areas populated.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
populateTestAssessmentAreas()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
