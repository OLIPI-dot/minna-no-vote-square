const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLike() {
  const { data: surveys, error: fetchErr } = await supabase
    .from('surveys')
    .select('id, title, likes_count')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr || !surveys.length) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  const s = surveys[0];
  console.log(`Current: ID=${s.id}, Title="${s.title}", Likes=${s.likes_count}`);

  console.log('Testing RPC increment_survey_like...');
  const { data, error: rpcErr } = await supabase.rpc('increment_survey_like', { row_id: s.id });

  if (rpcErr) {
    console.error('RPC Error:', rpcErr);
  } else {
    console.log('RPC success! Result:', data);
    
    // Check updated value
    const { data: updated } = await supabase.from('surveys').select('likes_count').eq('id', s.id).single();
    console.log(`Updated Likes: ${updated.likes_count}`);
  }
}

testLike();
