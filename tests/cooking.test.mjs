import test from 'node:test';
import assert from 'node:assert/strict';
const cooking = await import('../src/cooking.js').catch(() => ({}));
const { createCook, tickCook, stirCook, setHeat, finishCook, getCookStatus } = cooking;
function simulate({ heat = 2, stirEvery = 6, options = {} } = {}) {
  const cook = createCook();
  setHeat(cook, heat);
  let nextStir = stirEvery;
  for (let i = 0; i < 240 && !cook.finished; i++) {
    tickCook(cook, .25, options);
    if (stirEvery && cook.elapsed >= nextStir) {
      stirCook(cook); nextStir += stirEvery;
    }
  }
  return cook;
}
test('cooking exports the UI simulation contract', () => {
  for (const name of ['createCook', 'tickCook', 'stirCook', 'setHeat', 'finishCook', 'getCookStatus']) {
    assert.equal(typeof cooking[name], 'function', name);
  }
});
test('medium heat and periodic stirring finish a full-quality dish in 35–42 seconds', () => {
  const cook = simulate();
  assert.equal(cook.finished, true);
  assert.ok(cook.elapsed >= 35 && cook.elapsed <= 42, String(cook.elapsed));
  assert.equal(cook.quality, 1);
  assert.ok(cook.stirs >= 4 && cook.stirs <= 7);
});
test('unattended high heat cannot wait forever and gives worse cooking quality', () => {
  const cook = simulate({ heat: 3, stirEvery: 0 });
  assert.equal(cook.finished, true);
  assert.ok(cook.elapsed <= 55);
  assert.ok(cook.scorch > 0);
  assert.ok(cook.quality < .8);
});
test('even a cold stove has a 55-second safety finish and a low score', () => {
  const cook = simulate({ heat: 0, stirEvery: 0 });
  assert.equal(cook.finished, true);
  assert.equal(cook.elapsed, 55);
  assert.ok(cook.quality < .5);
});
test('stirring has a cooldown and does not require click spamming', () => {
  const cook = createCook();
  for (let i = 0; i < 24; i++) tickCook(cook, .25);
  assert.equal(stirCook(cook), true);
  const progress = cook.progress;
  assert.equal(stirCook(cook), false);
  assert.equal(cook.progress, progress);
  assert.equal(cook.stirs, 1);
  for (let i = 0; i < 5; i++) tickCook(cook, .25);
  assert.equal(stirCook(cook), true);
});
test('manual finishing is only available when sufficiently cooked and is idempotent', () => {
  const cook = createCook();
  assert.equal(getCookStatus(cook).canFinish, false);
  assert.equal(finishCook(cook), false);
  while (!getCookStatus(cook).canFinish) {
    tickCook(cook, .25);
    if (cook.elapsed - cook.lastStirAt >= 6) stirCook(cook);
  }
  assert.equal(finishCook(cook), true);
  assert.equal(cook.finished, true);
  assert.ok(cook.quality > .65 && cook.quality <= 1);
  const frozen = structuredClone(cook);
  assert.equal(finishCook(cook), false);
  tickCook(cook, 5); stirCook(cook); setHeat(cook, 3);
  assert.deepEqual(cook, frozen);
});
test('large frame deltas are capped and invalid values do not corrupt cooking', () => {
  const cook = createCook();
  tickCook(cook, 99);
  assert.equal(cook.elapsed, .25);
  const snapshot = structuredClone(cook);
  for (const dt of [NaN, Infinity, -1, undefined]) tickCook(cook, dt);
  assert.deepEqual(cook, snapshot);
  for (const heat of [NaN, Infinity, -1, 4, '3']) setHeat(cook, heat);
  assert.equal(cook.heat, 2);
  assert.ok(getCookStatus(cook).progress >= 0);
});
test('relaxed mode and upgraded stoves protect quality without removing the finish limit', () => {
  const normal = simulate({ heat: 3, stirEvery: 0 });
  const assisted = simulate({ heat: 3, stirEvery: 0, options: { relaxed: true, stove: 3 } });
  assert.ok(assisted.quality > normal.quality);
  assert.ok(assisted.elapsed <= 55);
});
