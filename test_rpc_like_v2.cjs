const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLikeFixed() {
  const { data: surveys } = await supabase.from('surveys').select('id, likes_count').limit(1);
  if (!surveys.length) return;

  const s = surveys[0];
  console.log(`Testing with survey_id=${s.id}, current likes=${s.likes_count}`);

  const { data, error } = await supabase.rpc('increment_survey_like', {
    survey_id: s.id,
    increment_val: 1
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success! Result:', data);
    const { data: updated } = await supabase.from('surveys').select('likes_count').eq('id', s.id).single();
    console.log(`Updated Likes: ${updated.likes_count}`);
  }
}

testLikeFixed();
