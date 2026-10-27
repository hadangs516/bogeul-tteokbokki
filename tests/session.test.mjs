import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startDay, getOrder } from '../src/engine.js';
import { createCook, tickCook, stirCook } from '../src/cooking.js';
import { INGREDIENTS } from '../src/data.js';
const session = await import('../src/session.js').catch(() => ({}));
const { restoreSession } = session;
const scenario = (name, fn) => test(name, { skip: typeof restoreSession !== 'function' }, fn);
function fixture(day = 1) {
  const state = createGame(); state.day = day; startDay(state);
  const order = getOrder(state);
  const run = {
    orderId: order.id, stage: 'prep', room: 'kitchen', elapsed: 12.5, bowl: 'blue',
    dish: { sauce: null, spice: 1, ingredients: ['rice','fishcake','scallion'], quantities: {rice:6,fishcake:3,scallion:2}, cookQuality: 0 },
    cook: createCook()
  };
  return { state, order, run };
}
function cookingRun() {
  const f = fixture(); f.run.stage = 'cooking'; f.run.dish.sauce = 'gochujang';
  for (let i = 0; i < 60; i++) {
    tickCook(f.run.cook, .25);
    if (f.run.cook.elapsed - f.run.cook.lastStirAt >= 6) stirCook(f.run.cook);
  }
  f.run.elapsed = 30; return f;
}
test('session restoration exposes one safe boundary', () => assert.equal(typeof restoreSession, 'function'));
scenario('honest prep and active cooking round trips preserve progress without sharing objects', () => {
  for (const {run,order} of [fixture(),cookingRun()]) {
    const before = structuredClone(run);
    const restored = restoreSession(run, order, 1);
    assert.ok(restored);
    assert.deepEqual(restored, {dish:run.dish,stage:run.stage,room:run.room,elapsed:run.elapsed,cook:run.cook,bowl:run.bowl});
    assert.deepEqual(run, before);
    restored.dish.quantities.rice = 0; restored.cook.elapsed = 50;
    assert.equal(run.dish.quantities.rice, 6);
    assert.notEqual(run.cook.elapsed, 50);
  }
});
scenario('legacy ingredient-only recipes migrate amounts and old timing restarts at seasoning', () => {
  const {run,order} = fixture(); delete run.dish.quantities; delete run.cook;
  run.dish.sauce = 'gochujang'; run.stage = 'cooking'; delete run.room;
  const restored = restoreSession(run, order, 1);
  assert.deepEqual(restored.dish.quantities, {rice:6,fishcake:3,scallion:2});
  assert.equal(restored.stage, 'season'); assert.equal(restored.room, 'kitchen');
  assert.deepEqual(restored.cook, createCook());
});
scenario('malformed legacy ingredients and invalid orders do not throw or restore', () => {
  const {run,order} = fixture(); delete run.dish.quantities;
  for (const bad of ['rice',{},null,12]) {
    run.dish.ingredients = bad;
    assert.equal(restoreSession(run, order, 1), null);
  }
  assert.equal(restoreSession(null, order, 1), null);
  assert.equal(restoreSession({...run,orderId:'different'}, order, 1), null);
  assert.equal(restoreSession(fixture().run, null, 1), null);
  assert.equal(restoreSession({...fixture().run,dish:[]}, order, 1), null);
});
scenario('quantities accept zeros but reject invalid values, locked food, and overflowing pots', () => {
  const {run,order} = fixture();
  for (const bad of [NaN,Infinity,-1,.5,13,'6']) {
    const candidate = structuredClone(run); candidate.dish.quantities.rice = bad;
    assert.equal(restoreSession(candidate, order, 1), null);
  }
  assert.equal(restoreSession({...run,dish:{...run.dish,quantities:[]}}, order, 1), null);
  assert.equal(restoreSession({...run,dish:{...run.dish,quantities:{rice:1,cheese:1}}}, order, 1), null);
  const zero = restoreSession({...run,dish:{...run.dish,ingredients:['rice'],quantities:{rice:1,fishcake:0}}},order,1);
  assert.deepEqual(zero.dish.ingredients, ['rice']);
  const late = fixture(7);
  late.run.dish.quantities = Object.fromEntries(INGREDIENTS.map(i=>[i.id,12]));
  assert.equal(restoreSession(late.run,late.order,7),null);
  late.run.dish.quantities = Object.fromEntries(INGREDIENTS.slice(0,5).map(i=>[i.id,12]));
  assert.equal(Object.values(restoreSession(late.run,late.order,7).dish.quantities).reduce((a,b)=>a+b,0),60);
});
scenario('bad cook fields restart only cooking and preserve an otherwise honest dish', () => {
  const {run,order} = cookingRun();
  for (const [field,value] of [['heat',1.5],['heat',4],['elapsed',55.01],['elapsed',NaN],['temperature',131],['temperature',Infinity],['lastStirAt',30],['stirs',.5],['progress',-1],['scorch',2],['aroma',NaN],['quality',1.1],['finished','false'],['stove',4]]) {
    const candidate = structuredClone(run); candidate.cook[field]=value;
    const restored=restoreSession(candidate,order,1);
    assert.equal(restored.stage,'season',field);
    assert.deepEqual(restored.cook,createCook(),field);
    assert.deepEqual(restored.dish,run.dish,field);
  }
});
scenario('finished cook restores the plating step and uses saved cooking quality', () => {
  const {run,order} = cookingRun();
  while(!run.cook.finished) {
    tickCook(run.cook,.25);
    if(run.cook.elapsed-run.cook.lastStirAt>=6)stirCook(run.cook);
  }
  const restored=restoreSession(run,order,1);
  assert.equal(restored.stage,'ready');assert.equal(restored.room,'kitchen');
  assert.equal(restored.dish.cookQuality,run.cook.quality);
});
scenario('room, bowl and absent cooking prerequisites normalize to reachable screens', () => {
  const {run,order}=fixture();run.room='counter';
  assert.equal(restoreSession(run,order,1).room,'counter');
  run.stage='season';run.bowl='unknown';
  let restored=restoreSession(run,order,1);
  assert.equal(restored.room,'kitchen');assert.equal(restored.bowl,'ivory');
  run.stage='cooking';restored=restoreSession(run,order,1);
  assert.equal(restored.stage,'season');
  run.dish.quantities={fishcake:2};run.dish.ingredients=['fishcake'];
  restored=restoreSession(run,order,1);assert.equal(restored.stage,'prep');
});
scenario('legacy completed dishes and missing ingredients do not lose shop or dish progress',()=>{
  const {run,order}=fixture();delete run.cook;delete run.dish.quantities;
  run.dish.sauce='gochujang';run.stage='ready';run.dish.cookQuality=.93;
  const restored=restoreSession(run,order,1);
  assert.equal(restored.stage,'ready');assert.equal(restored.dish.cookQuality,.93);
  assert.equal(restored.cook.finished,true);
});
