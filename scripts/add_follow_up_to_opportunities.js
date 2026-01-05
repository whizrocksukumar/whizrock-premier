const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://syyzrgybeqnyjfqealnv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q'
);

async function checkAndUpdateOpportunities() {
  console.log('\n=== Checking Opportunities Table ===\n');

  // Check if follow_up_date column exists by trying to query it
  const { data: testData, error: testError } = await supabase
    .from('opportunities')
    .select('id, follow_up_date')
    .limit(1);

  if (testError) {
    if (testError.message.includes('follow_up_date')) {
      console.log('❌ follow_up_date column does not exist');
      console.log('\nPlease run this SQL migration in Supabase SQL Editor:');
      console.log('\n-------- SQL MIGRATION --------');
      console.log('ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS follow_up_date DATE;');
      console.log('-------------------------------\n');
    } else {
      console.error('Error:', testError);
    }
    return;
  }

  console.log('✓ follow_up_date column exists');

  // Check sample data
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, opp_number, follow_up_date, region_id, sales_rep_id')
    .limit(5);

  if (error) {
    console.error('Error fetching opportunities:', error);
    return;
  }

  console.log('\nSample opportunities:');
  opportunities.forEach(opp => {
    console.log(`  ${opp.opp_number}:`);
    console.log(`    - follow_up_date: ${opp.follow_up_date || 'NULL'}`);
    console.log(`    - region_id: ${opp.region_id || 'NULL'}`);
    console.log(`    - sales_rep_id: ${opp.sales_rep_id || 'NULL'}`);
  });

  // Count stats
  const { count: total } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  const { count: withFollowUp } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .not('follow_up_date', 'is', null);

  const { count: withRegion } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .not('region_id', 'is', null);

  console.log(`\n=== Statistics ===`);
  console.log(`Total opportunities: ${total}`);
  console.log(`With follow_up_date: ${withFollowUp}`);
  console.log(`With region_id: ${withRegion}`);
  console.log(`Without region_id: ${total - withRegion}`);
}

checkAndUpdateOpportunities()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
