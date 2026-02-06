# 🔑 OPENAI_API_KEY 설정 가이드

## 빠른 설정 (Windows)

`backend` 폴더에서 **SETUP_ENV.bat**을 더블클릭하세요.

- .env 파일이 없으면 자동 생성
- 메모장이 열리면 `OPENAI_API_KEY=` 뒤에 실제 키 입력
- 저장 후 `npm start`로 서버 실행

---

## 수동 설정

### 1. .env 파일 생성

`backend` 폴더에 `.env` 파일이 없다면:

```bash
cd backend
copy .env.example .env
```

### 2. API 키 입력

`.env` 파일을 열고 다음을 수정:

```env
OPENAI_API_KEY=sk-proj-여기에실제키입력
```

**주의:**
- 따옴표 사용 금지
- 등호 양옆 공백 금지
- `sk-` 또는 `sk-proj-`로 시작 (소문자)

### 3. API 키 발급

1. https://platform.openai.com/api-keys 접속
2. 로그인 후 "Create new secret key" 클릭
3. 생성된 키 복사 (한 번만 표시됨)
4. .env에 붙여넣기

---

## 확인 방법

서버 실행 시:

```
🤖 OpenAI API: 설정됨   ← 정상
🤖 OpenAI API: 미설정   ← .env 확인 필요
```

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| 미설정으로 표시 | .env 파일이 backend 폴드에 있는지 확인 |
| Incorrect API key | sk- 소문자로 시작하는지, 키 전체 복사했는지 확인 |
| .env 수정 후 반영 안 됨 | 서버 재시작 (Ctrl+C 후 npm start) |
