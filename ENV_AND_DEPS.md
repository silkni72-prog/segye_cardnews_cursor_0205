# 📦 환경 변수 및 의존성 정리

## 1. backend/package.json (현재 및 추가 필요)

### 현재 의존성

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.12.0",
    "@google/generative-ai": "^0.1.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "openai": "^4.104.0",
    "puppeteer": "^21.6.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  }
}
```

### 통합 시 추가 필요

| 패키지 | 용도 | one-click-news_cursor 사용 버전 |
|--------|------|--------------------------------|
| `cheerio` | HTML 파싱 (기사 크롤링) | ^1.0.0 |
| `axios` | HTTP 요청 (웹페이지 가져오기) | ^1.7.9 |

**추가 명령:**
```bash
cd backend
npm install cheerio axios
```

---

## 2. .env 환경 변수

### backend/.env.example (통합 후 권장)

```env
# ===== 서버 설정 =====
NODE_ENV=development
PORT=3000

# ===== CORS =====
# 프론트엔드를 실행하는 주소 (예: Live Server 5500, npx serve 3000 등)
CORS_ORIGIN=http://localhost:5500

# ===== AI API 키 (둘 중 하나 이상 필요) =====
# OpenAI (GPT-4o) - 카드뉴스 구조 생성
OPENAI_API_KEY=sk-your-openai-key-here

# Gemini (대안, one-click 로직 사용 시)
GEMINI_API_KEY=AIzaSy-your-gemini-key-here

# ===== 로그 =====
LOG_LEVEL=info
```

### one-click-news_cursor/.env.local 참고

```env
GEMINI_API_KEY=AIzaSy...
GOOGLE_AI_API_KEY=AIzaSy...   # GEMINI_API_KEY와 동일 용도
OPENAI_API_KEY=sk-proj-...
```

---

## 3. API 키 발급

| 서비스 | 발급 URL | 용도 |
|--------|----------|------|
| **OpenAI** | https://platform.openai.com/api-keys | segye 카드뉴스 AI (cardnews-ai-service.js) |
| **Google Gemini** | https://aistudio.google.com/apikey | one-click 스타일 AI (옵션) |

- **OpenAI**: `sk-proj-...` 또는 `sk-...` 형식 (소문자)
- **Gemini**: `AIzaSy...` 형식, 따옴표/공백 없이 입력

---

## 4. 실행 순서

### 1) 백엔드 실행

```bash
cd c:\Users\segye\Desktop\segye_cardnews_cursor\backend
npm install
# .env 파일 생성 후 API 키 설정
npm start
```

### 2) 프론트엔드 실행

**방법 A: Live Server (VS Code 확장)**  
- `index.html` 우클릭 → "Open with Live Server"  
- 보통 `http://127.0.0.1:5500`

**방법 B: npx serve**
```bash
cd c:\Users\segye\Desktop\segye_cardnews_cursor
npx serve .
# http://localhost:3000 (기본)
```

**방법 C: Python**
```bash
cd c:\Users\segye\Desktop\segye_cardnews_cursor
python -m http.server 8080
# http://localhost:8080
```

### 3) CORS 설정

프론트엔드 주소에 맞게 `backend/.env`의 `CORS_ORIGIN` 설정:
- Live Server 5500: `CORS_ORIGIN=http://127.0.0.1:5500`
- npx serve 3000: `CORS_ORIGIN=http://localhost:3000`
- Python 8080: `CORS_ORIGIN=http://localhost:8080`

---

## 5. 통합 후 의존성 비교

| 구분 | segye_cardnews_cursor (현재) | one-click-news_cursor |
|------|------------------------------|------------------------|
| 런타임 | Node.js (Express) | Node.js (Next.js) |
| 크롤링 | ❌ Mock | Cheerio + Axios |
| AI | OpenAI | Gemini / OpenAI |
| 프론트 | HTML/CSS/JS | React + TypeScript |

통합 후 segye 백엔드는 **Cheerio + Axios**를 추가하여 one-click의 크롤링 로직을 사용하게 됩니다.
