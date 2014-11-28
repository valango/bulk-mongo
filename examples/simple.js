//
//  Simple driver executing the same basic ops as ../test/test.js does.
//  NB: On premature termination, it may leave the collection in 'admin'
//  database, so be sure to clean the mess manually.
//

'use strict';

var testable  = require('..')
  , mongodb   = require('mongodb')

  , mongoPath = 'mongodb://localhost:27017/test'
  , collName  = 'tmp_bulk_mongo_test'
  ;

var client = mongodb.MongoClient;

client.connect(mongoPath, function (e, db) {

  if (e) {
    throw e;
  }
  var drain = testable(db)(collName);

  drain.on('drain', function () {console.log('d.rain');});
  drain.on('prefinish', function () {console.log('d.prefinish');});
  drain.on('finish', function () {console.log('d.finish');});
  drain.on('done', function () {console.log('d.done');});

  drain.write({data: 1});
  drain.write({data: 2});

  drain.end(function (err) {
    if (err) {
      throw err;  // Should never happen
    }
    db.dropCollection(collName, function () {
      db.close();
    });
  });
});
