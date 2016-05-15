"use strict";

/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

var sensorModule = require('jsupm_ttp223');
var buzzerModule = require("jsupm_buzzer");
var lcdModule = require("jsupm_i2clcd");
var groveSensor = require("jsupm_grove");
var socket = require('./socket');

var SENSORS = require('./sensors');
var STATE = {
  listening: 0,
  push: 1,
  pull: 2,
  connected: 3
};

var connectionExpiryTimeout = 3000;
var pullExpiredTimeout = 5000;
var leftConnectionTimeout = 1000;

// global state
var state;
var connectionTimeout;
var pullTimeout;

var touch = new sensorModule.TTP223(SENSORS.touch);
var buzzer = new buzzerModule.Buzzer(SENSORS.buzzer);
var lcd = new lcdModule.Jhd1313m1(SENSORS.lcd);
var redLed = new groveSensor.GroveLed(SENSORS.leds.red);
var greenLed = new groveSensor.GroveLed(SENSORS.leds.green);

function initialize() {
  socket.init(function () {
    // @todo remove -- this was debug only
    // state = STATE.connected;
    // socket.send({event: 'server:connected'});
  });

  state = STATE.listening;
  setInterval(readSensorValue, 100);

  socket.onMessage(function (data) {
    var msg = JSON.parse(data);

    if (msg.event === 'push') {
      handlePushMessage();
    } else if (msg.event === 'expired') {
      handleExpiredMessage();
    } else if (msg.event === 'missed') {
      handleMissedMessage();
    } else if (msg.event === 'setText' && state === STATE.connected) {
      setLcdText(msg.text);
    }
  });

  buzzer.playSound(buzzerModule.DO, 5000);
  buzzer.stopSound();
}

function handlePushMessage() {
  switch (state) {
    case STATE.listening:
    case STATE.pull:
      state = STATE.pull;
      pull();
      break;
    case STATE.push:
      state = STATE.connected;
      connect();
      break;
    case STATE.connected:
      // Nothing happens: we're connected
      break;
  }
}

function handleExpiredMessage() {
  switch (state) {
    case STATE.connected:
      connectionExpired();
      break;
  }
}

function handleMissedMessage() {
  switch (state) {
    case STATE.push:
      state = STATE.listening;
      updateState();
      break;
  }
}

function readSensorValue() {
  if (touch.isPressed()) {
    console.log(touch.name() + " is pressed");
    switch (state) {
      case STATE.listening:
      case STATE.push:
        state = STATE.push;
        push();
        break;
      case STATE.pull:
        state = STATE.connected;
        connect();
        break;
      case STATE.connected:
        resetExpiryTimeout();
        break;
    }
  } else {
    if (state === STATE.push) {
      state = STATE.listening;
      updateState();
    }
    // this makes sense but requires some more though.
    // the case is when you're connected and leave (stop holding)
    // you should eventually send an event signaling that you left so the
    // connection breaks
    // maybe we need another timeout here that will send this expiry *unless*
    // it gets
    else if (state === STATE.connected) {
        leftConnection();
      }
  }
}

function push() {
  console.log('pushing', state);
  socket.send({ event: 'push' });
  updateState();
  // TODO wait listen for 5 seconds and then go back to listening
}

function pull() {
  console.log('pulling', state);

  updateState();
  buzzer.playSound(buzzerModule.DO, 5000);
  setTimeout(function () {
    return buzzer.stopSound();
  }, 500);

  if (pullTimeout) {
    clearTimeout(pullTimeout);
  }

  pullTimeout = setTimeout(pullExpired, pullExpiredTimeout);
}

function connect() {
  console.log('connected!', state);
  socket.send({ event: 'push' });
  socket.send({ event: 'server:connected' });

  updateState();

  if (pullTimeout) {
    clearTimeout(pullTimeout);
  }

  connectionTimeout = setTimeout(connectionExpired, connectionExpiryTimeout);
}

function pullExpired() {
  console.log('pull expired');

  state = STATE.listening;
  updateState();

  socket.send({ event: 'missed' });
}

function connectionExpired() {
  console.log('Connection expired!');
  state = STATE.listening;
  updateState();

  clearTimeout(connectionTimeout);
  socket.send({ event: 'expired' });
  socket.send({ event: 'server:disconnected' });
}

function resetExpiryTimeout() {
  clearTimeout(connectionTimeout);
  connectionTimeout = setTimeout(connectionExpired, connectionExpiryTimeout);

  if (leftConnectionTimeout) {
    leftConnectionTimeout = null;
    clearTimeout(leftConnectionTimeout);
  }
}

function leftConnection() {
  if (!leftConnectionTimeout) {
    leftConnectionTimeout = setTimeout(connectionExpired, connectionExpiryTimeout);
  }
}

function updateState() {
  switch (state) {
    case STATE.listening:
      redLed.off();
      greenLed.off();
      lcd.setColor(0, 0, 0);
      lcd.clear();
      break;
    case STATE.pull:
      redLed.on();
      greenLed.off();
      lcd.setColor(255, 0, 0);
      lcd.clear();
      lcd.write("Please, don't");
      lcd.setCursor(1, 0);
      lcd.write("let me hang!");
      lcd.setCursor(0, 0);
      break;
    case STATE.push:
      redLed.off();
      greenLed.off();
      lcd.setColor(0, 0, 255);
      lcd.clear();
      lcd.write("Anyone there?");
      break;
    case STATE.connected:
      redLed.off();
      greenLed.on();
      lcd.setColor(0, 255, 0);
      lcd.clear();
      lcd.write("Hello, World!");
      break;
  }
}

function setLcdText(text, scroll) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.write(text.substr(0, 14));
  lcd.setCursor(1, 0);
  lcd.write(text.substr(15, 30));
  if (scroll) lcd.scroll();
}

initialize();

// Print message when exiting
process.on('SIGINT', function () {
  socket.close();
  console.log("Exiting...");
  process.exit(0);
});
//# sourceMappingURL=data:application/json;base64,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QUFYO0FBQ0UsYUFBTyxHQUFQO0FBQ0EsZUFBUyxHQUFUO0FBQ0EsVUFBSSxRQUFKLENBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixHQUFuQjtBQUNBLFVBQUksS0FBSjtBQUNBLFVBQUksS0FBSixDQUFVLGVBQVY7QUFDQTtBQUNGLFNBQUssTUFBTSxTQUFYO0FBQ0UsYUFBTyxHQUFQO0FBQ0EsZUFBUyxFQUFUO0FBQ0EsVUFBSSxRQUFKLENBQWEsQ0FBYixFQUFnQixHQUFoQixFQUFxQixDQUFyQjtBQUNBLFVBQUksS0FBSjtBQUNBLFVBQUksS0FBSixDQUFVLGVBQVY7QUFDQTtBQTlCSjtBQWdDRDs7QUFFRCxTQUFTLFVBQVQsQ0FBb0IsSUFBcEIsRUFBMEIsTUFBMUIsRUFBaUM7QUFDL0IsTUFBSSxLQUFKO0FBQ0EsTUFBSSxTQUFKLENBQWMsQ0FBZCxFQUFnQixDQUFoQjtBQUNBLE1BQUksS0FBSixDQUFVLEtBQUssTUFBTCxDQUFZLENBQVosRUFBZSxFQUFmLENBQVY7QUFDQSxNQUFJLFNBQUosQ0FBYyxDQUFkLEVBQWdCLENBQWhCO0FBQ0EsTUFBSSxLQUFKLENBQVUsS0FBSyxNQUFMLENBQVksRUFBWixFQUFnQixFQUFoQixDQUFWO0FBQ0EsTUFBRyxNQUFILEVBQVcsSUFBSSxNQUFKO0FBQ1o7O0FBRUQ7OztBQUdBLFFBQVEsRUFBUixDQUFXLFFBQVgsRUFBcUIsWUFDckI7QUFDRSxTQUFPLEtBQVA7QUFDRCxVQUFRLEdBQVIsQ0FBWSxZQUFaO0FBQ0EsVUFBUSxJQUFSLENBQWEsQ0FBYjtBQUNBLENBTEQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qanNsaW50IG5vZGU6dHJ1ZSwgdmFyczp0cnVlLCBiaXR3aXNlOnRydWUsIHVucGFyYW06dHJ1ZSAqL1xuLypqc2hpbnQgdW51c2VkOnRydWUgKi9cblxudmFyIHNlbnNvck1vZHVsZSA9IHJlcXVpcmUoJ2pzdXBtX3R0cDIyMycpO1xudmFyIGJ1enplck1vZHVsZSA9IHJlcXVpcmUoXCJqc3VwbV9idXp6ZXJcIik7XG52YXIgbGNkTW9kdWxlID0gcmVxdWlyZShcImpzdXBtX2kyY2xjZFwiKTtcbnZhciBncm92ZVNlbnNvciA9IHJlcXVpcmUoXCJqc3VwbV9ncm92ZVwiKTtcbnZhciBzb2NrZXQgPSByZXF1aXJlKCcuL3NvY2tldCcpO1xuXG5jb25zdCBTRU5TT1JTID0gcmVxdWlyZSgnLi9zZW5zb3JzJyk7XG5jb25zdCBTVEFURSA9IHtcbiAgbGlzdGVuaW5nOiAwLFxuICBwdXNoOiAxLFxuICBwdWxsOiAyLFxuICBjb25uZWN0ZWQ6IDNcbn07XG5cbnZhciBjb25uZWN0aW9uRXhwaXJ5VGltZW91dCA9IDMwMDA7XG52YXIgcHVsbEV4cGlyZWRUaW1lb3V0ID0gNTAwMDtcbnZhciBsZWZ0Q29ubmVjdGlvblRpbWVvdXQgPSAxMDAwO1xuXG4vLyBnbG9iYWwgc3RhdGVcbnZhciBzdGF0ZTtcbnZhciBjb25uZWN0aW9uVGltZW91dDtcbnZhciBwdWxsVGltZW91dDtcblxudmFyIHRvdWNoID0gbmV3IHNlbnNvck1vZHVsZS5UVFAyMjMoU0VOU09SUy50b3VjaCk7XG52YXIgYnV6emVyID0gbmV3IGJ1enplck1vZHVsZS5CdXp6ZXIoU0VOU09SUy5idXp6ZXIpO1xudmFyIGxjZCA9IG5ldyBsY2RNb2R1bGUuSmhkMTMxM20xKFNFTlNPUlMubGNkKTtcbnZhciByZWRMZWQgPSBuZXcgZ3JvdmVTZW5zb3IuR3JvdmVMZWQoU0VOU09SUy5sZWRzLnJlZCk7XG52YXIgZ3JlZW5MZWQgPSBuZXcgZ3JvdmVTZW5zb3IuR3JvdmVMZWQoU0VOU09SUy5sZWRzLmdyZWVuKTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcbiAgc29ja2V0LmluaXQoKCkgPT4ge1xuICAgIC8vIEB0b2RvIHJlbW92ZSAtLSB0aGlzIHdhcyBkZWJ1ZyBvbmx5XG4gICAgLy8gc3RhdGUgPSBTVEFURS5jb25uZWN0ZWQ7XG4gICAgLy8gc29ja2V0LnNlbmQoe2V2ZW50OiAnc2VydmVyOmNvbm5lY3RlZCd9KTtcbiAgfSk7XG5cbiAgc3RhdGUgPSBTVEFURS5saXN0ZW5pbmc7XG4gIHNldEludGVydmFsKHJlYWRTZW5zb3JWYWx1ZSwgMTAwKTtcblxuICBzb2NrZXQub25NZXNzYWdlKChkYXRhKSA9PiB7XG4gICAgIHZhciBtc2cgPSBKU09OLnBhcnNlKGRhdGEpO1xuXG4gICAgIGlmKG1zZy5ldmVudCA9PT0gJ3B1c2gnKXtcbiAgICAgICAgaGFuZGxlUHVzaE1lc3NhZ2UoKVxuICAgICB9IGVsc2UgaWYobXNnLmV2ZW50ID09PSAnZXhwaXJlZCcpe1xuICAgICAgICBoYW5kbGVFeHBpcmVkTWVzc2FnZSgpO1xuICAgICB9IGVsc2UgaWYobXNnLmV2ZW50ID09PSAnbWlzc2VkJyl7XG4gICAgICAgIGhhbmRsZU1pc3NlZE1lc3NhZ2UoKTtcbiAgICAgfSBlbHNlIGlmKG1zZy5ldmVudCA9PT0gJ3NldFRleHQnICYmIHN0YXRlID09PSBTVEFURS5jb25uZWN0ZWQpe1xuICAgICAgICBzZXRMY2RUZXh0KG1zZy50ZXh0KTtcbiAgICAgfVxuICB9KTtcblxuICBidXp6ZXIucGxheVNvdW5kKGJ1enplck1vZHVsZS5ETywgNTAwMCk7XG4gIGJ1enplci5zdG9wU291bmQoKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUHVzaE1lc3NhZ2UoKXtcbiAgc3dpdGNoIChzdGF0ZSkge1xuICAgY2FzZSBTVEFURS5saXN0ZW5pbmc6XG4gICBjYXNlIFNUQVRFLnB1bGw6XG4gICAgIHN0YXRlID0gU1RBVEUucHVsbDtcbiAgICAgcHVsbCgpO1xuICAgICBicmVhaztcbiAgIGNhc2UgU1RBVEUucHVzaDpcbiAgICAgc3RhdGUgPSBTVEFURS5jb25uZWN0ZWQ7XG4gICAgIGNvbm5lY3QoKTtcbiAgICAgYnJlYWs7XG4gICBjYXNlIFNUQVRFLmNvbm5lY3RlZDpcbiAgICAgLy8gTm90aGluZyBoYXBwZW5zOiB3ZSdyZSBjb25uZWN0ZWRcbiAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlRXhwaXJlZE1lc3NhZ2UoKXtcbiAgc3dpdGNoKHN0YXRlKXtcbiAgICBjYXNlIFNUQVRFLmNvbm5lY3RlZDpcbiAgICAgIGNvbm5lY3Rpb25FeHBpcmVkKCk7XG4gICAgICBicmVhaztcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVNaXNzZWRNZXNzYWdlKCl7XG4gIHN3aXRjaChzdGF0ZSl7XG4gICAgY2FzZSBTVEFURS5wdXNoOlxuICAgICAgc3RhdGUgPSBTVEFURS5saXN0ZW5pbmc7XG4gICAgICB1cGRhdGVTdGF0ZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFNlbnNvclZhbHVlKCkge1xuICBpZiAoIHRvdWNoLmlzUHJlc3NlZCgpICkge1xuICAgIGNvbnNvbGUubG9nKHRvdWNoLm5hbWUoKSArIFwiIGlzIHByZXNzZWRcIik7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBTVEFURS5saXN0ZW5pbmc6XG4gICAgICBjYXNlIFNUQVRFLnB1c2g6XG4gICAgICAgIHN0YXRlID0gU1RBVEUucHVzaDtcbiAgICAgICAgcHVzaCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RBVEUucHVsbDpcbiAgICAgICAgc3RhdGUgPSBTVEFURS5jb25uZWN0ZWRcbiAgICAgICAgY29ubmVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RBVEUuY29ubmVjdGVkOlxuICAgICAgICByZXNldEV4cGlyeVRpbWVvdXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChzdGF0ZSA9PT0gU1RBVEUucHVzaCkge1xuICAgICAgc3RhdGUgPSBTVEFURS5saXN0ZW5pbmc7XG4gICAgICB1cGRhdGVTdGF0ZSgpO1xuICAgIH1cbiAgICAvLyB0aGlzIG1ha2VzIHNlbnNlIGJ1dCByZXF1aXJlcyBzb21lIG1vcmUgdGhvdWdoLlxuICAgIC8vIHRoZSBjYXNlIGlzIHdoZW4geW91J3JlIGNvbm5lY3RlZCBhbmQgbGVhdmUgKHN0b3AgaG9sZGluZylcbiAgICAvLyB5b3Ugc2hvdWxkIGV2ZW50dWFsbHkgc2VuZCBhbiBldmVudCBzaWduYWxpbmcgdGhhdCB5b3UgbGVmdCBzbyB0aGVcbiAgICAvLyBjb25uZWN0aW9uIGJyZWFrc1xuICAgIC8vIG1heWJlIHdlIG5lZWQgYW5vdGhlciB0aW1lb3V0IGhlcmUgdGhhdCB3aWxsIHNlbmQgdGhpcyBleHBpcnkgKnVubGVzcypcbiAgICAvLyBpdCBnZXRzXG4gICAgZWxzZSBpZihzdGF0ZSA9PT0gU1RBVEUuY29ubmVjdGVkKXtcbiAgICAgIGxlZnRDb25uZWN0aW9uKCk7XG4gICAgfVxuXG4gIH1cbn1cblxuZnVuY3Rpb24gcHVzaCgpIHtcbiAgY29uc29sZS5sb2coJ3B1c2hpbmcnLCBzdGF0ZSk7XG4gIHNvY2tldC5zZW5kKHtldmVudDogJ3B1c2gnfSk7XG4gIHVwZGF0ZVN0YXRlKCk7XG4gIC8vIFRPRE8gd2FpdCBsaXN0ZW4gZm9yIDUgc2Vjb25kcyBhbmQgdGhlbiBnbyBiYWNrIHRvIGxpc3RlbmluZ1xufVxuXG5mdW5jdGlvbiBwdWxsKCkge1xuICBjb25zb2xlLmxvZygncHVsbGluZycsIHN0YXRlKTtcblxuICB1cGRhdGVTdGF0ZSgpO1xuICBidXp6ZXIucGxheVNvdW5kKGJ1enplck1vZHVsZS5ETywgNTAwMClcbiAgc2V0VGltZW91dCgoKSA9PiBidXp6ZXIuc3RvcFNvdW5kKCksIDUwMCk7XG5cbiAgaWYocHVsbFRpbWVvdXQpe1xuICAgIGNsZWFyVGltZW91dChwdWxsVGltZW91dClcbiAgfVxuXG4gIHB1bGxUaW1lb3V0ID0gc2V0VGltZW91dChwdWxsRXhwaXJlZCwgcHVsbEV4cGlyZWRUaW1lb3V0KTtcbn1cblxuZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgY29uc29sZS5sb2coJ2Nvbm5lY3RlZCEnLCBzdGF0ZSk7XG4gIHNvY2tldC5zZW5kKHtldmVudDogJ3B1c2gnfSk7XG4gIHNvY2tldC5zZW5kKHtldmVudDogJ3NlcnZlcjpjb25uZWN0ZWQnfSk7XG5cbiAgdXBkYXRlU3RhdGUoKTtcblxuICBpZihwdWxsVGltZW91dCl7XG4gICAgY2xlYXJUaW1lb3V0KHB1bGxUaW1lb3V0KVxuICB9XG5cbiAgY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KGNvbm5lY3Rpb25FeHBpcmVkLCBjb25uZWN0aW9uRXhwaXJ5VGltZW91dCk7XG59XG5cbmZ1bmN0aW9uIHB1bGxFeHBpcmVkKCl7XG4gIGNvbnNvbGUubG9nKCdwdWxsIGV4cGlyZWQnKTtcblxuICBzdGF0ZSA9IFNUQVRFLmxpc3RlbmluZztcbiAgdXBkYXRlU3RhdGUoKTtcblxuICBzb2NrZXQuc2VuZCh7ZXZlbnQ6ICdtaXNzZWQnfSk7XG59XG5cbmZ1bmN0aW9uIGNvbm5lY3Rpb25FeHBpcmVkKCl7XG4gIGNvbnNvbGUubG9nKCdDb25uZWN0aW9uIGV4cGlyZWQhJyk7XG4gIHN0YXRlID0gU1RBVEUubGlzdGVuaW5nO1xuICB1cGRhdGVTdGF0ZSgpO1xuXG4gIGNsZWFyVGltZW91dChjb25uZWN0aW9uVGltZW91dCk7XG4gIHNvY2tldC5zZW5kKHtldmVudDogJ2V4cGlyZWQnfSk7XG4gIHNvY2tldC5zZW5kKHtldmVudDogJ3NlcnZlcjpkaXNjb25uZWN0ZWQnfSk7XG5cbn1cblxuZnVuY3Rpb24gcmVzZXRFeHBpcnlUaW1lb3V0KCl7XG4gIGNsZWFyVGltZW91dChjb25uZWN0aW9uVGltZW91dCk7XG4gIGNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dChjb25uZWN0aW9uRXhwaXJlZCwgY29ubmVjdGlvbkV4cGlyeVRpbWVvdXQpO1xuXG4gIGlmKGxlZnRDb25uZWN0aW9uVGltZW91dCl7XG4gICAgbGVmdENvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcbiAgICBjbGVhclRpbWVvdXQobGVmdENvbm5lY3Rpb25UaW1lb3V0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBsZWZ0Q29ubmVjdGlvbigpe1xuICBpZighbGVmdENvbm5lY3Rpb25UaW1lb3V0KXtcbiAgICBsZWZ0Q29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KGNvbm5lY3Rpb25FeHBpcmVkLCBjb25uZWN0aW9uRXhwaXJ5VGltZW91dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlU3RhdGUoKXtcbiAgc3dpdGNoKHN0YXRlKXtcbiAgICBjYXNlIFNUQVRFLmxpc3RlbmluZzpcbiAgICAgIHJlZExlZC5vZmYoKTtcbiAgICAgIGdyZWVuTGVkLm9mZigpO1xuICAgICAgbGNkLnNldENvbG9yKDAsIDAsIDApO1xuICAgICAgbGNkLmNsZWFyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFNUQVRFLnB1bGw6XG4gICAgICByZWRMZWQub24oKTtcbiAgICAgIGdyZWVuTGVkLm9mZigpO1xuICAgICAgbGNkLnNldENvbG9yKDI1NSwgMCwgMCk7XG4gICAgICBsY2QuY2xlYXIoKTtcbiAgICAgIGxjZC53cml0ZShcIlBsZWFzZSwgZG9uJ3RcIik7XG4gICAgICBsY2Quc2V0Q3Vyc29yKDEsMCk7XG4gICAgICBsY2Qud3JpdGUoXCJsZXQgbWUgaGFuZyFcIik7XG4gICAgICBsY2Quc2V0Q3Vyc29yKDAsMCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFNUQVRFLnB1c2g6XG4gICAgICByZWRMZWQub2ZmKCk7XG4gICAgICBncmVlbkxlZC5vZmYoKTtcbiAgICAgIGxjZC5zZXRDb2xvcigwLCAwLCAyNTUpO1xuICAgICAgbGNkLmNsZWFyKCk7XG4gICAgICBsY2Qud3JpdGUoXCJBbnlvbmUgdGhlcmU/XCIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBTVEFURS5jb25uZWN0ZWQ6XG4gICAgICByZWRMZWQub2ZmKCk7XG4gICAgICBncmVlbkxlZC5vbigpO1xuICAgICAgbGNkLnNldENvbG9yKDAsIDI1NSwgMCk7XG4gICAgICBsY2QuY2xlYXIoKTtcbiAgICAgIGxjZC53cml0ZShcIkhlbGxvLCBXb3JsZCFcIik7XG4gICAgICBicmVhaztcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRMY2RUZXh0KHRleHQsIHNjcm9sbCl7XG4gIGxjZC5jbGVhcigpO1xuICBsY2Quc2V0Q3Vyc29yKDAsMCk7XG4gIGxjZC53cml0ZSh0ZXh0LnN1YnN0cigwLCAxNCkpO1xuICBsY2Quc2V0Q3Vyc29yKDEsMCk7XG4gIGxjZC53cml0ZSh0ZXh0LnN1YnN0cigxNSwgMzApKTtcbiAgaWYoc2Nyb2xsKSBsY2Quc2Nyb2xsKCk7XG59XG5cbmluaXRpYWxpemUoKTtcblxuLy8gUHJpbnQgbWVzc2FnZSB3aGVuIGV4aXRpbmdcbnByb2Nlc3Mub24oJ1NJR0lOVCcsIGZ1bmN0aW9uKClcbntcbiAgc29ja2V0LmNsb3NlKCk7XG5cdGNvbnNvbGUubG9nKFwiRXhpdGluZy4uLlwiKTtcblx0cHJvY2Vzcy5leGl0KDApO1xufSk7XG4iXX0=