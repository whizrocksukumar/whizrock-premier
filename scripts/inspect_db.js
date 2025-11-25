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

        // Try to list tables via RPC if available (custom function) or information_schema
        // Note: This usually fails for anon, but we try.
        /*
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_schema', 'public');
        
        if (!schemaError && schemaData) {
            console.log('Found tables via information_schema:', schemaData.map(t => t.table_name).join(', '));
        } else {
            console.log('Could not list tables via information_schema (expected).');
        }
        */

        // Known/Guessed tables
        const tables = ['quotes', 'clients', 'customers', 'quote_items', 'products', 'services', 'users', 'profiles'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    // console.log(`[${table}] Error: ${error.message}`);
                } else {
                    if (data && data.length > 0) {
                        console.log(`[${table}] FOUND. Columns: ${Object.keys(data[0]).join(', ')}`);
                    } else {
                        console.log(`[${table}] FOUND (Empty).`);
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
