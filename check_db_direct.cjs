const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ssmkasmtdnojdicdpdfg.supabase.co";
const supabaseAnonKey = "sb_publishable_KUDrpaeQ58xmKIo59ldZzQ_6qTg_NZX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const main = async () => {
    const surveyId = process.argv[2] ? parseInt(process.argv[2], 10) : 158;
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title, likes_count, view_count')
        .eq('id', surveyId)
        .single();

    if (error) {
        console.error('❌ Error fetching survey:', error);
        return;
    }

    console.log('✅ Survey Data:', JSON.stringify(data, null, 2));

    // RPCをテストしてみる
    console.log('🚀 Testing increment_survey_like RPC for ID:', surveyId);
    const { error: rpcErr } = await supabase.rpc('increment_survey_like', {
        survey_id: surveyId,
        increment_val: 1
    });

    if (rpcErr) {
        console.error('❌ RPC Error:', rpcErr);
    } else {
        console.log('✅ RPC Success! (Checked by current results)');
        const { data: data2 } = await supabase.from('surveys').select('likes_count').eq('id', surveyId).single();
        console.log('📉 New Likes Count:', data2.likes_count);
    }
};

main();
