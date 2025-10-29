# Auto Deploy Command

**Description**: 자동으로 변경사항을 커밋하고 GitHub에 푸시하여 배포합니다.

---

## 실행할 작업

1. **변경사항 확인**
   - `git status`로 변경된 파일 확인
   - 변경사항이 있는지 검증

2. **CLAUDE.md 업데이트 (필요시)**
   - 새로운 파일이 추가되었는지 확인
   - 프로젝트 구조가 변경되었는지 확인
   - 환경변수나 의존성이 변경되었는지 확인
   - 필요하면 CLAUDE.md 업데이트

3. **자동 배포 실행**
   - `npm run auto-deploy "작업 내용"`
   - Git add, commit, push 자동 실행

4. **결과 보고**
   - 커밋 메시지 표시
   - Push 성공 여부
   - GitHub Actions 링크
   - Vercel Dashboard 링크

---

## 커밋 메시지 규칙

- `feat: 새로운 기능 추가`
- `fix: 버그 수정`
- `docs: 문서 업데이트`
- `refactor: 코드 리팩토링`
- `chore: 기타 변경사항`

---

## 예시

사용자가 `/auto-deploy` 실행 시:

1. 최근 작업 내용을 분석
2. 적절한 커밋 메시지 생성
3. CLAUDE.md 업데이트 (필요시)
4. `npm run auto-deploy "feat: 새 기능 추가"` 실행
5. 배포 상태 보고
