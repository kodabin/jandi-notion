# 자동 배포 스크립트 (PowerShell)
# 사용법: .\deploy.ps1 "커밋 메시지"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "========================================" -ForegroundColor Blue
Write-Host "🚀 자동 배포 시작..." -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# 1. 현재 브랜치 확인
$currentBranch = git branch --show-current
Write-Host "📍 현재 브랜치: $currentBranch" -ForegroundColor Cyan

# 2. 변경사항 확인
$status = git status -s
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "⚠️  변경사항이 없습니다" -ForegroundColor Yellow
    exit 0
}

# 3. Git Add
Write-Host "📦 변경사항 추가 중..." -ForegroundColor Cyan
git add .

# 4. Git Commit
Write-Host "💾 커밋 중..." -ForegroundColor Cyan
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  커밋할 변경사항이 없습니다" -ForegroundColor Yellow
    exit 0
}

# 5. Git Push
Write-Host "🌐 GitHub에 푸시 중..." -ForegroundColor Cyan
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push 실패. 에러를 확인해주세요" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ GitHub Push 완료!" -ForegroundColor Green
Write-Host "🔄 Vercel이 자동으로 배포를 시작합니다..." -ForegroundColor Cyan
Write-Host "📊 배포 상태 확인: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "⏳ 배포 완료까지 약 2-3분 소요됩니다" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
