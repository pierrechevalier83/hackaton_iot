
var WebSocketServer = require('ws');
var ws;

function init(){
  var ws = new WebSocket('ws://172.16.40.132:8990');

  ws.on('open', function open() {
    // ?
    console.log('ws connection open!')
  });
}

function send(event){
  ws.send(JSON.stringify(event));
}

function onMessage(cb){
  ws.on('message', cb);
}

module.exports = {
  init, onMessage, send
}