/**
 * 로컬에서 Lambda 함수 테스트
 * 
 * 사용법:
 *   GEMINI_API_KEY=your-api-key node test-local.js
 */

const handler = require('./index').handler;

// 테스트 이벤트 생성
const testEvent = {
  requestContext: {
    http: {
      method: 'POST'
    }
  },
  body: JSON.stringify({
    userAnswer: "I think most people in my country live in Seoul. It's a big city with many opportunities.",
    sampleAnswer: "Well, I think most people in my country live in and around Seoul. As you might expect, Seoul is the busiest city in Korea and a lot of people live there. But I think more people live on the outskirts of Seoul and commute in because the rent is cheaper and the air quality is a bit better than in the city.",
    question: "Which part of your country do most people live in?",
    analysisType: 'similarity'
  })
};

// 환경 변수 설정 (Parameter Store 대신 환경 변수 사용)
process.env.GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ REACT_APP_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  console.log('사용법: REACT_APP_GEMINI_API_KEY=your-api-key node test-local.js');
  process.exit(1);
}

console.log('🧪 Lambda 함수 로컬 테스트 시작...\n');
console.log('테스트 이벤트:', JSON.stringify(testEvent, null, 2));
console.log('\n---\n');

// Lambda 함수 실행
handler(testEvent)
  .then((response) => {
    console.log('✅ 성공!');
    console.log('응답 상태 코드:', response.statusCode);
    console.log('응답 본문:', JSON.stringify(JSON.parse(response.body), null, 2));
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
