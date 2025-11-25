
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) { console.log('No .env.local'); return; }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
        });

        const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
        const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase URL or Key');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Checking quotes table structure...');

        const { data: quotes, error: quotesError } = await supabase
            .from('quotes')
            .select('*')
            .limit(1);

        if (quotesError) {
            console.error('Error checking quotes table:', quotesError.message);
        } else {
            console.log('quotes table exists.');
            if (quotes && quotes.length > 0) {
                console.log('Quote columns:', Object.keys(quotes[0]));
                console.log('Sample quote:', JSON.stringify(quotes[0], null, 2));
            } else {
                console.log('quotes table is empty. Cannot inspect columns via select.');
                // Try to insert a dummy quote to see columns? No, that's risky.
            }
        }

        // List all tables? Not easy with supabase-js client without rpc.

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
