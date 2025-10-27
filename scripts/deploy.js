#!/usr/bin/env node

/**
 * 자동 배포 스크립트 (Node.js)
 * 사용법: npm run deploy "커밋 메시지"
 */

const { execSync } = require('child_process');
const readline = require('readline');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function deploy() {
  log('========================================', 'blue');
  log('🚀 자동 배포 시작...', 'blue');
  log('========================================', 'blue');

  // 1. 커밋 메시지 확인
  let commitMessage = process.argv.slice(2).join(' ');

  if (!commitMessage) {
    commitMessage = await askQuestion('📝 커밋 메시지를 입력하세요: ');

    if (!commitMessage) {
      log('❌ 커밋 메시지가 비어있습니다', 'red');
      log('사용법: npm run deploy "커밋 메시지"', 'yellow');
      process.exit(1);
    }
  }

  // 2. 현재 브랜치 확인
  const currentBranch = exec('git branch --show-current', { silent: true });
  log(`📍 현재 브랜치: ${currentBranch}`, 'cyan');

  // 3. 변경사항 확인
  const status = exec('git status -s', { silent: true });

  if (!status) {
    log('⚠️  변경사항이 없습니다', 'yellow');
    process.exit(0);
  }

  log('\n변경된 파일:', 'cyan');
  console.log(status);
  console.log('');

  // 4. 확인
  const confirm = await askQuestion('이 변경사항을 배포하시겠습니까? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    log('❌ 배포가 취소되었습니다', 'yellow');
    process.exit(0);
  }

  // 5. Git Add
  log('\n📦 변경사항 추가 중...', 'cyan');
  exec('git add .');

  // 6. Git Commit
  log('💾 커밋 중...', 'cyan');
  exec(`git commit -m "${commitMessage}"`, { ignoreError: true });

  // 7. Git Push
  log('🌐 GitHub에 푸시 중...', 'cyan');
  try {
    exec(`git push origin ${currentBranch}`);
  } catch (error) {
    log('❌ Push 실패', 'red');
    log('해결 방법:', 'yellow');
    log('1. 브랜치 이름 확인: git branch', 'yellow');
    log('2. 원격 저장소 확인: git remote -v', 'yellow');
    log(`3. 수동 push: git push origin ${currentBranch}`, 'yellow');
    process.exit(1);
  }

  // 8. 완료 메시지
  log('\n========================================', 'green');
  log('✅ GitHub Push 완료!', 'green');
  log('========================================', 'green');
  log('🔄 Vercel이 자동으로 배포를 시작합니다...', 'cyan');
  log('📊 배포 상태 확인: https://vercel.com/dashboard', 'cyan');
  log('⏳ 배포 완료까지 약 2-3분 소요됩니다', 'yellow');
  log('========================================', 'green');
}

// 실행
deploy().catch(error => {
  log(`\n❌ 오류 발생: ${error.message}`, 'red');
  process.exit(1);
});
