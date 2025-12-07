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

        console.log('\n=== CHECKING ASSESSMENTS INSTALLER ASSIGNMENT ===\n');
        
        // Test simple query first
        const { data: simple, error: simpleError } = await supabase
            .from('assessments')
            .select('reference_number, assigned_installer_id')
            .limit(3);

        console.log('Simple query (just IDs):');
        console.table(simple);

        // Test with foreign key relationship
        console.log('\n=== TESTING FOREIGN KEY RELATIONSHIP ===\n');
        const { data: withFK, error: fkError } = await supabase
            .from('assessments')
            .select(`
                reference_number,
                assigned_installer_id,
                team_members!assigned_installer_id (
                    first_name,
                    last_name
                )
            `)
            .limit(3);

        if (fkError) {
            console.log('FK Query Error:', fkError);
        } else {
            console.log('FK query result:');
            console.log(JSON.stringify(withFK, null, 2));
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
