import { RECIPES, INGREDIENTS, SAUCES, CUSTOMERS, UPGRADES, ACHIEVEMENTS, SPICE_NAMES } from './data.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const integer = (value, min = 0, max = 1e12) => Number.isSafeInteger(value) && value >= min && value <= max;
const nameOf = id => INGREDIENTS.find(item => item.id === id)?.name || id;
const recipeOf = id => RECIPES.find(item => item.id === id);
const copy = value => JSON.parse(JSON.stringify(value));

export function createGame() {
  return {
    version:1, day:1, coins:0, xp:0, totalServed:0, totalEarned:0,
    perfects:0, bestCombo:0, upgrades:{stove:0,decor:0,patience:0},
    bonds:[0,0,0,0,0,0], unlockedAchievements:[], recipesServed:[],
    settings:{sound:true,music:true,relaxed:false}, rng:Math.floor(Math.random()*0xffffffff),
    shift:null
  };
}

function random(state) {
  let x = (state.rng || 0x6d2b79f5) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 0x100000000;
}

export function getDayInfo(value) {
  const day = Math.max(1, Math.floor(finite(value, 1)));
  const chapters = [
    ['처음 여는 가게','오늘은 세 분만, 천천히 시작해요.','첫 영업',1],
    ['치즈가 쭈욱!','오늘부터 치즈 떡볶이를 팔아요.','치즈 신메뉴',1],
    ['분홍빛 신메뉴','로제와 라볶이를 기다리는 손님들.','로제 출시',1.05],
    ['맵지 않아도 맛있지','달콤한 짜장 소스가 도착했어요.','짜장 출시',1.05],
    ['얼얼하게, 쫀득하게','마라와 분모자로 새로운 손맛.','마라 출시',1.1],
    ['포근한 한 그릇','크림 떡볶이로 잠깐 쉬어가요.','크림 출시',1.1],
    ['우리 골목의 작은 축제','버섯 신메뉴와 함께 축제를 열어요.','골목 축제',1.2]
  ];
  const events = [
    ['햇살 좋은 오후','단골들이 하나둘 찾아와요.','골목 산책',1],
    ['비 오는 날의 떡볶이','따끈한 한 그릇이 더 반가운 날.','비 오는 오후',1.1],
    ['방과 후 모임','친구의 친구까지 소문을 들었대요.','방과 후 모임',1.1],
    ['골목 야시장','오늘은 특별히 북적이는 저녁이에요.','골목 야시장',1.2]
  ];
  const [title, subtitle, event, multiplier] = day <= 7 ? chapters[day-1] : events[(day-8)%events.length];
  return {title, subtitle, event, multiplier, target:Math.round((day===1?400:Math.min(1500,450+day*95))*multiplier)};
}

const DEFAULT_QUANTITIES = {rice:6,fishcake:3,scallion:2,cheese:2,cream:2,ramen:2,sausage:3,cabbage:2,glassnoodle:3,mushroom:3};

function quantitiesFor(recipe, ingredients = recipe.ingredients) {
  return Object.fromEntries(ingredients.map(id => [id, recipe.quantities[id] || DEFAULT_QUANTITIES[id] || 2]));
}

function personalRequest(customer, recipe, day) {
  const quantities = {...recipe.quantities};
  let spice = recipe.spice;
  let preference = '';
  const add = (id, count = 1) => { quantities[id] = Math.min(12, (quantities[id] || 0) + count); };
  const amount = id => nameOf(id) + ' ' + quantities[id] + (INGREDIENTS.find(item => item.id === id)?.servingUnit || '개');
  if (customer === 0) {
    add('scallion', 1);
    preference = '파 향이 좋아요. ' + amount('scallion') + '으로 부탁해요.';
  } else if (customer === 1) {
    add('rice', 2);
    preference = '오늘 배고파요! ' + amount('rice') + '로 넉넉하게요.';
  } else if (customer === 2) {
    spice = 0;
    add('fishcake', quantities.fishcake ? 1 : 2);
    preference = '맵지 않게, ' + amount('fishcake') + '으로 부탁해.';
  } else if (customer === 3) {
    add('rice', 1);
    const topping = day >= 3 ? 'sausage' : 'fishcake';
    add(topping, 1);
    preference = '든든하게 먹을게요. ' + amount('rice') + ', ' + amount(topping) + ' 주세요.';
  } else if (customer === 4) {
    spice = Math.min(3, recipe.spice + 1);
    if (quantities.scallion) {
      delete quantities.scallion;
      preference = SPICE_NAMES[spice] + '으로요. 대파는 빼 주세요.';
    } else {
      const topping = day >= 2 ? 'cheese' : 'fishcake';
      add(topping, 2);
      preference = SPICE_NAMES[spice] + '에 ' + amount(topping) + '을 곁들여 주세요.';
    }
  } else {
    const vegetable = day >= 4 ? 'cabbage' : 'scallion';
    add(vegetable, 2);
    const hadSausage = !!quantities.sausage;
    delete quantities.sausage;
    preference = '채소가 좋아요. ' + amount(vegetable) + ' 주세요.' + (hadSausage ? ' 소시지는 빼고요.' : '');
  }
  return {quantities, spice, preference};
}

export function startDay(state) {
  if (state.shift) return state.shift;
  const day = state.day;
  const total = Math.min(7, 3 + Math.floor(day / 2));
  const available = RECIPES.filter(item => item.unlockDay <= day);
  const featured = RECIPES.filter(item => item.unlockDay === day);
  const orders = [];
  for (let index = 0; index < total; index++) {
    const recipe = featured[index] || available[Math.floor(random(state) * available.length)];
    const customer = day === 1 ? index : (day + index - 2) % CUSTOMERS.length;
    // The first order of each new recipe teaches its base amounts before personal requests.
    const request = index < featured.length
      ? {quantities:{...recipe.quantities}, spice:recipe.spice, preference:'기본 레시피 그대로 부탁해요.'}
      : personalRequest(customer, recipe, day);
    const {quantities, spice, preference} = request;
    const ingredients = Object.keys(quantities);
    const omitted = recipe.ingredients.filter(id => !ingredients.includes(id));
    const added = ingredients.filter(id => !recipe.ingredients.includes(id));
    orders.push({
      id:'day-' + day + '-order-' + index, customer, name:CUSTOMERS[customer].name,
      recipeId:recipe.id, sauce:recipe.sauce, spice, ingredients, quantities, preference,
      text:recipe.name + ' 하나요! ' + preference,
      omitted, added, price:recipe.price + added.length * 20,
      patience:Math.max(90, 115 - Math.max(0, day - 2) * 3) + state.upgrades.patience * 15
    });
  }
  state.shift = {index:0,total,earned:0,tips:0,perfect:0,served:0,combo:0,orders};
  return state.shift;
}

export function getOrder(state) {
  return state.shift?.orders[state.shift.index] || null;
}

export function assessDish(order,dish={},elapsedSeconds=0,state) {
  const measuresAmounts = Object.prototype.hasOwnProperty.call(dish, 'quantities');
  const expectedAmounts = order.quantities || quantitiesFor(recipeOf(order.recipeId), order.ingredients);
  const actualAmounts = measuresAmounts && dish.quantities && typeof dish.quantities === 'object' && !Array.isArray(dish.quantities)
    ? Object.fromEntries(Object.entries(dish.quantities).filter(([,value]) => integer(value,1,12))) : {};
  // Ingredient-only submissions remain compatible with saved games from the first release.
  const wanted = new Set(measuresAmounts ? Object.keys(expectedAmounts) : Array.isArray(order.ingredients) ? order.ingredients : []);
  const actual = new Set(measuresAmounts ? Object.keys(actualAmounts) : Array.isArray(dish.ingredients) ? dish.ingredients.filter(id => typeof id === 'string') : []);
  const missing = [...wanted].filter(id => !actual.has(id));
  const extra = [...actual].filter(id => !wanted.has(id));
  const quantityErrors = measuresAmounts ? [...wanted].filter(id => actual.has(id) && expectedAmounts[id] !== actualAmounts[id])
    .map(id => ({id,expected:expectedAmounts[id],actual:actualAmounts[id],difference:actualAmounts[id]-expectedAmounts[id]})) : [];
  const quantityPenalty = quantityErrors.reduce((sum, item) => sum + Math.min(16,Math.abs(item.difference)*2),0);
  const quality=clamp(finite(dish.cookQuality),0,1);
  const wrongSauce=dish.sauce!==order.sauce;
  const wrongSpice=typeof dish.spice!=='number'||!Number.isFinite(dish.spice)||dish.spice!==order.spice;
  const spiceDifference=wrongSpice?clamp(Math.abs(finite(dish.spice,-3)-order.spice),1,3):0;
  const elapsed=Number.isFinite(elapsedSeconds)?Math.max(0,elapsedSeconds):100000;
  const patiencePenalty=state.day===1||state.settings.relaxed?0:Math.min(10,Math.max(0,(elapsed-order.patience)/3));
  const score=Math.round(clamp(100-missing.length*18-extra.length*12-quantityPenalty-(wrongSauce?25:0)-spiceDifference*8-(1-quality)*30-patiencePenalty,0,100));
  const grade=score>=94?'perfect':score>=75?'good':score>=50?'okay':'bad';
  const combo=state.shift?.combo||0;
  const base=Math.round(order.price*(.4+.006*score)*getDayInfo(state.day).multiplier);
  const tipRate=grade==='perfect'?.25+Math.min(combo,5)*.04:grade==='good'?.12:grade==='okay'?.03:0;
  const tip=Math.round(order.price*tipRate*(1+state.upgrades.decor*.1));
  const feedback=[];
  if(wrongSauce)feedback.push((SAUCES.find(item=>item.id===order.sauce)?.name||'주문한')+' 소스였으면 더 좋았겠어요.');
  if(missing.length)feedback.push(missing.map(nameOf).join('·')+'이 빠졌어요.');
  if(extra.length)feedback.push(extra.map(nameOf).join('·')+'은 안 넣어도 돼요.');
  if(quantityErrors.length) {
    const item = quantityErrors[0];
    const unit = INGREDIENTS.find(ingredient => ingredient.id === item.id)?.servingUnit || '개';
    feedback.push(nameOf(item.id) + '은 ' + item.expected + unit + ' 정도가 제 취향이에요.');
  }
  if(wrongSpice)feedback.push(SPICE_NAMES[order.spice]+'을 부탁했어요.');
  if(quality<.7)feedback.push('불 조절과 젓기를 조금만 더 신경 써 주세요.');
  if(!feedback.length&&patiencePenalty>0)feedback.push('맛있어요! 다음엔 조금만 더 빨리 부탁해요.');
  if(!feedback.length)feedback.push(grade==='perfect'?'딱 제가 원하던 맛이에요!': '맛있게 잘 먹을게요!');
  return {
    orderId:order.id,score,grade,coins:base+tip,base,tip,
    xp:grade==='perfect'?40:grade==='good'?30:grade==='okay'?22:15,
    feedback:feedback.join(' '),missing,extra,wrongSauce,wrongSpice,
    cookQuality:quality,patiencePenalty,quantityErrors,quantityPenalty
  };
}

export function levelInfo(value) {
  const xp=Math.max(0,finite(value));
  let level=1;
  while(level<50&&xp>=50*level*(level+1))level++;
  const startXp=50*(level-1)*level;
  const nextXp=level===50?0:50*level*(level+1);
  const titles=['새내기 사장님','골목의 요리사','소문난 손맛','단골의 맛집','떡볶이 장인','골목의 전설'];
  return {level,title:titles[Math.min(titles.length-1,Math.floor((level-1)/2))],progress:level===50?1:clamp((xp-startXp)/(nextXp-startXp),0,1),nextXp,startXp,toNext:Math.max(0,nextXp-xp)};
}

function awardAchievements(state) {
  const conditions={
    'first-bowl':state.totalServed>=1,
    'triple-perfect':state.bestCombo>=3,
    'ten-bowls':state.totalServed>=10,
    'all-recipes':RECIPES.every(item=>state.recipesServed.includes(item.id)),
    'best-friend':state.bonds.some(value=>value>=10),
    'master-shop':UPGRADES.every(item=>state.upgrades[item.id]>0)
  };
  const fresh=ACHIEVEMENTS.filter(item=>conditions[item.id]&&!state.unlockedAchievements.includes(item.id)).map(item=>item.id);
  state.unlockedAchievements.push(...fresh);
  return fresh;
}

export function serveOrder(state,result) {
  const order=getOrder(state);
  const rejected={accepted:false,dayFinished:!order&&!!state.shift,achievements:[],levelUp:false};
  if(!order||!result||result.orderId!==order.id||!integer(result.coins,0,100000)||!integer(result.tip,0,result.coins)||!integer(result.xp,0,1000)||!integer(result.score,0,100)||!['perfect','good','okay','bad'].includes(result.grade))return rejected;
  const beforeLevel=levelInfo(state.xp).level;
  const beforeBond=state.bonds[order.customer];
  state.coins+=result.coins;state.totalEarned+=result.coins;state.xp+=result.xp;state.totalServed++;
  const shift=state.shift;
  shift.earned+=result.coins;shift.tips+=result.tip;shift.served++;
  if(result.grade==='perfect'){state.perfects++;shift.perfect++;shift.combo++;}else{shift.combo=0;}
  state.bestCombo=Math.max(state.bestCombo,shift.combo);
  if(result.grade!=='bad')state.bonds[order.customer]+=result.grade==='perfect'?2:1;
  if(!state.recipesServed.includes(order.recipeId))state.recipesServed.push(order.recipeId);
  shift.index++;
  const lines=CUSTOMERS[order.customer].lines;
  const storyLevel=Math.min(lines.length-1,Math.floor(state.bonds[order.customer]/5));
  const story=(beforeBond===0||Math.floor(beforeBond/5)<Math.floor(state.bonds[order.customer]/5))&&result.grade!=='bad'
    ?{customer:order.customer,name:order.name,text:lines[storyLevel],level:storyLevel}:null;
  return {accepted:true,dayFinished:shift.index>=shift.total,achievements:awardAchievements(state),levelUp:levelInfo(state.xp).level>beforeLevel,story};
}

export function finishDay(state) {
  if(!state.shift||state.shift.index!==state.shift.total)return {ok:false,unlocked:[]};
  const day=state.day, shift=state.shift;
  const summary={ok:true,day,earned:shift.earned,tips:shift.tips,perfect:shift.perfect,served:shift.served,target:getDayInfo(day).target,unlocked:RECIPES.filter(item=>item.unlockDay===day+1).map(item=>item.id)};
  state.day++;state.shift=null;
  return summary;
}

export function purchaseUpgrade(state,id) {
  const item=UPGRADES.find(value=>value.id===id);
  if(!item)return {ok:false,reason:'찾을 수 없는 시설이에요.'};
  const level=state.upgrades[id];
  if(level>=item.maxLevel)return {ok:false,reason:'이미 최고 단계예요.'};
  const cost=item.costs[level];
  if(state.coins<cost)return {ok:false,reason:'동전이 조금 더 필요해요.'};
  state.coins-=cost;state.upgrades[id]++;
  return {ok:true,reason:'가게가 한 뼘 더 자랐어요!',level:state.upgrades[id],cost,achievements:awardAchievements(state)};
}

function validOrder(order,day,index) {
  const recipe=recipeOf(order?.recipeId);
  if(!order||typeof order!=='object'||Array.isArray(order)||!recipe||recipe.unlockDay>day)return false;
  if(order.id!=='day-'+day+'-order-'+index||!integer(order.customer,0,5)||order.name!==CUSTOMERS[order.customer].name)return false;
  if(order.sauce!==recipe.sauce||!integer(order.spice,0,3)||!integer(order.price,1,10000)||!integer(order.patience,1,1000))return false;
  if(typeof order.text!=='string'||order.text.length>500||!Array.isArray(order.ingredients)||order.ingredients.length>10||!order.ingredients.includes('rice')||new Set(order.ingredients).size!==order.ingredients.length)return false;
  if(!order.ingredients.every(id=>INGREDIENTS.some(item=>item.id===id&&item.unlockDay<=day)))return false;
  for(const key of ['added','omitted'])if(order[key]!==undefined&&(!Array.isArray(order[key])||!order[key].every(id=>INGREDIENTS.some(item=>item.id===id))))return false;
  if(order.preference!==undefined&&(typeof order.preference!=='string'||order.preference.length>300))return false;
  if(order.quantities!==undefined){
    if(!order.quantities||typeof order.quantities!=='object'||Array.isArray(order.quantities))return false;
    const entries=Object.entries(order.quantities);
    if(entries.length!==order.ingredients.length||!entries.every(([id,amount])=>order.ingredients.includes(id)&&integer(amount,1,12)))return false;
    if(entries.reduce((sum,[,amount])=>sum+amount,0)>50)return false;
  }
  return true;
}

export function validateSave(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)return null;
  for(const key of ['coins','xp','totalServed','perfects','bestCombo'])if(!integer(value[key]))return null;
  if(!integer(value.day,1,1000000)||value.perfects>value.totalServed||value.bestCombo>value.perfects)return null;
  if(!value.upgrades||!UPGRADES.every(item=>integer(value.upgrades[item.id],0,item.maxLevel)))return null;
  if(!Array.isArray(value.bonds)||value.bonds.length!==6||!value.bonds.every(item=>integer(item)))return null;
  if(!value.settings||!['sound','music','relaxed'].every(key=>typeof value.settings[key]==='boolean'))return null;
  if(!Array.isArray(value.unlockedAchievements)||!value.unlockedAchievements.every(id=>ACHIEVEMENTS.some(item=>item.id===id))||new Set(value.unlockedAchievements).size!==value.unlockedAchievements.length)return null;
  if(value.totalEarned!==undefined&&!integer(value.totalEarned))return null;
  if(value.rng!==undefined&&!integer(value.rng,0,0xffffffff))return null;
  if(value.recipesServed!==undefined&&(!Array.isArray(value.recipesServed)||!value.recipesServed.every(id=>RECIPES.some(item=>item.id===id))))return null;
  const shift=value.shift;
  if(shift!==null){
    if(!shift||typeof shift!=='object'||!integer(shift.total,3,7)||!integer(shift.index,0,shift.total)||!integer(shift.served,0,shift.total)||shift.served!==shift.index)return null;
    for(const key of ['earned','tips','perfect','combo'])if(!integer(shift[key]))return null;
    if(shift.perfect>shift.served||shift.combo>shift.perfect||shift.tips>shift.earned||!Array.isArray(shift.orders)||shift.orders.length!==shift.total)return null;
    if(!shift.orders.every((order,index)=>validOrder(order,value.day,index)))return null;
  }
  // Only retain known state fields. Unknown input never becomes part of saved state.
  const state=createGame();
  for(const key of ['day','coins','xp','totalServed','perfects','bestCombo','upgrades','bonds','unlockedAchievements','settings','shift'])state[key]=copy(value[key]);
  state.totalEarned=value.totalEarned??value.coins;
  state.rng=value.rng??123456;
  state.recipesServed=[...new Set(value.recipesServed||[])];
  if(state.shift){
    for(const order of state.shift.orders){
      order.quantities = order.quantities || quantitiesFor(recipeOf(order.recipeId), order.ingredients);
      order.preference = order.preference || '';
      order.patience = Math.max(90, order.patience);
    }
  }
  return state;
}

