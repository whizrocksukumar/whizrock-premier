const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://syyzrgybeqnyjfqealnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCertificate() {
  console.log('Creating test certificate...\n');

  try {
    // Find a completed job
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, job_number, completion_date, status')
      .eq('status', 'Completed')
      .not('completion_date', 'is', null)
      .limit(1);

    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      console.log('❌ No completed jobs found. Please complete a job first.');
      console.log('   You can manually set a job status to "Completed" in Supabase.');
      return;
    }

    const job = jobs[0];
    console.log(`Found completed job: ${job.job_number}`);

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('job_completion_certificates')
      .select('certificate_number')
      .eq('job_id', job.id)
      .single();

    if (existingCert) {
      console.log(`⚠️  Certificate already exists: ${existingCert.certificate_number}`);
      return;
    }

    // Generate certificate number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('job_completion_certificates')
      .select('*', { count: 'exact', head: true });

    const certNumber = `CERT-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Calculate warranty end date (5 years from completion)
    const completionDate = new Date(job.completion_date);
    const warrantyEndDate = new Date(completionDate);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 5);

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from('job_completion_certificates')
      .insert({
        job_id: job.id,
        certificate_number: certNumber,
        issued_date: new Date().toISOString(),
        installer_signature_name: 'James Thompson',
        installer_signature_date: job.completion_date,
        warranty_start_date: job.completion_date,
        warranty_end_date: warrantyEndDate.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (certError) throw certError;

    console.log('\n✅ Test certificate created successfully!');
    console.log(`   Certificate Number: ${certificate.certificate_number}`);
    console.log(`   Job: ${job.job_number}`);
    console.log(`   Issued: ${new Date(certificate.issued_date).toLocaleDateString()}`);
    console.log('');
    console.log('📋 View it:');
    console.log(`   - Jobs list: http://localhost:3000/jobs`);
    console.log(`   - Certificate: http://localhost:3000/jobs/${job.id}/certificate`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestCertificate();
