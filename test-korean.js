// 한글 테스트 스크립트
const axios = require('axios');

async function testKorean() {
    try {
        const response = await axios.post('http://localhost:3000/webhook/jandi', {
            teamName: '테스트팀',
            roomName: '개발팀',
            userName: '홍길동',
            text: '오늘 프로젝트 회의에서 새로운 기능 개발에 대해 논의했습니다. 사용자 인터페이스 개선과 데이터베이스 최적화가 주요 안건이었습니다.',
            createdAt: '2025-10-15T10:00:00Z'
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        console.log('✅ 성공:', response.data);
    } catch (error) {
        console.error('❌ 실패:', error.response ? error.response.data : error.message);
    }
}

testKorean();
