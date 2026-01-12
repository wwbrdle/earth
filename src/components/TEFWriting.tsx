import React, { useState } from 'react';
import './TEFCanada.css';
import ResultDisplay from './ResultDisplay';
import { analyzeWithGemini } from '../utils/geminiApi';
import { lettersTopics, lettersSampleAnswers, faitDiverTopics, faitDiverSampleAnswers } from './TEFWritingTopics';

interface TEFWritingProps {
  onBack: () => void;
}

const TEFWriting: React.FC<TEFWritingProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<'letters' | 'faitDiver'>('letters');
  const [currentTopic, setCurrentTopic] = useState<number>(0); // 0이면 주제 선택 안됨, 1 이상이면 선택된 주제
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [textInputRef, setTextInputRef] = useState<HTMLTextAreaElement | null>(null);

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;
    if (currentTopic === 0) return; // 주제가 선택되지 않았으면 리턴
    
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setShowResult(true);
    
    // 현재 섹션과 주제에 맞는 모범 답안 가져오기
    const currentTopics = currentSection === 'letters' ? lettersTopics : faitDiverTopics;
    const currentSampleAnswers = currentSection === 'letters' ? lettersSampleAnswers : faitDiverSampleAnswers;
    const sampleAnswer = currentSampleAnswers[currentTopic] || '';
    
    if (!sampleAnswer || sampleAnswer.includes('작성되지 않았습니다') || sampleAnswer.includes('작성하세요')) {
      setIsAnalyzing(false);
      setSimilarityScore(0);
      return;
    }
    
    try {
      // Gemini API 호출 (환경에 따라 자동 선택)
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer,
          sampleAnswer,
          question: currentTopics[currentTopic - 1],
          analysisType: 'similarity'
        },
        lambdaUrl
      );
      
      console.log('Gemini API 응답:', data); // 디버깅용
      
      if (data.success && data.analysis) {
        // Gemini 분석 결과 처리
        console.log('Gemini 분석 결과:', data.analysis); // 디버깅용
        setGeminiAnalysis(data.analysis);
        
        // 유사도 점수 추출
        if (data.analysis.similarityScore !== undefined) {
          setSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setSimilarityScore(data.analysis.overallScore);
        } else {
          // 점수가 없으면 기본값 설정
          setSimilarityScore(0);
        }
      } else {
        console.error('Gemini API 오류:', data.error);
        setSimilarityScore(0);
      }
    } catch (error) {
      console.error('유사도 계산 오류:', error);
      setSimilarityScore(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetState = () => {
    setUserAnswer('');
    setShowResult(false);
    setShowSampleAnswer(false);
    setSimilarityScore(null);
    setGeminiAnalysis(null);
    setIsAnalyzing(false);
  };

  // 프랑스어 악센트 문자 삽입
  const insertAccent = (accent: string) => {
    if (textInputRef) {
      const start = textInputRef.selectionStart;
      const end = textInputRef.selectionEnd;
      const text = userAnswer;
      const newText = text.substring(0, start) + accent + text.substring(end);
      setUserAnswer(newText);
      
      // 커서 위치 조정
      setTimeout(() => {
        if (textInputRef) {
          textInputRef.focus();
          textInputRef.setSelectionRange(start + accent.length, start + accent.length);
        }
      }, 0);
    } else {
      // textarea가 없으면 그냥 추가
      setUserAnswer(userAnswer + accent);
    }
  };

  // 프랑스어 악센트 키보드 버튼들
  const frenchAccents = [
    { label: 'é', char: 'é', title: 'e with accent aigu' },
    { label: 'è', char: 'è', title: 'e with accent grave' },
    { label: 'ê', char: 'ê', title: 'e with circumflex' },
    { label: 'ë', char: 'ë', title: 'e with diaeresis' },
    { label: 'à', char: 'à', title: 'a with accent grave' },
    { label: 'â', char: 'â', title: 'a with circumflex' },
    { label: 'ç', char: 'ç', title: 'c with cedilla' },
    { label: 'ô', char: 'ô', title: 'o with circumflex' },
    { label: 'ù', char: 'ù', title: 'u with accent grave' },
    { label: 'û', char: 'û', title: 'u with circumflex' },
    { label: 'ï', char: 'ï', title: 'i with diaeresis' },
    { label: 'î', char: 'î', title: 'i with circumflex' },
    { label: 'É', char: 'É', title: 'E with accent aigu' },
    { label: 'È', char: 'È', title: 'E with accent grave' },
    { label: 'Ê', char: 'Ê', title: 'E with circumflex' },
    { label: 'À', char: 'À', title: 'A with accent grave' },
    { label: 'Ç', char: 'Ç', title: 'C with cedilla' },
  ];

  return (
    <div className="tef-canada">
      <header className="tef-header">
        <button onClick={onBack} className="back-button">
          ← 뒤로 가기
        </button>
        <h1>✍️ TEF Canada - Expression Écrite</h1>
      </header>
      
      <main className="tef-main">
        {/* 섹션 선택 영역 */}
        <div className="section-selector" style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '20px',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            📚 섹션 선택 (Section):
          </h3>
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <button
              onClick={() => {
                setCurrentSection('letters');
                setCurrentTopic(0);
                resetState();
              }}
              style={{
                padding: '15px 30px',
                background: currentSection === 'letters'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#f8f9fa',
                color: currentSection === 'letters' ? 'white' : '#333',
                border: `2px solid ${currentSection === 'letters' ? '#667eea' : '#e0e0e0'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: currentSection === 'letters'
                  ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                  : 'none'
              }}
            >
              📝 Letters
            </button>
            <button
              onClick={() => {
                setCurrentSection('faitDiver');
                setCurrentTopic(0);
                resetState();
              }}
              style={{
                padding: '15px 30px',
                background: currentSection === 'faitDiver'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#f8f9fa',
                color: currentSection === 'faitDiver' ? 'white' : '#333',
                border: `2px solid ${currentSection === 'faitDiver' ? '#667eea' : '#e0e0e0'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: currentSection === 'faitDiver'
                  ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                  : 'none'
              }}
            >
              📰 Fait Diver
            </button>
          </div>
        </div>

        {/* 주제 선택 영역 */}
        <div className="topic-selector" style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '20px',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            📝 주제 선택 (Sujet):
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '10px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {(currentSection === 'letters' ? lettersTopics : faitDiverTopics).map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentTopic(index + 1);
                  resetState();
                }}
                style={{
                  padding: '15px',
                  background: currentTopic === index + 1 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#f8f9fa',
                  color: currentTopic === index + 1 ? 'white' : '#333',
                  border: `2px solid ${currentTopic === index + 1 ? '#667eea' : '#e0e0e0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: currentTopic === index + 1 
                    ? '0 4px 15px rgba(102, 126, 234, 0.3)' 
                    : 'none'
                }}
              >
                <strong>{index + 1}.</strong> {topic}
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 주제 표시 */}
        {currentTopic > 0 && (
          <div className="selected-topic" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
              📋 주제 (Sujet):
            </h3>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#555',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px',
              borderLeft: '4px solid #667eea'
            }}>
              {(currentSection === 'letters' ? lettersTopics : faitDiverTopics)[currentTopic - 1]}
            </p>

            {/* 모범 답안 보기 버튼 */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                  marginBottom: '15px'
                }}
              >
                {showSampleAnswer ? '📖 Réponse modèle (Masquer)' : '📖 Réponse modèle (Afficher)'}
              </button>
              {showSampleAnswer && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  marginTop: '15px',
                  borderLeft: '4px solid #28a745',
                  textAlign: 'left',
                  whiteSpace: 'pre-line'
                }}>
                  <p style={{ margin: 0, lineHeight: '1.7', color: '#333', fontSize: '1rem' }}>
                    {(currentSection === 'letters' ? lettersSampleAnswers : faitDiverSampleAnswers)[currentTopic] || "모범 답안이 아직 작성되지 않았습니다."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 답변 입력 및 수정 영역 */}
        {currentTopic > 0 && (
          <div className="answer-input-section" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginTop: '20px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
              ✍️ Votre réponse (답변 입력/수정):
            </h3>
            
            {/* 텍스트 입력 필드 */}
            <textarea
              ref={(el) => setTextInputRef(el)}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="주제에 대한 에세이를 작성하세요..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '15px'
              }}
            />

            {/* 프랑스어 악센트 키보드 */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                🇫🇷 프랑스어 악센트:
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {frenchAccents.map((accent, index) => (
                  <button
                    key={index}
                    onClick={() => insertAccent(accent.char)}
                    title={accent.title}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 5px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    {accent.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 분석 버튼 */}
            {userAnswer.trim() && (
              <button 
                onClick={calculateSimilarity} 
                className="compare-button"
                disabled={isAnalyzing || currentTopic === 0}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: isAnalyzing || currentTopic === 0 
                    ? '#ccc' 
                    : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isAnalyzing || currentTopic === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: isAnalyzing || currentTopic === 0 
                    ? 'none' 
                    : '0 4px 15px rgba(40, 167, 69, 0.3)'
                }}
              >
                {isAnalyzing ? '🤖 AI 분석 중...' : '📊 Analyser la similarité'}
              </button>
            )}
          </div>
        )}

        {showResult && similarityScore !== null && currentTopic > 0 && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={(currentSection === 'letters' ? lettersSampleAnswers : faitDiverSampleAnswers)[currentTopic] || ''}
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>
    </div>
  );
};

export default TEFWriting;
