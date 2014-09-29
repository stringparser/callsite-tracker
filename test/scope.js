'use strict';

var should = require('should');
var tracker = require('../.');

var caller;

module.exports = function(){

  it('at `it` cb => "mocha/lib"', function origin(){
    caller = tracker(origin);
    should(caller.scope).be.equal('mocha/lib');
  });

  it(' not given => the project itself', function(){

    caller = tracker();
    should(caller.scope).be.equal('./.');
  });
};
