
# require-rebuild

  Patch `require()` to rebuild a node module if it has been built for a different node version.

  Works with _electron_ as well and has been tested on OSX and Windows.

## Usage

  Once, as the first line of your program, include this line:

```js
require('require-rebuild')();
```

  That's it! Now all further `require()` calls, no matter how deep in your dependency tree,  will make sure a native module has been compiled for the right node version.

  To see it in action, install a native module, then switch to a different node version with a different abi, and see how it rebuilds on the fly:

```bash
$ node example.js
Recompiling node_modules/bignum
CXX(target) Release/obj.target/bignum/bignum.o
SOLINK_MODULE(target) Release/bignum.node
Done!
```

## Build systems

At this moment, those build systems are supported

- `node-gyp`
- `prebuild`

## License

  MIT

