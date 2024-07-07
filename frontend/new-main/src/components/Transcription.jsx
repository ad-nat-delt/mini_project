import React, { useState } from 'react';
import axios from 'axios';

function Transcription({ transcription, summary, handleEvents }) {
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/events');
      handleEvents(response.data.tasks);
      setEvents(response.data.tasks);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Transcription</h2>
      <pre>{transcription}</pre>
      <h2>Summary</h2>
      <pre>{summary}</pre>
      <button onClick={fetchEvents}>Generate Events</button>
    </div>
  );
}

export default Transcription;
