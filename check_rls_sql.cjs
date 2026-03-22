const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const main = async () => {
    // 1. pg_policies を見る。RPCが許可されていれば見れるはず。
    console.log('--- Checking RLS Policies via SQL query ---');
    const { data: policies, error } = await supabase.from('surveys').select('id').limit(1); // 直接は見れないので、推量
    
    // 2. 権限不足で0が返っているかテスト
    // もし anon で `select('likes_count')` して 4 が返るなら、ポリシーはOK。
    // もし authenticated で 0 が返るなら、authenticated 用のポリシーが壊れている。
    
    // 3. カラムの DEFAULT 値を確認
    // likes_count のデフォルトが null になっていて、null + 1 = null になっている可能性。
    const { data: colInfo, error: err2 } = await supabase.rpc('get_column_details', { t_name: 'surveys', c_name: 'likes_count' });
    console.log('Column details:', colInfo || err2);
};

main();
