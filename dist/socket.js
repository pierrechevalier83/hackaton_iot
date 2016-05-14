'use strict';

var WebSocket = require('ws');
var wsServer = 'ws://ruiramos.com:8990';
var ws;

function init(cb) {
  ws = new WebSocket(wsServer);

  ws.on('open', function open() {
    // ?
    cb && cb();
    console.log('ws connection open!');
  });

  ws.on('close', function close() {
    console.log('disconnected');
    ws = new WebSocket(wsServer);
  });
}

function send(event) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  } else {
    console.log('Trying to send a message but the ws died!');
  }
}

function onMessage(cb) {
  ws.on('message', cb);
}

function close() {
  ws.close();
}

module.exports = {
  init: init, onMessage: onMessage, send: send, close: close
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxJQUFJLFlBQVksUUFBUSxJQUFSLENBQWhCO0FBQ0EsSUFBSSxXQUFXLHdCQUFmO0FBQ0EsSUFBSSxFQUFKOztBQUVBLFNBQVMsSUFBVCxDQUFjLEVBQWQsRUFBaUI7QUFDZixPQUFLLElBQUksU0FBSixDQUFjLFFBQWQsQ0FBTDs7QUFFQSxLQUFHLEVBQUgsQ0FBTSxNQUFOLEVBQWMsU0FBUyxJQUFULEdBQWdCOztBQUU1QixVQUFNLElBQU47QUFDQSxZQUFRLEdBQVIsQ0FBWSxxQkFBWjtBQUNELEdBSkQ7O0FBTUEsS0FBRyxFQUFILENBQU0sT0FBTixFQUFlLFNBQVMsS0FBVCxHQUFpQjtBQUM5QixZQUFRLEdBQVIsQ0FBWSxjQUFaO0FBQ0EsU0FBSyxJQUFJLFNBQUosQ0FBYyxRQUFkLENBQUw7QUFDRCxHQUhEO0FBSUQ7O0FBRUQsU0FBUyxJQUFULENBQWMsS0FBZCxFQUFvQjtBQUNsQixNQUFHLEdBQUcsVUFBSCxLQUFrQixVQUFVLElBQS9CLEVBQW9DO0FBQ2xDLE9BQUcsSUFBSCxDQUFRLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBUjtBQUNELEdBRkQsTUFFTztBQUNMLFlBQVEsR0FBUixDQUFZLDJDQUFaO0FBQ0Q7QUFDRjs7QUFFRCxTQUFTLFNBQVQsQ0FBbUIsRUFBbkIsRUFBc0I7QUFDcEIsS0FBRyxFQUFILENBQU0sU0FBTixFQUFpQixFQUFqQjtBQUNEOztBQUVELFNBQVMsS0FBVCxHQUFnQjtBQUNkLEtBQUcsS0FBSDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLFlBRGUsRUFDVCxvQkFEUyxFQUNFLFVBREYsRUFDUTtBQURSLENBQWpCIiwiZmlsZSI6InNvY2tldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIFdlYlNvY2tldCA9IHJlcXVpcmUoJ3dzJyk7XG52YXIgd3NTZXJ2ZXIgPSAnd3M6Ly9ydWlyYW1vcy5jb206ODk5MCdcbnZhciB3cztcblxuZnVuY3Rpb24gaW5pdChjYil7XG4gIHdzID0gbmV3IFdlYlNvY2tldCh3c1NlcnZlcik7XG5cbiAgd3Mub24oJ29wZW4nLCBmdW5jdGlvbiBvcGVuKCkge1xuICAgIC8vID9cbiAgICBjYiAmJiBjYigpO1xuICAgIGNvbnNvbGUubG9nKCd3cyBjb25uZWN0aW9uIG9wZW4hJylcbiAgfSk7XG5cbiAgd3Mub24oJ2Nsb3NlJywgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgY29uc29sZS5sb2coJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIHdzID0gbmV3IFdlYlNvY2tldCh3c1NlcnZlcik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kKGV2ZW50KXtcbiAgaWYod3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pe1xuICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnVHJ5aW5nIHRvIHNlbmQgYSBtZXNzYWdlIGJ1dCB0aGUgd3MgZGllZCEnKVxuICB9XG59XG5cbmZ1bmN0aW9uIG9uTWVzc2FnZShjYil7XG4gIHdzLm9uKCdtZXNzYWdlJywgY2IpO1xufVxuXG5mdW5jdGlvbiBjbG9zZSgpe1xuICB3cy5jbG9zZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdCwgb25NZXNzYWdlLCBzZW5kLCBjbG9zZVxufVxuIl19