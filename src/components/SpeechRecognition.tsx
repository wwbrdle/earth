import React, { useState, useEffect, useRef } from 'react';
import './SpeechRecognition.css';

interface SpeechRecognitionProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRecordingComplete: (transcript: string) => void;
  onTranscriptUpdate: (transcript: string) => void;
  language?: string;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onRecordingComplete,
  onTranscriptUpdate,
  language = 'en-US'
}) => {

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const stopRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    // Web Speech API 지원 확인
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // event.results의 모든 결과를 순회하면서 transcript를 구성
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // 실시간으로 전체 transcript를 부모 컴포넌트로 전달
        onTranscriptUpdate(finalTranscript + interimTranscript);

        // 최신 최종 결과를 저장 (중지 시 전달)
        finalTranscriptRef.current = finalTranscript;
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          const errorMessage = language.startsWith('fr') 
            ? 'Aucune voix détectée. Veuillez réessayer.'
            : '음성이 감지되지 않았습니다. 다시 시도해주세요.';
          alert(errorMessage);
        }
      };

      recognitionRef.current.onend = () => {
        if (!stopRequestedRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.warn('Failed to restart speech recognition:', error);
          }
        }
      };
    }
  }, [onRecordingComplete, onTranscriptUpdate, language]);

  const handleStartRecording = () => {
    if (recognitionRef.current) {
      stopRequestedRef.current = false;
      finalTranscriptRef.current = '';
      recognitionRef.current.start();
      onStartRecording();
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      stopRequestedRef.current = true;
      const finalTranscript = finalTranscriptRef.current.trim();
      if (finalTranscript) {
        onRecordingComplete(finalTranscript);
      }
      recognitionRef.current.stop();
      onStopRecording();
    }
  };

  if (!isSupported) {
    const notSupportedMessage = language.startsWith('fr')
      ? '⚠️ La reconnaissance vocale n\'est pas prise en charge dans ce navigateur.'
      : '⚠️ 이 브라우저에서는 음성 인식이 지원되지 않습니다.';
    const browserMessage = language.startsWith('fr')
      ? 'Veuillez utiliser un navigateur moderne comme Chrome, Edge ou Safari.'
      : 'Chrome, Edge, Safari 등의 최신 브라우저를 사용해주세요.';
    
    return (
      <div className="speech-recognition">
        <div className="not-supported">
          <p>{notSupportedMessage}</p>
          <p>{browserMessage}</p>
        </div>
      </div>
    );
  }

  const isFrench = language.startsWith('fr');
  const startButtonText = isFrench ? '🎤 Démarrer l\'enregistrement' : '🎤 녹음 시작';
  const stopButtonText = isFrench ? '⏹️ Arrêter l\'enregistrement' : '⏹️ 녹음 중지';
  const recordingText = isFrench ? 'Enregistrement en cours... Parlez s\'il vous plaît!' : '녹음 중... 말씀해주세요!';

  return (
    <div className="speech-recognition">
      <div className="recording-controls">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="start-button"
          >
            {startButtonText}
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="stop-button"
          >
            {stopButtonText}
          </button>
        )}
      </div>
      
      {isRecording && (
        <div className="recording-status">
          <div className="recording-indicator">
            <div className="pulse"></div>
            <span>{recordingText}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechRecognition;
