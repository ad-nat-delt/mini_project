// src/components/FileUpload.js
import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const FileUpload = ({ setSummary }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (endpoint) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`http://localhost:5000/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (endpoint === 'summarize') {
        setSummary(response.data.summary);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage('Error uploading file');
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={() => handleUpload('upload')}>Transcribe</button>
      <button onClick={() => handleUpload('summarize')}>Summarize</button>
      {message && <p>{message}</p>}
    </div>
  );
};


FileUpload.propTypes = {
  setSummary: PropTypes.func.isRequired,  
}
export default FileUpload;
