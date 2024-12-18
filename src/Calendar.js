import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './Calendar.module.css';

const localizer = momentLocalizer(moment);

const Calendar = ({ events, toggleTaskCompletion, eventPropGetter }) => {
  const handleSelectEvent = (event) => {
    // 이벤트의 인덱스를 찾아서 toggleTaskCompletion 호출
    const eventIndex = events.findIndex(e => 
      e.title === event.title && 
      e.start.getTime() === event.start.getTime()
    );
    if (eventIndex !== -1) {
      toggleTaskCompletion(eventIndex);
    }
  };

  // 이벤트 컴포넌트를 커스텀하여 체크박스 추가
  const components = {
    event: ({ event }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="checkbox"
          checked={event.completed}
          onChange={() => handleSelectEvent(event)}
          onClick={(e) => e.stopPropagation()}
        />
        <span>{event.title}</span>
      </div>
    )
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.completed ? '#4CAF50' : '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block',
      transition: 'background-color 0.3s ease'  // 색상 변화에 0.3초 트랜지션 추가
    };
    
    return {
      style
    };
  };

  return (
    <BigCalendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      min={new Date().setHours(6, 0, 0)}
      max={new Date().setHours(22, 0, 0)}
      defaultView="week"
      views={['week', 'day']}
      eventPropGetter={eventPropGetter}
      components={components}
      onSelectEvent={handleSelectEvent}
      eventStyleGetter={eventStyleGetter}
    />
  );
};

export default Calendar;
