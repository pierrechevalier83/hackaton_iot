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

module.exports = {
  init: init, onMessage: onMessage, send: send
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxJQUFJLFlBQVksUUFBUSxJQUFSLENBQWhCO0FBQ0EsSUFBSSxXQUFXLHdCQUFmO0FBQ0EsSUFBSSxFQUFKOztBQUVBLFNBQVMsSUFBVCxDQUFjLEVBQWQsRUFBaUI7QUFDZixPQUFLLElBQUksU0FBSixDQUFjLFFBQWQsQ0FBTDs7QUFFQSxLQUFHLEVBQUgsQ0FBTSxNQUFOLEVBQWMsU0FBUyxJQUFULEdBQWdCOztBQUU1QixVQUFNLElBQU47QUFDQSxZQUFRLEdBQVIsQ0FBWSxxQkFBWjtBQUNELEdBSkQ7O0FBTUEsS0FBRyxFQUFILENBQU0sT0FBTixFQUFlLFNBQVMsS0FBVCxHQUFpQjtBQUM5QixZQUFRLEdBQVIsQ0FBWSxjQUFaO0FBQ0EsU0FBSyxJQUFJLFNBQUosQ0FBYyxRQUFkLENBQUw7QUFDRCxHQUhEO0FBSUQ7O0FBRUQsU0FBUyxJQUFULENBQWMsS0FBZCxFQUFvQjtBQUNsQixNQUFHLEdBQUcsVUFBSCxLQUFrQixVQUFVLElBQS9CLEVBQW9DO0FBQ2xDLE9BQUcsSUFBSCxDQUFRLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBUjtBQUNELEdBRkQsTUFFTztBQUNMLFlBQVEsR0FBUixDQUFZLDJDQUFaO0FBQ0Q7QUFDRjs7QUFFRCxTQUFTLFNBQVQsQ0FBbUIsRUFBbkIsRUFBc0I7QUFDcEIsS0FBRyxFQUFILENBQU0sU0FBTixFQUFpQixFQUFqQjtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLFlBRGUsRUFDVCxvQkFEUyxFQUNFO0FBREYsQ0FBakIiLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgV2ViU29ja2V0ID0gcmVxdWlyZSgnd3MnKTtcbnZhciB3c1NlcnZlciA9ICd3czovL3J1aXJhbW9zLmNvbTo4OTkwJ1xudmFyIHdzO1xuXG5mdW5jdGlvbiBpbml0KGNiKXtcbiAgd3MgPSBuZXcgV2ViU29ja2V0KHdzU2VydmVyKTtcblxuICB3cy5vbignb3BlbicsIGZ1bmN0aW9uIG9wZW4oKSB7XG4gICAgLy8gP1xuICAgIGNiICYmIGNiKCk7XG4gICAgY29uc29sZS5sb2coJ3dzIGNvbm5lY3Rpb24gb3BlbiEnKVxuICB9KTtcblxuICB3cy5vbignY2xvc2UnLCBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBjb25zb2xlLmxvZygnZGlzY29ubmVjdGVkJyk7XG4gICAgd3MgPSBuZXcgV2ViU29ja2V0KHdzU2VydmVyKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHNlbmQoZXZlbnQpe1xuICBpZih3cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTil7XG4gICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeShldmVudCkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdUcnlpbmcgdG8gc2VuZCBhIG1lc3NhZ2UgYnV0IHRoZSB3cyBkaWVkIScpXG4gIH1cbn1cblxuZnVuY3Rpb24gb25NZXNzYWdlKGNiKXtcbiAgd3Mub24oJ21lc3NhZ2UnLCBjYik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0LCBvbk1lc3NhZ2UsIHNlbmRcbn1cbiJdfQ==