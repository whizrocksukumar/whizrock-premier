/**
 * Script to populate quote line items for test clients
 * Clients: Aaron Alexander, Lisa Anderson, Agnes Asini, Michael Brown
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('URL:', supabaseUrl ? 'found' : 'missing');
  console.error('Key:', supabaseKey ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test client names
const TEST_CLIENTS = [
  'Aaron Alexander',
  'Lisa Anderson',
  'Agnes Asini',
  'Michael Brown'
];

// Product IDs from the CSV
const GLASSWOOL_PRODUCT_ID = 'ed0c5076-44c9-454a-9529-7cc6ba904478';
const LABOUR_PRODUCT_ID = '41691163-1454-4ee4-adf7-da5250f64b30';

async function populateQuoteItems() {
  try {
    console.log('🔍 Finding quotes for test clients...\n');

    // Get clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .in('first_name', ['Aaron', 'Lisa', 'Agnes', 'Michael']);

    if (clientError) throw clientError;

    console.log(`Found ${clients.length} test clients`);

    // Get quotes for these clients
    const clientIds = clients.map(c => c.id);
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, quote_number, client_id, status')
      .in('client_id', clientIds);

    if (quotesError) throw quotesError;

    console.log(`Found ${quotes.length} quotes for these clients\n`);

    if (quotes.length === 0) {
      console.log('❌ No quotes found for test clients. Please create quotes first.');
      return;
    }

    // For each quote, insert line items
    let successCount = 0;
    let errorCount = 0;

    for (const quote of quotes) {
      const client = clients.find(c => c.id === quote.client_id);
      const clientName = `${client.first_name} ${client.last_name}`;

      console.log(`Processing quote ${quote.quote_number} for ${clientName}...`);

      // Check if line items already exist
      const { data: existingItems } = await supabase
        .from('quote_line_items')
        .select('id')
        .eq('quote_id', quote.id);

      if (existingItems && existingItems.length > 0) {
        console.log(`  ⚠️  Quote already has ${existingItems.length} line items, skipping`);
        continue;
      }

      // Insert the two line items
      const lineItems = [
        {
          quote_id: quote.id,
          product_id: GLASSWOOL_PRODUCT_ID,
          product_code: 'PIL-006',
          description: 'Premier Glasswool 90mm R2.4 - External Walls',
          quantity: 5,
          unit: 'pack',
          unit_cost: 74.50,
          unit_price: 119.20,
          line_total: 596.00,
          sort_order: 1
        },
        {
          quote_id: quote.id,
          product_id: LABOUR_PRODUCT_ID,
          product_code: 'LABOUR',
          description: 'Labour - Installation (50m²)',
          quantity: 50,
          unit: 'm²',
          unit_cost: 1.50,
          unit_price: 3.00,
          line_total: 150.00,
          sort_order: 2
        }
      ];

      const { error: insertError } = await supabase
        .from('quote_line_items')
        .insert(lineItems);

      if (insertError) {
        console.log(`  ❌ Error: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Added 2 line items (Total: $746.00)`);
        successCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully populated ${successCount} quotes`);
    if (errorCount > 0) {
      console.log(`❌ Failed to populate ${errorCount} quotes`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateQuoteItems();
