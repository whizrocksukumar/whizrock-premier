require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get the assessment from the screenshot
    const assessmentId = '74046550-d334-4a03-b9d3-878acb892415';

    const { data: assessment, error: assError } = await supabase
      .from('assessments')
      .select('id, reference_number, client_id, opportunity_id')
      .eq('id', assessmentId)
      .single();

    if (assError || !assessment) {
      console.error('Assessment not found:', assError);
      return;
    }

    console.log(`Assessment: ${assessment.reference_number}`);
    console.log(`Client ID: ${assessment.client_id}`);
    console.log(`Current opportunity_id: ${assessment.opportunity_id || 'NULL'}`);

    // Find or create an opportunity for this client
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, opp_number, status, client_id')
      .eq('client_id', assessment.client_id)
      .limit(1);

    if (oppError) {
      console.error('Error fetching opportunities:', oppError);
      return;
    }

    let opportunityId;

    if (opportunities && opportunities.length > 0) {
      // Use existing opportunity
      opportunityId = opportunities[0].id;
      console.log(`\nFound existing opportunity: ${opportunities[0].opp_number}`);
    } else {
      // Create a new opportunity for this client
      console.log('\nNo opportunity found. Creating new opportunity...');

      const { data: client } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_id')
        .eq('id', assessment.client_id)
        .single();

      const { data: newOpp, error: createError } = await supabase
        .from('opportunities')
        .insert({
          client_id: assessment.client_id,
          company_id: client.company_id,
          status: 'Assessment Scheduled',
          source: 'Direct',
          product_interest: 'Insulation Assessment',
          notes: `Auto-created for assessment ${assessment.reference_number}`,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating opportunity:', createError);
        return;
      }

      opportunityId = newOpp.id;
      console.log(`✓ Created opportunity: ${newOpp.opp_number}`);
    }

    // Link the assessment to the opportunity
    console.log('\nLinking assessment to opportunity...');
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ opportunity_id: opportunityId })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return;
    }

    console.log('✓ Assessment linked to opportunity successfully!');
    console.log('\nYou can now click "Mark Complete & Notify VA" button.');

  } catch (error) {
    console.error('Error:', error);
  }
})();
