const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testVotePersistence() {
    console.log('--- Testing Vote Persistence ---');
    const { data: opts } = await supabase.from('options').select('*').limit(1);
    if (!opts || opts.length === 0) return console.log('No options found.');

    const target = opts[0];
    const originalVotes = target.votes || 0;
    console.log(`Initial: ID ${target.id}, Votes ${originalVotes}`);

    // 1. Try RPC increment_option_vote
    console.log('Testing RPC increment_option_vote...');
    const { error: rpcErr } = await supabase.rpc('increment_option_vote', { option_id: target.id });
    if (rpcErr) {
        console.log('RPC Error:', rpcErr.message);
        
        // 2. Fallback to direct update if RPC missing
        console.log('Trying direct update...');
        const { error: updErr } = await supabase.from('options').update({ votes: originalVotes + 1 }).eq('id', target.id);
        if (updErr) {
            console.log('Direct Update Error:', updErr.message);
        } else {
            console.log('Direct Update Success!');
        }
    } else {
        console.log('RPC Success!');
    }

    // 3. Wait a bit and fetch again
    console.log('Waiting 2 seconds for sync...');
    await new Promise(r => setTimeout(r, 2000));

    const { data: verify } = await supabase.from('options').select('votes').eq('id', target.id).single();
    console.log(`After fetch: ID ${target.id}, Votes ${verify.votes}`);
    
    if (verify.votes > originalVotes) {
        console.log('CONCLUSION: Persistence works!');
    } else {
        console.log('CONCLUSION: Persistence FAILED (value reverted or update dropped).');
    }
}

testVotePersistence();
