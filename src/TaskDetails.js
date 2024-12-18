import React from 'react';

const TaskDetails = ({ selectedTask, setSelectedTask }) => {
  if (!selectedTask) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', backgroundColor: 'white', boxShadow: '-2px 0 5px rgba(0,0,0,0.2)', padding: '20px', boxSizing: 'border-box', overflowY: 'auto', zIndex: 1000 }}>
      <button 
        onClick={() => setSelectedTask(null)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
      <h3 style={{ marginTop: '40px' }}>작업 상세 정보</h3>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>제목:</span>
            <span>{selectedTask.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>설명:</span>
            <span>{selectedTask.description}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>날짜:</span>
            <span>{selectedTask.date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>시작 시간:</span>
            <span>{selectedTask.startTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>끝 시간:</span>
            <span>{selectedTask.endTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ width: '100px', fontWeight: 'bold' }}>상태:</span>
            <span>{selectedTask.is_done ? '완료' : '진행 중'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
