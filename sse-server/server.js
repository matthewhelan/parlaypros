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
let facts = [];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(facts)}\n\n`;

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

function sendNewLineToAll(line) {
  console.log("in sending lines function:")
  line.type = "new"
  console.log(line)
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(line)}\n\n`))
  console.log(facts)
}

function adjustLineForAll(line) {
  line.type = "adj"
  console.log(line)
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(line)}\n\n`))
}

async function addFact(request, response, next) {
  console.log("adding a fact")
  console.log(request.body)
  const newFact = request.body;
  facts.push(newFact);
  response.json(newFact)
  console.log(facts)
  return sendNewLineToAll(newFact);
}

app.post('/fact', addFact);

async function adjustFact(request, response, next) {
  console.log("adjusting a fact")
  console.log(request.body)
  const modFact = request.body; 
  for ( var i = 0; i < facts.length; i++ ) {
    if ( facts[i].player == request.body.player ) {
      facts[i].line = request.body.line
      break
    }
  }
  response.json(facts[i])
  console.log(facts)
  return adjustLineForAll(facts[i])
}

app.put('/fact', adjustFact);