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

        // Check both customers and clients tables
        console.log('\n=== CHECKING CUSTOMERS TABLE ===\n');
        const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (custError) {
            console.log('Customers table error:', custError.message);
        } else {
            console.table(customers.map(c => ({
                'Name': `${c.first_name} ${c.last_name}`,
                'Company': c.company || '(null)',
                'Email': c.email,
                'Phone': c.phone
            })));
            console.log(`Total customers: ${customers.length}`);
        }

        console.log('\n=== CHECKING CLIENTS TABLE ===\n');
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (clientError) {
            console.log('Clients table error:', clientError.message);
        } else {
            console.table(clients.map(c => ({
                'Name': c.name,
                'Company': c.company || '(null)',
                'Email': c.email,
                'Phone': c.phone
            })));
            console.log(`Total clients: ${clients.length}`);
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
