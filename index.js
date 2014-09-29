'use strict';

var path = require('path');
var callsites = require('v8-callsites');

var wd = process.cwd();

function Tracker(frames, origin){

  if( !(this instanceof Tracker) ){
    return new Tracker(frames, origin);
  }

  this.module = '';
  this.scope = '';
  this.path = '';
  this.location = '';
  this.isCore = false;
  this.isNative = false;
  this.basename = '';
  this.extension = '';
  this.sites = callsites(frames, origin || Tracker);

  return this.get();
}

Tracker.prototype.get = function(pin){

  var frame = this.sites[pin] || this.sites[this.sites.length-1];
  if( !frame ){ return { }; }

  this.path = frame.getFileName();

  this.extension = path.extname(this.path) || '';
  this.basename = path.basename(this.path, this.extension);

  this.location = path.relative(wd, this.path) + ':' +
    frame.getLineNumber() + ':' + frame.getColumnNumber();

  var noExt = this.path.replace(this.extension, '');
  if( this.basename ===  noExt ){
     // ^ path === 'file.js' || path === 'moduleName'
     //   can only be so for node core or V8 modules

    this.isNative = frame.isNative();
    this.module = this.basename;

    this.isCore = this.isNative ? false : true;
    this.scope = this.isNative ? 'V8' : 'node';

    return this;
  }

  var dir = this.path.split(path.sep);
  var index = dir.indexOf('node_modules');

  this.isCore = false;
  this.isNative = false;

  if( index < 0 ){
    // is your code

    this.module = path.relative(
      path.resolve(wd, '..'), wd
    );

    this.scope = path.relative(
      wd, path.dirname(this.path)
    ) || './.';

    return this;
  }

  // its in `node_modules`
  this.module = dir[index+1];
  this.scope = dir;

  while( index > -1 ){
    this.scope = this.scope.slice(index+1);
    index = this.scope.indexOf('node_modules');
  }

  this.scope = dir.slice(
    dir.indexOf('node_modules') + 1, index
  ).join(path.sep);

  return this;
};

exports = module.exports = Tracker;
