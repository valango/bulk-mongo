//
//  This is a behavioral test, not a module test here.
//

'use strict';

var testable  = require('..')
  , stream    = require('stream')
  , mongodb   = require('mongodb')
  , should    = require('should')

  , mongoPath = 'mongodb://localhost:27017'
  , collName  = 'tmp_bulk_mongo_test'
  , db
  ;

describe('bulk-mongo', function () {

  var factory, drain;

  before(function (done) {

    mongodb.MongoClient.connect(mongoPath, function (e, d) {
      if (! e) {
        db = d;
      }
      done(e);
    });
  });

  after(function (done) {

    db.dropCollection(collName, function (e) {
      db.close();
      done(e);
    });
  });

  it('factory should be a function', function () {
    factory = testable(db);
    factory.should.be.type('function');
  });

  it('should return a writable stream', function () {
    drain = factory(collName);
    drain.should.be.instanceof(stream.Writable);
  });

  it('should receive objects', function () {
    drain.write({data: 1});
    drain.write({data: 2});
  });

  it('... but should not have written any yet', function (done) {
    var coll = db.collection(collName);
    coll.stats(function (err, stats) {
      if (err) {
        return done(err.errmsg.indexOf('not found.') > 0 ? null : err);
      }
      stats.count.should.be.equal(0);
      done();
    });
  });

  it('should end normally', function (done) {
    //  This is somewhat nasty hack here -
    // end() will actually emit 'finish', which, in turn will
    // launch asynchronous execution of bulk operation...
    drain.end(function () {setTimeout(done, 10);});
  });

  it('... and have written all the data out', function (done) {
    db.collection(collName, function (err, coll) {
      if (err) {
        return done(err);
      }
      coll.stats(function (err, stats) {
        if (! err) {
          stats.count.should.be.equal(2);
        }
        done(err);
      });
    });
  });

});
