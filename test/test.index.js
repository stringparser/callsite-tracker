'use strict';

var stracker = require('../.');
var origin = process.stdout.write;

process.stdout.write = (function (write){
  return function (data, enc, cb){
    var track = stracker(3);
    var buffer = '[' + track.parent + '] ';
    buffer += ' ' + track(0).module + ' ' + data;
    write.call(process.stdout, buffer, enc, cb);
  };
})(origin);

it('should return blau', function origin(){

  var tracker = stracker(5);

  tracker.stack.forEach(function(frame, index){
    var found = tracker(index);
    console.log(
      '('+(index+1)+') ' +
      found.parent, '->', found.module + '\n',
      frame + ' '
    );
    console.log('');
  });
});
