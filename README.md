# bulk-mongo

Writable object stream on top of MongoDb using bulk mode for speed.

## Status

I published this project ___for my own purpose___ - it appears that
[Meteor](https://www.meteor.com/) in all it's awesomeness does not support local
npm packages and it probably never will.

There will be probably some kind of _Aggregation Cursor_
support added in future, too.

## Example

```js
  var bulkDrain = require('bulk-mongo')(dbInstance)('test_collection);
  sourceStream.pipe(bulkDrain);
```

## License

MIT
