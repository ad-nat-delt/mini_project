import React from "react";
import ReactDOM from "react-dom/client";
import { AudioRecorder } from 'react-audio-voice-recorder';


const AudioRecording = () => {
const addAudioElement = (blob) => {
  const url = URL.createObjectURL(blob);
  const audio = document.createElement("audio");
  audio.src = url;
  audio.controls = true;
  document.body.appendChild(audio);
};

return(

    <AudioRecorder 
      onRecordingComplete={addAudioElement}
      audioTrackConstraints={{
        noiseSuppression: true,
        echoCancellation: true,
      }} 
      downloadOnSavePress={true}
      downloadFileExtension="wav"
    />

) 
};

export default AudioRecording;



// import React, { useState } from 'react';
// import { AudioRecorder } from 'react-audio-voice-recorder';

// const AudioRecording = () => {
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [audioChunks, setAudioChunks] = useState([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [audioUrl, setAudioUrl] = useState('');
  

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
      
//       const chunks = [];
//       recorder.ondataavailable = (e) => {
//         chunks.push(e.data);
//       };

//       recorder.onstop = (e) => {
//         const blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=0' });
//         setAudioChunks([blob]);
//         setAudioUrl(URL.createObjectURL(blob));
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//     } catch (error) {
//       console.error('Error accessing user media:', error);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//       setIsRecording(false);
//     }
//   };

//   const saveAudio = () => {
//     if (audioChunks.length > 0) {
//       const blob = audioChunks[0];
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'recorded_audio.wav';
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//       setAudioChunks([]);
//       setAudioUrl('');
//     }
//   };

//   const playAudio = () => {
//     if (audioUrl) {
//       const audio = new Audio(audioUrl);
//       audio.play();
//       setIsPlaying(true);
//       audio.onended = () => setIsPlaying(false);
//     }
//   };

//   const stopPlayback = () => {
//     if (audioUrl && isPlaying) {
//       const audio = new Audio(audioUrl);
//       audio.pause();
//       setIsPlaying(false);
//     }
//   };

//   return (
//     <div>
//       <button onClick={isRecording ? stopRecording : startRecording}>
//         {isRecording ? 'Stop' : 'Record'}
//       </button>
//       {!isRecording && audioChunks.length > 0 && (
//         <>
//           <button onClick={playAudio} disabled={isPlaying}>
//             Play Audio
//           </button>
//           <button onClick={stopPlayback} disabled={!isPlaying}>
//             Stop Playback
//           </button>
//           <button onClick={saveAudio}>Save Audio</button>
//         </>
//       )}
//     </div>
//   );
// };

// export default AudioRecording;
