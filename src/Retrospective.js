import React, { useState } from 'react';
import styles from './Retrospective.module.css';

const Retrospective = ({ tasks, date }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reflection, setReflection] = useState({
    taskReview: '',
    keepDoing: '',
    startDoing: '',
    stopDoing: '',
    generalThoughts: ''
  });
  const [userInput, setUserInput] = useState('');

  const questions = [
    "안녕하세요! 오늘 하루는 어떠셨나요? 먼저 오늘의 Task들을 살펴볼까요?",
    "오늘 잘 진행된 일들이 있나요? 계속 유지하고 싶은 것들에 대해 이야기해주세요.",
    "앞으로 시작하면 좋을 것 같은 새로운 시도나 개선점이 있다면 말씀해주세요.",
    "반대로, 개선이 필요하거나 그만하고 싶은 것들은 무엇인가요?",
    "마지막으로, 오늘 하루에 대한 전반적인 소감을 들려주세요."
  ];

  const handleStart = () => {
    setIsStarted(true);
    addMessage('assistant', questions[0]);
    // 오늘의 태스크 목록 표시
    const todaysTasks = tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate.toDateString() === date.toDateString();
    });
    const taskList = todaysTasks.map(task => 
      `- ${task.completed ? '✓' : '○'} ${task.title}`
    ).join('\n');
    addMessage('assistant', `오늘의 Task 목록입니다:\n${taskList}`);
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { type, content }]);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // 사용자 메시지 추가
    addMessage('user', userInput);

    // 현재 질문에 대한 답변 저장
    const field = ['taskReview', 'keepDoing', 'startDoing', 'stopDoing', 'generalThoughts'][currentQuestion];
    setReflection(prev => ({
      ...prev,
      [field]: userInput
    }));

    // 다음 질문으로 이동
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeout(() => {
        addMessage('assistant', questions[currentQuestion + 1]);
      }, 1000);
    } else {
      // 회고 마무리
      setTimeout(() => {
        addMessage('assistant', "오늘의 회고를 마치겠습니다. 수고하셨어요! 😊");
      }, 1000);
    }

    setUserInput('');
  };

  return (
    <div className={styles.container}>
      {!isStarted ? (
        <div className={styles.startScreen}>
          <h2>오늘의 회고를 시작할까요?</h2>
          <button onClick={handleStart} className={styles.startButton}>
            회고 시작!
          </button>
        </div>
      ) : (
        <div className={styles.chatContainer}>
          <div className={styles.characterSection}>
            <div className={styles.character}>
              <img 
                src="/jarvis.webp"
                alt="AI Assistant"
                className={styles.characterGif}
              />
            </div>
          </div>
          
          <div className={styles.chatSection}>
            <div className={styles.messages}>
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`${styles.message} ${message.type === 'assistant' ? styles.assistantMessage : styles.userMessage}`}
                >
                  {message.type === 'assistant' ? (
                    <>
                      <div className={styles.assistantAvatar}>AI</div>
                      <div className={styles.messageContent}>
                        {message.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={styles.inputSection}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className={styles.input}
              />
              <button 
                onClick={handleSendMessage}
                className={styles.sendButton}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Retrospective;
