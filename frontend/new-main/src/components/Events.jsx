// src/components/Events.js
import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
const Events = ({ events }) => {
  const handleAddEvent = async (event) => {
    try {
      await axios.post('http://localhost:5000/addevent', event);
      alert('Event added to calendar');
    } catch (error) {
      console.error('Error adding event', error);
    }
  };

  return (
    <div>
      <h2>Events</h2>
      {events.map((event, index) => (
        <div key={index}>
          <p>{event.eventname}</p>
          <p>{event.timeline.date}</p>
          <p>
            {event.timeline.start_time.hours}:{event.timeline.start_time.minutes} - {event.timeline.end_time.hours}:{event.timeline.end_time.minutes}
          </p>
          <button onClick={() => handleAddEvent(event)}>Add to Calendar</button>
        </div>
      ))}
    </div>
  );
};

Events.propTypes = {
    events: PropTypes.array.isRequired,
    };
    
export default Events;
