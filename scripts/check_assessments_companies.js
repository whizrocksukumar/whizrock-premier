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

        // Check assessments for customer_company field
        const { data: assessments, error } = await supabase
            .from('assessments')
            .select('reference_number, customer_name, customer_company')
            .order('reference_number');

        if (error) {
            console.error('Error fetching assessments:', error);
            return;
        }

        console.log('\n=== ASSESSMENTS WITH COMPANY NAMES ===\n');
        console.table(assessments.map(a => ({
            'Reference': a.reference_number,
            'Customer': a.customer_name,
            'Company': a.customer_company || '(null)'
        })));

        const withCompany = assessments.filter(a => a.customer_company);
        console.log(`\nTotal assessments: ${assessments.length}`);
        console.log(`With company names: ${withCompany.length}`);
        console.log(`Without company names: ${assessments.length - withCompany.length}`);

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
