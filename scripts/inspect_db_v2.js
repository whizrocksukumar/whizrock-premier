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

        const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

        // Check both 'clients' and 'customers'
        const tables = ['clients', 'customers'];

        for (const table of tables) {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: false })
                .limit(5);

            if (error) {
                console.log(`[${table}] Error: ${error.message}`);
            } else {
                console.log(`[${table}] Count: ${data.length} (showing max 5)`);
                if (data.length > 0) {
                    console.log(`[${table}] Sample:`, JSON.stringify(data[0], null, 2));
                }
            }
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
