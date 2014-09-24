'use strict';

var should = require('should');
var tracker = require('../.');
var v8CallsiteMethods = require('../util/callsite-methods');

var track;

module.exports = function(){

  it('should provide access to v8-callsites', function origin(){
    track = tracker();

    should(track.site[0]).have.properties(
      v8CallsiteMethods
    );

    foo();
    function foo(){
      bar();
    }

    function bar(){
      track = tracker(bar);
      should(track.site[0].getFunctionName()).be
        .equal('foo');
    }
  });

  it('should have a path property', function(){

    track = tracker();
    should(track.path).be.equal(__filename);

  });
};
