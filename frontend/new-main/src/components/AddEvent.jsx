import React from 'react';
import axios from 'axios';

function AddEvent({ events }) {

  const handleAddEvent = async (event) => {
    try {
      const formattedEvent = {
        eventname: event.eventname,
        date: event.timeline.date,
        start_time: event.timeline.start_time.hours + ":" + event.timeline.start_time.minutes + ":00",
        end_time: event.timeline.end_time.hours + ":" + event.timeline.end_time.minutes + ":00"
      };

      await axios.post('/addevent', formattedEvent);
      alert('Event added to calendar');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Add Event to Calendar</h2>
      {events.map((event, index) => (
        <div key={index}>
          <h3>{event.eventname}</h3>
          <p>Date: {event.timeline.date}</p>
          <p>Start Time: {event.timeline.start_time.hours}:{event.timeline.start_time.minutes}:00</p>
          <p>End Time: {event.timeline.end_time.hours}:{event.timeline.end_time.minutes}:00</p>
          <button onClick={() => handleAddEvent(event)}>Add Event</button>
        </div>
      ))}
    </div>
  );
}

export default AddEvent;
