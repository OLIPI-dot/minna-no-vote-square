import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssmkasmtdnojdicdpdfg.supabase.co'
const supabaseAnonKey = 'sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX' // 一時的にこちらを使用

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateSurveyCategory() {
  console.log('Updating survey 179 category to 音楽...')
  const { data, error } = await supabase
    .from('surveys')
    .update({ category: '音楽' })
    .eq('id', 179)
    .select()

  if (error) {
    console.error('Error updating category:', error)
  } else {
    console.log('Successfully updated category:', data)
  }
}

updateSurveyCategory()
