import React, { useMemo, useState } from 'react';
import ResultDisplay from './ResultDisplay';
import { analyzeWithGemini, buildGeminiPrompt } from '../utils/geminiApi';

type WritingSection = 'task1' | 'task2';

interface WritingPrompt {
  id: number;
  prompt: string;
}

interface Task1Topic {
  id: number;
  title: string;
  guidance?: string;
  guidanceForScreen?: React.ReactNode;
  sampleAnswer?: string;
  imagePath?: string;
}

const task1Topics: Task1Topic[] = [
  {
    id: 1,
    title: 'Single line graph',
    guidance: `Single line graph

How to start
"The graph describes/shows/presents/reveals ... (what, who, when, where)."
"It can be clearly seen that ... (describe main trends here)."

Vocabulary
When describing such a graph, all you can say is that it either rises (increases, climbs, goes up), falls (decreases, declines, drops, goes down), doesn't change (remains at the same level, maintains stability, plateaus). The highest point of a graph is a peak and the lowest is the lowest point. The speed of change also matters - you should say how fast (rapidly, quickly) or how slowly (gradually, steadily) it happened. And, of course, there is order to changes - a rise was preceded by a drop and followed by a decline.

How to describe trends
Numbers are boring, so you need to add a little "color" when describing them. By "color" I mean comparison. Don't just write "went from 100 in 1999 to 255 in 2001". Write "significantly increased to 255" or "had risen to 255". Make sure to mention the peak and trough of the line graph (its highest and lowest values), see example below.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Single line graph</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The graph</strong> describes/shows/presents/reveals ... <em>(what, who, when, where).</em>"
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that ... <em>(describe main trends here).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          When describing such a graph, all you can say is that it either <strong>rises</strong> (increases, climbs, goes up),
          <strong> falls</strong> (decreases, declines, drops, goes down), <strong>doesn't change</strong> (remains at the same level,
          maintains stability, plateaus). The highest point of a graph is a <strong>peak</strong> and the lowest is the{' '}
          <strong>lowest point</strong>. The speed of change also matters - you should say how <strong>fast</strong> (rapidly, quickly) or
          how <strong>slowly</strong> (gradually, steadily) it happened. And, of course, there is order to changes - a rise was{' '}
          <strong>preceded</strong> by a drop and <strong>followed</strong> by a decline.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to describe trends</div>
        <div>
          Numbers are boring, so you need to add a little "color" when describing them. By "color" I mean <em>comparison</em>.
          Don't just write "went from 100 in 1999 to 255 in 2001". Write "significantly increased to 255" or "had risen to 255".
          Make sure to mention the peak and trough of the line graph (its highest and lowest values), see example below.
        </div>
      </div>
    )
    ,
    sampleAnswer: `The graph shows the percentages of unemployed women aged between 18 and 65.

It can be clearly seen that the 18 and 45 year-old women are most likely to be unemployed, while the figures for other ages are relatively uniform.

According to the graph, among the ages from 18 to 35, the youngest women have the highest unemployment percentage (15%). Slightly older, 20 year-old women are more likely to be employed, with unemployment at about 10%. The percentages drop even lower (to 5 percent) for those aged 25 and 35. There is a slight increase for those aged 30, where the unemployment rate reaches 6 percent.

The sharp rise to 20% breaks the downward trend, with the peak value recorded amongst 45 year-old women. All the remaining ages have much lower figures, 8% at the age of 55 and 9% at the age of 65; however, this is still considerably higher compared to 25 to 35 year-old females.`,
    imagePath: '/ielts/task1-single-line-graph.png',
  },
  {
    id: 2,
    title: 'Double line graph',
  },
  {
    id: 3,
    title: 'Bar graph',
  },
  {
    id: 4,
    title: 'Pie chart',
  },
  {
    id: 5,
    title: 'Table',
  },
  {
    id: 6,
    title: 'Plan / Map',
  }
];

const task1PromptsById: Record<number, string> = {
  2: 'The line graph compares the average monthly temperatures in two cities over a year. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
  3: 'The bar chart illustrates the number of international students studying in five countries in 2022. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
  4: 'The pie charts show the distribution of household spending in 2000 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
  5: 'The table provides information about average daily spending by tourists in three cities. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
  6: 'The maps below show changes to a town centre between 2000 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.'
};

const task2Prompts: WritingPrompt[] = [
  {
    id: 1,
    prompt:
      'Some people believe that public libraries are no longer necessary because of digital resources. To what extent do you agree or disagree?'
  },
  {
    id: 2,
    prompt:
      'In many cities, housing has become increasingly expensive. What are the main causes of this problem, and what solutions can you suggest?'
  }
];

const sampleAnswers: Record<string, string> = {
  'task1-2': `The diagram illustrates how a solar panel system generates electricity for household use.

Overall, the process involves three main stages: capturing sunlight, converting it into electrical energy, and distributing the power for immediate use or storage.

First, solar panels on the roof absorb sunlight and convert it into direct current (DC) electricity. This DC power is then sent to an inverter, which changes it into alternating current (AC) suitable for household appliances. Next, the electricity is supplied to the home’s electrical system, where it powers lights and devices.

Any surplus electricity can be stored in a battery for later use or fed back into the grid, depending on the system design. When sunlight is insufficient, the home can draw electricity from the battery or the grid to ensure a continuous supply.`,
  'task2-1': `Some people argue that public libraries have become unnecessary due to digital resources. I partly disagree with this view.

On the one hand, online materials are more accessible than ever. E‑books, academic articles, and educational videos can be accessed instantly from home, which saves time and often money. For many users, digital platforms offer convenience that traditional libraries cannot match.

On the other hand, libraries still serve important roles that go beyond providing books. They offer quiet study spaces, free internet access, and support from librarians, which is especially valuable for students and low‑income communities. Libraries also host community events and literacy programs that help foster social inclusion.

In conclusion, while digital resources have reduced reliance on physical collections, public libraries remain relevant as community hubs and equalizers. Rather than being obsolete, they should continue to evolve alongside technology.`,
  'task2-2': `Housing costs have risen sharply in many cities. This is mainly due to growing demand and limited supply, and a combination of policy and planning solutions is needed.

One key cause is rapid urbanization. As more people move to cities for work, demand outpaces the construction of new homes. Additionally, strict zoning rules and lengthy approval processes can restrict development. Investment-driven buying can further inflate prices by reducing the number of homes available for residents.

To address these issues, governments should increase housing supply by easing zoning restrictions and speeding up permits. Incentives for affordable housing projects can also encourage private developers to build lower‑cost units. In the longer term, improving transport links to suburban areas would distribute demand more evenly and reduce pressure on city centers.

Overall, tackling expensive housing requires both expanding supply and managing demand through smart urban planning.`,
};

interface IELTSWritingProps {
  onBack: () => void;
}

const IELTSWriting: React.FC<IELTSWritingProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<WritingSection>('task1');
  const [selectedTask1Id, setSelectedTask1Id] = useState<number>(task1Topics[0].id);
  const [selectedTask2Id, setSelectedTask2Id] = useState<number>(task2Prompts[0].id);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [rawGeminiResponse, setRawGeminiResponse] = useState<string>('');
  const [rawGeminiPrompt, setRawGeminiPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);

  const selectedPrompt = useMemo(() => {
    if (currentSection === 'task1') {
      const topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      return { type: 'Task 1', id: topic.id, prompt: task1PromptsById[topic.id] || '' };
    }
    const prompt = task2Prompts.find((item) => item.id === selectedTask2Id) || task2Prompts[0];
    return { type: 'Task 2', id: prompt.id, prompt: prompt.prompt };
  }, [currentSection, selectedTask1Id, selectedTask2Id]);

  const wordCount = useMemo(() => {
    if (!userAnswer.trim()) return 0;
    return userAnswer.trim().split(/\s+/).length;
  }, [userAnswer]);

  const sampleAnswerKey = useMemo(() => {
    const id = currentSection === 'task1' ? selectedTask1Id : selectedTask2Id;
    return `${currentSection}-${id}`;
  }, [currentSection, selectedTask1Id, selectedTask2Id]);

  const sampleAnswer = useMemo(() => {
    if (currentSection === 'task1') {
      const topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      return topic.sampleAnswer || sampleAnswers[sampleAnswerKey] || '';
    }
    return sampleAnswers[sampleAnswerKey] || '';
  }, [currentSection, selectedTask1Id, sampleAnswerKey]);

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;

    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setRawGeminiResponse('');
    setRawGeminiPrompt('');
    setShowResult(true);

    try {
      const task1Topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      const guideText = currentSection === 'task1' ? (task1Topic.guidance || '') : '';
      let imagePayload: { data: string; mimeType: string } | undefined;

      if (currentSection === 'task1' && task1Topic.imagePath) {
        try {
          const response = await fetch(task1Topic.imagePath);
          const blob = await response.blob();
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(blob);
          });
          if (data) {
            imagePayload = { data, mimeType: blob.type || 'image/png' };
          }
        } catch (error) {
          console.warn('Failed to load task image for Gemini:', error);
        }
      }

      const analysisQuestion = [
        `IELTS Academic Writing ${selectedPrompt.type}`,
        guideText ? `Guide:\n${guideText}` : '',
        currentSection === 'task1' && task1Topic.imagePath
          ? `Task: Refer to the attached image. (${task1Topic.imagePath})`
          : ''
      ].filter(Boolean).join('\n\n');

      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const requestPayload = {
        userAnswer,
        sampleAnswer,
        question: analysisQuestion,
        analysisType: 'ielts-writing' as const,
        image: imagePayload
      };
      setRawGeminiPrompt(buildGeminiPrompt(requestPayload));
      const data = await analyzeWithGemini(requestPayload, lambdaUrl);

      if (data.success && data.analysis) {
        setGeminiAnalysis(data.analysis);
        const rawText =
          data.rawText ||
          data.analysis?.text ||
          JSON.stringify(data.analysis, null, 2);
        setRawGeminiResponse(rawText || '');

        if (data.analysis.similarityScore !== undefined) {
          setSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setSimilarityScore(data.analysis.overallScore);
        } else {
          const userWords = userAnswer.toLowerCase().split(/\s+/);
          const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
          const commonWords = userWords.filter(word => sampleWords.includes(word));
          const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
          setSimilarityScore(Math.round(similarity));
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      setRawGeminiResponse(JSON.stringify({ error: String(error) }, null, 2));
      const userWords = userAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
      setSimilarityScore(Math.round(similarity));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBack}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>✍️ IELTS Writing 연습</h1>
        </div>
      </header>

      <main className="App-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📚 섹션 선택 (Section):</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => {
                setCurrentSection('task1');
                setUserAnswer('');
                setShowResult(false);
                setSimilarityScore(null);
                setGeminiAnalysis(null);
                  setRawGeminiResponse('');
                  setRawGeminiPrompt('');
                setShowSampleAnswer(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: currentSection === 'task1' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                color: currentSection === 'task1' ? 'white' : '#333'
              }}
            >
              Task 1
            </button>
            <button
              onClick={() => {
                setCurrentSection('task2');
                setUserAnswer('');
                setShowResult(false);
                setSimilarityScore(null);
                setGeminiAnalysis(null);
                    setRawGeminiResponse('');
                    setRawGeminiPrompt('');
                setShowSampleAnswer(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: currentSection === 'task2' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                color: currentSection === 'task2' ? 'white' : '#333'
              }}
            >
              Task 2
            </button>
          </div>

          {currentSection === 'task1' ? (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 주제 선택 :</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {task1Topics.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTask1Id(item.id);
                      setUserAnswer('');
                      setShowResult(false);
                      setSimilarityScore(null);
                      setGeminiAnalysis(null);
                      setShowSampleAnswer(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: selectedTask1Id === item.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                      color: selectedTask1Id === item.id ? 'white' : '#333'
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 주제 선택 :</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {task2Prompts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTask2Id(item.id);
                      setUserAnswer('');
                      setShowResult(false);
                      setSimilarityScore(null);
                      setGeminiAnalysis(null);
                      setShowSampleAnswer(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: selectedTask2Id === item.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                      color: selectedTask2Id === item.id ? 'white' : '#333'
                    }}
                  >
                    Task 2 #{item.id}
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedPrompt.prompt && (
            <>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 문제 (Prompt)</h3>
              <p style={{ marginTop: 0, lineHeight: '1.6', color: '#333', whiteSpace: 'pre-line' }}>
                {selectedPrompt.prompt}
              </p>
            </>
          )}
          {currentSection === 'task1' && (
            <div style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #667eea', textAlign: 'left' }}>
              <div style={{ lineHeight: '1.7', color: '#333' }}>
                {(task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0]).guidanceForScreen || '가이드가 아직 준비되지 않았습니다.'}
              </div>
            </div>
          )}
        </div>

        {currentSection === 'task1' && selectedTask1Id === 1 && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>🖼️ Sample task</h3>
            <img
              src="/ielts/task1-single-line-graph.png"
              alt="Single line graph sample task"
              style={{ width: '100%', borderRadius: '10px', border: '1px solid #e0e0e0' }}
            />
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>✍️ Your Answer</h3>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="여기에 답안을 작성하세요..."
            style={{
              width: '100%',
              minHeight: '220px',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>단어 수: {wordCount}</span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setShowSampleAnswer((prev) => !prev);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#eef2ff',
                  fontWeight: 600
                }}
              >
                {showSampleAnswer ? '모범 답안 숨기기' : '모범 답안 보기'}
              </button>
              <button
                onClick={calculateSimilarity}
                disabled={isAnalyzing || !userAnswer.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isAnalyzing || !userAnswer.trim() ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  opacity: isAnalyzing || !userAnswer.trim() ? 0.6 : 1
                }}
              >
                {isAnalyzing ? '🤖 AI 분석 중...' : '📊 AI 분석하기'}
              </button>
              <button
                onClick={() => {
                  setUserAnswer('');
                  setShowResult(false);
                  setSimilarityScore(null);
                  setGeminiAnalysis(null);
                  setRawGeminiResponse('');
                  setRawGeminiPrompt('');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#f0f0f0',
                  fontWeight: 600
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {showSampleAnswer && (
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', marginTop: '15px', borderLeft: '4px solid #28a745' }}>
            <h4 style={{ marginTop: 0 }}>📖 모범 답안</h4>
            <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-line', color: '#333' }}>
              {sampleAnswer || '모범 답안이 아직 작성되지 않았습니다.'}
            </p>
          </div>
        )}

        {rawGeminiPrompt && (
          <details style={{ background: '#0b1220', color: '#e6e6e6', borderRadius: '10px', padding: '15px', marginTop: '15px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#fff', fontWeight: 600 }}>📨 Gemini Raw Prompt</summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
              {rawGeminiPrompt}
            </pre>
          </details>
        )}

        {rawGeminiResponse && (
          <div style={{ background: '#111', color: '#e6e6e6', borderRadius: '10px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#fff' }}>🧾 Gemini Raw Response</h4>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
              {rawGeminiResponse}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default IELTSWriting;
