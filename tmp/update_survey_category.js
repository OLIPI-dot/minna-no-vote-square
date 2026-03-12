import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env ファイルの読み込み（Viteのパスに合わせる）
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in .env')
  process.exit(1)
}

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
