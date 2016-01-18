var spawnSync = require('child_process').spawnSync;
var extend = require('extend');

module.exports = patch;

function patch(opts){
  var orig = require;
  require = function(id){
    var ret;
    try {
      ret = orig(id);
    } catch (err) {
      if (!/Module version mismatch/.test(err.message)) throw err;

      var path = require.resolve(id);
      var match = /^(.*)\/node_modules\/([^\/]+)/.exec(path);
      path = match[0];

      console.error('Recompiling %s (%s)', id, path);

      var ps = spawnSync('node-gyp', [
        'rebuild',
        '--target=' + process.versions.node,
      ], {
        cwd: path,
        env: extend(process.env, {
          'HOME': process.env.HOME + "/.node-gyp"   
        })
      });
      if (ps.error) throw ps.error;
      console.error('Recompiled %s', id);
      delete orig.cache[id];
      return orig(id);
    }
    return ret;
  };
  require.cache = orig.cache;
  require.resolve = orig.resolve;
  return require;
}

