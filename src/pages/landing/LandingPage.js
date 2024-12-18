import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  
  // 컴포넌트 마운트 시 한 번만 생성되도록 초기값으로 설정
  const [userId] = useState(Math.floor(10000000 + Math.random() * 90000000));
  
  useEffect(() => {
    setText(''); // 초기화
    let currentIndex = 0;
    
    // 텍스트를 useEffect 내부에서 정의
    const messages = [
      '> INITIALIZING FRIDAY CALENDAR SYSTEM..',
      `> WELCOME TO FRIDAY CALENDAR User_${userId}`
    ];
    const fullText = messages.join('\n');
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length - 1) {
        setText(prev => prev + fullText[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []); // 빈 의존성 배열 유지

  const handleEnter = () => {
    const landingPage = document.querySelector('.landing-page');
    landingPage.classList.add('zoom-out');
    
    setTimeout(() => {
      navigate('/home');
    }, 1000);
  };

  return (
    <div className="landing-page">
      <div className="graph-background"></div>
      <div className="content">
        <pre className="typing-text">{text}</pre>
        <button 
          className="enter-button"
          onClick={handleEnter}
        >
          > ENTER_SYSTEM
        </button>
      </div>
    </div>
  );
}

export default LandingPage;