require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateQuoteRelationships() {
  try {
    console.log('🔍 Starting to populate quote relationships...\n');

    // STEP 1: Get regions to map cities
    const { data: regions } = await supabase
      .from('regions')
      .select('*');

    const regionMap = {
      'Auckland': regions.find(r => r.name === 'Auckland City')?.id,
      'Hamilton': regions.find(r => r.name === 'Waikato')?.id || regions[0]?.id, // Fallback to first region
      'Wellington': regions.find(r => r.name === 'Wellington')?.id || regions[1]?.id,
      'Christchurch': regions.find(r => r.name === 'Canterbury')?.id || regions[2]?.id,
    };

    console.log('📍 Region mapping:', regionMap);

    // STEP 2: Update sites with region_id based on city
    console.log('\n📝 Updating sites with regions...');
    const { data: sites } = await supabase
      .from('sites')
      .select('id, city, region_id');

    let sitesUpdated = 0;
    for (const site of sites) {
      if (!site.region_id && site.city) {
        const regionId = regionMap[site.city] || regionMap['Auckland']; // Default to Auckland

        const { error } = await supabase
          .from('sites')
          .update({ region_id: regionId })
          .eq('id', site.id);

        if (!error) {
          console.log(`  ✅ Updated site in ${site.city} with region`);
          sitesUpdated++;
        }
      }
    }
    console.log(`✅ Updated ${sitesUpdated} sites with regions\n`);

    // STEP 3: Get sales reps to assign to quotes
    const { data: salesReps } = await supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('role', 'Sales Rep')
      .limit(3);

    if (!salesReps || salesReps.length === 0) {
      console.log('❌ No sales reps found. Please add sales reps first.');
      return;
    }

    console.log(`📞 Found ${salesReps.length} sales reps:`, salesReps.map(r => `${r.first_name} ${r.last_name}`).join(', '));

    // STEP 4: Update quotes with sales rep (rotate through available reps)
    console.log('\n📝 Assigning sales reps to quotes...');
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, assigned_to_sales_rep_id')
      .is('assigned_to_sales_rep_id', null)
      .limit(20);

    let quotesUpdated = 0;
    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      const salesRep = salesReps[i % salesReps.length]; // Rotate through sales reps

      const { error } = await supabase
        .from('quotes')
        .update({ assigned_to_sales_rep_id: salesRep.id })
        .eq('id', quote.id);

      if (!error) {
        console.log(`  ✅ Assigned ${salesRep.first_name} ${salesRep.last_name} to ${quote.quote_number}`);
        quotesUpdated++;
      }
    }
    console.log(`✅ Updated ${quotesUpdated} quotes with sales reps\n`);

    // STEP 5: Link quotes to assessments (for those that have matching sites/clients)
    console.log('\n📝 Linking quotes to assessments...');
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, site_id, client_id, reference_number');

    const { data: allQuotes } = await supabase
      .from('quotes')
      .select('id, quote_number, site_id, client_id, assessment_id')
      .is('assessment_id', null);

    let quotesLinked = 0;
    for (const quote of allQuotes) {
      // Find matching assessment by site_id or client_id
      const matchingAssessment = assessments.find(
        a => a.site_id === quote.site_id || a.client_id === quote.client_id
      );

      if (matchingAssessment) {
        const { error } = await supabase
          .from('quotes')
          .update({ assessment_id: matchingAssessment.id })
          .eq('id', quote.id);

        if (!error) {
          console.log(`  ✅ Linked ${quote.quote_number} to assessment ${matchingAssessment.reference_number}`);
          quotesLinked++;
        }
      }
    }
    console.log(`✅ Linked ${quotesLinked} quotes to assessments\n`);

    // STEP 6: Update opportunities with follow_up_date
    console.log('\n📝 Setting follow-up dates on opportunities...');
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, opp_number, follow_up_date, due_date')
      .limit(10);

    let oppsUpdated = 0;
    for (const opp of opportunities) {
      if (!opp.follow_up_date) {
        // Set follow-up date to 7 days from now
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 7);

        const { error } = await supabase
          .from('opportunities')
          .update({ follow_up_date: followUpDate.toISOString().split('T')[0] })
          .eq('id', opp.id);

        if (!error) {
          console.log(`  ✅ Set follow-up date for ${opp.opp_number}`);
          oppsUpdated++;
        }
      }
    }
    console.log(`✅ Updated ${oppsUpdated} opportunities with follow-up dates\n`);

    console.log('\n✨ Successfully populated quote relationships!');
    console.log('\nSummary:');
    console.log(`  - Sites updated with regions: ${sitesUpdated}`);
    console.log(`  - Quotes assigned sales reps: ${quotesUpdated}`);
    console.log(`  - Quotes linked to assessments: ${quotesLinked}`);
    console.log(`  - Opportunities with follow-up dates: ${oppsUpdated}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
populateQuoteRelationships()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
