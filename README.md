
# require-recompile

  Path `require()` to recompile a node module if it has been built for a different node version.

## Usage

  Once, as the first line of your program, include this line:

```js
require('require-recompile')();
```

  That's it! Now all further `require()` calls, no matter how deep in your dependency tree,  will make sure a native module has been compiled for the right node version.

## License

  MIT

