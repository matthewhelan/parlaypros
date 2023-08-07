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
  const [ sortByValue, setSortByValue ] = useState("")
  const [ primaryBookValue, setPrimaryBookValue ] = useState("")

  useEffect(() => {
    if (!listening) {
      const events = new EventSource('http://localhost:5001/events');
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
  
    const events = new EventSource('http://localhost:5001/events');
    events.onmessage = handleEventMessage;
  
    return () => {
      events.close(); // Close the connection when the component unmounts
    };
  }, []);

  useEffect(() => {
    const updatedUniquePlayerNames = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute)
        ).flatMap((prop) => prop.player)
      )
    )
    setUniquePlayerNames(updatedUniquePlayerNames)

    const updatedAttributes = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute)
        ).flatMap((prop) => prop.attribute)
      )
    )
    setUniqueAttributes(updatedAttributes)

    const updatedLeagues = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute)
        ).flatMap((prop) => prop.league)
      )
    )
    setUniqueLeagues(updatedLeagues)

  }, [filteredProps, playerFilterValue, leagueFilterValue, attributeFilterValue])

  useEffect(() => {
    setFilteredProps(propArray.filter((prop) => 
      (playerFilterValue === "" || playerFilterValue === prop.player) &&
      (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
      (attributeFilterValue === "" || attributeFilterValue === prop.attribute) && 
      (primaryBookValue === "" || propHasBookLine(prop, primaryBookValue) )
    ))
  }, [propArray, playerFilterValue, leagueFilterValue, attributeFilterValue, primaryBookValue, primaryBookValue])

  function propHasBookLine(prop, book) {
    const containedBooks = new Set (
      prop.lines.flatMap((line => line.book))
    )
      
    return containedBooks.has(book);
  }
  
  useEffect(() => {
    const updatedUniqueBooks = Array.from(
      new Set(
        propArray.flatMap((prop) => prop.lines.flatMap((line) => line.book))
      )
    ).filter((book) => book !== primaryBookValue);

    if ( primaryBookValue !== "" ) {
      updatedUniqueBooks.unshift(primaryBookValue);
    }

    setUniqueBooks(updatedUniqueBooks);

  }, [propArray, primaryBookValue])

  useEffect(() => {
    const sortedProps = filteredProps.sort((prop1, prop2) => {
      const playerName1 = prop1.player;
      const playerName2 = prop2.player;

      if ( sortByValue === "playerAsc" ) {
        return playerName1 < playerName2 ? -1 : 1; 
      } else if ( sortByValue === "playerDesc" ) {
        return playerName1 > playerName2 ? -1 : 1; 
      }

    })

    if ( sortByValue !== "" ) {
      setFilteredProps(sortedProps)
    }
  }, [sortByValue, filteredProps])

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

  const applySortBy = (event) => {
    const selectedFilter = document.getElementById('sortBy').value;
    setSortByValue(selectedFilter);
  }

  const applyPrimaryBookSelector = (event) => {
    const primaryBook = document.getElementById('primaryBookSelector').value;
    setPrimaryBookValue(primaryBook);
  }

  return (
    <div>
    <div> 
      <label for="playerFilter">Filter by Player:</label>
      <select value={playerFilterValue} id="playerFilter" onChange={applyPlayerFilter}>
        <option value="">Select Player</option>
        {
          uniquePlayerNames.map((playerName, i) => (
            <option key={i} value={playerName}>{playerName}</option>
          ))
        }
      </select>

      <label for="leagueFilter">Filter by League:</label>
      <select value={leagueFilterValue} id="leagueFilter" onChange={applyLeagueFilter}>
        <option value="">Select League</option>
        {
          uniqueLeagues.map((league, i) => (
            <option key={i} value={league}>{league}</option>
          ))
        }
      </select>

      <label for="attributeFilter">Filter by Attribute:</label>
      <select value={attributeFilterValue} id="attributeFilter" onChange={applyAttributeFilter}>
        <option value="">Select Attribute</option>
        {
          uniqueAttributes.map((attribute, i) => (
            <option key={i} value={attribute}>{attribute}</option>
          ))
        }
      </select>

      <label for="sortBy">Sort By:</label>
      <select value={sortByValue} id="sortBy" onChange={applySortBy}>
        <option value="">Select Sort Order</option>
        <option value="playerAsc">Player Name Asc</option>
        <option value="playerDesc">Player Name Desc</option>
      </select>

      <label for="primaryBook">Primary Book:</label>
      <select value={primaryBookValue} id="primaryBookSelector" onChange={applyPrimaryBookSelector}>
        <option value="">Select Primary Book</option>
        {
          uniqueBooks.map((book, i) => (
            <option key={i} value={book}>{book}</option>
          ))
        }
      </select>

    </div>

    <table className="stats-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>League</th>
          <th>Attribute</th>
          <th>Game</th>
          <th>Avg Line</th>
          <th>O/U</th>
          <th>Odds To Hit</th>
          {
            uniqueBooks.map((book, i) => 
              <th key={i}>{book}</th>
            )
          }
        </tr>
      </thead>
      <tbody>
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
  const [overOrUnder, setOverOrUnder] = useState("");
  const [hitOdds, setHitOdds] = useState("");


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
    setDirectionAndOdds()
  }, [rowData, books]);

  function setDirectionAndOdds() {
    // extract the line corresponding to book[0]
    // set overOrUnder and hitOdds accordingly
    const arrayOfMatchingBook = rowData.lines.filter((line) => line.book === books[0])

    if ( arrayOfMatchingBook.length === 0 ) {
      return;
    }

    setOverOrUnder(arrayOfMatchingBook[0].overOrUnder)
    setHitOdds("%" + String((arrayOfMatchingBook[0].hitOdds * 100).toFixed(2)))
  }

  return (
    <tr className={rowClass}>
      <td>{rowData.player}</td>
      <td>{rowData.league}</td>
      <td>{rowData.attribute}</td>
      <td>{rowData.game}</td>
      <td>{rowData.impliedLine}</td>
      
      <td>{overOrUnder}</td>
      <td>{hitOdds}</td>
      
      
      {books.map((book, j) => {
        const matchingLine = rowData.lines.find((line) => line.book === book);
        return (
          <td key={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`} id={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`}>
            {matchingLine ? matchingLine.value : '-'}
            <sup>{matchingLine ? matchingLine.over : '-'}</sup>&frasl;<sub>{matchingLine ? matchingLine.under : '-'}</sub>
            <sup>{matchingLine ? matchingLine.noVigOver : '-'}</sup>&frasl;<sub>{matchingLine ? matchingLine.noVigUnder : '-'}</sub>
          </td>
        );
      })}
    </tr>
  );
};

export default App;