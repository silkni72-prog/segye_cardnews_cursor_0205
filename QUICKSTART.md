# 🚀 카드뉴스 통합 시스템 실행 가이드

## 1. 한 번에 실행 (권장)

`segye_cardnews_cursor` 폴더에서 **START.bat** 더블클릭

또는 터미널에서:
```bash
cd c:\Users\segye\Desktop\segye_cardnews_cursor\backend
npm start
```

브라우저에서 **http://localhost:3000** 접속

## 2. 환경 변수 (.env)

`backend/.env`에 API 키 설정:
- **GEMINI_API_KEY** (권장) 또는 **OPENAI_API_KEY**
- `backend/SETUP_ENV.bat` 실행 시 자동 설정 안내

## 3. 사용 방법

1. http://localhost:3000 접속
2. 기사 URL 입력 (예: `https://www.segye.com/newsView/...`)
3. "AI로 생성하기" 클릭
4. 카드뉴스 생성 완료 후 결과 확인 및 HTML 다운로드

---

## 4. 카드 배경 이미지 파이프라인 (요약)

- **문제**: Generate 후 Save/Serve가 없어 AI 이미지 URL 만료 시 깨짐; PNG 캡처 시 이미지 로드 전에 캡처되어 배경이 빠짐.
- **해결**: (1) 카드 객체에 `backgroundImageUrl` 표준 필드 추가 (convertToSegyeFormat). (2) 디버그용 `/api/debug/card-image`에서 1장 생성·저장 후 `/generated/cards/`에 저장해 공개 URL 반환. (3) PNG 캡처 전 `waitForImagesInDoc`로 이미지 로드 완료 대기 후 html2canvas 실행. (4) 편집 시 `applyBackgroundImageUrlToEdits`로 배경 URL 보정.
- **재현/테스트**: 디버그 API 호출 → 반환 URL 새 탭에서 열기 → 카드 미리보기에서 배경 표시 확인 → PNG 저장 후 이미지 포함 여부 확인. 7장 생성 시 최소 2장 이상 배경 이미지 적용 확인.

---

## 5. 회귀 테스트 (카드 배경색)

배경색 변경 시 텍스트/레이아웃이 깨지지 않는지 확인하는 체크리스트:

- **배경색만 반복 변경**: 2번 카드 선택 → 카드 배경색만 여러 번 바꾼 뒤, 폰트 크기·line-height·text-align·padding/gap·줄바꿈이 유지되는지 확인.
- **다른 옵션 후 배경**: 텍스트 크기(px)·굵기 등 다른 옵션을 건드린 뒤에도 배경색을 바꿔도 위 항목이 유지되는지 확인.
- **PNG export**: 배경만 바꾼 카드로 PNG 저장 후, 미리보기와 동일한지(배경만 바뀌고 레이아웃 동일한지) 확인.

---

**문제 해결**
- `기사를 불러올 수 없습니다`: URL 확인, 해당 사이트 크롤링 가능 여부 확인
- `AI 서비스 오류`: OPENAI_API_KEY 확인
- CORS 오류: .env의 CORS_ORIGIN에 프론트엔드 주소 추가
