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

        const table = 'assessment_areas';
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`[${table}] Error: ${error.message}`);
        } else {
            console.log(`[${table}] FOUND. Columns: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'Table empty, could not determine columns via select'}`);

            const { count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            console.log(`[${table}] Total count: ${count}`);
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
