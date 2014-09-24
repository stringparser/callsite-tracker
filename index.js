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

    var snapshot = frame+'';
    var location = snapshot.match(/\((.*)\)/);

    if( location === null ){ // Case 1
      location = snapshot;
    } else {                 // Case 2
      location = location[1];
    }

    snapshot
      .replace(/(.*)[ ]+\(.*\:(\d+)\:(\d+)\)|(.*)[ ]+\:(\d+)\:(\d+)/,
        function($0, $1, $2, $3, $4, $5, $6){
          tracker.at = $1 || $4;
          tracker.line = $2 || $5;
          tracker.column = $3 || $6;
        });

    /* ^ Refering to above ^

      Possible location formats:
      --------------------------
      https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi

      (1) Type.functionName [as methodName] (location)
      (1) new functionName (location)
      (1) Type.name (location)
      (1) eval at Foo.a (eval at Bar.z (myscript.js:10:3))
      (2) eval at position
      (2) native
      (2) unknown location
    */

    tracker.extension = path.extname(tracker.path) || null;
    tracker.basename = path.basename(
      tracker.path, tracker.extension
    );

    var noExt = tracker.path.replace(tracker.extension, '');
    if( tracker.basename ===  noExt ){
       // ^ path === 'file.js' or path === 'moduleName'
       //   can only be so for node core or V8 modules

      tracker.isNative = frame.isNative();
      tracker.scope = tracker.basename;

      tracker.isCore = tracker.isNative ? false : true;
      tracker.module = tracker.isNative ? 'V8' : 'node';

      return tracker;
    }

    var dir = tracker.path.split(path.sep);
    var index = dir.indexOf('node_modules');

    tracker.isCore = false;
    tracker.isNative = false;

    if( index < 0 ){
      // is your code

      tracker.scope = path.relative(
        wd, path.dirname(tracker.path)
      );

      tracker.module = path.relative(
        path.resolve(wd, '..'), wd
      );

      return tracker;
    }

    // its in `node_modules`
    tracker.scope = dir;
    tracker.module = dir[index+1];

    while( index > -1 ){
      tracker.scope = tracker.scope.slice(index+1);
      index = tracker.scope.indexOf('node_modules');
    }

    tracker.scope = dir.slice(
      dir.indexOf('node_modules') + 1, index
    ).join(path.sep);

    return tracker;
  }

  /*
   * define used properties up front
   * so they are nicely printed
   */

  tracker.module = '';
  tracker.scope = '';
  tracker.path = '';
  tracker.at = '';
  tracker.line = '';
  tracker.column = '';
  tracker.basename = '';
  tracker.extension = '';
  tracker.isCore = false;
  tracker.isNative = false;

  // ## for a better loggin experience
  tracker.stack = [ ];
  sites.forEach(function(frame){
    tracker.stack.push(frame+'');
  });

  tracker.site = sites;

  return tracker();
}
