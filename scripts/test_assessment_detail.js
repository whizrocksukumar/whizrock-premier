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

        // Get first assessment ID
        const { data: assessments } = await supabase
            .from('assessments')
            .select('id, reference_number')
            .limit(1);

        if (!assessments || assessments.length === 0) {
            console.log('No assessments found');
            return;
        }

        const testId = assessments[0].id;
        console.log(`\nTesting with: ${assessments[0].reference_number} (ID: ${testId})\n`);

        // Test the exact query from the detail page
        const { data, error } = await supabase
            .from('assessments')
            .select(`
                id,
                reference_number,
                customer_name,
                customer_email,
                customer_phone,
                customer_company,
                site_address,
                city,
                region_id,
                postcode,
                scheduled_date,
                scheduled_time,
                status,
                notes,
                created_at,
                assigned_installer_id,
                enquiry_id,
                team_members!assigned_installer_id (
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('id', testId)
            .single();

        if (error) {
            console.error('❌ Error:', error);
        } else {
            console.log('✅ Query successful!');
            console.log('\nData structure:');
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
