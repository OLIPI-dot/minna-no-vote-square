import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssmkasmtdnojdicdpdfg.supabase.co'
const supabaseAnonKey = 'sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSurvey() {
  console.log('Checking survey 179...')
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, category')
    .eq('id', 179)
  
  if (error) {
    console.error('Error fetching survey:', error)
  } else {
    console.log('Found survey data:', data)
  }
}

checkSurvey()
