import test from 'node:test';
import assert from 'node:assert/strict';

const engine = await import('../src/engine.js').catch(() => ({}));
const data = await import('../src/data.js').catch(() => ({}));
const { createGame, startDay, getOrder, assessDish, serveOrder, finishDay,
  purchaseUpgrade, levelInfo, validateSave, getDayInfo } = engine;
const { RECIPES, INGREDIENTS, SAUCES, UPGRADES } = data;

function setup(day = 1) {
  const state = createGame();
  state.day = day;
  state.rng = 123456;
  startDay(state);
  return state;
}
function dishFor(order, changes = {}) {
  return { sauce: order.sauce, spice: order.spice,
    ingredients: [...order.ingredients], cookQuality: 1, ...changes };
}
function servePerfect(state, elapsed = 8) {
  const order = getOrder(state);
  return serveOrder(state, assessDish(order, dishFor(order), elapsed, state));
}

test('public game rules are available', () => {
  for (const name of ['createGame', 'startDay', 'getOrder', 'assessDish',
    'serveOrder', 'finishDay', 'purchaseUpgrade', 'levelInfo', 'validateSave', 'getDayInfo']) {
    assert.equal(typeof engine[name], 'function', `${name} is required`);
  }
});

test('first day gives three basic orders and enough money for an upgrade', () => {
  const state = setup();
  assert.equal(state.shift.total, 3);
  assert.ok(state.shift.orders.every(order => order.recipeId === 'classic'));
  while (getOrder(state)) servePerfect(state);
  assert.equal(state.totalServed, 3);
  assert.equal(state.shift.perfect, 3);
  assert.ok(state.coins >= UPGRADES.find(item => item.id === 'stove').costs[0]);
  assert.equal(levelInfo(state.xp).level >= 2, true);
});

test('matching ingredients, sauce, spice and cooking give a perfect dish', () => {
  const state = setup();
  const order = getOrder(state);
  const result = assessDish(order, dishFor(order), 10, state);
  assert.equal(result.score, 100);
  assert.equal(result.grade, 'perfect');
  assert.ok(result.tip > 0);
  assert.equal(result.coins > order.price, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.extra, []);
});

test('a wrong sauce and missing ingredients lower rating and explain the mistake', () => {
  const state = setup();
  const order = getOrder(state);
  const result = assessDish(order, dishFor(order, { sauce: 'cream', ingredients: ['rice'] }), 10, state);
  assert.ok(result.score < 75);
  assert.notEqual(result.grade, 'perfect');
  assert.deepEqual(result.missing.sort(), ['fishcake', 'scallion']);
  assert.ok(result.feedback.length > 0);
  assert.ok(result.coins > 0, 'mistakes never bankrupt a new player');
});

test('extra toppings count once and do not improve an unwanted topping', () => {
  const state = setup();
  const order = getOrder(state);
  const extra = [...order.ingredients, 'cheese'];
  const result = assessDish(order, dishFor(order, { ingredients: extra }), 8, state);
  const duplicates = assessDish(order, dishFor(order, { ingredients: [...extra, 'cheese'] }), 8, state);
  assert.deepEqual(result.extra, ['cheese']);
  assert.ok(result.score < 100);
  assert.equal(duplicates.score, result.score);
});

test('explicit omissions and additions are assessed against the request', () => {
  const state = setup(3);
  const order = { ...getOrder(state), ingredients: ['rice', 'scallion', 'cheese'] };
  const correct = assessDish(order, dishFor(order), 8, state);
  const wrong = assessDish(order, dishFor(order, { ingredients: ['rice', 'fishcake', 'scallion'] }), 8, state);
  assert.equal(correct.grade, 'perfect');
  assert.deepEqual(wrong.missing, ['cheese']);
  assert.deepEqual(wrong.extra, ['fishcake']);
});

test('first-day and relaxed mode have no patience penalty', () => {
  const first = setup();
  const firstOrder = getOrder(first);
  assert.equal(assessDish(firstOrder, dishFor(firstOrder), 10000, first).score, 100);
  const later = setup(5);
  const laterOrder = getOrder(later);
  assert.ok(assessDish(laterOrder, dishFor(laterOrder), 10000, later).score < 100);
  later.settings.relaxed = true;
  assert.equal(assessDish(laterOrder, dishFor(laterOrder), 10000, later).score, 100);
});

test('dish evaluation cannot produce NaN or reward invalid cooking values', () => {
  const state = setup(5);
  const order = getOrder(state);
  for (const cookQuality of [NaN, Infinity, -3, null]) {
    const result = assessDish(order, dishFor(order, { cookQuality }), Infinity, state);
    assert.ok(Number.isFinite(result.score));
    assert.ok(Number.isFinite(result.coins));
    assert.ok(result.score < 100);
  }
});

test('an order can only be paid once and starting a day twice preserves it', () => {
  const state = setup();
  const shift = state.shift;
  startDay(state);
  assert.equal(state.shift, shift);
  const order = getOrder(state);
  const result = assessDish(order, dishFor(order), 8, state);
  assert.equal(serveOrder(state, result).accepted, true);
  const balance = state.coins;
  const served = state.totalServed;
  assert.equal(serveOrder(state, result).accepted, false);
  assert.equal(state.coins, balance);
  assert.equal(state.totalServed, served);
});

test('day cannot finish early and completion unlocks the next recipe once', () => {
  const state = setup();
  assert.equal(finishDay(state).ok, false);
  assert.equal(state.day, 1);
  while (getOrder(state)) servePerfect(state);
  const summary = finishDay(state);
  assert.equal(summary.ok, true);
  assert.equal(state.day, 2);
  assert.equal(state.shift, null);
  assert.ok(summary.unlocked.includes('cheese'));
  assert.equal(finishDay(state).ok, false);
  assert.equal(state.day, 2);
});

test('new recipes and requested toppings never require locked ingredients', () => {
  assert.equal(RECIPES.length, 8);
  for (let day = 1; day <= 40; day++) {
    const state = setup(day);
    assert.ok(state.shift.total >= 3 && state.shift.total <= 7);
    assert.equal(state.shift.orders.length, state.shift.total);
    for (const order of state.shift.orders) {
      assert.ok(RECIPES.find(recipe => recipe.id === order.recipeId).unlockDay <= day);
      assert.ok(SAUCES.find(sauce => sauce.id === order.sauce).unlockDay <= day);
      assert.ok(order.ingredients.includes('rice'));
      for (const id of order.ingredients) {
        assert.ok(INGREDIENTS.find(ingredient => ingredient.id === id).unlockDay <= day);
      }
    }
  }
});

test('new recipe is featured on its unlock day', () => {
  for (let day = 2; day <= 7; day++) {
    const state = setup(day);
    const newIds = RECIPES.filter(recipe => recipe.unlockDay === day).map(recipe => recipe.id);
    for (const id of newIds) assert.ok(state.shift.orders.some(order => order.recipeId === id));
  }
});

test('upgrades require funds, apply their benefits and stop at maximum level', () => {
  const state = createGame();
  assert.equal(purchaseUpgrade(state, 'stove').ok, false);
  assert.equal(purchaseUpgrade(state, 'unknown').ok, false);
  state.coins = 10000;
  for (const item of UPGRADES) {
    for (let index = 0; index < item.maxLevel; index++) {
      const before = state.coins;
      assert.equal(purchaseUpgrade(state, item.id).ok, true);
      assert.equal(state.coins, before - item.costs[index]);
    }
    assert.equal(purchaseUpgrade(state, item.id).ok, false);
    assert.equal(state.upgrades[item.id], item.maxLevel);
  }
  startDay(state);
  assert.ok(getOrder(state).patience > getOrder(setup()).patience);
});

test('friendship, achievements and combo progress from actual paid orders', () => {
  const state = setup();
  const result = servePerfect(state);
  assert.ok(result.achievements.includes('first-bowl'));
  assert.ok(state.bonds.some(value => value > 0));
  assert.equal(state.shift.combo, 1);
  assert.equal(state.bestCombo, 1);
  assert.ok(result.story && result.story.text);
  servePerfect(state);
  servePerfect(state);
  assert.ok(state.unlockedAchievements.includes('triple-perfect'));
  const count = state.unlockedAchievements.length;
  assert.equal(new Set(state.unlockedAchievements).size, count);
});

test('level and event information stay bounded even with invalid input', () => {
  for (const xp of [0, 100, 10000, NaN, -3, Infinity]) {
    const level = levelInfo(xp);
    assert.ok(Number.isFinite(level.level));
    assert.ok(level.progress >= 0 && level.progress <= 1);
    assert.ok(level.nextXp >= 0);
    assert.ok(level.title.length > 0);
  }
  for (const day of [1, 2, 7, 10000]) {
    const info = getDayInfo(day);
    assert.ok(info.multiplier >= 1);
    assert.ok(info.target > 0);
    assert.ok(info.title && info.subtitle && info.event);
  }
});

test('save validation restores safe state without retaining object references', () => {
  const state = setup(3);
  servePerfect(state);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.ok(restored);
  assert.deepEqual(getOrder(restored), getOrder(state));
  assert.equal(restored.coins, state.coins);
  assert.equal(restored.shift.index, 1);
  restored.bonds[0] = 99;
  assert.notEqual(state.bonds[0], 99);
  assert.ok(validateSave(createGame()));
});

test('save validation rejects corrupt numbers, currency, recipes and broken resumed shifts', () => {
  for (const value of [null, [], {}, { ...createGame(), version: 999 },
    { ...createGame(), coins: NaN }, { ...createGame(), coins: -1 },
    { ...createGame(), day: Infinity }, { ...createGame(), day: 0 },
    { ...createGame(), upgrades: { stove: 999, decor: 0, patience: 0 } }]) {
    assert.equal(validateSave(value), null);
  }
  const badIndex = setup();
  badIndex.shift.index = 500;
  assert.equal(validateSave(badIndex), null);
  const badRecipe = setup();
  badRecipe.shift.orders[0].recipeId = 'invalid';
  assert.equal(validateSave(badRecipe), null);
  const badIngredient = setup();
  badIngredient.shift.orders[0].ingredients.push('constructor');
  assert.equal(validateSave(badIngredient), null);
  const badEarnings = setup();
  badEarnings.shift.earned = NaN;
  assert.equal(validateSave(badEarnings), null);
});

test('twenty days remain playable, varied, finite and saveable', () => {
  const state=createGame();
  state.rng=8529;
  const seen=new Set();
  for(let day=1;day<=20;day++){
    startDay(state);
    while(getOrder(state)){
      const order=getOrder(state);
      seen.add(order.recipeId);
      const result=assessDish(order,dishFor(order),7,state);
      assert.equal(result.grade,'perfect');
      assert.equal(serveOrder(state,result).accepted,true);
      assert.ok(validateSave(state));
    }
    assert.equal(finishDay(state).ok,true);
    for(const upgrade of UPGRADES)purchaseUpgrade(state,upgrade.id);
    assert.ok(validateSave(state));
  }
  assert.equal(seen.size,RECIPES.length);
  assert.equal(state.day,21);
  assert.ok(state.coins>0&&Number.isFinite(state.coins));
  assert.ok(state.unlockedAchievements.includes('all-recipes'));
  assert.ok(state.unlockedAchievements.includes('master-shop'));
});

test('failed dishes reset combo but remain recoverable next order', () => {
  const state=setup();
  servePerfect(state);
  const order=getOrder(state);
  const result=assessDish(order,{sauce:'cream',spice:3,ingredients:[],cookQuality:0},10,state);
  assert.equal(result.grade,'bad');
  assert.ok(result.coins>0);
  serveOrder(state,result);
  assert.equal(state.shift.combo,0);
  servePerfect(state);
  assert.equal(state.shift.combo,1);
  assert.equal(state.bestCombo,1);
});

test('corrupt duplicated orders and settings are rejected', () => {
  const duplicate=setup();
  duplicate.shift.orders[1]=copyOrder(duplicate.shift.orders[0]);
  assert.equal(validateSave(duplicate),null);
  const wrongSettings=createGame();
  wrongSettings.settings.sound='true';
  assert.equal(validateSave(wrongSettings),null);
  const inconsistent=setup();
  inconsistent.shift.served=2;
  assert.equal(validateSave(inconsistent),null);
  const badStats=createGame();
  badStats.perfects=1;
  assert.equal(validateSave(badStats),null);
});
function copyOrder(order){return JSON.parse(JSON.stringify(order));}


test('recipes provide serving amounts and the first customers introduce personal tastes', () => {
  for (const recipe of RECIPES) {
    assert.deepEqual(Object.keys(recipe.quantities).sort(), [...recipe.ingredients].sort());
    assert.ok(Object.values(recipe.quantities).every(qty => Number.isInteger(qty) && qty >= 1 && qty <= 12));
  }
  const state = setup();
  const [first, hungry, gentle] = state.shift.orders;
  assert.deepEqual(first.quantities, { rice: 6, fishcake: 3, scallion: 2 });
  assert.equal(hungry.quantities.rice, 8);
  assert.equal(gentle.spice, 0);
  assert.equal(gentle.quantities.fishcake, 4);
  assert.ok(hungry.preference.length > 0 && gentle.preference.length > 0);
  assert.ok(state.shift.orders.every(order => order.patience >= 90));
});
test('amount scoring rewards exact requests and treats one-piece errors gently', () => {
  const state = setup();
  const order = getOrder(state);
  const exact = { ...dishFor(order), quantities: { ...order.quantities } };
  assert.equal(assessDish(order, exact, 65, state).score, 100);
  const one = assessDish(order, { ...exact, quantities: { ...order.quantities, rice: 7 } }, 65, state);
  const many = assessDish(order, { ...exact, quantities: { ...order.quantities, rice: 12 } }, 65, state);
  const missing = assessDish(order, { ...exact, quantities: { rice: 6, scallion: 2 } }, 65, state);
  assert.ok(one.score >= 96 && one.score < 100);
  assert.ok(many.score < one.score);
  assert.ok(missing.score < many.score);
  assert.deepEqual(missing.missing, ['fishcake']);
  assert.match(one.feedback, /쌀떡/);
});
test('unexpected quantities and invalid numeric servings cannot earn a perfect dish', () => {
  const state = setup(3);
  const order = getOrder(state);
  const quantities = { ...order.quantities, mushroom: 1 };
  assert.ok(assessDish(order, { ...dishFor(order), quantities }, 60, state).score < 100);
  for (const rice of [NaN, Infinity, -1, '6', 1.5]) {
    const result = assessDish(order, { ...dishFor(order), quantities: { ...order.quantities, rice } }, 60, state);
    assert.ok(Number.isFinite(result.score) && result.score < 100);
  }
});
test('version-one saves migrate ingredient-only orders without changing player progress', () => {
  const state = setup(3);
  state.coins = 770; state.xp = 90;
  for (const order of state.shift.orders) { delete order.quantities; delete order.preference; order.patience = 60; }
  const original = structuredClone(state);
  const migrated = validateSave(state);
  assert.ok(migrated);
  assert.equal(migrated.coins, 770); assert.equal(migrated.xp, 90);
  assert.equal(migrated.version, 1);
  for (const order of migrated.shift.orders) {
    assert.deepEqual(Object.keys(order.quantities).sort(), [...order.ingredients].sort());
    assert.ok(order.patience >= 90);
  }
  assert.deepEqual(state, original);
});
test('quantity save validation rejects malformed values, unknown ingredients and array mismatches', () => {
  const valid = setup();
  assert.ok(validateSave(valid));
  for (const quantities of [null, [], { rice: -1 }, { rice: 2.5 }, { rice: 13 }, { rice: '6' },
    { rice: 6, fishcake: 3, scallion: 2, unicorn: 1 }, { rice: 6, fishcake: 3 }]) {
    const corrupted = structuredClone(valid);
    corrupted.shift.orders[0].quantities = quantities;
    assert.equal(validateSave(corrupted), null, JSON.stringify(quantities));
  }
});
test('personal requests are repeatable, varied and limited to available ingredients', () => {
  const a = setup(8), b = setup(8);
  assert.deepEqual(a.shift.orders, b.shift.orders);
  assert.ok(new Set(a.shift.orders.map(order => order.preference)).size >= 4);
  for (let day = 1; day <= 20; day++) {
    for (const order of setup(day).shift.orders) {
      assert.ok(order.patience >= 90);
      assert.deepEqual(Object.keys(order.quantities).sort(), [...order.ingredients].sort());
      assert.ok(Object.entries(order.quantities).every(([id, count]) =>
        count > 0 && count <= 12 && INGREDIENTS.find(ingredient => ingredient.id === id).unlockDay <= day));
    }
  }
});
