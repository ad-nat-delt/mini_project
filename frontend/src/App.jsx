import React, { useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { useReactMediaRecorder } from "react-media-recorder";
import './App.css'


const App = () => {
  console.log("Hello");
  const [transcript, setTranscript] = useState(false);
  const [summary, setSummary] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDown, setDown] = useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
  const [transcribeText, setTranscribeText] = useState('');
  const [showTranscribeText, setShowTranscribeText] = useState(false);
  const [showSummarizeText, setShowSummarizeText] = useState(false);
  const [summarizeText, setSummarizeText] = useState('');

  const handleStart = () => {
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  //const handleDownload = () => {
    // if (mediaBlobUrl) {
    //   const downloadLink = document.createElement('a');
    //   downloadLink.href = mediaBlobUrl;
    //   downloadLink.download = 'recording.webm';
    //   downloadLink.click();
    //   setDown(true);
    // }
    const handleDownload = async () => {
      if (mediaBlobUrl) {
        try {
          const saveFileAsync = async () => {
            const response = await fetch(mediaBlobUrl);
            const audioBlob = await response.blob();
    
            const handle = await window.showSaveFilePicker({
              suggestedName: 'recording.wav',
              types: [
                {
                  description: 'WebM Audio',
                  accept: { 'audio/webm': ['.webm'] },
                },
              ],
            });
    
            const writableStream = await handle.createWritable();
            await writableStream.write(audioBlob);
            await writableStream.close();
    
            console.log('Audio file saved successfully');
          };
    
          await saveFileAsync();
        } catch (error) {
          console.error('Error saving audio file:', error);
        }
        setDown(true);
      }
    };
  const transcribeAudio = async () => {
    if (!mediaBlobUrl) return;
    setShowTranscribeText(true);
    console.log('Transcribe audio');
    setTranscribeText('transcribe');

  };
  const hideTranscribeText = () => {
    setShowTranscribeText(false);
    setTranscribeText('');// Hide the transcribe text
  };
  const hideSummarizeText = () => {
    setShowSummarizeText(false);
    setSummarizeText('');// Hide the Summarize text
  };


  const summarizeAudio = async () => {
    if (!mediaBlobUrl) return;
    setShowSummarizeText(true);
    console.log('Summarize audio');
    setSummarizeText('summarize');
    
  };

  const handleEvent = () => {
    console.log('Handle event');
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '0vh' }}>
      <h1 class="head" variant="h5">Record Audio</h1>
      
        
        <Grid container spacing={2} marginTop={10}>
          {!isDown && (
            <Button class="button" variant="contained"  onClick={status === 'recording' ? handleStop : handleStart}>
              {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
            </Button>
          )}
          {mediaBlobUrl && !isDown && (
            <>
              <Button class="button_down" variant="contained"  onClick={handleDownload} disabled={!mediaBlobUrl}>
                Move to functions 
              </Button>
              <Button class="button" variant="contained" color="secondary" onClick={isPlaying ? stopPlayback : playSound} disabled={!mediaBlobUrl}>
                {isPlaying ? 'Stop Playback' : 'Play Recording'}
              </Button>
            </>
          )}
          </Grid>
          <Grid container spacing={2} marginTop={10} >
          {isDown && 
          !transcribeText && !summarizeText &&
          (
            <>
            
              <Button class="button" variant="contained"  onClick={transcribeAudio}>
                Transcribe
              </Button>
              <Button class="button" variant="contained"  onClick={summarizeAudio}>
                Summarize
              </Button>
              <Button class="button" variant="contained"  onClick={handleEvent}>
                Event
              </Button>
            </>
          )}
        </Grid>
        {showTranscribeText && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Typography variant="h6">{transcribeText}</Typography>
          <Button class="back"  variant="contained"  onClick={hideTranscribeText}>
          Back
        </Button>
        </div>
      )}
        {
        showSummarizeText &&
        (
          <div>
          <Typography variant="h6">{summarizeText}</Typography>
          <Button class="back" variant="contained"  onClick={hideSummarizeText}>
          Back
        </Button>
        </div>
          
        )}
    </div>
  );
};


export default App;