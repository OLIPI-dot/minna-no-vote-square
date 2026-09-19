require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const page = 1;
  const ITEMS_PER_PAGE = 15;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE - 1;

  let baseQuery = supabase.from('surveys').select('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,is_official,created_at,deadline,source_published_at', { count: 'exact' });
  baseQuery = baseQuery.eq('visibility', 'public');
  // NOTE: the top page default might be official = true, let's test without it first, or try both
  
  // baseQuery = baseQuery.eq('is_official', true); 
  // Wait, let's test exactly what the user said: "公式・ニュース (353)" is displayed, meaning count worked.

  baseQuery = baseQuery.order('created_at', { ascending: false });
  baseQuery = baseQuery.range(start, end);

  console.log("Testing range:", start, "to", end);
  const { data, count, error } = await baseQuery;
  console.log('Error:', error);
  console.log('Count:', count);
  console.log('Data length:', data?.length);
  if (data?.length > 0) {
    console.log('Sample Data:', data[0].title);
  }
}
test();
