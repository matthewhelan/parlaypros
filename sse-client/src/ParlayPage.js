import React from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

const ParlayPage = ({ parlayLines }) => {
  console.log(parlayLines)
  return (
    <div className="vh-100 bg-dark text-light p-4">

    <NavigationBar></NavigationBar>

    <div className="container mt-4">
      <h2>Current Parlay Lines</h2>
      {parlayLines.length > 0 ? (
        <table className="table table-dark table-hover">
          <thead>
            <tr>
              <th>Player</th>
              <th>League</th>
              <th>Attribute</th>
              <th>Game</th>
              {/* Add columns for each book if necessary */}
              <th>Book/Line Info</th>
            </tr>
          </thead>
          <tbody>
            {parlayLines.map((line, index) => (
              <tr key={index}>
                <td>{line.player}</td>
                <td>{line.league}</td>
                <td>{line.attribute}</td>
                <td>{line.game}</td>
                <td>
                  {/* Display books/line information */}
                  {line.lines.map((bookLine, bookIndex) => (
                    <div key={bookIndex}>
                      {bookLine.book}: {bookLine.value}
                      {/* Add additional book line details if needed */}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No parlay lines available.</p>
      )}
    </div>
    </div>
  );
};

export default ParlayPage;
