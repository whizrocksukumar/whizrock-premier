const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getSchema() {
  const tables = ['quotes', 'quote_sections', 'quote_line_items'];
  let output = 'TABLE,COLUMN,DATA_TYPE,IS_NULLABLE,COLUMN_DEFAULT\n';

  for (const table of tables) {
    // Query each table to see what columns exist
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error querying ${table}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        output += `${table},${col},unknown,unknown,unknown\n`;
      });
    } else {
      console.log(`${table}: No data to infer columns`);
    }
  }

  fs.writeFileSync('scripts/schema_output.csv', output);
  console.log('Schema exported to scripts/schema_output.csv');
  console.log('\nPLEASE run the SQL queries in check_schema.sql in Supabase SQL Editor for accurate schema info');
}

getSchema();
