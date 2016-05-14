var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8990 });

var clients = [];

function broadcast(data, from){
  clients
    .filter(client => client !== from)
    .forEach(client => client.send(data));
};

wss.on('connection', function connection(ws) {
  clients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    broadcast(message, ws);
  });
});
