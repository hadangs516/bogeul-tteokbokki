# 보글보글 떡볶이 — 자산 출처

## 이 프로젝트용 생성 일러스트

| 파일 | 내용 | 제작일 |
| --- | --- | --- |
| `assets/shop-background.png` | 한국 골목 분식집의 주문 카운터 배경 | 2026-10-25 |
| `assets/customers.png` | 손님 6명, 3열×2행의 투명 배경 시트 | 2026-10-25 |
| `assets/kitchen-background.png` | 햇빛·나무 작업대·주방 선반을 담은 1536×1024 배경 | 2026-10-27 |
| `assets/ingredient-atlas.png` | 재료 10종, 1536×1024 RGBA, 5열×2행 시트 | 2026-10-27 |

모두 OpenAI built-in `image_gen`으로 이 게임을 위해 생성했습니다. 초기 배경·손님의 생성 기록은 [첫 세션 art-prompts.md](../sessions/01_2026-10-25/art-prompts.md)에 있습니다. 새 주방과 재료는 사용자가 `ui` 폴더에 제공한 이미지의 따뜻한 목재·식재료 표현을 참고해 별도로 생성했습니다. 사용자 참고 이미지를 실행 화면의 UI나 배경으로 그대로 넣지 않았습니다.

재료 시트 순서는 위줄 **쌀떡·어묵·대파·치즈·크림**, 아래줄 **라면·소시지·양배추·분모자·버섯**입니다. 재료 트레이에서 CSS로 각 영역을 표시하며, 로드되지 않으면 자체 SVG 재료 그림을 사용합니다. 냄비에 들어간 실제 수량의 재료는 Canvas 2D로 그립니다.

## 글꼴

- `assets/Jua-Regular.ttf`: [Google Fonts의 Jua 공식 배포](https://github.com/google/fonts/tree/main/ofl/jua)
- Copyright 2018 The Jua Project Authors
- SIL Open Font License 1.1. 원문은 [assets/OFL.txt](assets/OFL.txt)에 포함합니다.
- 글꼴을 로컬에서 읽으며 본문과 대체 글꼴에는 기기의 시스템 글꼴을 사용합니다.

## 코드로 그리는 요소

- `src/icons.js`: 인터페이스 아이콘과 재료의 SVG 코드.
- `assets/favicon.svg`: 그릇 모양 SVG 아이콘.
- `src/pan.js`: 붉은 에나멜 냄비, 화구·불꽃, 수량별 재료, 소스·기포·김·주걱, 완성 그릇의 Canvas 2D 표현.
- `src/audio.js`: Web Audio로 합성하는 효과음과 반복 음악. 외부 음원 파일은 사용하지 않습니다.
- `style.css`: 주문 클립보드, 말풍선, 트레이, 단계 표시, 버튼과 보상 효과.

## 게임 기획 참고

아래는 주문·조리·성장 구조와 메뉴 소재의 참고 자료입니다. 다른 게임의 코드·그림·캐릭터·음원을 내려받아 사용한 출처가 아닙니다.

- [Good Pizza, Great Pizza 공식 소개](https://goodpizzagreatpizza.com/press/): 주문 이해 → 조리 → 손님 반응과 성장.
- [Overcooked! All You Can Eat 공식 소개](https://www.team17.com/games/overcooked-all-you-can-eat): 상황 변화와 부담을 낮추는 보조 설정.
- [엽기떡볶이 공식 메뉴](https://www.yupdduk.com/sub/menu/yup-menu): 로제·마라 계열 메뉴 소재.
- [배떡 공식 뉴스](https://baedduck.com/news): 마라로제와 사리 조합 소재.

초기 조사 메모는 [첫 세션 research.md](../sessions/01_2026-10-25/research.md)에 있습니다.
