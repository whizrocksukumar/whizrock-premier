const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://syyzrgybeqnyjfqealnv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q'
);

async function assignSalesReps() {
  console.log('\n=== Assigning Sales Reps from team_members ===\n');

  // Get sales reps from team_members
  const { data: salesReps, error: repsError } = await supabase
    .from('team_members')
    .select('id, first_name, last_name')
    .eq('role', 'Sales Rep');

  if (repsError || !salesReps || salesReps.length === 0) {
    console.error('Error fetching sales reps:', repsError);
    return;
  }

  console.log(`Found ${salesReps.length} sales reps in team_members:`);
  salesReps.forEach(rep => console.log(`  - ${rep.first_name} ${rep.last_name} (${rep.id})`));

  // Assign sales reps to clients (round-robin)
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name');

  console.log(`\nAssigning to ${clients?.length || 0} clients...`);

  let clientCount = 0;
  for (let i = 0; i < (clients?.length || 0); i++) {
    const client = clients[i];
    const salesRep = salesReps[i % salesReps.length];

    const { error } = await supabase
      .from('clients')
      .update({ sales_rep_id: salesRep.id })
      .eq('id', client.id);

    if (!error) {
      clientCount++;
      if (clientCount <= 10) {
        console.log(`  ✓ ${client.first_name} ${client.last_name} → ${salesRep.first_name} ${salesRep.last_name}`);
      }
    } else {
      console.error(`  ✗ Error assigning to ${client.first_name} ${client.last_name}:`, error.message);
    }
  }

  if (clientCount > 10) {
    console.log(`  ... and ${clientCount - 10} more clients`);
  }

  // Assign sales reps to companies (round-robin)
  const { data: companies } = await supabase
    .from('companies')
    .select('id, company_name');

  console.log(`\nAssigning to ${companies?.length || 0} companies...`);

  let companyCount = 0;
  for (let i = 0; i < (companies?.length || 0); i++) {
    const company = companies[i];
    const salesRep = salesReps[i % salesReps.length];

    const { error } = await supabase
      .from('companies')
      .update({ sales_rep_id: salesRep.id })
      .eq('id', company.id);

    if (!error) {
      companyCount++;
      if (companyCount <= 10) {
        console.log(`  ✓ ${company.company_name} → ${salesRep.first_name} ${salesRep.last_name}`);
      }
    } else {
      console.error(`  ✗ Error assigning to ${company.company_name}:`, error.message);
    }
  }

  if (companyCount > 10) {
    console.log(`  ... and ${companyCount - 10} more companies`);
  }

  console.log(`\n=== Done! ===`);
  console.log(`Assigned sales reps to ${clientCount} clients and ${companyCount} companies\n`);
}

assignSalesReps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
