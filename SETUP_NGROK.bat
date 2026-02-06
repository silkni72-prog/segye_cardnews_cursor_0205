@echo off
chcp 65001 > nul
echo ========================================
echo   ngrok authtoken 설정 (최초 1회)
echo ========================================
echo.
echo [1] https://ngrok.com 에 접속해 가입(무료)합니다.
echo.
echo [2] 로그인 후 대시보드에서
echo     Your Authtoken (또는 Getting Started - Connect your account)
echo     메뉴로 가서 authtoken을 복사합니다.
echo.
echo [3] 아래에 그 authtoken을 붙여넣고 Enter를 누르세요.
echo     (붙여넣기: 창에 마우스 오른쪽 클릭 또는 Ctrl+V)
echo ========================================
echo.
set "NGROK_TOKEN="
set /p NGROK_TOKEN="Authtoken 입력: "
if "%NGROK_TOKEN%"=="" (
    echo.
    echo [오류] authtoken이 비어 있습니다. 다시 실행해 주세요.
    pause
    exit /b 1
)
echo.
echo authtoken을 설정하는 중...
call npx --yes ngrok config add-authtoken "%NGROK_TOKEN%"
if errorlevel 1 (
    echo.
    echo [오류] 설정에 실패했습니다. authtoken을 확인한 뒤 다시 시도해 주세요.
    pause
    exit /b 1
)
echo.
echo ========================================
echo   설정이 완료되었습니다.
echo   이제 SHARE.bat을 실행해 공유 URL을 만들 수 있습니다.
echo ========================================
pause
