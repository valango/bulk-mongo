/*!
 *  bulk-mongo
 *  Copyright (c) 2014  Villem Alango <villem.alango@gmail.com>
 *  MIT Licensed
 */

'use strict';

var _      = require('underscore')
  , stream = require('stream')
  ;

var streamDefaults = {
      objectMode:    true,
      highWaterMark: 16
    }
  ;

/**
 * Return factory function for a writable object stream into a collection.
 *
 * @param {Db} db
 * @returns {Function}
 */
module.exports = function create(db) {

  /**
   *  Create an instance of a writable object stream.
   *
   * @param {string}  collectionName
   * @param {object}  options   - bulkSize defaults to 1000
   * @returns {stream.Writable}
   * @constructor
   */
  function factory(collectionName, options) {

    options = options || {};

    var output = new stream.Writable(_.defaults(options, streamDefaults))
      , collection = db.collection(collectionName)
      , bulkSize, bulkOp, counter, init, state
      ;

    bulkSize = typeof (bulkSize = options.bulkSize) === 'undefined' && 1000;

    if (bulkSize > 0) {

      state = output._writableState;
      counter = 0;
      init = function () {bulkOp = collection.initializeUnorderedBulkOp();};
      init();

      output._write = function (obj, enc, cb) {

        bulkOp.insert(obj);

        //  We must execute when bulkSize has been reached or
        // when stream.end() is called. The 'ending' status flag will be set
        // in this case (see endWritable() in _stream_writable.js).
        if ((++ counter % bulkSize) === 0 || state.ending) {
          bulkOp.execute(function (e, r) {
            init();
            cb(e, r);
          });
        } else {
          cb(null);
        }
      };

    } else {
      //  A non-bulk option is here for comparison only - have fun!
      output._write = function (obj, enc, cb) {
        collection.insert(obj, cb);
      };
    }

    return output;
  }

  return factory;
};


