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

        const tables = ['product_recommendations', 'recommendation_sections', 'recommendation_items', 'products', 'app_types'];

        console.log('--- Checking Tables ---');
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`[${table}] ❌ Not Found or Error: ${error.message}`);
            } else {
                console.log(`[${table}] ✅ Exists (Count: ${data?.length ?? 'Unknown'})`);
            }
        }
        console.log('-----------------------');

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
