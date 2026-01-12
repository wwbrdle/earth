# Gemini Analysis Lambda Function

AWS Lambda 함수로 Gemini API를 호출하여 IELTS 답변을 분석합니다.

## 기능

- **유사도 분석**: 사용자 답변과 모범 답안 비교
- **문법 검사**: 문법 오류 및 수정 제안
- **개선 제안**: 구체적인 개선 사항 제공

## 환경 변수

### 프로덕션
- AWS Parameter Store의 `/gemini/api_key` 사용 (자동)

### 로컬 테스트
- `REACT_APP_GEMINI_API_KEY`: Google Gemini API 키 (로컬 테스트용)

## 로컬 테스트

### 방법 1: 테스트 스크립트 사용

```bash
cd lambda/gemini-analysis

# 환경 변수 설정 후 실행
REACT_APP_GEMINI_API_KEY=your-api-key node test-local.js

# 또는 npm 스크립트 사용
REACT_APP_GEMINI_API_KEY=your-api-key npm run test:local
```

### 방법 2: 직접 Node.js로 실행

```bash
cd lambda/gemini-analysis
npm install

# 환경 변수 설정
export GEMINI_API_KEY=your-api-key

# Lambda 함수 코드를 직접 실행
node -e "
const handler = require('./index').handler;
const event = {
  requestContext: { http: { method: 'POST' } },
  body: JSON.stringify({
    userAnswer: 'Your test answer',
    sampleAnswer: 'Sample answer',
    question: 'Test question',
    analysisType: 'similarity'
  })
};
handler(event).then(r => console.log(JSON.stringify(r, null, 2)));
"
```

### 방법 3: AWS SAM 사용 (선택사항)

```bash
# SAM 설치 후
sam local invoke GeminiAnalysisFunction \
  --event event.json \
  --env-vars env.json
```

## 배포

Terraform을 통해 자동으로 배포됩니다. 수동 배포가 필요한 경우:

```bash
cd lambda/gemini-analysis
npm install --production
zip -r function.zip . -x "*.git*" "*.md" "test-*" "*.test.js"
aws lambda update-function-code \
  --function-name earth-app-prod-gemini-analysis \
  --zip-file fileb://function.zip
```

## API 엔드포인트

Lambda Function URL을 통해 호출됩니다.

### 요청 형식

```json
{
  "userAnswer": "사용자 답변",
  "sampleAnswer": "모범 답안",
  "question": "문제 (선택사항)",
  "analysisType": "similarity" | "grammar" | "improvement"
}
```

### 응답 형식

```json
{
  "success": true,
  "analysis": {
    "similarityScore": 85,
    "keyDifferences": ["차이점1", "차이점2"],
    "strengths": ["강점1", "강점2"],
    "improvements": ["개선사항1", "개선사항2"],
    "suggestions": ["제안1", "제안2"]
  },
  "analysisType": "similarity"
}
```

## 문제 해결

### Parameter Store 접근 오류
로컬 테스트 시 `GEMINI_API_KEY` 환경 변수를 설정하면 Parameter Store 접근을 건너뜁니다.

### API 키 오류
- 프로덕션: Terraform이 Parameter Store에 API 키를 저장했는지 확인
- 로컬: `REACT_APP_GEMINI_API_KEY` 환경 변수가 설정되었는지 확인
