const https = require('https');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com';
// v1 API에서 사용 가능한 모델: gemini-2.5-flash (빠름), gemini-2.5-pro (강력함)
const GEMINI_MODEL = 'gemini-2.5-flash'; // 빠르고 효율적인 모델
const GEMINI_API_VERSION = 'v1'; // v1 API 사용
const PARAMETER_STORE_PATH = '/gemini/api_key';

// SSM Client 초기화
const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

// API 키 캐시 (Cold start 최적화)
let cachedApiKey = null;

/**
 * Parameter Store에서 API 키 가져오기
 */
async function getApiKeyFromParameterStore() {
    // 캐시된 키가 있으면 반환
    if (cachedApiKey) {
        return cachedApiKey;
    }
    
    try {
        const command = new GetParameterCommand({
            Name: PARAMETER_STORE_PATH,
            WithDecryption: true
        });
        const response = await ssmClient.send(command);
        cachedApiKey = response.Parameter.Value;
        return cachedApiKey;
    } catch (error) {
        console.error('Error getting parameter from Parameter Store:', error);
        throw error;
    }
}

/**
 * Lambda 함수: Gemini API를 사용하여 답변 분석
 */
exports.handler = async (event) => {
    // CORS 헤더 설정
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({})
        };
    }

    try {
        // API 키 가져오기
        let apiKey;
        
        // 로컬 테스트 환경에서는 환경 변수 사용
        if (process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
            apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        } else {
            // 프로덕션: AWS Parameter Store에서 가져오기
            apiKey = await getApiKeyFromParameterStore();
        }
        
        if (!apiKey) {
            throw new Error('Failed to get GEMINI_API_KEY from Parameter Store or environment variable');
        }

        // 요청 본문 파싱
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        
        // 모델 목록 조회 요청 처리
        if (body.action === 'listModels') {
            const models = await listAvailableModels(apiKey);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    models: models
                })
            };
        }
        
        const { userAnswer, sampleAnswer, question, analysisType = 'similarity' } = body;

        if (!userAnswer || !sampleAnswer) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'userAnswer and sampleAnswer are required' })
            };
        }

        // 분석 타입에 따라 프롬프트 생성
        let prompt = '';
        switch (analysisType) {
            case 'similarity':
                prompt = `You are an IELTS speaking test evaluator. Compare the following two answers and provide a detailed analysis.

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
                break;
            case 'grammar':
                prompt = `Analyze the grammar and language accuracy of this IELTS speaking answer:

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
                break;
            case 'improvement':
                prompt = `Provide specific improvement suggestions for this IELTS speaking answer:

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
                break;
            default:
                prompt = `Analyze this IELTS speaking answer: ${userAnswer}`;
        }

        // Gemini API 호출
        const geminiResponse = await callGeminiAPI(apiKey, prompt);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: geminiResponse,
                analysisType
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

/**
 * 사용 가능한 모델 목록 가져오기
 */
async function listAvailableModels(apiKey) {
    const versions = ['v1', 'v1beta'];
    const result = {};
    
    for (const version of versions) {
        try {
            const models = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'generativelanguage.googleapis.com',
                    path: `/${version}/models?key=${apiKey}`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(parsed.models || []);
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${e.message}`));
                        }
                    });
                });
                
                req.on('error', reject);
                req.end();
            });
            
            result[version] = models.map(model => ({
                name: model.name.replace('models/', ''),
                displayName: model.displayName || model.name.replace('models/', ''),
                supportedMethods: model.supportedGenerationMethods || [],
                supportsGenerateContent: (model.supportedGenerationMethods || []).includes('generateContent')
            }));
        } catch (error) {
            console.error(`Error fetching models for ${version}:`, error);
            result[version] = [];
        }
    }
    
    return result;
}

/**
 * Gemini API 호출 함수
 */
function callGeminiAPI(apiKey, prompt) {
    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        reject(new Error(`Gemini API error: ${response.error?.message || data}`));
                        return;
                    }

                    // 응답에서 텍스트 추출
                    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) {
                        reject(new Error('No text in Gemini response'));
                        return;
                    }

                    // JSON 응답인 경우 파싱 시도
                    try {
                        // 텍스트에서 JSON 부분만 추출 (마크다운 코드 블록 제거)
                        let jsonText = text.trim();
                        // ```json ... ``` 형식 제거
                        if (jsonText.startsWith('```')) {
                            const lines = jsonText.split('\n');
                            const startIndex = lines.findIndex(line => line.includes('```'));
                            const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('```'));
                            if (startIndex !== -1 && endIndex !== -1) {
                                jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
                            } else {
                                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                            }
                        }
                        
                        const parsed = JSON.parse(jsonText);
                        console.log('Parsed Gemini response:', parsed);
                        resolve(parsed);
                    } catch (e) {
                        // JSON 파싱 실패 시 로그 출력
                        console.error('Failed to parse JSON from Gemini response:', e);
                        console.error('Raw text:', text);
                        // JSON이 아니면 텍스트 그대로 반환하되, 구조화된 형태로
                        resolve({ 
                            text,
                            similarityScore: 0,
                            keyDifferences: [],
                            strengths: [],
                            improvements: [],
                            suggestions: []
                        });
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(requestBody);
        req.end();
    });
}
