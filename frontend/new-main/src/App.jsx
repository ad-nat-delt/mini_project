// src/App.js
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Summary from './components/Summary';
import Events from './components/Events';
import './App.css';

const App = () => {
  const [summary, setSummary] = useState('');
  const [events, setEvents] = useState([]);

  return (
    <div className="App">
      <h1>Audio Transcription & Summarization</h1>
      <FileUpload setSummary={setSummary} />
      {summary && <Summary summary={summary} setEvents={setEvents} />}
      {events.length > 0 && <Events events={events} />}
    </div>
  );
};

export default App;
