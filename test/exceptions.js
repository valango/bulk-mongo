//
//  Test for MongoDb error conditions.
//  MongoDb is shielded by sinon stubs, so these are essentially module tests.
//  No actual writes to database will be performed.
//

'use strict';

var testable  = require('..')
  , stream    = require('stream')
  , mongodb   = require('mongodb')
  , sinon     = require('sinon')
  , should    = require('should')
  , source    = require('./stubs/source.js')

  , mongoPath = 'mongodb://localhost:27017'
  , collName  = 'tmp_bulk_mongo_test'
  , factory
  , db
  , coll
  , stubExecute
  , failStubInit
  ;

function do_before(cb) {
  mongodb.MongoClient.connect(mongoPath, function (e, d) {
    if (! e) {
      db = d;
      coll = db.collection(collName);
      factory = testable(db);
    }
    cb(e);
  });
}

var S_INIT_BULK_OP = 'initializeUnorderedBulkOp'
  , S_EXECUTE      = 'execute'
  ;

describe('UnorderedBulkOperation#execute() errors', function () {

  before(do_before);
  beforeEach(function () {
    var createBulk = coll[S_INIT_BULK_OP];
    stubExecute = sinon.stub();
    failStubInit = false;
    sinon.stub(coll, S_INIT_BULK_OP, function () {
      //yell('INIT');
      if (failStubInit) {
        throw new Error('Intentional');
      }
      var bulk = createBulk.apply(coll, arguments);
      sinon.stub(bulk, S_EXECUTE, stubExecute);
      return bulk;
    });
  });
  afterEach(function () {
    coll[S_INIT_BULK_OP].restore();
  });

  it('should handle a bulk init error', function (done) {
    //  S_INIT_BULK_OP must fail on the second call.
    //  S_EXECUTE should do nothing but run callback w/o error.
    test_piping_err(100, 10, 'onInit2', done);
  });

  it('should throw an error on crossing the size limit', function (done) {
    //  S_EXECUTE should do nothing but run callback with error.
    test_piping_err(100, 10, 'onSize', done);
  });

  it('should throw an error on finish', function (done) {
    //  S_EXECUTE should do nothing but run callback with error.
    test_piping_err(98, 100, 'onEnd', done);
  });
});

function test_piping_err(srcLen, dstLen, cond, done) {

  var errs = 0, onEnding = (cond === 'onEnd');

  var dst = factory(coll, {bulkSize: dstLen});
  var src = source(srcLen);

  dst.on('finish', function () {
    errs.should.be.equal(1);
    done();
  });
  dst.on('error', function (e) {
    ++ errs;
    dst._writableState.ending.should.be.equal(onEnding);
    onEnding || done();   // Error will block the ride, so we have to force.
  });
  dst.write({some: true});  // Make sure we have the 1st initialization done
  stubExecute.callsArgWith(0, cond.match('onInit') ? null : 'failure', null);
  failStubInit = (cond === 'onInit2');
  src.pipe(dst);
}
