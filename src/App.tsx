import React, { useState } from 'react';
import './App.css';
import QuestionCard from './components/QuestionCard';
import SpeechRecognition from './components/SpeechRecognition';
import ResultDisplay from './components/ResultDisplay';
import LandingPage from './components/LandingPage';
import TEFWriting from './components/TEFWriting';
import TEFSpeaking from './components/TEFSpeaking';
import IELTSWriting, { task1Topics as ieltsTask1Topics, task2Prompts as ieltsTask2Prompts, sampleAnswers as ieltsSampleAnswers } from './components/IELTSWriting';
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
            <h3>
              📝 질문 (
              {question.kind === 'tef'
                ? `Section ${question.section} - Question ${question.questionNumber}`
                : question.category}
              )
            </h3>
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
                              <div style={{ whiteSpace: 'pre-line', color: '#333' }}>{part3.sampleAnswer}</div>
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
    sampleAnswer: "As you might expect, Seoul is the busiest city in Korea and a lot of people live there. But I think more people live on the outskirts of Seoul and commute in because the rent is cheaper and the air is a bit better than in the city.",
    category: "Part 1 - Your Country"
  },
  {
    id: 2,
    question: "Tell me about the main industries there.",
    sampleAnswer: "In and around Seoul has offices from the biggest companies in Korea like Samsung, LG and Hyundai so they create lots of jobs. Therefore, I think the main industries are to do with technology and electronics. Hospitality is also a big industry here with cafes and bars on every corner.",
    category: "Part 1 - Your Country"
  },
  {
    id: 3,
    question: "How easy is it to travel around your country?",
    sampleAnswer: "It's so easy to travel around Korea, trains and buses are frequent and cheap. There is also a high speed train that travels through the country although this is a bit more expensive. The roads are great so driving is also a good option if you want to explore yourself.",
    category: "Part 1 - Your Country"
  },
  {
    id: 4,
    question: "Has your country changed much since you were a child?",
    sampleAnswer: "I think it has changed massively. It has become much more modern and internationally aware. These days it's possible to find food from all over the world and see lots of foreign people working in Korea. Also technology has developed rapidly, maybe too much so.",
    category: "Part 1 - Your Country"
  },
  
  // Your Home
  {
    id: 5,
    question: "Do you live in a house or a flat?",
    sampleAnswer: "Currently, I'm residing in a flat that features three bedrooms, a <strong>common bathroom</strong>, a kitchen, and a spacious living room. My bedroom is the <strong>master bedroom</strong>, so it comes with an <strong>attached bathroom</strong>. One great thing is the <strong>laundry room</strong> in the basement equipped with washers and dryers. With a convenience store located just a stone's throw away, the location is incredibly functional and convenient.",
    category: "Part 1 - Your Home"
  },
  {
    id: 6,
    question: "What are the differences between the place you live now and where you lived before?",
    sampleAnswer: "When I was a child, I used to live in a house in countryside but now I live in an apartment. As there are many convenient facilities in my flat, I think it's better to live there.",
    category: "Part 1 - Your Home"
  },
  {
    id: 7,
    question: "Did you like the place you lived in as a child?",
    sampleAnswer: "Yes, very much. I liked the house that I lived in my childhood as it was located in countryside and I used to raise lots of pets including dogs, rabbits, and some chickens.",
    category: "Part 1 - Your Home"
  },
  {
    id: 8,
    question: "Which part of your home do you like best?",
    sampleAnswer: "I like living room the best as all my family members gather round in the evening and we can chat together about the day.",
    category: "Part 1 - Your Home"
  },
  {
    id: 9,
    question: "In the future, what type of home would you like to live in?",
    sampleAnswer: "In the future, I'd love to live in a spacious condo because it's clean and low-maintenance. You don't have to worry about things like gardening, and most condos have great security, which would make me feel safe and comfortable.",
    category: "Part 1 - Your Home"
  },
  
  // Weekends
  {
    id: 10,
    question: "How do you usually spend your weekends?",
    sampleAnswer: "I'm quite an active person so I'm always out on weekends. I usually play sports with my friends or go for lunch or a beer and just have a chat to catch up with each other.",
    category: "Part 1 - Weekends"
  },
  {
    id: 11,
    question: "Which is your favourite part of the weekend?",
    sampleAnswer: "I love when I wake up on Saturday morning because it's just the start of a fun day. I know that I'm going to have fun and then still have Sunday to relax before I go back to work.",
    category: "Part 1 - Weekends"
  },
  {
    id: 12,
    question: "Do you think your weekends are long enough?",
    sampleAnswer: "Well, I always say the weekend is too short and that it goes so fast but when I have a long weekend sometimes I think it's actually too long. Every now and then it's nice to have Monday as a holiday but for me weekends are long enough.",
    category: "Part 1 - Weekends"
  },
  {
    id: 13,
    question: "How important do you think it is to have free time at the weekend?",
    sampleAnswer: "That's an interesting question. I think it's absolutely essential because without free time on weekends, people can't really recharge or relax. To stay productive during the week, we need to feel well-rested, so having time to unwind is vital for both our work performance and our overall well-being.",
    category: "Part 1 - Weekends"
  },
  
  // Transportation
  {
    id: 14,
    question: "How often do you use public transport?",
    sampleAnswer: "I take a bus every day. I have to take it to go to work or to go home. It normally takes around an hour and half.",
    category: "Part 1 - Transportation"
  },
  {
    id: 15,
    question: "When was the last time you travelled by public transport?",
    sampleAnswer: "Actually it's this morning. I always travel by bus every morning to go to work. It's often crowded so I don't really like travelling by bus.",
    category: "Part 1 - Transportation"
  },
  {
    id: 16,
    question: "Do you prefer to use a private car or public transport?",
    sampleAnswer: "Well, it depends on the situations. Sometimes it's more convenient to use a private car like when travelling in distance. But on a daily basis, I prefer to use public transport as it's punctual and cheaper.",
    category: "Part 1 - Transportation"
  },
  {
    id: 17,
    question: "What form of transport would you recommend visitors to your hometown use?",
    sampleAnswer: "I'd definitely recommend visitors to take underground (subway) as it's prompt, quick, and convenient to move around. Also all the announcements are also made in English as well as in Korean, so they can figure out what station they are on easily.",
    category: "Part 1 - Transportation"
  },
  {
    id: 18,
    question: "Do you think people will drive more in the future?",
    sampleAnswer: "(Answer 1) As today's trend, people tend to drive more and buy more than one car in a household. And for their convenience, I think they will use cars more.\n\n(Answer 2) I don't quite think so. People in modern society know the seriousness of environmental problems so in order to reduce pollution, maybe less number of people will drive cars.",
    category: "Part 1 - Transportation"
  },
  {
    id: 19,
    question: "Is driving to work popular in your country?",
    sampleAnswer: "Yes, it is. As public transports normally take longer time and only go by their routine, some people prefer to drive to work in Korea.",
    category: "Part 1 - Transportation"
  },
  
  // Television
  {
    id: 20,
    question: "How often do you watch television?",
    sampleAnswer: "I watch TV most days, not for very long, maybe about an hour. Some days I don't have time and that's fine, I don't need television in my life but I do enjoy it for short periods of time.",
    category: "Part 1 - Television"
  },
  {
    id: 21,
    question: "Which television channel do you usually watch?",
    sampleAnswer: "I'd say I mostly watch National Geographic because I'm really interested in programs about nature and wildlife. I love shows that study animals in the wild since that's something we rarely see in daily life, and I find it absolutely fascinating.",
    category: "Part 1 - Television"
  },
  {
    id: 22,
    question: "Do you enjoy the advertisements on television?",
    sampleAnswer: "I definitely do not. They are the most annoying part of television, just when I'm watching an interesting program there's a 5-minute break with ads. It makes me lose focus and I usually switch the channel.",
    category: "Part 1 - Television"
  },
  {
    id: 23,
    question: "Do you think that most programs on television are good?",
    sampleAnswer: "Actually, I don't think so because even though there are so many channels these days, I often struggle to find something interesting. A lot of shows feel repetitive, with similar jokes and ideas, which makes them quite boring for me.",
    category: "Part 1 - Television"
  },
  
  // Newspapers and Magazines
  {
    id: 24,
    question: "Which newspapers and magazines do you read?",
    sampleAnswer: "I prefer to read the Korea Times which is a daily newspaper in Korea. I like this paper because they always give strong opinions on government issues.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 25,
    question: "What kinds of article are you most interested in?",
    sampleAnswer: "I'd say I'm most interested in articles about economics and finance because I'm deeply interested in these areas, especially the stock market. I enjoy keeping up with market trends and investment strategies, and I think it's essential to understand what's happening in your country's economy.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 26,
    question: "Have you ever read a magazine or newspaper in a foreign language?",
    sampleAnswer: "Yes, I have. I remember trying to read a French newspaper when I was in Montreal. The articles were interesting, but my French wasn't strong enough to fully understand everything. I struggled with some words and complex sentences, but it was still a great way to practice and learn more about the local culture.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 27,
    question: "Do you think reading a newspaper or magazine in a foreign language is a good way to learn the language?",
    sampleAnswer: "Absolutely, because reading newspapers in a foreign language helps you learn vocabulary in context. When I tried reading a French newspaper in Montreal, it was challenging, but I picked up new words naturally. It's an engaging way to improve both language skills and cultural knowledge.",
    category: "Part 1 - Newspapers"
  },
  
  // Music
  {
    id: 28,
    question: "What kinds of music do you like?",
    sampleAnswer: "I like most kinds, like R&B, pop, even classical music. I listen to music whenever I have spare time.",
    category: "Part 1 - Music"
  },
  {
    id: 29,
    question: "When was the last time you went to a musical performance?",
    sampleAnswer: "I remember the last time was in April, when I went to a Coldplay concert in Korea with one of my friends. It was an amazing experience—the live atmosphere and energy from the crowd were absolutely unforgettable.",
    category: "Part 1 - Music"
  },
  {
    id: 30,
    question: "Do you feel that going to a concert is better than listening to a CD, or watching a concert on TV?",
    sampleAnswer: "It depends, I prefer going to a concert when the concert is held in a small theatre, but if it's held in a big halls or stadium, I think listening to a CD or watching a concert on TV is better.",
    category: "Part 1 - Music"
  },
  {
    id: 31,
    question: "Have you ever been in a choir or some other musical performance?",
    sampleAnswer: "Yes, I have. I remember when I was in elementary school, I learned to play the flute and joined a small music club. We even performed together at the school festival, which was a really fun experience.",
    category: "Part 1 - Music"
  },
  {
    id: 32,
    question: "Do students in your country have to study the creative arts, such as music?",
    sampleAnswer: "Yes, they do. In Korea, music is a required subject in elementary school, along with other creative arts like painting and sometimes dance. It's part of the national curriculum to give students a balanced education.",
    category: "Part 1 - Music"
  },
  
  // Musical Instrument
  {
    id: 41,
    question: "Which instrument do you like listening to most? and why?",
    sampleAnswer: "I like listening to the flute the most, the sound of it always puts a smile on my face for some reason. I think it's because my mother used to play the flute when I was young so I'm used to hearing it.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 42,
    question: "Have you ever learned to play a musical instrument?",
    sampleAnswer: "I have, like most children in Korea I learned to play the piano when I was an elementary school student. I went to a private academy after school for about two years.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 43,
    question: "Do you think children should learn to play a musical instrument at school?",
    sampleAnswer: "Yes, I believe children should learn a musical instrument at school because it helps them develop creativity and discipline. For example, one of my friends learned the guitar in elementary school, and now he's a guitarist in a band.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 44,
    question: "How easy would it be to learn a musical instrument without a teacher?",
    sampleAnswer: "I think it's possible these days because there are so many online resources like video tutorials and apps. Students can practice at home using platforms such as YouTube, so it's much easier than before, even without a personal teacher.",
    category: "Part 1 - Musical Instrument"
  },
  
  // Food
  {
    id: 45,
    question: "What sort of food do you like eating most?",
    sampleAnswer: "Well, I can't get enough of Italian food like pasta, lasagne or pizza. I love the rich sauces and variety of flavours.",
    category: "Part 1 - Food"
  },
  {
    id: 46,
    question: "Who normally does the cooking in your house?",
    sampleAnswer: "Like a lot of families in Korea my mother does the cooking. My father has always worked and my mother has always taken care of household jobs, she's a great cook and enjoys cooking for us.",
    category: "Part 1 - Food"
  },
  {
    id: 47,
    question: "Do you watch cookery programs on TV?",
    sampleAnswer: "Not really, because I'm not very interested in cooking. So I hardly ever watch cooking shows, although sometimes I come across short food videos online by accident.",
    category: "Part 1 - Food"
  },
  {
    id: 48,
    question: "In general, do you prefer eating out or eating at home? why?",
    sampleAnswer: "I much prefer eating out, in Korea it's relatively cheap to eat out and there are so many options on every corner. It might be a bit more expensive but with the time I save I think it's well worth it.",
    category: "Part 1 - Food"
  },
  {
    id: 49,
    question: "In your country, is it expensive to eat out?",
    sampleAnswer: "It didn't use to be very expensive, but these days the prices have gone up a lot. For example, a bowl of bibimbap used to cost around seven dollars, but now it's about fifteen. So eating out regularly can be quite pricey.",
    category: "Part 1 - Food"
  },
  {
    id: 50,
    question: "Tell me about a traditional Korean dish.",
    sampleAnswer: "I think the most traditional dish is Kimchi soup. It's a spicy soup with fermented cabbage, meat and vegetables all mixed together served with rice. The combination of flavours is great.",
    category: "Part 1 - Food"
  },
  
  // Snacks
  {
    id: 51,
    question: "Do you like to eat snacks?",
    sampleAnswer: "I'd say I really like eating snacks, especially chocolate bars like Snickers or chips such as Cheetos, simply because they're quick, tasty, and give me a little energy boost.",
    category: "Part 1 - Snacks"
  },
  {
    id: 52,
    question: "What snacks do you usually eat?",
    sampleAnswer: "Well, I usually go for chocolate bars like Snickers or salty snacks like Cheetos. Sometimes, I mix it up with biscuits or cookies, depending on my mood.",
    category: "Part 1 - Snacks"
  },
  {
    id: 53,
    question: "Do you still eat the same types of snacks that you ate when you were a child?",
    sampleAnswer: "Yes, I do. In fact, whenever I visit Korea, I remember buying the snacks I used to eat as a kid, and it always brings back a lot of good memories.",
    category: "Part 1 - Snacks"
  },
  {
    id: 54,
    question: "What was the most popular snack when you were a child?",
    sampleAnswer: "Well, back in my childhood, I'd say Pepero was the most popular snack. It's a thin biscuit stick covered with chocolate, and almost every kid loved it.",
    category: "Part 1 - Snacks"
  },
  {
    id: 55,
    question: "Are there any snacks that you have never eaten that you would like to try?",
    sampleAnswer: "Yes, I'd love to try some Dubai chocolates, because I've heard they're really rich and unique in flavor.",
    category: "Part 1 - Snacks"
  },
  {
    id: 56,
    question: "Would you like to try foreign snack?",
    sampleAnswer: "Definitely! If I had the chance, I would really like to try some French snacks, because they're famous for their pastries and sweets.",
    category: "Part 1 - Snacks"
  },
  
  // Friends
  {
    id: 57,
    question: "How often do you go out with friends?",
    sampleAnswer: "I usually meet my friends once or twice a month. We often go to nice restaurants and enjoy delicious food together, which is a great way to relax.",
    category: "Part 1 - Friends"
  },
  {
    id: 58,
    question: "Tell me about your best friend at school.",
    sampleAnswer: "I remember meeting my best friend in high school. We had similar personalities and interests. For example, we both loved baseball and band music, so we often went to games and concerts together.",
    category: "Part 1 - Friends"
  },
  {
    id: 59,
    question: "How friendly are you with your neighbours?",
    sampleAnswer: "Honestly, I'm not very close with my neighbours. We usually just say hello, but we don't really hang out or talk much.",
    category: "Part 1 - Friends"
  },
  {
    id: 60,
    question: "Which is more important to you, friends or family?",
    sampleAnswer: "Well, in my opinion, family is definitely more important, because they've always been there for me and supported me in every situation.",
    category: "Part 1 - Friends"
  },
  
  // Festivals and Celebrations
  {
    id: 65,
    question: "How do you usually celebrate your birthday?",
    sampleAnswer: "I usually celebrate by going out for dinner with my friends. I like keeping it simple and spending quality time with people I care about.",
    category: "Part 1 - Festivals"
  },
  {
    id: 66,
    question: "How did you celebrate your last birthday?",
    sampleAnswer: "Last year, I remember celebrating my birthday with a nice dinner at a restaurant with friends. It was really enjoyable.",
    category: "Part 1 - Festivals"
  },
  {
    id: 67,
    question: "How do you think you will celebrate your next birthday?",
    sampleAnswer: "I'd like to spend my next birthday in Korea with my family. I think it would be really special because I don't get to see them very often.",
    category: "Part 1 - Festivals"
  },
  {
    id: 68,
    question: "What is the most important day of the year for you?",
    sampleAnswer: "That's an interesting question. For me, New Year's Day is the most important day, because it's a time to reconnect with my family and wish each other a happy and successful year ahead.",
    category: "Part 1 - Festivals"
  },
  
  // Wedding
  {
    id: 69,
    question: "Can you talk about some things people do at a traditional wedding?",
    sampleAnswer: "That's an interesting question. In my country, people usually have a ceremony where the couple exchanges vows and rings. After that, there's often a big meal with friends and family, and sometimes traditional performances like music or dancing.",
    category: "Part 1 - Wedding"
  },
  {
    id: 70,
    question: "How important is marriage in a person's life?",
    sampleAnswer: "Well, in my opinion, marriage is a really important decision because it means finding someone to spend your whole life with. For me, it's something that requires a lot of thought and commitment.",
    category: "Part 1 - Wedding"
  },
  {
    id: 71,
    question: "What is the difference of what people think about marriage compared to the past?",
    sampleAnswer: "That's an interesting question. I think in the past, people often saw marriage as a duty or even a social expectation. But nowadays, many people see it more as a personal choice, focusing on love and compatibility rather than just tradition.",
    category: "Part 1 - Wedding"
  },
  {
    id: 72,
    question: "What do people wear at a wedding?",
    sampleAnswer: "In my country, the bride usually wears a white wedding dress, while the groom often wears a suit or a tuxedo. In traditional Korean weddings, some couples also wear hanbok, which adds a cultural touch to the ceremony.",
    category: "Part 1 - Wedding"
  },
  
  // Family
  {
    id: 73,
    question: "Can you tell me about your family?",
    sampleAnswer: "My family has four members: my parents, my sister, and me. My parents run a small beauty salon, which they love doing. My sister works as an officer at city hall. We're very close and enjoy spending weekends together, like our recent barbecue party in the backyard.",
    category: "Part 1 - Family"
  },
  {
    id: 74,
    question: "How much time do you spend with your family?",
    sampleAnswer: "Honestly, these days I don't see my family much because they all live in Korea. But when I was there, we used to meet about once a month and have dinner together, which was really nice.",
    category: "Part 1 - Family"
  },
  {
    id: 75,
    question: "What do you like to do with your family?",
    sampleAnswer: "I'd say I really enjoy having a barbecue party with my family. It's a great chance to eat good food, talk, and simply spend quality time together.",
    category: "Part 1 - Family"
  },
  {
    id: 76,
    question: "Who are you closest to in your family?",
    sampleAnswer: "I'm definitely closest to my mom. She has always supported me and I feel comfortable sharing everything with her.",
    category: "Part 1 - Family"
  },
  
  // Flowers
  {
    id: 77,
    question: "Do you like flowers?",
    sampleAnswer: "Yes, I do. I think flowers are simple but beautiful, and they always make the atmosphere brighter.",
    category: "Part 1 - Flowers"
  },
  {
    id: 78,
    question: "What kinds of flowers do you like the most?",
    sampleAnswer: "I'd say I like roses the most, simply because they look elegant and they also symbolize love and affection.",
    category: "Part 1 - Flowers"
  },
  {
    id: 79,
    question: "When do people in your country normally give flowers to others?",
    sampleAnswer: "In Korea, people usually give flowers on special occasions like weddings, graduations, or even funerals. It's a way to celebrate or show respect.",
    category: "Part 1 - Flowers"
  },
  {
    id: 80,
    question: "When was the last time you gave flowers to someone?",
    sampleAnswer: "I remember giving flowers about three years ago when one of my relatives passed away. In Korea, it's common to send funeral wreaths to express condolences.",
    category: "Part 1 - Flowers"
  },
  {
    id: 81,
    question: "Are there any flowers that have special meaning to people in your country?",
    sampleAnswer: "Yes, in Korea, chrysanthemums often symbolize mourning, so they're used in funerals. On the other hand, roses are usually connected with love, and carnations are very meaningful on Parents' Day because they represent respect and gratitude.",
    category: "Part 1 - Flowers"
  },
  
  // Weather & Seasons
  {
    id: 86,
    question: "What's the weather like in your hometown?",
    sampleAnswer: "Well, I'm from Seoul, and the weather there is quite diverse. We have hot and humid summers, cold winters with some snow, and mild spring and autumn seasons.",
    category: "Part 1 - Weather"
  },
  {
    id: 87,
    question: "Would you prefer to live in a place with one season all year round, or four different seasons?",
    sampleAnswer: "I'd say I prefer living in a place with just one season. For example, I stayed in Miami for a few months, and I liked it because I didn't need many clothes and the weather was always predictable.",
    category: "Part 1 - Weather"
  },
  {
    id: 88,
    question: "Do you do different activities in different seasons?",
    sampleAnswer: "The activities vary a lot by season. In summer, people enjoy going to the beach, swimming, or having outdoor barbecues. In winter, skiing and snowboarding are very popular in the mountains. Spring is perfect for hiking or going on picnics under the cherry blossoms, while autumn is ideal for visiting national parks and enjoying the fall foliage. Each season offers a unique experience, which is one reason tourism is strong all year round.",
    category: "Part 1 - Weather"
  },
  {
    id: 89,
    question: "Does the weather have much impact on your life?",
    sampleAnswer: "Yes, the weather impacts my life a lot. For example, on sunny days, I feel energetic and go jogging in the park. But on rainy days, I stay home, maybe watching movies, and feel less active. Bad weather, like storms, can also cancel plans, such as picnics with friends.",
    category: "Part 1 - Weather"
  },
  {
    id: 90,
    question: "What sort of weather do you prefer?",
    sampleAnswer: "I prefer hot weather, mainly because it's perfect for swimming and I really enjoy outdoor activities in the sun.",
    category: "Part 1 - Weather"
  },
  {
    id: 91,
    question: "Would you prefer to go to a hot place, or a cold place for a holiday?",
    sampleAnswer: "I'd pick a hot place, like Miami, for a holiday because I love sunny weather for swimming at the beach. It feels relaxing and fun. Cold places, like a ski resort, are okay for skiing, but I find heavy winter clothes uncomfortable.",
    category: "Part 1 - Weather"
  },
  {
    id: 92,
    question: "How do rainy days make you feel?",
    sampleAnswer: "Honestly, rainy days make me feel less active. I usually stay indoors and don't feel very motivated to go out.",
    category: "Part 1 - Weather"
  },
  {
    id: 93,
    question: "What's your favourite season of the year?",
    sampleAnswer: "My favourite season is definitely summer, because I can go swimming and spend more time outdoors.",
    category: "Part 1 - Weather"
  },
  {
    id: 94,
    question: "What do you like to do when it's hot?",
    sampleAnswer: "When it's hot, I usually like to go swimming. It's refreshing and a fun way to cool down.",
    category: "Part 1 - Weather"
  },
  {
    id: 95,
    question: "What do you usually do in the winter?",
    sampleAnswer: "In the winter, I usually stay at home and watch Netflix. It's a cozy way to spend the cold season.",
    category: "Part 1 - Weather"
  },
  
  // Clothes & Fashion
  {
    id: 96,
    question: "How important are clothes and fashion to you?",
    sampleAnswer: "Well, I think clothes and fashion are quite important, because they show your personality and also help you feel confident in different situations.",
    category: "Part 1 - Fashion"
  },
  {
    id: 97,
    question: "What kind of clothes do you dislike?",
    sampleAnswer: "I don't really like wearing suits. Back in Korea, I had to wear one for work, and honestly, it wasn't very comfortable for me.",
    category: "Part 1 - Fashion"
  },
  {
    id: 98,
    question: "How different are the clothes you wear now from those you wore 10 years ago?",
    sampleAnswer: "About 10 years ago, I was more interested in fashion, so I tried many different styles. These days, though, I just dress casually and don't care too much about trends.",
    category: "Part 1 - Fashion"
  },
  {
    id: 99,
    question: "What do you think the clothes we wear say about us?",
    sampleAnswer: "That's a good question. I think the clothes we wear often show our personality, lifestyle, and sometimes even our social status. For example, someone wearing sportswear might be seen as active, while formal clothes can show professionalism.",
    category: "Part 1 - Fashion"
  },
  {
    id: 100,
    question: "Do you like shopping for clothes?",
    sampleAnswer: "Yes, I do. I usually enjoy going to outlets and buying clothes in bulk, because it saves both money and time.",
    category: "Part 1 - Fashion"
  },
  {
    id: 101,
    question: "Have you ever bought clothes that you don't like?",
    sampleAnswer: "Yes, I remember once buying a long coat because my girlfriend liked that style. But honestly, I didn't enjoy wearing it because it felt uncomfortable.",
    category: "Part 1 - Fashion"
  },
  
  // Social Network
  {
    id: 102,
    question: "What kind of social networking websites do you like to use?",
    sampleAnswer: "I mostly use LinkedIn, since it's a great platform for networking with people in the same industry, especially in software engineering.",
    category: "Part 1 - Social Network"
  },
  {
    id: 103,
    question: "Do you think social media will become more popular in the future?",
    sampleAnswer: "Of course. In my opinion, social media will keep growing, especially if platforms become more specialized. For example, LinkedIn targets professionals, and I think this kind of focus will attract even more users in the future.",
    category: "Part 1 - Social Network"
  },
  {
    id: 104,
    question: "Do you like to use Facebook?",
    sampleAnswer: "Yes, I do. I especially enjoy using the marketplace feature, because it's convenient for buying and selling second-hand items.",
    category: "Part 1 - Social Network"
  },
  {
    id: 105,
    question: "Do you feel social media is more a positive thing, or more negative thing?",
    sampleAnswer: "That's a tricky one. I'd say social media has both positive and negative sides. On the one hand, it helps people stay connected, but on the other hand, it can also cause problems like addiction or spreading misinformation.",
    category: "Part 1 - Social Network"
  },
  {
    id: 106,
    question: "Do you use social media websites?",
    sampleAnswer: "Yes, I do. I use a few different platforms, but mainly LinkedIn for professional networking and Facebook for personal use.",
    category: "Part 1 - Social Network"
  },
  
  // Swimming
  {
    id: 107,
    question: "Do you like swimming?",
    sampleAnswer: "Yes, I do. I really enjoy swimming because it's both relaxing and a good way to stay healthy.",
    category: "Part 1 - Swimming"
  },
  {
    id: 108,
    question: "What do you think are the advantages of swimming?",
    sampleAnswer: "Well, in my opinion, swimming has many advantages. It's a full-body workout, it's gentle on the joints, and it can also be a lifesaving skill.",
    category: "Part 1 - Swimming"
  },
  {
    id: 109,
    question: "Did you learn to swim when you were young?",
    sampleAnswer: "Yes, I did. I remember learning how to swim at school during PE class, and it was actually quite fun.",
    category: "Part 1 - Swimming"
  },
  {
    id: 110,
    question: "Should it be compulsory for children to learn to swim when they are at school?",
    sampleAnswer: "Yes, I think so. Swimming is not only good for health, but also an essential safety skill that can prevent accidents.",
    category: "Part 1 - Swimming"
  },
  {
    id: 111,
    question: "How do most people in your country learn to swim?",
    sampleAnswer: "In Korea, I think most people learn to swim either at school or in public sports centers. There are also many private swimming pools where children take lessons.",
    category: "Part 1 - Swimming"
  },
  {
    id: 112,
    question: "Is swimming very popular in your country?",
    sampleAnswer: "Yes, it's quite popular. Many people enjoy swimming in the summer, and indoor pools are also common, so people can swim all year round.",
    category: "Part 1 - Swimming"
  },
  
  // Noise
  {
    id: 113,
    question: "Do you mind noises?",
    sampleAnswer: "Not really. I usually don't mind everyday noises, although loud construction sounds can be a bit annoying.",
    category: "Part 1 - Noise"
  },
  {
    id: 114,
    question: "What types of noise do you come across in your daily life?",
    sampleAnswer: "Well, I often hear traffic noise, people talking in public places, and sometimes music coming from shops or cafés.",
    category: "Part 1 - Noise"
  },
  {
    id: 115,
    question: "Are there any sounds that you like?",
    sampleAnswer: "Yes, I really like the sound of rain falling. It makes me feel calm and relaxed, especially when I'm at home.",
    category: "Part 1 - Noise"
  },
  {
    id: 116,
    question: "Where can you hear loud noises?",
    sampleAnswer: "You can usually hear loud noises on busy streets, near construction sites, or at concerts and festivals.",
    category: "Part 1 - Noise"
  },
  {
    id: 117,
    question: "Do you think there's too much noise in modern society?",
    sampleAnswer: "That's an interesting question. I think in modern society, there is definitely more noise because of heavy traffic, technology, and urban development. It can sometimes affect people's health and concentration.",
    category: "Part 1 - Noise"
  },
  {
    id: 118,
    question: "Are cities becoming noisier?",
    sampleAnswer: "Yes, I believe so. As cities grow bigger with more cars and construction, the noise levels naturally increase.",
    category: "Part 1 - Noise"
  },
  
  // Outdoor activities
  {
    id: 119,
    question: "What do you do in your spare time?",
    sampleAnswer: "In my free time, I usually watch Netflix while enjoying some delicious food. It helps me relax after a busy day.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 120,
    question: "Do you like outdoor activities?",
    sampleAnswer: "Yes, I do. I think outdoor activities are a great way to stay active and enjoy nature.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 121,
    question: "What outdoor activities do you like to do?",
    sampleAnswer: "I usually enjoy hiking and swimming, because they keep me healthy and give me a chance to spend time in nature.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 122,
    question: "How often do you do that?",
    sampleAnswer: "When I lived in Vancouver, I went hiking about once or twice a month because there were so many mountains nearby. But now in Montreal, I don't know the places well yet, so I haven't gone much.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 123,
    question: "What outdoor sports do you like?",
    sampleAnswer: "I like swimming and hiking the most, since they combine fitness with enjoying the outdoors.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 124,
    question: "How much time do you spend outdoors every week?",
    sampleAnswer: "On average, I'd say I spend about four to six hours outdoors each week, depending on the weather and my schedule.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 125,
    question: "What outdoor activities are popular in your country?",
    sampleAnswer: "In Korea, hiking is extremely popular because there are so many mountains. People also enjoy jogging, cycling, and playing soccer in parks.",
    category: "Part 1 - Outdoor Activities"
  },
  
  // Painting
  {
    id: 126,
    question: "Do you like painting or drawing?",
    sampleAnswer: "Not really. I don't draw very often, but I can still appreciate art when I see it.",
    category: "Part 1 - Painting"
  },
  {
    id: 127,
    question: "How often do you visit art galleries?",
    sampleAnswer: "Honestly, I don't visit them very often, maybe once or twice a year when there's a special exhibition.",
    category: "Part 1 - Painting"
  },
  {
    id: 128,
    question: "What kinds of things do you like to draw?",
    sampleAnswer: "If I do draw, I usually like to sketch simple things like nature scenes or small objects. But I'm not very skilled at it.",
    category: "Part 1 - Painting"
  },
  {
    id: 129,
    question: "Is it easy to learn how to draw?",
    sampleAnswer: "Well, I think drawing is not very easy. It takes a lot of practice and patience, although some people seem to have a natural talent for it.",
    category: "Part 1 - Painting"
  },
  
  // General Questions
  {
    id: 130,
    question: "Do you work or study at the moment?",
    sampleAnswer: "At the moment, I'm working in the software engineering field. It keeps me busy but also challenges me in a good way.",
    category: "Part 1 - General"
  },
  {
    id: 131,
    question: "What do you like doing in your free time?",
    sampleAnswer: "In my free time, I like to relax by watching Netflix or trying out new restaurants with friends.",
    category: "Part 1 - General"
  },
  {
    id: 132,
    question: "What type of photos do you like taking?",
    sampleAnswer: "I usually like taking photos of nature, like sunsets, beaches, and mountains, because they look beautiful and peaceful.",
    category: "Part 1 - General"
  },
  {
    id: 133,
    question: "What do you do with the photos you take?",
    sampleAnswer: "Most of the time, I just keep them on my phone, but sometimes I share them on social media with friends.",
    category: "Part 1 - General"
  },
  {
    id: 134,
    question: "When you visit other places, do you take photos or buy postcards?",
    sampleAnswer: "I usually take photos, because it feels more personal and captures the exact moment I experienced. Postcards don't really have that personal touch.",
    category: "Part 1 - General"
  },
  {
    id: 135,
    question: "Do you like people taking photos of you?",
    sampleAnswer: "Not really. I don't feel very comfortable in front of the camera, so I prefer taking photos of others or landscapes instead.",
    category: "Part 1 - General"
  },
  
  // Others
  {
    id: 136,
    question: "Talk about where you live",
    sampleAnswer: "I've been living in Montreal for three months now, and I really enjoy its vibrant vibe, with lots of shops, cozy cafes, and great public transport. Since French is the primary language here, it's a fantastic place to learn it, and I'm taking part-time French classes, which is fun but challenging.",
    category: "Part 1 - Others"
  },
  {
    id: 137,
    question: "Are you a student or do you work?",
    sampleAnswer: "I'm currently a software engineer, and I've been working in this field for eight years. My job involves designing and developing software applications, which I find it really fulfilling. I enjoy it because it's challenging and allows me to solve complex problems every day.",
    category: "Part 1 - Others"
  },
  {
    id: 138,
    question: "Talk about your job/studies",
    sampleAnswer: "I work as a senior software engineer, and my main role is to oversee the entire software development process. This includes designing applications, writing code, testing features, and deploying them to the production environment. I also enjoy mentoring junior developers, helping them improve their skills, which is really rewarding.",
    category: "Part 1 - Others"
  },
  {
    id: 139,
    question: "Where do you like to go on holiday?",
    sampleAnswer: "During holidays, I love spending time in a coffee shop. I enjoy the cozy atmosphere, sipping coffee while managing my upcoming schedule or working on side projects. It helps me stay focused and makes my holiday feel both productive and relaxing.",
    category: "Part 1 - Others"
  },
  {
    id: 140,
    question: "Do you have any hobbies?",
    sampleAnswer: "Yes, one of my favorite hobbies is watching Korean dramas on Netflix, especially shows like Squid Game because they're so exciting and well-produced. It's a great way for me to unwind after a long day, and I really enjoy how the English subtitles help me pick up new vocabulary.",
    category: "Part 1 - Others"
  },
  {
    id: 141,
    question: "What do you normally do in the evening?",
    sampleAnswer: "In the evening, I usually stay at home and watch Netflix. It helps me relax after a long day, and I find it quite enjoyable. Another reason I like doing this is that Netflix offers subtitles in different languages, so I often watch shows with English subtitles. That way, I can both enjoy the story and improve my language skills at the same time.",
    category: "Part 1 - Others"
  },
  {
    id: 142,
    question: "What are you studying at the moment?",
    sampleAnswer: "I'm studying Business Administration at University. It's a broad subject that covers everything from marketing to accounting, which I find really useful for my future career.",
    category: "Part 1 - Study"
  },
  {
    id: 143,
    question: "Why did you choose that subject?",
    sampleAnswer: "I've always been interested in how businesses operate and grow. Also, my father is a businessman, and seeing him work inspired me to follow in his footsteps and learn the ropes of running a company.",
    category: "Part 1 - Study"
  },
  {
    id: 144,
    question: "Do you enjoy your subject?",
    sampleAnswer: "Yes, I do. Although some modules like statistics can be quite challenging and dry, I really enjoy the practical side of things, like analyzing case studies of successful startups.",
    category: "Part 1 - Study"
  },
  {
    id: 145,
    question: "What do you hope to do in the future when you finish?",
    sampleAnswer: "After I graduate, I'm planning to work for a multinational corporation to gain some experience. Eventually, my long-term goal is to start my own small business in the hospitality industry.",
    category: "Part 1 - Study"
  },
  {
    id: 146,
    question: "How often do you buy gifts for other people?",
    sampleAnswer: "I don't buy gifts very often, usually only for special occasions like birthdays, Christmas, or anniversaries. I prefer to put a lot of thought into one good gift rather than buying lots of small things.",
    category: "Part 1 - Gifts"
  },
  {
    id: 147,
    question: "Do you like giving gifts?",
    sampleAnswer: "I love giving gifts! It's such a great feeling to see someone's face light up when they open something they really wanted. I think it’s a wonderful way to show people that you care about them.",
    category: "Part 1 - Gifts"
  },
  {
    id: 148,
    question: "What was the last gift you received?",
    sampleAnswer: "The last gift I got was a new watch from my parents for my graduation. It’s a classic silver design and I wear it every day. It's very sentimental to me.",
    category: "Part 1 - Gifts"
  },
  {
    id: 149,
    question: "When was the last time you gave a gift to someone?",
    sampleAnswer: "It was just last week. It was my best friend's birthday, so I bought her a voucher for a spa day because she’s been feeling quite stressed with work lately. She was really happy with it.",
    category: "Part 1 - Gifts"
  },
  {
    id: 150,
    question: "Is it difficult to choose a gift for someone?",
    sampleAnswer: "It can be, especially if you don't know the person very well. But if it's for a close friend or family member, I usually have a good idea of what they like. I think the trick is to listen to them throughout the year for any hints!",
    category: "Part 1 - Gifts"
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
    sampleAnswer: "One type of weather I really enjoy is hot and sunny weather. Bright sunshine and warm temperatures always put me in a good mood.\n\nI usually experience this weather when I visit Miami, Florida, which is famous for its beaches and tropical climate. The sun is almost always shining there, and the warmth near the ocean feels very inviting.\n\nDuring this weather, I love swimming, relaxing by the water, or fishing with friends. It's a perfect way to enjoy the outdoors and the lively atmosphere of the city.\n\nI like hot and sunny weather because it makes me feel energetic and carefree. I can wear light clothes comfortably, spend time outdoors, and it just leaves me with happy memories.",
    category: "Part 2 - Weather",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of weather do people in your country like?",
        sampleAnswer: "In my country, people generally prefer mild weather. Most people enjoy spring and autumn because the temperature is comfortable and pleasant. However, some people also like summer for outdoor activities like swimming and hiking."
      },
      {
        id: 2,
        question: "Do you think weather affects people's mood?",
        sampleAnswer: "Yes, I think weather definitely affects people's mood. When it's sunny and warm, people tend to be more cheerful and energetic. On the other hand, when it's rainy or cloudy for many days, people might feel a bit down or less motivated."
      },
      {
        id: 3,
        question: "How has the weather changed in recent years?",
        sampleAnswer: "I think the weather has become more unpredictable in recent years. We're experiencing more extreme weather conditions, like hotter summers and more frequent heavy rain. This might be related to climate change."
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
    sampleAnswer: "A place I would really like to visit is Japan, specifically Tokyo. I've always been fascinated by Japanese culture, technology, and cuisine.\n\nI know about this place through various sources - documentaries, travel shows, and friends who have visited. I've also read about its rich history and modern innovations.\n\nIf I could visit, I would explore the traditional temples and shrines, try authentic Japanese food like sushi and ramen, visit the famous Shibuya crossing, and experience the unique blend of old and new that Tokyo offers.\n\nI want to visit Japan because it represents the perfect balance between preserving tradition and embracing innovation. The culture seems so different from what I'm used to, and I think it would be an eye-opening experience.",
    category: "Part 2 - Place",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of places do people in your country like to visit?",
        sampleAnswer: "People in my country generally like to visit places with beautiful nature, such as mountains, beaches, and national parks. They also enjoy visiting historical sites and cultural landmarks. Recently, many people are also interested in visiting trendy cafes and restaurants."
      },
      {
        id: 2,
        question: "Do you think it's better to travel alone or with others?",
        sampleAnswer: "I think both have their advantages. Traveling alone gives you more freedom and flexibility to do exactly what you want. However, traveling with others can be more fun and safer, especially in unfamiliar places. It also allows you to share experiences and create memories together."
      },
      {
        id: 3,
        question: "How has tourism changed in recent years?",
        sampleAnswer: "Tourism has changed significantly in recent years. Technology has made it easier to plan trips with online booking and travel apps. Social media has also influenced where people want to visit. However, the COVID-19 pandemic has had a major impact on international travel."
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
    sampleAnswer: "The person I admire is the Queen Elizabeth II of the UK. She just turned to 90 years old this year, and she has been the queen of England for the longest period, 63 years altogether.\n\nThe queen visited Korea in 1999, when I was a child. It was big news for Korean people, and I watched news programmes on TV while she was staying in Korea. After that, I went to study in England, and read news, books, and journals about her and royal family so I got to know her more.\n\nWell, to be honest, I'd like to ask her some questions like how she feels, what her hobbies are - just ordinary stuff like I'm talking to my friend. Maybe we could have some tea, and talk to each other if possible.\n\nI admire her because she spent all of her life-time as the queen. I heard that she didn't want to be the queen of England when she was young as the role is a big burden for her. However after all, she did a great job to make England as one of the most powerful countries in the world. Also I think she is not afraid of trying new things out, which I am weak at. An article I read showed a picture of her using iPhone, and she is an early-adapter. It was quite surprising for me as I thought she would only respect tradition. I think that she is very open to new things. That's probably why she is beloved by many people.",
    category: "Part 2 - People",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: "I think business people are most likely to choose to travel by plane because they need to save time and travel frequently. Also, people who can afford it and want convenience often choose planes. Some people who are afraid of other transportation methods also prefer planes."
      },
      {
        id: 2,
        question: "What do you think about travelling by plane?",
        sampleAnswer: "I think travelling by plane has both advantages and disadvantages. The obvious advantages are speed and convenience - you can travel long distances quickly. However, it can be expensive, and some people feel uncomfortable with the security procedures and potential delays."
      },
      {
        id: 3,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Living near an airport has advantages like easy access to travel and often good transport connections. However, there are disadvantages like noise pollution from planes taking off and landing, and sometimes air pollution. Also, the area might be more expensive to live in."
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
    sampleAnswer: "A person I would like to meet from the news is Elon Musk. He is the CEO of Tesla and SpaceX, and he's known for his innovative work in electric cars and space exploration.\n\nI know about him through various news sources, social media, and documentaries. I've been following his work for several years, especially his efforts to make electric vehicles more accessible and his ambitious plans for Mars colonization.\n\nI would like to meet him because I'm fascinated by his vision for the future and his ability to turn ambitious ideas into reality. I think he would have interesting insights about technology, innovation, and the future of transportation and space travel. It would be amazing to hear his thoughts firsthand and ask him about his future plans.",
    category: "Part 2 - Plane",
    part3Questions: [
      {
        id: 1,
        question: "Do you think planes will have a negative influence in your country?",
        sampleAnswer: "Yes, it could have a negative impact. Yes, it might lead to severe effects, such as increased crime. Obsession with celebrities could cause depression. Some, especially business people, prefer traveling abroad."
      },
      {
        id: 2,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: "Newly married couples or those with specific preferences. Famous actors or global celebrities. And explain why they choose planes (e.g., time-saving)."
      },
      {
        id: 3,
        question: "Have you ever been to the UK?",
        sampleAnswer: "Some get travel opportunities, which can be intriguing. Discuss pros and cons of transport options. It's a complex question to address fully."
      },
      {
        id: 4,
        question: "What kinds of news are popular in your country?",
        sampleAnswer: "Celebrity news tends to draw attention. Stories about celebrities are widely followed. Interest in lives of those traveling to the USA or UK."
      },
      {
        id: 5,
        question: "What do you think about traveling by plane?",
        sampleAnswer: "Highlight the clear advantages of plane travel. Some travel for convenience, though it may not always feel typical. It can be time-consuming, with visits to other locations for various reasons."
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
    sampleAnswer: "A celebrity I really admire is Tom Hanks. He is one of the most respected actors in Hollywood, known for his versatile performances in films like Forrest Gump, Cast Away, and The Green Mile.\n\nI know about him through his movies, interviews, and various media appearances. I've been watching his films since I was a child, and I've always been impressed by his ability to portray such diverse characters convincingly.\n\nI admire him because he seems like a genuinely good person both on and off screen. He's known for his professionalism, kindness, and positive attitude. Despite his fame, he appears to be humble and down-to-earth. I also respect his work ethic and the way he chooses meaningful projects that often have positive messages.",
    category: "Part 2 - Celebrity/News",
    part3Questions: [
      {
        id: 1,
        question: "What's the difference between broadcasting news in the past and in the present?",
        sampleAnswer: "Compare broadcasting with the press. Interesting news often takes precedence. Examples like USA and Canada business contexts."
      },
      {
        id: 2,
        question: "Why do you think people are so interested in celebrities' lives?",
        sampleAnswer: "Interest may grow from hearing about them during plane trips. Famous people offer more details to explore. The time spent learning about them adds to the fascination."
      },
      {
        id: 3,
        question: "What methods do you use to get news?",
        sampleAnswer: "Desire to meet someone due to their life story. Travel time example: Seoul to Busan (up to 3 hours). Compare plane travel with buses or trains."
      },
      {
        id: 4,
        question: "Do you believe everything said in the news?",
        sampleAnswer: "Not fully; skepticism is common. Shopping facilities near airports are notable. Censored or suppressed information by authorities."
      },
      {
        id: 5,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Access to a dynamic environment is a plus. Noise pollution is a significant downside."
      },
      {
        id: 6,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: "It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences."
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
    sampleAnswer: "A news story that really interested me was about the successful landing of NASA's Perseverance rover on Mars in 2021. This was a major achievement in space exploration.\n\nI heard about this news in February 2021 when it was all over the media. It was a significant milestone in space exploration, and I was fascinated by the technology and engineering involved.\n\nI found out about it through various news sources, including social media, news websites, and television coverage. The story was everywhere because it was such a remarkable achievement.\n\nThis news interested me because I've always been fascinated by space exploration and the possibility of finding evidence of life on other planets. The technology involved in landing a rover on Mars is incredibly complex, and I was amazed by the scientists' ability to accomplish this feat. It also made me think about the future of space travel and what other discoveries might be possible.",
    category: "Part 2 - The News",
    part3Questions: [
      {
        id: 1,
        question: "Do you think the news will have a negative influence?",
        sampleAnswer: "Yes, negative news can impact people. Watching TV news might lead to depression. Curiosity about celebrities drives interest."
      },
      {
        id: 2,
        question: "What kinds of news do you think are popular in your country?",
        sampleAnswer: "Celebrity news is generally popular. People are keen to know about others' lives. Excessive news coverage influences various aspects."
      },
      {
        id: 3,
        question: "What's the difference between the news in the past and the present?",
        sampleAnswer: "Compare broadcasting with the press. Interesting news often comes first. Examples like USA and Canada business contexts."
      },
      {
        id: 4,
        question: "Why do you think people are so interested in news?",
        sampleAnswer: "Interest may stem from plane travel experiences. Famous people provide more details to explore. The time investment adds to the appeal."
      },
      {
        id: 5,
        question: "What methods do you use to get news nowadays?",
        sampleAnswer: "Desire to meet someone based on their life story. Travel time example: Seoul to Busan (up to 3 hours). Comparisons between plane, bus, or train travel."
      },
      {
        id: 6,
        question: "Do you believe everything said in the news?",
        sampleAnswer: "Not fully; trust varies. Shopping facilities near airports are a feature. Censorship by authorities can affect content."
      },
      {
        id: 7,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Access to a dynamic environment is a plus. Noise pollution is a significant downside."
      },
      {
        id: 8,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: "It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences."
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
    sampleAnswer: "A foreign language I would really like to learn is Spanish. I think it's a beautiful and widely spoken language that would open up many opportunities for me.\n\nI would learn it through various methods - taking formal classes, using language learning apps, watching Spanish movies and TV shows, and practicing with native speakers. I believe immersion is the best way to learn a language effectively.\n\nI want to learn Spanish because it's spoken by millions of people around the world, especially in many countries in Latin America and Spain. It would be incredibly useful for travel, business, and cultural exchange.\n\nLearning Spanish would be very useful for me because it would enhance my career prospects, especially if I work in international business or tourism. It would also allow me to communicate with Spanish-speaking communities and understand their culture better.",
    category: "Part 2 - Foreign Language",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: "Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes."
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: "In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture."
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: "Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly."
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: "Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information."
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
    sampleAnswer: "Around 3-4 years ago, I tried a new food for the first time at a new Spanish restaurant in Korea. The food was Paella, specifically the seafood one.\n\nIt looked like some kinds of stir-fried rice, but it was really new and exotic, not like Korean or European food. It actually tasted more like risotto. The rice wasn't that dry, and the seafood like shrimps and mussels were amazing. It was a bit salty but scrumptious. I finished it in about 10 minutes.\n\nI absolutely fell in love with Spanish cuisine including Paella, tapas, and others. It was very different to what I expected before I tried but it was truly awesome. I really liked everything we tried on that day and thought it would be wonderful if I really go to Spain and try the local food.",
    category: "Part 2 - Food",
    part3Questions: [
      {
        id: 1,
        question: "In your country, what are the most common (or, popular) food that people eat?",
        sampleAnswer: "I'd definitely say Korean traditional food is most common and popular in Korea. Also another booming one would be Italian as lots of Korean women like to eat Italian food, but generally speaking, it really depends on every individual."
      },
      {
        id: 2,
        question: "Do you think adults and children have the same attitudes towards food?",
        sampleAnswer: "I don't quite think so. It seems like adults eat food for survival. They need to get energy to work hard for the day but children tend not to eat something bitter or they don't like. Children usually only want to eat something sweet or delicious ones. Well, of course some adults do the same, but generally they tend to eat more healthily."
      },
      {
        id: 3,
        question: "Do you think it's important for adults to teach children concerning the food we eat?",
        sampleAnswer: "Absolutely. Adults should teach children everything from food to attitudes towards it. Children should realise the importance of nutrients rather than taste of a certain food, and also they need to learn about manners when eating food. I believe by teaching children about the food we eat, children can definitely pay attention not only to food but also something further like the environment or the animals."
      },
      {
        id: 4,
        question: "In general, would you say people in your country are willing to try new food?",
        sampleAnswer: "Not everyone though. It totally depends on their characteristics but I think some youngsters are adventurous enough to try new food nowadays. When something becomes trendy, people tend to try new things including food but not everyone."
      },
      {
        id: 5,
        question: "Who do you think is more willing to try a new food, children or adults?",
        sampleAnswer: "I'd say adults. From my surroundings, children only try something they already had before or tastes good. But as there are lots of adolescents and adults who have interests in other cultures, they are more open to try a new food when they have a chance."
      },
      {
        id: 6,
        question: "What kinds of foreign food are most common (or, most popular) in your country?",
        sampleAnswer: "Maybe Chinese or Japanese, I suppose. There are massive numbers of restaurants sell those food and also Italian is very famous one, too. Also nowadays, European cuisines are booming in Korea so lots of pubs and restaurants launched in many towns in Seoul."
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
    sampleAnswer: "Actually I faced a situation which made me quite angry last week. It was last week, at the bus stop. I was heading to my home when I finished the work. Before it happened, it was quite a tough day for me as I had lots of things to finish on that day.\n\nWhen I arrived at the bus stop, it was very crowded with lots of people as there are 5 or 6 bus stops altogether. There were like at least 50 people waiting for their buses, so I found mine then joined the queue. At that time, I was on my own, listening to music while waiting for the bus, and waited for about 20 minutes.\n\nThen when the bus came towards the stop, a young girl suddenly came up somewhere and jumped in the queue right before me. I was so annoyed since I waited for 20 minutes, and there were tons of people behind me. I'm sure most people felt the same thing as me. So people started to yell at her, then she went back of the queue at the end. It was such a frustrating situation, and hope not to experience such thing again.",
    category: "Part 2 - Anger",
    part3Questions: [
      {
        id: 1,
        question: "What would you do if you make others angry at you?",
        sampleAnswer: "Well, if it happens, I tend to talk to them first to sort the problem out. I just try to find out what they think and what made them upset, then apologise when it comes to my fault. But if they are just being aggressive, I just ignore them."
      },
      {
        id: 2,
        question: "In what ways can people manage their anger well?",
        sampleAnswer: "Maybe they can take deep breath first of all. They can think over the situation that made them upset then take an action. Also people can enjoy things that will make them feel lifted. In my case, I tend to control my anger by watching something funny."
      },
      {
        id: 3,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: "Yes, most definitely. I believe that working late at night will negatively affect the next day's work. It can lead to fatigue, reduced productivity, and difficulty concentrating. For example, I once had to attend a meeting at 10 AM, but I had worked until 2 AM the previous night. As a result, I was exhausted and struggled to focus during the meeting. I ended up making several mistakes and felt very frustrated. Since then, I try to avoid working late at night whenever possible."
      },
      {
        id: 4,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: "I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study."
      },
      {
        id: 5,
        question: "What kinds of things make people angry?",
        sampleAnswer: "I think people get angry for various reasons. Some common triggers include unfair treatment, disrespect, long waiting times, and when others don't follow rules or social norms. Also, stress from work or personal life can make people more easily irritated."
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
    sampleAnswer: "When I was 14 years old, I went to England to study so that was the first moment I communicated in a foreign language. A minute after the airplane landed at Heathrow airport in London, I was so excited and everything looked so different. Then I faced really big challenge, I had to talk in English at the immigration inspection.\n\nI was all alone and got to talk to one of the staffs and she seemed not happy as I couldn't really speak English much. She came up with some basic questions like what my purpose of entry is, how long I am going to stay in England, and other questions related to immigration. I was very nervous and couldn't really think of good answers so I mumbled a lot. I don't clearly remember what I really said, but I assume my answers were not quite relevant to the situation. It was like a nightmare. There was huge queue behind me, the immigration officer was staring at me, and I was scared by the situation so couldn't even speak a single thing. So she made me to stay at the airport for like 5 hours until a translator came.\n\nIt was quite embarrassing experience. I felt really embarrassing while sitting in the immigration office. I thought it happened because I wasn't good at English so kind of decided to study hard. Also I felt quite scary. I thought that I would be sent to Korea straight after I reached England, and actually saw a few people going back to their country because they couldn't obtain visa on that day. So I felt really nervous until I came out of the airport, I didn't want to go back on the first day I arrived in England. After that, I never had the same experience, and don't want to experience similar situation whenever I travel.",
    category: "Part 2 - Foreign Language Communication",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: "Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes."
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: "In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture."
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: "Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly."
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: "Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information."
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
    sampleAnswer: "Well, there was a moment that I had to change my schedule because of heavy storm while I was studying at the university. I was supposed to meet a pen friend in London, who was visiting for the first time. I had meticulously planned her visit, including places to see and where to eat, aiming for her to have a good time.\n\nI hoped for pleasant and warm weather for her visit in March. Before her arrival, the weather was not bad compared to normal British weather, with no strong wind, sunny skies, and no rain for weeks.\n\nUpon her friend's arrival, the weather turned really bad. A strongest storm in 30 years was about to hit, and it started raining cats and dogs, continuing throughout her visit.\n\nI felt really frustrated because my plans to visit many tourist attractions became useless. As someone who dislikes changing plans, I found it quite stressful and get really upset whenever I have to change something from my plan even though it's because of the weather. However, there was a positive side: we could talk, enjoy the view of rainy London, and felt quite relaxed. We managed to take some pictures of the London Eye and Big Ben and had a lovely dinner together. Although the weather wasn't perfect, it was not a bad day.",
    category: "Part 2 - Weather Plans",
    part3Questions: [
      {
        id: 1,
        question: "What kind of weather do people in your country prefer?",
        sampleAnswer: "Definitely warm and pleasant weather. As the weather in Korea changes by the season, the weather in summer or winter is quite extreme. So people seem to prefer the weather in spring. The weather in spring is normally warm, sunny, and gentle breeze make people want to go outside."
      },
      {
        id: 2,
        question: "In general, do people in your country pay attention to the weather forecasts?",
        sampleAnswer: "Generally speaking, most Korean people watch weather forecasting reports on TV every day. For businessmen, they tend to watch it because they can estimate the traffic if it's raining or snowing. Also if people plan to do some outdoor activities, they pay extra attention to it since they want very pleasant weather when they go out."
      },
      {
        id: 3,
        question: "Which people do you think pay more attention to the weather than other people?",
        sampleAnswer: "The first one came up on my mind is the ones who work outside like builders as they spend majority of their time working outside. Also maybe salesman or taxi drivers might be the ones as they have to drive all day."
      },
      {
        id: 4,
        question: "Are weather forecasts in your country usually accurate?",
        sampleAnswer: "When it rains or snows, they are mostly accurate and reliable. But in most cases, they aren't. I think they broadcast wrong information once in five times at least, and most people don't quite believe the weather information they provide."
      },
      {
        id: 5,
        question: "What different activities do people do in different seasons?",
        sampleAnswer: "In sports wise, people go for water sports in summer, for instance, swimming, wakeboarding, and water skiing. And I think people tend to travel more in summer as most companies provide annual holiday at that season. In winter, winter sports such as skiing and snowboarding are very popular amongst Korean people so many people go and enjoy different activities in different seasons."
      },
      {
        id: 6,
        question: "Can you think of some examples of how the weather can have an impact on people doing certain jobs?",
        sampleAnswer: "I'd say constructors are the ones whose job is dependent on the weather. They normally work outside in order to build buildings, so it's unlikely for them that they can continue with their work when it rains or snows. Also electricians might be the ones as their job is highly risky when the weather is bad. So they might not be able to do their work."
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
    sampleAnswer: "I'm actually quite used to getting up early in the morning but I think I got up around 4 in the morning to catch a train around 5 years ago. I thought it would be like a nightmare because I never woke up that early before.\n\nOn that specific day, I had to attend a business meeting which was held in Birmingham. As I was travelling by a train with one of my colleagues, we had to book the tickets in advance. Strangely, most trains were fully booked so only one that we could find seats was departing at 5:20 in the morning. Of course we couldn't miss the meeting so had to take that train so we met at Waterloo station at around 4:40 am. I was quite afraid of myself becoming too exhausted in the meeting since I woke up too early.\n\nWell, although I'm a morning person, I never got up before 5 in the morning so it was quite tired. At first when I left home, everywhere was so quiet and dark so I couldn't really see a thing. It was truly odd to walk a street where there's no one around. And even my colleague and I managed to sleep on the train, we were exhausted when we got back to London. I thought the day passes really slowly. Also I quite liked the atmosphere of the early morning. It was really dark and chilly, but I felt I'm quite lively and pleased. So even I woke up really early, I think the day wasn't that bad as I expected.",
    category: "Part 2 - Getting Up Early",
    part3Questions: [
      {
        id: 1,
        question: "Who usually get up early, young people or old people?",
        sampleAnswer: "Probably old people, I presume. Young people tend to stay up until late night so they usually sleep until late morning, or even midday. But most old people wake up early in the morning and start their day earlier than young ones. I think as people grow older, they have to wake up early in the morning."
      },
      {
        id: 2,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: "Yes, definitely. Normally when people work until late night, they can't concentrate much and feel more tired on the next day. It wouldn't make them to be productive or work hard like the other days."
      },
      {
        id: 3,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: "I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study."
      },
      {
        id: 4,
        question: "Is it easy to get up early for you?",
        sampleAnswer: "Yes, I wake up around 5 in the morning every day even in the weekends. When I get up early, I can do more things on that day. And as I prefer to work in the morning, I tend not to sleep long."
      },
      {
        id: 5,
        question: "What do you do to guarantee a good sleep?",
        sampleAnswer: "I use eye sleeping shades when it's noisy or bright. I turn everything off around me to sleep well. I aim for a good sleep every night, typically for around 3 to 4 hours, as I sleep relatively shorter hours. It's rare for me not to sleep well, but when struggling, I drink warm tea or milk to relax."
      },
      {
        id: 6,
        question: "Can you sleep well if there is noise around?",
        sampleAnswer: "No, not at all. I am very sensitive at noise and can't sleep at all if there's any noise around. When I'm really tired or need good sleep, I sometimes use earplugs to sleep deeply."
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
    sampleAnswer: `Last September, I went to Osaka for 3 days with my family. Actually I had planned for this holiday for whole year, so I was really excited before I go there. I looked up on the internet and found some tourist attractions, restaurants, and shopping areas. The minute after I got out from the airplane, I was very surprised because the airport was really crowded although it was out of the season.

For those 3 days, we visited lots of places including Kyoto which is located near to Osaka. Well, to be honest, it wasn't like my expectation but it was still good because everything looked so new to me, and Japanese food was amazing. The best place for me was Dotonbori, which is a famous shopping street in Osaka, and I could buy some souvenirs for my friends there and we spent loads of hours on shopping.

The trip was special for me as it was the first time to visit Japan. I've always dreamed of visiting Japan when I was staying in England as my Japanese friends told me good things about the country. Actually it was hard to communicate because most of Japanese people couldn't speak English, but most of them were really kind. Also it was good to spend time with my family. Since I lived in different country for a long time, it was really difficult to travel with them, and it turned out to be great. And I experienced something special on this trip. I bought a scarf in a department store, and I realised I lost it after a while, then when I revisited the department store and asked one of staffs, they found it somewhere in there then left it in lost property centre. It was really unforgettable experience because I didn't expect to find it, but the staffs were so kind, and I still remember it as a special experience. If I have another chance, I'll definitely revisit Japan.`,
    category: "Part 2 - Traveling",
    part3Questions: [
      {
        id: 1,
        question: "Do people in your country like to travel away from home when they have a holiday?",
        sampleAnswer: "It seems like people tend to spend their holiday somewhere else, not their home. In Korea, travelling abroad is getting more and more popular nowadays, and it's still popular to travel around within the country, but definitely away from home."
      },
      {
        id: 2,
        question: "Do young people generally prefer to spend holidays with their family, or with their friends?",
        sampleAnswer: "Young generations nowadays prefer to go on holidays with their friends more, I believe. From my surroundings, I saw lots of young ones who spend their holidays with friends and they actually like going on a holiday with someone who have the same interests."
      },
      {
        id: 3,
        question: "Can you think of any advantages in having short holidays?",
        sampleAnswer: "It's a good way to chill out from busy life for a while without worrying too much about coming back after the holiday. Mini-breaks make people relaxed even for a short while and they can get rid of their stress. Also people can have some anticipation on their short breaks and it will lead to greater productivity at work."
      },
      {
        id: 4,
        question: "Which do you prefer, several short holidays or just a few long holidays (vacations) during the year?",
        sampleAnswer: "I prefer to have a few long holidays as I can't really do or travel in short breaks. I like travelling and whenever I travel, I tend to spend at least a week in a certain destination to see the most, so I'd rather have some long holidays, not short ones."
      },
      {
        id: 5,
        question: "Can you explain how people benefit from having a holiday from work or study?",
        sampleAnswer: "Well, obviously they can relax for a bit, and make themselves refreshed by having a holiday. Also it can be one of motivations they can have. People could work harder and will probably set short goals in order to have holidays."
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
    sampleAnswer: `Well, I can remember when I was in England. I was travelling to one of the towns in Cotswold from London, but I forgot the name of the town. It was a lovely town with some old British cottages, and I think it took around 5 hours by a coach. I found the journey itself really boring. I travelled with my mother, and although we brought some snacks to eat, it felt really long.

The trip was great actually. We had wonderful time in that town, enjoyed lovely view of British countryside. Also local people there were very kind throughout the trip. My mother and I managed to look around everywhere in town, and we loved the time we spent on that day. Also I was quite surprised as it was very convenient and comfortable to travel by a coach. At that time, I only took a coach to go to the airport or to go somewhere near London so it was actually my first time to take a long journey. However, the problem was on the way back to London. There was a baby on the coach, and the baby cried for whole 5 hours. It was driving me crazy, and we ended up having a headache. As the trip itself was gorgeous, I would like to visit there again if I have another chance.`,
    category: "Part 2 - Traveling",
    part3Questions: [
      {
        id: 1,
        question: "Do people in your country like to travel away from home when they have a holiday?",
        sampleAnswer: "It seems like people tend to spend their holiday somewhere else, not their home. In Korea, travelling abroad is getting more and more popular nowadays, and it's still popular to travel around within the country, but definitely away from home."
      },
      {
        id: 2,
        question: "Do young people generally prefer to spend holidays with their family, or with their friends?",
        sampleAnswer: "Young generations nowadays prefer to go on holidays with their friends more, I believe. From my surroundings, I saw lots of young ones who spend their holidays with friends and they actually like going on a holiday with someone who have the same interests."
      },
      {
        id: 3,
        question: "Can you think of any advantages in having short holidays?",
        sampleAnswer: "It's a good way to chill out from busy life for a while without worrying too much about coming back after the holiday. Mini-breaks make people relaxed even for a short while and they can get rid of their stress. Also people can have some anticipation on their short breaks and it will lead to greater productivity at work."
      },
      {
        id: 4,
        question: "Which do you prefer, several short holidays or just a few long holidays (vacations) during the year?",
        sampleAnswer: "I prefer to have a few long holidays as I can't really do or travel in short breaks. I like travelling and whenever I travel, I tend to spend at least a week in a certain destination to see the most, so I'd rather have some long holidays, not short ones."
      },
      {
        id: 5,
        question: "Can you explain how people benefit from having a holiday from work or study?",
        sampleAnswer: "Well, obviously they can relax for a bit, and make themselves refreshed by having a holiday. Also it can be one of motivations they can have. People could work harder and will probably set short goals in order to have holidays."
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
    sampleAnswer: `I don't really have clear image of the house I would like to live in, but I want to live in a house in an unspoilt countryside. I don't mind of living in any countries. I've been living in a city for a long time, and don't want to carry on living there. And I had really good experience of living in a countryside when I was a child. My dream house doesn't need to be huge, only thing I want to have is a garden. Of course there will be some rooms, bathroom and kitchen, but I've always dreamed of having a house with a garden so that I can grow some vegetables, raise some pets, and so on. Hopefully, I would like it to happen in next 10 years. I have to work hard to make it happen. I'd like to live in this house because I'm quite tired of living in a city now. Since I graduated my secondary school, I always lived in the heart of city, or suburbs. So city-life is not new to me anymore. I think it's good time to move into countryside in next 10 years. Also I really want to keep a lot of pets. It has been my dream for years, but as I've been living in apartments, it never happened. So if I have a chance, I'll definitely live in a house, possibly in countryside.`,
    category: "Part 2 - Housing",
    part3Questions: [
      {
        id: 1,
        question: "What type of home do most people in your country live in?",
        sampleAnswer: "Most Korean live in a flat or an apartment. I think more people move into the cities because of their jobs or works, then most accommodations in cities are apartments. If it's countryside, people normally live in houses."
      },
      {
        id: 2,
        question: "What do you think are the differences between living in a house, compared to living in an apartment?",
        sampleAnswer: "Probably sharing facilities with neighbours would be a major difference. For example, there are gyms, parks, and some shops in modern apartments in Korea, so all the residents have to share all those facilities. But people who live in their own house don't need to worry about such things. In most Korean apartments, there are security guards for residents so they can be ensured with their own safety. But people living in a house can't have such services. Also I'd say keeping a pet would be another difference. Normally, residents are not allowed keep pets in the apartments, but people who live in houses can keep them as many as they like."
      },
      {
        id: 3,
        question: "Do people in your country prefer to rent their homes, or buy them?",
        sampleAnswer: "As the cost of renting becomes more expensive in Korea, it seems like people tend to buy houses rather than renting them. But it actually depends on individual's circumstances."
      },
      {
        id: 4,
        question: "Should the government take responsibility for providing homes for disadvantaged (poor) people?",
        sampleAnswer: "(Answer 1) I think government should not provide homes for poor people for free, I don't mean they have to pay some money for the house, but they need to do something to earn. Maybe government can provide some job opportunities or houses with less expensive rent.\n\n(Answer 2) Of course, they should. It's their responsibility to provide housing to everyone in their nation. People deserve to have their basic rights; eating, clothing, and housing, and especially when it comes to poor people, they definitely need to be provided with a house from the government."
      },
      {
        id: 5,
        question: "Do people in your country prefer to live in cities, or in rural environment?",
        sampleAnswer: "People in Korea seem like they prefer to live in urban areas, apparently there are lack of young people in most of countryside as they move out to work in big cities like Seoul, since there are more job opportunities. On the other hand, people tend to live in rural areas when they get older to spend rest of their lives in calm and peaceful environment."
      },
      {
        id: 6,
        question: "What are the differences between living in the countryside compared to living in a city?",
        sampleAnswer: "Maybe in countryside, there are less jobs and less shops. Also most of rural areas are more nature friendly; less air pollution and some unspoilt areas like mountains, dense forests, and so on. Cities are convenient to live in, but severe pollutions occur which can affect people's health."
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
    sampleAnswer: `Well, I'd have to talk about Seoul. I was out of Korea for few years to study, then I got back to Korea 3 years ago. It wasn't like the same place that I experienced before. It was totally surprising, but of course in negative way.

Actually, the minute after I got out of the Incheon airport, I couldn't stop coughing. It was extremely hard to breathe. Not long after that, I went to see my friend in Seoul, the place was even worse.

The first thing that I was surprised at was the noise. Drivers were beeping their horns, hordes of people around me were making noises, and there were tones of yellow dusts so I could barely see what is ahead of me. And I started coughing again because of that. Seriously, I thought it was disgusting then I avoided going there for a while.

I knew the noise pollution was serious in Seoul, but I felt it got worse. Everywhere I went was so crowded with people and was extremely noisy. I was feeling dizzy with hearing all these car horns and noises from people. Also the air wasn't fresh as it used to be in the past. The colour of the sky was actually yellow with all dusts, and the city itself looked very dark and grey. It looked like a doomed city and ironic for me as people looked very happy. I'm sure all these pollution would affect people, especially residents of Seoul.`,
    category: "Part 2 - Pollution",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of pollution are serious in your country?",
        sampleAnswer: "Well, definitely noise pollution and air pollution are the most serious ones. Those are getting more and more severe nowadays, especially in major cities. People are getting more stressed by noise pollution caused by lots of different sources like neighbours, cars, and pets and so on, and also air pollution is so bad particularly in Seoul. There are tons of micro dusts in the atmosphere, and in spring, people suffer from yellow dusts which come from Chinese desert."
      },
      {
        id: 2,
        question: "What can individuals do to protect our environment?",
        sampleAnswer: "I'm sure individuals can start with small things like taking public transports instead of their own cars to reduce air pollution, and use their cars when really necessary. And turning off electricity when people leave their houses or workplaces in order to save energy. Also participating in environmental campaigns would be helpful as those ones involve picking litters in public places and other activities related to the environment."
      },
      {
        id: 3,
        question: "Do you think individuals should be responsible for pollutions?",
        sampleAnswer: "Of course, definitely. This is our duty to save the environment in order to survive. People should pay more attention on the methods which helps saving energy or the environment. It's not a big deal to think about the method. People should start taking some actions in order to tackle the pollution."
      },
      {
        id: 4,
        question: "Why is there a need to involve government in environmental protection?",
        sampleAnswer: "It's because there is a limitation for individuals when they try to do something to save the environment. I believe the government can do things in larger scale so more people can be involved. The government can promote and start some compulsory environmental campaigns such as making people to take the public transports to go to work compulsively so that they can participate in saving the Earth eventually."
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
    sampleAnswer: `A place came up on my mind is Hastings, in England. It's a city located in East Sussex, and when I visited there, I was travelling Sussex area such as Rye, Dover, and ended up my trip in Hastings.

When I visited there, it was around May or June. So the weather was quite hot and sunny. I was walking alongside of the sea, and saw lots of people swimming, riding skateboards, sitting at the beach, and drinking beer.

After I finished my final project at University, I wanted to travel but didn't know where to go. So I unfolded map of England, and randomly picked East Sussex area to travel. I wanted to go somewhere quiet at that time, and the sea was another reason which made me want to go.

Actually, Hastings was very interesting place. I didn't expect anything but some of the areas looked like Greece, and some looked like British countryside. It was busy at some areas, but most places were very quiet. First thing I liked about Hastings was the blue sea. Before Hastings, I visited Brighton but the water was actually brown, but the sea in Hastings was so clear, blue, and it was shining. It was amazing to see such place in England. Also I could relax a lot with fantastic scenery. I was quite fed up with all my works, but by staying in Hastings, I could relieve all my stress. I walked a lot, went into the sea, saw lots of lively people, and lovely views of city. If I have another chance, I would definitely revisit this place.`,
    category: "Part 2 - Water",
    part3Questions: [
      {
        id: 1,
        question: "Are holidays to places with lots of water very popular in your country?",
        sampleAnswer: "Yes, a lot of people tend to go somewhere there is lots of water. In Korea, especially in summer, all beaches or riverside are very popular holiday destinations."
      },
      {
        id: 2,
        question: "What activities do (or can) people do on (or, in) the water?",
        sampleAnswer: "Most people go swimming, and also enjoy water sports such as wakeboarding, water-skiing, scuba diving, and so on. Some people also enjoy fishing if they go to the ocean."
      },
      {
        id: 3,
        question: "Can you explain why people enjoy spending leisure time at a beach or river?",
        sampleAnswer: "I personally think it's because we don't see such places like beach or river in our daily life. Well, we see the river which flows in the city, but because of heavy workload or busy daily routine, people don't really have much time to go and relax. Also some people particularly enjoy water sports so they want to go somewhere there's lots of water."
      },
      {
        id: 4,
        question: "In what ways do people use water?",
        sampleAnswer: "Mostly on daily life, like taking shower, washing their laundry, and of course, drinking. Also water is used by waterpower generation, building dams, or maybe some people live on businesses related to water like fishermen."
      },
      {
        id: 5,
        question: "Do you think the way people in your country today use water has changed, compared to the past?",
        sampleAnswer: "Not much really. I think people in the past lived near water so they used it directly but only difference is as residential areas has developed, people at present use the tap water for their various needs."
      },
      {
        id: 6,
        question: "In your opinion, should the personal use of water be controlled?",
        sampleAnswer: "In some ways, yes. People in modern society waste a lot of water by letting the tap opened. There are lots of countries where suffer from water shortage. So in order to prevent water shortage, people need to take some actions or the government should control the use of water."
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
    sampleAnswer: `I'd like to talk about a cardigan that my mother gave me. I think it was my last birthday. She bought it from a department store. Actually, I didn't expect to receive any presents from my parents at that time, but she surprisingly gave me a small paper bag. When I opened it, there was a navy-colored cardigan.

It was a very basic but lovely cardigan. As I didn't have many clothes which are suitable for the change of seasons, she bought me one. At that time, I had many shirts or t-shirts but didn't have any clothes to wear on top of them. I was very happy when I received it, not only because it was exactly what I needed, but also because I could feel how much my mother cares about me.

Since then, I've been wearing it very often. It's very easy to match with any other clothes, and it's also very comfortable. Whenever I wear it, I think of my mother and I feel very warm and happy. I think it's one of the best presents I've ever received.`,
    category: "Part 2 - Clothes",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of clothes do people in your country like to wear?",
        sampleAnswer: "It depends on the age groups. Generally, young people in Korea like to wear trendy and stylish clothes. They are very sensitive to fashion. On the other hand, older people prefer comfortable and practical clothes. But overall, casual clothes like jeans and t-shirts are popular among all ages."
      },
      {
        id: 2,
        question: "Does the climate affect the clothes people wear?",
        sampleAnswer: "Definitely. Korea has four distinct seasons, so people's clothing changes accordingly. In summer, people wear light and thin clothes to stay cool. In winter, they wear thick coats, padded jackets, and mufflers to protect themselves from the cold."
      },
      {
        id: 3,
        question: "Do you think that the clothes people wear can reflect their personality?",
        sampleAnswer: "Yes, I think so. For example, people who wear bright and colorful clothes might be outgoing and energetic. On the contrary, people who prefer simple and dark-colored clothes might be more calm and reserved. So, I believe that clothing can be a way of expressing oneself."
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
    sampleAnswer: `I'd like to talk about a time when I had to wait for a long time at a famous restaurant. It was last year, during the weekend. I went to a well-known Italian restaurant in Seoul with my friends. We had heard that the food there was amazing, so we decided to give it a try.

When we arrived, there was a huge queue of people waiting outside. We were told that the waiting time would be at least an hour. At first, we were a bit frustrated and considered going to another place. However, we really wanted to try their signature pasta, so we decided to wait.

While waiting, we talked about various topics and time went by. It actually took about an hour and a half to finally get a table. Although it was a long wait, I tried to be patient because I knew it would be worth it. Eventually, when we tasted the food, it was indeed delicious, and we were all satisfied. That experience taught me that sometimes being patient can lead to a great reward.`,
    category: "Part 2 - Patience",
    part3Questions: [
      {
        id: 1,
        question: "What do you think \"patience\" is?",
        sampleAnswer: "In my opinion, patience is the ability to stay calm and not get angry or upset when dealing with problems or waiting for something. It's an important quality to have in our daily lives, as it helps us to make better decisions and maintain good relationships with others."
      },
      {
        id: 2,
        question: "Do you think people are less patient now than they were in the past?",
        sampleAnswer: "Yes, I think so. With the development of technology, everything has become much faster. We can get information instantly through the internet, and we can order things with just a few clicks. As a result, people have become used to getting what they want immediately, and they tend to lose patience more easily when things take time."
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
    sampleAnswer: `I’d like to talk about a health-related advertisement that I saw recently, which was for a <strong>dermatology clinic</strong>.

I first came across this ad on a <strong>billboard in a subway station</strong> while I was commuting to work. Since the station is usually crowded and people are often in a rush, it’s quite rare for an advertisement to truly grab someone’s attention, but this one definitely did.

The advertisement was primarily targeting <strong>adult women</strong> who are interested in skincare and aesthetic treatments. It featured a strikingly beautiful woman, but as I looked closer, I noticed she had quite <strong>troubled skin</strong> with some visible blemishes.

The reason this ad stuck in my mind is because of its clever <strong>visual impact</strong>. At first, I thought to myself, 'She would be absolutely perfect if she just had clearer skin.' As I read the fine print, I realized it was a clever promotion for a local dermatology clinic. The contrast between her features and her skin condition was so sharp that it made the message very persuasive.

Even now, I can still clearly remember the name of the clinic, which proves how effective the marketing was. I think it was a <strong>brilliantly designed ad</strong> because it didn't just show a flawless model; instead, it made me sympathize with the 'skin concerns' and then offered a solution.`,
    category: "Part 2 - Health & Advertisements",
    part3Questions: [
      {
        id: 1,
        question: "How can people improve their health?",
        sampleAnswer: "There are several ways to improve health. First and foremost, regular exercise is essential. People should try to engage in some form of physical activity, like walking, running, or swimming. Secondly, a balanced diet is crucial. Eating plenty of fruits, vegetables, and proteins while avoiding junk food can make a big difference. Lastly, getting enough sleep and managing stress are also very important for overall well-being."
      },
      {
        id: 2,
        question: "Do you think the government should be responsible for people's health?",
        sampleAnswer: "I think the government should play a role in promoting public health. For example, they can provide public sports facilities, run health awareness campaigns, and regulate the food industry to ensure food safety. However, ultimately, individuals are responsible for their own lifestyle choices and health."
      },
      {
        id: 3,
        question: "What are the different types of advertising?",
        sampleAnswer: "There are many types of advertising, such as television commercials, radio ads, billboards, and advertisements in newspapers or magazines. Nowadays, online advertising on social media and websites has become extremely popular and influential."
      },
      {
        id: 4,
        question: "Do you think there are too many advertisements in our daily lives?",
        sampleAnswer: "Yes, absolutely. We are bombarded with advertisements everywhere we go—on the streets, on TV, and especially on the internet. Sometimes it can be quite overwhelming and annoying, as they interrupt what we are doing."
      },
      {
        id: 5,
        question: "How do advertisements influence people's consumption habits?",
        sampleAnswer: "Advertisements are designed to persuade people to buy products or services. They often use attractive images or famous celebrities to create a positive image of a brand. As a result, people may feel a desire to buy things they don't necessarily need, simply because they saw them in an ad."
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
    sampleAnswer: `I'd like to talk about a gift I gave to my younger sister last year. It was a high-end digital camera. She had just started a course in photography at her college and was using her smartphone for all her assignments, so I thought it was the perfect time to get her some professional equipment.

I spent a lot of time researching different models online because I wanted to find something that was user-friendly but still had all the advanced features a student would need. I eventually chose a compact mirrorless camera because it's lightweight and easy for her to carry around campus.

When I gave it to her on her birthday, she was absolutely speechless. She didn't expect such an expensive gift. Seeing her so excited made me feel really proud and happy. It was great to know that I could support her passion and help her with her studies. Now, she uses it all the time and her photos have improved significantly, which makes me feel like it was money well spent.`,
    category: "Part 2 - Gifts",
    part3Questions: []
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

const isSpeakingQuestion = (question: RandomQuestion): question is RandomSpeakingQuestion =>
  question.kind === 'tef' ||
  question.kind === 'ielts-part1' ||
  question.kind === 'ielts-part2' ||
  question.kind === 'ielts-part3';

function App() {
  const [currentView, setCurrentView] = useState<
    'landing' | 'ieltsSelection' | 'ieltsSpeaking' | 'ieltsWriting' | 'tefSelection' | 'tefWriting' | 'tefSpeaking' | 'randomQuestion'
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
            <h2>{currentPart2Question.topic}</h2>
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
                <p>{currentPart2Question.sampleAnswer}</p>
              </details>
          </div>
        ) : (
          <div className="part3-question">
            <h2>Part 3 - Discussion Question</h2>
            <h3>{currentPart3Question.question}</h3>
            <details className="sample-answer">
              <summary>Sample Answer</summary>
              <p>{currentPart3Question.sampleAnswer}</p>
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
    />
  );
}

export default App;
