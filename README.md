
# require-recompile

  Patch `require()` to recompile a node module if it has been built for a different node version.

  Works with _electron_ as well!

## Usage

  Once, as the first line of your program, include this line:

```js
require('require-recompile')();
```

  That's it! Now all further `require()` calls, no matter how deep in your dependency tree,  will make sure a native module has been compiled for the right node version.

  To see it in action, install a native module, then switch to a different node version with a different abi, and see how it recompiles on the fly:

```bash
$ node example.js
Recompiling /Users/julian/dev/juliangruber/require-recompile/node_modules/bignum...Done!
```

## Build systems

At this moment, those build systems are supported

- `node-gyp`
- `prebuild`

## License

  MIT

