import React, { useState } from 'react';
import './App.css';
import QuestionCard from './components/QuestionCard';
import SpeechRecognition from './components/SpeechRecognition';
import ResultDisplay from './components/ResultDisplay';
import LandingPage from './components/LandingPage';
import TEFWriting from './components/TEFWriting';
import TEFSpeaking from './components/TEFSpeaking';
import IELTSWriting, { task1Topics as ieltsTask1Topics, task2Prompts as ieltsTask2Prompts, sampleAnswers as ieltsSampleAnswers } from './components/IELTSWriting';
import SpeakButton from './components/SpeakButton';
import { analyzeWithGemini } from './utils/geminiApi';
import { sampleAnswers as tefSampleAnswers } from './components/TEFSampleAnswers';
import { lettersTopics, lettersSampleAnswers, faitDiverTopics, faitDiverSampleAnswers } from './components/TEFWritingTopics';

interface Question {
  id: number;
  question: string;
  sampleAnswer: string;
  category: string;
}

interface Part2Question {
  id: number;
  topic: string;
  mainQuestion: string;
  subQuestions: string[];
  sampleAnswer: string;
  category: string;
  part3Questions: Part3Question[];
}

interface Part3Question {
  id: number;
  question: string;
  sampleAnswer: string;
}

type RandomSpeakingQuestion =
  | { kind: 'ielts-part1'; question: string; category: string; sampleAnswer: string }
  | { kind: 'ielts-part2'; topic: string; mainQuestion: string; subQuestions: string[]; category: string; sampleAnswer: string; part3Questions: Part3Question[] }
  | { kind: 'ielts-part3'; question: string; category: string; sampleAnswer: string }
  | { kind: 'tef'; section: 'A' | 'B'; questionNumber: number; imagePath: string; sampleAnswer: string };

type RandomWritingQuestion =
  | { kind: 'ielts-task1'; title: string; guidanceForScreen?: React.ReactNode; imagePaths?: string[]; sampleAnswer: string }
  | { kind: 'ielts-task2'; prompt: string; sampleAnswer: string }
  | { kind: 'tef-letters'; prompt: string; sampleAnswer: string }
  | { kind: 'tef-fait'; prompt: string; sampleAnswer: string };

type RandomQuestion = RandomSpeakingQuestion | RandomWritingQuestion;

interface RandomSpeakingSectionProps {
  onBack: () => void;
  isFrench: boolean;
  question: RandomSpeakingQuestion;
  onNext: () => void;
  showSampleAnswer: boolean;
  setShowSampleAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  userAnswer: string;
  transcript: string;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  onRecordingComplete: (transcript: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  showResult: boolean;
  similarityScore: number | null;
  geminiAnalysis: any;
}

const RandomSpeakingSection: React.FC<RandomSpeakingSectionProps> = ({
  onBack,
  isFrench,
  question,
  onNext,
  showSampleAnswer,
  setShowSampleAnswer,
  userAnswer,
  transcript,
  isRecording,
  setIsRecording,
  setTranscript,
  onRecordingComplete,
  onAnalyze,
  isAnalyzing,
  showResult,
  similarityScore,
  geminiAnalysis
}) => (
  <div className="App">
    <header className="App-header">
      <button
        onClick={onBack}
        className="back-button"
        style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        ← 뒤로 가기
      </button>
      <h1>🎲 랜덤 문제</h1>
    </header>
    <main className="App-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#333' }}>
            {isFrench ? '🇫🇷 TEF Canada - Expression Orale' : '🇬🇧 IELTS - Speaking'}
          </div>
          <button
            onClick={onNext}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600
            }}
          >
            다른 문제
          </button>
        </div>

        <div className="question-card">
          <div className="question-section">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>
                📝 질문 (
                {question.kind === 'tef'
                  ? `Section ${question.section} - Question ${question.questionNumber}`
                  : question.category}
                )
              </h3>
              {question.kind !== 'tef' && (
                <SpeakButton
                  text={
                    question.kind === 'ielts-part2'
                      ? `${question.mainQuestion} ${question.subQuestions.join('. ')}`
                      : question.question
                  }
                />
              )}
            </div>
            <div className="question-text" style={{ textAlign: 'left' }}>
              {question.kind === 'tef' ? (
                <img
                  src={question.imagePath}
                  alt={`TEF question ${question.questionNumber}`}
                  style={{ width: '100%', borderRadius: '10px', border: '1px solid #e0e0e0' }}
                />
              ) : question.kind === 'ielts-part2' ? (
                <>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>{question.topic}</div>
                  <div style={{ marginBottom: '8px' }}>{question.mainQuestion}</div>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {question.subQuestions.map((subQuestion, index) => (
                      <li key={`${question.topic}-${index}`}>{subQuestion}</li>
                    ))}
                  </ul>
                  {question.part3Questions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <details className="sample-answer">
                        <summary>Part 3 Questions</summary>
                        <div style={{ marginTop: '10px' }}>
                          {question.part3Questions.map((part3, index) => (
                            <div key={`${question.topic}-part3-${part3.id}-${index}`} style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{part3.question}</div>
                              <div style={{ whiteSpace: 'pre-line', color: '#000' }} dangerouslySetInnerHTML={{ __html: part3.sampleAnswer }} />
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </>
              ) : (
                <div>{question.question}</div>
              )}
            </div>
          </div>

          <div className="sample-answer-section">
            <button
              onClick={() => setShowSampleAnswer((prev) => !prev)}
              className="show-answer-button"
            >
              {showSampleAnswer ? '📖 모범 답안 숨기기' : '📖 모범 답안 보기'}
            </button>
            {showSampleAnswer && (
              <div className="sample-answer-content">
                <p 
                  className="sample-answer-text" 
                  style={{ whiteSpace: 'pre-line' }}
                  dangerouslySetInnerHTML={{ 
                    __html: question.sampleAnswer || '모범 답안이 아직 작성되지 않았습니다.' 
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <SpeechRecognition
          isRecording={isRecording}
          onStartRecording={() => {
            setIsRecording(true);
            setTranscript('');
          }}
          onStopRecording={() => setIsRecording(false)}
          onRecordingComplete={onRecordingComplete}
          onTranscriptUpdate={setTranscript}
        />

        {isRecording && (
          <div className="user-answer">
            <h3>🎤 실시간 음성 인식:</h3>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              {transcript || '음성을 인식하고 있습니다...'}
            </p>
          </div>
        )}

        {userAnswer && !isRecording && (
          <div className="user-answer">
            <h3>🎤 당신의 답변:</h3>
            <p>{userAnswer}</p>
            <button
              onClick={onAnalyze}
              className="compare-button"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '🤖 AI 분석 중...' : '📊 유사도 분석하기'}
            </button>
          </div>
        )}

        {showResult && similarityScore !== null && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={question.sampleAnswer || ''}
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </div>
    </main>
  </div>
);

interface RandomIeltsSpeakingViewProps {
  question: RandomSpeakingQuestion;
  onBack: () => void;
  onNext: () => void;
  autoSpeak: boolean;
  setAutoSpeak: React.Dispatch<React.SetStateAction<boolean>>;
  showSampleAnswer: boolean;
  setShowSampleAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  userAnswer: string;
  transcript: string;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  onRecordingComplete: (transcript: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  showResult: boolean;
  similarityScore: number | null;
  geminiAnalysis: any;
}

const RandomIeltsSpeakingView: React.FC<RandomIeltsSpeakingViewProps> = ({
  question,
  onBack,
  onNext,
  autoSpeak,
  setAutoSpeak,
  showSampleAnswer,
  setShowSampleAnswer,
  userAnswer,
  transcript,
  isRecording,
  setIsRecording,
  setTranscript,
  onRecordingComplete,
  onAnalyze,
  isAnalyzing,
  showResult,
  similarityScore,
  geminiAnalysis
}) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const speakText = React.useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, []);

  React.useEffect(() => {
    if (autoSpeak) {
      const text = getQuestionTextForTTS(question);
      if (text) speakText(text);
      setAutoSpeak(false);
    }
  }, [question, autoSpeak, setAutoSpeak, speakText]);

  React.useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const questionText = getQuestionTextForTTS(question);
  const categoryLabel =
    question.kind === 'ielts-part1' ? question.category
    : question.kind === 'ielts-part2' ? question.category
    : question.kind === 'ielts-part3' ? question.category
    : '';

  return (
    <div className="App">
      <header className="App-header">
        <button
          onClick={onBack}
          className="back-button"
          style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← 뒤로 가기
        </button>
        <h1>🎧 랜덤 영어 스피킹</h1>
      </header>
      <main className="App-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, color: '#333' }}>
              🇬🇧 IELTS Speaking - {question.kind === 'ielts-part1' ? 'Part 1' : question.kind === 'ielts-part2' ? 'Part 2' : 'Part 3'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { window.speechSynthesis.cancel(); onNext(); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                다른 문제
              </button>
            </div>
          </div>

          <div className="question-card">
            <div className="question-section">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>📝 질문 ({categoryLabel})</h3>
                {isSpeaking ? (
                  <button
                    onClick={handleStop}
                    className="speak-button speaking"
                    title="읽기 중지"
                  >
                    ⏹ 중지
                  </button>
                ) : (
                  <button
                    onClick={() => speakText(questionText)}
                    className="speak-button"
                    title="문제 듣기"
                  >
                    🔊 문제 듣기
                  </button>
                )}
              </div>
              <div className="question-text" style={{ textAlign: 'left' }}>
                {question.kind === 'ielts-part2' ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: '8px' }}>{question.topic}</div>
                    <div style={{ marginBottom: '8px' }}>{question.mainQuestion}</div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {question.subQuestions.map((subQ, index) => (
                        <li key={index}>{subQ}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div>{question.kind === 'ielts-part1' || question.kind === 'ielts-part3' ? question.question : ''}</div>
                )}
              </div>
            </div>

            <div className="sample-answer-section">
              <button
                onClick={() => setShowSampleAnswer((prev) => !prev)}
                className="show-answer-button"
              >
                {showSampleAnswer ? '📖 모범 답안 숨기기' : '📖 모범 답안 보기'}
              </button>
              {showSampleAnswer && (
                <div className="sample-answer-content">
                  <p
                    className="sample-answer-text"
                    style={{ whiteSpace: 'pre-line' }}
                    dangerouslySetInnerHTML={{
                      __html: question.sampleAnswer || '모범 답안이 아직 작성되지 않았습니다.'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <SpeechRecognition
            isRecording={isRecording}
            onStartRecording={() => {
              setIsRecording(true);
              setTranscript('');
            }}
            onStopRecording={() => setIsRecording(false)}
            onRecordingComplete={onRecordingComplete}
            onTranscriptUpdate={setTranscript}
          />

          {isRecording && (
            <div className="user-answer">
              <h3>🎤 실시간 음성 인식:</h3>
              <p style={{ fontStyle: 'italic', color: '#666' }}>
                {transcript || '음성을 인식하고 있습니다...'}
              </p>
            </div>
          )}

          {userAnswer && !isRecording && (
            <div className="user-answer">
              <h3>🎤 당신의 답변:</h3>
              <p>{userAnswer}</p>
              <button
                onClick={onAnalyze}
                className="compare-button"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? '분석 중...' : '🤖 Gemini로 분석하기'}
              </button>
            </div>
          )}

          {showResult && (
            <ResultDisplay
              similarityScore={similarityScore ?? 0}
              userAnswer={userAnswer}
              sampleAnswer={question.sampleAnswer || ''}
              geminiAnalysis={geminiAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}
        </div>
      </main>
    </div>
  );
};

interface RandomWritingSectionProps {
  onBack: () => void;
  isIelts: boolean;
  question: RandomWritingQuestion;
  onNext: () => void;
  showSampleAnswer: boolean;
  setShowSampleAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  answer: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  wordCount: number;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  showResult: boolean;
  similarityScore: number | null;
  geminiAnalysis: any;
}

const RandomWritingSection: React.FC<RandomWritingSectionProps> = ({
  onBack,
  isIelts,
  question,
  onNext,
  showSampleAnswer,
  setShowSampleAnswer,
  answer,
  setAnswer,
  wordCount,
  onAnalyze,
  isAnalyzing,
  showResult,
  similarityScore,
  geminiAnalysis
}) => (
  <div className="App">
    <header className="App-header">
      <button
        onClick={onBack}
        className="back-button"
        style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        ← 뒤로 가기
      </button>
      <h1>🎲 랜덤 문제</h1>
    </header>
    <main className="App-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#333' }}>
            {isIelts ? '🇬🇧 IELTS - Writing' : '🇫🇷 TEF Canada - Expression Écrite'}
          </div>
          <button
            onClick={onNext}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600
            }}
          >
            다른 문제
          </button>
        </div>

        <h3 style={{ marginTop: '15px', marginBottom: '10px', color: '#333' }}>
          📝 문제 (
          {question.kind === 'ielts-task1'
            ? 'IELTS Task 1'
            : question.kind === 'ielts-task2'
            ? 'IELTS Task 2'
            : question.kind === 'tef-letters'
            ? 'TEF Letters'
            : 'TEF Fait Diver'}
          )
        </h3>

        {question.kind === 'ielts-task1' ? (
          <>
            {question.guidanceForScreen && (
              <div style={{ marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #667eea' }}>
                <div style={{ lineHeight: '1.7', color: '#333' }}>
                  {question.guidanceForScreen}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ marginTop: 0, lineHeight: '1.6', color: '#333', whiteSpace: 'pre-line' }}>
            {question.prompt}
          </p>
        )}
      </div>

      {question.kind === 'ielts-task1' && (question.imagePaths || []).length > 0 && (
        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>🖼️ Sample task</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(question.imagePaths || []).map((path, index) => (
              <img
                key={`${path}-${index}`}
                src={path}
                alt={`Task ${index + 1}`}
                style={{ width: '100%', borderRadius: '10px', border: '1px solid #e0e0e0' }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>✍️ Your Answer</h3>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
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
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ color: '#666' }}>단어 수: {wordCount}</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSampleAnswer((prev) => !prev)}
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
              onClick={onAnalyze}
              disabled={isAnalyzing || !answer.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: isAnalyzing || !answer.trim() ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                opacity: isAnalyzing || !answer.trim() ? 0.6 : 1
              }}
            >
              {isAnalyzing ? '🤖 AI 분석 중...' : '📊 AI 분석하기'}
            </button>
          </div>
        </div>
      </div>

      {showSampleAnswer && (
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', marginTop: '15px', borderLeft: '4px solid #28a745' }}>
          <h4 style={{ marginTop: 0 }}>📖 모범 답안</h4>
          <p 
            style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-line', color: '#333' }}
            dangerouslySetInnerHTML={{ 
              __html: question.sampleAnswer || '모범 답안이 아직 작성되지 않았습니다.' 
            }}
          />
        </div>
      )}

      {showResult && similarityScore !== null && (
        <ResultDisplay
          similarityScore={similarityScore}
          userAnswer={answer}
          sampleAnswer={question.sampleAnswer || ''}
          geminiAnalysis={geminiAnalysis}
          isAnalyzing={isAnalyzing}
        />
      )}
    </main>
  </div>
);

const sampleQuestions: Question[] = [
  // Your Country
  {
    id: 1,
    question: "Which part of your country do most people live in?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 서울이 가장 바쁜 도시이지만, 집값과 공기 질 때문에 서울 외곽에 살며 출퇴근하는 사람이 더 많다는 내용입니다.\n\nAs you might expect, Seoul is the busiest city in Korea and a lot of people live there. But I think more people live on the outskirts of Seoul and commute in because the rent is cheaper and the air is a bit better than in the city.",
    category: "Part 1 - Your Country"
  },
  {
    id: 2,
    question: "Tell me about the main industries there.",
    sampleAnswer: "<strong>[한국어 개요]</strong> 서울에 삼성, LG, 현대 등 대기업 사무실이 있어 기술·전자 산업이 주요 산업이며, 카페와 바가 많아 요식업도 큰 산업이라는 내용입니다.\n\nIn and around Seoul has offices from the biggest companies in Korea like Samsung, LG and Hyundai so they create lots of jobs. Therefore, I think the main industries are to do with technology and electronics. Hospitality is also a big industry here with cafes and bars on every corner.",
    category: "Part 1 - Your Country"
  },
  {
    id: 3,
    question: "How easy is it to travel around your country?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 기차와 버스가 자주 다니고 저렴하며, KTX도 있고 도로 상태가 좋아 한국 내 이동이 매우 쉽다는 내용입니다.\n\nIt's so easy to travel around Korea, trains and buses are frequent and cheap. There is also a high speed train that travels through the country although this is a bit more expensive. The roads are great so driving is also a good option if you want to explore yourself.",
    category: "Part 1 - Your Country"
  },
  {
    id: 4,
    question: "Has your country changed much since you were a child?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국이 어릴 때보다 훨씬 현대적이고 국제적으로 변했으며, 세계 각국 음식과 외국인을 볼 수 있고 기술도 급격히 발전했다는 내용입니다.\n\nI think it has changed massively. It has become much more modern and internationally aware. These days it's possible to find food from all over the world and see lots of foreign people working in Korea. Also technology has developed rapidly, maybe too much so.",
    category: "Part 1 - Your Country"
  },
  
  // Your Home
  {
    id: 5,
    question: "Do you live in a house or a flat?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 방 3개, 공용 욕실, 주방, 거실이 있는 아파트에 살고 있으며, 마스터 베드룸에 전용 욕실이 있고 편의점이 가까워 편리하다는 내용입니다.\n\nCurrently, I’m residing in a flat that features three bedrooms, a <strong>common bathroom</strong>, a kitchen, and a spacious living room. My bedroom is the <strong>master bedroom</strong>, so it comes with an <strong>attached bathroom</strong>. One great thing is the <strong>laundry room</strong> in the basement equipped with washers and dryers. With a convenience store located just a stone’s throw away, the location is incredibly functional and convenient.",
    category: "Part 1 - Your Home"
  },
  {
    id: 6,
    question: "What are the differences between the place you live now and where you lived before?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 이전에는 밴쿠버에서 주택의 지하 스위트를 빌렸지만, 지금은 몬트리올 아파트에서 마스터룸을 사용하며 나머지 공간을 공유한다는 내용입니다.\n\nThe biggest difference is the type of accommodation. Before moving to <strong>Montreal</strong>, I lived in <strong>Vancouver</strong>, where I rented an <strong>entire basement suite</strong> in a house. However, now I’m living in an <strong>apartment</strong>, and I occupy the master room with a private bathroom while sharing the rest of the space.",
    category: "Part 1 - Your Home"
  },
  {
    id: 7,
    question: "Did you like the place you lived in as a child?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 어린 시절 시골에 있는 집에서 개, 토끼, 닭 등 반려동물을 키우며 살았기 때문에 매우 좋아했다는 내용입니다.\n\nYes, very much. I liked the house that I lived in my childhood as it was located in countryside and I used to raise lots of pets including dogs, rabbits, and some chickens.",
    category: "Part 1 - Your Home"
  },
  {
    id: 8,
    question: "Which part of your home do you like best?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 저녁에 가족이 모두 모여 하루에 대해 이야기할 수 있는 거실을 가장 좋아한다는 내용입니다.\n\nI like living room the best as all my family members gather round in the evening and we can chat together about the day.",
    category: "Part 1 - Your Home"
  },
  {
    id: 9,
    question: "In the future, what type of home would you like to live in?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 깨끗하고 관리가 쉬운 넓은 콘도에 살고 싶으며, 정원 관리 걱정이 없고 보안이 좋아 안전하고 편안할 것이라는 내용입니다.\n\nIn the future, I’d love to live in a spacious condo because it’s clean and low-maintenance. You don’t have to worry about things like gardening, and most condos have great security, which would make me feel safe and comfortable.",
    category: "Part 1 - Your Home"
  },
  
  // Weekends
  {
    id: 10,
    question: "How do you usually spend your weekends?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 활동적인 성격이라 주말에 항상 외출하며, 친구들과 운동하거나 점심·맥주를 마시며 수다를 떤다는 내용입니다.\n\nI'm quite an active person so I'm always out on weekends. I usually play sports with my friends or go for lunch or a beer and just have a chat to catch up with each other.",
    category: "Part 1 - Weekends"
  },
  {
    id: 11,
    question: "Which is your favourite part of the weekend?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 토요일 아침에 일어나는 순간이 가장 좋으며, 재미있는 하루가 시작되고 일요일에 쉬고 나서 월요일에 출근하면 된다는 내용입니다.\n\nI love when I wake up on Saturday morning because it's just the start of a fun day. I know that I'm going to have fun and then still have Sunday to relax before I go back to work.",
    category: "Part 1 - Weekends"
  },
  {
    id: 12,
    question: "Do you think your weekends are long enough?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 항상 주말이 짧다고 느끼지만, 긴 주말은 오히려 너무 길 때도 있어서 적당하다고 생각한다는 내용입니다.\n\nWell, I always say the weekend is too short and that it goes so fast but when I have a long weekend sometimes I think it's actually too long. Every now and then it's nice to have Monday as a holiday but for me weekends are long enough.",
    category: "Part 1 - Weekends"
  },
  {
    id: 13,
    question: "How important do you think it is to have free time at the weekend?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 주말 여가 시간은 필수적이며, 충전과 휴식 없이는 생산성을 유지할 수 없기 때문에 업무 성과와 전반적인 건강에 중요하다는 내용입니다.\n\nThat's an interesting question. I think it's absolutely essential because without free time on weekends, people can't really recharge or relax. To stay productive during the week, we need to feel well-rested, so having time to unwind is vital for both our work performance and our overall well-being.",
    category: "Part 1 - Weekends"
  },
  
  // Transportation
  {
    id: 14,
    question: "How often do you use public transport?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 매일 버스를 타고 출퇴근하며, 보통 1시간 반 정도 걸린다는 내용입니다.\n\nI take a bus every day. I have to take it to go to work or to go home. It normally takes around an hour and half.",
    category: "Part 1 - Transportation"
  },
  {
    id: 15,
    question: "When was the last time you travelled by public transport?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 오늘 아침에도 버스를 탔으며, 매일 아침 출근할 때 이용하지만 항상 붐벼서 좋아하지 않는다는 내용입니다.\n\nActually it's this morning. I always travel by bus every morning to go to work. It's often crowded so I don't really like travelling by bus.",
    category: "Part 1 - Transportation"
  },
  {
    id: 16,
    question: "Do you prefer to use a private car or public transport?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 상황에 따라 다르며, 장거리는 자가용이 편하지만 일상적으로는 정시에 오고 저렴한 대중교통을 선호한다는 내용입니다.\n\nWell, it depends on the situations. Sometimes it's more convenient to use a private car like when travelling in distance. But on a daily basis, I prefer to use public transport as it's punctual and cheaper.",
    category: "Part 1 - Transportation"
  },
  {
    id: 17,
    question: "What form of transport would you recommend visitors to your hometown use?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 지하철을 추천하며, 빠르고 편리하고 영어와 한국어로 안내방송이 나와 외국인도 쉽게 이용할 수 있다는 내용입니다.\n\nI'd definitely recommend visitors to take underground (subway) as it's prompt, quick, and convenient to move around. Also all the announcements are also made in English as well as in Korean, so they can figure out what station they are on easily.",
    category: "Part 1 - Transportation"
  },
  {
    id: 18,
    question: "Do you think people will drive more in the future?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 두 가지 관점: (1) 편의상 차량 이용이 늘 것이다. (2) 환경 문제 인식으로 오히려 줄어들 수 있다는 내용입니다.\n\n(Answer 1) As today's trend, people tend to drive more and buy more than one car in a household. And for their convenience, I think they will use cars more.\n\n(Answer 2) I don't quite think so. People in modern society know the seriousness of environmental problems so in order to reduce pollution, maybe less number of people will drive cars.",
    category: "Part 1 - Transportation"
  },
  {
    id: 19,
    question: "Is driving to work popular in your country?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 대중교통이 더 오래 걸리고 정해진 노선만 다니기 때문에 자가용 출근을 선호하는 사람들이 있다는 내용입니다.\n\nYes, it is. As public transports normally take longer time and only go by their routine, some people prefer to drive to work in Korea.",
    category: "Part 1 - Transportation"
  },
  
  // Television
  {
    id: 20,
    question: "How often do you watch television?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 거의 매일 1시간 정도 TV를 보며, 못 보는 날도 있지만 괜찮고 짧은 시간 즐기는 편이라는 내용입니다.\n\nI watch TV most days, not for very long, maybe about an hour. Some days I don't have time and that's fine, I don't need television in my life but I do enjoy it for short periods of time.",
    category: "Part 1 - Television"
  },
  {
    id: 21,
    question: "Which television channel do you usually watch?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 자연과 야생동물 프로그램에 관심이 많아 내셔널 지오그래픽을 주로 시청한다는 내용입니다.\n\nI'd say I mostly watch National Geographic because I'm really interested in programs about nature and wildlife. I love shows that study animals in the wild since that's something we rarely see in daily life, and I find it absolutely fascinating.",
    category: "Part 1 - Television"
  },
  {
    id: 22,
    question: "Do you enjoy the advertisements on television?",
    sampleAnswer: "<strong>[한국어 개요]</strong> TV 광고를 전혀 좋아하지 않으며, 흥미로운 프로그램 중간에 5분 광고가 나오면 집중이 끊겨서 채널을 돌린다는 내용입니다.\n\nI definitely do not. They are the most annoying part of television, just when I'm watching an interesting program there's a 5-minute break with ads. It makes me lose focus and I usually switch the channel.",
    category: "Part 1 - Television"
  },
  {
    id: 23,
    question: "Do you think that most programs on television are good?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 채널이 많지만 흥미로운 프로그램을 찾기 어렵고, 비슷한 농담과 아이디어가 반복되어 지루하다는 내용입니다.\n\nActually, I don't think so because even though there are so many channels these days, I often struggle to find something interesting. A lot of shows feel repetitive, with similar jokes and ideas, which makes them quite boring for me.",
    category: "Part 1 - Television"
  },
  
  // Newspapers and Magazines
  {
    id: 24,
    question: "Which newspapers and magazines do you read?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국의 일간지인 코리아타임스를 읽으며, 정부 이슈에 대해 강한 의견을 제시하기 때문에 좋아한다는 내용입니다.\n\nI prefer to read the Korea Times which is a daily newspaper in Korea. I like this paper because they always give strong opinions on government issues.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 25,
    question: "What kinds of article are you most interested in?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 경제와 금융, 특히 주식 시장에 관심이 많아 시장 동향과 투자 전략 기사를 즐겨 읽는다는 내용입니다.\n\nI'd say I'm most interested in articles about economics and finance because I'm deeply interested in these areas, especially the stock market. I enjoy keeping up with market trends and investment strategies, and I think it's essential to understand what's happening in your country's economy.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 26,
    question: "Have you ever read a magazine or newspaper in a foreign language?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 몬트리올에서 프랑스어 신문을 읽어본 적이 있으며, 모든 내용을 이해하기는 어려웠지만 현지 문화를 배우는 좋은 방법이었다는 내용입니다.\n\nYes, I have. I remember trying to read a French newspaper when I was in Montreal. The articles were interesting, but my French wasn't strong enough to fully understand everything. I struggled with some words and complex sentences, but it was still a great way to practice and learn more about the local culture.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 27,
    question: "Do you think reading a newspaper or magazine in a foreign language is a good way to learn the language?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 외국어 신문 읽기는 문맥 속에서 어휘를 자연스럽게 배울 수 있어 언어 능력과 문화 지식을 향상시키는 좋은 방법이라는 내용입니다.\n\nAbsolutely, because reading newspapers in a foreign language helps you learn vocabulary in context. When I tried reading a French newspaper in Montreal, it was challenging, but I picked up new words naturally. It's an engaging way to improve both language skills and cultural knowledge.",
    category: "Part 1 - Newspapers"
  },
  
  // Music
  {
    id: 28,
    question: "What kinds of music do you like?",
    sampleAnswer: "<strong>[한국어 개요]</strong> R&B, 팝, 클래식 등 대부분의 장르를 좋아하며, 여유 시간이 있을 때마다 음악을 듣는다는 내용입니다.\n\nI like most kinds, like R&B, pop, even classical music. I listen to music whenever I have spare time.",
    category: "Part 1 - Music"
  },
  {
    id: 29,
    question: "When was the last time you went to a musical performance?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 4월에 친구와 한국에서 열린 콜드플레이 콘서트에 갔으며, 라이브 분위기와 관객의 에너지가 잊을 수 없었다는 내용입니다.\n\nI remember the last time was in April, when I went to a Coldplay concert in Korea with one of my friends. It was an amazing experience—the live atmosphere and energy from the crowd were absolutely unforgettable.",
    category: "Part 1 - Music"
  },
  {
    id: 30,
    question: "Do you feel that going to a concert is better than listening to a CD, or watching a concert on TV?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 상황에 따라 다르며, 소규모 극장 콘서트는 직접 가는 것이 좋지만 큰 경기장이면 CD나 TV가 낫다는 내용입니다.\n\nIt depends, I prefer going to a concert when the concert is held in a small theatre, but if it's held in a big halls or stadium, I think listening to a CD or watching a concert on TV is better.",
    category: "Part 1 - Music"
  },
  {
    id: 31,
    question: "Have you ever been in a choir or some other musical performance?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 초등학교 때 플루트를 배워 음악 동아리에 가입했고, 학교 축제에서 함께 공연한 경험이 있다는 내용입니다.\n\nYes, I have. I remember when I was in elementary school, I learned to play the flute and joined a small music club. We even performed together at the school festival, which was a really fun experience.",
    category: "Part 1 - Music"
  },
  {
    id: 32,
    question: "Do students in your country have to study the creative arts, such as music?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국에서는 음악이 초등학교 필수 과목이며, 미술과 무용 등 다른 예술 과목도 국가 교육과정에 포함되어 있다는 내용입니다.\n\nYes, they do. In Korea, music is a required subject in elementary school, along with other creative arts like painting and sometimes dance. It's part of the national curriculum to give students a balanced education.",
    category: "Part 1 - Music"
  },
  
  // Musical Instrument
  {
    id: 41,
    question: "Which instrument do you like listening to most? and why?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 플루트를 가장 좋아하며, 어머니가 어릴 때 연주하셨기 때문에 익숙하고 듣기만 해도 미소가 지어진다는 내용입니다.\n\nI like listening to the flute the most, the sound of it always puts a smile on my face for some reason. I think it's because my mother used to play the flute when I was young so I'm used to hearing it.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 42,
    question: "Have you ever learned to play a musical instrument?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국의 많은 아이들처럼 초등학교 때 피아노를 배웠으며, 방과 후 학원에 약 2년간 다녔다는 내용입니다.\n\nI have, like most children in Korea I learned to play the piano when I was an elementary school student. I went to a private academy after school for about two years.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 43,
    question: "Do you think children should learn to play a musical instrument at school?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 악기 학습이 창의력과 규율을 기르는 데 도움이 되며, 친구가 초등학교에서 기타를 배워 지금은 밴드 기타리스트가 된 예를 들었습니다.\n\nYes, I believe children should learn a musical instrument at school because it helps them develop creativity and discipline. For example, one of my friends learned the guitar in elementary school, and now he's a guitarist in a band.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 44,
    question: "How easy would it be to learn a musical instrument without a teacher?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 유튜브 등 온라인 자료가 많아 선생님 없이도 독학이 가능하며, 예전보다 훨씬 쉬워졌다는 내용입니다.\n\nI think it's possible these days because there are so many online resources like video tutorials and apps. Students can practice at home using platforms such as YouTube, so it's much easier than before, even without a personal teacher.",
    category: "Part 1 - Musical Instrument"
  },
  
  // Food
  {
    id: 45,
    question: "What sort of food do you like eating most?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 파스타, 라자냐, 피자 등 이탈리안 음식을 가장 좋아하며, 풍부한 소스와 다양한 맛이 좋다는 내용입니다.\n\nWell, I can't get enough of Italian food like pasta, lasagne or pizza. I love the rich sauces and variety of flavours.",
    category: "Part 1 - Food"
  },
  {
    id: 46,
    question: "Who normally does the cooking in your house?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국의 많은 가정처럼 어머니가 요리를 담당하며, 아버지는 일하고 어머니는 가사를 맡아왔다는 내용입니다.\n\nLike a lot of families in Korea my mother does the cooking. My father has always worked and my mother has always taken care of household jobs, she's a great cook and enjoys cooking for us.",
    category: "Part 1 - Food"
  },
  {
    id: 47,
    question: "Do you watch cookery programs on TV?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 요리에 관심이 없어 요리 프로그램을 거의 보지 않지만, 가끔 온라인에서 음식 영상을 우연히 접한다는 내용입니다.\n\nNot really, because I'm not very interested in cooking. So I hardly ever watch cooking shows, although sometimes I come across short food videos online by accident.",
    category: "Part 1 - Food"
  },
  {
    id: 48,
    question: "In general, do you prefer eating out or eating at home? why?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 한국에서는 외식이 비교적 저렴하고 선택지가 많아 외식을 선호하며, 시간을 아낄 수 있어 가치가 있다는 내용입니다.\n\nI much prefer eating out, in Korea it's relatively cheap to eat out and there are so many options on every corner. It might be a bit more expensive but with the time I save I think it's well worth it.",
    category: "Part 1 - Food"
  },
  {
    id: 49,
    question: "In your country, is it expensive to eat out?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 예전에는 비싸지 않았지만 요즘 가격이 많이 올랐으며, 비빔밥이 7달러에서 15달러로 올라 정기적 외식이 부담된다는 내용입니다.\n\nIt didn't use to be very expensive, but these days the prices have gone up a lot. For example, a bowl of bibimbap used to cost around seven dollars, but now it's about fifteen. So eating out regularly can be quite pricey.",
    category: "Part 1 - Food"
  },
  {
    id: 50,
    question: "Tell me about a traditional Korean dish.",
    sampleAnswer: "<strong>[한국어 개요]</strong> 가장 전통적인 요리로 김치찌개를 소개하며, 발효 배추, 고기, 채소를 넣은 매운 국물에 밥과 함께 먹는다는 내용입니다.\n\nI think the most traditional dish is Kimchi soup. It's a spicy soup with fermented cabbage, meat and vegetables all mixed together served with rice. The combination of flavours is great.",
    category: "Part 1 - Food"
  },
  
  // Snacks
  {
    id: 51,
    question: "Do you like to eat snacks?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 스니커즈나 치토스 같은 간식을 좋아하며, 빠르고 맛있고 에너지를 보충해주기 때문이라는 내용입니다.\n\nI'd say I really like eating snacks, especially chocolate bars like Snickers or chips such as Cheetos, simply because they're quick, tasty, and give me a little energy boost.",
    category: "Part 1 - Snacks"
  },
  {
    id: 52,
    question: "What snacks do you usually eat?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 주로 스니커즈 같은 초콜릿이나 치토스 같은 짠 과자를 먹으며, 기분에 따라 비스킷이나 쿠키도 먹는다는 내용입니다.\n\nWell, I usually go for chocolate bars like Snickers or salty snacks like Cheetos. Sometimes, I mix it up with biscuits or cookies, depending on my mood.",
    category: "Part 1 - Snacks"
  },
  {
    id: 53,
    question: "Do you still eat the same types of snacks that you ate when you were a child?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 어릴 때 먹던 과자를 한국 방문할 때마다 사 먹으며, 좋은 추억이 떠오른다는 내용입니다.\n\nYes, I do. In fact, whenever I visit Korea, I remember buying the snacks I used to eat as a kid, and it always brings back a lot of good memories.",
    category: "Part 1 - Snacks"
  },
  {
    id: 54,
    question: "What was the most popular snack when you were a child?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 어린 시절 가장 인기 있던 과자는 초콜릿이 코팅된 비스킷 스틱인 빼빼로였다는 내용입니다.\n\nWell, back in my childhood, I'd say Pepero was the most popular snack. It's a thin biscuit stick covered with chocolate, and almost every kid loved it.",
    category: "Part 1 - Snacks"
  },
  {
    id: 55,
    question: "Are there any snacks that you have never eaten that you would like to try?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 두바이 초콜릿을 먹어보고 싶으며, 풍부하고 독특한 맛이라고 들었다는 내용입니다.\n\nYes, I'd love to try some Dubai chocolates, because I've heard they're really rich and unique in flavor.",
    category: "Part 1 - Snacks"
  },
  {
    id: 56,
    question: "Would you like to try foreign snack?",
    sampleAnswer: "<strong>[한국어 개요]</strong> 프랑스 간식을 먹어보고 싶으며, 프랑스가 페이스트리와 과자로 유명하기 때문이라는 내용입니다.\n\nDefinitely! If I had the chance, I would really like to try some French snacks, because they're famous for their pastries and sweets.",
    category: "Part 1 - Snacks"
  },
  
  // Friends
  {
    id: 57,
    question: "How often do you go out with friends?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한 달에 한두 번 친구들과 만나며, 주로 맛집에서 함께 식사를 즐기며 휴식을 취한다는 답변입니다.

I usually meet my friends once or twice a month. We often go to nice restaurants and enjoy delicious food together, which is a great way to relax.`,
    category: "Part 1 - Friends"
  },
  {
    id: 58,
    question: "Tell me about your best friend at school.",
    sampleAnswer: `<strong>[한국어 개요]</strong> 고등학교에서 만난 절친에 대한 답변입니다. 비슷한 성격과 취미를 가졌으며, 야구와 밴드 음악을 좋아해서 함께 경기와 콘서트에 자주 갔다고 합니다.

I remember meeting my best friend in high school. We had similar personalities and interests. For example, we both loved baseball and band music, so we often went to games and concerts together.`,
    category: "Part 1 - Friends"
  },
  {
    id: 59,
    question: "How friendly are you with your neighbours?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 이웃과 그다지 친하지 않으며, 보통 인사 정도만 하고 함께 어울리거나 대화를 많이 하지는 않는다는 답변입니다.

Honestly, I'm not very close with my neighbours. We usually just say hello, but we don't really hang out or talk much.`,
    category: "Part 1 - Friends"
  },
  {
    id: 60,
    question: "Which is more important to you, friends or family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가족이 더 중요하다는 답변입니다. 항상 곁에서 지지해주고 모든 상황에서 도움을 주었기 때문이라고 설명합니다.

Well, in my opinion, family is definitely more important, because they've always been there for me and supported me in every situation.`,
    category: "Part 1 - Friends"
  },
  
  // Festivals and Celebrations
  {
    id: 65,
    question: "How do you usually celebrate your birthday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 친구들과 저녁 식사를 하며 생일을 축하한다는 답변입니다. 단순하게 소중한 사람들과 좋은 시간을 보내는 것을 좋아한다고 합니다.

I usually celebrate by going out for dinner with my friends. I like keeping it simple and spending quality time with people I care about.`,
    category: "Part 1 - Festivals"
  },
  {
    id: 66,
    question: "How did you celebrate your last birthday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 작년에 친구들과 레스토랑에서 멋진 저녁 식사를 하며 생일을 축하했다는 답변입니다. 정말 즐거웠다고 합니다.

Last year, I remember celebrating my birthday with a nice dinner at a restaurant with friends. It was really enjoyable.`,
    category: "Part 1 - Festivals"
  },
  {
    id: 67,
    question: "How do you think you will celebrate your next birthday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 다음 생일은 한국에서 가족과 함께 보내고 싶다는 답변입니다. 자주 만나지 못해서 특별할 것이라고 생각한다고 합니다.

I'd like to spend my next birthday in Korea with my family. I think it would be really special because I don't get to see them very often.`,
    category: "Part 1 - Festivals"
  },
  {
    id: 68,
    question: "What is the most important day of the year for you?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가장 중요한 날로 새해 첫날을 꼽은 답변입니다. 가족과 다시 만나고 서로 행복하고 성공적인 한 해를 기원하는 시간이기 때문이라고 합니다.

That's an interesting question. For me, New Year's Day is the most important day, because it's a time to reconnect with my family and wish each other a happy and successful year ahead.`,
    category: "Part 1 - Festivals"
  },
  
  // Wedding
  {
    id: 69,
    question: "Can you talk about some things people do at a traditional wedding?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 전통 결혼식에서 하는 일에 대한 답변입니다. 한국에서는 보통 서약과 반지 교환 의식을 하고, 그 후 가족·친구와 식사를 하며, 때로는 음악이나 춤 같은 전통 공연이 있다고 합니다.

That's an interesting question. In my country, people usually have a ceremony where the couple exchanges vows and rings. After that, there's often a big meal with friends and family, and sometimes traditional performances like music or dancing.`,
    category: "Part 1 - Wedding"
  },
  {
    id: 70,
    question: "How important is marriage in a person's life?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 결혼은 인생에서 매우 중요한 결정이라는 답변입니다. 평생을 함께할 사람을 찾는 것이므로 많은 생각과 헌신이 필요하다고 설명합니다.

Well, in my opinion, marriage is a really important decision because it means finding someone to spend your whole life with. For me, it's something that requires a lot of thought and commitment.`,
    category: "Part 1 - Wedding"
  },
  {
    id: 71,
    question: "What is the difference of what people think about marriage compared to the past?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 과거와 현재의 결혼관 차이에 대한 답변입니다. 과거에는 의무나 사회적 기대로 봤지만, 요즘은 전통보다 사랑과 궁합에 초점을 맞춘 개인적 선택으로 보는 경향이 있다고 합니다.

That's an interesting question. I think in the past, people often saw marriage as a duty or even a social expectation. But nowadays, many people see it more as a personal choice, focusing on love and compatibility rather than just tradition.`,
    category: "Part 1 - Wedding"
  },
  {
    id: 72,
    question: "What do people wear at a wedding?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 결혼식 복장에 대한 답변입니다. 한국에서 신부는 보통 흰색 웨딩드레스, 신랑은 양복이나 턱시도를 입으며, 전통 한국 결혼식에서는 한복을 입기도 한다고 합니다.

In my country, the bride usually wears a white wedding dress, while the groom often wears a suit or a tuxedo. In traditional Korean weddings, some couples also wear hanbok, which adds a cultural touch to the ceremony.`,
    category: "Part 1 - Wedding"
  },
  
  // Family
  {
    id: 73,
    question: "Can you tell me about your family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가족 소개 답변입니다. 4인 가족으로 부모님은 작은 미용실을 운영하고, 언니(누나)는 시청 공무원입니다. 가족끼리 매우 가깝고 주말에 함께 시간을 보내며, 최근 뒤뜰에서 바베큐 파티를 했다고 합니다.

My family has four members: my parents, my sister, and me. My parents run a small beauty salon, which they love doing. My sister works as an officer at city hall. We're very close and enjoy spending weekends together, like our recent barbecue party in the backyard.`,
    category: "Part 1 - Family"
  },
  {
    id: 74,
    question: "How much time do you spend with your family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 요즘 가족이 모두 한국에 살아서 자주 못 만난다는 답변입니다. 한국에 있을 때는 한 달에 한 번 정도 만나 함께 저녁을 먹었다고 합니다.

Honestly, these days I don't see my family much because they all live in Korea. But when I was there, we used to meet about once a month and have dinner together, which was really nice.`,
    category: "Part 1 - Family"
  },
  {
    id: 75,
    question: "What do you like to do with your family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가족과 바베큐 파티를 하는 것을 정말 좋아한다는 답변입니다. 맛있는 음식을 먹고 이야기하며 함께 좋은 시간을 보내기 좋다고 합니다.

I'd say I really enjoy having a barbecue party with my family. It's a great chance to eat good food, talk, and simply spend quality time together.`,
    category: "Part 1 - Family"
  },
  {
    id: 76,
    question: "Who are you closest to in your family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가족 중 엄마와 가장 가깝다는 답변입니다. 항상 응원해주시고 무엇이든 편하게 이야기할 수 있다고 합니다.

I'm definitely closest to my mom. She has always supported me and I feel comfortable sharing everything with her.`,
    category: "Part 1 - Family"
  },
  
  // Flowers
  {
    id: 77,
    question: "Do you like flowers?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 꽃을 좋아한다는 답변입니다. 꽃은 단순하지만 아름답고 분위기를 밝게 만들어준다고 합니다.

Yes, I do. I think flowers are simple but beautiful, and they always make the atmosphere brighter.`,
    category: "Part 1 - Flowers"
  },
  {
    id: 78,
    question: "What kinds of flowers do you like the most?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 장미를 가장 좋아한다는 답변입니다. 우아해 보이고 사랑과 애정을 상징하기 때문이라고 합니다.

I'd say I like roses the most, simply because they look elegant and they also symbolize love and affection.`,
    category: "Part 1 - Flowers"
  },
  {
    id: 79,
    question: "When do people in your country normally give flowers to others?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서는 결혼식, 졸업식, 장례식 같은 특별한 날에 꽃을 주는 답변입니다. 축하하거나 존경을 표하는 방법이라고 합니다.

In Korea, people usually give flowers on special occasions like weddings, graduations, or even funerals. It's a way to celebrate or show respect.`,
    category: "Part 1 - Flowers"
  },
  {
    id: 80,
    question: "When was the last time you gave flowers to someone?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 약 3년 전 친척이 돌아가셨을 때 꽃을 보낸 답변입니다. 한국에서는 조의를 표하기 위해 장례식 화환을 보내는 것이 일반적이라고 합니다.

I remember giving flowers about three years ago when one of my relatives passed away. In Korea, it's common to send funeral wreaths to express condolences.`,
    category: "Part 1 - Flowers"
  },
  {
    id: 81,
    question: "Are there any flowers that have special meaning to people in your country?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 특별한 의미가 있는 꽃에 대한 답변입니다. 국화는 애도를 상징해 장례식에 쓰이고, 장미는 사랑, 카네이션은 어버이날에 존경과 감사를 나타낸다고 합니다.

Yes, in Korea, chrysanthemums often symbolize mourning, so they're used in funerals. On the other hand, roses are usually connected with love, and carnations are very meaningful on Parents' Day because they represent respect and gratitude.`,
    category: "Part 1 - Flowers"
  },
  
  // Weather & Seasons
  {
    id: 86,
    question: "What's the weather like in your hometown?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 서울 출신으로 날씨가 다양하다는 답변입니다. 덥고 습한 여름, 눈이 오는 추운 겨울, 온화한 봄과 가을이 있다고 합니다.

Well, I'm from Seoul, and the weather there is quite diverse. We have hot and humid summers, cold winters with some snow, and mild spring and autumn seasons.`,
    category: "Part 1 - Weather"
  },
  {
    id: 87,
    question: "Would you prefer to live in a place with one season all year round, or four different seasons?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한 계절만 있는 곳에서 사는 것을 선호한다는 답변입니다. 마이애미에서 몇 달 지낸 적이 있는데, 옷이 많이 필요 없고 날씨가 항상 예측 가능해서 좋았다고 합니다.

I'd say I prefer living in a place with just one season. For example, I stayed in Miami for a few months, and I liked it because I didn't need many clothes and the weather was always predictable.`,
    category: "Part 1 - Weather"
  },
  {
    id: 88,
    question: "Do you do different activities in different seasons?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 계절마다 다른 활동을 한다는 답변입니다. 여름에는 해변·수영·바베큐, 겨울에는 스키·스노보드, 봄에는 벚꽃 아래 하이킹·피크닉, 가을에는 국립공원에서 단풍을 즐긴다고 합니다.

The activities vary a lot by season. In summer, people enjoy going to the beach, swimming, or having outdoor barbecues. In winter, skiing and snowboarding are very popular in the mountains. Spring is perfect for hiking or going on picnics under the cherry blossoms, while autumn is ideal for visiting national parks and enjoying the fall foliage. Each season offers a unique experience, which is one reason tourism is strong all year round.`,
    category: "Part 1 - Weather"
  },
  {
    id: 89,
    question: "Does the weather have much impact on your life?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 날씨가 생활에 많은 영향을 미친다는 답변입니다. 맑은 날에는 활기차게 공원에서 조깅하고, 비 오는 날에는 집에서 영화를 보며 덜 활동적이 된다고 합니다. 폭풍 같은 나쁜 날씨는 계획을 취소시키기도 한다고 합니다.

Yes, the weather impacts my life a lot. For example, on sunny days, I feel energetic and go jogging in the park. But on rainy days, I stay home, maybe watching movies, and feel less active. Bad weather, like storms, can also cancel plans, such as picnics with friends.`,
    category: "Part 1 - Weather"
  },
  {
    id: 90,
    question: "What sort of weather do you prefer?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 더운 날씨를 선호한다는 답변입니다. 수영하기에 완벽하고 햇볕 아래서 야외 활동을 즐기기 때문이라고 합니다.

I prefer hot weather, mainly because it's perfect for swimming and I really enjoy outdoor activities in the sun.`,
    category: "Part 1 - Weather"
  },
  {
    id: 91,
    question: "Would you prefer to go to a hot place, or a cold place for a holiday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 휴가지로 마이애미 같은 더운 곳을 선택하겠다는 답변입니다. 해변에서 수영하기 좋은 맑은 날씨가 편안하고 재미있기 때문이며, 스키 리조트 같은 추운 곳은 두꺼운 겨울옷이 불편하다고 합니다.

I'd pick a hot place, like Miami, for a holiday because I love sunny weather for swimming at the beach. It feels relaxing and fun. Cold places, like a ski resort, are okay for skiing, but I find heavy winter clothes uncomfortable.`,
    category: "Part 1 - Weather"
  },
  {
    id: 92,
    question: "How do rainy days make you feel?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 비 오는 날은 덜 활동적으로 느끼게 한다는 답변입니다. 보통 실내에 머물며 외출할 의욕이 별로 없다고 합니다.

Honestly, rainy days make me feel less active. I usually stay indoors and don't feel very motivated to go out.`,
    category: "Part 1 - Weather"
  },
  {
    id: 93,
    question: "What's your favourite season of the year?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 가장 좋아하는 계절은 여름이라는 답변입니다. 수영하고 야외에서 더 많은 시간을 보낼 수 있기 때문이라고 합니다.

My favourite season is definitely summer, because I can go swimming and spend more time outdoors.`,
    category: "Part 1 - Weather"
  },
  {
    id: 94,
    question: "What do you like to do when it's hot?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 더울 때 보통 수영하러 간다는 답변입니다. 상쾌하고 더위를 식히는 재미있는 방법이라고 합니다.

When it's hot, I usually like to go swimming. It's refreshing and a fun way to cool down.`,
    category: "Part 1 - Weather"
  },
  {
    id: 95,
    question: "What do you usually do in the winter?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 겨울에는 보통 집에서 넷플릭스를 본다는 답변입니다. 추운 계절을 아늑하게 보내는 방법이라고 합니다.

In the winter, I usually stay at home and watch Netflix. It's a cozy way to spend the cold season.`,
    category: "Part 1 - Weather"
  },
  
  // Clothes & Fashion
  {
    id: 96,
    question: "How important are clothes and fashion to you?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 옷과 패션이 꽤 중요하다는 답변입니다. 개성을 보여주고 다양한 상황에서 자신감을 느끼게 해주기 때문이라고 합니다.

Well, I think clothes and fashion are quite important, because they show your personality and also help you feel confident in different situations.`,
    category: "Part 1 - Fashion"
  },
  {
    id: 97,
    question: "What kind of clothes do you dislike?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 정장 입는 것을 별로 좋아하지 않는다는 답변입니다. 한국에서 일할 때 정장을 입어야 했는데 편하지 않았다고 합니다.

I don't really like wearing suits. Back in Korea, I had to wear one for work, and honestly, it wasn't very comfortable for me.`,
    category: "Part 1 - Fashion"
  },
  {
    id: 98,
    question: "How different are the clothes you wear now from those you wore 10 years ago?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 10년 전과 현재 옷 스타일 차이에 대한 답변입니다. 10년 전에는 패션에 더 관심이 많아 다양한 스타일을 시도했지만, 요즘은 캐주얼하게 입고 유행에 크게 신경 쓰지 않는다고 합니다.

About 10 years ago, I was more interested in fashion, so I tried many different styles. These days, though, I just dress casually and don't care too much about trends.`,
    category: "Part 1 - Fashion"
  },
  {
    id: 99,
    question: "What do you think the clothes we wear say about us?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 옷이 우리에 대해 무엇을 말해주는지에 대한 답변입니다. 옷은 성격, 생활 방식, 때로는 사회적 지위를 보여준다고 합니다. 예를 들어 운동복은 활동적인 모습, 정장은 전문성을 나타낸다고 합니다.

That's a good question. I think the clothes we wear often show our personality, lifestyle, and sometimes even our social status. For example, someone wearing sportswear might be seen as active, while formal clothes can show professionalism.`,
    category: "Part 1 - Fashion"
  },
  {
    id: 100,
    question: "Do you like shopping for clothes?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 옷 쇼핑을 좋아한다는 답변입니다. 보통 아울렛에 가서 한꺼번에 옷을 사는데, 돈과 시간을 절약할 수 있기 때문이라고 합니다.

Yes, I do. I usually enjoy going to outlets and buying clothes in bulk, because it saves both money and time.`,
    category: "Part 1 - Fashion"
  },
  {
    id: 101,
    question: "Have you ever bought clothes that you don't like?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 마음에 들지 않는 옷을 산 적이 있다는 답변입니다. 여자친구가 좋아하는 스타일이라 롱코트를 샀지만, 불편해서 즐겨 입지 않았다고 합니다.

Yes, I remember once buying a long coat because my girlfriend liked that style. But honestly, I didn't enjoy wearing it because it felt uncomfortable.`,
    category: "Part 1 - Fashion"
  },
  
  // Social Network
  {
    id: 102,
    question: "What kind of social networking websites do you like to use?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 주로 링크드인을 사용한다는 답변입니다. 같은 업계, 특히 소프트웨어 엔지니어링 분야 사람들과 네트워킹하기 좋은 플랫폼이기 때문이라고 합니다.

I mostly use LinkedIn, since it's a great platform for networking with people in the same industry, especially in software engineering.`,
    category: "Part 1 - Social Network"
  },
  {
    id: 103,
    question: "Do you think social media will become more popular in the future?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 소셜 미디어가 미래에 더 인기를 끌 것이라는 답변입니다. 링크드인처럼 플랫폼이 더 전문화되면 더 많은 사용자를 끌어들일 것이라고 합니다.

Of course. In my opinion, social media will keep growing, especially if platforms become more specialized. For example, LinkedIn targets professionals, and I think this kind of focus will attract even more users in the future.`,
    category: "Part 1 - Social Network"
  },
  {
    id: 104,
    question: "Do you like to use Facebook?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 페이스북을 좋아한다는 답변입니다. 특히 마켓플레이스 기능이 중고품을 사고팔기 편리해서 즐겨 사용한다고 합니다.

Yes, I do. I especially enjoy using the marketplace feature, because it's convenient for buying and selling second-hand items.`,
    category: "Part 1 - Social Network"
  },
  {
    id: 105,
    question: "Do you feel social media is more a positive thing, or more negative thing?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 소셜 미디어는 긍정적인 면과 부정적인 면이 모두 있다는 답변입니다. 사람들의 연결을 도와주지만, 중독이나 허위 정보 확산 같은 문제도 일으킬 수 있다고 합니다.

That's a tricky one. I'd say social media has both positive and negative sides. On the one hand, it helps people stay connected, but on the other hand, it can also cause problems like addiction or spreading misinformation.`,
    category: "Part 1 - Social Network"
  },
  {
    id: 106,
    question: "Do you use social media websites?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 소셜 미디어 웹사이트를 사용한다는 답변입니다. 주로 전문적인 네트워킹을 위해 링크드인, 개인적인 용도로 페이스북을 사용한다고 합니다.

Yes, I do. I use a few different platforms, but mainly LinkedIn for professional networking and Facebook for personal use.`,
    category: "Part 1 - Social Network"
  },
  
  // Swimming
  {
    id: 107,
    question: "Do you like swimming?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 수영을 좋아한다는 답변입니다. 편안하면서도 건강을 유지하는 좋은 방법이기 때문이라고 합니다.

Yes, I do. I really enjoy swimming because it's both relaxing and a good way to stay healthy.`,
    category: "Part 1 - Swimming"
  },
  {
    id: 108,
    question: "What do you think are the advantages of swimming?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 수영의 장점에 대한 답변입니다. 전신 운동이고, 관절에 부담이 적으며, 생명을 구하는 기술이 될 수도 있다고 합니다.

Well, in my opinion, swimming has many advantages. It's a full-body workout, it's gentle on the joints, and it can also be a lifesaving skill.`,
    category: "Part 1 - Swimming"
  },
  {
    id: 109,
    question: "Did you learn to swim when you were young?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 어릴 때 수영을 배웠다는 답변입니다. 학교 체육 시간에 수영을 배웠는데 꽤 재미있었다고 합니다.

Yes, I did. I remember learning how to swim at school during PE class, and it was actually quite fun.`,
    category: "Part 1 - Swimming"
  },
  {
    id: 110,
    question: "Should it be compulsory for children to learn to swim when they are at school?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 아이들이 학교에서 수영을 필수로 배워야 한다고 생각한다는 답변입니다. 수영은 건강에 좋을 뿐만 아니라 사고를 예방할 수 있는 필수 안전 기술이라고 합니다.

Yes, I think so. Swimming is not only good for health, but also an essential safety skill that can prevent accidents.`,
    category: "Part 1 - Swimming"
  },
  {
    id: 111,
    question: "How do most people in your country learn to swim?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 대부분의 사람들이 수영을 배우는 방법에 대한 답변입니다. 학교나 공공 체육센터에서 배우며, 어린이들이 레슨을 받는 사설 수영장도 많다고 합니다.

In Korea, I think most people learn to swim either at school or in public sports centers. There are also many private swimming pools where children take lessons.`,
    category: "Part 1 - Swimming"
  },
  {
    id: 112,
    question: "Is swimming very popular in your country?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 수영이 꽤 인기 있다는 답변입니다. 여름에 많은 사람들이 수영을 즐기고, 실내 수영장도 흔해서 일 년 내내 수영할 수 있다고 합니다.

Yes, it's quite popular. Many people enjoy swimming in the summer, and indoor pools are also common, so people can swim all year round.`,
    category: "Part 1 - Swimming"
  },
  
  // Noise
  {
    id: 113,
    question: "Do you mind noises?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 소음을 크게 신경 쓰지 않는다는 답변입니다. 일상적인 소음은 괜찮지만, 큰 공사 소리는 좀 귀찮을 수 있다고 합니다.

Not really. I usually don't mind everyday noises, although loud construction sounds can be a bit annoying.`,
    category: "Part 1 - Noise"
  },
  {
    id: 114,
    question: "What types of noise do you come across in your daily life?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 일상에서 접하는 소음에 대한 답변입니다. 교통 소음, 공공장소에서 사람들 대화 소리, 때때로 가게나 카페에서 나오는 음악 소리를 자주 듣는다고 합니다.

Well, I often hear traffic noise, people talking in public places, and sometimes music coming from shops or cafés.`,
    category: "Part 1 - Noise"
  },
  {
    id: 115,
    question: "Are there any sounds that you like?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 빗소리를 좋아한다는 답변입니다. 특히 집에 있을 때 차분하고 편안한 느낌을 준다고 합니다.

Yes, I really like the sound of rain falling. It makes me feel calm and relaxed, especially when I'm at home.`,
    category: "Part 1 - Noise"
  },
  {
    id: 116,
    question: "Where can you hear loud noises?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 큰 소음을 들을 수 있는 장소에 대한 답변입니다. 보통 번화가, 공사 현장 근처, 콘서트나 축제에서 들을 수 있다고 합니다.

You can usually hear loud noises on busy streets, near construction sites, or at concerts and festivals.`,
    category: "Part 1 - Noise"
  },
  {
    id: 117,
    question: "Do you think there's too much noise in modern society?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 현대 사회에 소음이 너무 많다고 생각한다는 답변입니다. 교통량, 기술, 도시 개발로 인해 소음이 확실히 더 많아졌고, 건강과 집중력에 영향을 줄 수 있다고 합니다.

That's an interesting question. I think in modern society, there is definitely more noise because of heavy traffic, technology, and urban development. It can sometimes affect people's health and concentration.`,
    category: "Part 1 - Noise"
  },
  {
    id: 118,
    question: "Are cities becoming noisier?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 도시가 점점 더 시끄러워지고 있다고 생각한다는 답변입니다. 도시가 커지면서 차와 공사가 늘어나 소음 수준이 자연스럽게 증가한다고 합니다.

Yes, I believe so. As cities grow bigger with more cars and construction, the noise levels naturally increase.`,
    category: "Part 1 - Noise"
  },
  
  // Outdoor activities
  {
    id: 119,
    question: "What do you do in your spare time?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 여가 시간에 보통 맛있는 음식을 먹으며 넷플릭스를 본다는 답변입니다. 바쁜 하루 후 쉬는 데 도움이 된다고 합니다.

In my free time, I usually watch Netflix while enjoying some delicious food. It helps me relax after a busy day.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 120,
    question: "Do you like outdoor activities?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 야외 활동을 좋아한다는 답변입니다. 활동적으로 지내고 자연을 즐기는 좋은 방법이라고 생각한다고 합니다.

Yes, I do. I think outdoor activities are a great way to stay active and enjoy nature.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 121,
    question: "What outdoor activities do you like to do?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 하이킹과 수영을 즐긴다는 답변입니다. 건강을 유지하고 자연 속에서 시간을 보낼 수 있기 때문이라고 합니다.

I usually enjoy hiking and swimming, because they keep me healthy and give me a chance to spend time in nature.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 122,
    question: "How often do you do that?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 야외 활동 빈도에 대한 답변입니다. 밴쿠버에 살 때는 근처에 산이 많아 한 달에 한두 번 하이킹을 갔지만, 지금 몬트리올에서는 아직 장소를 잘 몰라 많이 가지 못했다고 합니다.

When I lived in Vancouver, I went hiking about once or twice a month because there were so many mountains nearby. But now in Montreal, I don't know the places well yet, so I haven't gone much.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 123,
    question: "What outdoor sports do you like?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 수영과 하이킹을 가장 좋아한다는 답변입니다. 운동과 야외 활동을 결합할 수 있기 때문이라고 합니다.

I like swimming and hiking the most, since they combine fitness with enjoying the outdoors.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 124,
    question: "How much time do you spend outdoors every week?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 매주 평균 4~6시간 정도 야외에서 보낸다는 답변입니다. 날씨와 일정에 따라 달라진다고 합니다.

On average, I'd say I spend about four to six hours outdoors each week, depending on the weather and my schedule.`,
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 125,
    question: "What outdoor activities are popular in your country?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 인기 있는 야외 활동에 대한 답변입니다. 산이 많아서 하이킹이 매우 인기 있고, 공원에서 조깅, 자전거 타기, 축구도 즐긴다고 합니다.

In Korea, hiking is extremely popular because there are so many mountains. People also enjoy jogging, cycling, and playing soccer in parks.`,
    category: "Part 1 - Outdoor Activities"
  },
  
  // Painting
  {
    id: 126,
    question: "Do you like painting or drawing?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 그림 그리기를 별로 좋아하지 않는다는 답변입니다. 자주 그리지는 않지만, 예술 작품을 볼 때는 감상할 수 있다고 합니다.

Not really. I don't draw very often, but I can still appreciate art when I see it.`,
    category: "Part 1 - Painting"
  },
  {
    id: 127,
    question: "How often do you visit art galleries?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 미술관을 자주 방문하지 않는다는 답변입니다. 특별 전시가 있을 때 일 년에 한두 번 정도 간다고 합니다.

Honestly, I don't visit them very often, maybe once or twice a year when there's a special exhibition.`,
    category: "Part 1 - Painting"
  },
  {
    id: 128,
    question: "What kinds of things do you like to draw?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 그림을 그린다면 보통 자연 풍경이나 작은 물체 같은 간단한 것을 스케치한다는 답변입니다. 하지만 실력이 그리 좋지는 않다고 합니다.

If I do draw, I usually like to sketch simple things like nature scenes or small objects. But I'm not very skilled at it.`,
    category: "Part 1 - Painting"
  },
  {
    id: 129,
    question: "Is it easy to learn how to draw?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 그림 그리기가 쉽지 않다고 생각한다는 답변입니다. 많은 연습과 인내가 필요하지만, 타고난 재능이 있는 사람도 있다고 합니다.

Well, I think drawing is not very easy. It takes a lot of practice and patience, although some people seem to have a natural talent for it.`,
    category: "Part 1 - Painting"
  },
  
  // General Questions
  {
    id: 130,
    question: "Do you work or study at the moment?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 현재 소프트웨어 엔지니어링 분야에서 일하고 있다는 답변입니다. 백엔드 개발자로서 주로 높은 트래픽을 처리할 수 있는 서버 시스템과 API를 구축한다고 합니다.

At the moment, I'm working in the software engineering field. I work as a backend developer, mainly building server-side systems and APIs that can handle high traffic.`,
    category: "Part 1 - General"
  },
  {
    id: 131,
    question: "What do you like doing in your free time?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 여가 시간에 넷플릭스를 보거나 친구들과 새로운 레스토랑을 다니며 쉰다는 답변입니다.

In my free time, I like to relax by watching Netflix or trying out new restaurants with friends.`,
    category: "Part 1 - General"
  },
  {
    id: 132,
    question: "What type of photos do you like taking?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 일몰, 해변, 산 같은 자연 사진을 찍는 것을 좋아한다는 답변입니다. 아름답고 평화로워 보이기 때문이라고 합니다.

I usually like taking photos of nature, like sunsets, beaches, and mountains, because they look beautiful and peaceful.`,
    category: "Part 1 - General"
  },
  {
    id: 133,
    question: "What do you do with the photos you take?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 찍은 사진을 대부분 핸드폰에 보관하고, 가끔 친구들과 소셜 미디어에 공유한다는 답변입니다.

Most of the time, I just keep them on my phone, but sometimes I share them on social media with friends.`,
    category: "Part 1 - General"
  },
  {
    id: 134,
    question: "When you visit other places, do you take photos or buy postcards?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 사진을 찍는다는 답변입니다. 더 개인적이고 경험한 순간을 정확히 담아내기 때문이며, 엽서는 그런 개인적인 느낌이 없다고 합니다.

I usually take photos, because it feels more personal and captures the exact moment I experienced. Postcards don't really have that personal touch.`,
    category: "Part 1 - General"
  },
  {
    id: 135,
    question: "Do you like people taking photos of you?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 사진 찍히는 것을 별로 좋아하지 않는다는 답변입니다. 카메라 앞에서 편하지 않아서 다른 사람이나 풍경 사진을 찍는 것을 선호한다고 합니다.

Not really. I don't feel very comfortable in front of the camera, so I prefer taking photos of others or landscapes instead.`,
    category: "Part 1 - General"
  },
  
  // Others
  {
    id: 136,
    question: "Talk about where you live",
    sampleAnswer: `<strong>[한국어 개요]</strong> 몬트리올에 3개월째 살고 있다는 답변입니다. 상점, 아늑한 카페, 좋은 대중교통이 있는 활기찬 분위기를 즐기고 있으며, 프랑스어가 주요 언어라 파트타임 프랑스어 수업을 듣고 있다고 합니다.

I've been living in Montreal for three months now, and I really enjoy its vibrant vibe, with lots of shops, cozy cafes, and great public transport. Since French is the primary language here, it's a fantastic place to learn it, and I'm taking part-time French classes, which is fun but challenging.`,
    category: "Part 1 - Others"
  },
  {
    id: 137,
    question: "Are you a student or do you work?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 현재 소프트웨어 엔지니어로 8년째 일하고 있다는 답변입니다. 소프트웨어 애플리케이션을 설계하고 개발하는 일이 보람 있고, 매일 복잡한 문제를 해결할 수 있어 즐겁다고 합니다.

I'm currently a software engineer, and I've been working in this field for eight years. My job involves designing and developing software applications, which I find it really fulfilling. I enjoy it because it's challenging and allows me to solve complex problems every day.`,
    category: "Part 1 - Others"
  },
  {
    id: 138,
    question: "Talk about your job/studies",
    sampleAnswer: `<strong>[한국어 개요]</strong> 시니어 소프트웨어 엔지니어로 일하고 있다는 답변입니다. 전체 소프트웨어 개발 과정을 감독하며, 애플리케이션 설계, 코딩, 테스트, 프로덕션 배포를 담당합니다. 주니어 개발자 멘토링도 즐긴다고 합니다.

I work as a senior software engineer, and my main role is to oversee the entire software development process. This includes designing applications, writing code, testing features, and deploying them to the production environment. I also enjoy mentoring junior developers, helping them improve their skills, which is really rewarding.`,
    category: "Part 1 - Others"
  },
  {
    id: 139,
    question: "Where do you like to go on holiday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 휴일에 커피숍에서 시간 보내는 것을 좋아한다는 답변입니다. 아늑한 분위기에서 커피를 마시며 일정 관리나 사이드 프로젝트를 하면 생산적이면서도 편안한 휴일이 된다고 합니다.

During holidays, I love spending time in a coffee shop. I enjoy the cozy atmosphere, sipping coffee while managing my upcoming schedule or working on side projects. It helps me stay focused and makes my holiday feel both productive and relaxing.`,
    category: "Part 1 - Others"
  },
  {
    id: 140,
    question: "Do you have any hobbies?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 넷플릭스에서 한국 드라마를 보는 것이 취미라는 답변입니다. 오징어 게임 같은 프로그램이 흥미진진하고, 영어 자막이 새로운 어휘를 배우는 데 도움이 된다고 합니다.

Yes, one of my favorite hobbies is watching Korean dramas on Netflix, especially shows like Squid Game because they're so exciting and well-produced. It's a great way for me to unwind after a long day, and I really enjoy how the English subtitles help me pick up new vocabulary.`,
    category: "Part 1 - Others"
  },
  {
    id: 141,
    question: "What do you normally do in the evening?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 저녁에 보통 집에서 넷플릭스를 본다는 답변입니다. 하루를 마무리하며 쉬기 좋고, 다양한 언어의 자막이 있어 영어 자막으로 보면서 이야기도 즐기고 언어 실력도 향상시킨다고 합니다.

In the evening, I usually stay at home and watch Netflix. It helps me relax after a long day, and I find it quite enjoyable. Another reason I like doing this is that Netflix offers subtitles in different languages, so I often watch shows with English subtitles. That way, I can both enjoy the story and improve my language skills at the same time.`,
    category: "Part 1 - Others"
  },
  {
    id: 142,
    question: "What are you studying at the moment?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 대학에서 경영학을 전공하고 있다는 답변입니다. 마케팅부터 회계까지 폭넓은 분야를 다루며, 미래 커리어에 매우 유용하다고 생각한다고 합니다.

I'm studying Business Administration at University. It's a broad subject that covers everything from marketing to accounting, which I find really useful for my future career.`,
    category: "Part 1 - Study"
  },
  {
    id: 143,
    question: "Why did you choose that subject?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 사업이 어떻게 운영되고 성장하는지에 항상 관심이 있었다는 답변입니다. 아버지가 사업가인데, 일하시는 모습을 보고 영감을 받아 같은 길을 걷고 싶었다고 합니다.

I've always been interested in how businesses operate and grow. Also, my father is a businessman, and seeing him work inspired me to follow in his footsteps and learn the ropes of running a company.`,
    category: "Part 1 - Study"
  },
  {
    id: 144,
    question: "Do you enjoy your subject?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 전공을 즐기고 있다는 답변입니다. 통계 같은 과목은 어렵고 지루할 수 있지만, 성공적인 스타트업의 사례 분석 같은 실용적인 부분을 즐긴다고 합니다.

Yes, I do. Although some modules like statistics can be quite challenging and dry, I really enjoy the practical side of things, like analyzing case studies of successful startups.`,
    category: "Part 1 - Study"
  },
  {
    id: 145,
    question: "What do you hope to do in the future when you finish?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 졸업 후 다국적 기업에서 경험을 쌓을 계획이라는 답변입니다. 장기적으로는 호스피탈리티 업계에서 자신만의 사업을 시작하는 것이 목표라고 합니다.

After I graduate, I'm planning to work for a multinational corporation to gain some experience. Eventually, my long-term goal is to start my own small business in the hospitality industry.`,
    category: "Part 1 - Study"
  },
  {
    id: 146,
    question: "How often do you buy gifts for other people?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 선물을 자주 사지는 않는다는 답변입니다. 보통 생일, 크리스마스, 기념일 같은 특별한 날에만 사며, 작은 것을 여러 개 사기보다 좋은 선물 하나를 깊이 생각해서 고르는 것을 선호한다고 합니다.

I don't buy gifts very often, usually only for special occasions like birthdays, Christmas, or anniversaries. I prefer to put a lot of thought into one good gift rather than buying lots of small things.`,
    category: "Part 1 - Gifts"
  },
  {
    id: 147,
    question: "Do you like giving gifts?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 선물 주는 것을 좋아한다는 답변입니다. 정말 원하던 것을 열었을 때 밝아지는 표정을 보면 기분이 좋고, 상대방에게 관심을 보여주는 좋은 방법이라고 합니다.

I love giving gifts! It’s such a great feeling to see someone’s face light up when they open something they really wanted. I think it’s a wonderful way to show people that you care about them.`,
    category: "Part 1 - Gifts"
  },
  {
    id: 148,
    question: "What was the last gift you received?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 마지막으로 받은 선물에 대한 답변입니다. 사촌이 미국 슈리브포트 방문을 축하하며 100달러 카지노 바우처를 줬고, 카지노, 레스토랑, 호텔을 즐기며 재미있고 기억에 남는 경험이었다고 합니다.

The last gift I got was a $100 casino voucher from my cousin to celebrate my visit to Shreveport in the United States, where he lives. I recently used it to enjoy the casino, a restaurant, and a hotel. It was a really fun and memorable experience.`,
    category: "Part 1 - Gifts"
  },
  {
    id: 149,
    question: "When was the last time you gave a gift to someone?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 지난주에 친구에게 선물을 줬다는 답변입니다. 절친의 생일이라 스파 바우처를 사줬는데, 요즘 일 때문에 스트레스가 많아서 정말 좋아했다고 합니다.

It was just last week. It was my best friend’s birthday, so I bought her a voucher for a spa day because she’s been feeling quite stressed with work lately. She was really happy with it.`,
    category: "Part 1 - Gifts"
  },
  {
    id: 150,
    question: "Is it difficult to choose a gift for someone?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 선물 고르기가 어려울 수 있다는 답변입니다. 잘 모르는 사람에게는 특히 어렵지만, 가까운 친구나 가족에게는 보통 좋아하는 것을 알고 있으며, 일 년 내내 힌트를 잘 들어두는 것이 비결이라고 합니다.

It can be, especially if you don't know the person very well. But if it's for a close friend or family member, I usually have a good idea of what they like. I think the trick is to listen to them throughout the year for any hints!`,
    category: "Part 1 - Gifts"
  },
  {
    id: 151,
    question: "What kinds of rules are common in a school?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 학교에서 흔한 규칙에 대한 답변입니다. 교복 착용, 시간 준수, 교사와 급우 존중 등이 있으며, 이런 규칙들이 학교 환경의 질서와 규율을 유지하는 데 도움이 됩니다.

Common school rules usually include wearing uniforms, being punctual, and respecting teachers and classmates. These rules help maintain order and discipline in the school environment.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 152,
    question: "How important is it to have rules in a school?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 학교에서 규칙이 매우 중요하다고 생각한다는 답변입니다. 학생들을 위한 체계적이고 안전한 환경을 만들어주며, 규칙 없이는 행동을 관리하고 효과적인 학습을 보장하기 어렵습니다.

I think rules are very important because they create a structured and safe environment for students. Without rules, it would be difficult to manage behavior and ensure effective learning.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 153,
    question: "What do you recommend should happen if children break school rules?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 벌은 너무 가혹하기보다는 공정하고 교육적이어야 한다는 답변입니다. 예를 들어 학생에게 자신의 행동을 반성하게 하거나 실수를 이해하기 위한 추가 과제를 수행하게 할 수 있습니다.

I think the punishment should be fair and educational rather than too harsh. For example, students could be asked to reflect on their behavior or complete extra tasks to understand their mistakes.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 154,
    question: "Can you suggest why many students decide to study law at university?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 많은 학생들이 법학을 선택하는 이유에 대한 답변입니다. 안정적인 직업 기회와 좋은 수입을 제공하며, 일부는 정의에 관심이 있고 법적 지식을 통해 다른 사람을 돕고 싶기 때문이라고 합니다.

Many students choose to study law because it offers stable career opportunities and a good income. In addition, some people are interested in justice and want to help others through legal knowledge.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 155,
    question: "What are the key personal qualities needed to be a successful lawyer?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 성공적인 변호사에게 필요한 자질에 대한 답변입니다. 강한 의사소통 능력과 비판적 사고가 필수적이며, 복잡한 아이디어를 명확히 설명하고 상황을 신중히 분석하여 효과적인 논증을 해야 합니다.

I think strong communication skills and critical thinking are essential. Lawyers need to explain complex ideas clearly and analyze situations carefully to make effective arguments.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 156,
    question: "Do you agree that working in the legal profession is very stressful?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 어느 정도 동의한다는 답변입니다. 변호사는 촉박한 기한과 높은 압박 상황을 자주 다루지만, 스트레스 수준은 하는 일의 종류에 따라 다를 수 있다고 합니다.

Yes, I agree to some extent. Lawyers often deal with tight deadlines and high-pressure situations. However, I think the level of stress can vary depending on the type of work they do.`,
    category: "Part 1 - Rules & Law"
  },
  {
    id: 157,
    question: "Do you have a favourite cafe?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 집 근처에 자주 가는 카페가 있다는 답변입니다. 아늑한 분위기와 일관되게 좋은 커피 때문에 좋아하며, 편안하게 쉴 수 있는 장소라고 합니다.

Yes, I do. There's a café I often go to near my home. I like it because the atmosphere is really cozy, and the coffee is consistently good. It's a nice place to relax.`,
    category: "Part 1 - Cafes"
  },
  {
    id: 158,
    question: "Do you often go to cafes by yourself?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 혼자 카페에 자주 간다는 답변입니다. 조용한 시간을 원하거나 무언가에 집중해야 할 때 가며, 일상에서 벗어나 쉴 수 있는 좋은 장소라고 합니다.

Yes, quite often. I sometimes go alone when I want some quiet time or need to focus on something. It's also a good place to just relax and take a break from my routine.`,
    category: "Part 1 - Cafes"
  },
  {
    id: 159,
    question: "What helps to make a cafe very popular?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 카페가 인기를 얻는 요인에 대한 답변입니다. 편안한 분위기와 고품질 음료가 중요하며, 친절한 서비스도 고객이 다시 오고 싶게 만드는 중요한 역할을 한다고 합니다.

I think a café becomes popular when it has a comfortable atmosphere and good-quality drinks. Friendly service also plays an important role, as it makes customers want to come back.`,
    category: "Part 1 - Cafes"
  },
  {
    id: 160,
    question: "Why do some people prefer chain cafes rather than local cafes?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 체인 카페를 선호하는 이유에 대한 답변입니다. 일관된 경험을 제공하며 어느 지점을 가도 품질과 서비스가 동일하고, 더 편리하고 찾기 쉽기 때문이라고 합니다.

I think many people prefer large chain cafés because they offer a consistent experience. No matter which branch you go to, the quality and service are usually the same. Also, they are often more convenient and easier to find.`,
    category: "Part 1 - Cafes"
  },
  {
    id: 161,
    question: "Do you prefer spending holidays with friends or with family?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 친구들과 휴가를 보내는 것을 선호한다는 답변입니다. 함께 활동하고 계획에 더 자유로울 수 있어서 더 편안하고 재미있기 때문입니다.

I prefer spending holidays with friends. I find it more relaxing and fun because we can do activities together and have more freedom in planning.`,
    category: "Part 1 - Holidays"
  },
  {
    id: 162,
    question: "What kind of holiday accommodation do you like to stay in?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 호텔에 머무르는 것을 선호한다는 답변입니다. 편리하고 편안하며, 청소나 요리를 걱정할 필요 없이 여행을 온전히 즐길 수 있기 때문입니다.

I prefer staying in hotels because they are convenient and comfortable. I don't have to worry about cleaning or cooking, so I can fully enjoy my trip.`,
    category: "Part 1 - Holidays"
  },
  {
    id: 163,
    question: "What plans do you have for your next holiday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 다른 도시로 짧은 여행을 계획하고 있다는 답변입니다. 친구들과 함께 갈 예정이며, 세부 사항은 아직 정하지 않았지만 쉬면서 현지 음식을 먹고 싶다고 합니다.

I'm planning to take a short trip to another city, possibly with some friends. I haven't decided the details yet, but I'd like to relax and try local food.`,
    category: "Part 1 - Holidays"
  },
  {
    id: 164,
    question: "Is your city or region a good place for other people to visit on holiday?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 자신의 도시가 방문하기 좋은 곳이라고 생각한다는 답변입니다. 현대적인 명소와 전통 문화가 어우러져 있고, 맛있는 식당도 많아서 관광과 음식 모두 즐길 수 있다고 합니다.

Yes, I think it is. My city has a mix of modern attractions and traditional culture, and there are also plenty of good restaurants. So visitors can enjoy both sightseeing and food.`,
    category: "Part 1 - Holidays"
  },
  {
    id: 165,
    question: "Have you travelled a lot by plane?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 약 10년 전 남미 여행 때 비행기를 많이 탔다는 답변입니다. 대륙이 생각보다 훨씬 커서 이동하려면 여러 번 비행기를 타야 했다고 합니다.

I travelled quite a lot by plane when I went on a trip to South America about ten years ago. Since the continent is much larger than I expected, I had to take several flights to get around.`,
    category: "Part 1 - Planes"
  },
  {
    id: 166,
    question: "Why do you think some people enjoy travelling by plane?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 비행기 여행을 좋아하는 이유에 대한 답변입니다. 편리하고 시간 효율적이며, 비행 경험 자체와 특히 이착륙 시 창밖 풍경에 매료되는 사람도 있다고 합니다.

I think many people enjoy it because it's both convenient and time-efficient. In addition, some people are fascinated by the experience of flying itself, as well as the views from the window, particularly during takeoff and landing.`,
    category: "Part 1 - Planes"
  },
  {
    id: 167,
    question: "Would you like to live near an airport?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 공항 근처에 사는 것을 좋아한다는 답변입니다. 여행을 자주 하기 때문에 편리하며, 공항에서 지하철 하나만 타면 30분 안에 집에 갈 수 있어 시간과 노력을 절약할 수 있다고 합니다.

Yes, I actually like living near an airport. I travel quite often, so it's really convenient for me. I can get home in about 30 minutes by taking just one subway from the airport, which saves a lot of time and effort. It makes traveling much less stressful.`,
    category: "Part 1 - Planes"
  },
  {
    id: 168,
    question: "In the future, do you think that you will travel by plane more often?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 미래에 비행기를 더 자주 타지는 않을 것 같다는 답변입니다. 지금까지 많이 여행했고, 나이가 들면서 이전만큼 에너지가 없을 것 같아서 자주 비행기를 타지 않을 것이라고 합니다.

Probably not, to be honest. I've traveled quite a lot so far, and as I get older, I feel like I won't have as much energy as before. Because of that, I don't think I'll be taking flights very often in the future.`,
    category: "Part 1 - Planes"
  },

  // Fast Food
  {
    id: 169,
    question: "What kinds of fast food have you tried?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 피자, 버거 등 다양한 패스트푸드를 먹어봤다는 답변입니다. 최근 맘스터치의 스페셜 에디션 버거를 먹었는데, 처음 먹어보는 짭짤하고 쫀득한 소스가 인상적이었다고 합니다. 한정판이라 없어지면 아쉬울 것 같다고 합니다.

There are many types of fast food like pizza and burgers, and I've tried quite a few. Recently, I tried a special edition burger from Mom's Touch, which is a Korean fast-food chain. It had a savory and gooey sauce that I hadn't tasted before, so it was quite memorable. Since it's a limited edition, I'd be a bit sad if it's no longer available.`,
    category: "Part 1 - Fast Food"
  },
  {
    id: 170,
    question: "Do you ever use a microwave to cook food quickly?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 혼자 살아서 요리가 시간이 많이 걸리고 같이 먹을 사람이 없어, 보통 냉동식품을 사서 전자레인지로 간편하게 식사를 준비한다는 답변입니다. 매우 편리하다고 합니다.

Yes, definitely. I live alone, so cooking can be time-consuming and there's no one to share meals with. That's why I usually buy frozen food and keep it in my freezer. I often use a microwave to prepare quick and easy meals, which I find very convenient.`,
    category: "Part 1 - Fast Food"
  },
  {
    id: 171,
    question: "How popular are fast food restaurants where you live?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 패스트푸드 레스토랑이 매우 인기 있다는 답변입니다. 편의성과 비교적 저렴한 비용 때문이며, 바쁜 일정을 가진 사람들에게 빠른 식사가 가장 쉬운 선택이기 때문입니다.

Fast food restaurants are very popular in my area. This is largely due to their convenience and relatively low cost. Many people have busy schedules, so grabbing a quick meal is often the easiest choice.`,
    category: "Part 1 - Fast Food"
  },
  {
    id: 172,
    question: "When would you go to a fast-food restaurant?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 빠르게 식사해야 할 때 패스트푸드점에 간다는 답변입니다. 급한 회의가 있어 30분밖에 없었을 때 직장 근처 맥도날드에서 빠르게 식사를 마쳤던 경험을 이야기합니다.

I usually go to a fast-food restaurant when I need to grab a quick meal. I remember one time when I had an urgent meeting and only had about 30 minutes left. So I went to a McDonald's near my workplace and finished my meal quickly before the meeting.`,
    category: "Part 1 - Fast Food"
  },

  // Neighbours
  {
    id: 173,
    question: "How well do you know the people who live next door to you?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 옆집 사람들을 잘 모른다는 답변입니다. 남녀 두 명이 살고 있고 커플인 것 같으며, 직업은 모르지만 로비에서 마주치면 인사를 나누는 정도라고 합니다.

I don't know them very well, to be honest. There are two people living next door, a man and a woman, and they seem like a couple. I'm not sure what they do for a living, but we usually greet each other when we run into each other in the lobby.`,
    category: "Part 1 - Neighbours"
  },
  {
    id: 174,
    question: "How often do you see your neighbours?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 일주일에 한 번 정도 본다는 답변입니다. 보통 아침 늦게 외출하는데 이웃은 다른 스케줄인 것 같고, 주말에 가끔 마주친다고 합니다.

I probably see them about once a week. I usually leave home quite late in the morning, while they seem to have a different schedule. However, I do run into them occasionally on weekends.`,
    category: "Part 1 - Neighbours"
  },
  {
    id: 175,
    question: "What kinds of problem do people sometimes have with their neighbours?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 아파트에서 복도에 물건을 놓는 공용 공간 문제가 있다는 답변입니다. 본인의 경우 고양이 두 마리가 뛰어다닐 때 소음이 생겨 아래층 이웃이 특히 밤에 조용히 해달라고 요청하기도 한다고 합니다.

In apartment buildings, people sometimes have issues with shared spaces, like leaving their belongings in the hallway. In my case, I have two cats, and when they run around, it can cause noise. So occasionally, my downstairs neighbour asks me to keep it down, especially at night.`,
    category: "Part 1 - Neighbours"
  },
  {
    id: 176,
    question: "How do you think neighbours can help each other?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 이웃이 서로 도울 수 있는 방법에 대한 답변입니다. 아파트 생활에서 소음에 신경 쓰는 것이 존중을 보여주며, 도구를 빌려주거나 작은 일을 도와주는 등 간단한 방법으로 도울 수 있다고 합니다.

I think neighbours can support each other by being mindful of noise, especially in apartment living. Keeping things quiet shows respect for others. They can also help in simple ways, like lending tools or assisting with small things when needed.`,
    category: "Part 1 - Neighbours"
  },

  // Reading
  {
    id: 177,
    question: "Do you like reading?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 독서를 좋아하며 주로 소설을 즐긴다는 답변입니다. 학생 때 해리 포터 시리즈 1권부터 4권까지 며칠 만에 읽었던 경험을 이야기하며 그만큼 이런 종류의 이야기를 좋아한다고 합니다.

Yes, definitely. I mainly enjoy reading novels. When I was a student, I remember reading the Harry Potter series from the first to the fourth book in just a few days. That shows how much I enjoy this kind of story.`,
    category: "Part 1 - Reading"
  },
  {
    id: 178,
    question: "Do you read electronic books?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 전자책을 읽으며 오히려 선호한다는 답변입니다. 종이책은 무겁고 공간을 많이 차지하지만, 아이패드로 어디서든 쉽게 읽을 수 있어 매우 편리하다고 합니다.

Yes, I do. I actually prefer e-books because physical books can be quite heavy and take up a lot of space. I have an iPad, and it allows me to read anywhere easily, which is really convenient.`,
    category: "Part 1 - Reading"
  },
  {
    id: 179,
    question: "What kind of books do you like to read?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 해리 포터 같은 소설을 주로 즐기지만, 소프트웨어 엔지니어로서 관련 분야 책도 읽는다는 답변입니다. 업계가 매우 빠르게 변하기 때문에 최신 트렌드를 따라가려고 노력한다고 합니다.

I mainly enjoy novels like Harry Potter, but as a software engineer, I also like reading books related to my field. This is because the industry changes very quickly, so I try to keep up with the latest trends.`,
    category: "Part 1 - Reading"
  },
  {
    id: 180,
    question: "What was your favorite book as a child?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 어릴 때 공룡에 관한 책을 좋아했다는 답변입니다. 읽고 나서 아빠에게 공룡 장난감을 사달라고 했을 정도로 매료되었다고 합니다.

I used to enjoy books about dinosaurs. I remember asking my dad to buy me dinosaur toys after reading them, which shows how much I was fascinated by those stories.`,
    category: "Part 1 - Reading"
  },

  // Meeting Places
  {
    id: 181,
    question: "Where do you usually meet your friends?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 시내에서 친구들을 만난다는 답변입니다. 맛집이 많고, 자주 가는 당구장도 있어서 어울리기 편한 장소라고 합니다.

I usually meet my friends in downtown because there are plenty of great restaurants. We also have a regular billiards place we like to go to, so it's a convenient spot for us to hang out.`,
    category: "Part 1 - Meeting Places"
  },
  {
    id: 182,
    question: "Do you think there are some places that are more suitable for meeting others?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 상황에 따라 더 적합한 장소가 있다는 답변입니다. 카페는 편안하고 대화하기 좋아 가벼운 만남에 좋고, 공원은 날씨가 좋을 때 더 여유로운 분위기를 원할 때 좋은 선택이라고 합니다.

Yes, I think certain places are more suitable depending on the situation. For instance, cafés are great for casual meetings because they're comfortable and easy to talk in. On the other hand, parks can be a nice option if you want a more relaxed environment, especially when the weather is good.`,
    category: "Part 1 - Meeting Places"
  },
  {
    id: 183,
    question: "Have the meeting places changed now compared with the past?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 만남 장소가 시대에 따라 변했다고 생각한다는 답변입니다. 과거에는 집이나 동네에서 만나는 경우가 많았지만, 요즘은 편리하고 분위기가 좋은 카페나 레스토랑에서 만나는 것을 선호한다고 합니다.

Yes, I believe meeting places have changed over time. In the past, people were more likely to meet at home or in their neighbourhood. Nowadays, however, people prefer meeting in cafés or restaurants, mainly because they are more convenient and offer a better atmosphere.`,
    category: "Part 1 - Meeting Places"
  },

  // Collecting Things
  {
    id: 184,
    question: "Do you collect things?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 여행할 때 방문한 곳의 마그넷을 수집한다는 답변입니다. 각 여행을 기억하는 간단한 방법이라고 합니다.

Yes, I do. I collect magnets from the places I visit when I travel. It's a simple way to remember each trip.`,
    category: "Part 1 - Collecting Things"
  },
  {
    id: 185,
    question: "Are there any things you keep from childhood?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 어린 시절 물건을 몇 개 간직하고 있다는 답변입니다. 특히 정이 들었던 장난감과 책을 아직 가지고 있으며, 좋은 추억을 떠올리게 해서 버리고 싶지 않다고 합니다.

Yes, I've kept a few things from my childhood. In particular, I still have some toys and books that I was really attached to. They bring back good memories, so I don't want to throw them away.`,
    category: "Part 1 - Collecting Things"
  },
  {
    id: 186,
    question: "Where do you usually keep things you collect?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 보통 냉장고에 보관한다는 답변입니다. 마그넷을 냉장고에 붙여놓아 매일 볼 수 있다고 합니다.

I usually keep them on my fridge. I stick the magnets on it so I can see them every day.`,
    category: "Part 1 - Collecting Things"
  },
  {
    id: 187,
    question: "Can you find food from many different countries where you live?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 주변에 이탈리안, 일본, 중국 등 다양한 나라의 식당이 많다는 답변입니다. 도시가 다양한 문화를 가지고 있고 사람들이 다른 요리를 즐기기 때문입니다.

Yes, definitely. There are many international restaurants in my area, such as Italian, Japanese, and Chinese. This is mainly because my city is quite diverse and people enjoy trying different cuisines.`,
    category: "Part 1 - International Food"
  },
  {
    id: 188,
    question: "How often do you eat typical food from other countries?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 일주일에 한두 번 정도 꽤 자주 먹는다는 답변입니다. 다양한 맛을 즐기며, 다른 문화를 경험하는 좋은 방법이기도 합니다.

I eat international food quite regularly, maybe once or twice a week. I enjoy trying different flavors, and it's also a nice way to experience other cultures.`,
    category: "Part 1 - International Food"
  },
  {
    id: 189,
    question: "Have you ever tried making food from another country?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 집에서 파스타를 만들어본 적이 있다는 답변입니다. 완벽하지는 않았지만 재미있는 경험이었고, 요리에 얼마나 많은 기술이 필요한지 새삼 느꼈다고 합니다.

Yes, I have. I once tried making pasta at home. It wasn't perfect, but it was a fun experience, and it made me appreciate how much skill cooking actually requires.`,
    category: "Part 1 - International Food"
  },
  {
    id: 190,
    question: "What food from your country would you recommend to people from other countries?",
    sampleAnswer: `<strong>[한국어 개요]</strong> 한국식 바비큐를 추천한다는 답변입니다. 맛있을 뿐만 아니라 손님이 직접 테이블에서 고기를 구워 먹는 독특하고 즐거운 경험이기 때문입니다.

I would definitely recommend Korean barbecue. It's not only delicious but also interactive, as people cook the meat themselves at the table. I think it's a unique and enjoyable experience.`,
    category: "Part 1 - International Food"
  }
];

const part2Questions: Part2Question[] = [
  {
    id: 1,
    topic: "Weather",
    mainQuestion: "Describe a kind of weather you like",
    subQuestions: [
      "What it is",
      "Where you usually experience it", 
      "What you will do in this weather",
      "and explain why you like it"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
덥고 화창한 날씨를 좋아한다는 답변입니다. 주로 마이애미에서 이런 날씨를 경험하며, 해변에서 수영하거나 친구들과 낚시를 즐깁니다. 이 날씨가 활력을 주고 편안한 기분이 들게 해서 좋아한다고 설명합니다.

One type of weather I really enjoy is hot and sunny weather. Bright sunshine and warm temperatures always put me in a good mood.

I usually experience this weather when I visit Miami, Florida, which is famous for its beaches and tropical climate. The sun is almost always shining there, and the warmth near the ocean feels very inviting.

During this weather, I love swimming, relaxing by the water, or fishing with friends. It's a perfect way to enjoy the outdoors and the lively atmosphere of the city.

I like hot and sunny weather because it makes me feel energetic and carefree. I can wear light clothes comfortably, spend time outdoors, and it just leaves me with happy memories.`,
    category: "Part 2 - Weather",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of weather do people in your country like?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 사람들은 대체로 온화한 날씨를 선호하며, 봄과 가을을 좋아합니다. 일부는 수영이나 하이킹 같은 야외 활동을 위해 여름도 좋아합니다.

In my country, people generally prefer mild weather. Most people enjoy spring and autumn because the temperature is comfortable and pleasant. However, some people also like summer for outdoor activities like swimming and hiking.`
      },
      {
        id: 2,
        question: "Do you think weather affects people's mood?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 날씨가 사람들의 기분에 확실히 영향을 미친다고 생각합니다. 맑고 따뜻하면 더 활기차고, 비가 오거나 흐린 날이 많으면 기분이 처지거나 의욕이 떨어질 수 있습니다.

Yes, I think weather definitely affects people's mood. When it's sunny and warm, people tend to be more cheerful and energetic. On the other hand, when it's rainy or cloudy for many days, people might feel a bit down or less motivated.`
      },
      {
        id: 3,
        question: "How has the weather changed in recent years?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 최근 몇 년간 날씨가 더 예측 불가능해졌다고 생각합니다. 더 더운 여름과 더 잦은 폭우 같은 극단적인 기상 조건을 경험하고 있으며, 기후 변화와 관련이 있을 수 있다고 합니다.

I think the weather has become more unpredictable in recent years. We're experiencing more extreme weather conditions, like hotter summers and more frequent heavy rain. This might be related to climate change.`
      }
    ]
  },
  {
    id: 2,
    topic: "Place",
    mainQuestion: "Describe a place you would like to visit",
    subQuestions: [
      "Where it is",
      "How you know about this place",
      "What you would do there",
      "and explain why you would like to visit this place"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
방문하고 싶은 장소로 일본 도쿄를 꼽은 답변입니다. 다큐멘터리, 여행 프로그램, 방문한 친구들을 통해 알게 되었으며, 전통 사찰과 신사 탐방, 정통 일식 체험, 시부야 교차로 방문 등을 하고 싶다고 합니다. 전통과 혁신의 조화가 매력적이라고 설명합니다.

A place I would really like to visit is Japan, specifically Tokyo. I've always been fascinated by Japanese culture, technology, and cuisine.

I know about this place through various sources - documentaries, travel shows, and friends who have visited. I've also read about its rich history and modern innovations.

If I could visit, I would explore the traditional temples and shrines, try authentic Japanese food like sushi and ramen, visit the famous Shibuya crossing, and experience the unique blend of old and new that Tokyo offers.

I want to visit Japan because it represents the perfect balance between preserving tradition and embracing innovation. The culture seems so different from what I'm used to, and I think it would be an eye-opening experience.`,
    category: "Part 2 - Place",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of places do people in your country like to visit?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 사람들은 산, 해변, 국립공원 같은 아름다운 자연을 방문하는 것을 좋아하며, 역사 유적과 문화 명소도 즐깁니다. 최근에는 트렌디한 카페와 레스토랑도 인기입니다.

People in my country generally like to visit places with beautiful nature, such as mountains, beaches, and national parks. They also enjoy visiting historical sites and cultural landmarks. Recently, many people are also interested in visiting trendy cafes and restaurants.`
      },
      {
        id: 2,
        question: "Do you think it's better to travel alone or with others?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 둘 다 장점이 있다고 생각합니다. 혼자 여행하면 자유와 유연성이 있고, 함께 여행하면 더 재미있고 안전하며 경험을 공유하고 추억을 만들 수 있습니다.

I think both have their advantages. Traveling alone gives you more freedom and flexibility to do exactly what you want. However, traveling with others can be more fun and safer, especially in unfamiliar places. It also allows you to share experiences and create memories together.`
      },
      {
        id: 3,
        question: "How has tourism changed in recent years?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 최근 관광이 크게 변했다고 합니다. 기술 덕분에 온라인 예약과 여행 앱으로 여행 계획이 쉬워졌고, 소셜 미디어도 방문지 선택에 영향을 주고 있습니다. 코로나19 팬데믹이 국제 여행에 큰 영향을 미쳤습니다.

Tourism has changed significantly in recent years. Technology has made it easier to plan trips with online booking and travel apps. Social media has also influenced where people want to visit. However, the COVID-19 pandemic has had a major impact on international travel.`
      }
    ]
  },
  {
    id: 3,
    topic: "People",
    mainQuestion: "Describe a person, much older than you, who you admire",
    subQuestions: [
      "Who this person is",
      "How you know this person",
      "What kinds of things you like to do together",
      "And explain why you admire this person"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
존경하는 나이 많은 인물로 엘리자베스 2세 여왕을 꼽은 답변입니다. 1999년 여왕�� 한국 방문을 TV로 보고, ��후 영국 유학 중 더 알게 되었습니다. 평생 여��으로 헌신한 점과 아이폰을 사용하는 등 새로운 것에 열린 태도를 보여 존경한다고 설명합니다.

The person I admire is the Queen Elizabeth II of the UK. She just turned to 90 years old this year, and she has been the queen of England for the longest period, 63 years altogether.

The queen visited Korea in 1999, when I was a child. It was big news for Korean people, and I watched news programmes on TV while she was staying in Korea. After that, I went to study in England, and read news, books, and journals about her and royal family so I got to know her more.

Well, to be honest, I'd like to ask her some questions like how she feels, what her hobbies are - just ordinary stuff like I'm talking to my friend. Maybe we could have some tea, and talk to each other if possible.

I admire her because she spent all of her life-time as the queen. I heard that she didn't want to be the queen of England when she was young as the role is a big burden for her. However after all, she did a great job to make England as one of the most powerful countries in the world. Also I think she is not afraid of trying new things out, which I am weak at. An article I read showed a picture of her using iPhone, and she is an early-adapter. It was quite surprising for me as I thought she would only respect tradition. I think that she is very open to new things. That's probably why she is beloved by many people.`,
    category: "Part 2 - People",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 시간을 절약하고 자주 출장하는 비즈니스맨들이 비행기를 가장 많이 이용한다고 생각합니다. 경제적 여유가 있고 편의를 원하는 사람들도 비행기를 선택합니다.

I think business people are most likely to choose to travel by plane because they need to save time and travel frequently. Also, people who can afford it and want convenience often choose planes. Some people who are afraid of other transportation methods also prefer planes.`
      },
      {
        id: 2,
        question: "What do you think about travelling by plane?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 비행기 여행은 장단점이 있다고 생각합니다. 속도와 편의성이 장점이지만, 비용이 비싸고 보안 절차와 지연이 불편할 수 있습니다.

I think travelling by plane has both advantages and disadvantages. The obvious advantages are speed and convenience - you can travel long distances quickly. However, it can be expensive, and some people feel uncomfortable with the security procedures and potential delays.`
      },
      {
        id: 3,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 공항 근처에 사는 장점은 여행 접근성과 교통 연결이 좋다는 것이고, 단점은 비행기 소음 공해와 대기 오염, 높은 생활비 등이 있습니다.

Living near an airport has advantages like easy access to travel and often good transport connections. However, there are disadvantages like noise pollution from planes taking off and landing, and sometimes air pollution. Also, the area might be more expensive to live in.`
      }
    ]
  },
  {
    id: 4,
    topic: "Plane",
    mainQuestion: "Describe a person (you know) that you would like to meet in the news",
    subQuestions: [
      "Who this person is",
      "What he or she does",
      "How you know this person",
      "And explain why you want to meet them"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
뉴스에서 본 사람 중 만나고 싶은 인물로 일론 머스크를 선택한 답변입니다. 테슬라와 스페이스X의 CEO로 전기차와 우주 탐사 분야의 혁신으로 유명합니다. 뉴스, SNS, 다큐멘터리를 통해 알게 되었으며, 미래에 대한 비전과 야심찬 아이디어를 현실로 만드는 능력에 매료되어 만나보고 싶다고 설명합니다.

A person I would like to meet from the news is Elon Musk. He is the CEO of Tesla and SpaceX, and he's known for his innovative work in electric cars and space exploration.

I know about him through various news sources, social media, and documentaries. I've been following his work for several years, especially his efforts to make electric vehicles more accessible and his ambitious plans for Mars colonization.

I would like to meet him because I'm fascinated by his vision for the future and his ability to turn ambitious ideas into reality. I think he would have interesting insights about technology, innovation, and the future of transportation and space travel. It would be amazing to hear his thoughts firsthand and ask him about his future plans.`,
    category: "Part 2 - Plane",
    part3Questions: [
      {
        id: 1,
        question: "Do you think planes will have a negative influence in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 부정적인 영향이 있을 수 있다고 생각합니다. 환경 오염과 소음 문제 등이 있으며, 해외 여행이 늘면서 국내 관광에 영향을 줄 수 있습니다.

Yes, it could have a negative impact. Yes, it might lead to severe effects, such as increased crime. Obsession with celebrities could cause depression. Some, especially business people, prefer traveling abroad.`
      },
      {
        id: 2,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 신혼부부, 유명 배우나 세계적인 유명인, 시간을 절약해야 하는 사람들이 비행기를 선택하는 경향이 있습니다.

Newly married couples or those with specific preferences. Famous actors or global celebrities. And explain why they choose planes (e.g., time-saving).`
      },
      {
        id: 3,
        question: "Have you ever been to the UK?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 여행 기회와 교통 수단의 장단점에 대해 논의합니다.

Some get travel opportunities, which can be intriguing. Discuss pros and cons of transport options. It's a complex question to address fully.`
      },
      {
        id: 4,
        question: "What kinds of news are popular in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 연예인 뉴스가 관심을 끌며, 유명인에 관한 이야기가 널리 관심을 받습니다.

Celebrity news tends to draw attention. Stories about celebrities are widely followed. Interest in lives of those traveling to the USA or UK.`
      },
      {
        id: 5,
        question: "What do you think about traveling by plane?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 비행기 여행의 분명한 장점을 강조합니다. 편의를 위해 여행하는 사람도 있으며, 다양한 이유로 여러 장소를 방문합니다.

Highlight the clear advantages of plane travel. Some travel for convenience, though it may not always feel typical. It can be time-consuming, with visits to other locations for various reasons.`
      }
    ]
  },
  {
    id: 5,
    topic: "Celebrity/News",
    mainQuestion: "Describe a celebrity you admire",
    subQuestions: [
      "Who this person is",
      "What they are famous for",
      "How you know about them",
      "And explain why you admire them"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
존경하는 유명인으로 톰 행크스를 꼽은 답변입니다. 포레스트 검프, 캐스트 어웨이 등으로 유명한 할리우드 배우로, 어릴 때부터 영화를 보며 알게 되었습니다. 다양한 캐릭터를 설득력 있게 연기하는 능력과 겸손하고 친절한 인품을 존경한다고 설명합니다.

A celebrity I really admire is Tom Hanks. He is one of the most respected actors in Hollywood, known for his versatile performances in films like Forrest Gump, Cast Away, and The Green Mile.

I know about him through his movies, interviews, and various media appearances. I've been watching his films since I was a child, and I've always been impressed by his ability to portray such diverse characters convincingly.

I admire him because he seems like a genuinely good person both on and off screen. He's known for his professionalism, kindness, and positive attitude. Despite his fame, he appears to be humble and down-to-earth. I also respect his work ethic and the way he chooses meaningful projects that often have positive messages.`,
    category: "Part 2 - Celebrity/News",
    part3Questions: [
      {
        id: 1,
        question: "What's the difference between broadcasting news in the past and in the present?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 과거와 현재의 뉴스 방송 차이에 대한 답변입니다. 과거에는 TV와 신문이 주된 매체였지만, 현재는 인터넷과 소셜 미디어가 주요 뉴스 소스가 되었습니다.

Compare broadcasting with the press. Interesting news often takes precedence. Examples like USA and Canada business contexts.`
      },
      {
        id: 2,
        question: "Why do you think people are so interested in celebrities' lives?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 유명인의 화려한 삶에 대한 호기심과 동경이 관심의 원인이며, 미디어를 통해 더 많은 정보를 접하면서 매력을 느끼게 됩니다.

Interest may grow from hearing about them during plane trips. Famous people offer more details to explore. The time spent learning about them adds to the fascination.`
      },
      {
        id: 3,
        question: "What methods do you use to get news?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 뉴스를 얻는 방법에 대한 답변입니다. 주로 온라인 뉴스와 소셜 미디어를 통해 정보를 접하며, 다양한 매체를 비교해서 봅니다.

Desire to meet someone due to their life story. Travel time example: Seoul to Busan (up to 3 hours). Compare plane travel with buses or trains.`
      },
      {
        id: 4,
        question: "Do you believe everything said in the news?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 뉴스를 완전히 믿지는 않는다는 답변입니다. 회의적인 시각이 일반적이며, 당국에 의한 검열이나 정보 억제도 있을 수 있습니다.

Not fully; skepticism is common. Shopping facilities near airports are notable. Censored or suppressed information by authorities.`
      },
      {
        id: 5,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 공항 근처에 사는 것의 장점은 활기찬 환경에 접근할 수 있다는 것이고, 단점은 소음 공해가 심하다는 것입니다.

Access to a dynamic environment is a plus. Noise pollution is a significant downside.`
      },
      {
        id: 6,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 일부 사람들이 TV 뉴스를 보지 않는 이유에 대한 답변입니다. 관련 없거나 멀게 느껴질 수 있으며, 다른 미디어를 선호하기 때문입니다.

It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences.`
      }
    ]
  },
  {
    id: 6,
    topic: "The News",
    mainQuestion: "Describe a news story that interested you",
    subQuestions: [
      "What the news was about",
      "When you heard about it",
      "How you found out about it",
      "And explain why it interested you"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
유류할증료 인상으로 항공권이 비싸진다는 뉴스에 대한 답변입니다. 3월 말에 휴대폰으로 온라인 뉴스를 읽다가 접했으며, 평소 비행기를 자주 타기 때문에 바로 관심을 갖게 되었습니다. 4월부터 유류할증료가 크게 오른다는 내용이었고, 이 소식은 본인의 여행 계획과 직접적으로 관련이 있어 흥미로웠다고 설명합니다. 기본 운임이 합리적으로 보여도 유류할증료 같은 추가 비용이 최종 가격에 큰 영향을 줄 수 있다는 점도 언급합니다.

I'd like to talk about a news story I found really interesting, which is about airfares becoming more expensive due to higher fuel surcharges.

I heard about it in late March, just before April started. I came across it while reading online news on my phone, and since I travel by plane quite often, it immediately caught my attention.

The news said that from April, fuel surcharges on flights would increase significantly, which meant that airline tickets would become more expensive. What made it especially noticeable was that the increase was quite sharp, so even people who had already been thinking about traveling suddenly felt pressured to book earlier.

I found this story interesting because it was directly related to my own life. Since I fly fairly often, changes in ticket prices affect my travel decisions a lot. It also reminded me that even when the base fare looks reasonable, extra charges like fuel surcharges can make a big difference to the final cost. So for me, it was not just a piece of general news, but something practical that could actually influence my future travel plans.`,
    category: "Part 2 - The News",
    part3Questions: [
      {
        id: 1,
        question: "Do you think the news will have a negative influence?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 부정적인 뉴스가 사람들에게 영향을 미칠 수 있다고 생각합니다. TV 뉴스를 많이 보면 우울해질 수 있습니다.

Yes, negative news can impact people. Watching TV news might lead to depression. Curiosity about celebrities drives interest.`
      },
      {
        id: 2,
        question: "What kinds of news do you think are popular in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 연예인 뉴스가 대체로 인기 있으며, 사람들은 다른 사람들의 삶에 대해 알고 싶어 합니다. 과도한 뉴스 보도가 다양한 측면에 영향을 미칩니다.

Celebrity news is generally popular. People are keen to know about others' lives. Excessive news coverage influences various aspects.`
      },
      {
        id: 3,
        question: "What's the difference between the news in the past and the present?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 과거와 현재 뉴스의 차이에 대한 답변입니다. 과거에는 방송과 언론이 중심이었지만, 현재는 흥미로운 뉴스가 우선시되는 경향이 있습니다.

Compare broadcasting with the press. Interesting news often comes first. Examples like USA and Canada business contexts.`
      },
      {
        id: 4,
        question: "Why do you think people are so interested in news?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 사람들이 뉴스에 관심을 가지는 이유에 대한 답변입니다. 유명인에 대한 더 많은 정보를 탐구할 수 있고, 시간을 투자할수록 매력을 느끼게 됩니다.

Interest may stem from plane travel experiences. Famous people provide more details to explore. The time investment adds to the appeal.`
      },
      {
        id: 5,
        question: "What methods do you use to get news nowadays?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 요즘 뉴스를 얻는 방법에 대한 답변입니다. 주로 스마트폰과 인터넷을 통해 뉴스를 접하며, 다양한 교통수단과 마찬가지로 여러 매체를 비교합니다.

Desire to meet someone based on their life story. Travel time example: Seoul to Busan (up to 3 hours). Comparisons between plane, bus, or train travel.`
      },
      {
        id: 6,
        question: "Do you believe everything said in the news?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 뉴스를 완전히 믿지는 않는다는 답변입니다. 신뢰도가 다양하며, 당국의 검열이 내용에 영향을 줄 수 있습니다.

Not fully; trust varies. Shopping facilities near airports are a feature. Censorship by authorities can affect content.`
      },
      {
        id: 7,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 공항 근처에 사는 장점은 활기찬 환경에 접근할 수 있다는 것이고, 단점은 소음 공해가 크다는 것입니다.

Access to a dynamic environment is a plus. Noise pollution is a significant downside.`
      },
      {
        id: 8,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 요즘 일부 사람들이 TV 뉴스를 보지 않는 이유에 대한 답변입니다. 관련 없거나 멀게 느껴질 수 있고, 다른 콘텐츠를 선호하기 때문입니다.

It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences.`
      }
    ]
  },
  {
    id: 7,
    topic: "Foreign Language",
    mainQuestion: "Describe a foreign language you would like to learn",
    subQuestions: [
      "What language it is",
      "How you would learn it",
      "Why you want to learn it",
      "And explain how it would be useful for you"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
배우고 싶은 외국어로 스페인어를 선택한 답변입니다. 정규 수업, 언어 학습 앱, 스페인 영화 시청, 원어민과의 연습 등으로 배울 계획이며, 전 세계 수백만 명이 사용하는 언어로 여행, 비즈니스, 문화 교류에 유용할 것이라고 설명합니다.

A foreign language I would really like to learn is Spanish. I think it's a beautiful and widely spoken language that would open up many opportunities for me.

I would learn it through various methods - taking formal classes, using language learning apps, watching Spanish movies and TV shows, and practicing with native speakers. I believe immersion is the best way to learn a language effectively.

I want to learn Spanish because it's spoken by millions of people around the world, especially in many countries in Latin America and Spain. It would be incredibly useful for travel, business, and cultural exchange.

Learning Spanish would be very useful for me because it would enhance my career prospects, especially if I work in international business or tourism. It would also allow me to communicate with Spanish-speaking communities and understand their culture better.`,
    category: "Part 2 - Foreign Language",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 많은 사람들이 외국어를 배우며, 영어가 가장 인기 있고 일본어, 중국어 등도 배웁니다. 다양한 목적으로 외국어를 배우는 경향이 있습니다.

Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes.`
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 이민이나 유학을 위해 외국어를 배우는 사람이 많습니다. 한국인은 유학이나 이민을 위해 영어를 배우며, 비즈니스 목적이나 특정 문화에 대한 관심으로도 배웁니다.

In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture.`
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 완전히 동의한다는 답변입니다. 유치원 아이들은 먼저 모국어를 배워야 하고, 초등학교에 들어가면 새로운 언어를 배우기 시작하는 것이 좋다고 생각합니다. 여전히 새로운 지식을 빠르게 습득할 수 있는 나이입니다.

Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly.`
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 6~7세쯤이 적당하다고 생각한다는 답변입니다. 아이들이 어른보다 지식을 더 빨리 흡수하지만, 6~7세가 되기 전에 두 가지 다른 언어를 동시에 배우면 혼란스러워질 수 있다고 합니다.

Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information.`
      }
    ]
  },
  {
    id: 8,
    topic: "Food",
    mainQuestion: "Describe a time when you tried a new food for the first time",
    subQuestions: [
      "What food it was",
      "Where you ate it",
      "What it tasted like",
      "And explain whether or not you liked this food"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
맘스터치의 스페셜 에디션 버거를 먹어본 경험입니다. 치킨 패티가 안은 부드럽고 겉은 바삭해서 좋았고, 소스는 달콤하면서도 짭짤한 균형이 잘 맞았습니다. 다만 번이 좀 차가웠고, 재료 배치가 아쉬웠습니다. 전반적으로 만족스러웠지만 약간의 개선이 있으면 더 좋을 것 같다는 내용입니다.

Recently, I tried a special edition burger from Mom's Touch, and it was quite memorable.

The texture was definitely the highlight. The chicken patty was tender on the inside and crunchy on the outside, which I really enjoyed. The sauce was quite gooey and perfectly balanced between sweet and savory, so it added a rich flavor to the burger. Also, the lettuce and tomato gave it a nice burst of freshness, which made it feel less greasy.

However, there were a couple of things I didn't like. For instance, the bun was a bit cold, which slightly ruined the overall experience. Also, I wasn't a big fan of how the ingredients were assembled. The chicken patty and lettuce were placed in the same layer, whereas I personally prefer each ingredient to be evenly distributed in separate layers.

Overall, it was still a satisfying meal, but I think it could have been much better with a few small improvements.`,
    category: "Part 2 - Food",
    part3Questions: [
      {
        id: 1,
        question: "In your country, what are the most common (or, popular) food that people eat?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 전통 음식이 가장 흔하고 인기 있으며, 이탈리안 음식도 한국 여성들 사이에서 인기가 높습니다. 개인마다 다르다고 합니다.

I'd definitely say Korean traditional food is most common and popular in Korea. Also another booming one would be Italian as lots of Korean women like to eat Italian food, but generally speaking, it really depends on every individual.`
      },
      {
        id: 2,
        question: "Do you think adults and children have the same attitudes towards food?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 어른과 아이의 음식에 대한 태도가 다르다고 생각합니다. 어른은 생존을 위해 먹지만, 아이들은 쓴 것을 피하고 달거나 맛있는 것만 먹으려 합니다. 어른들은 대체로 더 건강하게 먹습니다.

I don't quite think so. It seems like adults eat food for survival. They need to get energy to work hard for the day but children tend not to eat something bitter or they don't like. Children usually only want to eat something sweet or delicious ones. Well, of course some adults do the same, but generally they tend to eat more healthily.`
      },
      {
        id: 3,
        question: "Do you think it's important for adults to teach children concerning the food we eat?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 어른이 아이들에게 음식에 대해 가르치는 것이 절대적으로 중요하다고 생각합니다. 맛보다 영양의 중요성과 식사 예절을 배워야 하며, 환경이나 동물 등 더 넓은 주제에도 관심을 기울일 수 있게 됩니다.

Absolutely. Adults should teach children everything from food to attitudes towards it. Children should realise the importance of nutrients rather than taste of a certain food, and also they need to learn about manners when eating food. I believe by teaching children about the food we eat, children can definitely pay attention not only to food but also something further like the environment or the animals.`
      },
      {
        id: 4,
        question: "In general, would you say people in your country are willing to try new food?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 모든 사람이 그렇지는 않지만, 요즘 젊은이들은 충분히 모험적으로 새로운 음식을 시도합니다. 무언가가 트렌드가 되면 사람들이 음식을 포함해 새로운 것을 시도하는 경향이 있습니다.

Not everyone though. It totally depends on their characteristics but I think some youngsters are adventurous enough to try new food nowadays. When something becomes trendy, people tend to try new things including food but not everyone.`
      },
      {
        id: 5,
        question: "Who do you think is more willing to try a new food, children or adults?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 어른이 더 기꺼이 새로운 음식을 시도한다고 생각합니다. 아이들은 이미 먹어본 것이나 맛있는 것만 시도하지만, 다른 문화에 관심 있는 청소년과 어른들은 기회가 있으면 더 열린 자세로 새 음식을 시도합니다.

I'd say adults. From my surroundings, children only try something they already had before or tastes good. But as there are lots of adolescents and adults who have interests in other cultures, they are more open to try a new food when they have a chance.`
      },
      {
        id: 6,
        question: "What kinds of foreign food are most common (or, most popular) in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 중국이나 일본 음식이 가장 흔하며, 이탈리안도 매우 유명합니다. 요즘에는 유럽 요리가 서울의 많은 동네에서 인기를 끌고 있습니다.

Maybe Chinese or Japanese, I suppose. There are massive numbers of restaurants sell those food and also Italian is very famous one, too. Also nowadays, European cuisines are booming in Korea so lots of pubs and restaurants launched in many towns in Seoul.`
      }
    ]
  },
  {
    id: 9,
    topic: "Anger",
    mainQuestion: "Describe a situation when you got a little angry",
    subQuestions: [
      "Where it happened",
      "When it happened",
      "Who you were with",
      "And explain why you felt angry"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
버스 정류장에서 새치기를 당해 화가 났던 경험입니다. 힘든 하루를 보내고 퇴근길에 20분 넘게 줄을 서서 기다리고 있었는데, 버스가 오자 한 여성이 갑자기 앞에 끼어들었습니다. 주변 사람들도 화를 내자 결국 뒤로 돌아갔지만, 매우 짜증나는 경험이었다고 합니다.

Actually I faced a situation which made me quite angry last week. It was last week, at the bus stop. I was heading to my home when I finished the work. Before it happened, it was quite a tough day for me as I had lots of things to finish on that day.

When I arrived at the bus stop, it was very crowded with lots of people as there are 5 or 6 bus stops altogether. There were like at least 50 people waiting for their buses, so I found mine then joined the queue. At that time, I was on my own, listening to music while waiting for the bus, and waited for about 20 minutes.

Then when the bus came towards the stop, a young girl suddenly came up somewhere and jumped in the queue right before me. I was so annoyed since I waited for 20 minutes, and there were tons of people behind me. I'm sure most people felt the same thing as me. So people started to yell at her, then she went back of the queue at the end. It was such a frustrating situation, and hope not to experience such thing again.`,
    category: "Part 2 - Anger",
    part3Questions: [
      {
        id: 1,
        question: "What would you do if you make others angry at you?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 상대방에게 먼저 대화를 시도해 문제를 해결하려 합니다. 상대방의 생각을 파악하고, 자신의 잘못이면 사과합니다. 공격적인 경우에는 그냥 무시합니다.

Well, if it happens, I tend to talk to them first to sort the problem out. I just try to find out what they think and what made them upset, then apologise when it comes to my fault. But if they are just being aggressive, I just ignore them.`
      },
      {
        id: 2,
        question: "In what ways can people manage their anger well?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 먼저 심호흡을 하고, 화나게 한 상황을 곰곰이 생각한 후 행동을 취할 수 있습니다. 기분이 나아지는 일을 즐기는 것도 방법이며, 본인은 재미있는 것을 보며 화를 다스린다고 합니다.

Maybe they can take deep breath first of all. They can think over the situation that made them upset then take an action. Also people can enjoy things that will make them feel lifted. In my case, I tend to control my anger by watching something funny.`
      },
      {
        id: 3,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 야근이 다음 날 업무에 부정적 영향을 미친다고 확신합니다. 피로, 생산성 저하, 집중력 문제를 초래할 수 있으며, 직접 경험한 사례를 들어 설명합니다.

Yes, most definitely. I believe that working late at night will negatively affect the next day's work. It can lead to fatigue, reduced productivity, and difficulty concentrating. For example, I once had to attend a meeting at 10 AM, but I had worked until 2 AM the previous night. As a result, I was exhausted and struggled to focus during the meeting. I ended up making several mistakes and felt very frustrated. Since then, I try to avoid working late at night whenever possible.`
      },
      {
        id: 4,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 그렇다고 생각합니다. 주변의 많은 젊은이들이 컴퓨터 게임이나 스마트폰 게임 때문에 늦게 자며, 중고등학생들도 많은 학습량 때문에 밤늦게까지 깨어 있습니다.

I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study.`
      },
      {
        id: 5,
        question: "What kinds of things make people angry?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 불공평한 대우, 무례함, 긴 대기 시간, 규칙이나 사회적 규범을 따르지 않는 것 등이 화를 유발합니다. 직장이나 개인 생활의 스트레스도 사람들을 더 쉽게 짜증나게 만듭니다.

I think people get angry for various reasons. Some common triggers include unfair treatment, disrespect, long waiting times, and when others don't follow rules or social norms. Also, stress from work or personal life can make people more easily irritated.`
      }
    ]
  },
  {
    id: 10,
    topic: "Foreign Language Communication",
    mainQuestion: "Describe the first time you used a foreign language to communicate",
    subQuestions: [
      "Who you communicated with",
      "What you said or wrote",
      "What the situation was",
      "And explain how you felt during this experience"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
일본어 학원에서 처음 외국어로 소통했던 경험에 대한 답변입니다. 첫 수업 날 일본어 선생님과 반 친구들과 대화했지만, 일본어를 전혀 못해서 간단한 인사와 이름 소개 정도만 할 수 있었습니다. 반에 한국인 학생이 없어 모국어에 의지할 수도 없었고, 선생님이 대부분 일본어로 말해서 압도당하는 느낌이었습니다. 긴장되고 답답했지만 동시에 큰 동기부여가 되었고, 이후 숙제를 열심히 하고 친구들에게 먼저 말을 걸려고 노력했다고 설명합니다. 어려운 경험이었지만 언어 실력 향상의 전환점이 되었다는 내용입니다.

One of the first times I used a foreign language to communicate was when I attended my first Japanese language class at a language school.

On that day, I communicated mainly with my Japanese teacher and a few classmates. The problem was that I couldn't speak Japanese at all at that time, so I was only able to say very basic expressions like simple greetings or introducing my name. Most of the time, I just listened and tried to understand what was going on.

The situation was quite challenging because it was my first day at the language school, and there were no Korean students in my class. So, I couldn't rely on my native language at all. I remember the teacher speaking mostly in Japanese, which made me feel a bit overwhelmed. Also, when my classmates tried to talk to me, I struggled to respond properly.

At that moment, I felt quite nervous and even a little frustrated because I couldn't express myself. However, at the same time, it motivated me a lot. I realized that if I wanted to communicate with my classmates and improve my Japanese skills, I really needed to study hard.

So, after that experience, I made two main efforts. First, I focused on completing all the homework given by my teacher. Second, I tried to actively start conversations with my classmates, even if my sentences were not perfect.

Overall, although it was a difficult experience, it became a turning point that pushed me to improve my language skills.`,
    category: "Part 2 - Foreign Language Communication",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 많은 사람들이 외국어를 배우며, 영어가 가장 인기 있고 일본어, 중국어 등도 배웁니다. 다양한 목적으로 외국어를 배우는 경향이 있습니다.

Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes.`
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 이민이나 유학을 위해 외국어를 배우는 사람이 많습니다. 한국인은 유학이나 이민을 위해 영어를 배우며, 비즈니스 목적이나 특정 문화에 대한 관심으로도 배웁니다.

In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture.`
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 완전히 동의한다는 답변입니다. 유치원 아이들은 먼저 모국어를 배워야 하고, 초등학교에 들어가면 새로운 언어를 배우기 시작하는 것이 좋다고 생각합니다. 여전히 새로운 지식을 빠르게 습득할 수 있는 나이입니다.

Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly.`
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 6~7세쯤이 적당하다고 생각한다는 답변입니다. 아이들이 어른보다 지식을 더 빨리 흡수하지만, 6~7세가 되기 전에 두 가지 다른 언어를 동시에 배우면 혼란스러워질 수 있다고 합니다.

Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information.`
      }
    ]
  },
  {
    id: 11,
    topic: "Weather Plans",
    mainQuestion: "Describe a time when the weather caused you to change your plans",
    subQuestions: [
      "What your plan was",
      "What weather you were hoping for",
      "What happened",
      "And explain how you felt when you had to change your plans"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
몬트리올에서 살던 겨울, 뉴욕 경유 후 마이애미로 가려던 여행 계획이 폭설로 변경된 경험입니다. 공항에서 대기 중 블리자드 경보가 발령되어 항공편이 5시간 이상 지연된 후 결항되었고, 항공사가 마이애미 직항으로 변경해주었습니다. 뉴욕 쇼핑 계획이 취소되어 실망했지만, 덕분에 마이애미에서 더 많은 시간을 보내며 해변과 수영을 즐길 수 있었다는 내용입니다.

Well, I remember a time when I had to change my travel plans because of severe weather.

It happened this winter when I was living in Montreal.

I was at the airport, waiting for my flight.

My original plan was to have a two-day layover in New York, where I wanted to do some shopping and look around the city.

After that, I was planning to fly to Miami to enjoy swimming in the ocean and watch a basketball game.

I was hoping for calm and stable weather so that my flight wouldn't be affected.

At first, the weather seemed quite normal. However, all of a sudden, a blizzard warning was announced.

Because of that, my flight was delayed for over five hours.

Eventually, the flight was cancelled, and the airline changed my ticket to a direct flight to Miami.

As a result, I had to cancel my plan to stay in New York.

At first, I felt quite disappointed because I had really been looking forward to shopping there.

However, I soon realized that it wasn't all bad.

Since I arrived in Miami earlier than expected, I had more time to relax on the beach, enjoy the sunshine, and go swimming.

Overall, even though the weather forced me to change my plans, it turned out to be a pretty enjoyable and memorable trip.`,
    category: "Part 2 - Weather Plans",
    part3Questions: [
      {
        id: 1,
        question: "What kind of weather do people in your country prefer?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 사람들은 따뜻하고 쾌적한 날씨를 확실히 선호합니다. 여름과 겨울이 극단적이라 봄 날씨를 가장 좋아하며, 따뜻하고 맑고 부드러운 바람이 외출을 즐기게 합니다.

Definitely warm and pleasant weather. As the weather in Korea changes by the season, the weather in summer or winter is quite extreme. So people seem to prefer the weather in spring. The weather in spring is normally warm, sunny, and gentle breeze make people want to go outside.`
      },
      {
        id: 2,
        question: "In general, do people in your country pay attention to the weather forecasts?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 대부분의 한국인이 매일 TV 일기예보를 봅니다. 직장인들은 비나 눈이 올 때 교통 상황을 예측하려 하고, 야외 활동을 계획하는 사람들은 특히 더 주의를 기울입니다.

Generally speaking, most Korean people watch weather forecasting reports on TV every day. For businessmen, they tend to watch it because they can estimate the traffic if it's raining or snowing. Also if people plan to do some outdoor activities, they pay extra attention to it since they want very pleasant weather when they go out.`
      },
      {
        id: 3,
        question: "Which people do you think pay more attention to the weather than other people?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 건설 노동자처럼 야외에서 일하는 사람들이 가장 먼저 떠오릅니다. 영업사원이나 택시 기사도 하루 종일 운전해야 하므로 날씨에 주의를 기울입니다.

The first one came up on my mind is the ones who work outside like builders as they spend majority of their time working outside. Also maybe salesman or taxi drivers might be the ones as they have to drive all day.`
      },
      {
        id: 4,
        question: "Are weather forecasts in your country usually accurate?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 비나 눈이 올 때는 대체로 정확하고 신뢰할 수 있지만, 대부분의 경우 그렇지 않습니다. 최소 다섯 번 중 한 번은 잘못된 정보를 방송하며, 대부분의 사람들이 일기예보를 크게 믿지 않습니다.

When it rains or snows, they are mostly accurate and reliable. But in most cases, they aren't. I think they broadcast wrong information once in five times at least, and most people don't quite believe the weather information they provide.`
      },
      {
        id: 5,
        question: "What different activities do people do in different seasons?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 여름에는 수영, 웨이크보드, 수상스키 같은 수상 스포츠를 즐기며 여행도 많이 갑니다. 겨울에는 스키와 스노보드가 매우 인기 있어 계절마다 다양한 활동을 즐깁니다.

In sports wise, people go for water sports in summer, for instance, swimming, wakeboarding, and water skiing. And I think people tend to travel more in summer as most companies provide annual holiday at that season. In winter, winter sports such as skiing and snowboarding are very popular amongst Korean people so many people go and enjoy different activities in different seasons.`
      },
      {
        id: 6,
        question: "Can you think of some examples of how the weather can have an impact on people doing certain jobs?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 건설 노동자가 날씨에 가장 의존적인 직업입니다. 비나 눈이 오면 야외 작업을 계속하기 어렵습니다. 전기 기사도 악천후 시 업무가 매우 위험해져 일을 못 할 수 있습니다.

I'd say constructors are the ones whose job is dependent on the weather. They normally work outside in order to build buildings, so it's unlikely for them that they can continue with their work when it rains or snows. Also electricians might be the ones as their job is highly risky when the weather is bad. So they might not be able to do their work.`
      }
    ]
  },
  {
    id: 12,
    topic: "Getting Up Early",
    mainQuestion: "Describe an occasion you got up extremely early",
    subQuestions: [
      "When this happened",
      "What you needed to do that day",
      "Who you were with",
      "And how you felt about getting up early that day"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
지난 화요일에 현대자동차 시승 프로모션에 참여하기 위해 일찍 일어났던 경험에 대한 답변입니다. 김포에 살고 있어 서울 용산의 드라이빙 센터까지 대중교통으로 이동하기가 불편했고, 오전 9시까지 도착해야 했기 때문에 아침 6시에 기상해야 했습니다. 퇴직 후 대학원 준비 중이라 평소 9시에 일어나는 습관이었기에 매우 힘들었지만, 이동하면서 점점 잠이 깨고 시승 행사에 대한 기대감이 생겼다고 합니다. 힘들었지만 새로운 경험을 할 수 있어 보람 있었다는 내용입니다.

I'd like to talk about an occasion when I had to get up extremely early, which happened just last Tuesday.

On that day, I had to go to a driving center in Yongsan, Seoul by 9 a.m. to take part in a test-driving promotion held by Hyundai. Since I currently live in Gimpo, getting there isn't very convenient by public transportation, especially during rush hour.

I went there alone because it was an individual event. These days, I'm preparing to apply for graduate school after quitting my job, so I usually wake up quite late, around 9 a.m. However, on that particular day, I had to leave my house at around 7 a.m. to make sure I arrived on time. That meant I needed to get up at around 6 a.m. to get ready, which was quite a big change for me.

To be honest, it was really tough to wake up that early because I wasn't used to it. I felt quite sleepy and a bit reluctant at first. However, once I got on my way, I started to feel more awake, and I was actually quite excited about the event.

Overall, even though getting up early was challenging, it turned out to be a worthwhile experience because I got to try something new and break out of my usual routine.`,
    category: "Part 2 - Getting Up Early",
    part3Questions: [
      {
        id: 1,
        question: "Who usually get up early, young people or old people?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 아마 나이 든 사람들이 더 일찍 일어날 것입니다. 젊은이들은 밤늦게까지 깨어 있어 늦은 아침이나 정오까지 자지만, 노인들은 아침 일찍 일어나 하루를 더 빨리 시작합니다.

Probably old people, I presume. Young people tend to stay up until late night so they usually sleep until late morning, or even midday. But most old people wake up early in the morning and start their day earlier than young ones. I think as people grow older, they have to wake up early in the morning.`
      },
      {
        id: 2,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 확실히 영향을 미칩니다. 밤늦게까지 일하면 다음 날 집중하기 어렵고 더 피곤해져 생산성이 떨어진다고 합니다.

Yes, definitely. Normally when people work until late night, they can't concentrate much and feel more tired on the next day. It wouldn't make them to be productive or work hard like the other days.`
      },
      {
        id: 3,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 그렇다고 생각합니다. 주변의 젊은이들이 컴퓨터 게임이나 스마트폰 때문에 늦게 자며, 중고등학생들도 많은 학습량 때문에 밤늦게까지 깨어 있습니다.

I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study.`
      },
      {
        id: 4,
        question: "Is it easy to get up early for you?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 매일 주말에도 아침 5시에 일어납니다. 일찍 일어나면 그날 더 많은 일을 할 수 있고, 아침에 일하는 것을 선호해서 오래 자지 않습니다.

Yes, I wake up around 5 in the morning every day even in the weekends. When I get up early, I can do more things on that day. And as I prefer to work in the morning, I tend not to sleep long.`
      },
      {
        id: 5,
        question: "What do you do to guarantee a good sleep?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 시끄럽거나 밝을 때 수면 안대를 사용하고, 주변의 모든 것을 끕니다. 보통 3~4시간 정도 비교적 짧게 자며, 잠이 안 올 때는 따뜻한 차나 우유를 마십니다.

I use eye sleeping shades when it's noisy or bright. I turn everything off around me to sleep well. I aim for a good sleep every night, typically for around 3 to 4 hours, as I sleep relatively shorter hours. It's rare for me not to sleep well, but when struggling, I drink warm tea or milk to relax.`
      },
      {
        id: 6,
        question: "Can you sleep well if there is noise around?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 전혀 못 잡니다. 소음에 매우 민감해서 주변에 소음이 있으면 잠을 전혀 못 자며, 정말 피곤하거나 숙면이 필요할 때는 귀마개를 사용합니다.

No, not at all. I am very sensitive at noise and can't sleep at all if there's any noise around. When I'm really tired or need good sleep, I sometimes use earplugs to sleep deeply.`
      }
    ]
  },
  {
    id: 13,
    topic: "Traveling",
    mainQuestion: "Describe a short holiday (vacation) that was special for you",
    subQuestions: [
      "Where you went",
      "Who you went with",
      "What you did",
      "And explain why you think it was special for you"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
가족과 함께 오사카로 3일간 여행을 다녀온 경험입니다. 1년간 계획한 첫 일본 여행으로, 교토도 방문했고 도톤보리에서 쇼핑을 즐겼습니다. 일본어 소통이 어려웠지만 사람들이 친절했고, 백화점에서 잃어버린 스카프를 분실물센터에서 찾은 특별한 경험도 있었습니다.

Last September, I went to Osaka for 3 days with my family. Actually I had planned for this holiday for whole year, so I was really excited before I go there. I looked up on the internet and found some tourist attractions, restaurants, and shopping areas. The minute after I got out from the airplane, I was very surprised because the airport was really crowded although it was out of the season.

For those 3 days, we visited lots of places including Kyoto which is located near to Osaka. Well, to be honest, it wasn't like my expectation but it was still good because everything looked so new to me, and Japanese food was amazing. The best place for me was Dotonbori, which is a famous shopping street in Osaka, and I could buy some souvenirs for my friends there and we spent loads of hours on shopping.

The trip was special for me as it was the first time to visit Japan. I've always dreamed of visiting Japan when I was staying in England as my Japanese friends told me good things about the country. Actually it was hard to communicate because most of Japanese people couldn't speak English, but most of them were really kind. Also it was good to spend time with my family. Since I lived in different country for a long time, it was really difficult to travel with them, and it turned out to be great. And I experienced something special on this trip. I bought a scarf in a department store, and I realised I lost it after a while, then when I revisited the department store and asked one of staffs, they found it somewhere in there then left it in lost property centre. It was really unforgettable experience because I didn't expect to find it, but the staffs were so kind, and I still remember it as a special experience. If I have another chance, I'll definitely revisit Japan.`,
    category: "Part 2 - Traveling",
    part3Questions: [
      {
        id: 1,
        question: "Do people in your country like to travel away from home when they have a holiday?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 사람들은 휴가 때 집이 아닌 다른 곳에서 보내는 경향이 있습니다. 해외여행이 점점 인기를 얻고 있으며, 국내 여행도 여전히 인기 있지만 확실히 집에서 벗어나려 합니다.

It seems like people tend to spend their holiday somewhere else, not their home. In Korea, travelling abroad is getting more and more popular nowadays, and it's still popular to travel around within the country, but definitely away from home.`
      },
      {
        id: 2,
        question: "Do young people generally prefer to spend holidays with their family, or with their friends?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 요즘 젊은 세대는 친구들과 휴가를 보내는 것을 더 선호합니다. 주변에서 같은 관심사를 가진 친구들과 휴가를 보내는 젊은이들을 많이 봤습니다.

Young generations nowadays prefer to go on holidays with their friends more, I believe. From my surroundings, I saw lots of young ones who spend their holidays with friends and they actually like going on a holiday with someone who have the same interests.`
      },
      {
        id: 3,
        question: "Can you think of any advantages in having short holidays?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 짧은 휴가는 복귀 걱정 없이 바쁜 생활에서 잠시 벗어나는 좋은 방법입니다. 짧은 시간이라도 스트레스를 해소할 수 있고, 휴가에 대한 기대가 업무 생산성 향상으로 이어집니다.

It's a good way to chill out from busy life for a while without worrying too much about coming back after the holiday. Mini-breaks make people relaxed even for a short while and they can get rid of their stress. Also people can have some anticipation on their short breaks and it will lead to greater productivity at work.`
      },
      {
        id: 4,
        question: "Which do you prefer, several short holidays or just a few long holidays (vacations) during the year?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 긴 휴가 몇 번을 선호합니다. 짧은 휴가로는 제대로 여행하기 어렵고, 여행할 때 최소 일주일은 머물며 최대한 많이 보려 하기 때문입니다.

I prefer to have a few long holidays as I can't really do or travel in short breaks. I like travelling and whenever I travel, I tend to spend at least a week in a certain destination to see the most, so I'd rather have some long holidays, not short ones.`
      },
      {
        id: 5,
        question: "Can you explain how people benefit from having a holiday from work or study?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 휴가를 통해 쉬고 재충전할 수 있습니다. 또한 동기부여가 되어 더 열심히 일하고 휴가를 위한 단기 목표를 세우게 됩니다.

Well, obviously they can relax for a bit, and make themselves refreshed by having a holiday. Also it can be one of motivations they can have. People could work harder and will probably set short goals in order to have holidays.`
      }
    ]
  },
  {
    id: 14,
    topic: "Traveling",
    mainQuestion: "Describe a long journey you had by car",
    subQuestions: [
      "Where you went",
      "How long it took you",
      "Who you went with",
      "And explain how you felt about this trip."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
친구와 해안 지역으로 짧은 여행을 떠난 경험입니다. 처음에는 순조로웠지만 고속도로에서 사고로 인한 심한 교통 체증에 걸려 2시간 예정이었던 여행이 거의 4시간이 걸렸습니다. 처음에는 좌절감을 느꼈지만 대화하고 음악을 들으며 긍정적으로 보내다 보니 지연에도 불구하고 기억에 남는 경험이 되었다고 합니다.

I'd like to talk about a car journey I took that ended up taking much longer than expected. It happened when I was traveling to another city with a friend for a short trip.

We were heading to a coastal area to relax and enjoy the scenery. At first, everything went smoothly, and we were quite excited about the trip.

However, during the journey, we got stuck in heavy traffic on the highway. There was an accident ahead, which caused a long delay. As a result, what was supposed to be a two-hour trip took nearly four hours.

At first, I felt a bit frustrated, but later we tried to stay positive by chatting and listening to music. In the end, it became a memorable experience despite the delay.`,
    category: "Part 2 - Traveling",
    part3Questions: [
      {
        id: 1,
        question: "How interested are young people in your country in learning to drive?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 많은 젊은이들이 여전히 운전에 관심이 있지만, 예전만큼 필수적이지는 않습니다. 많은 도시에서 대중교통이 꽤 편리하기 때문입니다.

I think many young people are still interested in learning to drive, but it's not as essential as before. This is because public transportation is quite convenient in many cities.`
      },
      {
        id: 2,
        question: "What are the differences between driving in the countryside and driving in the city?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 시골 운전은 교통량이 적고 공기가 맑아 보통 더 편안합니다. 반면 도시 운전은 심한 교통 체증, 소음, 제한된 주차 공간 때문에 스트레스가 될 수 있습니다.

Driving in the countryside is usually more relaxed, with less traffic and cleaner air. In contrast, city driving can be stressful due to heavy traffic, noise, and limited parking spaces.`
      },
      {
        id: 3,
        question: "Do you consider most drivers where you live to be good drivers?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 대부분의 운전자가 꽤 숙련되어 있지만, 특히 출퇴근 시간에 성급한 운전자도 있습니다. 전반적으로 훌륭하다기보다는 평균 수준이라고 할 수 있습니다.

I think most drivers are fairly skilled, but some can be impatient, especially during rush hour. So overall, I would say they are average rather than excellent.`
      },
      {
        id: 4,
        question: "How popular are electric cars in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 전기차가 특히 대도시에서 점점 더 인기를 얻고 있습니다. 주로 환경 문제에 대한 관심과 정부 지원 때문입니다.

Electric cars are becoming increasingly popular, especially in big cities. This is mainly due to environmental concerns and government support.`
      },
      {
        id: 5,
        question: "In what ways could more people be persuaded to buy electric cars?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 가격을 낮추는 것이 가장 효과적인 방법이라고 생각합니다. 또한 충전 인프라를 개선하면 사람들이 전기차 사용에 더 자신감을 가질 수 있을 것입니다.

I think lowering the price would be the most effective way. In addition, improving charging infrastructure would make people feel more confident about using electric vehicles.`
      },
      {
        id: 6,
        question: "Do you think all cars will be electric one day?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 장기적으로 가능하다고 생각하지만 시간이 걸릴 것입니다. 배터리 기술과 인프라 같은 과제가 아직 개선되어야 합니다.

I think it's possible in the long term, but it will take time. There are still some challenges, such as battery technology and infrastructure, that need to be improved.`
      }
    ]
  },
  {
    id: 15,
    topic: "Housing",
    mainQuestion: "Describe a house or apartment you would like to live in.",
    subQuestions: [
      "Where this house or apartment would be",
      "What it would look like",
      "When you would like to live there",
      "And explain why you would like to live in such a place."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
자연이 보존된 시골에 정원이 있는 집에서 살고 싶다는 답변입니다. 오랫동안 도시에서 살아왔기 때문에 도시 생활에 지쳤고, 10년 안에 시골로 이사하고 싶습니다. 정원에서 채소를 기르고 반려동물을 키우는 것이 꿈이라고 설명합니다.

I don't really have clear image of the house I would like to live in, but I want to live in a house in an unspoilt countryside. I don't mind of living in any countries. I've been living in a city for a long time, and don't want to carry on living there. And I had really good experience of living in a countryside when I was a child. My dream house doesn't need to be huge, only thing I want to have is a garden. Of course there will be some rooms, bathroom and kitchen, but I've always dreamed of having a house with a garden so that I can grow some vegetables, raise some pets, and so on. Hopefully, I would like it to happen in next 10 years. I have to work hard to make it happen. I'd like to live in this house because I'm quite tired of living in a city now. Since I graduated my secondary school, I always lived in the heart of city, or suburbs. So city-life is not new to me anymore. I think it's good time to move into countryside in next 10 years. Also I really want to keep a lot of pets. It has been my dream for years, but as I've been living in apartments, it never happened. So if I have a chance, I'll definitely live in a house, possibly in countryside.`,
    category: "Part 2 - Housing",
    part3Questions: [
      {
        id: 1,
        question: "What type of home do most people in your country live in?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 대부분의 한국인은 아파트에 살고 있습니다. 일자리 때문에 도시로 이동하는 사람이 많고 도시의 주거는 대부분 아파트입니다. 시골에서는 보통 주택에 삽니다.

Most Korean live in a flat or an apartment. I think more people move into the cities because of their jobs or works, then most accommodations in cities are apartments. If it's countryside, people normally live in houses.`
      },
      {
        id: 2,
        question: "What do you think are the differences between living in a house, compared to living in an apartment?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 이웃과 시설을 공유하는 것이 큰 차이입니다. 한국의 현대식 아파트에는 헬스장, 공원, 상가가 있어 공유해야 합니다. 아파트에는 경비원이 있지만 주택에는 없습니다. 반려동물 여부도 차이점입니다.

Probably sharing facilities with neighbours would be a major difference. For example, there are gyms, parks, and some shops in modern apartments in Korea, so all the residents have to share all those facilities. But people who live in their own house don't need to worry about such things. In most Korean apartments, there are security guards for residents so they can be ensured with their own safety. But people living in a house can't have such services. Also I'd say keeping a pet would be another difference. Normally, residents are not allowed keep pets in the apartments, but people who live in houses can keep them as many as they like.`
      },
      {
        id: 3,
        question: "Do people in your country prefer to rent their homes, or buy them?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 임대 비용이 비싸지면서 집을 사는 쪽을 선호하는 경향이 있지만, 개인의 상황에 따라 다릅니다.

As the cost of renting becomes more expensive in Korea, it seems like people tend to buy houses rather than renting them. But it actually depends on individual's circumstances.`
      },
      {
        id: 4,
        question: "Should the government take responsibility for providing homes for disadvantaged (poor) people?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 두 가지 답변이 있습니다. (1) 무료로 집을 제공하면 안 되지만, 일자리나 저렴한 임대를 제공할 수 있습니다. (2) 당연히 해야 하며, 의식주는 기본권이므로 특히 빈곤층에게 주거를 제공해야 합니다.

(Answer 1) I think government should not provide homes for poor people for free, I don't mean they have to pay some money for the house, but they need to do something to earn. Maybe government can provide some job opportunities or houses with less expensive rent.\n\n(Answer 2) Of course, they should. It's their responsibility to provide housing to everyone in their nation. People deserve to have their basic rights; eating, clothing, and housing, and especially when it comes to poor people, they definitely need to be provided with a house from the government.`
      },
      {
        id: 5,
        question: "Do people in your country prefer to live in cities, or in rural environment?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국 사람들은 도시에 사는 것을 선호하며, 일자리가 많은 서울 같은 대도시로 젊은이들이 이동합니다. 반면 나이가 들면 조용하고 평화로운 시골에서 여생을 보내려는 경향이 있습니다.

People in Korea seem like they prefer to live in urban areas, apparently there are lack of young people in most of countryside as they move out to work in big cities like Seoul, since there are more job opportunities. On the other hand, people tend to live in rural areas when they get older to spend rest of their lives in calm and peaceful environment.`
      },
      {
        id: 6,
        question: "What are the differences between living in the countryside compared to living in a city?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 시골은 일자리와 상점이 적지만 자연친화적이며 대기오염이 적고 산과 숲 같은 자연이 보존되어 있습니다. 도시는 편리하지만 심각한 공해가 건강에 영향을 줄 수 있습니다.

Maybe in countryside, there are less jobs and less shops. Also most of rural areas are more nature friendly; less air pollution and some unspoilt areas like mountains, dense forests, and so on. Cities are convenient to live in, but severe pollutions occur which can affect people's health.`
      }
    ]
  },
  {
    id: 16,
    topic: "Pollution",
    mainQuestion: "Describe a place you visited that has been affected by pollution",
    subQuestions: [
      "Where it is",
      "When you visited this place",
      "What kinds of pollution you saw there",
      "And explain how this place was affected"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
약 1년 전 친구들과 방문한 태국 방콕의 대기오염에 대한 답변입니다. 활기찬 분위기는 좋았지만, 차량 배기가스로 인한 공기오염이 심각했습니다. 일부 지역에서는 공기가 탁하고 매연 냄새가 났으며, 바쁜 도로를 걸을 때 눈이 불편할 정도였습니다. 건강 문제를 유발할 수 있는 심각한 문제라고 설명합니다.

I'd like to talk about Bangkok, the capital city of Thailand, which I visited about a year ago.

I went there for a short trip with my friends, mainly to enjoy the food and explore the city. While I really liked the vibrant atmosphere, one thing that stood out to me was the level of air pollution, especially from traffic.

Bangkok is well known for its heavy traffic, and I noticed a large amount of exhaust fumes from cars, buses, and motorcycles. In some areas, the air felt quite thick, and there was a noticeable smell of smoke. At times, it even made my eyes slightly uncomfortable, particularly when I was walking along busy roads.

This kind of pollution clearly affects the quality of life in the city. For example, it can cause health problems such as breathing difficulties, especially for people who live or work there long-term. In addition, it makes the environment less pleasant for both residents and tourists.

Overall, although Bangkok is an exciting and lively city, I believe that air pollution is a serious issue that needs to be addressed in order to improve people's well-being.`,
    category: "Part 2 - Pollution",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of pollution are serious in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 소음 공해와 대기 오염이 가장 심각합니다. 이웃, 차, 반려동물 등에 의한 소음 공해와 특히 서울의 미세먼지, 봄철 중국 사막에서 오는 황사가 심각한 문제입니다.

Well, definitely noise pollution and air pollution are the most serious ones. Those are getting more and more severe nowadays, especially in major cities. People are getting more stressed by noise pollution caused by lots of different sources like neighbours, cars, and pets and so on, and also air pollution is so bad particularly in Seoul. There are tons of micro dusts in the atmosphere, and in spring, people suffer from yellow dusts which come from Chinese desert.`
      },
      {
        id: 2,
        question: "What can individuals do to protect our environment?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 대기 오염을 줄이기 위해 자가용 대신 대중교통을 이용하고, 에너지 절약을 위해 외출 시 전기를 끄는 등 작은 것부터 시작할 수 있습니다. 환경 캠페인 참여도 도움이 됩니다.

I'm sure individuals can start with small things like taking public transports instead of their own cars to reduce air pollution, and use their cars when really necessary. And turning off electricity when people leave their houses or workplaces in order to save energy. Also participating in environmental campaigns would be helpful as those ones involve picking litters in public places and other activities related to the environment.`
      },
      {
        id: 3,
        question: "Do you think individuals should be responsible for pollutions?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 당연히 그렇다고 생각합니다. 환경을 지키는 것은 우리의 의무이며, 에너지 절약이나 환경 보호 방법에 더 많은 관심을 기울이고 행동을 시작해야 합니다.

Of course, definitely. This is our duty to save the environment in order to survive. People should pay more attention on the methods which helps saving energy or the environment. It's not a big deal to think about the method. People should start taking some actions in order to tackle the pollution.`
      },
      {
        id: 4,
        question: "Why is there a need to involve government in environmental protection?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 개인의 환경 보호 노력에는 한계가 있기 때문입니다. 정부는 더 큰 규모로 활동하여 더 많은 사람들을 참여시킬 수 있으며, 대중교통 이용 의무화 같은 강제적 환경 캠페인을 시작할 수 있습니다.

It's because there is a limitation for individuals when they try to do something to save the environment. I believe the government can do things in larger scale so more people can be involved. The government can promote and start some compulsory environmental campaigns such as making people to take the public transports to go to work compulsively so that they can participate in saving the Earth eventually.`
      }
    ]
  },
  {
    id: 17,
    topic: "Water",
    mainQuestion: "Describe a place with a lot of water (such as a river, a lake or the ocean) that you enjoyed visiting.",
    subQuestions: [
      "Where this place was",
      "What people were doing at this place",
      "Why you went there",
      "And explain why you liked this place."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
영국 이스트 서섹스의 헤이스팅스를 방문한 경험입니다. 대학 졸업 프로젝트를 마치고 지도에서 무작위로 골라 여행했습니다. 그리스처럼 보이는 곳도 있었고, 브라이턴과 달리 바다가 맑고 푸르러 놀라웠습니다. 아름다운 풍경 덕에 스트레스를 해소할 수 있었다고 합니다.

A place came up on my mind is Hastings, in England. It's a city located in East Sussex, and when I visited there, I was travelling Sussex area such as Rye, Dover, and ended up my trip in Hastings.

When I visited there, it was around May or June. So the weather was quite hot and sunny. I was walking alongside of the sea, and saw lots of people swimming, riding skateboards, sitting at the beach, and drinking beer.

After I finished my final project at University, I wanted to travel but didn't know where to go. So I unfolded map of England, and randomly picked East Sussex area to travel. I wanted to go somewhere quiet at that time, and the sea was another reason which made me want to go.

Actually, Hastings was very interesting place. I didn't expect anything but some of the areas looked like Greece, and some looked like British countryside. It was busy at some areas, but most places were very quiet. First thing I liked about Hastings was the blue sea. Before Hastings, I visited Brighton but the water was actually brown, but the sea in Hastings was so clear, blue, and it was shining. It was amazing to see such place in England. Also I could relax a lot with fantastic scenery. I was quite fed up with all my works, but by staying in Hastings, I could relieve all my stress. I walked a lot, went into the sea, saw lots of lively people, and lovely views of city. If I have another chance, I would definitely revisit this place.`,
    category: "Part 2 - Water",
    part3Questions: [
      {
        id: 1,
        question: "Are holidays to places with lots of water very popular in your country?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 물이 있는 곳으로의 휴가가 매우 인기 있습니다. 특히 여름에 모든 해변과 강변이 인기 있는 휴가지입니다.

Yes, a lot of people tend to go somewhere there is lots of water. In Korea, especially in summer, all beaches or riverside are very popular holiday destinations.`
      },
      {
        id: 2,
        question: "What activities do (or can) people do on (or, in) the water?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 대부분 수영을 하고, 웨이크보드, 수상스키, 스쿠버 다이빙 같은 수상 스포츠도 즐깁니다. 바다에 가면 낚시를 즐기는 사람도 있습니다.

Most people go swimming, and also enjoy water sports such as wakeboarding, water-skiing, scuba diving, and so on. Some people also enjoy fishing if they go to the ocean.`
      },
      {
        id: 3,
        question: "Can you explain why people enjoy spending leisure time at a beach or river?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 일상에서 해변이나 강 같은 곳을 보기 어렵기 때문이라고 생각합니다. 바쁜 일상으로 쉴 시간이 부족하고, 수상 스포츠를 특히 즐기는 사람들도 물이 많은 곳을 찾습니다.

I personally think it's because we don't see such places like beach or river in our daily life. Well, we see the river which flows in the city, but because of heavy workload or busy daily routine, people don't really have much time to go and relax. Also some people particularly enjoy water sports so they want to go somewhere there's lots of water.`
      },
      {
        id: 4,
        question: "In what ways do people use water?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 주로 샤워, 빨래, 음용 등 일상에서 사용합니다. 수력 발전, 댐 건설에도 사용되며, 어부처럼 물 관련 사업으로 생계를 꾸리는 사람도 있습니다.

Mostly on daily life, like taking shower, washing their laundry, and of course, drinking. Also water is used by waterpower generation, building dams, or maybe some people live on businesses related to water like fishermen.`
      },
      {
        id: 5,
        question: "Do you think the way people in your country today use water has changed, compared to the past?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 크게 변하지 않았다고 생각합니다. 과거에는 물 근처에 살며 직접 사용했지만, 주거 지역이 발전하면서 현재는 수돗물을 다양한 용도로 사용하는 것이 유일한 차이입니다.

Not much really. I think people in the past lived near water so they used it directly but only difference is as residential areas has developed, people at present use the tap water for their various needs.`
      },
      {
        id: 6,
        question: "In your opinion, should the personal use of water be controlled?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 어느 정도는 그렇다고 생각합니다. 현대 사회에서 수도꼭지를 열어놓는 등 물을 많이 낭비하며, 물 부족으로 고통받는 나라가 많아 물 사용을 통제할 필요가 있습니다.

In some ways, yes. People in modern society waste a lot of water by letting the tap opened. There are lots of countries where suffer from water shortage. So in order to prevent water shortage, people need to take some actions or the government should control the use of water.`
      }
    ]
  },
  {
    id: 18,
    topic: "Clothes",
    mainQuestion: "Describe an item of clothing that someone gave you",
    subQuestions: [
      "What the clothing was",
      "Who gave it to you",
      "When it was given to you",
      "And explain why this person gave you this clothing."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
어머니가 생일에 선물해주신 네이��색 가디건에 대한 답변입니다. 환절기에 입을 옷이 부족했는데 어머니가 백화점에서 사다 주셨습니다. 꼭 필요했던 옷이라 ���뻤고, 어머니의 관심과 사랑을 느낄 수 있었다고 합니다. 지금도 자주 입으며, 입을 때마다 어머니가 생각���다고 합니다.

I'd like to talk about a cardigan that my mother gave me. I think it was my last birthday. She bought it from a department store. Actually, I didn't expect to receive any presents from my parents at that time, but she surprisingly gave me a small paper bag. When I opened it, there was a navy-colored cardigan.

It was a very basic but lovely cardigan. As I didn't have many clothes which are suitable for the change of seasons, she bought me one. At that time, I had many shirts or t-shirts but didn't have any clothes to wear on top of them. I was very happy when I received it, not only because it was exactly what I needed, but also because I could feel how much my mother cares about me.

Since then, I've been wearing it very often. It's very easy to match with any other clothes, and it's also very comfortable. Whenever I wear it, I think of my mother and I feel very warm and happy. I think it's one of the best presents I've ever received.`,
    category: "Part 2 - Clothes",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of clothes do people in your country like to wear?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 연령대에 따라 다릅니다. 젊은이들은 트렌디하고 스타일리시한 옷을 좋아하고, 나이 든 사람들은 편안하고 실용적인 옷을 선호합니다. 전반적으로 청바지와 티셔츠 같은 캐주얼 의류가 모든 연령대에서 인기 있습니다.

It depends on the age groups. Generally, young people in Korea like to wear trendy and stylish clothes. They are very sensitive to fashion. On the other hand, older people prefer comfortable and practical clothes. But overall, casual clothes like jeans and t-shirts are popular among all ages.`
      },
      {
        id: 2,
        question: "Does the climate affect the clothes people wear?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 확실히 영향을 줍니다. 한국은 사계절이 뚜렷해서 옷차림이 바뀝니다. 여름에는 가볍고 얇은 옷, 겨울에는 두꺼운 코트, 패딩, 목도리를 입습니다.

Definitely. Korea has four distinct seasons, so people's clothing changes accordingly. In summer, people wear light and thin clothes to stay cool. In winter, they wear thick coats, padded jackets, and mufflers to protect themselves from the cold.`
      },
      {
        id: 3,
        question: "Do you think that the clothes people wear can reflect their personality?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 옷이 성격을 반영할 수 있다고 생각합니다. 밝고 화려한 옷을 입는 사람은 외향적이고 활발할 수 있고, 심플하고 어두운 색 옷을 선호하는 사람은 차분하고 내성적일 수 있습니다.

Yes, I think so. For example, people who wear bright and colorful clothes might be outgoing and energetic. On the contrary, people who prefer simple and dark-colored clothes might be more calm and reserved. So, I believe that clothing can be a way of expressing oneself.`
      }
    ]
  },
  {
    id: 19,
    topic: "Patience",
    mainQuestion: "Describe a time when you were patient",
    subQuestions: [
      "When it was",
      "Where it was",
      "What you were waiting for",
      "And explain why you had to be patient."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
서울의 유명 이탈리안 레스토랑에서 오래 기다린 경험입니다. 친구들과 주말에 갔는데 대기 시간이 최소 1시간이었습니다. 다른 곳으로 갈까 고민했지만 시그니처 파스타를 먹고 싶어 기다렸고, 결국 1시간 반 후 자리에 앉았습니다. 음식이 정말 맛있어서 인내심의 보람을 느꼈다고 합니다.

I'd like to talk about a time when I had to wait for a long time at a famous restaurant. It was last year, during the weekend. I went to a well-known Italian restaurant in Seoul with my friends. We had heard that the food there was amazing, so we decided to give it a try.

When we arrived, there was a huge queue of people waiting outside. We were told that the waiting time would be at least an hour. At first, we were a bit frustrated and considered going to another place. However, we really wanted to try their signature pasta, so we decided to wait.

While waiting, we talked about various topics and time went by. It actually took about an hour and a half to finally get a table. Although it was a long wait, I tried to be patient because I knew it would be worth it. Eventually, when we tasted the food, it was indeed delicious, and we were all satisfied. That experience taught me that sometimes being patient can lead to a great reward.`,
    category: "Part 2 - Patience",
    part3Questions: [
      {
        id: 1,
        question: "What do you think \"patience\" is?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 인내심은 문제를 다루거나 무언가를 기다릴 때 차분하게 화내지 않는 능력이라고 생각합니다. 더 나은 결정을 내리고 좋은 관계를 유지하는 데 도움이 되는 중요한 자질입니다.

In my opinion, patience is the ability to stay calm and not get angry or upset when dealing with problems or waiting for something. It's an important quality to have in our daily lives, as it helps us to make better decisions and maintain good relationships with others.`
      },
      {
        id: 2,
        question: "Do you think people are less patient now than they were in the past?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 그렇다고 생각합니다. 기술 발전으로 모든 것이 빨라졌고, 인터넷으로 정보를 즉시 얻고 클릭 몇 번으로 주문할 수 있습니다. 결과적으로 즉시 원하는 것을 얻는 데 익숙해져 시간이 걸리면 쉽게 인내심을 잃습니다.

Yes, I think so. With the development of technology, everything has become much faster. We can get information instantly through the internet, and we can order things with just a few clicks. As a result, people have become used to getting what they want immediately, and they tend to lose patience more easily when things take time.`
      }
    ]
  },
  {
    id: 20,
    topic: "Health & Advertisements",
    mainQuestion: "Describe a health-related advertisement you remember",
    subQuestions: [
      "What it was about",
      "Where you saw it",
      "Who it was for",
      "And explain why you remember it."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
지하철역 빌보드에서 본 피부과 광고에 대한 답변입니다. 출퇴근 중 눈에 띄었으며, 매우 아름다운 여성이지만 피부 트러블이 있는 모델을 사용한 것이 인상적이었습니다. 완벽한 모델 대신 피부 고민에 공감하게 만든 후 해결책을 제시하는 영리한 마케팅이었다고 설명합니다.

I’d like to talk about a health-related advertisement that I saw recently, which was for a <strong>dermatology clinic</strong>.

I first came across this ad on a <strong>billboard in a subway station</strong> while I was commuting to work. Since the station is usually crowded and people are often in a rush, it’s quite rare for an advertisement to truly grab someone’s attention, but this one definitely did.

The advertisement was primarily targeting <strong>adult women</strong> who are interested in skincare and aesthetic treatments. It featured a strikingly beautiful woman, but as I looked closer, I noticed she had quite <strong>troubled skin</strong> with some visible blemishes.

The reason this ad stuck in my mind is because of its clever <strong>visual impact</strong>. At first, I thought to myself, ‘She would be absolutely perfect if she just had clearer skin.’ As I read the fine print, I realized it was a clever promotion for a local dermatology clinic. The contrast between her features and her skin condition was so sharp that it made the message very persuasive.

Even now, I can still clearly remember the name of the clinic, which proves how effective the marketing was. I think it was a <strong>brilliantly designed ad</strong> because it didn’t just show a flawless model; instead, it made me sympathize with the ‘skin concerns’ and then offered a solution.`,
    category: "Part 2 - Health & Advertisements",
    part3Questions: [
      {
        id: 1,
        question: "How can people improve their health?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 건강을 개선하는 여러 방법이 있습니다. 규칙적인 운동이 필수적이고, 과일·채소·단백질을 많이 먹는 균형 잡힌 식단이 중요하며, 충분한 수면과 스트레스 관리도 매우 중요합니다.

There are several ways to improve health. First and foremost, regular exercise is essential. People should try to engage in some form of physical activity, like walking, running, or swimming. Secondly, a balanced diet is crucial. Eating plenty of fruits, vegetables, and proteins while avoiding junk food can make a big difference. Lastly, getting enough sleep and managing stress are also very important for overall well-being.`
      },
      {
        id: 2,
        question: "Do you think the government should be responsible for people's health?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 정부가 공중 보건 증진에 역할을 해야 한다고 생각합니다. 공공 체육시설 제공, 건강 인식 캠페인, 식품 안전 규제 등을 할 수 있습니다. 하지만 궁극적으로 개인이 자신의 생활 방식과 건강에 책임이 있습니다.

I think the government should play a role in promoting public health. For example, they can provide public sports facilities, run health awareness campaigns, and regulate the food industry to ensure food safety. However, ultimately, individuals are responsible for their own lifestyle choices and health.`
      },
      {
        id: 3,
        question: "What are the different types of advertising?",
        sampleAnswer: `<strong>[한국어 개요]</strong> TV 광고, 라디오 광고, 빌보드, 신문·잡지 광고 등 다양한 유형이 있습니다. 요즘에는 소셜 미디어와 웹사이트의 온라인 광고가 매우 인기 있고 영향력이 큽니다.

There are many types of advertising, such as television commercials, radio ads, billboards, and advertisements in newspapers or magazines. Nowadays, online advertising on social media and websites has become extremely popular and influential.`
      },
      {
        id: 4,
        question: "Do you think there are too many advertisements in our daily lives?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 절대적으로 그렇습니다. 거리, TV, 특히 인터넷에서 어디를 가나 광고에 둘러싸여 있으며, 때로는 하던 일을 방해해 상당히 압도적이고 짜증날 수 있습니다.

Yes, absolutely. We are bombarded with advertisements everywhere we go—on the streets, on TV, and especially on the internet. Sometimes it can be quite overwhelming and annoying, as they interrupt what we are doing.`
      },
      {
        id: 5,
        question: "How do advertisements influence people's consumption habits?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 광고는 제품이나 서비스를 구매하도록 설득하기 위해 설계됩니다. 매력적인 이미지나 유명인을 사용해 브랜드의 긍정적 이미지를 만들며, 결과적으로 필요하지 않은 것도 광고를 보고 사고 싶어지게 됩니다.

Advertisements are designed to persuade people to buy products or services. They often use attractive images or famous celebrities to create a positive image of a brand. As a result, people may feel a desire to buy things they don't necessarily need, simply because they saw them in an ad.`
      }
    ]
  },
  {
    id: 21,
    topic: "Gifts",
    mainQuestion: "Describe a gift that you gave to someone",
    subQuestions: [
      "What the gift was",
      "Who you gave it to",
      "Why you chose that gift",
      "And explain how you felt about giving it."
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
친한 친구에게 아기 옷을 선물한 경험입니다. 친구가 아기를 낳아서 출산 축하 겸 실용적인 선물로 부드러운 면 바디수트와 귀여운 잠옷 세트를 골랐습니다. 신생아에게 편안하도록 부드럽고 통기성 좋은 원단을 선택했으며, 처음으로 신생아 선물을 사본 특별한 경험이었다고 합니다.

I'd like to talk about a gift I gave to a close friend of mine last year.

He had just had a baby, so I decided to buy some baby clothes for his newborn. I chose a few small outfits, including a soft cotton onesie and a cute set of pajamas.

I gave it to him because I wanted to celebrate the birth of his baby and also give him something practical. I thought baby clothes would be really useful since newborns grow quickly and need to be changed often.

I also made sure to choose clothes made from soft and breathable fabric so that they would be comfortable for the baby.

To be honest, I felt really happy and excited when I gave him the gift. It was a special experience for me because it was my first time buying a gift for a newborn. Seeing his reaction made me feel that my gift was meaningful, and it also made me feel closer to him.`,
    category: "Part 2 - Gifts",
    part3Questions: []
  },
  {
    id: 22,
    topic: "Rules & Law",
    mainQuestion: "Describe a law in your country that you think is good",
    subQuestions: [
      "What the law is",
      "How you first learned about it",
      "Who it affects",
      "And explain why you think it is good"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
한국의 '민식이법'에 대한 답변입니다. 어린이가 스쿨존에서 음주운전 차량에 사망한 사건 이후 제정된 법으로, 스쿨존에서 시속 30km 이하로 감속해야 하며 중대 사고 시 엄격한 처벌이 부과됩니다. 어린이를 보호하고 도로 안전 인식을 높이는 데 기여한 좋은 법이라고 설명합니다.

I'd like to talk about a law in Korea known as the "Min-sik Law."

This law was introduced by Korean lawmakers a few years ago. It was created after a tragic accident in which a child was killed by a drunk driver near a school, which caused nationwide anger.

The law requires drivers to slow down to under 30 kilometers per hour in school zones, and it imposes strict punishment if a serious accident occurs.

I think this law is a very good idea because it helps protect children in areas where they are most vulnerable. Also, it made people more aware of road safety, especially around schools. As a result, I believe it has contributed to reducing traffic accidents involving children.`,
    category: "Part 2 - Rules & Law",
    part3Questions: []
  },
  {
    id: 23,
    topic: "Beautiful Views",
    mainQuestion: "Describe a place you visited that had beautiful views",
    subQuestions: [
      "Where this place was",
      "When you visited it",
      "What you saw there",
      "And explain why you liked the views"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
서울 남산타워에 대한 답변입니다. 몇 년 전 친구와 함께 바쁜 일상에서 벗어나기 위해 저녁에 방문했습니다. 꼭대기에서 한강과 수많은 건물을 포함한 도시 전체를 볼 수 있었고, 야경이 특히 인상적이었습니다. 도시의 현대적이고 역동적인 면을 한눈에 볼 수 있어 특별하고 기억에 남는 경험이었다고 합니다.

I'd like to talk about a place I visited that has beautiful views, which is Namsan Tower in Seoul. It's located in the center of the city and is well known for its panoramic view.

I visited it a couple of years ago with a friend when we wanted to take a break from our busy routines. We decided to go there in the evening to enjoy the night view.

From the top, you can see the entire city, including the Han River and countless buildings. At night, the city lights make the view even more impressive and vibrant.

I think the view is so beautiful because it shows both the modern and dynamic side of the city at once. Also, being able to see everything from such a high place makes it feel quite special and memorable.`,
    category: "Part 2 - Beautiful Views",
    part3Questions: [
      {
        id: 1,
        question: "Do you agree that most beauty products are a waste of money?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 완전히 동의하지는 않습니다. 일부 제품은 불필요할 수 있지만, 많은 사람들이 자신감과 외모를 개선하기 위해 사용합니다. 예를 들어 스킨케어 제품은 피부에 대한 편안함을 줄 수 있어 돈의 가치가 있을 수 있습니다.

I don't completely agree. While some products may be unnecessary, many people use them to improve their confidence and appearance. For example, skincare products can help people feel more comfortable with their skin, so I think they can be worth the money depending on the person.`
      },
      {
        id: 2,
        question: "How does the beauty industry advertise its products so successfully?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 뷰티 산업은 소셜 미디어와 인플루언서를 통해 매우 효과적으로 광고합니다. 사람들은 특히 실제 결과를 보여주는 인플루언서의 추천을 신뢰하는 경향이 있으며, 매력적인 포장과 감성적 마케팅도 소비자의 관심을 끄는 데 큰 역할을 합니다.

The beauty industry is very effective at advertising, mainly through social media and influencers. People tend to trust recommendations from influencers, especially when they show real results. In addition, attractive packaging and emotional marketing also play a big role in catching people's attention.`
      },
      {
        id: 3,
        question: "What do you think of the view that beauty products should not be advertised to children?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 부분적으로 동의합니다. 어린이는 쉽게 영향을 받기 때문에 뷰티 제품 광고가 비현실적인 외모 기준을 만들 수 있습니다. 다만 스킨케어 같은 기본 제품은 책임감 있게 홍보된다면 괜찮을 수 있다고 생각합니다.

I partly agree with that view. Children are easily influenced, so advertising beauty products to them may create unrealistic standards of appearance. However, basic products like skincare could still be acceptable if they are promoted responsibly.`
      },
      {
        id: 4,
        question: "Why do many people equate youth with beauty?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 주로 미디어의 영향 때문이라고 생각합니다. 광고와 소셜 미디어가 종종 젊고 완벽한 외모에 초점을 맞추어 사람들이 젊음을 아름다움과 연결시키게 됩니다. 시간이 지나면서 이 관념이 사회에 널리 받아들여지게 되었습니다.

I think this is mainly due to media influence. Advertisements and social media often focus on young and flawless appearances, which leads people to associate youth with beauty. Over time, this idea becomes widely accepted in society.`
      },
      {
        id: 5,
        question: "Do you think that being beautiful could affect a person's success in life?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 어느 정도는 그렇습니다. 미디어나 영업 같은 특정 분야에서는 외모가 첫인상과 기회에 영향을 줄 수 있습니다. 하지만 장기적으로는 능력과 경험이 성공에 훨씬 더 중요합니다.

Yes, to some extent. In certain fields, such as media or sales, appearance can influence first impressions and opportunities. However, in the long term, skills and experience are much more important for achieving success.`
      },
      {
        id: 6,
        question: "Why might society's ideas about beauty change over time?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 문화적 변화와 사회적 영향 때문에 미의 기준이 변합니다. 예를 들어 소셜 미디어가 더 다양한 미의 기준을 소개했고, 사람들이 다양한 외모에 더 개방적이 되었습니다. 그 결과 아름다움의 정의가 계속 진화하고 있습니다.

Beauty standards change because of cultural shifts and social influences. For example, social media has introduced more diverse beauty standards, and people are becoming more open to different appearances. As a result, the definition of beauty continues to evolve.`
      }
    ]
  },
  {
    id: 24,
    topic: "Awards & Prizes",
    mainQuestion: "Describe a person in your country who has received an award or a prize",
    subQuestions: [
      "Who this person is",
      "What award or prize they received",
      "How they achieved this",
      "And explain why you admire them"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
손흥민 선수에 대한 답변입니다. 프리미어리그 득점왕(골든부트)을 수상한 것이 가장 주목할 만한 업적이며, 페널티킥 없이 공동 수상했다는 점이 더욱 인상적입니다. 뛰어난 실력뿐 아니라 강한 직업 윤리와 겸손한 성격을 존경하며, 한국 젊은이들에게 훌륭한 롤모델이라고 설명합니다.

I'd like to talk about Son Heung-min, who is one of the most well-known athletes in my country.

He has received numerous awards throughout his career, but one of the most significant ones is the Premier League Golden Boot, which is awarded to the top goal scorer in the league.

He earned this award by maintaining an exceptionally high level of performance and scoring a remarkable number of goals over the course of the season. What makes this achievement even more impressive is that he managed to share the award without taking any penalty kicks, which highlights his outstanding ability as a player.

I really admire him not only for his talent but also for his strong work ethic and humble personality. He has become a great role model, particularly for young people in Korea.`,
    category: "Part 2 - Awards & Prizes",
    part3Questions: [
      {
        id: 1,
        question: "What types of school prizes do children in your country receive?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 한국에서 학생들은 보통 높은 성적 같은 학업 성취로 상을 받습니다. 또한 좋은 행동, 개근, 스포츠나 예술 분야의 성과에 대한 상도 있습니다.

In Korea, students are typically rewarded for academic achievement, such as high grades. In addition, there are awards for good behavior, perfect attendance, and accomplishments in sports or the arts.`
      },
      {
        id: 2,
        question: "What are the advantages of rewarding schoolchildren?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 학생들에게 보상하는 것은 학업적으로 더 잘하고 적절하게 행동하도록 하는 강한 동기부여가 됩니다. 또한 자신감을 높이고 성취감을 줍니다.

Rewarding students can serve as a strong motivation for them to perform better academically and behave appropriately. It also boosts their confidence and gives them a sense of accomplishment.`
      },
      {
        id: 3,
        question: "Is it more important to receive rewards from parents than teachers?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 둘 다 중요한 역할을 하지만, 부모의 보상이 더 강한 감정적 영향을 줄 수 있습니다. 반면 교사의 인정은 더 객관적으로 느껴지며 학업적 맥락에서 특히 격려가 됩니다.

I think both play important roles, but rewards from parents may have a stronger emotional impact. On the other hand, recognition from teachers can feel more objective and can be particularly encouraging in an academic context.`
      },
      {
        id: 4,
        question: "Do you think some sportspeople are paid too much money?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 일부 경우에 그렇다고 생각합니다. 교육이나 의료 같은 필수 직업과 비교하면 과도하게 받는 경우가 있지만, 그들이 만들어내는 큰 수익과 관심을 고려하면 높은 급여가 정당화되기도 합니다.

Yes, in some cases, I believe they are paid excessively, especially when compared to essential professions like teaching or healthcare. However, their high salaries are often justified by the large amount of revenue and attention they generate.`
      },
      {
        id: 5,
        question: "Should everyone on a team get the same prize money?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 상황에 따라 다르다고 생각합니다. 동일한 보상은 공정성과 팀워크를 촉진하지만, 개인 기여도가 다르므로 성과 기반 보상도 정당화될 수 있습니다.

I think it depends on the situation. On the one hand, equal rewards can promote a sense of fairness and teamwork. On the other hand, individual contributions can vary, so performance-based rewards may also be justified.`
      },
      {
        id: 6,
        question: "Is taking part more important than winning?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 이 의견에 부분적으로 동의합니다. 참여는 경험을 쌓고 실력을 향상시킬 수 있어 중요하지만, 우승도 강력한 동기부여와 성공의 명확한 지표가 될 수 있습니다.

I partially agree with this view. Taking part is important because it allows people to gain experience and improve their skills. However, winning can also be a powerful source of motivation and a clear indicator of success.`
      }
    ]
  },
  {
    id: 25,
    topic: "Well-paid Occupation",
    mainQuestion: "Talk about an occupation someone you know has that is well-paid",
    subQuestions: [
      "What the occupation is",
      "Who you know that has this occupation",
      "What this person does in their job",
      "And explain why you think this occupation is well-paid"
    ],
    sampleAnswer: `<strong>[한국어 개요]</strong>
아마존에서 소프트웨어 엔지니어로 일하는 친구에 대한 답변입니다. 연봉이 높고 스톡 옵션과 보너스 등 추가 혜택도 받습니다. IT 산업이 급성장하고 숙련된 개발자 수요가 높아 높은 급여가 정당화된다고 설명합니다.

I'd like to talk about a close friend of mine who works as a software engineer at Amazon.

His occupation involves developing and maintaining software systems that millions of people use every day. Specifically, he works on backend services that handle data processing and ensure that everything runs smoothly on the platform. He also collaborates with other teams to design new features and improve existing ones.

The reason I think this occupation is well-paid is mainly because of the high demand for skilled developers in the tech industry. Companies like Amazon are willing to offer very competitive salaries, stock options, and bonuses to attract and retain top talent. My friend earns a significantly higher salary compared to most other professions, and he also receives additional benefits such as annual stock grants and performance-based bonuses.

I believe this is justified because the tech industry is growing rapidly, and the work software engineers do directly impacts the company's revenue and user experience. It requires a high level of expertise and continuous learning, which makes it a challenging but rewarding career.`,
    category: "Part 2 - Well-paid Occupation",
    part3Questions: [
      {
        id: 1,
        question: "What are some of the benefits of working in a team rather than independently?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 팀으로 일하면 다양한 관점과 아이디어를 공유할 수 있고, 업무를 분담하여 효율성을 높일 수 있습니다. 또한 서로의 강점을 보완하고 동기부여를 받을 수 있다는 장점이 있습니다.

There are several significant benefits of working in a team. First and foremost, team members can share diverse perspectives and ideas, which often leads to more creative and well-rounded solutions. When people with different backgrounds and expertise collaborate, they can approach problems from multiple angles that an individual might not consider on their own.

Additionally, working in a team allows for a division of labor, which can greatly improve efficiency. Each member can focus on their strengths, and tasks can be completed more quickly. There's also the benefit of mutual support and motivation — when one person is struggling, others can step in to help, and the collective energy of a team can drive everyone to perform better.

Furthermore, teamwork helps develop important interpersonal skills such as communication, compromise, and leadership, which are valuable in any professional setting.`
      },
      {
        id: 2,
        question: "What are the advantages and disadvantages of being self-employed?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 자영업의 장점은 유연한 근무 시간, 자유로운 의사결정, 높은 수입 가능성입니다. 단점으로는 불안정한 수입, 혜택 부재, 업무와 개인 생활의 경계가 모호해질 수 있다는 점이 있습니다.

Being self-employed comes with both notable advantages and disadvantages. On the positive side, one of the biggest benefits is the flexibility it offers. Self-employed individuals can set their own schedules, choose the projects they want to work on, and make decisions independently without having to go through layers of management. There's also the potential for higher earnings, as they directly benefit from the success of their work.

However, there are significant drawbacks as well. The most obvious one is the lack of financial stability — income can be unpredictable, especially in the early stages, and there are no guaranteed benefits like health insurance or paid leave. Self-employed people also bear all the responsibility for their business, which can be incredibly stressful. Additionally, the line between work and personal life can become blurred, as many self-employed individuals find it difficult to switch off from work.

Overall, I think whether self-employment is suitable depends largely on a person's personality, risk tolerance, and the nature of their work.`
      },
      {
        id: 3,
        question: "What methods do organizations use to improve teamwork among their employees?",
        sampleAnswer: `<strong>[한국어 개요]</strong> 조직은 팀 빌딩 활동, 워크숍, 명확한 역할 분담, 열린 소통 문화 조성 등 다양한 방법으로 팀워크를 향상시킵니다. 최근에는 협업 도구와 기술을 활용하는 것도 일반적입니다.

Organizations use a variety of methods to improve teamwork among their employees. One of the most common approaches is organizing team-building activities, such as workshops, retreats, or social events. These activities are designed to help employees get to know each other better, build trust, and develop stronger interpersonal relationships outside of the usual work environment.

Another effective method is establishing clear roles and responsibilities within teams. When everyone understands their specific duties and how they contribute to the overall goal, it reduces confusion and potential conflicts, making collaboration smoother and more productive.

Many organizations also promote an open communication culture by encouraging regular meetings, feedback sessions, and the use of collaborative tools like Slack or Microsoft Teams. This ensures that information flows freely and that team members can easily coordinate their efforts.

Additionally, some companies invest in professional development programs that focus specifically on collaboration and communication skills. By training employees to work more effectively with others, organizations can create a more cohesive and productive workforce.`
      }
    ]
  }
];

const randomSpeakingPool: RandomSpeakingQuestion[] = [
  ...sampleQuestions.map((question) => ({
    kind: 'ielts-part1' as const,
    question: question.question,
    category: question.category,
    sampleAnswer: question.sampleAnswer
  })),
  ...part2Questions.map((question) => ({
    kind: 'ielts-part2' as const,
    topic: question.topic,
    mainQuestion: question.mainQuestion,
    subQuestions: question.subQuestions,
    category: question.category,
    sampleAnswer: question.sampleAnswer,
    part3Questions: question.part3Questions
  })),
  ...part2Questions.flatMap((question) =>
    question.part3Questions.map((part3Question) => ({
      kind: 'ielts-part3' as const,
      question: part3Question.question,
      category: question.category.startsWith('Part 2 - ')
        ? question.category.replace('Part 2 - ', 'Part 3 - ')
        : question.category,
      sampleAnswer: part3Question.sampleAnswer
    }))
  ),
  ...Array.from({ length: 11 }, (_, index) => ({
    kind: 'tef' as const,
    section: 'A' as const,
    questionNumber: index + 1,
    imagePath: `/Section A - Question ${index + 1}.png`,
    sampleAnswer: tefSampleAnswers.sectionA?.[index + 1] || ''
  })),
  ...Array.from({ length: 30 }, (_, index) => ({
    kind: 'tef' as const,
    section: 'B' as const,
    questionNumber: index + 1,
    imagePath: `/Section B - Question ${index + 1}.png`,
    sampleAnswer: tefSampleAnswers.sectionB?.[index + 1] || ''
  }))
];

const randomWritingPool: RandomWritingQuestion[] = [
  ...ieltsTask1Topics.map((topic) => ({
    kind: 'ielts-task1' as const,
    title: topic.title,
    guidanceForScreen: topic.guidanceForScreen,
    imagePaths: topic.imagePaths,
    sampleAnswer: topic.sampleAnswer || ''
  })),
  ...ieltsTask2Prompts.map((prompt) => ({
    kind: 'ielts-task2' as const,
    prompt: prompt.prompt,
    sampleAnswer: ieltsSampleAnswers[`task2-${prompt.id}`] || ''
  })),
  ...lettersTopics.map((prompt, index) => ({
    kind: 'tef-letters' as const,
    prompt,
    sampleAnswer: lettersSampleAnswers[index + 1] || ''
  })),
  ...faitDiverTopics.map((prompt, index) => ({
    kind: 'tef-fait' as const,
    prompt,
    sampleAnswer: faitDiverSampleAnswers[index + 1] || ''
  }))
];

const randomQuestionPool: RandomQuestion[] = [
  ...randomSpeakingPool,
  ...randomWritingPool
];

const getRandomMixedQuestion = () =>
  randomQuestionPool[Math.floor(Math.random() * randomQuestionPool.length)];

const randomIeltsSpeakingPool: RandomSpeakingQuestion[] = randomSpeakingPool.filter(
  (q) => q.kind === 'ielts-part1' || q.kind === 'ielts-part2' || q.kind === 'ielts-part3'
);

const getRandomIeltsSpeakingQuestion = () =>
  randomIeltsSpeakingPool[Math.floor(Math.random() * randomIeltsSpeakingPool.length)];

const getQuestionTextForTTS = (question: RandomSpeakingQuestion): string => {
  if (question.kind === 'ielts-part2') {
    return `${question.mainQuestion} You should say: ${question.subQuestions.join('. ')}`;
  }
  if (question.kind === 'ielts-part1' || question.kind === 'ielts-part3') {
    return question.question;
  }
  return '';
};

const isSpeakingQuestion = (question: RandomQuestion): question is RandomSpeakingQuestion =>
  question.kind === 'tef' ||
  question.kind === 'ielts-part1' ||
  question.kind === 'ielts-part2' ||
  question.kind === 'ielts-part3';

function App() {
  const [currentView, setCurrentView] = useState<
    'landing' | 'ieltsSelection' | 'ieltsSpeaking' | 'ieltsWriting' | 'tefSelection' | 'tefWriting' | 'tefSpeaking' | 'randomQuestion' | 'randomIeltsSpeaking'
  >('landing');
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2' | 'part3'>('part1');
  const [currentQuestion, setCurrentQuestion] = useState<Question>(sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)]);
  const [currentPart2Question, setCurrentPart2Question] = useState<Part2Question>(part2Questions[0]);
  const [currentPart3Question, setCurrentPart3Question] = useState<Part3Question>(part2Questions[0].part3Questions[0]);
  const [randomQuestion, setRandomQuestion] = useState<RandomQuestion>(() => getRandomMixedQuestion());
  const [randomUserAnswer, setRandomUserAnswer] = useState<string>('');
  const [randomTranscript, setRandomTranscript] = useState<string>('');
  const [randomIsRecording, setRandomIsRecording] = useState<boolean>(false);
  const [randomSimilarityScore, setRandomSimilarityScore] = useState<number | null>(null);
  const [randomShowResult, setRandomShowResult] = useState<boolean>(false);
  const [randomGeminiAnalysis, setRandomGeminiAnalysis] = useState<any>(null);
  const [randomIsAnalyzing, setRandomIsAnalyzing] = useState<boolean>(false);
  const [randomShowSampleAnswer, setRandomShowSampleAnswer] = useState<boolean>(false);
  const [randomWritingAnswer, setRandomWritingAnswer] = useState<string>('');
  const [randomWritingSimilarityScore, setRandomWritingSimilarityScore] = useState<number | null>(null);
  const [randomWritingShowResult, setRandomWritingShowResult] = useState<boolean>(false);
  const [randomWritingGeminiAnalysis, setRandomWritingGeminiAnalysis] = useState<any>(null);
  const [randomWritingIsAnalyzing, setRandomWritingIsAnalyzing] = useState<boolean>(false);
  const [randomWritingShowSampleAnswer, setRandomWritingShowSampleAnswer] = useState<boolean>(false);
  const [ieltsSpkQuestion, setIeltsSpkQuestion] = useState<RandomSpeakingQuestion>(() => getRandomIeltsSpeakingQuestion());
  const [ieltsSpkUserAnswer, setIeltsSpkUserAnswer] = useState<string>('');
  const [ieltsSpkTranscript, setIeltsSpkTranscript] = useState<string>('');
  const [ieltsSpkIsRecording, setIeltsSpkIsRecording] = useState<boolean>(false);
  const [ieltsSpkSimilarityScore, setIeltsSpkSimilarityScore] = useState<number | null>(null);
  const [ieltsSpkShowResult, setIeltsSpkShowResult] = useState<boolean>(false);
  const [ieltsSpkGeminiAnalysis, setIeltsSpkGeminiAnalysis] = useState<any>(null);
  const [ieltsSpkIsAnalyzing, setIeltsSpkIsAnalyzing] = useState<boolean>(false);
  const [ieltsSpkShowSampleAnswer, setIeltsSpkShowSampleAnswer] = useState<boolean>(false);
  const [ieltsSpkAutoSpeak, setIeltsSpkAutoSpeak] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);




  const getRandomQuestion = () => {
    if (currentPart === 'part1') {
      const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
      const randomQuestion = sampleQuestions[randomIndex];
      setCurrentQuestion(randomQuestion);
    } else if (currentPart === 'part2') {
      const randomIndex = Math.floor(Math.random() * part2Questions.length);
      const randomPart2Question = part2Questions[randomIndex];
      setCurrentPart2Question(randomPart2Question);
    } else if (currentPart === 'part3') {
      const randomPart2Index = Math.floor(Math.random() * part2Questions.length);
      const randomPart2Question = part2Questions[randomPart2Index];
      const randomPart3Index = Math.floor(Math.random() * randomPart2Question.part3Questions.length);
      const randomPart3Question = randomPart2Question.part3Questions[randomPart3Index];
      setCurrentPart3Question(randomPart3Question);
    }
    setUserAnswer('');
    setSimilarityScore(null);
    setShowResult(false);
  };

  const handleRecordingComplete = (transcript: string) => {
    setUserAnswer(transcript);
    setCurrentTranscript('');
    setIsRecording(false);
  };

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;
    
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    
    let sampleAnswer = '';
    let question = '';
    
    if (currentPart === 'part1') {
      sampleAnswer = currentQuestion.sampleAnswer;
      question = currentQuestion.question;
    } else if (currentPart === 'part2') {
      sampleAnswer = currentPart2Question.sampleAnswer;
      question = currentPart2Question.mainQuestion;
    } else if (currentPart === 'part3') {
      sampleAnswer = currentPart3Question.sampleAnswer;
      question = currentPart3Question.question;
    }
    
    try {
      // Gemini API 호출 (환경에 따라 자동 선택)
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer,
          sampleAnswer,
          question,
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
          // 점수를 찾을 수 없으면 기본 계산 사용
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
    const commonWords = userWords.filter(word => sampleWords.includes(word));
    const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
          setSimilarityScore(Math.round(similarity));
        }
        
        setShowResult(true);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      // 에러 발생 시 기본 유사도 계산 사용
      const userWords = userAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
    setSimilarityScore(Math.round(similarity));
    setShowResult(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateRandomSpeakingSimilarity = async () => {
    if (!isSpeakingQuestion(randomQuestion)) return;
    if (!randomUserAnswer.trim()) return;

    setRandomIsAnalyzing(true);
    setRandomGeminiAnalysis(null);

    const speakingQuestion = randomQuestion;
    const sampleAnswer = speakingQuestion.sampleAnswer || '';
    const question =
      speakingQuestion.kind === 'tef'
        ? `Section ${speakingQuestion.section} - Question ${speakingQuestion.questionNumber}`
        : speakingQuestion.kind === 'ielts-part2'
        ? speakingQuestion.mainQuestion
        : speakingQuestion.question;

    try {
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer: randomUserAnswer,
          sampleAnswer,
          question,
          analysisType: 'similarity'
        },
        lambdaUrl
      );

      if (data.success && data.analysis) {
        setRandomGeminiAnalysis(data.analysis);

        if (data.analysis.similarityScore !== undefined) {
          setRandomSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setRandomSimilarityScore(data.analysis.overallScore);
        } else {
          const userWords = randomUserAnswer.toLowerCase().split(/\s+/);
          const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
          const commonWords = userWords.filter(word => sampleWords.includes(word));
          const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
          setRandomSimilarityScore(Math.round(similarity));
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

      setRandomShowResult(true);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      const userWords = randomUserAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
      setRandomSimilarityScore(Math.round(similarity));
      setRandomShowResult(true);
    } finally {
      setRandomIsAnalyzing(false);
    }
  };

  const calculateRandomWritingSimilarity = async () => {
    if (isSpeakingQuestion(randomQuestion)) return;
    if (!randomWritingAnswer.trim()) return;

    setRandomWritingIsAnalyzing(true);
    setRandomWritingGeminiAnalysis(null);

    const writingQuestion = randomQuestion;
    const sampleAnswer = writingQuestion.sampleAnswer || '';
    const isIeltsTask1 = writingQuestion.kind === 'ielts-task1';
    const isIeltsTask2 = writingQuestion.kind === 'ielts-task2';

    const questionText = isIeltsTask1
      ? `IELTS Academic Writing Task 1\nTask: Refer to the attached image. (${(writingQuestion.imagePaths || []).join(', ')})`
      : isIeltsTask2
      ? `IELTS Academic Writing Task 2\nTask: ${writingQuestion.prompt}`
      : writingQuestion.prompt;

    const imagePayloads: Array<{ data: string; mimeType: string }> = [];
    if (isIeltsTask1 && writingQuestion.imagePaths?.length) {
      try {
        for (const imagePath of writingQuestion.imagePaths) {
          const response = await fetch(imagePath);
          const blob = await response.blob();
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(blob);
          });
          if (data) {
            imagePayloads.push({ data, mimeType: blob.type || 'image/png' });
          }
        }
      } catch (error) {
        console.warn('Failed to load writing image for Gemini:', error);
      }
    }

    try {
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer: randomWritingAnswer,
          sampleAnswer: sampleAnswer?.trim() ? sampleAnswer : '모범 답안이 아직 작성되지 않았습니다.',
          question: questionText,
          analysisType: isIeltsTask1 || isIeltsTask2 ? 'ielts-writing' : 'similarity',
          images: imagePayloads.length ? imagePayloads : undefined
        },
        lambdaUrl
      );

      if (data.success && data.analysis) {
        setRandomWritingGeminiAnalysis(data.analysis);

        if (data.analysis.similarityScore !== undefined) {
          setRandomWritingSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setRandomWritingSimilarityScore(data.analysis.overallScore);
        } else {
          const userWords = randomWritingAnswer.toLowerCase().split(/\s+/);
          const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
          const commonWords = userWords.filter(word => sampleWords.includes(word));
          const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
          setRandomWritingSimilarityScore(Math.round(similarity));
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

      setRandomWritingShowResult(true);
    } catch (error) {
      console.error('Error analyzing writing with Gemini:', error);
      const userWords = randomWritingAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
      setRandomWritingSimilarityScore(Math.round(similarity));
      setRandomWritingShowResult(true);
    } finally {
      setRandomWritingIsAnalyzing(false);
    }
  };

  const refreshIeltsSpkQuestion = () => {
    const newQ = getRandomIeltsSpeakingQuestion();
    setIeltsSpkQuestion(newQ);
    setIeltsSpkUserAnswer('');
    setIeltsSpkTranscript('');
    setIeltsSpkIsRecording(false);
    setIeltsSpkSimilarityScore(null);
    setIeltsSpkShowResult(false);
    setIeltsSpkGeminiAnalysis(null);
    setIeltsSpkIsAnalyzing(false);
    setIeltsSpkShowSampleAnswer(false);
    setIeltsSpkAutoSpeak(true);
  };

  const calculateIeltsSpkSimilarity = async () => {
    if (!ieltsSpkUserAnswer.trim()) return;

    setIeltsSpkIsAnalyzing(true);
    setIeltsSpkGeminiAnalysis(null);

    const sampleAnswer = ieltsSpkQuestion.sampleAnswer || '';
    const question =
      ieltsSpkQuestion.kind === 'ielts-part2'
        ? ieltsSpkQuestion.mainQuestion
        : ieltsSpkQuestion.kind === 'ielts-part1' || ieltsSpkQuestion.kind === 'ielts-part3'
        ? ieltsSpkQuestion.question
        : '';

    try {
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        { userAnswer: ieltsSpkUserAnswer, sampleAnswer, question, analysisType: 'similarity' },
        lambdaUrl
      );

      if (data.success && data.analysis) {
        setIeltsSpkGeminiAnalysis(data.analysis);
        if (data.analysis.similarityScore !== undefined) {
          setIeltsSpkSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setIeltsSpkSimilarityScore(data.analysis.overallScore);
        } else {
          const userWords = ieltsSpkUserAnswer.toLowerCase().split(/\s+/);
          const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
          const commonWords = userWords.filter(word => sampleWords.includes(word));
          setIeltsSpkSimilarityScore(Math.round((commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100));
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
      setIeltsSpkShowResult(true);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      const userWords = ieltsSpkUserAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      setIeltsSpkSimilarityScore(Math.round((commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100));
      setIeltsSpkShowResult(true);
    } finally {
      setIeltsSpkIsAnalyzing(false);
    }
  };

  const refreshRandomQuestion = () => {
    setRandomQuestion(getRandomMixedQuestion());
    setRandomUserAnswer('');
    setRandomTranscript('');
    setRandomIsRecording(false);
    setRandomSimilarityScore(null);
    setRandomShowResult(false);
    setRandomGeminiAnalysis(null);
    setRandomIsAnalyzing(false);
    setRandomShowSampleAnswer(false);
    setRandomWritingAnswer('');
    setRandomWritingSimilarityScore(null);
    setRandomWritingShowResult(false);
    setRandomWritingGeminiAnalysis(null);
    setRandomWritingIsAnalyzing(false);
    setRandomWritingShowSampleAnswer(false);
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onSelectIELTS={() => setCurrentView('ieltsSelection')}
        onSelectTEF={() => setCurrentView('tefSelection')}
        onSelectRandomQuestion={() => {
          refreshRandomQuestion();
          setCurrentView('randomQuestion');
        }}
        onSelectRandomIeltsSpeaking={() => {
          refreshIeltsSpkQuestion();
          setCurrentView('randomIeltsSpeaking');
        }}
      />
    );
  }

  if (currentView === 'randomIeltsSpeaking') {
    return (
      <RandomIeltsSpeakingView
        question={ieltsSpkQuestion}
        onBack={() => { window.speechSynthesis.cancel(); setCurrentView('landing'); }}
        onNext={refreshIeltsSpkQuestion}
        autoSpeak={ieltsSpkAutoSpeak}
        setAutoSpeak={setIeltsSpkAutoSpeak}
        showSampleAnswer={ieltsSpkShowSampleAnswer}
        setShowSampleAnswer={setIeltsSpkShowSampleAnswer}
        userAnswer={ieltsSpkUserAnswer}
        transcript={ieltsSpkTranscript}
        isRecording={ieltsSpkIsRecording}
        setIsRecording={setIeltsSpkIsRecording}
        setTranscript={setIeltsSpkTranscript}
        onRecordingComplete={(transcript) => {
          setIeltsSpkUserAnswer(transcript);
          setIeltsSpkTranscript('');
          setIeltsSpkIsRecording(false);
        }}
        onAnalyze={calculateIeltsSpkSimilarity}
        isAnalyzing={ieltsSpkIsAnalyzing}
        showResult={ieltsSpkShowResult}
        similarityScore={ieltsSpkSimilarityScore}
        geminiAnalysis={ieltsSpkGeminiAnalysis}
      />
    );
  }

  if (currentView === 'randomQuestion') {
    if (isSpeakingQuestion(randomQuestion)) {
      const isFrench = randomQuestion.kind === 'tef';
      return (
        <RandomSpeakingSection
          onBack={() => setCurrentView('landing')}
          isFrench={isFrench}
          question={randomQuestion}
          onNext={refreshRandomQuestion}
          showSampleAnswer={randomShowSampleAnswer}
          setShowSampleAnswer={setRandomShowSampleAnswer}
          userAnswer={randomUserAnswer}
          transcript={randomTranscript}
          isRecording={randomIsRecording}
          setIsRecording={setRandomIsRecording}
          setTranscript={setRandomTranscript}
          onRecordingComplete={(transcript) => {
            setRandomUserAnswer(transcript);
            setRandomTranscript('');
            setRandomIsRecording(false);
          }}
          onAnalyze={calculateRandomSpeakingSimilarity}
          isAnalyzing={randomIsAnalyzing}
          showResult={randomShowResult}
          similarityScore={randomSimilarityScore}
          geminiAnalysis={randomGeminiAnalysis}
        />
      );
    }
  }
 
  if (currentView === 'randomQuestion' && !isSpeakingQuestion(randomQuestion)) {
    const isIelts = randomQuestion.kind === 'ielts-task1' || randomQuestion.kind === 'ielts-task2';
    const wordCount = randomWritingAnswer.trim()
      ? randomWritingAnswer.trim().split(/\s+/).length
      : 0;

    return (
      <RandomWritingSection
        onBack={() => setCurrentView('landing')}
        isIelts={isIelts}
        question={randomQuestion}
        onNext={refreshRandomQuestion}
        showSampleAnswer={randomWritingShowSampleAnswer}
        setShowSampleAnswer={setRandomWritingShowSampleAnswer}
        answer={randomWritingAnswer}
        setAnswer={setRandomWritingAnswer}
        wordCount={wordCount}
        onAnalyze={calculateRandomWritingSimilarity}
        isAnalyzing={randomWritingIsAnalyzing}
        showResult={randomWritingShowResult}
        similarityScore={randomWritingSimilarityScore}
        geminiAnalysis={randomWritingGeminiAnalysis}
      />
    );
  }

  if (currentView === 'ieltsSelection') {
    return (
      <div className="App">
        <header className="App-header">
          <button 
            onClick={() => setCurrentView('landing')}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>🇬🇧 IELTS</h1>
        </header>
        <main className="App-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => setCurrentView('ieltsWriting')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✍️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Writing</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>라이팅</div>
            </button>
            
            <button 
              onClick={() => setCurrentView('ieltsSpeaking')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎤</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Speaking</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>스피킹</div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'tefSelection') {
    return (
      <div className="App">
        <header className="App-header">
          <button 
            onClick={() => setCurrentView('landing')}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>🇫🇷 TEF Canada</h1>
        </header>
        <main className="App-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => setCurrentView('tefWriting')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✍️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Expression Écrite</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Writing (라이팅)</div>
            </button>
            
            <button 
              onClick={() => setCurrentView('tefSpeaking')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎤</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Expression Orale</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Speaking (스피킹)</div>
            </button>
          </div>
        </main>
      </div>
    );
  }


  if (currentView === 'tefWriting') {
    return (
      <TEFWriting onBack={() => setCurrentView('tefSelection')} />
    );
  }

  if (currentView === 'tefSpeaking') {
    return (
      <TEFSpeaking onBack={() => setCurrentView('tefSelection')} />
    );
  }

  if (currentView === 'ieltsWriting') {
    return (
      <IELTSWriting onBack={() => setCurrentView('ieltsSelection')} />
    );
  }

  if (currentView === 'ieltsSpeaking') {
  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
              onClick={() => setCurrentView('ieltsSelection')}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>🎤 IELTS 스피킹 연습</h1>
        </div>
      </header>
      
      <main className="App-main">
        <div className="part-selector">
          <button 
            onClick={() => {
              setCurrentPart('part1');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part1' ? 'active' : ''}`}
          >
            Part 1
          </button>
          <button 
            onClick={() => {
              setCurrentPart('part2');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part2' ? 'active' : ''}`}
          >
            Part 2
          </button>
          <button 
            onClick={() => {
              setCurrentPart('part3');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part3' ? 'active' : ''}`}
          >
            Part 3
          </button>
        </div>

        <div className="question-controls">
          <button onClick={getRandomQuestion} className="random-button">
            🎲 랜덤 문제 선택
          </button>
          
          {currentPart === 'part1' && (
            <div className="topic-selector">
              <h4>카테고리별 선택:</h4>
              <div className="topic-buttons">
                {Array.from(new Set(sampleQuestions.map(q => q.category))).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      const categoryQuestions = sampleQuestions.filter(q => q.category === category);
                      const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                      setCurrentQuestion(randomQuestion);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button ${currentQuestion.category === category ? 'active' : ''}`}
                  >
                    {category.replace('Part 1 - ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentPart === 'part2' && (
            <div className="topic-selector">
              <h4>주제별 선택:</h4>
              <div className="topic-buttons">
                {part2Questions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentPart2Question(question);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button ${currentPart2Question.id === question.id ? 'active' : ''}`}
                  >
                    {question.topic}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentPart === 'part3' && (
            <div className="topic-selector">
              <h4>주제별 선택:</h4>
              <div className="topic-buttons">
                {part2Questions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => {
                      const randomPart3Index = Math.floor(Math.random() * question.part3Questions.length);
                      const randomPart3Question = question.part3Questions[randomPart3Index];
                      setCurrentPart3Question(randomPart3Question);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button`}
                  >
                    {question.topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {currentPart === 'part1' ? (
          <QuestionCard question={currentQuestion} />
        ) : currentPart === 'part2' ? (
          <div className="part2-question">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0 }}>{currentPart2Question.topic}</h2>
              <SpeakButton
                text={`${currentPart2Question.mainQuestion} You should say: ${currentPart2Question.subQuestions.join('. ')}`}
              />
            </div>
            <h3>{currentPart2Question.mainQuestion}</h3>
            <div className="sub-questions">
              <p>You should say:</p>
              <ul>
                {currentPart2Question.subQuestions.map((subQ, index) => (
                  <li key={index}>{subQ}</li>
                ))}
              </ul>
            </div>
              <details className="sample-answer">
                <summary>Sample Answer</summary>
                <p dangerouslySetInnerHTML={{ __html: currentPart2Question.sampleAnswer }} />
              </details>
          </div>
        ) : (
          <div className="part3-question">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0 }}>Part 3 - Discussion Question</h2>
              <SpeakButton text={currentPart3Question.question} />
            </div>
            <h3>{currentPart3Question.question}</h3>
            <details className="sample-answer">
              <summary>Sample Answer</summary>
              <p dangerouslySetInnerHTML={{ __html: currentPart3Question.sampleAnswer }} />
            </details>
          </div>
        )}
        
        <SpeechRecognition
          isRecording={isRecording}
          onStartRecording={() => {
            setIsRecording(true);
            setCurrentTranscript('');
          }}
          onStopRecording={() => setIsRecording(false)}
          onRecordingComplete={handleRecordingComplete}
          onTranscriptUpdate={setCurrentTranscript}
        />

        {isRecording && (
          <div className="user-answer">
            <h3>🎤 실시간 음성 인식:</h3>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              {currentTranscript || '음성을 인식하고 있습니다...'}
            </p>
          </div>
        )}

                {userAnswer && !isRecording && (
          <div className="user-answer">
            <h3>🎤 당신의 답변:</h3>
            <p>{userAnswer}</p>
            <button 
              onClick={calculateSimilarity} 
              className="compare-button"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '🤖 AI 분석 중...' : '📊 유사도 분석하기'}
            </button>
          </div>
        )}

        {showResult && similarityScore !== null && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={
              currentPart === 'part1' 
                ? currentQuestion.sampleAnswer 
                : currentPart === 'part2'
                ? currentPart2Question.sampleAnswer
                : currentPart3Question.sampleAnswer
            }
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>
    </div>
    );
  }

  return (
    <LandingPage
      onSelectIELTS={() => setCurrentView('ieltsSelection')}
      onSelectTEF={() => setCurrentView('tefSelection')}
      onSelectRandomQuestion={() => {
        refreshRandomQuestion();
        setCurrentView('randomQuestion');
      }}
      onSelectRandomIeltsSpeaking={() => {
        refreshIeltsSpkQuestion();
        setCurrentView('randomIeltsSpeaking');
      }}
    />
  );
}

export default App;
