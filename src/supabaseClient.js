import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 📱 スマホ・iPad Safariでスリープ復帰時や古いセッション残存時、または外部ドメインブロック時でも
// 記事一覧・人気ランキング・タイムラインが確実に読み込める高耐久カスタムfetch
const resilientFetch = async (input, init = {}) => {
  const urlStr = typeof input === 'string' ? input : (input?.url || String(input));
  const method = (init?.method || 'GET').toUpperCase();
  const isRest = urlStr.includes('/rest/v1/');
  const isRestGet = isRest && (method === 'GET' || method === 'HEAD');
  // マイアンケート取得(user_id=eq.)以外の公開GETや公開RPCは、端末に残った古い・巨大なJWTで失敗しないよう常に公開キー(anon)で通信する
  const isPublicRead = (isRestGet && !urlStr.includes('user_id=eq.')) ||
    urlStr.includes('/rest/v1/rpc/get_total_votes') ||
    urlStr.includes('/rest/v1/rpc/increment_survey_view');

  const buildAnonHeaders = () => {
    const h = new Headers(init?.headers || {});
    h.set('apikey', supabaseAnonKey);
    h.set('Authorization', `Bearer ${supabaseAnonKey}`);
    return h;
  };

  const toSameOriginProxyUrl = (targetUrl) => {
    if (typeof window === 'undefined') return null;
    if (targetUrl.includes('/rest/v1/')) {
      const idx = targetUrl.indexOf('/rest/v1/');
      return '/sb-rest/' + targetUrl.substring(idx + '/rest/v1/'.length);
    }
    return null;
  };

  const doFetchWithTimeout = async (targetUrl, overrideHeaders, timeoutMs = 8000) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      // Safari / WebKit で body: undefined や signal: undefined をそのまま渡すと失敗するケースを防ぐためクリーンな init を組み立てる
      const cleanInit = {
        method,
        headers: overrideHeaders || init?.headers
      };
      if (method !== 'GET' && method !== 'HEAD' && init?.body !== undefined) {
        cleanInit.body = init.body;
      }
      if (init?.credentials) cleanInit.credentials = init.credentials;
      if (init?.mode) cleanInit.mode = init.mode;
      if (init?.cache) cleanInit.cache = init.cache;
      if (init?.signal) {
        cleanInit.signal = init.signal;
      } else if (controller) {
        cleanInit.signal = controller.signal;
      }
      return await fetch(targetUrl, cleanInit);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const initialHeaders = isPublicRead ? buildAnonHeaders() : (init?.headers || undefined);

  try {
    const res = await doFetchWithTimeout(urlStr, initialHeaders, isRestGet ? 7500 : 12000);
    // 🛡️ トークンエラー(400/401/403/431)や異常応答時は公開キー＆同一オリジン中継で即リカバリー！
    if (isRestGet && !res.ok) {
      const anonHeaders = buildAnonHeaders();
      const proxyUrl = toSameOriginProxyUrl(urlStr);
      if (proxyUrl) {
        try {
          const proxyRes = await doFetchWithTimeout(proxyUrl, anonHeaders, 8000);
          if (proxyRes.ok) return proxyRes;
        } catch {}
      }
      return await doFetchWithTimeout(urlStr, anonHeaders, 8000);
    }
    return res;
  } catch (err) {
    // 📱 iPad Safari のコンテンツブロッカー・ITP・回線切替等で直接通信が失敗した場合、同一オリジン(/sb-rest/)経由で自動リトライ！
    if (isRest) {
      const retryHeaders = isRestGet || isPublicRead ? buildAnonHeaders() : (init?.headers || undefined);
      const proxyUrl = toSameOriginProxyUrl(urlStr);
      if (proxyUrl) {
        try {
          return await doFetchWithTimeout(proxyUrl, retryHeaders, 8500);
        } catch {}
      }
      if (isRestGet) {
        await new Promise(r => setTimeout(r, 250));
        return await doFetchWithTimeout(urlStr, retryHeaders, 8500);
      }
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
    // さらに GoTrueClient._acquireLock の内部キュー(pendingInLock)は再入呼び出し時に自己デッドロックを起こすため、
    // 初回ロック時に _acquireLock 自体を再入安全な関数へ置き換えてデッドロックを完全に根絶する！
    lock: async function (_name, _acquireTimeout, fn) {
      if (this && typeof this === 'object' && this._acquireLock) {
        this._acquireLock = async (_timeout, innerFn) => {
          const prev = this.lockAcquired;
          this.lockAcquired = true;
          try {
            return await innerFn();
          } finally {
            this.lockAcquired = prev;
          }
        };
      }
      return await fn();
    },
  },
  global: {
    fetch: resilientFetch,
  },
});

if (supabase?.auth) {
  supabase.auth._acquireLock = async (_timeout, innerFn) => {
    const prev = supabase.auth.lockAcquired;
    supabase.auth.lockAcquired = true;
    try {
      return await innerFn();
    } finally {
      supabase.auth.lockAcquired = prev;
    }
  };
}

// 🚀 スマホでお昼などに数時間ぶりアクセスした際、1時間有効のJWTが期限切れになっていると、
// supabase-js 標準の _getAccessToken() が `/auth/v1/token` の更新通信が終わるまで
// すべてのデータベース取得（記事一覧・タイムライン・新着コメント・ランキング）をブロックしてしまう問題を解消！
// ⚠️ SupabaseClient コンストラクタは `this._getAccessToken.bind(this)` を先にバインドし、
// その内部で `if (this.accessToken) return await this.accessToken()` を呼ぶ仕組みになっているため、
// `supabase.accessToken` と `supabase._getAccessToken` の両方に高速トークン取得関数をセットする！
let lastBgRefreshTs = 0;
const getFastAccessToken = async () => {
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
supabase.accessToken = getFastAccessToken;
supabase._getAccessToken = getFastAccessToken;

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
