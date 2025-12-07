const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) { 
            console.log('No .env.local file found'); 
            return; 
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
        });

        const supabase = createClient(
            env['NEXT_PUBLIC_SUPABASE_URL'], 
            env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
        );

        const tablesToCheck = ['assessments', 'quotes', 'jobs', 'team_members', 'enquiries', 'clients', 'customers'];

        console.log('\n=== CHECKING TABLE EXISTENCE ===\n');
        
        for (const table of tablesToCheck) {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: Does not exist (${error.code})`);
            } else {
                console.log(`✅ ${table}: Exists (${count} records)`);
            }
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
