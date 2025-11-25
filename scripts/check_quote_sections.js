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

        console.log('--- Checking quote_sections Columns ---');
        const { data, error } = await supabase
            .from('quote_sections')
            .select('*')
            .limit(1);

        if (error) {
            console.log(`Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            // If no data, we can't easily see columns with simple select, 
            // but we can try to insert a dummy to get an error or just assume based on previous knowledge.
            // Or better, use a specific RPC if available, but here we'll just try to see if we get an empty array which implies table exists.
            console.log('Table exists but is empty. Cannot infer columns from data.');
        }
        console.log('---------------------------------------');

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
