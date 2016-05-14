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

const SENSORS = require('./sensors');

var socket = require('./socket');
socket.init();

var touch = new sensorModule.TTP223(SENSORS.touch);
var buzzer = new buzzerModule.Buzzer(SENSORS.buzzer);
var redLed = new groveSensor.GroveLed(SENSORS.leds.red);

function doStuff(){
  buzzer.playSound(buzzerModule.DO, 10000)
  redLed.on();
  setTimeout(() => redLed.off(), 500);
}

function readSensorValue() {
  if ( touch.isPressed() ) {
    console.log(touch.name() + " is pressed");
    socket.send({event: 'on'});
  }
}

socket.onMessage((data) => console.log(data));

setInterval(readSensorValue, 100);

// Print message when exiting
process.on('SIGINT', function()
{
	console.log("Exiting...");
	process.exit(0);
});
