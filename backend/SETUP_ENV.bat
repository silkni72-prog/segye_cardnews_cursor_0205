@echo off
chcp 65001 > nul
echo ========================================
echo   OPENAI_API_KEY 설정
echo ========================================
echo.

if not exist .env (
    echo [1] .env 파일이 없습니다. .env.example을 복사합니다...
    copy .env.example .env
    echo.
    echo [2] .env 파일이 생성되었습니다.
) else (
    echo [1] .env 파일이 이미 존재합니다.
)

echo.
echo [3] .env 파일을 열어 OPENAI_API_KEY를 입력해주세요.
echo     - OpenAI 키: https://platform.openai.com/api-keys
echo     - 형식: sk-proj-... 또는 sk-...
echo.
echo     편집기가 곧 열립니다...
timeout /t 2 > nul
notepad .env

echo.
echo 설정이 완료되었습니다. 'npm start'로 서버를 실행하세요.
pause
