const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.log('No .env.local found');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                env[key] = value;
            }
        });

        const url = env['NEXT_PUBLIC_SUPABASE_URL'];
        const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

        if (!url || !key) {
            console.log('Missing credentials');
            return;
        }

        const supabase = createClient(url, key);

        const tables = ['recommendation_sections', 'recommendation_calculation_lines'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`[${table}] Error: ${error.message}`);
                } else {
                    if (data && data.length > 0) {
                        console.log(`[${table}] FOUND. Columns: ${Object.keys(data[0]).join(', ')}`);
                    } else {
                        // If empty, we can't see columns easily with just select *. 
                        // But usually we can infer if we try to insert dummy data and fail, or just assume standard schema.
                        // Actually, if it's empty, we can't see keys. 
                        // Let's try to select a non-existent column to force an error that MIGHT list columns, 
                        // or just rely on what we see.
                        console.log(`[${table}] FOUND (Empty). Cannot list columns from empty table via client.`);
                    }
                }
            } catch (e) {
                console.log(`[${table}] Exception: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
