@echo off
chcp 65001 >nul
title 세계일보 AI 카드뉴스 백엔드 서버

echo.
echo ====================================================
echo     세계일보 AI 카드뉴스 백엔드 서버 시작
echo ====================================================
echo.

REM 현재 디렉토리 확인
echo [1/5] 현재 위치 확인...
cd /d "%~dp0"
echo     ✓ 위치: %CD%
echo.

REM Node.js 설치 확인
echo [2/5] Node.js 설치 확인...
where node >nul 2>&1
if errorlevel 1 (
    echo     ❌ Node.js가 설치되지 않았습니다!
    echo.
    echo     Node.js 다운로드: https://nodejs.org/
    echo     권장 버전: 18.x 이상
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo     ✓ Node.js %NODE_VERSION% 설치됨
echo.

REM .env 파일 확인 및 생성
echo [3/5] 환경 설정 파일 확인...
if not exist ".env" (
    echo     ⚠ .env 파일이 없습니다. 생성합니다...
    copy ".env.example" ".env" >nul 2>&1
    echo     ✓ .env 파일 생성 완료
    echo.
    echo     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo     🔑 OpenAI API 키를 설정해야 합니다!
    echo     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo     1. 메모장으로 .env 파일을 열겠습니까? (y/n)
    set /p OPEN_ENV="     선택: "
    if /i "%OPEN_ENV%"=="y" (
        notepad .env
        echo.
        echo     API 키를 입력했으면 메모장을 닫고 계속하세요.
        echo.
        set /p CONTINUE="     계속하시겠습니까? (y/n): "
        if /i not "%CONTINUE%"=="y" (
            echo     취소되었습니다.
            pause
            exit /b 0
        )
    ) else (
        echo.
        echo     .env 파일을 직접 수정한 후 다시 실행해주세요.
        pause
        exit /b 0
    )
) else (
    echo     ✓ .env 파일이 존재합니다
)
echo.

REM npm 패키지 설치
echo [4/5] 필요한 패키지 설치...
if not exist "node_modules" (
    echo     📦 패키지를 설치합니다 (1-2분 소요)...
    call npm install
    if errorlevel 1 (
        echo     ❌ 패키지 설치 실패!
        pause
        exit /b 1
    )
    echo     ✓ 패키지 설치 완료!
) else (
    echo     ✓ 패키지가 이미 설치되어 있습니다
)
echo.

REM 서버 시작
echo [5/5] 서버 시작...
echo.
echo ====================================================
echo     🚀 백엔드 서버가 시작됩니다!
echo ====================================================
echo.
echo     서버 주소: http://localhost:3000
echo     API 문서: http://localhost:3000/api/health
echo.
echo     서버를 중지하려면 Ctrl+C를 누르세요.
echo.
echo ====================================================
echo.

REM 서버 실행
node server.js

pause