import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 📱 スマホでスリープ復帰時やモバイル回線切替時に古いソケットが固まったり、
// 期限切れJWT(401)で記事一覧・タイムラインが全滅するのを防ぐ高耐久カスタムfetch
const resilientFetch = async (input, init = {}) => {
  const urlStr = typeof input === 'string' ? input : (input?.url || String(input));
  const method = (init?.method || 'GET').toUpperCase();
  const isRestGet = urlStr.includes('/rest/v1/') && (method === 'GET' || method === 'HEAD');

  const doFetchWithTimeout = async (overrideHeaders, timeoutMs = 8500) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const mergedInit = {
        ...init,
        headers: overrideHeaders || init.headers,
        ...(controller && !init.signal ? { signal: controller.signal } : {})
      };
      return await fetch(input, mergedInit);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  try {
    const res = await doFetchWithTimeout(null, isRestGet ? 8000 : 12000);
    // 🛡️ ログイントークン期限切れ(401/403)で公開記事やタイムラインが読めなくなった場合、即座に公開キー(anon)で再取得！
    if (isRestGet && (res.status === 401 || res.status === 403)) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set('apikey', supabaseAnonKey);
      retryHeaders.set('Authorization', `Bearer ${supabaseAnonKey}`);
      return await doFetchWithTimeout(retryHeaders, 8000);
    }
    return res;
  } catch (err) {
    // 📱 スマホのバックグラウンド復帰直後の一時的な通信切断・タイムアウト時は公開キーで1回自動リトライ
    if (isRestGet) {
      await new Promise(r => setTimeout(r, 350));
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set('apikey', supabaseAnonKey);
      retryHeaders.set('Authorization', `Bearer ${supabaseAnonKey}`);
      return await doFetchWithTimeout(retryHeaders, 9000);
    }
    throw err;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 🛡️ @supabase/auth-js は `lock: false` だと falsy 判定されて navigatorLock にフォールバックし、
    // タブ切り替えやトークン更新時に 10秒デッドロック（NavigatorLockAcquireTimeoutError）を起こすため、
    // 必ず関数を渡してブラウザの Web Locks API デッドロックを完全に回避する！
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
  global: {
    fetch: resilientFetch,
  },
});

// 🚀 スマホでお昼などに数時間ぶりアクセスした際、1時間有効のJWTが期限切れになっていると、
// supabase-js 標準の _getAccessToken() が `/auth/v1/token` の更新通信が終わるまで
// すべてのデータベース取得（記事一覧・タイムライン・新着コメント・ランキング）をブロックしてしまう問題を解消！
// 有効なトークンがあれば0msで即返し、期限切れの場合は裏で更新を走らせつつ0msで公開キー(anon)を返して画面を即座に表示させる。
let lastBgRefreshTs = 0;
supabase._getAccessToken = async () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let raw = window.localStorage.getItem('sb-ssmkasmtdnojdicdpdfg-auth-token');
      if (!raw) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            raw = window.localStorage.getItem(k);
            break;
          }
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token;
        const expiresAt = Number(parsed?.expires_at) || 0;
        const nowSec = Math.floor(Date.now() / 1000);
        // 有効期限まで20秒以上残っていれば即座にそのトークンを使う（0ms・通信待ちゼロ）
        if (token && expiresAt > nowSec + 20) {
          return token;
        }
        // 期限切れの場合は、裏で非同期にトークンリフレッシュを開始しつつ、今回のDB取得は待たせずに公開キーで即実行！
        if (Date.now() - lastBgRefreshTs > 10000) {
          lastBgRefreshTs = Date.now();
          setTimeout(() => {
            supabase.auth.getSession().catch(() => {});
          }, 0);
        }
      }
    }
  } catch {
    // ignore storage parse errors
  }
  return supabaseAnonKey;
};

// 🛡️ user_metadata 更新の競合（先祖返り・上書き消失）を完全防止するマイクロバッチ＆直列キュー
if (supabase?.auth?.updateUser) {
  const rawUpdateUser = supabase.auth.updateUser.bind(supabase.auth);
  let pendingDataUpdates = {};
  let pendingOtherAttrs = null;
  let batchTimer = null;
  let pendingResolvers = [];
  let updateQueue = Promise.resolve();

  supabase.auth.updateUser = (attributes = {}) => {
    return new Promise((resolve, reject) => {
      if (attributes && typeof attributes === 'object') {
        const { data, ...rest } = attributes;
        if (data && typeof data === 'object') {
          pendingDataUpdates = { ...pendingDataUpdates, ...data };
        }
        if (Object.keys(rest).length > 0) {
          pendingOtherAttrs = { ...(pendingOtherAttrs || {}), ...rest };
        }
      }
      pendingResolvers.push({ resolve, reject });

      if (!batchTimer) {
        batchTimer = setTimeout(() => {
          const dataToSend = { ...pendingDataUpdates };
          const otherToSend = pendingOtherAttrs ? { ...pendingOtherAttrs } : {};
          const resolvers = pendingResolvers;
          pendingDataUpdates = {};
          pendingOtherAttrs = null;
          pendingResolvers = [];
          batchTimer = null;

          const payload = Object.keys(dataToSend).length > 0
            ? { ...otherToSend, data: dataToSend }
            : otherToSend;

          updateQueue = updateQueue
            .then(() => rawUpdateUser(payload))
            .then((res) => {
              resolvers.forEach(r => r.resolve(res));
              return res;
            })
            .catch((err) => {
              resolvers.forEach(r => r.reject(err));
            });
        }, 60);
      }
    });
  };
}
