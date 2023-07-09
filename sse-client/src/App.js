import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ props, setProps ] = useState([]);
  const [ listening, setListening ] = useState(false);
  const [ uniqueBooks, setUniqueBooks ] = useState([]);

  const handleFactUpdate = (searchCondition, newValue) => {
    setProps((prevProps) => {
      const updatedProps = prevProps.map((prop) => {
        if ( searchCondition(prop) ) {
          return { ...prop, lines: newValue };
        }
        return prop
      }); 

      return updatedProps;
    })
  };

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
      console.log("parsedData:")
      console.log(parsedData)

      // lets make some cases here
      // if its a new line then we concat
      // if we need to drop a line then we remove
      // and if we need to adjust a line we just do that

      if ( parsedData.type === "adj" ) {
        // handleFactUpdate((prop) => prop.player === parsedData.player && prop.attribute === parsedData.attribute, parsedData.lines);
        console.log("adjusting old")

        setProps((prevProps) => {
          const updatedProps = prevProps.map((prop) => {
            if ( parsedData.player === prop.player && 
                parsedData.attribute === prop.attribute) {
              return { ...prop, lines: parsedData.lines };
            }
            return prop
          }); 
          console.log(updatedProps)
    
          return updatedProps;
        })
      } else if ( parsedData.type === "new" ) {
        console.log("adding new")
        setProps((props) => props.concat(parsedData));
      } else { // the starting case where we are hydrated with data from the server
        setProps((props) => props.concat(parsedData));
      }
      
    };
  
    const events = new EventSource('http://localhost:5000/events');
    events.onmessage = handleEventMessage;
  
    return () => {
      events.close(); // Close the connection when the component unmounts
    };
  }, []);

  useEffect(() => {
    const updatedUniqueBooks = Array.from(
      new Set(
        props.flatMap((prop) => prop.lines.flatMap((line) => line.book))
      )
    );
    setUniqueBooks(updatedUniqueBooks);
  }, [props])

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Attribute</th>
          {
            uniqueBooks.map((book, i) => 
              <th key={i}>{book}</th>
            )
          }
        </tr>
      </thead>
      <tbody>
        { props.map((prop, i) => (
          <tr key={`prop-${i}`}>
            <td>{prop.player}</td>
            <td>{prop.attribute}</td>
            {uniqueBooks.map((book, j) => {
              const matchingLine = prop.lines.find((line) => line.book === book);
              return (
                <td key={`prop-${i}-book-${j}`}>
                  {matchingLine ? matchingLine.value : '-'}
                </td>
              );
            })}
          </tr>
        )) }
      </tbody>
    </table>
  );
}

export default App;