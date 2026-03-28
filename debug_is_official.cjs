
const { createClient } = require('@supabase/supabase-js');
const url = 'https://ssmkasmtdnojdicdpdfg.supabase.co';
const key = 'sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX';
const supabase = createClient(url, key);

async function check() {
  console.log('--- Checking is_official counts for "News" category ---');
  
  // 1. is_official = true
  const { count: trueCount, error: err1 } = await supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('category', 'ニュース').eq('is_official', true).eq('visibility', 'public');
  
  // 2. is_official = false
  const { data: userSurveys, error: err2 } = await supabase.from('surveys').select('*').eq('category', 'ニュース').eq('is_official', false).eq('visibility', 'public');
  console.log('User Surveys (is_official=false):', userSurveys);
  
  // 3. is_official IS NULL
  const { count: nullCount, error: err3 } = await supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('category', 'ニュース').is('is_official', null).eq('visibility', 'public');

  console.log('Official (true):', trueCount);
  console.log('User (false):', falseCount);
  console.log('Legacy (null):', nullCount);

  if (err1 || err2 || err3) {
    console.error('Errors:', { err1, err2, err3 });
  }

  // Sample check
  const { data } = await supabase.from('surveys').select('id, title, is_official').eq('category', 'ニュース').eq('visibility', 'public').limit(5);
  console.log('Sample Data:', data);
}

check();
