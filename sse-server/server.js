const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = 5000;

let clients = [];
let propArray = [];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})

// defining a line object in the javascript way: 
function prop(player, league, attribute, line) {
  this.player = player; 
  this.league = league;
  this.attribute = attribute; 
  this.lines = [line]
  this.type = "";

  this.deleteBookLine=deleteBookLine;
  function deleteBookLine(bookLine) {
    this.lines = this.lines.filter((line) => {
        if ( line.book !== bookLine.book ) {
            return line;
        }
    });
    // have to clean up object if it has no new lines
    return;
  }
  
  this.addBookLine=addBookLine; 
  function addBookLine(bookLine) {
    this.lines = this.lines.concat(bookLine);
  }

  this.modBookLine=modBookLine; 
  function modBookLine(bookLine) {
      this.lines = this.lines.map((line) => {
          if ( line.book === bookLine.book ) {
              return { ...bookLine };
          }
          return line
      });
  }

}

// configures the initial SSE connection with each client
// my question is how this works in terms of a massively distributed system
// take the case where we have infinite SSE connections, can a server handle all of those connections? Or do we need to split them up. 
// regardless eventually we'll need a ton of down-stream forwarders
function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(propArray)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}
app.get('/events', eventsHandler);


// A helper function to propagate a newLine to all clients
function sendNewLineToAll(line) {
  console.log("in sending lines function:")
  line.type = "new"
  console.log(line)
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(line)}\n\n`))
  console.log(propArray)
}

// A helper function to propagate line adjustments to all clients
function adjustLineForAll(line) {
  line.type = "adj"
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(line)}\n\n`))
}

async function addFact(request, response, next) {

  // here we have two possible things that can happen
  // in the first case, (coldstart) the prop doesn't currently exist
  // (so we don't have a player/attribute existing combo in the propArray already
  // in this case we simply take the incoming line, convert it into a prop object and add it to the new prop line
  // on the other hand it could already exist. 
  // in this case we need to scan through the array and add the line to the corresponding prop

  const incomingProp = request.body;

  // lets iterate through all the jaunts and see if there is a player prop for us to add to
  var i = 0; 
  for ( ; i < propArray.length; i++ ) {
    if ( propArray[i].player == incomingProp.player && 
        propArray[i].attribute == incomingProp.attribute ) {
          console.log("printing in goofy ahh")
          console.log("incoming:")
          console.log(incomingProp)
          console.log("current prop:")
          console.log(propArray[i])
          propArray[i].addBookLine(incomingProp.line); 
          response.json(propArray[i])
          adjustLineForAll(newProp)
          break
    }
  }

  if ( i == propArray.length ) {
    newProp = new prop(incomingProp.player, incomingProp.league, incomingProp.attribute, incomingProp.line)
    propArray.push(newProp);
    response.json(newProp);
    sendNewLineToAll(newProp);
  }

  return
}
app.post('/fact', addFact);

async function adjustFact(request, response, next) {
  console.log("adjusting a fact")
  console.log(request.body)
  const modLine = request.body; 
  var i = 0;
  for (; i < propArray.length; i++ ) {
    if ( propArray[i].player == modLine.player &&
        propArray[i].attribute == modLine.attribute) {
      
      for ( var j = 0; j < propArray[i].lines.length; j++ ) {
        propArray[i].lines[j] = modLine.line
        response.json(propArray[i])
        adjustLineForAll(propArray[i])
        break
      }      
    }
  }
  
  return 
}
app.put('/fact', adjustFact);


// async function delFact(request, response, next) {

// }
// app.delete('/fact', delFact); 