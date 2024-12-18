import React, { useState } from 'react';
import styles from './components/TaskList/TaskList.module.css';
import PropTypes from 'prop-types';

const TaskList = ({ tasks, handleCardClick, toggleTaskCompletion, selectedTask, addTask }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    completed: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prevTask) => ({
      ...prevTask,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!newTask.title || !newTask.date || !newTask.startTime || !newTask.endTime) {
      alert('제목, 날짜, 시간을 모두 입력해주세요.');
      return;
    }

    const startDateTime = new Date(`${newTask.date}T${newTask.startTime}`).toISOString();
    const endDateTime = new Date(`${newTask.date}T${newTask.endTime}`).toISOString();

    const taskToAdd = {
      ...newTask,
      startTime: startDateTime,
      endTime: endDateTime
    };

    addTask(taskToAdd);
    setNewTask({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      completed: false
    });
    setModalIsOpen(false);
  };

  return (
    <div className="task-list">
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0', display: 'inline-block' }}>작업 목록</h2>
        <button 
          onClick={() => setModalIsOpen(true)}
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + 작업 추가
        </button>
      </div>
      <div className="task-columns" style={{ display: 'flex' }}>
        <div className="task-column" style={{ flex: 1, width: '400px', margin: '0 10px' }}>
          <h3>오늘의 할일</h3>
          <ul className={styles.taskList}>
            {tasks.map((task, index) => (
              <li key={index} className={styles.taskCard}>
                <div className={styles.taskContent}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={task.completed}
                    onChange={(e) => {
                      e.stopPropagation(); // 이벤트 버블링 방지
                      toggleTaskCompletion(index);
                    }}
                  />
                  <div className={styles.taskInfo} onClick={() => handleCardClick(task)}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    <p className={styles.taskDescription}>{task.description}</p>
                  </div>
                  <div className={styles.taskTime}>
                    {task.startTime} - {task.endTime}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {modalIsOpen && (
        <div className={styles.modal}>
          <h2>새 작업 추가</h2>
          <div className={styles.formGroup}>
            <label>제목:</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className={styles.formGroup}>
            <label>설명:</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="설명을 입력하세요"
            />
          </div>
          <div className={styles.formGroup}>
            <label>날짜:</label>
            <input
              type="date"
              value={newTask.date}
              onChange={(e) => setNewTask({...newTask, date: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>시작 시간:</label>
            <input
              type="time"
              value={newTask.startTime}
              onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>종료 시간:</label>
            <input
              type="time"
              value={newTask.endTime}
              onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button onClick={handleSubmit}>추가</button>
            <button onClick={() => setModalIsOpen(false)}>닫기</button>
          </div>
        </div>
      )}
      {modalIsOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }} onClick={() => setModalIsOpen(false)} />
      )}
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  handleCardClick: PropTypes.func.isRequired,
  toggleTaskCompletion: PropTypes.func,
  selectedTask: PropTypes.object,
  addTask: PropTypes.func.isRequired
};

export default TaskList;
