// src/components/Summary.js
import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const Summary = ({ summary, setEvents }) => {
  const handleGenerateEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/events');
      setEvents(response.data.tasks);
    } catch (error) {
      console.error('Error generating events', error);
    }
  };

  return (
    <div>
      <h2>Summary</h2>
      <p>{summary}</p>
      <button onClick={handleGenerateEvents}>Generate Events</button>
    </div>
  );
};


Summary.propTypes = {
  summary: PropTypes.string.isRequired,
  setEvents: PropTypes.func.isRequired,
};
export default Summary;
