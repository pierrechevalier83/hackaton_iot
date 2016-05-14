"use strict";

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

var SENSORS = require('./sensors');
var STATE = {
  listening: 0,
  push: 1,
  pull: 2,
  connected: 3
};
// global state
var state;

var touch = new sensorModule.TTP223(SENSORS.touch);
var buzzer = new buzzerModule.Buzzer(SENSORS.buzzer);
var redLed = new groveSensor.GroveLed(SENSORS.leds.red);
var greenLed = new groveSensor.GroveLed(SENSORS.leds.green);

function initialize() {
  socket.init();
  state = STATE.listening;
  setInterval(readSensorValue, 100);
  socket.onMessage(function (data) {
    console.log(data);
    switch (state) {
      case STATE.listening:
      case STATE.pull:
        state = STATE.pull;
        pull();
        break;
      case STATE.push:
        state = STATE.connected;
        connnect();
        break;
      case STATE.connected:
        // Nothing happens: we're connected
        break;
    }
  });
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
        // Nothing happens: we're connected
        break;
    }
  }
}

function push() {
  socket.send({ event: 'push' });
  console.log('pushing', state);
  // TODO wait listen for 5 seconds and then go back to listening
}

function pull() {
  redLed.on();
  buzzer.playSound(buzzerModule.DO, 5000);
  console.log('pulling', state);
}

function connect() {
  greenLed.on();
  redLed.off();
  console.log('connected!', state);
}

initialize();

// Print message when exiting
process.on('SIGINT', function () {
  console.log("Exiting...");
  process.exit(0);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJBLElBQUksZUFBZSxRQUFRLGNBQVIsQ0FBbkI7QUFDQSxJQUFJLGVBQWUsUUFBUSxjQUFSLENBQW5CO0FBQ0EsSUFBSSxjQUFjLFFBQVEsYUFBUixDQUFsQjtBQUNBLElBQUksU0FBUyxRQUFRLFVBQVIsQ0FBYjs7QUFFQSxJQUFNLFVBQVUsUUFBUSxXQUFSLENBQWhCO0FBQ0EsSUFBTSxRQUFRO0FBQ1osYUFBVyxDQURDO0FBRVosUUFBTSxDQUZNO0FBR1osUUFBTSxDQUhNO0FBSVosYUFBVztBQUpDLENBQWQ7O0FBT0EsSUFBSSxLQUFKOztBQUVBLElBQUksUUFBUSxJQUFJLGFBQWEsTUFBakIsQ0FBd0IsUUFBUSxLQUFoQyxDQUFaO0FBQ0EsSUFBSSxTQUFTLElBQUksYUFBYSxNQUFqQixDQUF3QixRQUFRLE1BQWhDLENBQWI7QUFDQSxJQUFJLFNBQVMsSUFBSSxZQUFZLFFBQWhCLENBQXlCLFFBQVEsSUFBUixDQUFhLEdBQXRDLENBQWI7QUFDQSxJQUFJLFdBQVcsSUFBSSxZQUFZLFFBQWhCLENBQXlCLFFBQVEsSUFBUixDQUFhLEtBQXRDLENBQWY7O0FBRUEsU0FBUyxVQUFULEdBQXNCO0FBQ3BCLFNBQU8sSUFBUDtBQUNBLFVBQVEsTUFBTSxTQUFkO0FBQ0EsY0FBWSxlQUFaLEVBQTZCLEdBQTdCO0FBQ0EsU0FBTyxTQUFQLENBQWlCLFVBQUMsSUFBRCxFQUFVO0FBQ3hCLFlBQVEsR0FBUixDQUFZLElBQVo7QUFDQSxZQUFRLEtBQVI7QUFDRSxXQUFLLE1BQU0sU0FBWDtBQUNBLFdBQUssTUFBTSxJQUFYO0FBQ0UsZ0JBQVEsTUFBTSxJQUFkO0FBQ0E7QUFDQTtBQUNGLFdBQUssTUFBTSxJQUFYO0FBQ0UsZ0JBQVEsTUFBTSxTQUFkO0FBQ0E7QUFDQTtBQUNGLFdBQUssTUFBTSxTQUFYOztBQUVFO0FBWko7QUFjRixHQWhCRDtBQWlCRDs7QUFFRCxTQUFTLGVBQVQsR0FBMkI7QUFDekIsTUFBSyxNQUFNLFNBQU4sRUFBTCxFQUF5QjtBQUN2QixZQUFRLEdBQVIsQ0FBWSxNQUFNLElBQU4sS0FBZSxhQUEzQjtBQUNBLFlBQVEsS0FBUjtBQUNFLFdBQUssTUFBTSxTQUFYO0FBQ0EsV0FBSyxNQUFNLElBQVg7QUFDRSxnQkFBUSxNQUFNLElBQWQ7QUFDQTtBQUNBO0FBQ0YsV0FBSyxNQUFNLElBQVg7QUFDRSxnQkFBUSxNQUFNLFNBQWQ7QUFDQTtBQUNBO0FBQ0YsV0FBSyxNQUFNLFNBQVg7O0FBRUU7QUFaSjtBQWNEO0FBQ0Y7O0FBRUQsU0FBUyxJQUFULEdBQWdCO0FBQ2QsU0FBTyxJQUFQLENBQVksRUFBQyxPQUFPLE1BQVIsRUFBWjtBQUNBLFVBQVEsR0FBUixDQUFZLFNBQVosRUFBdUIsS0FBdkI7O0FBRUQ7O0FBRUQsU0FBUyxJQUFULEdBQWdCO0FBQ2QsU0FBTyxFQUFQO0FBQ0EsU0FBTyxTQUFQLENBQWlCLGFBQWEsRUFBOUIsRUFBa0MsSUFBbEM7QUFDQSxVQUFRLEdBQVIsQ0FBWSxTQUFaLEVBQXVCLEtBQXZCO0FBQ0Q7O0FBRUQsU0FBUyxPQUFULEdBQW1CO0FBQ2pCLFdBQVMsRUFBVDtBQUNBLFNBQU8sR0FBUDtBQUNBLFVBQVEsR0FBUixDQUFZLFlBQVosRUFBMEIsS0FBMUI7QUFDRDs7QUFFRDs7O0FBR0EsUUFBUSxFQUFSLENBQVcsUUFBWCxFQUFxQixZQUNyQjtBQUNDLFVBQVEsR0FBUixDQUFZLFlBQVo7QUFDQSxVQUFRLElBQVIsQ0FBYSxDQUFiO0FBQ0EsQ0FKRCIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypqc2xpbnQgbm9kZTp0cnVlLCB2YXJzOnRydWUsIGJpdHdpc2U6dHJ1ZSwgdW5wYXJhbTp0cnVlICovXG4vKmpzaGludCB1bnVzZWQ6dHJ1ZSAqL1xuLypnbG9iYWwgKi9cbi8qXG4gKiBBdXRob3I6IFppb24gT3JlbnQgPHpvcmVudEBpY3MuY29tPlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEludGVsIENvcnBvcmF0aW9uLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gKiBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFXG4gKiBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OXG4gKiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbiAqIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbnZhciBzZW5zb3JNb2R1bGUgPSByZXF1aXJlKCdqc3VwbV90dHAyMjMnKTtcbnZhciBidXp6ZXJNb2R1bGUgPSByZXF1aXJlKFwianN1cG1fYnV6emVyXCIpO1xudmFyIGdyb3ZlU2Vuc29yID0gcmVxdWlyZShcImpzdXBtX2dyb3ZlXCIpO1xudmFyIHNvY2tldCA9IHJlcXVpcmUoJy4vc29ja2V0Jyk7XG5cbmNvbnN0IFNFTlNPUlMgPSByZXF1aXJlKCcuL3NlbnNvcnMnKTtcbmNvbnN0IFNUQVRFID0ge1xuICBsaXN0ZW5pbmc6IDAsXG4gIHB1c2g6IDEsXG4gIHB1bGw6IDIsXG4gIGNvbm5lY3RlZDogM1xufTtcbi8vIGdsb2JhbCBzdGF0ZVxudmFyIHN0YXRlO1xuXG52YXIgdG91Y2ggPSBuZXcgc2Vuc29yTW9kdWxlLlRUUDIyMyhTRU5TT1JTLnRvdWNoKTtcbnZhciBidXp6ZXIgPSBuZXcgYnV6emVyTW9kdWxlLkJ1enplcihTRU5TT1JTLmJ1enplcik7XG52YXIgcmVkTGVkID0gbmV3IGdyb3ZlU2Vuc29yLkdyb3ZlTGVkKFNFTlNPUlMubGVkcy5yZWQpO1xudmFyIGdyZWVuTGVkID0gbmV3IGdyb3ZlU2Vuc29yLkdyb3ZlTGVkKFNFTlNPUlMubGVkcy5ncmVlbik7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemUoKSB7XG4gIHNvY2tldC5pbml0KCk7XG4gIHN0YXRlID0gU1RBVEUubGlzdGVuaW5nO1xuICBzZXRJbnRlcnZhbChyZWFkU2Vuc29yVmFsdWUsIDEwMCk7XG4gIHNvY2tldC5vbk1lc3NhZ2UoKGRhdGEpID0+IHtcbiAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICBjYXNlIFNUQVRFLmxpc3RlbmluZzpcbiAgICAgICBjYXNlIFNUQVRFLnB1bGw6XG4gICAgICAgICBzdGF0ZSA9IFNUQVRFLnB1bGw7XG4gICAgICAgICBwdWxsKCk7XG4gICAgICAgICBicmVhaztcbiAgICAgICBjYXNlIFNUQVRFLnB1c2g6XG4gICAgICAgICBzdGF0ZSA9IFNUQVRFLmNvbm5lY3RlZDtcbiAgICAgICAgIGNvbm5uZWN0KCk7XG4gICAgICAgICBicmVhaztcbiAgICAgICBjYXNlIFNUQVRFLmNvbm5lY3RlZDpcbiAgICAgICAgIC8vIE5vdGhpbmcgaGFwcGVuczogd2UncmUgY29ubmVjdGVkXG4gICAgICAgICBicmVhaztcbiAgICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVhZFNlbnNvclZhbHVlKCkge1xuICBpZiAoIHRvdWNoLmlzUHJlc3NlZCgpICkge1xuICAgIGNvbnNvbGUubG9nKHRvdWNoLm5hbWUoKSArIFwiIGlzIHByZXNzZWRcIik7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBTVEFURS5saXN0ZW5pbmc6XG4gICAgICBjYXNlIFNUQVRFLnB1c2g6XG4gICAgICAgIHN0YXRlID0gU1RBVEUucHVzaDtcbiAgICAgICAgcHVzaCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RBVEUucHVsbDpcbiAgICAgICAgc3RhdGUgPSBTVEFURS5jb25uZWN0ZWRcbiAgICAgICAgY29ubmVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RBVEUuY29ubmVjdGVkOlxuICAgICAgICAvLyBOb3RoaW5nIGhhcHBlbnM6IHdlJ3JlIGNvbm5lY3RlZFxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVzaCgpIHtcbiAgc29ja2V0LnNlbmQoe2V2ZW50OiAncHVzaCd9KTtcbiAgY29uc29sZS5sb2coJ3B1c2hpbmcnLCBzdGF0ZSk7XG4gIC8vIFRPRE8gd2FpdCBsaXN0ZW4gZm9yIDUgc2Vjb25kcyBhbmQgdGhlbiBnbyBiYWNrIHRvIGxpc3RlbmluZ1xufVxuXG5mdW5jdGlvbiBwdWxsKCkge1xuICByZWRMZWQub24oKTtcbiAgYnV6emVyLnBsYXlTb3VuZChidXp6ZXJNb2R1bGUuRE8sIDUwMDApXG4gIGNvbnNvbGUubG9nKCdwdWxsaW5nJywgc3RhdGUpO1xufVxuXG5mdW5jdGlvbiBjb25uZWN0KCkge1xuICBncmVlbkxlZC5vbigpO1xuICByZWRMZWQub2ZmKCk7XG4gIGNvbnNvbGUubG9nKCdjb25uZWN0ZWQhJywgc3RhdGUpO1xufVxuXG5pbml0aWFsaXplKCk7XG5cbi8vIFByaW50IG1lc3NhZ2Ugd2hlbiBleGl0aW5nXG5wcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbigpXG57XG5cdGNvbnNvbGUubG9nKFwiRXhpdGluZy4uLlwiKTtcblx0cHJvY2Vzcy5leGl0KDApO1xufSk7XG4iXX0=