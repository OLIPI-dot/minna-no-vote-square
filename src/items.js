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
