require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSalesReps() {
  console.log('🔍 Checking Sales Reps in team_members...\n');

  // Check all team members
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('id, first_name, last_name, role');

  console.log('All Team Members:');
  console.log('==================');
  allMembers.forEach(member => {
    console.log(`ID: ${member.id}`);
    console.log(`Name: ${member.first_name} ${member.last_name}`);
    console.log(`Role: ${member.role}`);
    console.log('');
  });

  // Check sales reps specifically
  const { data: salesReps } = await supabase
    .from('team_members')
    .select('id, first_name, last_name, role')
    .eq('role', 'Sales Rep');

  console.log('\nSales Reps (role = "Sales Rep"):');
  console.log('=================================');
  if (salesReps && salesReps.length > 0) {
    salesReps.forEach(rep => {
      console.log(`ID: ${rep.id}`);
      console.log(`Name: ${rep.first_name} ${rep.last_name}`);
      console.log('');
    });
  } else {
    console.log('❌ NO SALES REPS FOUND with role = "Sales Rep"');
  }

  // Check sample quote sales rep IDs
  const sampleIds = [
    '672361a3-6079-4073-9253-90af5d5d619e',
    '43b3077a-a95a-4bc1-bb8c-f6236cb96979',
    'c58f953e-b1ec-46ed-85ab-25e22eb6708b'
  ];

  console.log('\nChecking Sample Quote Sales Rep IDs:');
  console.log('=====================================');
  for (const id of sampleIds) {
    const { data: member } = await supabase
      .from('team_members')
      .select('id, first_name, last_name, role')
      .eq('id', id)
      .single();

    if (member) {
      console.log(`✅ Found: ${member.first_name} ${member.last_name} (${member.role})`);
    } else {
      console.log(`❌ NOT FOUND: ${id}`);
    }
  }

  process.exit(0);
}

checkSalesReps();
