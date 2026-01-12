/**
 * Gemini API 호출 유틸리티
 * 개발 환경: .env의 GEMINI_API_KEY 사용
 * 프로덕션: Lambda 함수 사용
 */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com';
// v1 API에서 사용 가능한 모델: gemini-2.5-flash (빠름), gemini-2.5-pro (강력함)
const GEMINI_MODEL = 'gemini-2.5-flash'; // 빠르고 효율적인 모델
const GEMINI_API_VERSION = 'v1'; // v1 API 사용

interface GeminiAnalysisRequest {
  userAnswer: string;
  sampleAnswer: string;
  question?: string;
  analysisType?: 'similarity' | 'grammar' | 'improvement';
}

interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: any;
  analysisType?: string;
  error?: string;
}

/**
 * 개발 환경에서 Gemini API 직접 호출
 */
async function callGeminiDirectly(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('REACT_APP_GEMINI_API_KEY is not set in .env file');
  }

  const prompt = generatePrompt(request);

  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to call Gemini API');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text in Gemini response');
  }

  // JSON 응답인 경우 파싱 시도
  try {
    const parsed = JSON.parse(text);
    return {
      success: true,
      analysis: parsed,
      analysisType: request.analysisType || 'similarity'
    };
  } catch (e) {
    // JSON이 아니면 텍스트 그대로 반환
    return {
      success: true,
      analysis: { text },
      analysisType: request.analysisType || 'similarity'
    };
  }
}

/**
 * Lambda 함수를 통해 Gemini API 호출 (프로덕션)
 */
async function callGeminiViaLambda(
  lambdaUrl: string,
  request: GeminiAnalysisRequest
): Promise<GeminiAnalysisResponse> {
  const response = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * 프롬프트 생성
 */
function generatePrompt(request: GeminiAnalysisRequest): string {
  const { userAnswer, sampleAnswer, question, analysisType = 'similarity' } = request;

  switch (analysisType) {
    case 'similarity':
      return `You are an IELTS speaking test evaluator. Compare the following two answers and provide a detailed analysis.

Question: ${question || 'IELTS Speaking Question'}

Sample Answer: ${sampleAnswer}

Student Answer: ${userAnswer}

IMPORTANT: 
1. You must respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Only return the JSON object.
2. All text in the JSON response must be in Korean (한국어). Write all analysis, differences, strengths, improvements, and suggestions in Korean.

Required JSON structure:
{
  "similarityScore": <number between 0-100>,
  "keyDifferences": ["<difference1 in Korean>", "<difference2 in Korean>", ...],
  "strengths": ["<strength1 in Korean>", "<strength2 in Korean>", ...],
  "improvements": ["<improvement1 in Korean>", "<improvement2 in Korean>", ...],
  "suggestions": ["<suggestion1 in Korean>", "<suggestion2 in Korean>", ...]
}

Provide:
1. Similarity score (0-100): How similar is the student's answer to the sample answer?
2. Key differences: List 3-5 main differences between the two answers (in Korean)
3. Strengths: List 2-3 strengths of the student's answer (in Korean)
4. Improvements: List 3-5 areas where the student can improve (in Korean)
5. Suggestions: List 3-5 specific, actionable suggestions (in Korean)

Remember: Respond ONLY with valid JSON in Korean, nothing else.`;

    case 'grammar':
      return `Analyze the grammar and language accuracy of this IELTS speaking answer:

Answer: ${userAnswer}

IMPORTANT: All text in the JSON response must be in Korean (한국어). Write all analysis, errors, corrections, and feedback in Korean.

Provide:
1. Grammar errors found (in Korean)
2. Vocabulary usage assessment (in Korean)
3. Sentence structure evaluation (in Korean)
4. Overall language accuracy score (0-100)

Format as JSON:
{
  "grammarErrors": [{"error": "<error in Korean>", "correction": "<correction in Korean>"}, ...],
  "vocabularyScore": <number>,
  "sentenceStructureScore": <number>,
  "overallScore": <number>,
  "feedback": "<overall feedback in Korean>"
}

Remember: Respond ONLY with valid JSON in Korean, nothing else.`;

    case 'improvement':
      return `Provide specific improvement suggestions for this IELTS speaking answer:

Question: ${question || 'IELTS Speaking Question'}
Answer: ${userAnswer}

IMPORTANT: All text in the JSON response must be in Korean (한국어). Write all suggestions in Korean.

Provide detailed suggestions for:
1. Content (ideas, examples, details) - in Korean
2. Language (vocabulary, grammar, fluency) - in Korean
3. Structure (organization, coherence) - in Korean

Format as JSON:
{
  "contentSuggestions": ["<suggestion1 in Korean>", ...],
  "languageSuggestions": ["<suggestion1 in Korean>", ...],
  "structureSuggestions": ["<suggestion1 in Korean>", ...]
}

Remember: Respond ONLY with valid JSON in Korean, nothing else.`;

    default:
      return `Analyze this IELTS speaking answer: ${userAnswer}`;
  }
}

/**
 * Gemini API 호출 (환경에 따라 자동 선택)
 */
export async function analyzeWithGemini(
  request: GeminiAnalysisRequest,
  lambdaUrl?: string
): Promise<GeminiAnalysisResponse> {
  // 개발 환경: .env의 API 키가 있으면 직접 호출
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasApiKey = !!process.env.REACT_APP_GEMINI_API_KEY;
  const hasLambdaUrl = !!lambdaUrl || !!process.env.REACT_APP_LAMBDA_FUNCTION_URL;

  if (isDevelopment && hasApiKey) {
    // 개발 환경에서 .env의 REACT_APP_GEMINI_API_KEY 사용
    return await callGeminiDirectly(request);
  } else if (hasLambdaUrl) {
    // 프로덕션: Lambda 함수 사용
    const url = lambdaUrl || process.env.REACT_APP_LAMBDA_FUNCTION_URL || '';
    return await callGeminiViaLambda(url, request);
  } else {
    throw new Error('Neither REACT_APP_GEMINI_API_KEY nor REACT_APP_LAMBDA_FUNCTION_URL is set');
  }
}
