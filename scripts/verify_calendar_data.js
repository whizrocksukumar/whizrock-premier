const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://syyzrgybeqnyjfqealnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCalendarData() {
  console.log('Verifying calendar data...\n');

  try {
    // Check assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        scheduled_date,
        scheduled_time,
        status,
        clients:client_id (first_name, last_name, company_name),
        sites:site_id (address_line_1, city),
        team_members:assigned_installer_id (first_name, last_name)
      `)
      .not('scheduled_date', 'is', null);

    console.log('=== ASSESSMENTS ===');
    if (assessmentsError) {
      console.error('Error:', assessmentsError);
    } else {
      console.log(`Total assessments with scheduled dates: ${assessments.length}\n`);
      assessments.forEach(a => {
        const client = a.clients
          ? `${a.clients.first_name || ''} ${a.clients.last_name || ''}`.trim() || a.clients.company_name
          : 'No client';
        const installer = a.team_members
          ? `${a.team_members.first_name || ''} ${a.team_members.last_name || ''}`.trim()
          : 'Unassigned';

        console.log(`${a.reference_number || a.id}`);
        console.log(`  Date: ${a.scheduled_date} ${a.scheduled_time || ''}`);
        console.log(`  Client: ${client}`);
        console.log(`  Installer: ${installer}`);
        console.log(`  Status: ${a.status || 'N/A'}`);
        console.log('');
      });
    }

    // Check jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        scheduled_date,
        status,
        clients:client_id (first_name, last_name, company_name),
        sites:site_id (address_line_1, city),
        team_members:crew_lead_id (first_name, last_name)
      `)
      .not('scheduled_date', 'is', null);

    console.log('\n=== JOBS ===');
    if (jobsError) {
      console.error('Error:', jobsError);
    } else {
      console.log(`Total jobs with scheduled dates: ${jobs.length}\n`);
      jobs.forEach(j => {
        const client = j.clients
          ? `${j.clients.first_name || ''} ${j.clients.last_name || ''}`.trim() || j.clients.company_name
          : 'No client';
        const installer = j.team_members
          ? `${j.team_members.first_name || ''} ${j.team_members.last_name || ''}`.trim()
          : 'Unassigned';

        console.log(`${j.job_number || j.id}`);
        console.log(`  Date: ${j.scheduled_date}`);
        console.log(`  Client: ${client}`);
        console.log(`  Installer: ${installer}`);
        console.log(`  Status: ${j.status || 'N/A'}`);
        console.log('');
      });
    }

    console.log(`\n✅ Total events that should appear: ${(assessments?.length || 0) + (jobs?.length || 0)}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyCalendarData();
