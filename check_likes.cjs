const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLikes() {
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, likes_count, view_count')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching surveys:', error);
    return;
  }

  console.log('Latest Surveys:');
  data.forEach(s => {
    console.log(`ID: ${s.id}, Likes: ${s.likes_count}, Views: ${s.view_count}, Title: ${s.title}`);
  });
}

checkLikes();
