
var WebSocket = require('ws');
var wsServer = 'ws://ruiramos.com:8990'
var ws;

function init(cb){
  ws = new WebSocket(wsServer);

  ws.on('open', function open() {
    // ?
    cb && cb();
    console.log('ws connection open!')
  });

  ws.on('close', function close() {
    console.log('disconnected');
    ws = new WebSocket(wsServer);
  });
}

function send(event){
  if(ws.readyState === WebSocket.OPEN){
    ws.send(JSON.stringify(event));
  } else {
    console.log('Trying to send a message but the ws died!')
  }
}

function onMessage(cb){
  ws.on('message', cb);
}

module.exports = {
  init, onMessage, send
}
