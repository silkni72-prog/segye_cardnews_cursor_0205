# 🔗 카드뉴스 통합 계획서

## 📋 프로젝트 목표

**기사 URL 입력 → AI 자동 카드뉴스 생성 → 결과 화면 표시** 전체 워크플로우 완성

---

## 📁 현재 프로젝트 구조 분석

### 1. segye_cardnews_cursor (메인 - 프론트엔드 UI)

| 구분 | 내용 |
|------|------|
| **프론트엔드** | HTML/CSS/JS (정적 파일) - SEGYE.On One-Click News UI |
| **백엔드** | Express.js (Node.js) - `backend/` 폴더 |
| **포트** | 프론트: 파일 직접 열기 또는 정적 서버 / 백엔드: 3000 |
| **API 연동** | `js/backend-api.js` - `http://localhost:3000` 호출 |

**프론트엔드 기대 응답 형식:**
```json
{
  "success": true,
  "data": {
    "article": { "title": "...", "category": "..." },
    "cardnews": {
      "templateType": "속보형/데이터형/...",
      "cardCount": 6,
      "summary": "...",
      "cards": [
        {
          "cardNumber": 1,
          "type": "cover|content|closing",
          "title": "...",
          "text": "...",
          "html": "<!DOCTYPE html>...",
          "visualConcept": "..."
        }
      ]
    }
  }
}
```

**현재 백엔드 한계:**
- `/api/scrape`: **MOCK 데이터만 반환** (실제 URL 크롤링 없음)
- `/api/cardnews/generate`: 기사 데이터를 **하드코딩된 Mock**으로 사용
- 실제 URL을 입력해도 항상 동일한 Mock 기사로 카드뉴스 생성

---

### 2. one-click-news_cursor (백엔드 로직 소스)

| 구분 | 내용 |
|------|------|
| **스택** | Next.js 15, React 19, TypeScript |
| **API** | `/api/scrape`, `/api/generate`, `/api/rewrite-headline`, `/api/rewrite-quote` |
| **핵심 라이브러리** | Cheerio (크롤링), @google/generative-ai, axios |
| **AI** | Gemini API 우선, OpenAI 폴백 |

**주요 API:**
- **POST /api/scrape**: Cheerio + Axios로 **실제 기사 크롤링**
  - 세계일보 전용 파서 (`article_txt`, `view_txt_con` 등)
  - 반환: `{ title, description, image, url, badge }`
- **POST /api/generate**: Gemini/OpenAI로 7장 카드 콘텐츠 생성
  - 반환 형식: `SevenCardCopy` (headline, quote, beforeAfter, whyImportant, prosCons 등)
  - **형식이 segye 프론트와 다름** → 변환 필요

---

## 🔄 통합 전략

### 선택: **segye_cardnews_cursor 백엔드에 one-click 로직 통합**

**이유:**
1. segye 프론트엔드 UI가 완성되어 있고, 기대하는 응답 형식이 명확함
2. segye 백엔드가 이미 `/api/cardnews/generate`로 올바른 형식 반환
3. one-click의 **실제 크롤링**과 **AI 로직**만 가져와 segye 백엔드에 적용

### 통합 단계

| 단계 | 작업 | 상세 |
|------|------|------|
| **1** | 실제 크롤링 적용 | one-click의 `/api/scrape` 로직을 segye 백엔드에 이식 |
| **2** | 크롤링 결과 → 카드뉴스 AI | Mock 기사 대신 크롤링된 `title`, `content`(description) 사용 |
| **3** | Gemini API 지원 추가 | segye 백엔드에 `@google/generative-ai` 추가, OpenAI와 병행 |
| **4** | 프론트엔드 URL/포트 정리 | CORS, 정적 파일 서빙 방식 통일 |
| **5** | 환경 변수 통합 | `.env` 구조 정리 |

---

## 📂 작업 후 예상 구조

```
segye_cardnews_cursor/
├── index.html, features.html, templates.html, stats.html
├── css/, js/
├── backend/
│   ├── server.js              # Express 서버 (수정)
│   ├── cardnews-ai-service.js # OpenAI 카드 생성 (유지)
│   ├── scraper.js             # [신규] one-click 크롤링 로직
│   ├── package.json           # cheerio, axios 추가
│   ├── .env
│   └── .env.example
├── INTEGRATION_PLAN.md        # 본 문서
└── INTEGRATION_GUIDE.md       # [신규] 설정/실행 가이드
```

---

## 🛠️ 필요한 의존성 및 환경 변수

### backend/package.json 추가 의존성

```json
{
  "dependencies": {
    "cheerio": "^1.0.0",
    "axios": "^1.7.9"
  }
}
```

(기존: express, cors, dotenv, openai 등 유지)

### .env 예시 (.env.example)

```env
# 서버
NODE_ENV=development
PORT=3000

# CORS (프론트엔드 오픈 경로)
CORS_ORIGIN=http://localhost:5500
# 또는 Live Server 등 사용 시 해당 포트

# AI API (둘 중 하나 이상 필수)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=AIzaSy-your-gemini-key-here

# 로그
LOG_LEVEL=info
```

---

## 🔌 API 엔드포인트 정리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| POST | `/api/scrape` | 기사 크롤링 (body: `{ url }`) |
| POST | `/api/analyze` | 기사 분석 (body: `{ title, content }`) |
| POST | `/api/cardnews/generate` | **메인** 카드뉴스 생성 (body: `{ url }`) |
| POST | `/api/images/extract` | 이미지 추출 (body: `{ url }`) |

---

## ⚠️ 주의사항

1. **CORS**: 프론트엔드를 `file://`로 열면 `fetch`가 실패할 수 있음. Live Server(vscode), `npx serve`, `python -m http.server` 등으로 로컬 HTTP 서버 실행 권장.
2. **API 키**: `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 중 하나 이상 필요. 없으면 Mock 모드로 동작할 수 있도록 처리 가능.
3. **크롤링 제한**: 일부 사이트는 robots.txt 또는 보안 정책으로 크롤링을 막을 수 있음. 세계일보(segye.com)는 one-click에서 검증된 선택자 사용.

---

## ✅ 완료 체크리스트

- [x] `backend/package.json`에 cheerio, axios 추가
- [x] `backend/scraper.js` 생성 (one-click scrape 로직 이식)
- [x] `server.js`의 `/api/scrape` 실제 크롤링 연결
- [x] `server.js`의 `/api/cardnews/generate`에서 Mock → 실제 크롤링 기사 사용
- [x] `.env.example` 업데이트 및 `.env` 설정 가이드 작성
- [x] 프론트엔드 `backend-api.js`의 `BACKEND_URL` 확인 (localhost:3000)
- [x] CORS_ORIGIN을 프론트엔드 서버 포트에 맞게 설정
- [ ] 전체 플로우 테스트 (URL 입력 → 생성 → 화면 표시) ← 사용자 직접 테스트

---

*작성일: 2026-02-03*
