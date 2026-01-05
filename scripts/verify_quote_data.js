require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyQuoteData() {
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      quote_number,
      assigned_to_sales_rep_id,
      sites!site_id (
        address_line_1,
        city,
        regions!region_id (
          name
        )
      ),
      assessments!assessment_id (
        reference_number,
        opportunities!opportunity_id (
          follow_up_date,
          due_date
        )
      )
    `)
    .limit(5);

  console.log('Sample Quote Data with Relationships:');
  console.log('=====================================\n');

  quotes.forEach(quote => {
    console.log(`Quote: ${quote.quote_number}`);
    console.log(`  Sales Rep ID: ${quote.assigned_to_sales_rep_id || 'None'}`);
    console.log(`  Site Address: ${quote.sites?.address_line_1 || 'N/A'}, ${quote.sites?.city || 'N/A'}`);
    console.log(`  Region: ${quote.sites?.regions?.name || 'N/A'}`);
    console.log(`  Linked Assessment: ${quote.assessments?.reference_number || 'None'}`);
    console.log(`  Follow-up Date: ${quote.assessments?.opportunities?.follow_up_date || quote.assessments?.opportunities?.due_date || 'N/A'}`);
    console.log('');
  });

  process.exit(0);
}

verifyQuoteData();
