// import React, { useState } from 'react';
// import { Button, Grid, Typography } from '@mui/material';
// import { useReactMediaRecorder } from "react-media-recorder";
// import './App.css'
// import Link from 'react-router-dom';


// const App = () => {
//   console.log("Hello");
//   const [transcript, setTranscript] = useState(false);
//   const [summary, setSummary] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isDown, setDown] = useState(false);
//   const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
//   const [transcribeText, setTranscribeText] = useState('');
//   const [showTranscribeText, setShowTranscribeText] = useState(false);
//   const [showEventSummary, setshowEventSummary] = useState(false);
//   const [eventSummary, seteventSummary] = useState('');

//   const handleStart = () => {
//     startRecording();
//   };

//   const handleStop = () => {
//     stopRecording();
//   };

//   //const handleDownload = () => {
//     // if (mediaBlobUrl) {
//     //   const downloadLink = document.createElement('a');
//     //   downloadLink.href = mediaBlobUrl;
//     //   downloadLink.download = 'recording.webm';
//     //   downloadLink.click();
//     //   setDown(true);
//     // }
//     const handleDownload = async () => {
//       if (mediaBlobUrl) {
//         try {
//           const saveFileAsync = async () => {
//             const response = await fetch(mediaBlobUrl);
//             const audioBlob = await response.blob();
    
//             const handle = await window.showSaveFilePicker({
//               suggestedName: 'recording.wav',
//               types: [
//                 {
//                   description: 'WebM Audio',
//                   accept: { 'audio/webm': ['.webm'] },
//                 },
//               ],
//             });
    
//             const writableStream = await handle.createWritable();
//             await writableStream.write(audioBlob);
//             await writableStream.close();
    
//             console.log('Audio file saved successfully');
//           };
    
//           await saveFileAsync();
//         } catch (error) {
//           console.error('Error saving audio file:', error);
//         }
//         setDown(true);
//       }
//     };
//   const transcribeAudio = async () => {
//     if (!mediaBlobUrl) return;
//     setShowTranscribeText(true);
//     console.log('Transcribe audio');
//     setTranscribeText('transcribe');

//   };
//   const hideTranscribeText = () => {
//     setShowTranscribeText(false);
//     setTranscribeText('');// Hide the transcribe text
//   };
//   const hideeventSummary = () => {
//     setshowEventSummary(false);

//     seteventSummary('');// Hide the Summarize text
//   };


//   const summarizeAudio = async () => {
//     if (!mediaBlobUrl) return;
//     setshowEventSummary(true);
//     console.log('Summarize audio');
//     seteventSummary('summarize');
    
//   };

//   const handleEvent = () => {
//     console.log('Handle event');
//   };

//   const playSound = () => {
//     if (!mediaBlobUrl) return;
//     const audio = new Audio(mediaBlobUrl);
//     audio.play();
//     setIsPlaying(true);
//     audio.onended = () => setIsPlaying(false);
//   };

//   const stopPlayback = () => {
//     if (!mediaBlobUrl || !isPlaying) return;
//     const audio = new Audio(mediaBlobUrl);
//     audio.pause();
//     setIsPlaying(false);
//   };

//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '0vh' }}>
//       <h1 class="head" variant="h5">Record Audio</h1>
      
        
//         <Grid container spacing={2} marginTop={10}>
//           {!isDown && (
//             <Button class="button" variant="contained"  onClick={status === 'recording' ? handleStop : handleStart}>
//               {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
//             </Button>
//           )}
//           {mediaBlobUrl && !isDown && (
//             <>
//               <Button class="button_down" variant="contained"  onClick={handleDownload} disabled={!mediaBlobUrl}>
//                 Move to functions 
//               </Button>
//               <Button class="button" variant="contained" color="secondary" onClick={isPlaying ? stopPlayback : playSound} disabled={!mediaBlobUrl}>
//                 {isPlaying ? 'Stop Playback' : 'Play Recording'}
//               </Button>
//             </>
//           )}
//           </Grid>
//           <Grid container spacing={2} marginTop={10} >
//           {isDown && 
//           !transcribeText && !eventSummary &&
//           (
//             <>
            
//               <Button class="button" variant="contained"  onClick={transcribeAudio}>
//                 Transcribe
//               </Button>
//               <Button class="button" variant="contained"  onClick={summarizeAudio}>
//                 Summarize
//               </Button>
//               <Button class="button" variant="contained"  onClick={handleEvent}>
//                 Event
//               </Button>
//             </>
//           )}
//         </Grid>
//         {showTranscribeText && (
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <Typography variant="h6">{transcribeText}</Typography>
//           <Button class="back"  variant="contained"  onClick={hideTranscribeText}>
//           <Link to="/">Back</Link>
//         </Button>
//         </div>
//       )}
//         {
//         showEventSummary &&
//         (
//           <div>
//           <Typography variant="h6">{eventSummary}</Typography>
//           <Button class="back" variant="contained"  onClick={hideeventSummary}>
//           <Link to="/">Back</Link>
//         </Button>
//         </div>
          
//         )}
//     </div>
//   );
// };


// export default App;
import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [permission,setPermission] = useState(false);
  const [stream, setStream] = useState(null);

  const [audioFile, setAudioFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryv, setSummaryv] = useState(false);
  const [eventv, seteventv] = useState(false);

  const getMicrophone = async () => {
    if("MediaRecorder" in window){
      console.log("MediaRecorder available");
      try{
        const streamData = await navigator.mediaDevices.getUserMedia({audio: true});
        setStream(streamData);
        setPermission(true);
      }
      catch(err){
        console.log(err);
        alert("Microphone permission denied");
      }
    }else{
      alert("MediaRecorder not available");
    }
  };

  const handleSummarize = () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audioData', audioFile);
    
    fetch('http://localhost:5000/summarize', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      setSummary(data.summary);
      seteventv(false);
      setSummaryv(true);
      setMessage(data.message);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  };

  const handleEventExtraction = () => {
    setLoading(true);
    setSummaryv(false);
    seteventv(true);
    const formData = new FormData();
    formData.append('audioData', audioFile);
    
    fetch('http://localhost:5000/event', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // setSummary(data.summary);
      setTasks(data.tasks.map(task => `${task.eventname}, ${task.timeline.date} , ${task.timeline.date}: ${task.timeline.start_time.hours}:${task.timeline.start_time.minutes}:${task.timeline.start_time.seconds}- ${task.timeline.date}: ${task.timeline.end_time.hours}:${task.timeline.end_time.minutes}:${task.timeline.end_time.seconds}`)); // Fix the mapping here
      setMessage(data.message);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  };

  return (
    <>
    <h1>Audio Processing</h1>

    <div className="App" style={{ flexDirection: 'column', height: '30vh'}}>
  
      <div style={{display: 'flex'}}>
      <div className="audio-controls">
                    {!permission ? (
                        <button onClick={getMicrophone} type="button" style={{marginRight: '2rem'}}> 
                            Test Mic
                        </button>
                    ): null}
                    {permission ? (
                          <button onClick={getMicrophone} type="button" style={{marginRight: '3rem'}}> Record
                          </button>
                    ): null}
                </div>
      <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} />
      </div>
      <div>
        <button className='button' onClick={handleSummarize}>Summarize</button>
        <button className='button' onClick={handleEventExtraction}>Extract Events</button>
      </div>
      {loading ? (
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <div>
          {summaryv && summary && (
            <div>
              <h2>Summary:</h2>
              <p>{summary}</p>
            </div>
          )}
          {eventv && tasks.length > 0 && (
            <div>
              <h2>Extracted Tasks:</h2>
              <ul>
                {tasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ul>
            </div>
          )}
          {message && (
            <div>
              <h3>{message}</h3>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

export default App;
