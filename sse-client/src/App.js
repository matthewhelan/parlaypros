import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // okay so we're going to have a propArray that is recalculated
  // everytime the propMap is re-computed
  const [ propArray, setPropArray ] = useState([]);
  const [ propMap, setPropMap ] = useState(new Map());
  const [ filteredProps, setFilteredProps ] = useState([]);
  const [ listening, setListening ] = useState(false);
  const [ uniqueBooks, setUniqueBooks ] = useState([]);
  const [ uniquePlayerNames, setUniquePlayerNames ] = useState([]);
  const [ uniqueLeagues, setUniqueLeagues ] = useState([]);
  const [ uniqueAttributes, setUniqueAttributes ] = useState([]);
  const [ playerFilterValue, setPlayerFilter ] = useState("");
  const [ leagueFilterValue, setLeagueFilter ] = useState("");
  const [ attributeFilterValue, setAttributeFilter ] = useState("");

  useEffect(() => {
    if (!listening) {
      const events = new EventSource('http://localhost:5000/events');
      setListening(true);
  
      return () => {
        events.close(); // Close the connection when the component unmounts
      };
    }
  }, [listening]);
  

  function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

  useEffect(() => {
    setPropArray(() => {
      return Array.from(propMap.values())})
  }, [propMap]);

  useEffect(() => {
    const handleEventMessage = (event) => {
      const parsedData = JSON.parse(event.data, reviver);
      // lets make some cases here
      // if its a new line then we concat
      // if we need to drop a line then we remove
      // and if we need to adjust a line we just do that

      if ( (parsedData instanceof Map) ) { // starting case where we are hydrated by data from the server
        setPropMap(parsedData)
      } else if ( parsedData.type === "adjust" || parsedData.type === "new" ) {
        const changeMap = propMap
        changeMap.set(parsedData.key, parsedData.prop)
        setPropMap(new Map(changeMap));
        
      } else if ( parsedData.type === "delete" ) {
        const changeMap = propMap
        changeMap.delete(parsedData.key)
        setPropMap(new Map(changeMap));
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
        propArray.flatMap((prop) => prop.lines.flatMap((line) => line.book))
      )
    );
    setUniqueBooks(updatedUniqueBooks);

    const updatedUniquePlayerNames = Array.from(
      new Set(
        propArray.flatMap((prop) => prop.player)
      )
    )
    setUniquePlayerNames(updatedUniquePlayerNames)

    const updatedAttributes = Array.from(
      new Set(
        propArray.flatMap((prop) => prop.attribute)
      )
    )
    setUniqueAttributes(updatedAttributes)

    const updatedLeagues = Array.from(
      new Set(
        propArray.flatMap((prop) => prop.league)
      )
    )
    setUniqueLeagues(updatedLeagues)

  }, [propArray])

  useEffect(() => {
    setFilteredProps(propArray.filter((prop) => 
      (playerFilterValue === "" || playerFilterValue === prop.player) &&
      (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
      (attributeFilterValue === "" || attributeFilterValue === prop.attribute)
    ))
  }, [propArray, playerFilterValue, leagueFilterValue, attributeFilterValue])

  const applyPlayerFilter = (event) => {
    const selectedPlayer = document.getElementById('playerFilter').value;
    setPlayerFilter(selectedPlayer);
  };

  const applyLeagueFilter = (event) => {
    const selectedLeague = document.getElementById('leagueFilter').value;
    setLeagueFilter(selectedLeague);
  };

  const applyAttributeFilter = (event) => {
    const selectedAttribute = document.getElementById('attributeFilter').value;
    setAttributeFilter(selectedAttribute);
  };

  return (
    <div>
    <label for="playerFilter">Filter by Player:</label>
    <select id="playerFilter" onChange={applyPlayerFilter}>
      <option value="">Select Player</option>
      {
        uniquePlayerNames.map((playerName, i) => (
          <option key={i} value={playerName}>{playerName}</option>
        ))
      }
    </select>

    <label for="leagueFilter">Filter by League:</label>
    <select id="leagueFilter" onChange={applyLeagueFilter}>
      <option value="">Select League</option>
      {
        uniqueLeagues.map((league, i) => (
          <option key={i} value={league}>{league}</option>
        ))
      }
    </select>

    <label for="attributeFilter">Filter by Attribute:</label>
    <select id="attributeFilter" onChange={applyAttributeFilter}>
      <option value="">Select Attribute</option>
      {
        uniqueAttributes.map((attribute, i) => (
          <option key={i} value={attribute}>{attribute}</option>
        ))
      }
    </select>

    <table className="stats-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>League</th>
          <th>Attribute</th>
          {
            uniqueBooks.map((book, i) => 
              <th key={i}>{book}</th>
            )
          }
        </tr>
      </thead>
      <tbody>
        {/* props.map((prop, i) => (
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
          )) */}
        { filteredProps.map((prop, index) => (
          <TableRow key={prop.player + prop.attribute + prop.league} rowData={prop} books={uniqueBooks}/>
        ))}
      </tbody>
    </table>
    </div>
  );
}

const TableRow = ({ rowData, books }) => {
  const [rowClass, setRowClass] = useState("");
  const [prevRowData, setPrevRowData] = useState(rowData);

  const animateChanges = () => {
    if ( rowClass === "" ) {
      setRowClass("newRow")
      setTimeout(() => {
        setRowClass("standardRow");
      }, 2000);
    } else if ( rowClass === "standardRow" ) {
      // case that we're changing a line
      // we need to figure out which line we're changing 
      // and how its moving

    }
  };

  const animateLineChanges = () => {
    rowData.lines.forEach((line, index) => {
      if ( line.value && prevRowData.lines[index] ) {
        const prevValue = prevRowData.lines[index].value;
        
        // Apply animation class to the corresponding cell when the value changes
        const cellElement = document.getElementById(`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${rowData.lines[index].book}`);
        if (cellElement) {
          if ( prevValue === "-" ) {
            cellElement.classList.add('new-cell-animation');
            setTimeout(() => {
              cellElement.classList.remove('new-cell-animation');
            }, 1000); // Adjust this time to match the transition duration in the CSS
  
          } else if ( Number(line.value) > Number(prevValue) ) {
            cellElement.classList.add('increase-cell-animation');
            setTimeout(() => {
              cellElement.classList.remove('increase-cell-animation');
            }, 1000); // Adjust this time to match the transition duration in the CSS
  
  
          } else if ( Number(line.value) < Number(prevValue) ) {
            cellElement.classList.add('decrease-cell-animation');
            setTimeout(() => {
              cellElement.classList.remove('decrease-cell-animation');
            }, 1000); // Adjust this time to match the transition duration in the CSS
  
          }
        }
          
      }
      
    });
  };

  useEffect(() => {
    animateLineChanges();
    setPrevRowData(rowData);
  }, [rowData, books]);

  useEffect(() => {
    animateChanges();
  }, [rowData, books]);

  return (
    <tr className={rowClass}>
      <td>{rowData.player}</td>
      <td>{rowData.league}</td>
      <td>{rowData.attribute}</td>
      {books.map((book, j) => {
        const matchingLine = rowData.lines.find((line) => line.book === book);
        return (
          <td key={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`} id={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`}>
            {matchingLine ? matchingLine.value : '-'}
            <sup>{matchingLine ? matchingLine.over : '-'}</sup>&frasl;<sub>{matchingLine ? matchingLine.under : '-'}</sub>
          </td>
        );
      })}
    </tr>
  );
};

export default App;