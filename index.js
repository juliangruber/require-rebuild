var spawnSync = require('child_process').spawnSync;
var extend = require('extend');
var Module = require('module');
var resolve = require('path').resolve;
var dirname = require('path').dirname;
var join = require('path').join;
var relative = require('path').relative;

module.exports = patch;

function patch(opts){
  var load = Module._load;
  Module._load = function(request, parent){
    var ret;
    try {
      ret = load.call(Module, request, parent);
    } catch (err) {
      if (!/Module version mismatch/.test(err.message)) throw err;

      var path = resolve(dirname(parent.id), request);
      var match = /^(.*)\/node_modules\/([^\/]+)/.exec(path);
      path = match[0];

      console.error('Recompiling ' + relative(process.cwd(), path) + '...');

      // prebuild or node-gyp
      var pkg = require(join(path, 'package.json'));
      var reg = /prebuild/;
      var prebuild = pkg.scripts
        && (reg.test(pkg.scripts.install) || reg.test(pkg.scripts.prebuild));
      var ps;

      if (prebuild) {
        ps = spawnSync(join(__dirname, 'node_modules', '.bin', 'prebuild'), [
          '--install',
          '--abi=' + process.versions.modules
        ], {
          cwd: path,
          stdio: 'inherit'
        });
      } else {
        ps = spawnSync('node-gyp', [
          'rebuild',
          '--target=' + process.versions.node
        ], {
          cwd: path,
          env: extend(process.env, {
            'HOME': process.env.HOME + "/.node-gyp"   
          }),
          stdio: 'inherit'
        });
      }

      if (ps.error) throw ps.error;
      console.error('Done!');
      return load.call(Module, request, parent);
    }
    return ret;
  };
  return require;
}

