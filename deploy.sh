#!/bin/bash

# 자동 배포 스크립트
# 사용법: ./deploy.sh "커밋 메시지"

set -e  # 에러 발생 시 중단

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 자동 배포 시작...${NC}"

# 1. 커밋 메시지 확인
if [ -z "$1" ]; then
    echo -e "${RED}❌ 커밋 메시지를 입력해주세요${NC}"
    echo "사용법: ./deploy.sh \"커밋 메시지\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 2. 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 현재 브랜치: ${CURRENT_BRANCH}${NC}"

# 3. 변경사항 확인
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  변경사항이 없습니다${NC}"
    exit 0
fi

# 4. Git Add
echo -e "${BLUE}📦 변경사항 추가 중...${NC}"
git add .

# 5. Git Commit
echo -e "${BLUE}💾 커밋 중...${NC}"
git commit -m "$COMMIT_MESSAGE"

# 6. Git Push
echo -e "${BLUE}🌐 GitHub에 푸시 중...${NC}"
git push origin $CURRENT_BRANCH

echo -e "${GREEN}✅ GitHub Push 완료!${NC}"
echo -e "${BLUE}🔄 Vercel이 자동으로 배포를 시작합니다...${NC}"
echo -e "${BLUE}📊 배포 상태 확인: https://vercel.com/dashboard${NC}"

# 7. 배포 완료 대기 (선택사항)
echo -e "${YELLOW}⏳ 배포가 완료될 때까지 약 2-3분 소요됩니다${NC}"
