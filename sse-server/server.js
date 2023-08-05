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
const propMap = new Map();


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

function keyPropResponse(key, prop, response, reason) {
  this.key = key;
  this.prop = prop;
  this.response = response; 
  this.reason = reason;
}

function clientMessage(type, key, prop) {
  this.type = type; // either adjust, add, or delete
  this.key = key; // the prop key
  this.prop = prop; // the prop itself
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

  const data = `data: ${JSON.stringify(propMap, replacer)}\n\n`;

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


// The following three methods are handled differently at the client end
// both sendNew and adjust are handled identically
// deleteLine for all is adjusted by deleting the key from the client's dictionary

// A helper function to propagate a newLine to all clients
// this will  
function sendNewLineToAll(key) {
  let message = new clientMessage(
    "new", 
    key, 
    propMap.get(key), 
  )

  clients.forEach(client => client.response.write(
    `data: ${JSON.stringify(message)}\n\n`
  ))
}

// A helper function to propagate line adjustments to all clients
function adjustLineForAll(key) {
  // line.type = "adj"
  // clients.forEach(client => client.response.write(`data: ${JSON.stringify(line)}\n\n`))

  let message = new clientMessage(
    "adjust", 
    key, 
    propMap.get(key), 
  )

  clients.forEach(client => client.response.write(
    `data: ${JSON.stringify(message)}\n\n`
  ))

}

function deleteLineForAll(key) {
  let message = new clientMessage(
    "delete",
    key, 
    propMap.get(key), 
  )
  
  clients.forEach(client => client.response.write(
    `data: ${JSON.stringify(message)}\n\n`
  ))
}

async function addFact(request, response, next) {
  console.log("adding a fact")

  // here we have two possible things that can happen
  // in the first case, (coldstart) the prop doesn't currently exist
  // (so we don't have a player/attribute existing combo in the propArray already
  // in this case we simply take the incoming line, convert it into a prop object and add it to the new prop line
  // on the other hand it could already exist. 
  // in this case we need to scan through the array and add the line to the corresponding prop

  const incomingProp = request.body;

  // should probably have differentiated responses depending on whether we're adding to a line
  // or if we created a new line
  if ( propMap.has(incomingProp.player + incomingProp.attribute + incomingProp.league) ) {
    propMap.get(incomingProp.player + incomingProp.attribute + incomingProp.league).addBookLine
    (incomingProp.line);
    console.log(propMap.get(incomingProp.player + incomingProp.attribute + incomingProp.league))
    response.json(
      new keyPropResponse(
        incomingProp.player + incomingProp.attribute + incomingProp.league, 
        propMap.get(incomingProp.player + incomingProp.attribute + incomingProp.league), 
        "Success", 
        "New Line Created"
      )
    );
    sendNewLineToAll(incomingProp.player + incomingProp.attribute + incomingProp.league)

  } else { // for now lets just assume that the input is properly formed
    propMap.set(incomingProp.player + incomingProp.attribute + incomingProp.league, new prop(incomingProp.player, incomingProp.league, incomingProp.attribute, incomingProp.line));
    console.log(propMap.get(incomingProp.player + incomingProp.attribute + incomingProp.league))
    response.json(
      new keyPropResponse(
        incomingProp.player + incomingProp.attribute + incomingProp.league, 
        propMap.get(incomingProp.player + incomingProp.attribute + incomingProp.league),
        "Success",
        "New Line Added"
      )
    );
    sendNewLineToAll(incomingProp.player + incomingProp.attribute + incomingProp.league)

  }

  return 

  // // lets iterate through all the jaunts and see if there is a player prop for us to add to
  // var i = 0; 
  // for ( ; i < propArray.length; i++ ) {
  //   if ( propArray[i].player == incomingProp.player && 
  //       propArray[i].attribute == incomingProp.attribute ) {
  //         console.log("printing in goofy ahh")
  //         console.log("incoming:")
  //         console.log(incomingProp)
  //         console.log("current prop:")
  //         console.log(propArray[i])
  //         propArray[i].addBookLine(incomingProp.line); 
  //         response.json(propArray[i])
  //         adjustLineForAll(newProp)
  //         break
  //   }
  // }

  // if ( i == propArray.length ) {
  //   newProp = new prop(incomingProp.player, incomingProp.league, incomingProp.attribute, incomingProp.line)
  //   propArray.push(newProp);
  //   response.json(newProp);
  //   sendNewLineToAll(newProp);
  // }

  // return
}
app.post('/fact', addFact);

async function adjustFact(request, response, next) {
  console.log("adjusting a fact")
  console.log(request.body)
  const modLine = request.body; 
  // var i = 0;
  // for (; i < propArray.length; i++ ) {
  //   if ( propArray[i].player == modLine.player &&
  //       propArray[i].attribute == modLine.attribute) {
      
  //     for ( var j = 0; j < propArray[i].lines.length; j++ ) {
  //       propArray[i].lines[j] = modLine.line
  //       response.json(propArray[i])
  //       adjustLineForAll(propArray[i])
  //       break
  //     }      
  //   }
  // }

  if ( propMap.has(modLine.player + modLine.attribute + modLine.league) ) {
    for ( var j = 0; j < propMap.get(modLine.player + modLine.attribute + modLine.league).lines.length; j++ ) {
      if ( propMap.get(modLine.player + modLine.attribute + modLine.league).lines[j].book === modLine.line.book ) {
        propMap.get(modLine.player + modLine.attribute + modLine.league).lines[j] = modLine.line;
        response.json(
          new keyPropResponse(
            modLine.player + modLine.attribute + modLine.league, 
            propMap.get(modLine.player + modLine.attribute + modLine.league),
            "Success",
            "The prop for the line you were trying to add was found and modified."
          )
        );
        adjustLineForAll(modLine.player + modLine.attribute + modLine.league);
        break;
      }

    }

  } else {
    response.json(
      new keyPropResponse(
        modLine.player + modLine.attribute + modLine.league, 
        "",
        "Failure",
        "The prop for the line you were trying to add was not found. Try adding the line first instead?"
      )
    );

  }

  return 

}
app.put('/fact', adjustFact);


async function delFact(request, response, next) {
  const delRequest = request.body; 

  if ( propMap.has(delRequest.key) ) {
    let numberOfLines = propMap.get(delRequest.key).lines.length;
    propMap.get(delRequest.key).lines = propMap.get(delRequest.key).lines.filter(function(line) {
      return line.book !== delRequest.book;
    })

    if ( numberOfLines === propMap.get(delRequest.key).lines.length ) {
      response.json(
        new keyPropResponse(
          delRequest.key, 
          propMap.get(delRequest.key),
          "Failure",
          "The prop for which you were trying to delete the line doesn't have the book that you specified."
        )
      );
    } else {
      if ( propMap.get(delRequest.key).lines.length !== 0 ) {
        response.json(
          new keyPropResponse(
            delRequest.key, 
            propMap.get(delRequest.key),
            "Success",
            "The prop for which you were trying to delete the line matched the book you specified, and was removed."
          )
        );
        adjustLineForAll(delRequest.key);
      } else {
        response.json(
          new keyPropResponse(
            delRequest.key, 
            propMap.get(delRequest.key),
            "Success",
            "The prop for which you were trying to delete the line matched the book you specified, and was removed. Additionally, that was the only line that it had so the prop was removed altogether."
          )
        );
        deleteLineForAll(delRequest.key);
        propMap.delete(delRequest.key);

      }

    }

  } else {
    response.json(
      new keyPropResponse(
        delRequest.key, 
        "",
        "Failure",
        "The prop for which you were trying to delete the line doesn't currently exist."
      )
    );
  }

}
app.delete('/fact', delFact); 

async function getFacts(request, response, next) {
  response.json(
    JSON.stringify(propMap, replacer)
  )
}
app.get('/fact', getFacts);
// to get deletion to work we need to do the following: 
// basically, we have to generate a random key 
// for each line we receive from a user
// and then return that key to the user
// keep in mind that this key needs to be based off of the player, attribute, and league
// so the key can probably be player + attribute + league
// and then we key into this value and modify it with the value provided it by the user
// eventually this key should be made more secure (so that bad-actors can't modify said lines)
// but for now we can have the key just be player + attribute + league
// so before our data type looked like [prop]
// but now it should be {player+attribute+league, prop}


function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}