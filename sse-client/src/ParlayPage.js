import React from 'react';
import NavigationBar from './NavigationBar';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ParlayPage = ({ parlayLines, removeFromParlay }) => {
  const organizeLinesByFirstBook = () => {
    const linesByFirstBook = {};
    parlayLines.forEach(line => {
      const firstBookName = line.lines[0]?.book;
      if (firstBookName) {
        if (!linesByFirstBook[firstBookName]) {
          linesByFirstBook[firstBookName] = [];
        }
        linesByFirstBook[firstBookName].push(line);
      }
    });
    return linesByFirstBook;
  };

  const renderOtherBookLines = (lines, primaryBook) => {
    return lines
      .filter(line => line.book !== primaryBook)
      .map((line, index) => (
        <div key={index}>
          {line.book}: Over - {line.over}, Under - {line.under}
        </div>
      ));
  };

  const linesByFirstBook = organizeLinesByFirstBook();

  return (
    <div className="vh-100 bg-dark text-light p-4">
      <NavigationBar></NavigationBar>
      <div className="container mt-4">
        <h2>Current Parlay Lines</h2>
        {Object.keys(linesByFirstBook).length > 0 ? (
          Object.entries(linesByFirstBook).map(([bookName, lines], bookIndex) => (
            <div key={bookIndex}>
              <h3>{bookName}</h3>
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>League</th>
                    <th>Attribute</th>
                    <th>Game</th>
                    <th>Expected Value</th>
                    <th>Over/Under</th>
                    <th>Hit Odds</th>
                    <th>Primary Book Line</th>
                    <th>Other Book Lines</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const primaryBookLine = line.lines.find(bookLine => bookLine.book === bookName);
                    return (
                      <tr key={index}>
                        <td>{line.player}</td>
                        <td>{line.league}</td>
                        <td>{line.attribute}</td>
                        <td>{line.game}</td>
                        <td>{primaryBookLine?.expectedValue}</td>
                        <td>{primaryBookLine?.overOrUnder}</td>
                        <td>{primaryBookLine?.hitOdds}</td>
                        <td>
                          {primaryBookLine?.value}
                        </td>
                        <td>
                          {renderOtherBookLines(line.lines, bookName)}
                        </td>
                        <td>
                        <button 
                          onClick={() => removeFromParlay(line)} 
                          className="btn btn-sm btn-danger" // Bootstrap classes for small, red buttons
                          title="Remove from Parlay">
                            <i className="bi bi-dash-circle"></i>X
                        </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>No parlay lines available.</p>
        )}
      </div>
    </div>
  );
};

export default ParlayPage;
