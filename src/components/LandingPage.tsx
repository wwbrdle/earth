import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onSelectIELTS: () => void;
  onSelectTEF: () => void;
  onSelectRandomQuestion: () => void;
  onSelectRandomIeltsSpeaking: () => void;
}

interface ModelInfo {
  name: string;
  displayName: string;
  supportedMethods: string[];
  supportsGenerateContent: boolean;
}

interface ModelsData {
  v1?: ModelInfo[];
  v1beta?: ModelInfo[];
  [key: string]: ModelInfo[] | undefined;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onSelectIELTS,
  onSelectTEF,
  onSelectRandomQuestion,
  onSelectRandomIeltsSpeaking
}) => {
  const [models, setModels] = useState<ModelsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentModel = 'gemini-2.5-flash';
  const currentApiVersion = 'v1';

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Lambda 함수 URL 또는 로컬 개발 환경 확인
        const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
        
        if (!lambdaUrl && process.env.NODE_ENV === 'production') {
          setError('Lambda 함수 URL이 설정되지 않았습니다.');
          setLoading(false);
          return;
        }

        // 개발 환경에서는 직접 Gemini API 호출
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_GEMINI_API_KEY) {
          const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
          const versions = ['v1', 'v1beta'];
          const result: ModelsData = {};
          
          for (const version of versions) {
            try {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`
              );
              const data = await response.json();
              result[version] = (data.models || []).map((model: any) => ({
                name: model.name.replace('models/', ''),
                displayName: model.displayName || model.name.replace('models/', ''),
                supportedMethods: model.supportedGenerationMethods || [],
                supportsGenerateContent: (model.supportedGenerationMethods || []).includes('generateContent')
              }));
            } catch (err) {
              console.error(`Error fetching ${version} models:`, err);
              result[version] = [];
            }
          }
          
          setModels(result);
        } else if (lambdaUrl) {
          // 프로덕션: Lambda 함수 호출
          const response = await fetch(lambdaUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'listModels' })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success && data.models) {
            setModels(data.models);
          } else {
            throw new Error(data.error || 'Failed to fetch models');
          }
        }
      } catch (err: any) {
        console.error('Error fetching models:', err);
        setError(err.message || '모델 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const renderModelList = (version: 'v1' | 'v1beta', modelsList: ModelInfo[] | undefined) => {
    if (!modelsList || modelsList.length === 0) {
      return <li className="model-item">모델을 불러올 수 없습니다.</li>;
    }

    return modelsList.map((model) => {
      const isCurrent = version === currentApiVersion && model.name === currentModel;
      return (
        <li 
          key={model.name} 
          className={`model-item ${model.supportsGenerateContent ? 'supported' : 'unsupported'}`}
        >
          {model.supportsGenerateContent ? '✅' : '❌'} {model.name}
          {isCurrent && <span className="model-badge">현재 사용</span>}
        </li>
      );
    });
  };
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

        <div className="exam-buttons random-speaking-row">
          <button
            onClick={onSelectRandomIeltsSpeaking}
            className="exam-button random-ielts-speaking-button"
          >
            <div className="exam-icon">🎧</div>
            <div className="exam-title">랜덤 영어 스피킹</div>
            <div className="exam-description">IELTS Speaking 랜덤 + 자동 음성</div>
          </button>
          <button
            onClick={onSelectRandomQuestion}
            className="exam-button random-question-button"
          >
            <div className="exam-icon">🎲</div>
            <div className="exam-title">랜덤 문제</div>
            <div className="exam-description">영/불어 스피킹·라이팅 랜덤</div>
          </button>
        </div>

        <div className="model-info-section">
          <h3 className="model-info-title">🤖 AI 모델 정보</h3>
          
          <div className="current-model">
            <div className="current-model-label">현재 사용 중:</div>
            <div className="current-model-value">
              <strong>gemini-2.5-flash</strong> (v1 API)
            </div>
          </div>

          <details className="available-models">
            <summary className="models-summary">
              사용 가능한 모델 목록 보기
              {loading && <span className="loading-indicator"> (로딩 중...)</span>}
            </summary>
            
            {error && (
              <div className="model-error">
                ⚠️ {error}
              </div>
            )}
            
            {!loading && !error && (
              <div className="models-list">
                {models.v1 && models.v1.length > 0 && (
                  <div className="api-version">
                    <h4>v1 API ({models.v1.length}개 모델)</h4>
                    <ul className="model-list">
                      {renderModelList('v1', models.v1)}
                    </ul>
                  </div>
                )}

                {models.v1beta && models.v1beta.length > 0 && (
                  <div className="api-version">
                    <h4>v1beta API ({models.v1beta.length}개 모델)</h4>
                    <ul className="model-list">
                      {renderModelList('v1beta', models.v1beta)}
                    </ul>
                  </div>
                )}

                {(!models.v1 || models.v1.length === 0) && (!models.v1beta || models.v1beta.length === 0) && (
                  <div className="no-models">모델 목록을 불러올 수 없습니다.</div>
                )}
              </div>
            )}
          </details>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
