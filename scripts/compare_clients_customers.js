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

        console.log('\n=== CHECKING CLIENTS TABLE ===\n');
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .limit(5);

        if (clientError) {
            console.log('Error:', clientError.message);
        } else {
            console.log(`Records: ${clients.length}`);
            if (clients.length > 0) {
                console.log('Columns:', Object.keys(clients[0]));
                console.log('Sample:', clients[0]);
            } else {
                console.log('No data in clients table');
            }
        }

        console.log('\n=== CHECKING CUSTOMERS TABLE ===\n');
        const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('*')
            .limit(5);

        if (custError) {
            console.log('Error:', custError.message);
        } else {
            console.log(`Records: ${customers ? customers.length : 0}`);
            if (customers && customers.length > 0) {
                console.log('Columns:', Object.keys(customers[0]));
                console.log('Sample:', customers[0]);
            } else {
                console.log('No data in customers table');
            }
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
