'use strict';

var path = require('path');
var type = require('utils-type');
var callsites = require('v8-callsites');

var wd = process.cwd();

module.exports = createTracker;

function createTracker(frames, origin){

  var sites = callsites(frames, origin || createTracker);

  function tracker(pin){

    pin = type(pin).integer > -1 ? pin : sites.length-1;

    var frame = sites[pin];
    if( !frame ){ return { }; }

    tracker.path = frame.getFileName().replace(/^native[ ]+/, '');

    tracker.extension = path.extname(tracker.path) || '';
    tracker.basename = path.basename(tracker.path, tracker.extension);

    tracker.location = tracker.basename + ':' +
      frame.getLineNumber() + ':' + frame.getColumnNumber();

    var noExt = tracker.path.replace(tracker.extension, '');
    if( tracker.basename ===  noExt ){
       // ^ path === 'file.js' || path === 'moduleName'
       //   can only be so for node core or V8 modules

      tracker.isNative = frame.isNative();
      tracker.module = tracker.basename;

      tracker.isCore = tracker.isNative ? false : true;
      tracker.scope = tracker.isNative ? 'V8' : 'node';

      return tracker;
    }

    var dir = tracker.path.split(path.sep);
    var index = dir.indexOf('node_modules');

    tracker.isCore = false;
    tracker.isNative = false;

    if( index < 0 ){
      // is your code

      tracker.module = path.relative(
        path.resolve(wd, '..'), wd
      );

      tracker.scope = path.relative(
        wd, path.dirname(tracker.path)
      ) || './.';

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
  tracker.location = '';
  tracker.isCore = false;
  tracker.isNative = false;
  tracker.basename = '';
  tracker.extension = '';

  tracker.site = sites;

  return tracker();
}
