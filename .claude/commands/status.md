# Status Command

**Description**: 프로젝트의 현재 상태를 종합적으로 확인합니다.

---

## 실행할 작업

1. **Git 상태 확인**
   ```bash
   git status
   git log --oneline -5
   ```

2. **변경된 파일 목록**
   - 수정된 파일
   - 추가된 파일
   - 삭제된 파일

3. **배포 상태 확인**
   - GitHub Actions 최근 실행 상태
   - Vercel 배포 상태
   - Supabase 연결 상태

4. **환경 설정 확인**
   - .env 파일 존재 여부
   - 필수 환경변수 설정 여부
   - package.json 의존성 설치 상태

5. **문서 동기화 상태**
   - CLAUDE.md가 최신인지 확인
   - README.md 업데이트 필요 여부

6. **종합 리포트 제공**
   - ✅ 정상
   - ⚠️ 주의 필요
   - ❌ 오류 발견

---

## 출력 예시

```
📊 프로젝트 상태 리포트
=======================

Git 상태:
  ✅ 브랜치: main
  ✅ 커밋: 최신 (5분 전)
  ⚠️ 변경사항: 3개 파일

배포 상태:
  ✅ GitHub Actions: 성공
  ✅ Vercel: 배포됨
  ✅ Supabase: 연결됨

환경 설정:
  ✅ .env 파일 존재
  ✅ 환경변수 설정 완료
  ✅ 의존성 설치됨

문서 상태:
  ✅ CLAUDE.md 최신
  ✅ README.md 최신

전체 상태: ✅ 정상
```
