import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onSelectIELTS: () => void;
  onSelectTEF: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectIELTS, onSelectTEF }) => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1>earth</h1>
        <p className="landing-subtitle">원하는 시험을 선택하세요</p>
        
        <div className="exam-buttons">
          <button 
            onClick={onSelectIELTS}
            className="exam-button ielts-button"
          >
            <div className="exam-icon">🇬🇧</div>
            <div className="exam-title">IELTS</div>
            <div className="exam-description">IELTS Speaking Practice</div>
          </button>
          
          <button 
            onClick={onSelectTEF}
            className="exam-button tef-button"
          >
            <div className="exam-icon">🇫🇷</div>
            <div className="exam-title">TEF Canada</div>
            <div className="exam-description">Test d'évaluation de français</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
