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
  connecting: {
    push: 1,
    pull: 2
  },
  connected: {
    push: 3,
    pull: 4
  }
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
var rotary = new groveSensor.GroveRotary(SENSORS.rotary);

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
    case STATE.connecting.pull:
      state = STATE.connecting.pull;
      pull();
      break;
    case STATE.connecting.push:
      state = STATE.connected.push;
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
    case STATE.connecting.push:
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
      case STATE.connecting.push:
        state = STATE.connecting.push;
        push();
        break;
      case STATE.connecting.pull:
        state = STATE.connected.pull;
        connect();
        break;
      case STATE.connected:
        resetExpiryTimeout();
        break;
    }
  } else {
    if (state === STATE.connecting.push) {
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

function communicate() {
  if (state === STATE.connected.pull) {
    // TODO: can be:
    // * Speak -> pull means get state from them
    // *  Q/A, -> pull means answer (using rotary)
    // * Check weather > pull means display other weather
  } else if (state === STATE.connected.push) {
      // TODO: can be:
      // * Speak -> push means send state to them
      // *  Q/A, -> push means ask (using button to select)
      // * Check weather > push means send weather to them
    }
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
      //lcd.setColor(0, 0, 0);
      //lcd.clear();
      //setLcdText(rotary.rel_deg().toString());
      break;
    case STATE.connecting.pull:
      redLed.on();
      greenLed.off();
      lcd.setColor(255, 0, 0);
      lcd.clear();
      lcd.write("Please, don't");
      lcd.setCursor(1, 0);
      lcd.write("let me hang!");
      lcd.setCursor(0, 0);
      break;
    case STATE.connecting.push:
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
      communicate();
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
//# sourceMappingURL=data:application/json;base64,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R0EsUUFBUSxFQUFSLENBQVcsUUFBWCxFQUFxQixZQUNyQjtBQUNFLFNBQU8sS0FBUDtBQUNELFVBQVEsR0FBUixDQUFZLFlBQVo7QUFDQSxVQUFRLElBQVIsQ0FBYSxDQUFiO0FBQ0EsQ0FMRCIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypqc2xpbnQgbm9kZTp0cnVlLCB2YXJzOnRydWUsIGJpdHdpc2U6dHJ1ZSwgdW5wYXJhbTp0cnVlICovXG4vKmpzaGludCB1bnVzZWQ6dHJ1ZSAqL1xuXG52YXIgc2Vuc29yTW9kdWxlID0gcmVxdWlyZSgnanN1cG1fdHRwMjIzJyk7XG52YXIgYnV6emVyTW9kdWxlID0gcmVxdWlyZShcImpzdXBtX2J1enplclwiKTtcbnZhciBsY2RNb2R1bGUgPSByZXF1aXJlKFwianN1cG1faTJjbGNkXCIpO1xudmFyIGdyb3ZlU2Vuc29yID0gcmVxdWlyZShcImpzdXBtX2dyb3ZlXCIpO1xudmFyIHNvY2tldCA9IHJlcXVpcmUoJy4vc29ja2V0Jyk7XG5cbmNvbnN0IFNFTlNPUlMgPSByZXF1aXJlKCcuL3NlbnNvcnMnKTtcbmNvbnN0IFNUQVRFID0ge1xuICBsaXN0ZW5pbmc6IDAsXG4gIGNvbm5lY3Rpbmc6IHtcbiAgICBwdXNoOiAxLFxuICAgIHB1bGw6IDJcbiAgfSxcbiAgY29ubmVjdGVkOiB7XG4gICAgcHVzaDogMyxcbiAgICBwdWxsOiA0XG4gIH1cbn07XG5cbnZhciBjb25uZWN0aW9uRXhwaXJ5VGltZW91dCA9IDMwMDA7XG52YXIgcHVsbEV4cGlyZWRUaW1lb3V0ID0gNTAwMDtcbnZhciBsZWZ0Q29ubmVjdGlvblRpbWVvdXQgPSAxMDAwO1xuXG4vLyBnbG9iYWwgc3RhdGVcbnZhciBzdGF0ZTtcbnZhciBjb25uZWN0aW9uVGltZW91dDtcbnZhciBwdWxsVGltZW91dDtcblxudmFyIHRvdWNoID0gbmV3IHNlbnNvck1vZHVsZS5UVFAyMjMoU0VOU09SUy50b3VjaCk7XG52YXIgYnV6emVyID0gbmV3IGJ1enplck1vZHVsZS5CdXp6ZXIoU0VOU09SUy5idXp6ZXIpO1xudmFyIGxjZCA9IG5ldyBsY2RNb2R1bGUuSmhkMTMxM20xKFNFTlNPUlMubGNkKTtcbnZhciByZWRMZWQgPSBuZXcgZ3JvdmVTZW5zb3IuR3JvdmVMZWQoU0VOU09SUy5sZWRzLnJlZCk7XG52YXIgZ3JlZW5MZWQgPSBuZXcgZ3JvdmVTZW5zb3IuR3JvdmVMZWQoU0VOU09SUy5sZWRzLmdyZWVuKTtcbnZhciByb3RhcnkgPSBuZXcgZ3JvdmVTZW5zb3IuR3JvdmVSb3RhcnkoU0VOU09SUy5yb3RhcnkpO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xuICBzb2NrZXQuaW5pdCgoKSA9PiB7XG4gICAgLy8gQHRvZG8gcmVtb3ZlIC0tIHRoaXMgd2FzIGRlYnVnIG9ubHlcbiAgICAvLyBzdGF0ZSA9IFNUQVRFLmNvbm5lY3RlZDtcbiAgICAvLyBzb2NrZXQuc2VuZCh7ZXZlbnQ6ICdzZXJ2ZXI6Y29ubmVjdGVkJ30pO1xuICB9KTtcblxuICBzdGF0ZSA9IFNUQVRFLmxpc3RlbmluZztcbiAgc2V0SW50ZXJ2YWwocmVhZFNlbnNvclZhbHVlLCAxMDApO1xuXG4gIHNvY2tldC5vbk1lc3NhZ2UoKGRhdGEpID0+IHtcbiAgICAgdmFyIG1zZyA9IEpTT04ucGFyc2UoZGF0YSk7XG5cbiAgICAgaWYobXNnLmV2ZW50ID09PSAncHVzaCcpe1xuICAgICAgICBoYW5kbGVQdXNoTWVzc2FnZSgpXG4gICAgIH0gZWxzZSBpZihtc2cuZXZlbnQgPT09ICdleHBpcmVkJyl7XG4gICAgICAgIGhhbmRsZUV4cGlyZWRNZXNzYWdlKCk7XG4gICAgIH0gZWxzZSBpZihtc2cuZXZlbnQgPT09ICdtaXNzZWQnKXtcbiAgICAgICAgaGFuZGxlTWlzc2VkTWVzc2FnZSgpO1xuICAgICB9IGVsc2UgaWYobXNnLmV2ZW50ID09PSAnc2V0VGV4dCcgJiYgc3RhdGUgPT09IFNUQVRFLmNvbm5lY3RlZCl7XG4gICAgICAgIHNldExjZFRleHQobXNnLnRleHQpO1xuICAgICB9XG4gIH0pO1xuXG4gIGJ1enplci5wbGF5U291bmQoYnV6emVyTW9kdWxlLkRPLCA1MDAwKTtcbiAgYnV6emVyLnN0b3BTb3VuZCgpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVQdXNoTWVzc2FnZSgpe1xuICBzd2l0Y2ggKHN0YXRlKSB7XG4gICBjYXNlIFNUQVRFLmxpc3RlbmluZzpcbiAgIGNhc2UgU1RBVEUuY29ubmVjdGluZy5wdWxsOlxuICAgICBzdGF0ZSA9IFNUQVRFLmNvbm5lY3RpbmcucHVsbDtcbiAgICAgcHVsbCgpO1xuICAgICBicmVhaztcbiAgIGNhc2UgU1RBVEUuY29ubmVjdGluZy5wdXNoOlxuICAgICBzdGF0ZSA9IFNUQVRFLmNvbm5lY3RlZC5wdXNoO1xuICAgICBjb25uZWN0KCk7XG4gICAgIGJyZWFrO1xuICAgY2FzZSBTVEFURS5jb25uZWN0ZWQ6XG4gICAgIC8vIE5vdGhpbmcgaGFwcGVuczogd2UncmUgY29ubmVjdGVkXG4gICAgIGJyZWFrO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUV4cGlyZWRNZXNzYWdlKCl7XG4gIHN3aXRjaChzdGF0ZSl7XG4gICAgY2FzZSBTVEFURS5jb25uZWN0ZWQ6XG4gICAgICBjb25uZWN0aW9uRXhwaXJlZCgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlTWlzc2VkTWVzc2FnZSgpe1xuICBzd2l0Y2goc3RhdGUpe1xuICAgIGNhc2UgU1RBVEUuY29ubmVjdGluZy5wdXNoOlxuICAgICAgc3RhdGUgPSBTVEFURS5saXN0ZW5pbmc7XG4gICAgICB1cGRhdGVTdGF0ZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFNlbnNvclZhbHVlKCkge1xuICBpZiAoIHRvdWNoLmlzUHJlc3NlZCgpICkge1xuICAgIGNvbnNvbGUubG9nKHRvdWNoLm5hbWUoKSArIFwiIGlzIHByZXNzZWRcIik7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBTVEFURS5saXN0ZW5pbmc6XG4gICAgICBjYXNlIFNUQVRFLmNvbm5lY3RpbmcucHVzaDpcbiAgICAgICAgc3RhdGUgPSBTVEFURS5jb25uZWN0aW5nLnB1c2g7XG4gICAgICAgIHB1c2goKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFNUQVRFLmNvbm5lY3RpbmcucHVsbDpcbiAgICAgICAgc3RhdGUgPSBTVEFURS5jb25uZWN0ZWQucHVsbDtcbiAgICAgICAgY29ubmVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RBVEUuY29ubmVjdGVkOlxuICAgICAgICByZXNldEV4cGlyeVRpbWVvdXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChzdGF0ZSA9PT0gU1RBVEUuY29ubmVjdGluZy5wdXNoKSB7XG4gICAgICBzdGF0ZSA9IFNUQVRFLmxpc3RlbmluZztcbiAgICAgIHVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuICAgIC8vIHRoaXMgbWFrZXMgc2Vuc2UgYnV0IHJlcXVpcmVzIHNvbWUgbW9yZSB0aG91Z2guXG4gICAgLy8gdGhlIGNhc2UgaXMgd2hlbiB5b3UncmUgY29ubmVjdGVkIGFuZCBsZWF2ZSAoc3RvcCBob2xkaW5nKVxuICAgIC8vIHlvdSBzaG91bGQgZXZlbnR1YWxseSBzZW5kIGFuIGV2ZW50IHNpZ25hbGluZyB0aGF0IHlvdSBsZWZ0IHNvIHRoZVxuICAgIC8vIGNvbm5lY3Rpb24gYnJlYWtzXG4gICAgLy8gbWF5YmUgd2UgbmVlZCBhbm90aGVyIHRpbWVvdXQgaGVyZSB0aGF0IHdpbGwgc2VuZCB0aGlzIGV4cGlyeSAqdW5sZXNzKlxuICAgIC8vIGl0IGdldHNcbiAgICBlbHNlIGlmKHN0YXRlID09PSBTVEFURS5jb25uZWN0ZWQpe1xuICAgICAgbGVmdENvbm5lY3Rpb24oKTtcbiAgICB9XG5cbiAgfVxufVxuXG5mdW5jdGlvbiBwdXNoKCkge1xuICBjb25zb2xlLmxvZygncHVzaGluZycsIHN0YXRlKTtcbiAgc29ja2V0LnNlbmQoe2V2ZW50OiAncHVzaCd9KTtcbiAgdXBkYXRlU3RhdGUoKTtcbn1cblxuZnVuY3Rpb24gcHVsbCgpIHtcbiAgY29uc29sZS5sb2coJ3B1bGxpbmcnLCBzdGF0ZSk7XG5cbiAgdXBkYXRlU3RhdGUoKTtcbiAgYnV6emVyLnBsYXlTb3VuZChidXp6ZXJNb2R1bGUuRE8sIDUwMDApXG4gIHNldFRpbWVvdXQoKCkgPT4gYnV6emVyLnN0b3BTb3VuZCgpLCA1MDApO1xuXG4gIGlmKHB1bGxUaW1lb3V0KXtcbiAgICBjbGVhclRpbWVvdXQocHVsbFRpbWVvdXQpXG4gIH1cblxuICBwdWxsVGltZW91dCA9IHNldFRpbWVvdXQocHVsbEV4cGlyZWQsIHB1bGxFeHBpcmVkVGltZW91dCk7XG59XG5cbmZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gIGNvbnNvbGUubG9nKCdjb25uZWN0ZWQhJywgc3RhdGUpO1xuICBzb2NrZXQuc2VuZCh7ZXZlbnQ6ICdwdXNoJ30pO1xuICBzb2NrZXQuc2VuZCh7ZXZlbnQ6ICdzZXJ2ZXI6Y29ubmVjdGVkJ30pO1xuXG4gIHVwZGF0ZVN0YXRlKCk7XG5cbiAgaWYocHVsbFRpbWVvdXQpe1xuICAgIGNsZWFyVGltZW91dChwdWxsVGltZW91dClcbiAgfVxuXG4gIGNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dChjb25uZWN0aW9uRXhwaXJlZCwgY29ubmVjdGlvbkV4cGlyeVRpbWVvdXQpO1xufVxuXG5mdW5jdGlvbiBjb21tdW5pY2F0ZSgpIHtcbiAgaWYgKHN0YXRlID09PSBTVEFURS5jb25uZWN0ZWQucHVsbCkge1xuICAgIC8vIFRPRE86IGNhbiBiZTpcbiAgICAvLyAqIFNwZWFrIC0+IHB1bGwgbWVhbnMgZ2V0IHN0YXRlIGZyb20gdGhlbVxuICAgIC8vICogIFEvQSwgLT4gcHVsbCBtZWFucyBhbnN3ZXIgKHVzaW5nIHJvdGFyeSlcbiAgICAvLyAqIENoZWNrIHdlYXRoZXIgPiBwdWxsIG1lYW5zIGRpc3BsYXkgb3RoZXIgd2VhdGhlclxuICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURS5jb25uZWN0ZWQucHVzaCkge1xuICAgIC8vIFRPRE86IGNhbiBiZTpcbiAgICAvLyAqIFNwZWFrIC0+IHB1c2ggbWVhbnMgc2VuZCBzdGF0ZSB0byB0aGVtXG4gICAgLy8gKiAgUS9BLCAtPiBwdXNoIG1lYW5zIGFzayAodXNpbmcgYnV0dG9uIHRvIHNlbGVjdClcbiAgICAvLyAqIENoZWNrIHdlYXRoZXIgPiBwdXNoIG1lYW5zIHNlbmQgd2VhdGhlciB0byB0aGVtXG4gIH1cbn1cblxuZnVuY3Rpb24gcHVsbEV4cGlyZWQoKXtcbiAgY29uc29sZS5sb2coJ3B1bGwgZXhwaXJlZCcpO1xuXG4gIHN0YXRlID0gU1RBVEUubGlzdGVuaW5nO1xuICB1cGRhdGVTdGF0ZSgpO1xuXG4gIHNvY2tldC5zZW5kKHtldmVudDogJ21pc3NlZCd9KTtcbn1cblxuZnVuY3Rpb24gY29ubmVjdGlvbkV4cGlyZWQoKXtcbiAgY29uc29sZS5sb2coJ0Nvbm5lY3Rpb24gZXhwaXJlZCEnKTtcbiAgc3RhdGUgPSBTVEFURS5saXN0ZW5pbmc7XG4gIHVwZGF0ZVN0YXRlKCk7XG5cbiAgY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0KTtcbiAgc29ja2V0LnNlbmQoe2V2ZW50OiAnZXhwaXJlZCd9KTtcbiAgc29ja2V0LnNlbmQoe2V2ZW50OiAnc2VydmVyOmRpc2Nvbm5lY3RlZCd9KTtcblxufVxuXG5mdW5jdGlvbiByZXNldEV4cGlyeVRpbWVvdXQoKXtcbiAgY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0KTtcbiAgY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KGNvbm5lY3Rpb25FeHBpcmVkLCBjb25uZWN0aW9uRXhwaXJ5VGltZW91dCk7XG5cbiAgaWYobGVmdENvbm5lY3Rpb25UaW1lb3V0KXtcbiAgICBsZWZ0Q29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dChsZWZ0Q29ubmVjdGlvblRpbWVvdXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxlZnRDb25uZWN0aW9uKCl7XG4gIGlmKCFsZWZ0Q29ubmVjdGlvblRpbWVvdXQpe1xuICAgIGxlZnRDb25uZWN0aW9uVGltZW91dCA9IHNldFRpbWVvdXQoY29ubmVjdGlvbkV4cGlyZWQsIGNvbm5lY3Rpb25FeHBpcnlUaW1lb3V0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZSgpe1xuICBzd2l0Y2goc3RhdGUpe1xuICAgIGNhc2UgU1RBVEUubGlzdGVuaW5nOlxuICAgICAgcmVkTGVkLm9mZigpO1xuICAgICAgZ3JlZW5MZWQub2ZmKCk7XG4gICAgICAvL2xjZC5zZXRDb2xvcigwLCAwLCAwKTtcbiAgICAgIC8vbGNkLmNsZWFyKCk7XG4gICAgICAvL3NldExjZFRleHQocm90YXJ5LnJlbF9kZWcoKS50b1N0cmluZygpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgU1RBVEUuY29ubmVjdGluZy5wdWxsOlxuICAgICAgcmVkTGVkLm9uKCk7XG4gICAgICBncmVlbkxlZC5vZmYoKTtcbiAgICAgIGxjZC5zZXRDb2xvcigyNTUsIDAsIDApO1xuICAgICAgbGNkLmNsZWFyKCk7XG4gICAgICBsY2Qud3JpdGUoXCJQbGVhc2UsIGRvbid0XCIpO1xuICAgICAgbGNkLnNldEN1cnNvcigxLDApO1xuICAgICAgbGNkLndyaXRlKFwibGV0IG1lIGhhbmchXCIpO1xuICAgICAgbGNkLnNldEN1cnNvcigwLDApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBTVEFURS5jb25uZWN0aW5nLnB1c2g6XG4gICAgICByZWRMZWQub2ZmKCk7XG4gICAgICBncmVlbkxlZC5vZmYoKTtcbiAgICAgIGxjZC5zZXRDb2xvcigwLCAwLCAyNTUpO1xuICAgICAgbGNkLmNsZWFyKCk7XG4gICAgICBsY2Qud3JpdGUoXCJBbnlvbmUgdGhlcmU/XCIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBTVEFURS5jb25uZWN0ZWQ6XG4gICAgICByZWRMZWQub2ZmKCk7XG4gICAgICBncmVlbkxlZC5vbigpO1xuICAgICAgbGNkLnNldENvbG9yKDAsIDI1NSwgMCk7XG4gICAgICBsY2QuY2xlYXIoKTtcbiAgICAgIGxjZC53cml0ZShcIkhlbGxvLCBXb3JsZCFcIik7XG4gICAgICBjb21tdW5pY2F0ZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TGNkVGV4dCh0ZXh0LCBzY3JvbGwpe1xuICBsY2QuY2xlYXIoKTtcbiAgbGNkLnNldEN1cnNvcigwLDApO1xuICBsY2Qud3JpdGUodGV4dC5zdWJzdHIoMCwgMTQpKTtcbiAgbGNkLnNldEN1cnNvcigxLDApO1xuICBsY2Qud3JpdGUodGV4dC5zdWJzdHIoMTUsIDMwKSk7XG4gIGlmKHNjcm9sbCkgbGNkLnNjcm9sbCgpO1xufVxuXG5pbml0aWFsaXplKCk7XG5cbi8vIFByaW50IG1lc3NhZ2Ugd2hlbiBleGl0aW5nXG5wcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbigpXG57XG4gIHNvY2tldC5jbG9zZSgpO1xuXHRjb25zb2xlLmxvZyhcIkV4aXRpbmcuLi5cIik7XG5cdHByb2Nlc3MuZXhpdCgwKTtcbn0pO1xuIl19