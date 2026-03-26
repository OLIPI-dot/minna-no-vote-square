
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearchDetail() {
  const q = 'カツヒコ';
  const { data } = await supabase.from('surveys').select('*').or(`title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{"${q}"}`);
  
  if (data && data.length > 0) {
    console.log('Survey Found:', {
      id: data[0].id,
      title: data[0].title,
      visibility: data[0].visibility,
      is_official: data[0].is_official,
      category: data[0].category,
      created_at: data[0].created_at
    });
  } else {
    console.log('No survey found for:', q);
  }
}

testSearchDetail();
