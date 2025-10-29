#!/usr/bin/env node

/**
 * 자동 배포 헬퍼 스크립트
 * Claude가 작업 완료 후 자동으로 실행
 * 사용법: node scripts/auto-deploy.js "작업 내용"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result?.trim();
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

async function autoDeploy() {
  log('\n========================================', 'magenta');
  log('🤖 자동 배포 시스템 시작', 'magenta');
  log('========================================', 'magenta');

  // 1. 커밋 메시지 확인
  let commitMessage = process.argv.slice(2).join(' ');

  if (!commitMessage) {
    commitMessage = 'chore: 자동 업데이트';
  }

  log(`📝 커밋 메시지: ${commitMessage}`, 'cyan');

  // 2. 현재 브랜치 확인
  const currentBranch = exec('git branch --show-current', { silent: true });
  log(`📍 현재 브랜치: ${currentBranch}`, 'cyan');

  // 3. 변경사항 확인
  const status = exec('git status -s', { silent: true });

  if (!status) {
    log('✓ 변경사항이 없습니다', 'yellow');
    log('배포를 건너뜁니다.\n', 'yellow');
    return;
  }

  log('\n📦 변경된 파일:', 'cyan');
  console.log(status);

  // 4. Git Add
  log('\n📦 git add . 실행 중...', 'cyan');
  exec('git add .');
  log('✓ 완료', 'green');

  // 5. Git Commit
  log('💾 git commit 실행 중...', 'cyan');
  const commitResult = exec(`git commit -m "${commitMessage}"`, { ignoreError: true });

  if (commitResult && commitResult.includes('nothing to commit')) {
    log('✓ 커밋할 변경사항이 없습니다', 'yellow');
  } else {
    log('✓ 커밋 완료', 'green');
  }

  // 6. Git Push
  log('🌐 git push 실행 중...', 'cyan');
  try {
    exec(`git push origin ${currentBranch}`);
    log('✓ Push 완료', 'green');
  } catch (error) {
    log('⚠️  Push 실패 (이미 최신 상태이거나 충돌)', 'yellow');
    log('수동으로 확인이 필요할 수 있습니다.', 'yellow');
  }

  // 7. 배포 상태 확인
  log('\n========================================', 'green');
  log('✅ 자동 배포 완료!', 'green');
  log('========================================', 'green');
  log('', 'reset');
  log('🔄 다음 단계:', 'cyan');
  log('  1. GitHub Actions가 자동으로 실행됩니다', 'cyan');
  log('  2. Supabase 마이그레이션이 적용됩니다', 'cyan');
  log('  3. Vercel에 자동 배포됩니다', 'cyan');
  log('', 'reset');
  log('📊 상태 확인:', 'cyan');
  log('  - GitHub: https://github.com/YOUR_USERNAME/jandi-notion-webhook/actions', 'cyan');
  log('  - Vercel: https://vercel.com/dashboard', 'cyan');
  log('', 'reset');
  log('⏳ 배포 완료까지 약 2-3분 소요', 'yellow');
  log('========================================\n', 'green');
}

// 실행
autoDeploy().catch(error => {
  log(`\n❌ 오류 발생: ${error.message}`, 'red');
  process.exit(1);
});
