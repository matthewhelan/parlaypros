import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ParlayPage from './ParlayPage'; 

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {

  const [parlayLines, setParlayLines] = useState([]);

  const addToParlay = (line) => {
    setParlayLines(prevLines => {
      // Check if line already exists in parlayLines
      if (!prevLines.find(l => l.id === line.id)) {
        const newLines = [...prevLines, line];
  
        // Send newLines to the server
        fetch('http://localhost:5001/parlayLines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parlayLines: newLines }),
        })
        .then(response => response.text())
        .then(data => console.log("Server response:", data))
        .catch((error) => {
          console.error('Error:', error);
        });
  
        return newLines;
      }
      return prevLines;
    });
  };
    

  useEffect(() => {
    fetch('http://localhost:5001/parlayLines')
      .then(response => response.json())
      .then(data => setParlayLines(data))
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage addToParlay={addToParlay}/>} /> {/* Home route */}
        <Route path="/parlay" element={<ParlayPage parlayLines={parlayLines} />} /> {/* New page route */}
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  
  );
}


export default App;