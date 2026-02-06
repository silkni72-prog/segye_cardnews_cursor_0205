@echo off
chcp 65001 > nul
echo ========================================
echo   로컬 페이지 공유 URL 생성 (ngrok)
echo ========================================
echo.
echo [사전 준비 1] ngrok 최초 사용 시: SETUP_NGROK.bat 실행 후 authtoken 설정
echo               (https://ngrok.com 가입 후 대시보드에서 복사)
echo.
echo [사전 준비 2] START.bat을 실행해 서버가 떠 있어야 합니다.
echo               (http://localhost:3000 이 열려 있어야 함)
echo.
echo [동작] 포트 3000을 인터넷에 노출합니다.
echo        터미널에 출력되는 https://xxxx.ngrok-free.app 주소를 팀원에게 공유하세요.
echo ========================================
echo.
cd /d "%~dp0"
npx --yes ngrok http 3000
pause
