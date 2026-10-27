const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const MAX_SECONDS = 55;
const STIR_COOLDOWN = 1.2;

export function createCook() {
  return {
    elapsed: 0, progress: 0, temperature: 35, heat: 2,
    stirs: 0, lastStirAt: 0, scorch: 0, aroma: 0,
    finished: false, quality: 0, autoFinished: false,
    relaxed: false, stove: 0
  };
}

function complete(cook, automatic) {
  const doneness = clamp(cook.progress / .94, 0, 1);
  const tendingPenalty = Math.max(0, 3 - cook.stirs) * .07;
  const protection = (cook.relaxed ? .55 : 1) * (1 - cook.stove * .12);
  cook.quality = Math.round(clamp(doneness - tendingPenalty - cook.scorch * .55 * protection, 0, 1) * 100) / 100;
  cook.finished = true;
  cook.autoFinished = automatic;
}

export function tickCook(cook, dt, { relaxed = false, stove = 0 } = {}) {
  if (cook.finished || !finite(dt) || dt <= 0) return cook;
  const seconds = Math.min(dt, .25, MAX_SECONDS - cook.elapsed);
  cook.relaxed = !!relaxed;
  cook.stove = finite(stove) ? clamp(Math.floor(stove), 0, 3) : 0;
  cook.elapsed += seconds;
  const target = [28, 68, 96, 125][cook.heat];
  cook.temperature += (target - cook.temperature) * (1 - Math.exp(-.18 * seconds));
  const warmth = clamp((cook.temperature - 45) / 48, 0, 1.22);
  cook.progress = clamp(cook.progress + warmth * seconds / 38, 0, 1);
  const untouched = cook.elapsed - cook.lastStirAt;
  if (cook.temperature > 85 && untouched > 10) {
    cook.scorch = clamp(cook.scorch + seconds * (.014 + Math.max(0, cook.temperature - 100) * .0018), 0, 1);
  }
  cook.aroma = clamp(cook.progress * .65 + Math.min(cook.stirs, 5) * .07 - cook.scorch * .25, 0, 1);
  if (cook.progress >= 1 || cook.elapsed >= MAX_SECONDS) complete(cook, true);
  return cook;
}

export function stirCook(cook) {
  const sinceLast = cook.elapsed - cook.lastStirAt;
  if (cook.finished || sinceLast < STIR_COOLDOWN) return false;
  cook.stirs++;
  cook.lastStirAt = cook.elapsed;
  // The reward is proportional to the rest between stirs, so rapid tapping is unnecessary.
  if (cook.temperature >= 65) cook.progress = clamp(cook.progress + .018 * clamp(sinceLast / 6, 0, 1), 0, 1);
  cook.temperature = Math.max(28, cook.temperature - 1.5);
  cook.aroma = clamp(cook.aroma + .06, 0, 1);
  if (cook.progress >= 1) complete(cook, true);
  return true;
}

export function setHeat(cook, value) {
  if (cook.finished || !Number.isInteger(value) || value < 0 || value > 3) return false;
  cook.heat = value;
  return true;
}

export function finishCook(cook, options = {}) {
  if (!getCookStatus(cook).canFinish) return false;
  if (typeof options.relaxed === 'boolean') cook.relaxed = options.relaxed;
  if (finite(options.stove)) cook.stove = clamp(Math.floor(options.stove), 0, 3);
  complete(cook, false);
  return true;
}

export function getCookStatus(cook) {
  const needsStir = !cook.finished && cook.temperature >= 65 && cook.elapsed - cook.lastStirAt >= 6;
  const canFinish = !cook.finished && cook.progress >= .84;
  const temperatureLabel = cook.temperature > 108 ? '불이 세요' : cook.temperature >= 80 ? '보글보글' : '데우는 중';
  let label = '따끈하게 데우는 중';
  let hint = '중불에서 시작해요. 보글거리면 한 번씩 저어 주세요.';
  if (cook.finished) {
    label = cook.quality >= .9 ? '윤기 나게 완성!' : cook.quality >= .65 ? '한 그릇 완성' : '조리 마무리';
    hint = cook.quality >= .9 ? '소스가 쏙 배었어요. 이제 그릇에 담아 볼까요?' : cook.scorch > .3 ? '다음에는 불을 줄이고 조금씩 저어 주세요.' : '다음에는 충분히 익히며 골고루 저어 주세요.';
  } else if (cook.heat === 0) {
    label = '불이 꺼져 있어요'; hint = '화력을 올려야 떡이 부드럽게 익어요.';
  } else if (cook.temperature > 108) {
    label = '불을 조금 줄여요'; hint = '중불로 낮추고 저으면 바닥에 눌어붙지 않아요.';
  } else if (needsStir) {
    label = '한 번 저어 줄까요?'; hint = '떡과 소스를 골고루 섞어 주세요.';
  } else if (canFinish) {
    label = '이제 담아도 좋아요'; hint = '조금 더 졸이면 소스가 쏙 배어요. 마음에 들면 불을 꺼 주세요.';
  } else if (cook.progress >= .45) {
    label = '소스가 쏙 배는 중'; hint = '좋은 불 조절이에요. 가끔 저어 주면 충분해요.';
  } else if (cook.temperature >= 80) {
    label = '보글보글 익는 중'; hint = '떡이 말랑해지고 있어요. 6초에 한 번 정도 저어 주세요.';
  }
  return { canFinish, label, hint, temperatureLabel, needsStir, progress: clamp(cook.progress, 0, 1) };
}
