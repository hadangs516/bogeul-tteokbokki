import { INGREDIENTS, RECIPES, SAUCES } from './data.js';
import { createCook } from './cooking.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isInteger(value) && number(value, min, max);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fallbackAmounts = {rice:6,fishcake:3,scallion:2,cheese:2,cream:2,ramen:2,sausage:3,cabbage:2,glassnoodle:3,mushroom:3};

function restoredCook(source) {
  if (!object(source)) return null;
  const ranges = {
    elapsed:[0,55], progress:[0,1], temperature:[0,130],
    lastStirAt:[0,55], scorch:[0,1], aroma:[0,1], quality:[0,1]
  };
  for (const [key,[min,max]] of Object.entries(ranges)) {
    if (!number(source[key],min,max)) return null;
  }
  if (!integer(source.heat,0,3) || !integer(source.stirs,0,100) || source.lastStirAt > source.elapsed) return null;
  if (typeof source.finished !== 'boolean') return null;
  if (source.autoFinished !== undefined && typeof source.autoFinished !== 'boolean') return null;
  if (source.relaxed !== undefined && typeof source.relaxed !== 'boolean') return null;
  if (source.stove !== undefined && !integer(source.stove,0,3)) return null;
  const cook = createCook();
  for (const key of Object.keys(cook)) if (source[key] !== undefined) cook[key] = source[key];
  return cook;
}

/** Restore only the current bowl; an invalid run never changes the shop's saved state. */
export function restoreSession(run, order, day) {
  if (!object(run) || !object(order) || typeof order.id !== 'string' || run.orderId !== order.id || !object(run.dish)) return null;
  const recipe = RECIPES.find(item => item.id === order.recipeId);
  if (!recipe || !integer(day,1,1000000) || recipe.unlockDay > day) return null;
  const source = run.dish;
  const available = new Set(INGREDIENTS.filter(item => item.unlockDay <= day).map(item => item.id));
  if (source.sauce !== null && !SAUCES.some(item => item.id === source.sauce && item.unlockDay <= day)) return null;
  if (!integer(source.spice,0,3)) return null;
  if (source.ingredients !== undefined && (!Array.isArray(source.ingredients) || !source.ingredients.every(id => available.has(id)))) return null;

  let quantities;
  if (Object.hasOwn(source,'quantities')) {
    if (!object(source.quantities)) return null;
    const entries = Object.entries(source.quantities);
    if (!entries.every(([id,amount]) => available.has(id) && integer(amount,0,12))) return null;
    if (entries.reduce((sum,[,amount]) => sum + amount,0) > 60) return null;
    quantities = Object.fromEntries(entries);
  } else {
    if (!Array.isArray(source.ingredients)) return null;
    quantities = Object.fromEntries([...new Set(source.ingredients)].map(id => [id,recipe.quantities[id] || fallbackAmounts[id]]));
  }
  const dish = {
    sauce:source.sauce, spice:source.spice,
    ingredients:Object.keys(quantities).filter(id => quantities[id] > 0),
    quantities,
    cookQuality:number(source.cookQuality,0,1) ? source.cookQuality : 0
  };
  let stage = ['prep','season','cooking','ready'].includes(run.stage) ? run.stage : 'prep';
  let cook = restoredCook(run.cook);
  if (!cook) {
    cook = createCook();
    // The old release saved completed dishes without a cooking simulation.
    if (stage === 'ready' && !Object.hasOwn(run,'cook')) {
      cook.finished = true; cook.progress = 1; cook.quality = dish.cookQuality;
    } else if (stage === 'cooking' || stage === 'ready' || Object.hasOwn(run,'cook')) {
      stage = 'season';
    }
  }
  if (cook.finished) {
    stage = 'ready'; dish.cookQuality = cook.quality;
  }
  // Broken prerequisites return to a screen that lets the player repair the bowl.
  if (stage !== 'prep' && !quantities.rice) {
    stage = 'prep'; cook = createCook();
  } else if (['cooking','ready'].includes(stage) && !dish.sauce) {
    stage = 'season'; cook = createCook();
  }
  return {
    dish, stage, room:stage === 'prep' && run.room === 'counter' ? 'counter' : 'kitchen',
    elapsed:typeof run.elapsed === 'number' && Number.isFinite(run.elapsed) ? clamp(run.elapsed,0,3600) : 0,
    cook, bowl:['ivory','blue','red'].includes(run.bowl) ? run.bowl : 'ivory'
  };
}
