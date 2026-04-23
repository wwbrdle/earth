import React, { useState, useEffect, useCallback } from 'react';
import './SpeakButton.css';

interface SpeakButtonProps {
  text: string;
  lang?: string;
  label?: string;
}

const SpeakButton: React.FC<SpeakButtonProps> = ({ text, lang = 'en-US', label = '문제 듣기' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text]);

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <button
      onClick={handleSpeak}
      className={`speak-button ${isSpeaking ? 'speaking' : ''}`}
      title={isSpeaking ? '읽기 중지' : label}
    >
      {isSpeaking ? '⏹ 중지' : `🔊 ${label}`}
    </button>
  );
};

export default SpeakButton;
