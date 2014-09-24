'use strict';

var path = require('path');
var type = require('utils-type');

var wd = process.cwd();
var callsites = require('v8-callsites');

module.exports = createTracker;

function createTracker(frames, Ctor){

  var sites = callsites(frames, Ctor || createTracker);

  function tracker(pin){

    pin = type(pin).integer > -1 ? pin : sites.length-1;

    var frame = sites[pin];
    if( !frame ){
      return { };
    }

    tracker.path = frame.getFileName().replace(/^native[ ]+/, '');
    tracker.frame = tracker.stack[pin];
    tracker.location = tracker.frame.match(/\((.*)\)/);

    if( tracker.location === null ){ // Case 1
      tracker.location = tracker.frame;
    } else {
      tracker.location = tracker.location[1];
    }

    /* ^ Refering to above ^

      Possible location formats:
      --------------------------
      https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi

      (1) Type.functionName [as methodName] (location)
      (1) new functionName (location)
      (1) Type.name (location)
      (2) eval at Foo.a (eval at Bar.z (myscript.js:10:3))
      (2) eval at position
      (2) native
      (2) unknown location
    */

    tracker.extension = path.extname(tracker.path) || null;
    tracker.basename = path.basename(tracker.path, tracker.extension);

    var flatPath = tracker.path.replace(tracker.extension, '');
    if( tracker.basename ===  flatPath ){
       // ^ path === 'file.js' or path === 'moduleName'
       //   can only be so for node core or V8 modules

      tracker.isNative = frame.isNative();
      tracker.module = tracker.basename;

      tracker.isCore = tracker.isNative ? false : true;
      tracker.parent = tracker.isNative ? 'V8' : 'node';

      return tracker;
    }

    var dir = tracker.path.split(path.sep);
    var index = dir.indexOf('node_modules');

    tracker.isCore = false;
    tracker.isNative = false;

    if( index < 0 ){
      // is your code

      tracker.module = path.relative(
        wd, path.dirname(tracker.path)
      );

      tracker.parent = path.relative(
        path.resolve(wd, '..'), wd
      );

      return tracker;
    }

    // its in `node_modules`
    tracker.module = dir;
    tracker.parent = dir[index+1];

    while( index > -1 ){
      tracker.module = tracker.module.slice(index+1);
      index = tracker.module.indexOf('node_modules');
    }

    tracker.module = dir.slice(
      dir.indexOf('node_modules') + 1, index
    ).join(path.sep);

    return tracker;
  }

  /*
   * define used properties up front
   * so they are nicely printed
   */

  tracker.module = '';
  tracker.parent = '';
  tracker.path = '';
  tracker.basename = '';
  tracker.extension = '';
  tracker.frame = '';
  tracker.location = '';
  tracker.isCore = false;
  tracker.isNative = false;
  tracker.get = '';
  tracker.site = '';

  // ## for a better test experience
  if( process.env.NODE_ENV === 'test'){
    tracker.stack = [ ];
    sites.forEach(function(frame){
      tracker.stack.push(frame+'');
    });

    tracker.site = function(pin){
      return sites[pin] || { };
    };
  } else {
    tracker.site = sites;
  }

  return tracker();
}
