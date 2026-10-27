export const INGREDIENTS = [
  {id:'rice',name:'쌀떡',color:'#fff4d8',unlockDay:1,servingUnit:'개'},
  {id:'fishcake',name:'어묵',color:'#d6a158',unlockDay:1,servingUnit:'조각'},
  {id:'scallion',name:'대파',color:'#729b49',unlockDay:1,servingUnit:'꼬집'},
  {id:'cheese',name:'치즈',color:'#f6ce64',unlockDay:2,servingUnit:'꼬집'},
  {id:'cream',name:'크림',color:'#fff1d1',unlockDay:3,servingUnit:'스푼'},
  {id:'ramen',name:'라면',color:'#e9c16f',unlockDay:3,servingUnit:'줌'},
  {id:'sausage',name:'소시지',color:'#d88b75',unlockDay:3,servingUnit:'개'},
  {id:'cabbage',name:'양배추',color:'#9ebc79',unlockDay:4,servingUnit:'조각'},
  {id:'glassnoodle',name:'분모자',color:'#e1c6a4',unlockDay:5,servingUnit:'개'},
  {id:'mushroom',name:'버섯',color:'#a77d5e',unlockDay:7,servingUnit:'조각'}
];
export const SAUCES = [
  {id:'gochujang',name:'고추장',color:'#bd3a20',unlockDay:1},
  {id:'rose',name:'로제',color:'#d67654',unlockDay:3},
  {id:'jjajang',name:'짜장',color:'#4c3023',unlockDay:4},
  {id:'mala',name:'마라',color:'#a52e1d',unlockDay:5},
  {id:'cream',name:'크림',color:'#e4c78e',unlockDay:6}
];
export const RECIPES = [
  {id:'classic',name:'골목 떡볶이',sauce:'gochujang',spice:1,ingredients:['rice','fishcake','scallion'],unlockDay:1,description:'처음 만난, 오래 기억할 그 맛.',price:140,quantities:{"rice":6,"fishcake":3,"scallion":2}},
  {id:'cheese',name:'쭉쭉 치즈 떡볶이',sauce:'gochujang',spice:1,ingredients:['rice','fishcake','scallion','cheese'],unlockDay:2,description:'고소한 치즈가 쭈욱!',price:170,quantities:{"rice":6,"fishcake":2,"scallion":1,"cheese":2}},
  {id:'rose',name:'포근 로제 떡볶이',sauce:'rose',spice:1,ingredients:['rice','cream','sausage'],unlockDay:3,description:'부드럽게 감싸는 분홍빛 소스.',price:200,quantities:{"rice":6,"cream":2,"sausage":3}},
  {id:'ramen',name:'후루룩 라볶이',sauce:'gochujang',spice:1,ingredients:['rice','fishcake','scallion','ramen'],unlockDay:3,description:'쫄깃한 떡에 꼬불꼬불 라면.',price:180,quantities:{"rice":5,"fishcake":2,"scallion":2,"ramen":2}},
  {id:'jjajang',name:'달콤 짜장 떡볶이',sauce:'jjajang',spice:0,ingredients:['rice','fishcake','cabbage'],unlockDay:4,description:'맵지 않아서 더 반가운 한 그릇.',price:190,quantities:{"rice":6,"fishcake":3,"cabbage":2}},
  {id:'mala',name:'얼얼 마라 떡볶이',sauce:'mala',spice:2,ingredients:['rice','glassnoodle','cabbage','sausage'],unlockDay:5,description:'분모자까지 쫀득, 기분까지 화끈.',price:240,quantities:{"rice":5,"glassnoodle":3,"cabbage":2,"sausage":3}},
  {id:'cream',name:'눈꽃 크림 떡볶이',sauce:'cream',spice:0,ingredients:['rice','cream','cheese','sausage'],unlockDay:6,description:'하얀 크림 위에 사르르 치즈.',price:230,quantities:{"rice":6,"cream":2,"cheese":2,"sausage":3}},
  {id:'mushroom',name:'숲속 버섯 떡볶이',sauce:'cream',spice:0,ingredients:['rice','cream','mushroom','scallion'],unlockDay:7,description:'숲 향기를 담은 우리 가게의 특별 메뉴.',price:240,quantities:{"rice":6,"cream":2,"mushroom":3,"scallion":1}}
];
export const CUSTOMERS = [
  {name:'소담',tag:'옆집 꽃집 사장님',lines:['꽃집 옆에 떡볶이집이라니, 너무 좋아요!','가게 앞에 작은 화분 하나 놓아드릴까요?','오늘도 꽃 향기 맡고 찾아왔어요.','이 골목에서 제일 따뜻한 자리는 여기네요.']},
  {name:'준',tag:'하교길 단골',lines:['학교 끝나고 제일 먼저 왔어요!','친구한테 여기 맛있다고 말했어요.','시험 끝! 오늘은 떡볶이로 축하할래요.','사장님, 제 자리는 계속 남겨주세요!']},
  {name:'정옥',tag:'골목의 오래된 이웃',lines:['새로 열었구나. 천천히 해도 괜찮아.','이 냄새, 우리 딸 어릴 때가 생각나네.','손맛이 아주 좋아졌어. 내가 보증할게.','내일도 들를게. 우리 오래오래 보자.']},
  {name:'도윤',tag:'바쁜 배달 라이더',lines:['잠깐 쉬어가도 되죠? 배가 고파서요.','여기 오면 하루 피로가 좀 풀려요.','동료들한테도 이 집 알려줬어요.','오늘 마지막 배달 끝! 이제 제 시간이네요.']},
  {name:'해린',tag:'퇴근길 직장인',lines:['오늘 좀 힘들었어요. 맛있는 걸 먹고 싶네요.','회의 끝나자마자 여기 생각났어요.','회사 사람들도 단골이 됐대요.','여기서 먹으면 내일도 괜찮을 것 같아요.']},
  {name:'우주',tag:'골목을 그리는 화가',lines:['소스 색이 정말 예뻐요. 한 그릇 주세요.','가게 풍경을 스케치해도 될까요?','사장님 덕분에 그림이 한 장 늘었어요.','제 첫 전시에 이 가게 그림을 걸 거예요.']}
];
export const UPGRADES = [
  {id:'stove',name:'든든한 화구',description:'센 불에서도 덜 눌어붙고 맛을 지켜줘요.',costs:[280,650,1200],maxLevel:3,icon:'fire'},
  {id:'decor',name:'다정한 가게',description:'가게가 예뻐지고 팁이 10%씩 늘어요.',costs:[220,550,1100],maxLevel:3,icon:'leaf'},
  {id:'patience',name:'편안한 대기석',description:'손님이 15초씩 더 기다려줘요.',costs:[200,500,1000],maxLevel:3,icon:'heart'}
];
export const ACHIEVEMENTS = [
  {id:'first-bowl',name:'첫 한 그릇',description:'첫 손님에게 떡볶이 판매',icon:'bowl'},
  {id:'triple-perfect',name:'손맛이 좋은데?',description:'완벽한 요리 3번 연속',icon:'star'},
  {id:'ten-bowls',name:'소문난 골목집',description:'떡볶이 10그릇 판매',icon:'shop'},
  {id:'all-recipes',name:'떡볶이 연구가',description:'레시피 8종 모두 판매',icon:'book'},
  {id:'best-friend',name:'언제나 그 자리',description:'한 단골과 친밀도 10 달성',icon:'heart'},
  {id:'master-shop',name:'우리 동네 맛집',description:'세 가지 시설 모두 한 번 이상 업그레이드',icon:'trophy'}
];
export const SPICE_NAMES = ['순한맛','보통맛','매운맛','아주 매운맛'];

