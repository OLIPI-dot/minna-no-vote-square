const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let supabaseUrl = '', serviceKey = '';
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (!k) return;
    const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = val;
});

const supabase = createClient(supabaseUrl, serviceKey);

async function createTable() {
    console.log('Creating timeline_posts table via Supabase REST...');

    // テーブルが既にあるか確認
    const { data: existing, error: checkErr } = await supabase
        .from('timeline_posts')
        .select('id')
        .limit(1);

    if (!checkErr) {
        console.log('✅ timeline_posts table already exists!');
        console.log('Existing data sample:', existing);
        return;
    }

    if (checkErr.code !== '42P01') {
        // 42P01 = テーブルが存在しないエラー。それ以外はRLSなどのエラーの可能性
        console.log('Check error:', checkErr.message, checkErr.code);
        if (checkErr.message.includes('does not exist')) {
            console.log('Table does not exist yet. Trying SQL via RPC...');
        } else {
            console.log('Table exists but may have RLS. Attempting insert test...');
        }
    }

    // SQLでテーブルを作成 (管理APIを使う)
    const createSQL = `
CREATE TABLE IF NOT EXISTS timeline_posts (
    id bigserial PRIMARY KEY,
    name text NOT NULL DEFAULT '名無しの広場民',
    avatar text NOT NULL DEFAULT '🐰',
    content text NOT NULL,
    likes integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス (最新投稿を素早く取得するため)
CREATE INDEX IF NOT EXISTS timeline_posts_created_at_idx ON timeline_posts(created_at DESC);

-- RLS設定: 全員が読める、誰でも書ける（匿名広場）
ALTER TABLE timeline_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'timeline_posts' AND policyname = 'anyone_can_read'
    ) THEN
        CREATE POLICY "anyone_can_read" ON timeline_posts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'timeline_posts' AND policyname = 'anyone_can_insert'
    ) THEN
        CREATE POLICY "anyone_can_insert" ON timeline_posts FOR INSERT WITH CHECK (
            length(content) >= 1 AND length(content) <= 100
        );
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'timeline_posts' AND policyname = 'anyone_can_update_likes'
    ) THEN
        CREATE POLICY "anyone_can_update_likes" ON timeline_posts FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_posts;
`;

    const { data, error } = await supabase.rpc('exec_sql', { sql: createSQL });

    if (error) {
        console.error('RPC error (trying direct insert instead):', error.message);

        // テーブルが存在しない場合はAPIでは作れないので手動でやってもらう案内を出す
        console.log('\n🚨 Supabaseダッシュボードで以下のSQLを実行してください:');
        console.log('='.repeat(60));
        console.log(createSQL);
        console.log('='.repeat(60));
        return;
    }

    console.log('✅ Table created successfully!', data);

    // テスト投稿
    const { data: testPost, error: insertErr } = await supabase
        .from('timeline_posts')
        .insert([{
            name: 'らび🐰',
            avatar: '🐰',
            content: '広場のタイムライン、はじまったらび〜！みんなのひとことをここで共有してね！🥕✨'
        }])
        .select();

    if (insertErr) {
        console.error('Insert error:', insertErr.message);
    } else {
        console.log('✅ Welcome post inserted:', testPost[0].id);
    }
}

createTable();
