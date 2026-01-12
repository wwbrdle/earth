import React, { useState } from 'react';
import './TEFCanada.css';
import SpeechRecognition from './SpeechRecognition';

interface TEFCanadaProps {
  onBack: () => void;
}

const TEFCanada: React.FC<TEFCanadaProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<'sectionA' | 'sectionB'>('sectionA');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0); // 0이면 Section 이미지, 1 이상이면 문제 이미지
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleRecordingComplete = (transcript: string) => {
    setUserAnswer(transcript);
    setCurrentTranscript('');
    setIsRecording(false);
  };

  const calculateSimilarity = () => {
    if (!userAnswer.trim()) return;
    
    // TEF Canada의 경우 모범 답안이 TBD이므로 유사도 계산은 간단하게 처리
    setShowResult(true);
  };

  const resetState = () => {
    setUserAnswer('');
    setCurrentTranscript('');
    setShowResult(false);
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
        <h1>🇫🇷 TEF Canada</h1>
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

        {userAnswer && !isRecording && (
          <div className="user-answer">
            <h3>🎤 Votre réponse:</h3>
            <p>{userAnswer}</p>
            <button onClick={calculateSimilarity} className="compare-button">
              📊 Analyser la similarité
            </button>
          </div>
        )}

        {showResult && (
          <div className="result-container">
            <h3>📊 Résultat</h3>
            <div className="sample-answer-box">
              <h4>Réponse modèle:</h4>
              <p>TBD</p>
            </div>
            <div className="user-answer-box">
              <h4>Votre réponse:</h4>
              <p>{userAnswer}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TEFCanada;
