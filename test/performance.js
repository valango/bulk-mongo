//
'use strict';

var testable  = require('..')
  //, stream    = require('stream')
  , mongodb   = require('mongodb')
  //, should    = require('should')
  , source    = require('./stubs/source.js')

  , mongoPath = 'mongodb://localhost:27017/test'
  , collName  = 'tmp_bulk_mongo_test'
  , amount    = 100000
  , factory
  , db
  , coll
  , dst
  ;

function db_close() {
  if (db) {
    db.close();
    db = null;
  }
}

function db_clean(cb) {
  db.dropCollection(collName, function () {
    db_close();
    cb(); // Ignore 'ns not found' error if collection did not exist
  });
}

function do_before(cb) {
  mongodb.MongoClient.connect(mongoPath, function (e, d) {
    if (e) {
      return cb();
    }
    db = d;
    factory = testable(db);
    coll = db.collection(collName);
    coll.remove(function (e) {  // Clean junk, ignore errors
      if (e) {
        console.log(e);
      }
      cb();
    });
  });
}

function do_after(cb) {
  if (! db) {
    mongodb.MongoClient.connect(mongoPath, function (e, d) {
      if (! e) {
        db = d;
        return db_clean(cb);
      }
      cb(e);
    });
    return;
  }
  db_clean(cb);
}

describe('Measuring the speed of storing ' + amount + ' objects', function () {

  var t0, t1, t2;

  beforeEach(do_before);
  afterEach(do_after);

  it('writing in bulk mode', function (done) {
    dst = factory(coll);
    dst.on('done', function () {
      t1 = Date.now() - t0;
      done();
    });
    t0 = Date.now();
    source(amount).pipe(dst);
  });

  it('writing in non-bulk mode', function (done) {
    console.log('    ' + t1 + 'ms (' + Math.round(amount / t1, 3) +
                ' recs/ms)');
    console.log('      ok, please be patient now...');
    dst = factory(coll, {bulkSize: 0});
    dst.on('done', function () {
      t2 = Date.now() - t0;
      done();
    });
    t0 = Date.now();
    source(amount).pipe(dst);
  });

  it('... so the difference should be evident', function () {
    console.log('    ' + t2 + 'ms (' + Math.round(amount / t2, 3) +
                ' recs/ms)');
    t2.should.be.above(t1);
  });

});
