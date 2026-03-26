const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', 265)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Full Survey Data:', JSON.stringify(data, null, 2));
  }
}

check();
