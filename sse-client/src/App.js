import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ facts, setFacts ] = useState([]);
  const [ listening, setListening ] = useState(false);

  const handleFactUpdate = (searchCondition, newValue) => {
    setFacts((prevFacts) => {
      const updatedFacts = prevFacts.map((fact) => {
        if ( searchCondition(fact) ) {
          return { ...fact, line: newValue };
        }
        return fact
      }); 

      return updatedFacts;
    })
  }

  useEffect(() => {
    if (!listening) {
      const events = new EventSource('http://localhost:5000/events');
      setListening(true);
  
      return () => {
        events.close(); // Close the connection when the component unmounts
      };
    }
  }, [listening]);
  
  useEffect(() => {
    const handleEventMessage = (event) => {
      const parsedData = JSON.parse(event.data);

      // lets make some cases here
      // if its a new line then we concat
      // if we need to drop a line then we remove
      // and if we need to adjust a line we just do that

      if ( parsedData.type === "adj" ) {
        handleFactUpdate((fact) => fact.name === parsedData.name, parsedData.line)
      } else if ( parsedData.type === "new" ) {
        setFacts((facts) => facts.concat(parsedData));
      } else {
        setFacts((facts) => facts.concat(parsedData));
      }

      
    };
  
    const events = new EventSource('http://localhost:5000/events');
    events.onmessage = handleEventMessage;
  
    return () => {
      events.close(); // Close the connection when the component unmounts
    };
  }, []);

  

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Attribute</th>
          <th>Book</th>
          <th>Dummy</th>
          <th>Line</th>
        </tr>
      </thead>
      <tbody>
        {
          facts.map((fact, i) =>
            <tr key={i}>
              <td>{fact.player}</td>
              <td>{fact.attribute}</td>
              <td>{fact.book}</td>
              <td>{fact.dummy}</td>
              <td>{fact.line}</td>
            </tr>
          )
        }
      </tbody>
    </table>
  );
}

export default App;