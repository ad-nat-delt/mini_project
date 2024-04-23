// import React, { useState } from 'react';

// import './App.css'
// import Link from 'react-router-dom';


// const App = () => {
//   console.log("Hello");
//   const [transcript, setTranscript] = useState(false);
//   const [summary, setSummary] = useState(false);
//   const [transcribeText, setTranscribeText] = useState('');
//   const [showTranscribeText, setShowTranscribeText] = useState(false);
//   const [showEventSummary, setshowEventSummary] = useState(false);
//   const [eventSummary, seteventSummary] = useState('');

//  
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

//  

//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '0vh' }}>
//       <h1 class="head" variant="h5">Record Audio</h1>
      
        
//        
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
import React, { useState } from 'react';
import './App.css';
import { Button, Grid } from '@mui/material';
import AudioRecording from './AudioR';

function App() {
  
  const [isValue, setValue] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryv, setSummaryv] = useState(false);
  const [eventv, setEventv] = useState(false);

  const handleSummarize = () => {
    if (!audioFile) {
      alert('No audio');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('audioData', audioFile);

    fetch('http://localhost:5000/summarize', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setSummary(data.summary);
        setEventv(false);
        setSummaryv(true);
        setMessage(data.message);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  const handleEventExtraction = () => {
    if (!audioFile) {
      alert('No audio');
      return;
    }
    setLoading(true);
    setSummaryv(false);
    setEventv(true);
    const formData = new FormData();
    formData.append('audioData', audioFile);

    fetch('http://localhost:5000/event', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setTasks(
          data.tasks.map(
            (task) =>
              `${task.eventname}, ${task.timeline.date}, ${task.timeline.date}: ${task.timeline.start_time.hours}:${task.timeline.start_time.minutes}:${task.timeline.start_time.seconds}- ${task.timeline.date}: ${task.timeline.end_time.hours}:${task.timeline.end_time.minutes}:${task.timeline.end_time.seconds}`
          )
        ); // Fix the mapping here
        setMessage(data.message);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  return (
    <>
      <h1>Audio Processing</h1>

      <div className="App" style={{ flexDirection: 'column', height: '30vh' }}>
        <div style={{display: 'flex', flexDirection: 'column', marginTop: '30px'}}>
          <div >
            <Grid container spacing={2} marginTop={10}>
              {!isValue && (
                <>
                <AudioRecording/>

      <input type="file" onChange={(e) => { setAudioFile(e.target.files[0]); setValue(true); }} />
      </>
              )}
              
              {isValue && (
                <>
                  <div style={{ display: 'flex', width: '100wv' }}>
                    <button className="button" onClick={handleSummarize}>
                      Summarize
                    </button>
                    <button className="button" onClick={handleEventExtraction}>
                      Extract Events
                    </button>
                  </div>
                </>
              )}
            </Grid>
          </div>
          
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
