'use strict';

var should = require('should');
var tracker = require('../.');
var v8CallsiteMethods = require('v8-callsites/methods');

var caller;

module.exports = function(){

  it('should provide access to v8-callsites', function origin(){
    caller = tracker();

    should(caller.sites[0]).have.properties(
      v8CallsiteMethods
    );

    foo();
    function foo(){
      bar();
    }

    function bar(){
      caller = tracker(bar);
      should(caller.sites[0].getFunctionName()).be
        .equal('foo');
    }
  });

  it('should provide paths correctly', function (){

    function start(){
      caller = tracker(origin);
    }

    function origin(){
      start();
    }

    should(caller.path).be.equal(__filename);

  });
};
