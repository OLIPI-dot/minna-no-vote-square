require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Assuming you have access to VITE_SUPABASE_URL and KEY in .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: surveys, error: err1 } = await supabase.from('surveys').select('*').limit(5);
  console.log("Fetched surveys count:", surveys?.length, "Error:", err1);

  if (surveys && surveys.length > 0) {
    const sv = surveys[0];
    console.log("Sample Survey:", sv.title, sv.created_at);

    const { data: pData, error: pErr } = await supabase.from('surveys')
      .select('id, title, category, image_url, youtube_id, created_at')
      .eq('visibility', 'public')
      .lt('created_at', sv.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("Adjacent Prev:", pData ? pData.title : "None", pErr);
    
    // Check related surveys query emulation
    const { data: relatedBase, error: rErr } = await supabase.from('surveys')
      .select('id, title, category, tags, visibility, image_url, youtube_id, likes_count, total_votes, is_official, created_at, deadline, source_published_at', { count: 'exact' });

    console.log("Related Base Count:", relatedBase?.length, "Error:", rErr);

    if (relatedBase) {
      const related = relatedBase
        .filter(s => s.id !== sv.id && s.visibility === 'public')
        .filter(s =>
          s.category === sv.category ||
          s.tags?.some(t => sv.tags?.includes(t))
        )
        .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
        .slice(0, 12);
      console.log("Filtered Related Count:", related.length);
    }
  }
}

check();
