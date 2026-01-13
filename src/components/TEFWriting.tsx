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
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);
  const [lastAccentKey, setLastAccentKey] = useState<string | null>(null);
  const [accentCycleIndex, setAccentCycleIndex] = useState<Record<string, number>>({});

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

  // 허용된 문자만 입력 가능하도록 필터링 (이미지에 있는 프랑스어 특수 문자들 + 기본 문자)
  // 이미지 문자: ù, û, ü, ÿ, €, ,, ", ", «, », –, —, à, â, æ, ç, é, è, ê, ë, ï, î, ô, œ
  const allowedCharsRegex = /^[a-zA-Z0-9\s\n\r\t.,!?;:()[\]{}\-–—'"«»€àâæçéèêëïîôùûüÿœ]*$/;
  const singleCharRegex = /^[a-zA-Z0-9\s.,!?;:()[\]{}\-–—'"«»€àâæçéèêëïîôùûüÿœ]$/;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // 허용된 문자만 필터링
    if (allowedCharsRegex.test(value)) {
      setUserAnswer(value);
    } else {
      // 허용되지 않은 문자가 있으면 필터링
      const filtered = value.split('').filter(char => allowedCharsRegex.test(char)).join('');
      setUserAnswer(filtered);
    }
  };

  // Alt 키 조합으로 악센트 입력 처리
  const handleAccentInput = (baseChar: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const lowerChar = baseChar.toLowerCase();
    
    if (accentCycles[lowerChar]) {
      const cycle = accentCycles[lowerChar];
      
      // 전용 단축키 확인 (우선순위: Alt+Shift+Ctrl > Alt+Ctrl > Alt+Shift > Alt)
      if (e.shiftKey && e.ctrlKey) {
        // Alt+Shift+Ctrl 조합 (4번째)
        if (cycle.length > 3) {
          insertAccent(cycle[3]);
          setAccentCycleIndex({ ...accentCycleIndex, [lowerChar]: 3 });
          setLastAccentKey(lowerChar);
          return true;
        }
      } else if (e.ctrlKey) {
        // Alt+Ctrl 조합 (3번째)
        if (cycle.length > 2) {
          insertAccent(cycle[2]);
          setAccentCycleIndex({ ...accentCycleIndex, [lowerChar]: 2 });
          setLastAccentKey(lowerChar);
          return true;
        }
      } else if (e.shiftKey) {
        // Alt+Shift 조합 (2번째)
        if (cycle.length > 1) {
          insertAccent(cycle[1]);
          setAccentCycleIndex({ ...accentCycleIndex, [lowerChar]: 1 });
          setLastAccentKey(lowerChar);
          return true;
        }
      } else {
        // Alt만 (1번째 또는 순환)
        const currentIndex = accentCycleIndex[lowerChar] || 0;
        if (lastAccentKey === lowerChar && isAltPressed) {
          // 같은 키를 연속으로 누르면 순환
          const nextIndex = (currentIndex + 1) % cycle.length;
          setAccentCycleIndex({ ...accentCycleIndex, [lowerChar]: nextIndex });
          insertAccent(cycle[nextIndex]);
        } else {
          // 첫 번째 악센트 입력
          setAccentCycleIndex({ ...accentCycleIndex, [lowerChar]: 0 });
          insertAccent(cycle[0]);
        }
        setLastAccentKey(lowerChar);
        return true;
      }
    }
    return false;
  };

  // 키보드 입력 필터링 및 Alt 조합 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.key;
    
    // Alt 키 상태 추적
    if (key === 'Alt') {
      setIsAltPressed(true);
      return;
    }
    
    // Alt 키 조합으로 악센트 입력 시도
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const baseChar = key.toLowerCase();
      if (['e', 'a', 'u', 'i', 'o', 'c', 'y'].includes(baseChar)) {
        if (handleAccentInput(baseChar, e)) {
          e.preventDefault();
          return;
        }
      }
    }
    
    // Alt+Shift 조합 처리
    if (e.altKey && e.shiftKey && !e.ctrlKey) {
      const baseChar = key.toLowerCase();
      if (['e', 'a', 'u', 'i', 'o', 'c', 'y'].includes(baseChar)) {
        if (handleAccentInput(baseChar, e)) {
          e.preventDefault();
          return;
        }
      }
    }
    
    // Alt+Ctrl 조합 처리
    if (e.altKey && e.ctrlKey && !e.shiftKey) {
      const baseChar = key.toLowerCase();
      if (['e', 'u'].includes(baseChar)) {
        if (handleAccentInput(baseChar, e)) {
          e.preventDefault();
          return;
        }
      }
    }
    
    // Alt+Shift+Ctrl 조합 처리
    if (e.altKey && e.shiftKey && e.ctrlKey) {
      const baseChar = key.toLowerCase();
      if (baseChar === 'e') {
        if (handleAccentInput(baseChar, e)) {
          e.preventDefault();
          return;
        }
      }
    }
    
    // 백스페이스, 삭제, 화살표 키, 탭, 엔터 등은 허용
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
      return;
    }
    
    // Ctrl/Cmd + A, C, V, X, Z 등은 허용
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      return;
    }
    
    // 허용된 문자인지 확인 (단일 문자 체크)
    if (key.length === 1 && !singleCharRegex.test(key)) {
      e.preventDefault();
    }
  };

  // Alt 키 해제 추적
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Alt') {
      setIsAltPressed(false);
      // Alt 키를 떼면 마지막 악센트 키 초기화 (다음 입력을 위해)
      setTimeout(() => {
        setLastAccentKey(null);
      }, 100);
    }
  };

  // 악센트 순서 정의 (각 문자별로 사용 빈도 순서)
  const accentCycles: Record<string, string[]> = {
    'e': ['é', 'è', 'ê', 'ë'], // 가장 자주 사용되는 순서
    'a': ['à', 'â'],
    'u': ['ù', 'û', 'ü'],
    'i': ['î', 'ï'],
    'o': ['ô'],
    'c': ['ç'],
    'y': ['ÿ'],
  };

  // 전용 단축키 정의
  const accentShortcuts: Record<string, string> = {
    'é': 'Alt+E',
    'è': 'Alt+Shift+E',
    'ê': 'Alt+Ctrl+E',
    'ë': 'Alt+Shift+Ctrl+E',
    'à': 'Alt+A',
    'â': 'Alt+Shift+A',
    'ù': 'Alt+U',
    'û': 'Alt+Shift+U',
    'ü': 'Alt+Ctrl+U',
    'î': 'Alt+I',
    'ï': 'Alt+Shift+I',
    'ô': 'Alt+O',
    'ç': 'Alt+C',
    'ÿ': 'Alt+Y',
    'æ': 'Alt+Shift+A+E',
    'œ': 'Alt+Shift+O+E',
  };

  // 프랑스어 악센트 키보드 버튼들 (이미지에 있는 문자들만)
  const frenchAccents = [
    // Top row
    { label: 'ù', char: 'ù', title: 'u with accent grave', shortcut: accentShortcuts['ù'] },
    { label: 'û', char: 'û', title: 'u with circumflex', shortcut: accentShortcuts['û'] },
    { label: 'ü', char: 'ü', title: 'u with diaeresis', shortcut: accentShortcuts['ü'] },
    { label: 'ÿ', char: 'ÿ', title: 'y with diaeresis', shortcut: accentShortcuts['ÿ'] },
    { label: '€', char: '€', title: 'Euro symbol', shortcut: null },
    { label: ',', char: ',', title: 'comma', shortcut: null },
    { label: '"', char: '"', title: 'left double quotation mark', shortcut: null },
    { label: '"', char: '"', title: 'right double quotation mark', shortcut: null },
    { label: '«', char: '«', title: 'left-pointing double angle quotation mark', shortcut: null },
    { label: '»', char: '»', title: 'right-pointing double angle quotation mark', shortcut: null },
    { label: '–', char: '–', title: 'en dash', shortcut: null },
    { label: '—', char: '—', title: 'em dash', shortcut: null },
    // Bottom row
    { label: 'à', char: 'à', title: 'a with accent grave', shortcut: accentShortcuts['à'] },
    { label: 'â', char: 'â', title: 'a with circumflex', shortcut: accentShortcuts['â'] },
    { label: 'æ', char: 'æ', title: 'ash ligature', shortcut: accentShortcuts['æ'] },
    { label: 'ç', char: 'ç', title: 'c with cedilla', shortcut: accentShortcuts['ç'] },
    { label: 'é', char: 'é', title: 'e with accent aigu', shortcut: accentShortcuts['é'] },
    { label: 'è', char: 'è', title: 'e with accent grave', shortcut: accentShortcuts['è'] },
    { label: 'ê', char: 'ê', title: 'e with circumflex', shortcut: accentShortcuts['ê'] },
    { label: 'ë', char: 'ë', title: 'e with diaeresis', shortcut: accentShortcuts['ë'] },
    { label: 'ï', char: 'ï', title: 'i with diaeresis', shortcut: accentShortcuts['ï'] },
    { label: 'î', char: 'î', title: 'i with circumflex', shortcut: accentShortcuts['î'] },
    { label: 'ô', char: 'ô', title: 'o with circumflex', shortcut: accentShortcuts['ô'] },
    { label: 'œ', char: 'œ', title: 'oe ligature', shortcut: accentShortcuts['œ'] },
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
                  whiteSpace: 'pre-line',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden'
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              placeholder="주제에 대한 에세이를 작성하세요... (Alt+E로 é 입력, Alt+Shift+E로 è 입력)"
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

            {/* 프랑스어 악센트 키보드 (이미지와 동일한 레이아웃) */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                🇫🇷 프랑스어 특수 문자:
              </h4>
              {/* Top row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
              }}>
                {frenchAccents.slice(0, 12).map((accent, index) => (
                  <button
                    key={`top-${index}`}
                    onClick={() => insertAccent(accent.char)}
                    title={accent.shortcut ? `${accent.title}\n단축키: ${accent.shortcut}` : accent.title}
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
                      boxShadow: '0 2px 5px rgba(102, 126, 234, 0.3)',
                      minWidth: '40px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                      const tooltip = e.currentTarget.querySelector('.shortcut-tooltip') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(102, 126, 234, 0.3)';
                      const tooltip = e.currentTarget.querySelector('.shortcut-tooltip') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '0';
                    }}
                  >
                    {accent.label}
                    {accent.shortcut && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.7rem',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        zIndex: 1000
                      }} className="shortcut-tooltip">
                        {accent.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Bottom row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {frenchAccents.slice(12, 24).map((accent, index) => (
                  <button
                    key={`bottom-${index}`}
                    onClick={() => insertAccent(accent.char)}
                    title={accent.shortcut ? `${accent.title}\n단축키: ${accent.shortcut}` : accent.title}
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
                      boxShadow: '0 2px 5px rgba(102, 126, 234, 0.3)',
                      minWidth: '40px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                      const tooltip = e.currentTarget.querySelector('.shortcut-tooltip') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(102, 126, 234, 0.3)';
                      const tooltip = e.currentTarget.querySelector('.shortcut-tooltip') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '0';
                    }}
                  >
                    {accent.label}
                    {accent.shortcut && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.7rem',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        zIndex: 1000
                      }} className="shortcut-tooltip">
                        {accent.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 사용법 설명 */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '10px',
                borderLeft: '4px solid #667eea',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                color: '#555'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: '#333' }}>
                  📖 사용법 (Usage):
                </p>
                <p style={{ margin: '0 0 10px 0', fontStyle: 'italic' }}>
                  Where one letter can receive more than one type of accent mark, the most frequently used accent is typed with a single keystroke, the second most frequent accent with two keystrokes, etc. For example, there are four types of "e with accent" in the French language (é, è, ê and ë). If you hold down Alt and press E, that will type the most frequently used one – e with accent aigu (é). Pressing E again will type the second most common accented e – e with accent grave (è) – and so on. If you're the kind of person who wants maximum typing speed, you can also use dedicated shortcuts for è and ê (mouse over a button to check its associated keyboard shortcuts).
                </p>
                <p style={{ margin: '10px 0 0 0', fontWeight: 600, color: '#333' }}>
                  🇰🇷 한국어 사용법:
                </p>
                <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>기본 사용법:</strong> Alt 키를 누른 상태에서 문자를 입력하면 가장 자주 사용되는 악센트가 입력됩니다.</li>
                  <li><strong>예시:</strong> Alt+E → é (1번째), Alt+E (같은 키 연속 입력) → è (2번째), Alt+E (계속) → ê (3번째), Alt+E (계속) → ë (4번째)</li>
                  <li><strong>빠른 입력:</strong> 전용 단축키를 사용하면 더 빠르게 입력할 수 있습니다. 버튼에 마우스를 올리면 단축키를 확인할 수 있습니다.</li>
                  <li><strong>단축키 예시:</strong> Alt+Shift+E → è, Alt+Ctrl+E → ê, Alt+Shift+Ctrl+E → ë</li>
                  <li><strong>다른 문자:</strong> a, u, i, o, c, y도 동일한 방식으로 사용할 수 있습니다.</li>
                </ul>
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
