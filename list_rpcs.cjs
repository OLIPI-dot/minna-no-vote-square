const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listFunctions() {
  const { data, error } = await supabase.rpc('inspect_functions'); // I hope this exists from previous sessions
  if (error) {
     // Try direct query if possible, but usually rpc is safer if we have an inspector
     console.error('RPC Error:', error);
     
     // Fallback: try to just check common names
     const names = ['increment_survey_view', 'increment_survey_like', 'increment_survey_likes', 'add_like'];
     for (const name of names) {
       const { error: e } = await supabase.rpc(name, { row_id: 1 }); // dummy call
       console.log(`Testing ${name}: ${e ? e.message : 'SUCCESS'}`);
     }
  } else {
    console.log('Functions:', data);
  }
}

listFunctions();
