/*!
 *  bulk-mongo
 *  Copyright (c) 2014  Villem Alango <villem.alango@gmail.com>
 *  MIT Licensed
 */

'use strict';

var _      = require('underscore')
  , stream = require('stream')
  , debug  = require('debug')('bulk-mongo')
  ;

var streamDefaults = {
      objectMode:    true,
      highWaterMark: 16
    }
  , BULK_SIZE      = 1000   //  Max number of inserts before bulk.execute()
  ;

/**
 * Return a factory function for a writable object stream into a collection.
 *
 * @param {Db} db
 * @returns {Function}
 */
module.exports = function create(db) {

  /**
   *  Create an instance of a writable object stream.
   *
   * @param {collection|string}  collection
   * @param {object}  options   - bulkSize defaults to 1000
   * @returns {stream.Writable}
   * @constructor
   */
  function factory(collection, options) {

    options = options || {};

    var output = new stream.Writable(_.defaults(options, streamDefaults))
      , coll = typeof collection === 'string' ?
          db.collection(collection) : collection
      , bulkSize, bulkOp, counter, init
      ;

    bulkSize = options.bulkSize;
    bulkSize = _.isUndefined(bulkSize) ? BULK_SIZE : ~ ~ bulkSize;

    if (bulkSize > 0) {
      debug('of ' + bulkSize + ' is created');
      counter = 0;
      init = function () {bulkOp = coll.initializeUnorderedBulkOp();};
      init();

      output.once('finish', function () {
        debug('is finishing');
        if (counter % bulkSize) {
          debug('writing ' + (counter % bulkSize) + ' bytes');
          bulkOp.execute(function (e, d) {
            if (e) {    // Could not create this error so far...
              if (! output.listeners('error')) {
                throw e;
              }
              output.emit('error', e);
            } else {
              output.emit('inserts', d);
            }
          });
        }
      });

      output._write = function (obj, enc, cb) {

        bulkOp.insert(obj);

        //  We must execute when bulkSize has been reached.
        if ((++ counter % bulkSize) === 0) {
          debug('writing ' + bulkSize + ' bytes');
          bulkOp.execute(function (e, d) {
            if (! e) {
              output.emit('inserts', d);
              try {
                init();
              } catch (err) {
                e = err;
              }
            }
            cb(e, d);
          });
        } else {
          cb(null);
        }
      };

    } else {
      debug('without bulk-ops is created ;-)');
      //  A non-bulk option is here for comparison only - have fun!
      output._write = function (obj, enc, cb) {
        coll.insert(obj, cb);
      };
    }

    return output;
  }

  return factory;
};
