/**
 * Gemini API 호출 유틸리티
 * 모든 환경에서 Lambda 함수 사용
 */

interface GeminiAnalysisRequest {
  userAnswer: string;
  sampleAnswer: string;
  question?: string;
  analysisType?: 'similarity' | 'grammar' | 'improvement' | 'ielts-writing';
  images?: Array<{
    data: string;
    mimeType: string;
  }>;
}

interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: any;
  analysisType?: string;
  error?: string;
  rawText?: string;
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
    case 'ielts-writing':
      return `You are an IELTS Academic Writing examiner. Evaluate ONLY Writing. Do NOT mention Speaking.

Task Info:
${question ? `${question}\n` : ''}
Sample Answer:
${sampleAnswer}

Student Answer:
${userAnswer}

Rules:
1) Respond ONLY with valid JSON (no markdown).
2) All text must be in Korean (한국어).
3) Use IELTS Writing criteria.
4) If the answer is extremely short (e.g., "hello"), state it does not address the writing task and score accordingly.

JSON:
{
  "overallScore": <0-100>,
  "bandScore": <0-9>,
  "bandBreakdown": {
    "taskResponse": <0-9>,
    "coherenceCohesion": <0-9>,
    "lexicalResource": <0-9>,
    "grammar": <0-9>
  },
  "guideAdherence": {
    "score": <0-100>,
    "summary": "<Korean>",
    "issues": ["<Korean>", "<Korean>"]
  },
  "strengths": ["<Korean>", "<Korean>"],
  "improvements": ["<Korean>", "<Korean>"],
  "suggestions": ["<Korean>", "<Korean>"],
  "feedback": "<Korean. Do not mention speaking.>"
}`;
    case 'similarity':
      // TEF Canada Writing인지 확인 (question에 "TEF" 또는 "Expression Écrite" 또는 "Fait Diver" 또는 "Letters"가 포함되어 있는지)
      const isTEFCanada = question && (
        question.includes('TEF') || 
        question.includes('Expression Écrite') || 
        question.includes('Fait Diver') || 
        question.includes('Letters') ||
        question.includes('Section A') ||
        question.includes('Section B')
      );
      
      const evaluatorRole = isTEFCanada 
        ? 'TEF Canada writing test evaluator (Expression Écrite)' 
        : 'IELTS speaking test evaluator';
      
      const questionLabel = isTEFCanada 
        ? 'TEF Canada Writing Question' 
        : 'IELTS Speaking Question';
      
      return `You are a ${evaluatorRole}. Compare the following two answers and provide a detailed analysis.

Question: ${question || questionLabel}

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

export function buildGeminiPrompt(request: GeminiAnalysisRequest): string {
  return generatePrompt(request);
}

/**
 * Gemini API 호출 (환경에 따라 자동 선택)
 */
export async function analyzeWithGemini(
  request: GeminiAnalysisRequest,
  lambdaUrl?: string
): Promise<GeminiAnalysisResponse> {
  const hasLambdaUrl = !!lambdaUrl || !!process.env.REACT_APP_LAMBDA_FUNCTION_URL;

  if (hasLambdaUrl) {
    // 모든 환경에서 Lambda 함수 우선 사용
    const url = lambdaUrl || process.env.REACT_APP_LAMBDA_FUNCTION_URL || '';
    return await callGeminiViaLambda(url, request);
  } else {
    // Lambda가 없으면 직접 호출로 폴백
    throw new Error('Neither REACT_APP_GEMINI_API_KEY nor REACT_APP_LAMBDA_FUNCTION_URL is set');
  }
}
