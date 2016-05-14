'use strict';

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({ port: 8990 });

var clients = [];

wss.on('open', function () {
  return console.log('Listening on port 8990!');
});

function broadcast(data, from) {
  var sends = 0;
  clients.filter(function (client) {
    return client !== from && client.readyState === WebSocket.OPEN;
  }).forEach(function (client) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJLFlBQVksUUFBUSxJQUFSLENBQWhCO0FBQ0EsSUFBSSxrQkFBa0IsVUFBVSxNQUFoQztBQUNBLElBQUksTUFBTSxJQUFJLGVBQUosQ0FBb0IsRUFBRSxNQUFNLElBQVIsRUFBcEIsQ0FBVjs7QUFFQSxJQUFJLFVBQVUsRUFBZDs7QUFFQSxJQUFJLEVBQUosQ0FBTyxNQUFQLEVBQWU7QUFBQSxTQUFNLFFBQVEsR0FBUixDQUFZLHlCQUFaLENBQU47QUFBQSxDQUFmOztBQUVBLFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5QixJQUF6QixFQUE4QjtBQUM1QixNQUFJLFFBQVEsQ0FBWjtBQUNBLFVBQ0csTUFESCxDQUNVO0FBQUEsV0FBVSxXQUFXLElBQVgsSUFBbUIsT0FBTyxVQUFQLEtBQXNCLFVBQVUsSUFBN0Q7QUFBQSxHQURWLEVBRUcsT0FGSCxDQUVXLGtCQUFVO0FBQ2pCLFdBQU8sSUFBUCxDQUFZLElBQVo7QUFDQTtBQUNELEdBTEg7O0FBT0UsVUFBUSxHQUFSLENBQVksU0FBWixFQUF1QixJQUF2QixFQUE2QixNQUE3QixFQUFxQyxLQUFyQyxFQUE0QyxTQUE1QztBQUNIOztBQUVELElBQUksRUFBSixDQUFPLFlBQVAsRUFBcUIsU0FBUyxVQUFULENBQW9CLEVBQXBCLEVBQXdCO0FBQzNDLFVBQVEsSUFBUixDQUFhLEVBQWI7O0FBRUEsS0FBRyxFQUFILENBQU0sU0FBTixFQUFpQixTQUFTLFFBQVQsQ0FBa0IsT0FBbEIsRUFBMkI7QUFDMUMsWUFBUSxHQUFSLENBQVksY0FBWixFQUE0QixPQUE1QixFQUFxQyxFQUFyQztBQUNBLGNBQVUsT0FBVixFQUFtQixFQUFuQjtBQUNELEdBSEQ7QUFJRCxDQVBEIiwiZmlsZSI6InNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBXZWJTb2NrZXQgPSByZXF1aXJlKCd3cycpO1xudmFyIFdlYlNvY2tldFNlcnZlciA9IFdlYlNvY2tldC5TZXJ2ZXI7XG52YXIgd3NzID0gbmV3IFdlYlNvY2tldFNlcnZlcih7IHBvcnQ6IDg5OTAgfSk7XG5cbnZhciBjbGllbnRzID0gW107XG5cbndzcy5vbignb3BlbicsICgpID0+IGNvbnNvbGUubG9nKCdMaXN0ZW5pbmcgb24gcG9ydCA4OTkwIScpKTtcblxuZnVuY3Rpb24gYnJvYWRjYXN0KGRhdGEsIGZyb20pe1xuICB2YXIgc2VuZHMgPSAwO1xuICBjbGllbnRzXG4gICAgLmZpbHRlcihjbGllbnQgPT4gY2xpZW50ICE9PSBmcm9tICYmIGNsaWVudC5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTilcbiAgICAuZm9yRWFjaChjbGllbnQgPT4ge1xuICAgICAgY2xpZW50LnNlbmQoZGF0YSk7XG4gICAgICBzZW5kcysrO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJyogU2VudCAnLCBkYXRhLCAnIHRvICcsIHNlbmRzLCAnY2xpZW50cycpO1xufTtcblxud3NzLm9uKCdjb25uZWN0aW9uJywgZnVuY3Rpb24gY29ubmVjdGlvbih3cykge1xuICBjbGllbnRzLnB1c2god3MpO1xuXG4gIHdzLm9uKCdtZXNzYWdlJywgZnVuY3Rpb24gaW5jb21pbmcobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKCdyZWNlaXZlZDogJXMnLCBtZXNzYWdlLCB3cyk7XG4gICAgYnJvYWRjYXN0KG1lc3NhZ2UsIHdzKTtcbiAgfSk7XG59KTtcbiJdfQ==