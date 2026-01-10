require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get Maria Garcia (VA user)
    const { data: va, error: vaError } = await supabase
      .from('team_members')
      .select('email, first_name, last_name, id, role')
      .eq('first_name', 'Maria')
      .eq('last_name', 'Garcia')
      .single();

    if (vaError || !va) {
      console.error('VA user Maria Garcia not found:', vaError);
      return;
    }

    console.log(`Found VA: ${va.first_name} ${va.last_name} (${va.email})`);

    // Get some assessments
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        status,
        client_id,
        site_id,
        notes,
        opportunity_id,
        clients!client_id (
          first_name,
          last_name,
          email,
          company_id,
          companies!company_id (
            company_name
          )
        )
      `)
      .limit(3);

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      return;
    }

    console.log(`\nFound ${assessments.length} assessments. Creating tasks...\n`);

    // Create tasks for each assessment
    for (const assessment of assessments) {
      // Skip if no opportunity_id (required field)
      if (!assessment.opportunity_id) {
        console.log(`Skipping assessment ${assessment.reference_number} - no opportunity linked\n`);
        continue;
      }

      const clientName = assessment.clients
        ? `${assessment.clients.first_name} ${assessment.clients.last_name}`
        : 'Unknown Client';

      const companyName = assessment.clients?.companies?.company_name || '';

      // Create task directly linked to assessment
      const { data: task, error: taskError} = await supabase
        .from('tasks')
        .insert({
          task_description: `Create Recommendation - ${clientName}`,
          task_type: 'Create Recommendation',
          assigned_to_user_id: va.id,
          opportunity_id: assessment.opportunity_id,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'High',
          status: 'Not Started',
          completion_percent: 0,
          notes: `Assessment: ${assessment.reference_number}\nClient: ${clientName}\nCompany: ${companyName}\nAssessment ID: ${assessment.id}`
        })
        .select()
        .single();

      if (taskError) {
        console.error(`Error creating task for ${clientName}:`, taskError);
        continue;
      }

      console.log(`✓ Created task: "Create Recommendation - ${clientName}"`);
      console.log(`  Assessment: ${assessment.reference_number}`);
      console.log(`  Company: ${companyName || 'N/A'}`);
      console.log(`  Task ID: ${task.id}\n`);
    }

    console.log('Done! Refresh the VA workspace page to see the new tasks.');

  } catch (error) {
    console.error('Error:', error);
  }
})();
