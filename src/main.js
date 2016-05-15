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
  push: 1,
  pull: 2,
  connected: 3
};

var connectionExpiryTimeout = 3000;
var pullExpiredTimeout = 5000;

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
     } else if(msg.event === 'setText' && state === STATE.connected){
        setLcdText(msg.text);
     }
  });

  buzzer.playSound(buzzerModule.DO, 5000);
  buzzer.stopSound();
}

function handlePushMessage(){
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

function handleExpiredMessage(){
  switch(state){
    case STATE.connected:
      connectionExpired();
      break;
  }
}

function handleMissedMessage(){
  switch(state){
    case STATE.push:
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
      case STATE.push:
        state = STATE.push;
        push();
        break;
      case STATE.pull:
        state = STATE.connected
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
    } else if(state === STATE.connected){
      socket.send({event: 'expired'});
    }

  }
}

function push() {
  console.log('pushing', state);
  socket.send({event: 'push'});
  updateState();
  // TODO wait listen for 5 seconds and then go back to listening
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
}

function updateState(){
  switch(state){
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
      lcd.setCursor(1,0);
      lcd.write("let me hang!");
      lcd.setCursor(0,0);
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
