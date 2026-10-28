import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    lock: false,
  },
});

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
