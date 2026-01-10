const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://syyzrgybeqnyjfqealnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateCalendarTestData() {
  console.log('Starting calendar test data population...\n');

  try {
    // Get existing assessments and jobs
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id, reference_number, scheduled_date, status')
      .limit(10);

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
    } else {
      console.log(`Found ${assessments.length} assessments`);

      // Update assessments that don't have scheduled dates
      const assessmentsToUpdate = assessments.filter(a => !a.scheduled_date);
      console.log(`${assessmentsToUpdate.length} assessments need scheduled dates`);

      for (let i = 0; i < assessmentsToUpdate.length; i++) {
        const assessment = assessmentsToUpdate[i];
        // Create dates spread across the next 30 days
        const daysFromNow = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

        const scheduledTime = `${9 + Math.floor(Math.random() * 7)}:00:00`; // 9 AM to 4 PM

        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            scheduled_time: scheduledTime,
            status: assessment.status || 'Scheduled'
          })
          .eq('id', assessment.id);

        if (updateError) {
          console.error(`Error updating assessment ${assessment.reference_number}:`, updateError);
        } else {
          console.log(`✓ Updated ${assessment.reference_number} -> ${scheduledDate.toISOString().split('T')[0]} at ${scheduledTime}`);
        }
      }
    }

    console.log('\n---\n');

    // Get existing jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, job_number, scheduled_date, status')
      .limit(10);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
    } else {
      console.log(`Found ${jobs.length} jobs`);

      // Update jobs that don't have scheduled dates
      const jobsToUpdate = jobs.filter(j => !j.scheduled_date);
      console.log(`${jobsToUpdate.length} jobs need scheduled dates`);

      for (let i = 0; i < jobsToUpdate.length; i++) {
        const job = jobsToUpdate[i];
        // Create dates spread across the next 30 days
        const daysFromNow = Math.floor(Math.random() * 30) - 5; // -5 to +25 days
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            status: job.status || 'Scheduled'
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating job ${job.job_number}:`, updateError);
        } else {
          console.log(`✓ Updated ${job.job_number} -> ${scheduledDate.toISOString().split('T')[0]}`);
        }
      }
    }

    console.log('\n✅ Calendar test data population completed!');
    console.log('\nNow refresh your calendar page to see the events.');

  } catch (error) {
    console.error('Error:', error);
  }
}

populateCalendarTestData();
