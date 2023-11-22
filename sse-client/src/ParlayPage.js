import React from 'react';
import NavigationBar from './NavigationBar';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ParlayPage = ({ parlayLines }) => {
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
          {line.book}: {line.value}: {line.over}/{line.under}
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
                    <th>Primary Book Line</th>
                    <th>Other Book Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td>{line.player}</td>
                      <td>{line.league}</td>
                      <td>{line.attribute}</td>
                      <td>{line.game}</td>
                      <td>
                        {line.lines.find(bookLine => bookLine.book === bookName)?.value}
                      </td>
                      <td>
                        {renderOtherBookLines(line.lines, bookName)}
                      </td>
                    </tr>
                  ))}
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
