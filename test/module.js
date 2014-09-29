'use strict';

var should = require('should');
var tracker = require('../.');
var path = require('path');

var caller;

module.exports = function (){

  it('at `it` cb => "mocha"', function origin(){
    caller = tracker(origin);
    should(caller.module).be.equal('mocha');
  });

  it('if not given => project dir', function(){

    caller = tracker();
    should(caller.module).be.equal(
      path.relative(
        path.resolve(process.cwd(), '..'),
        process.cwd()
      )
    );
  });
};
