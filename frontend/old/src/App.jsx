import React, { useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { useReactMediaRecorder } from "react-media-recorder";
import './App.css'

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDown, setDown] = useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
  const [transcribeText, setTranscribeText] = useState('');
  const [showTranscribeText, setShowTranscribeText] = useState(false);
  const [showSummarizeText, setShowSummarizeText] = useState(false);
  const [summarizeText, setSummarizeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  const handleStart = () => {
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleDownload = async () => {
    if (mediaBlobUrl) {
      try {
        const response = await fetch(mediaBlobUrl);
        const audioBlob = await response.blob();
        const url = window.URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setDown(true);
      } catch (error) {
        console.error('Error saving audio file:', error);
      }
    }
  };

  const transcribeAudio = async () => {
    if (!mediaBlobUrl) return;
    setShowTranscribeText(true);
    setLoading(true);

    try {
      const response = await fetch(mediaBlobUrl);
      const audioBlob = await response.blob();
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const result = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await result.json();
      setTranscribeText(data.transcribe);
      setMessage(data.message || "Transcription completed.");
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error transcribing audio');
    } finally {
      setLoading(false);
    }
  };

  const summarizeAudio = async () => {
    if (!mediaBlobUrl) return;
    setShowSummarizeText(true);
    setLoading(true);

    try {
      const response = await fetch(mediaBlobUrl);
      const audioBlob = await response.blob();
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const result = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        body: formData,
      });
      const data = await result.json();
      setSummarizeText(data.summary);
      setMessage(data.message);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error summarizing audio');
    } finally {
      setLoading(false);
    }
  };

  const extractEvents = async () => {
    setLoading(true);
    try {
      const result = await fetch('http://localhost:5000/events', {
        method: 'GET',
      });
      const data = await result.json();
      setEvents(data.tasks || []);
      setMessage(data.message);
      setShowSummarizeText(true);
      setSummarizeText(JSON.stringify(data.tasks, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error extracting events');
    } finally {
      setLoading(false);
    }
  };

  const addEventToCalendar = async (event) => {
    try {
      const result = await fetch('http://localhost:5000/addevent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventname: event.eventname,
          date: event.timeline.date,
            start_time: event.timeline.start_time,
            end_time: event.timeline.end_time
        }),
      });
      const data = await result.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error adding event to calendar');
    }
  };

  const hideTranscribeText = () => {
    setShowTranscribeText(false);
    setTranscribeText('');
  };

  const hideSummarizeText = () => {
    setShowSummarizeText(false);
    setSummarizeText('');
  };

  const playSound = () => {
    if (!mediaBlobUrl) return;
    const audio = new Audio(mediaBlobUrl);
    audio.play();
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  };

  const stopPlayback = () => {
    if (!mediaBlobUrl || !isPlaying) return;
    const audio = new Audio(mediaBlobUrl);
    audio.pause();
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1 className="head">Audio Processing</h1>
      
      <Grid container spacing={2} justifyContent="center">
        {!isDown && (
          <Button className="button" variant="contained" onClick={status === 'recording' ? handleStop : handleStart}>
            {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </Button>
        )}
        {mediaBlobUrl && !isDown && (
          <>
            <Button className="button_down" variant="contained" onClick={handleDownload} disabled={!mediaBlobUrl}>
              Download Recording
            </Button>
            <Button className="button" variant="contained" color="secondary" onClick={isPlaying ? stopPlayback : playSound} disabled={!mediaBlobUrl}>
              {isPlaying ? 'Stop Playback' : 'Play Recording'}
            </Button>
          </>
        )}
      </Grid>
      <Grid container spacing={2} justifyContent="center" style={{ marginTop: '20px' }}>
        {isDown && (
          <>
            <Button className="button" variant="contained" onClick={transcribeAudio}>
              Transcribe
            </Button>
            <Button className="button" variant="contained" onClick={summarizeAudio}>
              Summarize
            </Button>
            <Button className="button" variant="contained" onClick={extractEvents}>
              Extract Events
            </Button>
          </>
        )}
      </Grid>
      {loading && (
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      {showTranscribeText && (
        <div style={{ marginTop: '20px', textAlign: 'center', maxWidth: '80%' }}>
          <Typography variant="h6">Transcription:</Typography>
          <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {transcribeText}
          </pre>
          <Button className="back" variant="contained" onClick={hideTranscribeText}>
            Back
          </Button>
        </div>
      )}
      {showSummarizeText && (
        <div style={{ marginTop: '20px', textAlign: 'center', maxWidth: '80%' }}>
          <Typography variant="h6">Summary:</Typography>
          <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {summarizeText}
          </pre>
          <Button className="back" variant="contained" onClick={hideSummarizeText}>
            Back
          </Button>
        </div>
      )}
      {events.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center', maxWidth: '80%' }}>
          <Typography variant="h6">Extracted Events:</Typography>
          {events.map((event, index) => (
            <div key={index} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
              <p><strong>Event:</strong> {event.eventname}</p>
              <p><strong>Date:</strong> {event.timeline.date}</p>
              <p><strong>Start:</strong> {`${event.timeline.start_time.hours}:${event.timeline.start_time.minutes}:${event.timeline.start_time.seconds}`}</p>
              <p><strong>End:</strong> {`${event.timeline.end_time.hours}:${event.timeline.end_time.minutes}:${event.timeline.end_time.seconds}`}</p>
              <Button variant="contained" color="primary" onClick={() => addEventToCalendar(event)}>
                Add to Calendar
              </Button>
            </div>
          ))}
        </div>
      )}
      {message && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Typography variant="body1">{message}</Typography>
        </div>
      )}
    </div>
  );
};

export default App;