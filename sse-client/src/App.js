import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ParlayPage from './ParlayPage'; 

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {

  const [parlayLines, setParlayLines] = useState([]);

  const addToParlay = (line) => {
    console.log(line)
    setParlayLines(prevLines => {
  
      // Check if a line with the same player, game, and attribute already exists in parlayLines
      if (!prevLines.some(l => l.player === line.player && l.game === line.game && l.attribute === line.attribute)) {
        const newLines = [...prevLines, line];
        console.log('new line')
  
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

  const removeFromParlay = (lineToRemove) => {
    setParlayLines(prevLines => {
      const updatedLines = prevLines.filter(line => 
        !(line.player === lineToRemove.player && line.game === lineToRemove.game && line.attribute === lineToRemove.attribute)
      );
  
      // Send updatedLines to the server
      fetch('http://localhost:5001/parlayLines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parlayLines: updatedLines }),
      })
      .then(response => response.text())
      .then(data => console.log("Server response:", data))
      .catch((error) => {
        console.error('Error:', error);
      });
  
      return updatedLines;
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
        <Route path="/parlay" element={<ParlayPage parlayLines={parlayLines} removeFromParlay={removeFromParlay} />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  
  );
}


export default App;