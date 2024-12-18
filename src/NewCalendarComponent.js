import React, { useState } from 'react';
import TaskList from './TaskList';
import TaskDetails from './TaskDetails';
import Calendar from './Calendar';
import Retrospective from './Retrospective';

const NewCalendarComponent = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const initialTasks = [
    {
      title: '회의',
      startTime: '2024-11-06T08:00:00',
      endTime: '2024-11-06T09:00:00',
      completed: false,
      description: ''
    },
    {
      title: '점심',
      startTime: '2024-11-07T07:00:00',
      endTime: '2024-11-07T08:00:00',
      completed: false,
      description: ''
    },
    {
      title: '프로젝트 발표',
      startTime: '2024-11-06T10:00:00',
      endTime: '2024-11-06T11:00:00',
      completed: false,
      description: ''
    },
    {
      title: '테스트 태스크',
      startTime: '2024-11-06T06:00:00',
      endTime: '2024-11-06T06:59:59',
      completed: true,
      description: '테스트 설명'
    }
  ];

  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState(null);

  const addTask = (newTask) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const deleteTask = (taskIndex) => {
    setTasks(prevTasks => prevTasks.filter((_, index) => index !== taskIndex));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
  };

  const toggleTaskCompletion = (index) => {
    setTasks(prevTasks => prevTasks.map((task, i) => {
      if (i === index) {
        return { ...task, completed: !task.completed };
      }
      return task;
    }));
  };

  const eventStyleGetter = (event) => {
    console.log('Event in styleGetter:', event);
    const style = {
      backgroundColor: event.completed ? '#4CAF50' : '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block'
    };
    
    return {
      style
    };
  };

  const taskToEvent = (task) => ({
    title: task.title,
    start: new Date(task.startTime),
    end: new Date(task.endTime),
    completed: task.completed,
    description: task.description
  });

  return (
    <div className="calendar-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>새로운 캘린더</h1>
        <button
          onClick={() => setSelectedTask(null)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Jarvis!
        </button>
      </div>
      <div className="tabs">
        <button onClick={() => handleTabChange('calendar')}>Calendar</button>
        <button onClick={() => handleTabChange('tasks')}>Tasks</button>
        <button onClick={() => handleTabChange('retrospective')}>Retrospective</button>
      </div>

      {activeTab === 'calendar' && (
        <Calendar 
          events={tasks.map(taskToEvent)}
          toggleTaskCompletion={toggleTaskCompletion}
          eventPropGetter={eventStyleGetter}
        />
      )}
      {activeTab === 'tasks' && (
        <TaskList 
          tasks={tasks} 
          handleCardClick={handleCardClick} 
          selectedTask={selectedTask}
          addTask={addTask}
          toggleTaskCompletion={toggleTaskCompletion}
        />
      )}
      {activeTab === 'retrospective' && (
        <Retrospective 
          tasks={tasks}
          date={new Date()}
        />
      )}
      <TaskDetails selectedTask={selectedTask} setSelectedTask={setSelectedTask} />
    </div>
  );
};

export default NewCalendarComponent;