'use strict';

var should = require('should');
var tracker = require('../.');
var path = require('path');

var track;

module.exports = function(){

  it('at `it` cb => "mocha"', function origin(){
    track = tracker(origin);
    should(track.module).be.equal('mocha');
  });

  it('if not given => project dir', function(){

    track = tracker();
    should(track.module).be.equal(
      path.relative(
        path.resolve(process.cwd(), '..'),
        process.cwd()
      )
    );
  });
};
