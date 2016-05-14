var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({ port: 8990 });

var clients = [];

wss.on('open', () => console.log('Listening on port 8990!'));

function broadcast(data, from){
  var sends = 0;
  clients
    .filter(client => client !== from && client.readyState === WebSocket.OPEN)
    .forEach(client => {
      client.send(data);
      sends++;
    });

    console.log('* Sent ', data, ' to ', sends, 'clients');
};

wss.on('connection', function connection(ws) {
  clients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('received: %s', message, ws);
    broadcast(message, ws);
  });
});
