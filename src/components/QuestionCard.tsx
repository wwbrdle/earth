import React, { useState } from 'react';
import './QuestionCard.css';
import SpeakButton from './SpeakButton';

interface Question {
  id: number;
  question: string;
  sampleAnswer: string;
  category: string;
}

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);

  return (
    <div className="question-card">
      <div className="question-section">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0 }}>📝 질문 ({question.category})</h3>
          <SpeakButton text={question.question} />
        </div>
        <p className="question-text">{question.question}</p>
      </div>
      
      <div className="sample-answer-section">
        <button 
          onClick={() => setShowSampleAnswer(!showSampleAnswer)}
          className="show-answer-button"
        >
          {showSampleAnswer ? '📖 모범 답안 숨기기' : '📖 모범 답안 보기'}
        </button>
        {showSampleAnswer && (
          <div className="sample-answer-content">
            <p 
              className="sample-answer-text"
              dangerouslySetInnerHTML={{ __html: question.sampleAnswer }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
