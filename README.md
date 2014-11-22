# bulk-mongo

Writable object stream on top of MongoDb using bulk mode for speed.

## Mission

I published this project ___for my own purpose___ - it appears that
[Meteor](https://www.meteor.com/) in all it's awesomeness *does not* support
local `npm` packages and it probably never will.

I am not really familiar with MongoDb and it's drivers, so it took some effort
to make use of the bulk ops feature. So maybe it is useful to other folks around.

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
  non-bulk mode using ordinary MongoDb **connection#insert()** to be used. Other
  options are those eligible for [stream.Writable](http://nodejs.org/api/stream.html).
  * ***objectMode*** defaults to `true`.
  * ***highWaterMark*** defaults to `16`.

***Returns*** an instance of `stream.Writable`.

### Event:'inserts'

  * `result` is an instance of [BulkWriteResult](http://mongodb.github.io/node-mongodb-native/2.0/api/BulkWriteResult.html).
  It's members **nInserted** and **getInsertedIds()** can be particularly useful.

The event is being emitted every time after **UnorderedBulkOperation#execute()**
has been successful. In case of failure, **'error'** event is emitted.

### Links

See [http://nodejs.org/api/stream.html#stream_class_stream_writable]() for
other elements of consumer API.

MongoDb Js driver API description is here:
[http://mongodb.github.io/node-mongodb-native/2.0/api-docs]()


## License

MIT
