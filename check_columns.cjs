const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const main = async () => {
    // 1. カラム一覧を確認
    const { data: cols, error: colErr } = await supabase.rpc('list_columns', { table_name: 'surveys' });
    // もし list_columns がない場合は select で確認
    if (colErr) {
        console.log('list_columns rpc failed, trying direct select with limit 0');
        const { data: testData, error: testErr } = await supabase.from('surveys').select('*').limit(1);
        if (testData && testData.length > 0) {
            console.log('Available columns in surveys:', Object.keys(testData[0]));
        }
    } else {
        console.log('Columns in surveys:', cols);
    }

    // 2. 権限を確認（自分自身で叩いてみて、特定のカラムが抜けてないか）
    const { data: raw, error: rawErr } = await supabase.from('surveys').select('id, likes_count').eq('id', 158).single();
    if (rawErr) {
        console.error('❌ Direct select of likes_count failed:', rawErr);
    } else {
        console.log('✅ Direct select of likes_count success:', raw);
    }
};

main();
