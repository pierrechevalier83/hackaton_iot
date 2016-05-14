var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8990 });

var clients = [];

wss.on('open' => console.log('Listening on port 8990!'));

function broadcast(data, from){
  clients
    .filter(client => client !== from)
    .forEach(client => client.send(data));
};

wss.on('connection', function connection(ws) {
  clients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('received: %s', message, ws);
    broadcast(message, ws);
  });
});
