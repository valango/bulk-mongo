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
   * @todo: Need a separate event indicating all in sync after 'finish'.
   *
   * @param {collection|string}  collection
   * @param {object}  options   - bulkSize defaults to 1000
   * @returns {stream.Writable}
   * @constructor
   */
  function factory(collection, options) {

    options = options || {};

    var output  = new stream.Writable(_.defaults(options, streamDefaults))
      , coll    = typeof collection === 'string' ?
          db.collection(collection) :
          collection
      , counter = 0
      , bulkSize, bulkOp, init
      ;

    bulkSize = options.bulkSize;
    bulkSize = _.isUndefined(bulkSize) ? BULK_SIZE : bulkSize * 1;

    function post(event, arg) {
      process.nextTick(output.emit.bind(output, event, arg));
    }

    if (bulkSize > 0) {
      debug('of ' + bulkSize + ' is created');
      init = function () {
        bulkOp = coll.initializeUnorderedBulkOp();
      };
      init();

      output._write = function (obj, enc, cb) {

        bulkOp.insert(obj);

        //  We must execute when bulkSize has been reached.
        if (++counter % bulkSize === 0) {
          debug('writing ' + bulkSize + ' bytes');
          bulkOp.execute(function (e, d) {
            if (!e) {
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

    output.once('finish', function () {
      debug('is finishing');
      if (counter && counter % bulkSize) {
        debug('writing ' + counter % bulkSize + ' bytes');
        bulkOp.execute(function (e, d) {
          if (e) {    // Could not create this error so far...
            if (!output.listeners('error')) {
              throw e;
            }
            post('error', e);
          } else {
            post('inserts', d);
          }
          post('done');
        });
      } else {
        post('done');
      }
    });

    return output;
  }

  return factory;
};
