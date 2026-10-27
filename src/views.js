import {RECIPES,INGREDIENTS,SAUCES,CUSTOMERS,UPGRADES,ACHIEVEMENTS,SPICE_NAMES} from './data.js';
import {icon,food} from './icons.js';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const portraitStyle=index=>'background-position:'+((index%3)*50)+'% '+(index>=3?100:0)+'%;'+(index===4?'clip-path:inset(0 0 0 6%);':'');
const ingredientName=id=>INGREDIENTS.find(i=>i.id===id)?.name||id;
const header=title=>'<div class="modal-head"><h2 id="panel-title">'+title+'</h2><button class="icon-btn" data-action="close" aria-label="닫기">'+icon('close')+'</button></div>';
function recipes(state){return header('우리 가게 레시피')+'<p class="modal-sub">하루하루, 새로운 맛을 배워요.</p><div class="recipe-grid">'+RECIPES.map(r=>{
 const unlocked=r.unlockDay<=state.day,sauce=SAUCES.find(s=>s.id===r.sauce);
 return '<article class="recipe-card '+(!unlocked?'locked':'')+'"><div class="recipe-art">'+(unlocked?'<div class="mini-bowl" style="--sauce:'+sauce.color+'">'+food(r.id==='classic'?'rice':r.ingredients.at(-1))+'</div>':icon('lock'))+'</div><div><h3>'+r.name+'</h3><p>'+r.description+'</p><p>'+sauce.name+' · '+SPICE_NAMES[r.spice]+'</p>'+(unlocked?'<div class="recipe-parts">'+r.ingredients.map(id=>ingredientName(id)+' '+r.quantities[id]+(INGREDIENTS.find(i=>i.id===id)?.servingUnit||'개')).join(' · ')+'</div>':'<span class="unlock-tag">'+r.unlockDay+'일차에 열려요</span>')+'</div></article>';
 }).join('')+'</div>';}
function shop(state){return header('조금 더 다정한 가게')+'<p class="modal-sub">보유 동전 '+state.coins.toLocaleString('ko-KR')+' · 손님들이 변화를 알아봐요.</p><div class="upgrade-list">'+UPGRADES.map(u=>{
 const lv=state.upgrades[u.id],max=lv>=u.maxLevel,cost=u.costs[lv];return '<article class="upgrade"><div class="upgrade-symbol">'+icon(u.icon)+'</div><div><h3>'+u.name+'</h3><p>'+u.description+'</p><div class="upgrade-level" aria-label="'+lv+' / '+u.maxLevel+'단계">'+Array.from({length:u.maxLevel},(_,i)=>'<i class="'+(i<lv?'filled':'')+'"></i>').join('')+'</div></div><button class="btn '+(max?'secondary':'green')+'" data-action="buy" data-id="'+u.id+'" '+(max||state.coins<cost?'disabled':'')+'>'+icon(max?'check':'coin')+(max?'최고 단계':cost.toLocaleString('ko-KR'))+'</button></article>';
 }).join('')+'</div>';}
function friends(state){return header('골목의 익숙한 얼굴들')+'<p class="modal-sub">맛있는 한 그릇이 쌓이면, 우리도 가까워져요.</p><div class="friend-grid">'+CUSTOMERS.map((c,i)=>{
 const bond=state.bonds[i],story=c.lines[Math.min(c.lines.length-1,Math.floor(bond/5))];return '<article class="friend"><div class="avatar"><div class="portrait" style="'+portraitStyle(i)+'"></div></div><h3>'+c.name+'</h3><p>'+c.tag+'</p><div class="bond-hearts" aria-label="친밀도 '+bond+'">'+Array.from({length:5},(_,h)=>icon('heart',h<Math.ceil(bond/2)?'filled':'')).join('')+'</div><p>'+escapeHtml(bond?story:'아직 만나지 않은 이웃이에요.')+'</p></article>';
 }).join('')+'</div><div class="achievement-list" aria-label="업적">'+ACHIEVEMENTS.map(a=>'<div class="achievement '+(state.unlockedAchievements.includes(a.id)?'earned':'')+'" title="'+escapeHtml(a.description)+'">'+icon(a.icon)+a.name+'</div>').join('')+'</div>';}
function settings(state){return header('잠깐 쉬어가기')+[['sound','효과음','재료가 쏙, 동전이 짤랑'],['music','배경 음악','가게에 흐르는 작은 멜로디'],['relaxed','느긋하게 만들기','손님은 느긋하게, 냄비는 덜 타게']].map(([key,name,desc])=>'<div class="settings-row"><div><b>'+name+'</b><p>'+desc+'</p></div><button class="toggle '+(state.settings[key]?'on':'')+'" data-action="toggle" data-key="'+key+'" role="switch" aria-label="'+name+'" aria-checked="'+state.settings[key]+'"></button></div>').join('')+'<p class="settings-note">지금은 조리와 기다림 시간이 멈춰 있어요.<br>진행 상황은 이 브라우저에 자동 저장됩니다.<br>PC: 재료 1~9 · Space 젓기 · Esc 일시 정지</p><button class="reset-btn" data-action="reset-confirm">가게 처음부터 다시 시작</button>';}
export function renderPanel(type,state){const renderers={recipes,shop,friends,settings};return renderers[type]?'<section class="modal '+(type==='settings'?'small':'')+'" aria-labelledby="panel-title">'+renderers[type](state)+'</section>':'';}



