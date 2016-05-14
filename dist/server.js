'use strict';

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8990 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJLGtCQUFrQixRQUFRLElBQVIsRUFBYyxNQUFwQztJQUNJLE1BQU0sSUFBSSxlQUFKLENBQW9CLEVBQUUsTUFBTSxJQUFSLEVBQXBCLENBRFY7O0FBR0EsSUFBSSxFQUFKLENBQU8sWUFBUCxFQUFxQixTQUFTLFVBQVQsQ0FBb0IsRUFBcEIsRUFBd0I7QUFDM0MsS0FBRyxFQUFILENBQU0sU0FBTixFQUFpQixTQUFTLFFBQVQsQ0FBa0IsT0FBbEIsRUFBMkI7QUFDMUMsWUFBUSxHQUFSLENBQVksY0FBWixFQUE0QixPQUE1QjtBQUNELEdBRkQ7QUFHRCxDQUpEIiwiZmlsZSI6InNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBXZWJTb2NrZXRTZXJ2ZXIgPSByZXF1aXJlKCd3cycpLlNlcnZlclxuICAsIHdzcyA9IG5ldyBXZWJTb2NrZXRTZXJ2ZXIoeyBwb3J0OiA4OTkwIH0pO1xuXG53c3Mub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbiBjb25uZWN0aW9uKHdzKSB7XG4gIHdzLm9uKCdtZXNzYWdlJywgZnVuY3Rpb24gaW5jb21pbmcobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKCdyZWNlaXZlZDogJXMnLCBtZXNzYWdlKTtcbiAgfSk7XG59KTsiXX0=