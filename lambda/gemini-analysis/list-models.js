/**
 * 사용 가능한 Gemini 모델 목록 확인
 * 
 * 사용법:
 *   REACT_APP_GEMINI_API_KEY=your-api-key node list-models.js
 */

const https = require('https');

const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ REACT_APP_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// v1 API로 모델 목록 가져오기
function listModels(apiVersion = 'v1') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/${apiVersion}/models?key=${apiKey}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nResponse: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 사용 가능한 Gemini 모델 확인 중...\n');

  // v1과 v1beta 모두 시도
  for (const version of ['v1', 'v1beta']) {
    try {
      console.log(`📡 ${version} API 확인 중...`);
      const result = await listModels(version);
      
      if (result.models && result.models.length > 0) {
        console.log(`\n✅ ${version}에서 사용 가능한 모델 (${result.models.length}개):\n`);
        result.models.forEach(model => {
          const name = model.name.replace('models/', '');
          const supportedMethods = model.supportedGenerationMethods || [];
          const hasGenerateContent = supportedMethods.includes('generateContent');
          console.log(`  - ${name}${hasGenerateContent ? ' ✅ generateContent 지원' : ' ❌ generateContent 미지원'}`);
        });
        console.log('');
      } else {
        console.log(`  ⚠️  ${version}에서 모델을 찾을 수 없습니다.\n`);
      }
    } catch (error) {
      console.log(`  ❌ ${version} 오류: ${error.message}\n`);
    }
  }
}

main().catch(console.error);
