/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

var sensorModule = require('jsupm_ttp223');
var buzzerModule = require("jsupm_buzzer");
var lcdModule = require("jsupm_i2clcd");
var groveSensor = require("jsupm_grove");
var socket = require('./socket');

const SENSORS = require('./sensors');
const STATE = {
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
  socket.init(() => {
    // @todo remove -- this was debug only
    // state = STATE.connected;
    // socket.send({event: 'server:connected'});
  });

  state = STATE.listening;
  setInterval(readSensorValue, 100);

  socket.onMessage((data) => {
     var msg = JSON.parse(data);

     if(msg.event === 'push'){
        handlePushMessage()
     } else if(msg.event === 'expired'){
        handleExpiredMessage();
     } else if(msg.event === 'missed'){
        handleMissedMessage();
     } else if(msg.event === 'setText' && isConnected()){
        setLcdText(msg.text);
     }
  });

  buzzer.playSound(buzzerModule.DO, 5000);
  buzzer.stopSound();
}

function isConnected() {
  return state === STATE.connected.push || STATE.connected.pull;
}

function handlePushMessage(){
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
   case STATE.connected.push:
   case STATE.connected.pull:
     // Nothing happens: we're connected
     break;
  }
}

function handleExpiredMessage(){
  if (isConnected()) {
     connectionExpired();
  }
}

function handleMissedMessage(){
  switch(state){
    case STATE.connecting.push:
      state = STATE.listening;
      updateState();
      break;
  }
}

function readSensorValue() {
  if ( touch.isPressed() ) {
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
      case STATE.connected.push:
      case STATE.connected.pull:
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
    else if(isConnected()){
      leftConnection();
    }

  }
}

function push() {
  console.log('pushing', state);
  socket.send({event: 'push'});
  updateState();
}

function pull() {
  console.log('pulling', state);

  updateState();
  buzzer.playSound(buzzerModule.DO, 5000)
  setTimeout(() => buzzer.stopSound(), 500);

  if(pullTimeout){
    clearTimeout(pullTimeout)
  }

  pullTimeout = setTimeout(pullExpired, pullExpiredTimeout);
}

function connect() {
  console.log('connected!', state);
  socket.send({event: 'push'});
  socket.send({event: 'server:connected'});

  updateState();

  if(pullTimeout){
    clearTimeout(pullTimeout)
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

function pullExpired(){
  console.log('pull expired');

  state = STATE.listening;
  updateState();

  socket.send({event: 'missed'});
}

function connectionExpired(){
  console.log('Connection expired!');
  state = STATE.listening;
  updateState();

  clearTimeout(connectionTimeout);
  socket.send({event: 'expired'});
  socket.send({event: 'server:disconnected'});

}

function resetExpiryTimeout(){
  clearTimeout(connectionTimeout);
  connectionTimeout = setTimeout(connectionExpired, connectionExpiryTimeout);

  if(leftConnectionTimeout){
    leftConnectionTimeout = null;
    clearTimeout(leftConnectionTimeout);
  }
}

function leftConnection(){
  if(!leftConnectionTimeout){
    leftConnectionTimeout = setTimeout(connectionExpired, connectionExpiryTimeout);
  }
}

function updateState(){
  switch(state){
    case STATE.listening:
      redLed.off();
      greenLed.off();
      lcd.setColor(0, 0, 0);
      lcd.clear();
      setLcdText(rotary.abs_deg().toString());
      break;
    case STATE.connecting.pull:
      redLed.on();
      greenLed.off();
      lcd.setColor(255, 0, 0);
      lcd.clear();
      lcd.write("Please, don't");
      lcd.setCursor(1,0);
      lcd.write("let me hang!");
      lcd.setCursor(0,0);
      break;
    case STATE.connecting.push:
      redLed.off();
      greenLed.off();
      lcd.setColor(0, 0, 255);
      lcd.clear();
      lcd.write("Anyone there?");
      break;
    case STATE.connected.push:
    case STATE.connected.pull:
      redLed.off();
      greenLed.on();
      lcd.setColor(0, 255, 0);
      lcd.clear();
      lcd.write("Hello, World!");
      communicate();
      break;
  }
}

function setLcdText(text, scroll){
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.write(text.substr(0, 14));
  lcd.setCursor(1,0);
  lcd.write(text.substr(15, 30));
  if(scroll) lcd.scroll();
}

initialize();

// Print message when exiting
process.on('SIGINT', function()
{
  socket.close();
	console.log("Exiting...");
	process.exit(0);
});
