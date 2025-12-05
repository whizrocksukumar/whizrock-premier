const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

async function fetchExistingData() {
  console.log('=== FETCHING EXISTING DATA ===\n');

  // Fetch customers
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone')
    .limit(10);
  
  console.log('CUSTOMERS:', JSON.stringify(customers, null, 2));
  if (custError) console.log('Customer Error:', custError);

  // Fetch team members
  const { data: team, error: teamError } = await supabase
    .from('team_members')
    .select('id, name, role')
    .eq('role', 'Installer');
  
  console.log('\nTEAM MEMBERS (Installers):', JSON.stringify(team, null, 2));
  if (teamError) console.log('Team Error:', teamError);

  // Fetch products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, category, base_price')
    .limit(10);
  
  console.log('\nPRODUCTS:', JSON.stringify(products, null, 2));
  if (prodError) console.log('Product Error:', prodError);

  // Fetch regions
  const { data: regions, error: regError } = await supabase
    .from('regions')
    .select('id, name, code');
  
  console.log('\nREGIONS:', JSON.stringify(regions, null, 2));
  if (regError) console.log('Region Error:', regError);
}

fetchExistingData();
