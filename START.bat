@echo off
chcp 65001 > nul
echo ========================================
echo   SEGYE.On 카드뉴스 생성 시스템
echo ========================================
echo.

:: Node.js 설치 여부 확인
where node >nul 2>nul
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않거나 PATH에 없습니다.
    echo.
    echo 해결 방법:
    echo   1. https://nodejs.org/ 에서 LTS 버전 다운로드 후 설치
    echo   2. 설치 시 "Add to PATH" 옵션 체크
    echo   3. 설치 후 명령 창을 닫았다가 다시 열고 START.bat 실행
    echo.
    echo 자세한 내용: 이 폴더의 Node설치_안내.md 참고
    echo ========================================
    pause
    exit /b 1
)

echo [1] 백엔드 서버 시작 (API + 웹페이지 통합)
echo     접속 주소: http://localhost:3000
echo.
echo [2] 브라우저에서 위 주소로 접속하세요.
echo     기사 URL 입력 후 "AI로 생성하기" 클릭
echo.
echo 종료: Ctrl+C
echo ========================================
echo.
echo 포트 3000 사용 중이면 기존 프로세스를 종료합니다...
powershell -NoProfile -Command "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Host '포트 3000 해제됨.' } else { Write-Host '포트 3000 사용 중인 프로세스 없음.' }" 2>nul
if errorlevel 1 for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
timeout /t 2 /nobreak > nul
echo.
cd /d "%~dp0backend"
node server.js
pause
