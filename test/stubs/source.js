//  Readable object stream for testing purposes.

'use strict';

var stream = require('stream')
  ;

function objectSource(limit) {

  limit = limit || 1200;

  var source = new stream.Readable({objectMode: true})
    , count = 0
    ;

  source._read = function () {
    if (count >= limit) {
      return this.push(null);
    }
    var obj = {id: ++ count, text: 'means nothing'};
    this.push(obj);
  };

  return source;
}

module.exports = objectSource;
