const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        // Load environment variables
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) { 
            console.log('❌ No .env.local file found'); 
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
            env['SUPABASE_SERVICE_ROLE_KEY']  // Use service role for DDL operations
        );

        console.log('🚀 Running migration: Add customer_company to assessments...\n');

        // Read the migration file
        const migrationPath = path.resolve(__dirname, '../supabase/migrations/20251206_add_company_to_assessments.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql: migrationSQL 
        }).single();

        if (error) {
            console.error('❌ Migration failed:', error);
            
            // Try direct approach
            console.log('\nTrying direct SQL execution...\n');
            const { error: directError } = await supabase
                .from('assessments')
                .select('customer_company')
                .limit(1);
                
            if (directError && directError.code === '42703') {
                console.log('Column does not exist, adding it directly...');
                
                // Use raw SQL
                const sql = `
                    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS customer_company TEXT;
                    CREATE INDEX IF NOT EXISTS idx_assessments_customer_company 
                    ON assessments(customer_company) WHERE customer_company IS NOT NULL;
                `;
                
                console.log('Please run this SQL in Supabase SQL Editor:');
                console.log('=====================================');
                console.log(sql);
                console.log('=====================================');
            }
        } else {
            console.log('✅ Migration completed successfully!');
            console.log(data);
        }

    } catch (err) {
        console.error('❌ Script error:', err);
    }
}

runMigration();
