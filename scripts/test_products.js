require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('Fetching first product to see structure...\n');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Product columns:');
    console.log(Object.keys(data).join(', '));

    console.log('\nSample product:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
})();
