
var WebSocket = require('ws');
var wsServer = 'ws://172.16.40.132:8990'
var ws;

function init(){
  ws = new WebSocket(wsServer);

  ws.on('open', function open() {
    // ?
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