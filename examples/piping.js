'use strict';

var testable  = require('..')
  , mongodb   = require('mongodb')
  , source    = require('../test/stubs/source.js')

  , mongoPath = 'mongodb://localhost:27017/test'
  , collName  = 'tmp_bulk_mongo_test'
  ;

var client = mongodb.MongoClient;

client.connect(mongoPath, function (e, db) {

  if (e) {
    throw e;
  }
  var src, dst = testable(db)(collName);

  dst.on('prefinish', function () {console.log('d.prefinish');});
  dst.on('finish', function () {console.log('d.finish');});
  dst.on('inserts', function (d) {
    console.log('d.inserts', d.nInserted);
  });

  src = source(1555);
  src.on('end', function () {console.log('s.end');});
  src.on('close', function () {console.log('s.close');});
  dst.on('done', function () {
    console.log('d.done');
    src.unpipe();
    db.dropCollection(collName, function () {
      db.close();
    });
    process.exit(0);
  });
  src.pipe(dst);

});
