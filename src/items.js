import itemsData from './data/items.json';
import effectsData from './data/effects.json';

export const ITEMS = itemsData;
export const EFFECT_DESCRIPTIONS = effectsData;

export const getReqLevel = (item) => {
  if (item.reqLevel) return item.reqLevel;
  
  const power = (item.atk * 1.5) + (item.def * 1.0) + (item.hp * 0.3);
  let calcLevel = Math.floor(power / 10);
  if (calcLevel < 1) calcLevel = 1;
  if (calcLevel > 99) calcLevel = 99;
  
  return calcLevel;
};

export const rollGacha = () => {
  const rand = Math.random() * 100;
  let targetRarity = 'N';
  
  if (rand < 0.004) targetRarity = 'LR';
  else if (rand < 0.504) targetRarity = 'UR';
  else if (rand < 2.104) targetRarity = 'SR';
  else if (rand < 22.104) targetRarity = 'R';
  else targetRarity = 'N';

  const pool = ITEMS.filter(item => item.rarity === targetRarity);
  return pool[Math.floor(Math.random() * pool.length)];
};

// ユーザーの所持アイテムを最新のマスターデータ（atk, def, hp等）で自動同期・補正する
export const syncItemWithMaster = (item) => {
  if (!item || !item.id) return item;
  const baseId = typeof item.id === 'string' ? item.id.split('_')[0] : item.id;
  const master = ITEMS.find(i => i.id === item.id || i.id === baseId || (i.name && i.name === item.name));
  if (!master) return item;
  return {
    ...item,
    atk: master.atk,
    def: master.def,
    hp: master.hp,
    reqLevel: master.reqLevel || item.reqLevel || undefined,
    name: master.name,
    desc: master.desc,
    effect: master.effect,
    effectMsg: master.effectMsg,
    icon: master.icon || item.icon,
    rarity: master.rarity || item.rarity,
    type: master.type || item.type,
  };
};

// 💡 アイテムのレアリティに応じた固有の能力説明テキストを生成する
export const getItemEffectDescription = (itemOrEffect, customRarity) => {
  if (!itemOrEffect) return '';

  let eff = '';
  let rarity = 'N';

  if (typeof itemOrEffect === 'object') {
    const baseId = itemOrEffect.id ? String(itemOrEffect.id).split('_')[0] : null;
    const master = ITEMS.find(i => (baseId && i.id === baseId) || i.id === itemOrEffect.id || (itemOrEffect.name && i.name === itemOrEffect.name));
    eff = master?.effect || itemOrEffect.effect;
    rarity = master?.rarity || itemOrEffect.rarity || customRarity || 'N';
  } else {
    eff = itemOrEffect;
    rarity = customRarity || 'N';
  }

  if (!eff) return '';

  switch (eff) {
    case 'golden_carrot': {
      return `【黄金部位撃ち】当たる部位（小指〜脳天急所）で追加ダメージが劇的変化＆確率スタン`;
    }
    case 'regen': {
      const pct = { N: 3, R: 5, SR: 10, UR: 15 }[rarity] || 5;
      return `【自動回復】ターン開始時にHPを${pct}%回復`;
    }
    case 'virus': {
      const pct = { N: 3, R: 5, SR: 10, UR: 15 }[rarity] || 5;
      const rate = { N: 10, R: 15, SR: 25, UR: 35 }[rarity] || 15;
      return `【ウイルス】攻撃時${rate}%で感染、毎ターンHP${pct}%ダメージ`;
    }
    case 'burn': {
      const pct = { N: 5, R: 8, SR: 15, UR: 20 }[rarity] || 8;
      const rate = { N: 10, R: 15, SR: 25, UR: 35 }[rarity] || 15;
      return `【大炎上】攻撃時${rate}%で点火、毎ターンHP${pct}%ダメージ`;
    }
    case 'stealth': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【ステルス】敵の攻撃を${pct}%の確率で回避`;
    }
    case 'dodge_up': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【回避UP】敵の攻撃を${pct}%の確率で回避`;
    }
    case 'crit_up': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【会心UP】クリティカル率が+${pct}%上昇`;
    }
    case 'kusorep': {
      const pct = { N: 5, R: 10, SR: 20, UR: 30 }[rarity] || 10;
      return `【クソリプ】被弾時${pct}%の確率でダメージを1にする`;
    }
    case 'lock_account': {
      const pct = { N: 5, R: 10, SR: 15, UR: 20 }[rarity] || 10;
      return `【鍵垢】受けるダメージを常に${pct}%カット`;
    }
    case 'meshitero': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【飯テロ】攻撃時${pct}%の確率で敵を行動不能にする`;
    }
    case 'kidoku_ignore': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【既読スルー】敵攻撃時${pct}%の確率で完全無視＆敵自傷`;
    }
    case 'giga_death': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【通信制限】敵をギガ死状態にして回避率が+${pct}%上昇`;
    }
    case 'sharp_eye': {
      const pct = { N: 5, R: 10, SR: 20, UR: 25 }[rarity] || 10;
      return `【手刀見切り】敵攻撃時${pct}%で無力化しカウンター反撃`;
    }
    case 'domain_expansion': {
      const pct = { N: 5, R: 8, SR: 15, UR: 25 }[rarity] || 15;
      return `【領域展開】ターン開始時${pct}%で必中＆確定会心`;
    }
    case 'double_attack': {
      const rate = { N: 10, R: 15, SR: 30, UR: 40 }[rarity] || 20;
      return `【2回攻撃】${rate}%の確率で連続攻撃`;
    }
    case 'lifesteal': {
      const rate = { N: 10, R: 15, SR: 25, UR: 35 }[rarity] || 25;
      return `【吸収】${rate}%の確率で与えたダメージをHP回復`;
    }
    case 'mental_damage': {
      const rate = { N: 5, R: 8, SR: 15, UR: 20 }[rarity] || 10;
      return `【精神攻撃】${rate}%の確率で敵をスタンさせる`;
    }
    case 'cringe': {
      const rate = { N: 3, R: 5, SR: 10, UR: 15 }[rarity] || 5;
      return `【ドン引き】${rate}%の確率で敵を行動不能にする`;
    }
    case 'ban': {
      const rate = { N: 1, R: 2, SR: 5, UR: 8 }[rarity] || 5;
      return `【BAN】攻撃時${rate}%の確率で敵を即死させる`;
    }
    default:
      return EFFECT_DESCRIPTIONS[eff] || '【特殊効果あり】';
  }
};

const EFFECT_RATES = {
  mental_damage: { N: 5, R: 8, SR: 15, UR: 20, maxCap: 40, unit: '%の確率で敵をスタンさせる', label: '精神攻撃' },
  cringe: { N: 3, R: 5, SR: 10, UR: 15, maxCap: 25, unit: '%の確率で敵を行動不能にする', label: 'ドン引き' },
  stealth: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 60, unit: '%の確率で回避', label: 'ステルス' },
  dodge_up: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 60, unit: '%の確率で回避', label: '回避UP' },
  crit_up: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 50, unit: '%上昇', label: '会心UP' },
  regen: { N: 3, R: 5, SR: 10, UR: 15, maxCap: 30, unit: '%回復', label: '自動回復' },
  kusorep: { N: 5, R: 10, SR: 20, UR: 30, maxCap: 50, unit: '%の確率でダメージを1にする', label: 'クソリプ' },
  lock_account: { N: 5, R: 10, SR: 15, UR: 20, maxCap: 30, unit: '%カット', label: '鍵垢' },
  meshitero: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 40, unit: '%の確率で敵を行動不能にする', label: '飯テロ' },
  kidoku_ignore: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 40, unit: '%の確率で完全無視＆敵自傷', label: '既読スルー' },
  giga_death: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 40, unit: '%の確率で回避', label: '通信制限' },
  sharp_eye: { N: 5, R: 10, SR: 20, UR: 25, maxCap: 40, unit: '%で無力化しカウンター反撃', label: '手刀見切り' },
  domain_expansion: { N: 5, R: 8, SR: 15, UR: 25, maxCap: 40, unit: '%で必中＆確定会心', label: '領域展開' },
  double_attack: { N: 10, R: 15, SR: 30, UR: 40, maxCap: 60, unit: '%の確率で連続攻撃', label: '2回攻撃' },
  lifesteal: { N: 10, R: 15, SR: 25, UR: 35, maxCap: 60, unit: '%の確率で与ダメをHP吸収', label: '吸収' },
  ban: { N: 1, R: 2, SR: 5, UR: 8, maxCap: 15, unit: '%の確率で敵を即死させる', label: 'BAN' },
  virus: { N: 10, R: 15, SR: 25, UR: 35, maxCap: 60, unit: '%で感染（毎ターン小ダメ）', label: 'ウイルス' },
  burn: { N: 10, R: 15, SR: 25, UR: 35, maxCap: 60, unit: '%で発火（毎ターン大ダメ）', label: '大炎上' }
};

// 💡 装備の重複発動時の合算値および内訳テキストを生成する
export const getCombinedEffectDescription = (eff, sources = []) => {
  if (!eff || sources.length === 0) return { title: '', detail: '' };
  
  if (sources.length === 1) {
    return {
      title: getItemEffectDescription(sources[0].item || sources[0]),
      detail: ''
    };
  }

  const config = EFFECT_RATES[eff];
  if (config) {
    const breakdown = sources.map(s => {
      const r = s.rarity || 'N';
      const val = config[r] ?? config.R ?? 10;
      return `${s.slotName}: ${val}%`;
    });
    const totalVal = Math.min(config.maxCap, sources.reduce((sum, s) => {
      const r = s.rarity || 'N';
      return sum + (config[r] ?? config.R ?? 10);
    }, 0));

    return {
      title: `【${config.label}】 重複発動で合計 ${totalVal}${config.unit}`,
      detail: `（内訳: ${breakdown.join(' ＋ ')}）`
    };
  }

  return {
    title: `${EFFECT_DESCRIPTIONS[eff] || '【特殊効果あり】'}`,
    detail: `（${sources.map(s => s.slotName).join(' ＋ ')}で重複発動中）`
  };
};

// 🌟 派手めなレアリティカラー＆スタイル定義
export const RARITY_CONFIG = {
  LR: {
    label: 'LR',
    name: 'Legend Rare',
    color: '#dc2626',
    darkColor: '#ff4d4f',
    bg: 'linear-gradient(135deg, #ef4444 0%, #ec4899 50%, #8b5cf6 100%)',
    border: '#ef4444',
    glow: '0 0 10px rgba(239, 68, 68, 0.9), 0 0 20px rgba(236, 72, 153, 0.6)',
    textGlow: 'none',
    textGlowDark: '0 0 10px rgba(239, 68, 68, 0.9), 0 0 20px rgba(236, 72, 153, 0.6)',
    boxGlow: '0 0 12px rgba(239, 68, 68, 0.65)',
    sparkle: '🔥',
    badgeTextColor: '#ffffff'
  },
  UR: {
    label: 'UR',
    name: 'Ultra Rare',
    color: '#be123c',
    darkColor: '#fb7185',
    bg: 'linear-gradient(135deg, #f43f5e 0%, #d946ef 100%)',
    border: '#f43f5e',
    glow: '0 0 8px rgba(244, 63, 94, 0.85), 0 0 15px rgba(217, 70, 239, 0.5)',
    textGlow: 'none',
    textGlowDark: '0 0 8px rgba(244, 63, 94, 0.85), 0 0 15px rgba(217, 70, 239, 0.5)',
    boxGlow: '0 0 10px rgba(244, 63, 94, 0.5)',
    sparkle: '✨',
    badgeTextColor: '#ffffff'
  },
  SR: {
    label: 'SR',
    name: 'Super Rare',
    color: '#b45309',
    darkColor: '#fbbf24',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    border: '#f59e0b',
    glow: '0 0 8px rgba(245, 158, 11, 0.85), 0 0 12px rgba(234, 179, 8, 0.4)',
    textGlow: 'none',
    textGlowDark: '0 0 8px rgba(245, 158, 11, 0.85), 0 0 12px rgba(234, 179, 8, 0.4)',
    boxGlow: '0 0 8px rgba(245, 158, 11, 0.45)',
    sparkle: '⭐',
    badgeTextColor: '#ffffff'
  },
  R: {
    label: 'R',
    name: 'Rare',
    color: '#0369a1',
    darkColor: '#38bdf8',
    bg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    border: '#0284c7',
    glow: '0 0 6px rgba(56, 189, 248, 0.6)',
    textGlow: 'none',
    textGlowDark: '0 0 6px rgba(56, 189, 248, 0.6)',
    boxGlow: '0 0 6px rgba(56, 189, 248, 0.3)',
    sparkle: '🔷',
    badgeTextColor: '#ffffff'
  },
  N: {
    label: 'N',
    name: 'Normal',
    color: '#64748b',
    darkColor: '#94a3b8',
    bg: '#64748b',
    border: '#94a3b8',
    glow: 'none',
    textGlow: 'none',
    textGlowDark: 'none',
    boxGlow: 'none',
    sparkle: '',
    badgeTextColor: '#ffffff'
  }
};

export const getRarityColor = (rarity, isDark = false) => {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.N;
  return isDark ? cfg.darkColor : cfg.color;
};

export const getRarityTextStyle = (rarity, isDark = false) => {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.N;
  const color = isDark ? cfg.darkColor : cfg.color;
  const shadow = isDark ? (cfg.textGlowDark || cfg.glow) : (cfg.textGlow || undefined);
  return {
    color,
    fontWeight: rarity === 'N' ? 'normal' : 'bold',
    textShadow: shadow && shadow !== 'none' ? shadow : undefined
  };
};

export const getRarityBadgeStyle = (rarity) => {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.N;
  return {
    background: cfg.bg,
    color: cfg.badgeTextColor,
    border: `1px solid ${cfg.border}`,
    boxShadow: cfg.boxGlow !== 'none' ? cfg.boxGlow : 'none',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px'
  };
};
