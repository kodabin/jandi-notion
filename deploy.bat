@echo off
REM 자동 배포 스크립트 (Windows)
REM 사용법: deploy.bat "커밋 메시지"

setlocal enabledelayedexpansion

echo ========================================
echo 🚀 자동 배포 시작...
echo ========================================

REM 1. 커밋 메시지 확인
if "%~1"=="" (
    echo ❌ 커밋 메시지를 입력해주세요
    echo 사용법: deploy.bat "커밋 메시지"
    exit /b 1
)

set COMMIT_MESSAGE=%~1

REM 2. 현재 브랜치 확인
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 현재 브랜치: %CURRENT_BRANCH%

REM 3. 변경사항 확인
git status -s > nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Git 저장소를 확인 중...
)

REM 4. Git Add
echo 📦 변경사항 추가 중...
git add .

REM 5. Git Commit
echo 💾 커밋 중...
git commit -m "%COMMIT_MESSAGE%"
if %errorlevel% neq 0 (
    echo ⚠️  커밋할 변경사항이 없습니다
    exit /b 0
)

REM 6. Git Push
echo 🌐 GitHub에 푸시 중...
git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo ❌ Push 실패. 에러를 확인해주세요
    exit /b 1
)

echo ========================================
echo ✅ GitHub Push 완료!
echo 🔄 Vercel이 자동으로 배포를 시작합니다...
echo 📊 배포 상태 확인: https://vercel.com/dashboard
echo ⏳ 배포 완료까지 약 2-3분 소요됩니다
echo ========================================

endlocal
