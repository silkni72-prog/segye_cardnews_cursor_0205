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

**문제 해결**
- `기사를 불러올 수 없습니다`: URL 확인, 해당 사이트 크롤링 가능 여부 확인
- `AI 서비스 오류`: OPENAI_API_KEY 확인
- CORS 오류: .env의 CORS_ORIGIN에 프론트엔드 주소 추가
