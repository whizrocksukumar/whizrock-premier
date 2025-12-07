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

        console.log('\n=== TESTING EXACT QUERY FROM ASSESSMENTS PAGE ===\n');
        
        const { data, error } = await supabase
            .from('assessments')
            .select(`
                id,
                reference_number,
                customer_name,
                customer_company,
                site_address,
                scheduled_date,
                scheduled_time,
                status,
                assigned_installer_id,
                team_members!assigned_installer_id (
                    first_name,
                    last_name
                )
            `)
            .neq('status', 'Deleted')
            .order('scheduled_date', { ascending: false })
            .limit(3);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Raw data from query:');
            console.log(JSON.stringify(data, null, 2));
            
            console.log('\n=== CHECKING team_members STRUCTURE ===\n');
            data.forEach(assessment => {
                console.log(`${assessment.reference_number}:`);
                console.log(`  - assigned_installer_id: ${assessment.assigned_installer_id}`);
                console.log(`  - team_members type: ${typeof assessment.team_members}`);
                console.log(`  - team_members is array: ${Array.isArray(assessment.team_members)}`);
                console.log(`  - team_members value:`, assessment.team_members);
                if (assessment.team_members && assessment.team_members.length > 0) {
                    console.log(`  - First element:`, assessment.team_members[0]);
                }
                console.log('');
            });
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
