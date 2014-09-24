'use strict';

var should = require('should');
var tracker = require('../.');
var path = require('path');

var track;

module.exports = function(){

  it('at `it` cb => "mocha/lib"', function origin(){
    track = tracker(origin);
    should(track.scope).be.equal('mocha/lib');
  });

  it(' not given => relative dirname to cwd', function(){

    track = tracker();
    should(track.scope).be.equal(
      path.relative(
        process.cwd(),
        __dirname
      )
    );
  });
};
