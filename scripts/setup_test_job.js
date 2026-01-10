const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://syyzrgybeqnyjfqealnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestData() {
  // Get first job
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, job_number, status')
    .limit(1);

  if (!jobs || jobs.length === 0) {
    console.log('No jobs found to test with.');
    return;
  }

  const job = jobs[0];
  console.log(`Updating ${job.job_number} to Completed status...`);

  // Update to completed
  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'Completed',
      completion_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', job.id);

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Job updated successfully!');
    console.log('Now run: node scripts/create_test_certificate.js');
  }
}

setupTestData();
