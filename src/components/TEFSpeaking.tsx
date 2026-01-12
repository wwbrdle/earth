import React, { useState } from 'react';
import './TEFCanada.css';
import SpeechRecognition from './SpeechRecognition';
import ResultDisplay from './ResultDisplay';
import { analyzeWithGemini } from '../utils/geminiApi';
import { sampleAnswers } from './TEFSampleAnswers';

interface TEFSpeakingProps {
  onBack: () => void;
}

const TEFSpeaking: React.FC<TEFSpeakingProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<'sectionA' | 'sectionB'>('sectionA');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0); // 0이면 Section 이미지, 1 이상이면 문제 이미지
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleRecordingComplete = (transcript: string) => {
    setUserAnswer(transcript);
    setCurrentTranscript('');
    setIsRecording(false);
  };

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;
    if (currentQuestion === 0) return; // 문제가 선택되지 않았으면 리턴
    
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setShowResult(true);
    
    // 현재 문제의 모범 답안 가져오기
    const sampleAnswer = sampleAnswers[currentSection]?.[currentQuestion] || '';
    
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
          question: `${currentSection === 'sectionA' ? 'Section A' : 'Section B'} - Question ${currentQuestion}`,
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
    setCurrentTranscript('');
    setShowResult(false);
    setShowSampleAnswer(false);
    setSimilarityScore(null);
    setGeminiAnalysis(null);
    setIsAnalyzing(false);
  };

  const getQuestionImagePath = () => {
    return `/${currentSection === 'sectionA' ? 'Section A' : 'Section B'} - Question ${currentQuestion}.png`;
  };

  const getAvailableQuestions = () => {
    if (currentSection === 'sectionA') {
      // Section A: Question 1-11
      return Array.from({ length: 11 }, (_, i) => i + 1);
    } else {
      // Section B: Question 1-30
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
  };


  return (
    <div className="tef-canada">
      <header className="tef-header">
        <button onClick={onBack} className="back-button">
          ← 뒤로 가기
        </button>
        <h1>🎤 TEF Canada - Expression Orale</h1>
      </header>
      
      <main className="tef-main">
        {/* Subjonctif List 이미지 */}
        <div className="subjonctif-display">
          <div className="subjonctif-image-container">
            <img 
              src="/Subjonctif List.png"
              alt="Subjonctif List"
              className="subjonctif-image"
            />
          </div>
        </div>

        {/* Evaluation 이미지 */}
        <div className="evaluation-display">
          <div className="evaluation-image-container">
            <img 
              src="/evaluation.png"
              alt="Evaluation"
              className="evaluation-image"
            />
          </div>
        </div>

        <div className="section-selector">
          <button 
            onClick={() => {
              setCurrentSection('sectionA');
              setCurrentQuestion(0); // Section 이미지 표시
              resetState();
            }} 
            className={`section-button ${currentSection === 'sectionA' ? 'active' : ''}`}
          >
            Section A
          </button>
          <button 
            onClick={() => {
              setCurrentSection('sectionB');
              setCurrentQuestion(0); // Section 이미지 표시
              resetState();
            }} 
            className={`section-button ${currentSection === 'sectionB' ? 'active' : ''}`}
          >
            Section B
          </button>
        </div>

        {/* 문제 선택 버튼 */}
        <div className="question-selector">
          <h4>문제 선택:</h4>
          <div className="question-buttons">
            {getAvailableQuestions().map((questionNum) => (
              <button
                key={questionNum}
                onClick={() => {
                  setCurrentQuestion(questionNum);
                  resetState();
                }}
                className={`question-button ${currentQuestion === questionNum ? 'active' : ''}`}
              >
                Question {questionNum}
              </button>
            ))}
          </div>
        </div>

        {/* Section 이미지 또는 문제 이미지 표시 */}
        <div className="question-display">
          <div className="question-image-container">
            {currentQuestion === 0 ? (
              // 문제가 선택되지 않았을 때 Section 이미지 표시
              <img 
                src={`/${currentSection === 'sectionA' ? 'Section A' : 'Section B'}.png`}
                alt={`${currentSection === 'sectionA' ? 'Section A' : 'Section B'}`}
                className="question-image"
              />
            ) : (
              // 문제가 선택되었을 때 문제 이미지 표시
              <img 
                src={getQuestionImagePath()}
                alt={`${currentSection === 'sectionA' ? 'Section A' : 'Section B'} Question ${currentQuestion}`}
                className="question-image"
              />
            )}
          </div>
          
          {/* 모범 답안 보기 버튼 (문제가 선택되었을 때만 표시) */}
          {currentQuestion > 0 && (
            <div className="sample-answer-section" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                className="show-answer-button"
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
                <div className="sample-answer-content" style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  marginTop: '15px',
                  borderLeft: '4px solid #28a745',
                  textAlign: 'left',
                  whiteSpace: 'pre-line'
                }}>
                  <p style={{ margin: 0, lineHeight: '1.7', color: '#333', fontSize: '1rem' }}>
                    {sampleAnswers[currentSection]?.[currentQuestion] || "모범 답안이 아직 작성되지 않았습니다."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <SpeechRecognition
          isRecording={isRecording}
          onStartRecording={() => {
            setIsRecording(true);
            setCurrentTranscript('');
          }}
          onStopRecording={() => setIsRecording(false)}
          onRecordingComplete={handleRecordingComplete}
          onTranscriptUpdate={setCurrentTranscript}
          language="fr-CA"
        />

        {isRecording && (
          <div className="user-answer">
            <h3>🎤 Reconnaissance vocale en temps réel:</h3>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              {currentTranscript || 'Reconnaissance de la voix en cours...'}
            </p>
          </div>
        )}

        {/* 답변 표시 및 분석 버튼 */}
        {userAnswer && !isRecording && (
          <div className="user-answer" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginTop: '20px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <h3>🎤 Votre réponse:</h3>
            <p>{userAnswer}</p>
            <button 
              onClick={calculateSimilarity} 
              className="compare-button"
              disabled={isAnalyzing || currentQuestion === 0}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: isAnalyzing || currentQuestion === 0 
                  ? '#ccc' 
                  : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: isAnalyzing || currentQuestion === 0 ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: isAnalyzing || currentQuestion === 0 
                  ? 'none' 
                  : '0 4px 15px rgba(40, 167, 69, 0.3)',
                marginTop: '15px'
              }}
            >
              {isAnalyzing ? '🤖 AI 분석 중...' : '📊 Analyser la similarité'}
            </button>
          </div>
        )}

        {showResult && similarityScore !== null && currentQuestion > 0 && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={sampleAnswers[currentSection]?.[currentQuestion] || ''}
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>
    </div>
  );
};

export default TEFSpeaking;
