var spawnSync = require('child_process').spawnSync;
var extend = require('extend');
var Module = require('module');
var resolve = require('path').resolve;
var dirname = require('path').dirname;

module.exports = patch;

function patch(opts){
  var load = Module._load;
  Module._load = function(request, parent){
    var path = resolve(dirname(parent.id), request);

    var ret;
    try {
      ret = load.call(Module, request, parent);
    } catch (err) {
      if (!/Module version mismatch/.test(err.message)) throw err;

      var path = require.resolve(path);
      var match = /^(.*)\/node_modules\/([^\/]+)/.exec(path);
      path = match[0];

      process.stderr.write('Recompiling ' + path + '...');

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
      process.stderr.write('Done!\n');
      return load.call(Module, request, parent);
    }
    return ret;
  };
  return require;
}

