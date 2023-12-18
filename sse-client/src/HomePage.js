import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function HomePage( { addToParlay }) {
  // okay so we're going to have a propArray that is recalculated
  // everytime the propMap is re-computed
  const [ propArray, setPropArray ] = useState([]);
  const [ propMap, setPropMap ] = useState(new Map());
  const [ filteredProps, setFilteredProps ] = useState([]);
  const [ sortedAndFilteredProps, setSortedAndFilteredProps ] = useState([]);
  const [ listening, setListening ] = useState(false);
  const [ uniqueBooks, setUniqueBooks ] = useState([]);
  const [ uniquePlayerNames, setUniquePlayerNames ] = useState([]);
  const [ uniqueLeagues, setUniqueLeagues ] = useState([]);
  const [ uniqueAttributes, setUniqueAttributes ] = useState([]);
  const [ uniqueGames, setUniqueGames ] = useState([]);
  const [ playerFilterValue, setPlayerFilter ] = useState("");
  const [ leagueFilterValue, setLeagueFilter ] = useState("");
  const [ attributeFilterValue, setAttributeFilter ] = useState("");
  const [ gameFilterValue, setGameFilter ] = useState("");
  const [ sortByValue, setSortByValue ] = useState("")
  const [ primaryBookValue, setPrimaryBookValue ] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bookImages = {
    DraftKings : require('./static/dk.png'),
    BetMGM : require('./static/mgm.png'),
    Caesars : require('./static/caesars.png'),
    FanDuel : require('./static/fd.png'),
    Betano : require('./static/betano.png'),
    Underdog : require('./static/ud.png'),
    BetRivers : require('./static/betrivers.png'),
    PointsBet : require('./static/pointsbet.png'),
  }
  const [ onlyOneBookFilterValue, setSelectedOnlyOneBookFilterValue ] = useState(false);

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
      return Array.from(propMap.values())
    })
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
  }, [propMap]);

  useEffect(() => {
    const updatedUniquePlayerNames = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute) &&
          (gameFilterValue === "" || gameFilterValue === prop.game)
        ).flatMap((prop) => prop.player)
      )
    )
    setUniquePlayerNames(updatedUniquePlayerNames)

    const updatedAttributes = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute) &&
          (gameFilterValue === "" || gameFilterValue === prop.game)
        ).flatMap((prop) => prop.attribute)
      )
    )
    setUniqueAttributes(updatedAttributes)

    const updatedLeagues = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute) &&
          (gameFilterValue === "" || gameFilterValue === prop.game)
        ).flatMap((prop) => prop.league)
      )
    )
    setUniqueLeagues(updatedLeagues)

    const updatedGames = Array.from(
      new Set(
        filteredProps.filter((prop) => 
          (playerFilterValue === "" || playerFilterValue === prop.player) &&
          (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
          (attributeFilterValue === "" || attributeFilterValue === prop.attribute) &&
          (gameFilterValue === "" || gameFilterValue === prop.game)
        ).flatMap((prop) => prop.game)
      )
    )
    setUniqueGames(updatedGames)

  }, [filteredProps, playerFilterValue, leagueFilterValue, attributeFilterValue, gameFilterValue])

  useEffect(() => {
    setFilteredProps(propArray.filter((prop) => 
      (playerFilterValue === "" || playerFilterValue === prop.player) &&
      (leagueFilterValue === "" || leagueFilterValue === prop.league) &&
      (attributeFilterValue === "" || attributeFilterValue === prop.attribute) && 
      (gameFilterValue === "" || gameFilterValue === prop.game) &&
      (primaryBookValue === "" || propHasBookLine(prop, primaryBookValue) ) && 
      (onlyOneBookFilterValue || prop.lines.length > 1)
    ))
  }, [propArray, playerFilterValue, leagueFilterValue, attributeFilterValue, gameFilterValue, primaryBookValue, onlyOneBookFilterValue])

  function propHasBookLine(prop, book) {
    const containedBooks = new Set (
      prop.lines.flatMap((line => line.book))
    )
      
    return containedBooks.has(book);
  }

  function getPropBookLine(prop, book) {
    const propBookLine = prop.lines.filter((line => line.book === book))
    if ( propBookLine.length === 0 ) {
      return undefined
    } else {
      return propBookLine[0]
    }
    
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
    if ( sortByValue === "" ) {
      setSortedAndFilteredProps(filteredProps)
    }

    const sortedProps = filteredProps.slice(0).sort((prop1, prop2) => {
      const line1 = getPropBookLine(prop1, primaryBookValue);
      const line2 = getPropBookLine(prop2, primaryBookValue);

      if ( typeof line1 === 'undefined' || typeof line2 === 'undefined' ) {
        return true // this should never happen
      } else {
        if ( sortByValue === "hitOddsAscending" ) {
          return line1.hitOdds < line2.hitOdds ? -1 : 1; 
        } else if ( sortByValue === "hitOddsDescending" ) {
          return line1.hitOdds > line2.hitOdds ? -1 : 1; 
        } 
        return true
      }

    })
    
    setSortedAndFilteredProps(sortedProps)     
  }, [sortByValue, filteredProps, primaryBookValue])

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

  const applyGameFilter = (event) => {
    const selectedGame = document.getElementById('gameFilter').value;
    setGameFilter(selectedGame);
  }

  const applyPrimaryBookSelector = (event) => {
    const primaryBook = document.getElementById('primaryBookSelector').value;
    setPrimaryBookValue(primaryBook);
  }

  const applyOnlyOneBookFilter = (event) => {
    console.log("current onlyOneBookFilterValue: ")
    console.log(onlyOneBookFilterValue)
    setSelectedOnlyOneBookFilterValue(!onlyOneBookFilterValue);
  }

  return (

    <div className="vh-100 bg-dark text-light p-4">
            <NavigationBar></NavigationBar>
    <div className='container'> 

    <div className='form-group'>
      <label for="playerFilter" className="form-label">Filter by Player:</label>
      <select class="form-control bg-dark text-light" value={playerFilterValue} id="playerFilter" onChange={applyPlayerFilter}>
        <option value="">Select Player</option>
        {
          uniquePlayerNames.map((playerName, i) => (
            <option key={i} value={playerName}>{playerName}</option>
          ))
        }
      </select>

      <label for="leagueFilter" className="form-label">Filter by League:</label>
      <select class="form-control bg-dark text-light" value={leagueFilterValue} id="leagueFilter" onChange={applyLeagueFilter}>
        <option value="">Select League</option>
        {
          uniqueLeagues.map((league, i) => (
            <option key={i} value={league}>{league}</option>
          ))
        }
      </select>

      <label for="attributeFilter" className="form-label">Filter by Attribute:</label>
      <select class="form-control bg-dark text-light" value={attributeFilterValue} id="attributeFilter" onChange={applyAttributeFilter}>
        <option value="">Select Attribute</option>
        {
          uniqueAttributes.map((attribute, i) => (
            <option key={i} value={attribute}>{attribute}</option>
          ))
        }
      </select>

      <label for="gameFilter" className="form-label">Filter by Game:</label>
      <select class="form-control bg-dark text-light" value={gameFilterValue} id="gameFilter" onChange={applyGameFilter}>
        <option value="">Select Game</option>
        {
          uniqueGames.map((game, i) => (
            <option key={i} value={game}>{game}</option>
          ))
        }
      </select>

      <label for="sortBy" className="form-label">Sort By:</label>
      <select class="form-control bg-dark text-light" value={sortByValue} id="sortBy" onChange={applySortBy}>
        <option value="">Select Sort Order</option>
        <option value="hitOddsDescending">Odds Descending</option>
        <option value="hitOddsAscending">Odds Ascending</option>
      </select>

      <label for="primaryBook" className="form-label">Primary Book:</label>
      <select  class="form-control bg-dark text-light" value={primaryBookValue} id="primaryBookSelector" onChange={applyPrimaryBookSelector}>
        <option value="">Select Primary Book</option>
        {
          uniqueBooks.map((book, i) => (
            <option key={i} value={book}>{book}</option>
          ))
        }
      </select>
      </div>


      <label htmlFor="showAdvanced" className='form-check-label'>Show Advanced Info&ensp;</label>
      <input
        type="checkbox" className="form-check-input"
        checked={showAdvanced} id="showAdvanced"
        onChange={() => setShowAdvanced(!showAdvanced)}
      />

      <br></br>
          <label for="onlyOneBookFilter">Show lines with one book&ensp;</label>
          <input type="checkbox" id="onlyOneBookFilter" name="onlyOneBookFilter" onChange={applyOnlyOneBookFilter} />

    </div>
    <div className='container-fluid'>
    {/* <div className='table-hover' > */}
    <table className="table table-dark table-hover">
      <thead>
        <tr>
          <th>Player</th>
          <th>League</th>
          <th>Attribute</th>
          <th>Game</th>
          {showAdvanced &&<th>Avg Line</th>}
          <th>O/U</th>
          <th>Odds To Hit</th>
          {
            uniqueBooks.map((book, i) => 
              <th key={i}>
                <img src={bookImages[book]} alt={book} width="30" height="30" />
              </th>
            )
          }
          {primaryBookValue !== "" && <th>Add to Parlay</th>}
          
        </tr>
      </thead>
      <tbody>
        { sortedAndFilteredProps.map((prop, index) => (
          <TableRow key={prop.player + prop.attribute + prop.league} rowData={prop} books={uniqueBooks} showAdvanced={showAdvanced} onAddToParlay={() => addToParlay(prop)} isPrimaryBookSelected={primaryBookValue !== ""}
          />
        ))}
      </tbody>
    </table>
    </div>
    </div>
  
   
  );
}

const TableRow = ({ rowData, books, showAdvanced, onAddToParlay, isPrimaryBookSelected }) => {
  const [rowClass, setRowClass] = useState("");
  const [prevRowData, setPrevRowData] = useState(rowData);
  const [overOrUnder, setOverOrUnder] = useState("");
  const [hitOdds, setHitOdds] = useState("");
  const [pushOdds, setPushOdds] = useState("");



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
      setHitOdds(String((arrayOfMatchingBook[0].hitOdds * 100).toFixed(2))+'%')
      if (arrayOfMatchingBook[0].pushOdds !== null) {
        setPushOdds((arrayOfMatchingBook[0].pushOdds * 100).toFixed(2) + '%');
      }  
    }

  return (
    <tr className={rowClass}>
      <td>{rowData.player}</td>
      <td>{rowData.league}</td>
      <td>{rowData.attribute}</td>
      <td>{rowData.game}</td>
      {showAdvanced ? <td>{rowData.impliedLine}</td> : ''}
      
      <td>{overOrUnder}</td>

      <td>{hitOdds}
      {showAdvanced && pushOdds ? <div className="small-gray-text">Push Odds {pushOdds}</div>: ''}
      </td>      
      
      {books.map((book, j) => {
        const matchingLine = rowData.lines.find((line) => line.book === book);
        return (
          <td key={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`} id={`prop-${rowData.player}-${rowData.league}-${rowData.attribute}-book-${book}`}>
            {matchingLine ? matchingLine.value : '-'}

            {showAdvanced ? (
            <span>
              <sup>{matchingLine ? matchingLine.noVigOver : ''}</sup>
              {matchingLine && matchingLine.over !== '' && matchingLine.under !== '' && <>&frasl;</>}
              <sub>{matchingLine ? matchingLine.noVigUnder : ''}</sub>
            </span>
            ) : (
            <span>
              <sup>{matchingLine ? matchingLine.over : ''}</sup>
              {matchingLine && matchingLine.over !== '' && matchingLine.under !== '' && <>&frasl;</>}
              <sub>{matchingLine ? matchingLine.under : ''}</sub>
            </span>
            )}
          </td>
        );
      })}
      {isPrimaryBookSelected && (
        <td>
          <button onClick={onAddToParlay} className="btn btn-sm btn-primary">+</button>
        </td>
      )}
    </tr>
  );
};

export default HomePage;