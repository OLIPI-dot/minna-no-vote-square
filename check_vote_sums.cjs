const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: surveys } = await supabase.from('surveys').select('id, title').order('id', { ascending: false }).limit(5);
  for (const s of surveys) {
    const { data: opts } = await supabase.from('options').select('votes').eq('survey_id', s.id);
    const sum = opts ? opts.reduce((acc, o) => acc + (o.votes || 0), 0) : 0;
    console.log(`Survey [${s.id}] "${s.title}": SUM=${sum} (${opts?.length} options)`);
  }
}
check();
