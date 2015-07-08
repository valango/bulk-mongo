# bulk-mongo

[![GitHub version](https://badge.fury.io/gh/valango%2Fbulk-mongo.svg)](http://badge.fury.io/gh/valango%2Fbulk-mongo)
[![Build Status](https://travis-ci.org/valango/bulk-mongo.svg?branch=master)](https://travis-ci.org/valango/bulk-mongo.svg)
[![Coverage Status](https://coveralls.io/repos/valango/bulk-mongo/badge.svg?branch=master&service=github)](https://coveralls.io/github/valango/bulk-mongo?branch=master)

Writable object stream on top of MongoDb using bulk mode for speed.

Depending on the nature of data, the gain in speed is about 8x

## Installation

```
  npm install bulk-mongo
```

## Usage

```js
  var bulkMongo = require('bulk-mongo');
  var factory_function = bulkMongo(dbInstance);
  var bulkWriter = factory_function(targetCollection);
  sourceStream.pipe(bulkWriter);
```

Of course the code above can be compressed into just two lines.

## API

### factory-function ( collection [, options] )
Is used to create actual stream instance for a particular database connection
it was created with. Factory arguments are:

***collection*** is a collection name (a string) or a MongoDb Collection
instance.

***options*** are explained below but usually they are not needed.

  * ***bulkSize*** defaults to `1000`. This means that bulk writes will be committed
  in chunks of 1000 records (documents). Setting this value to 1 or less forces
  *non-bulk mode* using ordinary MongoDb **connection#insert()** to be used. Other
  options are those eligible for [stream.Writable](http://nodejs.org/api/stream.html).
  * ***objectMode*** defaults to `true`.
  * ***highWaterMark*** defaults to `16`.

***Returns*** an instance of `stream.Writable`.

### Event:'done'

This event will follow the 'finish' event, indicating there is no more data to
be written into the database. This event is sent in *non-bulk mode* as well.

Because the asynchronous bulk write operation might be triggered by 'finish'
event, the 'finish' itself can not guarantee the data being synced.

### Event:'inserts'

  * `result` is an instance of [BulkWriteResult](http://mongodb.github.io/node-mongodb-native/2.0/api/BulkWriteResult.html).
  It's members **nInserted** and **getInsertedIds()** can be particularly useful.

The event is being emitted every time after **UnorderedBulkOperation#execute()**
has been successful. In case of failure, **'error'** event is emitted.

### Event:'done'

This event will follow the 'finish' event, indicating there is no more data to
be written into the database.

Because the asynchronous bulk write operation might be triggered by 'finish'
event, the 'finish' itself can not guarantee the data is synced.

## Notes

To run tests or examples, make sure you have mongodb running -
probably you'll need something like this:
```
  mongod > mongod.log & 
```
before running tests. It could be handy to run *mongod* in 
a separate terminal window.

## Links

See [http://nodejs.org/api/stream.html#stream_class_stream_writable]() for
other elements of consumer API.

MongoDb Js driver API description is here:
[http://mongodb.github.io/node-mongodb-native/1.4/]()


## License

MIT
