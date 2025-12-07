const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
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

        console.log('\n=== CHECKING ASSESSMENTS DATA ===\n');
        const { data: assessments } = await supabase
            .from('assessments')
            .select('customer_name, customer_email, customer_phone, customer_company')
            .limit(5);

        console.table(assessments);

        console.log('\n=== CHECKING CLIENTS TABLE STRUCTURE ===\n');
        // Try to insert one test record to see what columns are required
        const testClient = {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            phone: '021-555-9999',
            status: 'Active'
        };

        const { data: insertTest, error: insertError } = await supabase
            .from('clients')
            .insert(testClient)
            .select();

        if (insertError) {
            console.log('Insert error reveals required fields:', insertError);
        } else {
            console.log('Test insert successful:', insertTest);
            
            // Delete test record
            await supabase.from('clients').delete().eq('email', 'test@example.com');
        }

        // Check current clients
        const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .limit(3);

        console.log('\n=== CURRENT CLIENTS ===\n');
        console.log(clients);

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
