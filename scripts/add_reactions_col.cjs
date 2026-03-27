const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupReactions() {
  console.log("🚀 Starting database setup for reactions...");

  // Note: Standard Supabase JS Client cannot run arbitrary DDL (Data Definition Language)
  // unless there is an 'exec_sql' RPC.
  // We will check if we can add it or if we can use another way.
  
  // Try to use a hypothetical 'exec_sql' RPC if it exists.
  const sql = `
    ALTER TABLE IF EXISTS surveys ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';
    
    CREATE OR REPLACE FUNCTION increment_survey_stamp(survey_id_arg BIGINT, stamp_id_arg TEXT)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      current_reactions JSONB;
      new_count INT;
    BEGIN
      SELECT reactions INTO current_reactions FROM surveys WHERE id = survey_id_arg;
      IF current_reactions IS NULL THEN
        current_reactions := '{}'::JSONB;
      END IF;
      
      new_count := COALESCE((current_reactions->>stamp_id_arg)::INT, 0) + 1;
      current_reactions := current_reactions || jsonb_build_object(stamp_id_arg, new_count);
      
      UPDATE surveys SET reactions = current_reactions WHERE id = survey_id_arg;
      RETURN current_reactions;
    END;
    $$;
  `;

  console.log("📡 Attempting to run migration via RPC...");
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error("❌ Migration failed:", error);
    console.log("💡 If this failed, I might need to ask the user to run SQL manually or find another way.");
  } else {
    console.log("✅ Migration successful!", data);
  }
}

setupReactions();
