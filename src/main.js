/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
/*global */
/*
 * Author: Zion Orent <zorent@ics.com>
 * Copyright (c) 2014 Intel Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var sensorModule = require('jsupm_ttp223');
var buzzerModule = require("jsupm_buzzer");
var groveSensor = require("jsupm_grove");
var socket = require('./socket');

const SENSORS = require('./sensors');
const STATE = {
  listening: 0,
  push: 1,
  pull: 2,
  connected: 3
};
// global state
var state;
var connectionTimeout;
var pullTimeout;

var touch = new sensorModule.TTP223(SENSORS.touch);
var buzzer = new buzzerModule.Buzzer(SENSORS.buzzer);
var redLed = new groveSensor.GroveLed(SENSORS.leds.red);
var greenLed = new groveSensor.GroveLed(SENSORS.leds.green);

function initialize() {
  socket.init();
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
     }
  });
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

  pullTimeout = setTimeout(pullExpired, 5000);
}

function connect() {
  console.log('connected!', state);
  socket.send({event: 'push'});

  updateState();

  if(pullTimeout){
    clearTimeout(pullTimeout)
  }

  connectionTimeout = setTimeout(connectionExpired, 500);
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
}

function resetExpiryTimeout(){
  clearTimeout(connectionTimeout);
  connectionTimeout = setTimeout(connectionExpired, 500);
}

function updateState(){
  switch(state){
    case STATE.listening:
      redLed.off();
      greenLed.off();
      break;
    case STATE.pull:
      redLed.on();
      greenLed.off();
    case STATE.push:
      redLed.off();
      greenLed.off();
    case STATE.connected:
      redLed.off();
      greenLed.on();
  }
}

initialize();

// Print message when exiting
process.on('SIGINT', function()
{
	console.log("Exiting...");
	process.exit(0);
});
