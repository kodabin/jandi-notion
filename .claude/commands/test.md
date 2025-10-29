# Test Command

**Description**: API 엔드포인트를 테스트합니다.

---

## 실행할 작업

1. **서버 상태 확인**
   - 서버가 실행 중인지 확인
   - 실행 중이 아니면 `npm start` 안내

2. **웹훅 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/webhook/jandi \
     -H "Content-Type: application/json" \
     -d '{
       "teamName": "테스트팀",
       "roomName": "테스트룸",
       "userName": "테스터",
       "text": "API 테스트 메시지입니다.",
       "createdAt": "2025-10-29T00:00:00Z"
     }'
   ```

3. **AI 요약 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/test-ai-summary \
     -H "Content-Type: application/json" \
     -d '{"text":"오늘 회의에서 프로젝트 일정을 논의했습니다."}'
   ```

4. **로그 확인**
   ```bash
   curl http://localhost:3000/api/logs?limit=5
   ```

5. **결과 분석**
   - 각 API 응답 확인
   - 성공/실패 여부 보고
   - 오류 발견 시 해결 방법 제시

---

## 옵션

- `/test webhook` - 웹훅만 테스트
- `/test ai` - AI 요약만 테스트
- `/test all` - 모든 API 테스트 (기본값)

---

## 출력 예시

```
🧪 API 테스트 실행
==================

1. 웹훅 테스트
   ✅ 성공 (응답시간: 234ms)
   📝 webhookId: webhook_1730000000000_abc123

2. AI 요약 테스트
   ✅ 성공 (응답시간: 2.1s)
   📝 요약: "프로젝트 일정 논의"

3. 로그 조회 테스트
   ✅ 성공 (5개 로그 조회)

전체 테스트: ✅ 통과
```
